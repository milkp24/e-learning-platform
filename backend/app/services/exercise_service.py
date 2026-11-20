import uuid
import re
from datetime import datetime, timezone
from sqlalchemy.orm import selectinload
from app.extensions import db
from app.models.exercise import Exercise, ExerciseAttempt
from app.models.classroom import Lesson, Classroom
from app.models.gamification import UserXP, UserLevel, Level, Mission, MissionProgress
from app.models.progress import LessonProgress, LearningActivity
from app.models.user import User
from app.services.classroom_service import ClassroomService


class ExerciseServiceError(Exception):
    """Base exception for exercise service operations."""
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _to_utc(dt):
    """Ensure datetime is offset-aware UTC."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class ExerciseService:
    """
    ExerciseService: Central business logic service for Interactive Exercises (Module 8.1).
    Encapsulates exercise management, content/activity/checklist validation,
    attempt tracking, server-side time verification, scoring, duplicate XP prevention,
    and student progress synchronization.
    """

    # =========================================================================
    # 1. Validation Helpers
    # =========================================================================

    @staticmethod
    def validate_exercise_payload(data: dict, is_create: bool = True) -> dict:
        """Validate exercise metadata payload."""
        if not data or not isinstance(data, dict):
            raise ExerciseServiceError("ข้อมูลแบบฝึกหัดไม่ถูกต้อง (JSON body required)", 400)

        title = data.get("title")
        if is_create and (not title or not str(title).strip()):
            raise ExerciseServiceError("กรุณาระบุชื่อแบบฝึกหัด (title)", 400)
        if title and len(str(title).strip()) > 255:
            raise ExerciseServiceError("ชื่อแบบฝึกหัดต้องมีความยาวไม่เกิน 255 ตัวอักษร", 400)

        lesson_id = data.get("lesson_id")
        if is_create:
            if not lesson_id:
                raise ExerciseServiceError("กรุณาระบุบทเรียนที่เกี่ยวข้อง (lesson_id)", 400)
            try:
                lesson_uuid = uuid.UUID(str(lesson_id))
            except (ValueError, TypeError):
                raise ExerciseServiceError("รหัสบทเรียนไม่ถูกต้องตามรูปแบบ UUID", 400)
            lesson = db.session.get(Lesson, lesson_uuid)
            if not lesson:
                raise ExerciseServiceError("ไม่พบบทเรียนที่ระบุในระบบ", 404)

        total_score = data.get("total_score")
        if total_score is not None:
            try:
                score_val = float(total_score)
                if score_val < 0:
                    raise ValueError()
            except (ValueError, TypeError):
                raise ExerciseServiceError("คะแนนเต็มต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0", 400)

        xp_reward = data.get("xp_reward")
        if xp_reward is not None:
            try:
                xp_val = int(xp_reward)
                if xp_val < 0:
                    raise ValueError()
            except (ValueError, TypeError):
                raise ExerciseServiceError("แต้ม XP ต้องเป็นจำนวนเต็มที่มากกว่าหรือเท่ากับ 0", 400)

        time_limit = data.get("time_limit")
        if time_limit is not None:
            try:
                time_val = int(time_limit)
                if time_val < 0:
                    raise ValueError()
            except (ValueError, TypeError):
                raise ExerciseServiceError("เวลาทำแบบฝึกหัดต้องเป็นจำนวนเต็มนาทีที่มากกว่าหรือเท่ากับ 0", 400)

        max_attempts = data.get("max_attempts")
        if max_attempts is not None and max_attempts != "":
            try:
                attempts_val = int(max_attempts)
                if attempts_val < 1:
                    raise ValueError()
            except (ValueError, TypeError):
                raise ExerciseServiceError("จำนวนครั้งที่อนุญาตต้องเป็นจำนวนเต็มตั้งแต่ 1 ครั้งขึ้นไป หรือเว้นว่างหากไม่จำกัด", 400)

        status = data.get("status")
        if status is not None and status not in ["published", "draft", "archived"]:
            raise ExerciseServiceError("สถานะแบบฝึกหัดต้องเป็น 'published', 'draft' หรือ 'archived'", 400)

        return data

    @staticmethod
    def validate_content_item(item: dict) -> dict:
        """Validate an individual content element in an exercise."""
        if not item or not isinstance(item, dict):
            raise ExerciseServiceError("ข้อมูลเนื้อหาไม่ถูกต้อง", 400)

        content_type = str(item.get("type", "")).strip().lower()
        allowed_types = ["text", "image", "video", "code", "code_example"]
        if content_type not in allowed_types:
            raise ExerciseServiceError(f"ประเภทเนื้อหาไม่ถูกต้อง รองรับเฉพาะ: {', '.join(allowed_types)}", 400)

        content_data = item.get("content_data") or item.get("content") or ""
        if content_type == "text" and not str(content_data).strip():
            raise ExerciseServiceError("กรุณากรอกข้อความเนื้อหา", 400)
        if content_type in ["image", "video"] and not str(content_data).strip():
            raise ExerciseServiceError("กรุณาระบุ URL ของรูปภาพหรือวิดีโอ", 400)

        return {
            "id": str(item.get("id") or uuid.uuid4()),
            "type": content_type,
            "title": str(item.get("title") or item.get("caption") or "").strip(),
            "caption": str(item.get("caption") or "").strip(),
            "content_data": str(content_data).strip(),
            "language": str(item.get("language") or "javascript").strip().lower(),
            "order": int(item.get("order") or 1)
        }

    @staticmethod
    def validate_activity_item(item: dict) -> dict:
        """Validate an individual interactive activity element."""
        if not item or not isinstance(item, dict):
            raise ExerciseServiceError("ข้อมูลกิจกรรมไม่ถูกต้อง", 400)

        act_type = str(item.get("type", "")).strip().lower()
        allowed_types = ["fill_code", "debug_code", "mission"]
        if act_type not in allowed_types:
            raise ExerciseServiceError(f"ประเภทกิจกรรมไม่ถูกต้อง รองรับเฉพาะ: {', '.join(allowed_types)}", 400)

        title = str(item.get("title") or "").strip()
        if not title:
            raise ExerciseServiceError("กรุณาระบุชื่อกิจกรรม", 400)

        try:
            score = float(item.get("score", 0))
            if score < 0:
                raise ValueError()
        except (ValueError, TypeError):
            raise ExerciseServiceError("คะแนนของกิจกรรมต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0", 400)

        instruction = str(item.get("instruction") or item.get("instructions") or "").strip()

        validated = {
            "id": str(item.get("id") or uuid.uuid4()),
            "type": act_type,
            "title": title,
            "instruction": instruction,
            "score": score,
            "language": str(item.get("language") or "javascript").strip().lower(),
            "hint": str(item.get("hint") or "").strip(),
            "explanation": str(item.get("explanation") or "").strip(),
            "order": int(item.get("order") or 1)
        }

        if act_type == "fill_code":
            template = str(item.get("code_template") or "").strip()
            correct = item.get("correct_answer")
            if not template:
                raise ExerciseServiceError("กรุณาระบุ Template โค้ดสำหรับกิจกรรมเติมโค้ด", 400)
            if correct is None or (isinstance(correct, str) and not correct.strip()):
                raise ExerciseServiceError("กรุณาระบุคำตอบที่ถูกต้องสำหรับกิจกรรมเติมโค้ด", 400)
            validated["code_template"] = template
            validated["correct_answer"] = [str(a).strip() for a in correct] if isinstance(correct, list) else str(correct).strip()

        elif act_type == "debug_code":
            initial_code = str(item.get("initial_code") or "").strip()
            if not initial_code:
                raise ExerciseServiceError("กรุณาระบุโค้ดเริ่มต้นที่ต้องการให้ผู้เรียนดีบัก", 400)
            validated["initial_code"] = initial_code
            validated["expected_output"] = str(item.get("expected_output") or "").strip()
            validated["correct_code"] = str(item.get("correct_code") or "").strip()
            validated["validation_rule"] = str(item.get("validation_rule") or "").strip()

        elif act_type == "mission":
            validated["mission_type"] = str(item.get("mission_type") or "project").strip()
            validated["requirements"] = item.get("requirements") or []

        return validated

    @staticmethod
    def validate_checklist_item(item: dict) -> dict:
        """Validate an individual checklist item."""
        if not item or not isinstance(item, dict):
            raise ExerciseServiceError("ข้อมูล Checklist ไม่ถูกต้อง", 400)

        title = str(item.get("title") or "").strip()
        if not title:
            raise ExerciseServiceError("กรุณาระบุชื่อรายการ Checklist", 400)

        try:
            score = float(item.get("score", 0))
            if score < 0:
                raise ValueError()
        except (ValueError, TypeError):
            raise ExerciseServiceError("คะแนนของ Checklist ต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0", 400)

        return {
            "id": str(item.get("id") or uuid.uuid4()),
            "activity_id": str(item.get("activity_id") or "").strip() or None,
            "title": title,
            "description": str(item.get("description") or "").strip(),
            "score": score,
            "order": int(item.get("order") or 1),
            "required": bool(item.get("required", False))
        }

    # =========================================================================
    # 2. Permission and Access Controls
    # =========================================================================

    @staticmethod
    def check_manage_permission(exercise: Exercise, user: User) -> bool:
        """Check if user can manage this exercise (Admin, Super Admin, or Course Instructor Owner)."""
        if not user or not exercise:
            return False
        if user.has_role("admin") or user.has_role("super_admin"):
            return True
        if user.has_role("instructor"):
            # Check if instructor owns the lesson/course
            lesson = exercise.lesson
            if lesson and lesson.classroom:
                return str(lesson.classroom.instructor_id) == str(user.user_id)
            if lesson and lesson.chapter and lesson.chapter.course:
                return str(lesson.chapter.course.instructor_id) == str(user.user_id)
        return False

    @staticmethod
    def check_view_permission(exercise: Exercise, user: User) -> bool:
        """Check if user can view/take this exercise."""
        if not user or not exercise:
            return False
        if user.has_role("admin") or user.has_role("super_admin"):
            return True
        lesson = exercise.lesson
        classroom = lesson.classroom if (lesson and lesson.classroom) else (lesson.chapter.course if (lesson and lesson.chapter) else None)
        if not classroom:
            return True
        if str(classroom.instructor_id) == str(user.user_id):
            return True
        if classroom.has_member(user.user_id):
            return True
        return False

    # =========================================================================
    # 3. Exercise CRUD
    # =========================================================================

    @staticmethod
    def get_exercise_classroom(exercise: Exercise) -> Classroom | None:
        """คอร์สที่แบบฝึกหัดนี้สังกัด (ผ่าน Lesson ตรง หรือผ่าน Chapter)"""
        lesson = exercise.lesson if exercise else None
        if not lesson:
            return None
        if lesson.classroom:
            return lesson.classroom
        if lesson.chapter and lesson.chapter.course:
            return lesson.chapter.course
        return None

    @staticmethod
    def strip_solutions(data: dict) -> dict:
        """ซ่อนเฉลย (correct_answer, correct_code) ก่อนส่งให้คนที่ไม่ใช่ผู้จัดการแบบฝึกหัด"""
        cleaned = []
        for act in (data.get("activities_data") or []):
            clean_act = dict(act)
            clean_act.pop("correct_answer", None)
            clean_act.pop("correct_code", None)
            cleaned.append(clean_act)
        data["activities_data"] = cleaned
        return data

    @classmethod
    def list_exercises(cls, lesson_id: str | None = None, classroom_id: str | None = None, user: User | None = None) -> list:
        """Query exercises filtered by lesson or classroom.
        ข้อ 14: ผู้จัดการ (Admin หรืออาจารย์เจ้าของคอร์ส) เห็นทุกสถานะพร้อมเฉลย
        คนอื่น (Guest, ผู้เรียน, อาจารย์ที่ไม่ใช่เจ้าของ) เห็นเฉพาะแบบฝึกหัดที่ published
        ในคอร์สที่ตัวเองมองเห็นได้ และไม่มีเฉลย
        """
        query = Exercise.query
        if lesson_id:
            try:
                l_uuid = uuid.UUID(str(lesson_id))
                query = query.filter_by(lesson_id=l_uuid)
            except (ValueError, TypeError):
                return []
        elif classroom_id:
            try:
                c_uuid = uuid.UUID(str(classroom_id))
                query = query.join(Lesson).filter(Lesson.classroom_id == c_uuid)
            except (ValueError, TypeError):
                return []

        results = []
        for ex in query.order_by(Exercise.created_at.desc()).all():
            if cls.check_manage_permission(ex, user):
                results.append(ex.to_dict())
                continue
            if ex.status != "published":
                continue
            classroom = cls.get_exercise_classroom(ex)
            if classroom and not ClassroomService.can_view_classroom(classroom, user):
                continue
            results.append(cls.strip_solutions(ex.to_dict()))
        return results

    @classmethod
    def get_exercise_by_id(cls, exercise_id: str, user: User | None = None, sanitize_for_student: bool = True) -> dict:
        """Retrieve full details of an exercise."""
        try:
            ex_uuid = uuid.UUID(str(exercise_id))
        except (ValueError, TypeError):
            raise ExerciseServiceError("รูปแบบรหัสแบบฝึกหัดไม่ถูกต้อง", 400)

        exercise = db.session.get(Exercise, ex_uuid)
        if not exercise:
            raise ExerciseServiceError("ไม่พบแบบฝึกหัดที่ระบุในระบบ", 404)

        # ข้อ 14: Guest ต้องเข้าสู่ระบบก่อน (เดิมข้ามการตรวจสิทธิ์และได้เฉลยไปด้วย)
        if not user:
            raise ExerciseServiceError("กรุณาเข้าสู่ระบบก่อนเปิดแบบฝึกหัด", 401)
        if not cls.check_view_permission(exercise, user):
            raise ExerciseServiceError("คุณไม่มีสิทธิ์เข้าถึงแบบฝึกหัดนี้ (ต้องเป็นสมาชิกที่ลงทะเบียนเรียน)", 403)
        # แบบฝึกหัดที่ยังไม่เผยแพร่ ผู้เรียนต้องมองไม่เห็น
        if exercise.status != "published" and not cls.check_manage_permission(exercise, user):
            raise ExerciseServiceError("ไม่พบแบบฝึกหัดที่ระบุในระบบ", 404)

        data = exercise.to_dict()

        # Student status & attempts info
        if user:
            attempts_query = ExerciseAttempt.query.filter_by(
                exercise_id=exercise.exercise_id,
                user_id=user.user_id
            ).order_by(ExerciseAttempt.started_at.desc())
            attempts = attempts_query.all()
            completed_attempts = [a for a in attempts if a.status in ["submitted", "completed", "expired"]]
            attempts_count = len(completed_attempts)
            max_att = exercise.max_attempts
            remaining = (max_att - attempts_count) if (max_att is not None) else None
            can_attempt = (remaining is None or remaining > 0)

            data["attempts_count"] = attempts_count
            data["remaining_attempts"] = remaining
            data["can_attempt"] = can_attempt

            # If user has an in_progress attempt
            active_attempt = next((a for a in attempts if a.status == "in_progress"), None)
            if active_attempt:
                data["active_attempt"] = active_attempt.to_dict()

            # Sanitize solutions if student and attempting
            is_staff = user.has_role("admin") or user.has_role("super_admin") or (
                user.has_role("instructor") and cls.check_manage_permission(exercise, user)
            )
            # ซ่อนเฉลยเสมอสำหรับคนที่ไม่ใช่ผู้จัดการ (เดิมผู้เรียนส่ง ?mode=manage มาแล้วได้เฉลย)
            if not is_staff:
                cls.strip_solutions(data)

        return data

    @classmethod
    def create_exercise(cls, data: dict, user: User) -> dict:
        """Create a new exercise."""
        validated = cls.validate_exercise_payload(data, is_create=True)
        lesson_uuid = uuid.UUID(str(validated["lesson_id"]))
        lesson = db.session.get(Lesson, lesson_uuid)

        # Check instructor permissions on the lesson
        if not (user.has_role("admin") or user.has_role("super_admin")):
            classroom = lesson.classroom if lesson.classroom else (lesson.chapter.course if lesson.chapter else None)
            if not classroom or str(classroom.instructor_id) != str(user.user_id):
                raise ExerciseServiceError("คุณไม่มีสิทธิ์สร้างแบบฝึกหัดในบทเรียนนี้", 403)

        # Validate nested contents, activities, checklists if provided
        contents_data = [cls.validate_content_item(c) for c in (data.get("contents_data") or [])]
        activities_data = [cls.validate_activity_item(a) for a in (data.get("activities_data") or [])]
        checklists_data = [cls.validate_checklist_item(ch) for ch in (data.get("checklists_data") or [])]

        total_score = float(validated.get("total_score") or 100.0)
        xp_reward = int(validated.get("xp_reward") or 50)
        time_limit = int(validated.get("time_limit") or 0)
        max_attempts = int(validated["max_attempts"]) if validated.get("max_attempts") else None
        status = validated.get("status") or "published"

        exercise = Exercise(
            lesson_id=lesson_uuid,
            title=str(validated["title"]).strip(),
            instructions=str(validated.get("instructions") or "").strip() or None,
            exercise_type=str(validated.get("exercise_type") or "practice").strip(),
            total_score=total_score,
            xp_reward=xp_reward,
            time_limit=time_limit,
            max_attempts=max_attempts,
            status=status,
            contents_data=contents_data,
            activities_data=activities_data,
            checklists_data=checklists_data
        )

        db.session.add(exercise)
        db.session.commit()
        return exercise.to_dict()

    @classmethod
    def update_exercise(cls, exercise_id: str, data: dict, user: User) -> dict:
        """Update existing exercise configuration and items."""
        try:
            ex_uuid = uuid.UUID(str(exercise_id))
        except (ValueError, TypeError):
            raise ExerciseServiceError("รูปแบบรหัสแบบฝึกหัดไม่ถูกต้อง", 400)

        exercise = db.session.get(Exercise, ex_uuid)
        if not exercise:
            raise ExerciseServiceError("ไม่พบแบบฝึกหัดที่ระบุในระบบ", 404)

        if not cls.check_manage_permission(exercise, user):
            raise ExerciseServiceError("คุณไม่มีสิทธิ์แก้ไขแบบฝึกหัดนี้", 403)

        validated = cls.validate_exercise_payload(data, is_create=False)

        if "title" in validated and validated["title"]:
            exercise.title = str(validated["title"]).strip()
        if "instructions" in validated:
            exercise.instructions = str(validated["instructions"]).strip() if validated["instructions"] else None
        if "exercise_type" in validated and validated["exercise_type"]:
            exercise.exercise_type = str(validated["exercise_type"]).strip()
        if "total_score" in validated and validated["total_score"] is not None:
            exercise.total_score = float(validated["total_score"])
        if "xp_reward" in validated and validated["xp_reward"] is not None:
            exercise.xp_reward = int(validated["xp_reward"])
        if "time_limit" in validated:
            exercise.time_limit = int(validated["time_limit"]) if validated["time_limit"] is not None else 0
        if "max_attempts" in validated:
            exercise.max_attempts = int(validated["max_attempts"]) if validated["max_attempts"] else None
        if "status" in validated and validated["status"]:
            exercise.status = validated["status"]

        if "contents_data" in data and isinstance(data["contents_data"], list):
            exercise.contents_data = [cls.validate_content_item(c) for c in data["contents_data"]]
        if "activities_data" in data and isinstance(data["activities_data"], list):
            exercise.activities_data = [cls.validate_activity_item(a) for a in data["activities_data"]]
        if "checklists_data" in data and isinstance(data["checklists_data"], list):
            exercise.checklists_data = [cls.validate_checklist_item(ch) for ch in data["checklists_data"]]

        exercise.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        return exercise.to_dict()

    @classmethod
    def delete_exercise(cls, exercise_id: str, user: User) -> bool:
        """Delete an exercise and related attempts."""
        try:
            ex_uuid = uuid.UUID(str(exercise_id))
        except (ValueError, TypeError):
            raise ExerciseServiceError("รูปแบบรหัสแบบฝึกหัดไม่ถูกต้อง", 400)

        exercise = db.session.get(Exercise, ex_uuid)
        if not exercise:
            raise ExerciseServiceError("ไม่พบแบบฝึกหัดที่ระบุในระบบ", 404)

        if not cls.check_manage_permission(exercise, user):
            raise ExerciseServiceError("คุณไม่มีสิทธิ์ลบแบบฝึกหัดนี้", 403)

        db.session.delete(exercise)
        db.session.commit()
        return True

    # =========================================================================
    # 4. Content Sub-resource Endpoints Logic
    # =========================================================================

    @classmethod
    def add_content(cls, exercise_id: str, item_data: dict, user: User) -> dict:
        """Add a content element to an exercise."""
        ex_dict = cls.get_exercise_by_id(exercise_id, user=user, sanitize_for_student=False)
        exercise = db.session.get(Exercise, uuid.UUID(str(exercise_id)))
        if not cls.check_manage_permission(exercise, user):
            raise ExerciseServiceError("คุณไม่มีสิทธิ์จัดการเนื้อหาของแบบฝึกหัดนี้", 403)

        new_item = cls.validate_content_item(item_data)
        current = list(exercise.contents_data or [])
        current.append(new_item)
        exercise.contents_data = current
        exercise.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        return new_item

    @classmethod
    def update_content(cls, exercise_id: str, content_id: str, item_data: dict, user: User) -> dict:
        """Update a specific content element in an exercise."""
        exercise = db.session.get(Exercise, uuid.UUID(str(exercise_id)))
        if not exercise:
            raise ExerciseServiceError("ไม่พบแบบฝึกหัดที่ระบุ", 404)
        if not cls.check_manage_permission(exercise, user):
            raise ExerciseServiceError("คุณไม่มีสิทธิ์จัดการเนื้อหาของแบบฝึกหัดนี้", 403)

        current = list(exercise.contents_data or [])
        found_idx = next((i for i, c in enumerate(current) if str(c.get("id")) == str(content_id)), None)
        if found_idx is None:
            raise ExerciseServiceError("ไม่พบรายการเนื้อหาที่ต้องการแก้ไข", 404)

        item_data["id"] = content_id
        updated_item = cls.validate_content_item(item_data)
        current[found_idx] = updated_item
        exercise.contents_data = current
        exercise.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        return updated_item

    @classmethod
    def delete_content(cls, exercise_id: str, content_id: str, user: User) -> bool:
        """Remove a content element from an exercise."""
        exercise = db.session.get(Exercise, uuid.UUID(str(exercise_id)))
        if not exercise:
            raise ExerciseServiceError("ไม่พบแบบฝึกหัดที่ระบุ", 404)
        if not cls.check_manage_permission(exercise, user):
            raise ExerciseServiceError("คุณไม่มีสิทธิ์จัดการเนื้อหาของแบบฝึกหัดนี้", 403)

        current = list(exercise.contents_data or [])
        new_list = [c for c in current if str(c.get("id")) != str(content_id)]
        if len(new_list) == len(current):
            raise ExerciseServiceError("ไม่พบรายการเนื้อหาที่ต้องการลบ", 404)

        exercise.contents_data = new_list
        exercise.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        return True

    # =========================================================================
    # 5. Activity Sub-resource Endpoints Logic
    # =========================================================================

    @classmethod
    def add_activity(cls, exercise_id: str, act_data: dict, user: User) -> dict:
        """Add an activity to an exercise."""
        exercise = db.session.get(Exercise, uuid.UUID(str(exercise_id)))
        if not exercise:
            raise ExerciseServiceError("ไม่พบแบบฝึกหัดที่ระบุ", 404)
        if not cls.check_manage_permission(exercise, user):
            raise ExerciseServiceError("คุณไม่มีสิทธิ์จัดการกิจกรรมของแบบฝึกหัดนี้", 403)

        new_act = cls.validate_activity_item(act_data)
        current = list(exercise.activities_data or [])
        current.append(new_act)
        exercise.activities_data = current
        exercise.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        return new_act

    @classmethod
    def update_activity(cls, exercise_id: str, activity_id: str, act_data: dict, user: User) -> dict:
        """Update an activity in an exercise."""
        exercise = db.session.get(Exercise, uuid.UUID(str(exercise_id)))
        if not exercise:
            raise ExerciseServiceError("ไม่พบแบบฝึกหัดที่ระบุ", 404)
        if not cls.check_manage_permission(exercise, user):
            raise ExerciseServiceError("คุณไม่มีสิทธิ์จัดการกิจกรรมของแบบฝึกหัดนี้", 403)

        current = list(exercise.activities_data or [])
        found_idx = next((i for i, a in enumerate(current) if str(a.get("id")) == str(activity_id)), None)
        if found_idx is None:
            raise ExerciseServiceError("ไม่พบกิจกรรมที่ต้องการแก้ไข", 404)

        act_data["id"] = activity_id
        updated_act = cls.validate_activity_item(act_data)
        current[found_idx] = updated_act
        exercise.activities_data = current
        exercise.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        return updated_act

    @classmethod
    def delete_activity(cls, exercise_id: str, activity_id: str, user: User) -> bool:
        """Delete an activity from an exercise."""
        exercise = db.session.get(Exercise, uuid.UUID(str(exercise_id)))
        if not exercise:
            raise ExerciseServiceError("ไม่พบแบบฝึกหัดที่ระบุ", 404)
        if not cls.check_manage_permission(exercise, user):
            raise ExerciseServiceError("คุณไม่มีสิทธิ์จัดการกิจกรรมของแบบฝึกหัดนี้", 403)

        current = list(exercise.activities_data or [])
        new_list = [a for a in current if str(a.get("id")) != str(activity_id)]
        if len(new_list) == len(current):
            raise ExerciseServiceError("ไม่พบกิจกรรมที่ต้องการลบ", 404)

        exercise.activities_data = new_list
        exercise.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        return True

    # =========================================================================
    # 6. Checklist Sub-resource Endpoints Logic
    # =========================================================================

    @classmethod
    def add_checklist(cls, exercise_id: str, item_data: dict, user: User) -> dict:
        """Add a checklist item to an exercise."""
        exercise = db.session.get(Exercise, uuid.UUID(str(exercise_id)))
        if not exercise:
            raise ExerciseServiceError("ไม่พบแบบฝึกหัดที่ระบุ", 404)
        if not cls.check_manage_permission(exercise, user):
            raise ExerciseServiceError("คุณไม่มีสิทธิ์จัดการ Checklist ของแบบฝึกหัดนี้", 403)

        new_ch = cls.validate_checklist_item(item_data)
        current = list(exercise.checklists_data or [])
        current.append(new_ch)
        exercise.checklists_data = current
        exercise.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        return new_ch

    @classmethod
    def update_checklist(cls, exercise_id: str, checklist_id: str, item_data: dict, user: User) -> dict:
        """Update a checklist item in an exercise."""
        exercise = db.session.get(Exercise, uuid.UUID(str(exercise_id)))
        if not exercise:
            raise ExerciseServiceError("ไม่พบแบบฝึกหัดที่ระบุ", 404)
        if not cls.check_manage_permission(exercise, user):
            raise ExerciseServiceError("คุณไม่มีสิทธิ์จัดการ Checklist ของแบบฝึกหัดนี้", 403)

        current = list(exercise.checklists_data or [])
        found_idx = next((i for i, ch in enumerate(current) if str(ch.get("id")) == str(checklist_id)), None)
        if found_idx is None:
            raise ExerciseServiceError("ไม่พบรายการ Checklist ที่ต้องการแก้ไข", 404)

        item_data["id"] = checklist_id
        updated_ch = cls.validate_checklist_item(item_data)
        current[found_idx] = updated_ch
        exercise.checklists_data = current
        exercise.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        return updated_ch

    @classmethod
    def delete_checklist(cls, exercise_id: str, checklist_id: str, user: User) -> bool:
        """Remove a checklist item from an exercise."""
        exercise = db.session.get(Exercise, uuid.UUID(str(exercise_id)))
        if not exercise:
            raise ExerciseServiceError("ไม่พบแบบฝึกหัดที่ระบุ", 404)
        if not cls.check_manage_permission(exercise, user):
            raise ExerciseServiceError("คุณไม่มีสิทธิ์จัดการ Checklist ของแบบฝึกหัดนี้", 403)

        current = list(exercise.checklists_data or [])
        new_list = [ch for ch in current if str(ch.get("id")) != str(checklist_id)]
        if len(new_list) == len(current):
            raise ExerciseServiceError("ไม่พบรายการ Checklist ที่ต้องการลบ", 404)

        exercise.checklists_data = new_list
        exercise.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        return True

    # =========================================================================
    # 7. Student Attempt & Submission Flow
    # =========================================================================

    @classmethod
    def start_attempt(cls, exercise_id: str, user: User) -> dict:
        """
        Start an exercise attempt for a student.
        Enforces enrollment check, max attempts limitation, and in-progress session resuming.
        """
        try:
            ex_uuid = uuid.UUID(str(exercise_id))
        except (ValueError, TypeError):
            raise ExerciseServiceError("รูปแบบรหัสแบบฝึกหัดไม่ถูกต้อง", 400)

        exercise = db.session.get(Exercise, ex_uuid)
        if not exercise:
            raise ExerciseServiceError("ไม่พบแบบฝึกหัดที่ระบุในระบบ", 404)

        if not cls.check_view_permission(exercise, user):
            raise ExerciseServiceError("คุณต้องลงทะเบียนเรียนในหลักสูตรนี้ก่อนจึงจะสามารถทำแบบฝึกหัดได้", 403)

        if exercise.status != "published" and not cls.check_manage_permission(exercise, user):
            raise ExerciseServiceError("แบบฝึกหัดนี้ยังไม่เปิดให้เข้าทำ", 400)

        # Check existing attempts
        attempts = ExerciseAttempt.query.filter_by(
            exercise_id=exercise.exercise_id,
            user_id=user.user_id
        ).order_by(ExerciseAttempt.started_at.desc()).all()

        completed_count = len([a for a in attempts if a.status in ["submitted", "completed", "expired"]])

        # If student already has an active in_progress attempt
        active_attempt = next((a for a in attempts if a.status == "in_progress"), None)
        if active_attempt:
            # Check if time expired
            if exercise.time_limit and exercise.time_limit > 0:
                elapsed_seconds = int((datetime.now(timezone.utc) - _to_utc(active_attempt.started_at)).total_seconds())
                limit_seconds = exercise.time_limit * 60
                if elapsed_seconds > (limit_seconds + 30):
                    # Expire it and proceed to check new attempt quota
                    active_attempt.status = "expired"
                    active_attempt.submitted_at = datetime.now(timezone.utc)
                    active_attempt.time_spent = elapsed_seconds
                    db.session.commit()
                    completed_count += 1
                else:
                    # Return current active attempt
                    result = active_attempt.to_dict()
                    result["time_left_seconds"] = max(0, limit_seconds - elapsed_seconds)
                    return result

        # Check max attempts limit
        if exercise.max_attempts is not None and completed_count >= exercise.max_attempts:
            raise ExerciseServiceError(
                f"คุณใช้สิทธิ์ทำแบบฝึกหัดครบกำหนดแล้ว ({completed_count}/{exercise.max_attempts} ครั้ง)",
                403
            )

        new_attempt = ExerciseAttempt(
            exercise_id=exercise.exercise_id,
            user_id=user.user_id,
            status="in_progress",
            score=None,
            time_spent=0,
            xp_earned=0,
            answers_data={},
            feedback_data={},
            started_at=datetime.now(timezone.utc)
        )

        db.session.add(new_attempt)
        db.session.commit()

        attempt_dict = new_attempt.to_dict()
        if exercise.time_limit and exercise.time_limit > 0:
            attempt_dict["time_left_seconds"] = exercise.time_limit * 60
        else:
            attempt_dict["time_left_seconds"] = None
        return attempt_dict

    @classmethod
    def submit_attempt(cls, exercise_id: str, data: dict, user: User) -> dict:
        """
        Evaluate and submit student exercise attempt.
        Calculates score across Activities and Checklist, checks time limit,
        awards single-time XP, and updates progress records.
        """
        try:
            ex_uuid = uuid.UUID(str(exercise_id))
        except (ValueError, TypeError):
            raise ExerciseServiceError("รูปแบบรหัสแบบฝึกหัดไม่ถูกต้อง", 400)

        exercise = db.session.get(Exercise, ex_uuid)
        if not exercise:
            raise ExerciseServiceError("ไม่พบแบบฝึกหัดที่ระบุในระบบ", 404)

        # Locate active in_progress attempt
        attempt = ExerciseAttempt.query.filter_by(
            exercise_id=exercise.exercise_id,
            user_id=user.user_id,
            status="in_progress"
        ).order_by(ExerciseAttempt.started_at.desc()).first()

        now = datetime.now(timezone.utc)

        if not attempt:
            # Fallback check if attempt_id is provided in payload
            req_att_id = data.get("attempt_id") if data else None
            if req_att_id:
                try:
                    att_uuid = uuid.UUID(str(req_att_id))
                    attempt = db.session.get(ExerciseAttempt, att_uuid)
                except (ValueError, TypeError):
                    pass

        if not attempt or str(attempt.user_id) != str(user.user_id):
            raise ExerciseServiceError("ไม่พบเซสชันการทำแบบฝึกหัดที่กำลังดำเนินการอยู่ กรุณากดเริ่มทำใหม่", 400)

        if attempt.status in ["submitted", "completed"]:
            raise ExerciseServiceError("เซสชันนี้ได้รับการส่งคำตอบเรียบร้อยแล้ว ไม่สามารถส่งซ้ำได้", 400)

        # -------------------------------------------------------------
        # Server-side Time Limit Calculation (Source of Truth)
        # -------------------------------------------------------------
        time_spent_seconds = max(1, int((now - _to_utc(attempt.started_at)).total_seconds()))
        is_expired = False
        if exercise.time_limit and exercise.time_limit > 0:
            allowed_seconds = exercise.time_limit * 60
            grace_seconds = 30  # Allow 30s grace for slow network latency
            if time_spent_seconds > (allowed_seconds + grace_seconds):
                is_expired = True

        # Extract submitted answers
        answers_payload = data.get("answers") or {}
        checklists_checked = data.get("checklists") or []
        if isinstance(checklists_checked, dict):
            checklists_checked = [k for k, v in checklists_checked.items() if v]

        activity_scores = {}
        activity_feedback = {}
        total_activity_score = 0.0

        # Evaluate Activities
        for act in (exercise.activities_data or []):
            act_id = str(act.get("id"))
            act_type = act.get("type")
            max_act_score = float(act.get("score") or 0.0)
            user_ans = answers_payload.get(act_id)

            is_correct = False
            item_score = 0.0
            explanation = act.get("explanation") or ""

            if act_type == "fill_code":
                correct_target = act.get("correct_answer")
                if user_ans is not None:
                    user_clean = str(user_ans).strip()
                    # Check exact or list of acceptable alternatives
                    if isinstance(correct_target, list):
                        is_correct = any(user_clean == str(t).strip() or user_clean.replace("'", '"') == str(t).strip().replace("'", '"') for t in correct_target)
                    else:
                        target_clean = str(correct_target).strip()
                        is_correct = (user_clean == target_clean) or (user_clean.replace("'", '"') == target_clean.replace("'", '"'))

            elif act_type == "debug_code":
                correct_code = act.get("correct_code") or ""
                expected_out = act.get("expected_output") or ""
                validation_rule = act.get("validation_rule") or ""

                if user_ans is not None:
                    user_code = str(user_ans).strip()
                    # Remove trailing whitespaces per line for fair matching
                    normalized_user = "\n".join([line.strip() for line in user_code.splitlines() if line.strip()])
                    normalized_target = "\n".join([line.strip() for line in str(correct_code).splitlines() if line.strip()])

                    if normalized_target:
                        is_correct = (normalized_user == normalized_target)
                    elif validation_rule:
                        # Regex or substring check
                        try:
                            if re.search(validation_rule, user_code):
                                is_correct = True
                        except Exception:
                            is_correct = (validation_rule in user_code)
                    elif expected_out:
                        # If simple output matching
                        is_correct = (expected_out.strip() in user_code)
                    else:
                        is_correct = (len(user_code) > 0 and user_code != act.get("initial_code"))

            elif act_type == "mission":
                # Missions receive full score if student attempted or submitted required deliverables
                if user_ans is not None and str(user_ans).strip():
                    is_correct = True

            if is_correct:
                item_score = max_act_score

            total_activity_score += item_score
            activity_scores[act_id] = item_score
            activity_feedback[act_id] = {
                "score": item_score,
                "max_score": max_act_score,
                "is_correct": is_correct,
                "user_answer": user_ans,
                "explanation": explanation
            }

        # Evaluate Checklists
        checklist_scores = {}
        total_checklist_score = 0.0
        checked_set = set(str(c) for c in checklists_checked)

        for ch in (exercise.checklists_data or []):
            ch_id = str(ch.get("id"))
            ch_score = float(ch.get("score") or 0.0)
            if ch_id in checked_set:
                checklist_scores[ch_id] = ch_score
                total_checklist_score += ch_score
            else:
                checklist_scores[ch_id] = 0.0

        # Calculate final raw and capped scores
        computed_score = total_activity_score + total_checklist_score
        target_total = float(exercise.total_score or 100.0)
        final_score = min(target_total, max(0.0, computed_score))
        percentage = round((final_score / target_total * 100.0), 2) if target_total > 0 else 100.0
        is_passed = (percentage >= 50.0) and not is_expired

        # -------------------------------------------------------------
        # Atomic XP Award with Single-time per Exercise rule
        # -------------------------------------------------------------
        xp_earned = 0
        if is_passed and int(exercise.xp_reward or 0) > 0:
            # Check if this user was ever granted XP for this specific exercise
            existing_xp = UserXP.query.filter_by(
                user_id=user.user_id,
                source_type="exercise",
                source_id=exercise.exercise_id
            ).first()

            if not existing_xp:
                xp_earned = int(exercise.xp_reward)
                # Create UserXP entry
                user_xp_record = UserXP(
                    user_id=user.user_id,
                    amount=xp_earned,
                    source_type="exercise",
                    source_id=exercise.exercise_id
                )
                db.session.add(user_xp_record)

                # Update UserLevel atomically
                ul_query = UserLevel.query.filter_by(user_id=user.user_id)
                if db.engine.dialect.name == "postgresql":
                    ul_query = ul_query.with_for_update()
                user_level = ul_query.first()
                if not user_level:
                    base_level = Level.query.order_by(Level.level_number.asc()).first()
                    user_level = UserLevel(
                        user_id=user.user_id,
                        level_id=base_level.level_id if base_level else uuid.uuid4(),
                        current_xp=xp_earned
                    )
                    db.session.add(user_level)
                else:
                    user_level.current_xp = (user_level.current_xp or 0) + xp_earned
                    user_level.updated_at = datetime.now(timezone.utc)

        # Update Attempt record
        attempt.status = "expired" if is_expired else "completed"
        attempt.score = final_score
        attempt.time_spent = time_spent_seconds
        attempt.xp_earned = xp_earned
        attempt.answers_data = {
            "activities": answers_payload,
            "checklists": list(checklists_checked)
        }
        attempt.feedback_data = {
            "activity_scores": activity_scores,
            "activity_feedback": activity_feedback,
            "checklist_scores": checklist_scores,
            "total_activity_score": total_activity_score,
            "total_checklist_score": total_checklist_score,
            "percentage": percentage,
            "is_passed": is_passed,
            "is_expired": is_expired
        }
        attempt.submitted_at = now

        # Update Progress Tracking (Module 4)
        if exercise.lesson_id:
            lesson_prog = LessonProgress.query.filter_by(
                user_id=user.user_id,
                lesson_id=exercise.lesson_id
            ).first()
            if not lesson_prog:
                lesson_prog = LessonProgress(
                    user_id=user.user_id,
                    lesson_id=exercise.lesson_id,
                    status="completed" if is_passed else "in_progress",
                    completed_at=now if is_passed else None
                )
                db.session.add(lesson_prog)
            elif is_passed:
                lesson_prog.status = "completed"
                lesson_prog.completed_at = now

        # Record event in learning_activities
        event = LearningActivity(
            user_id=user.user_id,
            activity_type="exercise_submission",
            activity_data={
                "exercise_id": str(exercise.exercise_id),
                "attempt_id": str(attempt.attempt_id),
                "score": final_score,
                "percentage": percentage,
                "is_passed": is_passed,
                "xp_earned": xp_earned
            }
        )
        db.session.add(event)

        # Sync with Mission Progress (Module 5.6) if exercise contains a mission
        for act in (exercise.activities_data or []):
            if act.get("type") == "mission":
                m_title = act.get("title")
                # Look for matching mission in DB or create progress
                m_record = Mission.query.filter_by(title=m_title).first()
                if m_record:
                    m_prog = MissionProgress.query.filter_by(
                        user_id=user.user_id,
                        mission_id=m_record.mission_id
                    ).first()
                    if not m_prog:
                        m_prog = MissionProgress(
                            user_id=user.user_id,
                            mission_id=m_record.mission_id,
                            progress_percent=100.00 if is_passed else 50.00,
                            status="completed" if is_passed else "in_progress",
                            completed_at=now if is_passed else None
                        )
                        db.session.add(m_prog)
                    elif is_passed:
                        m_prog.progress_percent = 100.00
                        m_prog.status = "completed"
                        m_prog.completed_at = now

        db.session.commit()

        # Build response payload
        return {
            "attempt_id": str(attempt.attempt_id),
            "exercise_id": str(exercise.exercise_id),
            "score": final_score,
            "total_score": target_total,
            "percentage": percentage,
            "xp_earned": xp_earned,
            "is_passed": is_passed,
            "is_expired": is_expired,
            "time_spent": time_spent_seconds,
            "submitted_at": now.isoformat(),
            "activity_feedback": activity_feedback,
            "checklist_scores": checklist_scores
        }

    @classmethod
    def get_latest_result(cls, exercise_id: str, user: User) -> dict:
        """Get latest attempt result for the current user."""
        try:
            ex_uuid = uuid.UUID(str(exercise_id))
        except (ValueError, TypeError):
            raise ExerciseServiceError("รูปแบบรหัสแบบฝึกหัดไม่ถูกต้อง", 400)

        attempt = ExerciseAttempt.query.filter_by(
            exercise_id=ex_uuid,
            user_id=user.user_id
        ).filter(ExerciseAttempt.status.in_(["submitted", "completed", "expired"]))\
         .order_by(ExerciseAttempt.submitted_at.desc()).first()

        if not attempt:
            raise ExerciseServiceError("ยังไม่มีประวัติการส่งแบบฝึกหัดนี้", 404)

        return attempt.to_dict()

    @classmethod
    def get_user_attempts(cls, exercise_id: str, user: User) -> list:
        """Get all attempts of a user for this exercise."""
        try:
            ex_uuid = uuid.UUID(str(exercise_id))
        except (ValueError, TypeError):
            raise ExerciseServiceError("รูปแบบรหัสแบบฝึกหัดไม่ถูกต้อง", 400)

        attempts = ExerciseAttempt.query.filter_by(
            exercise_id=ex_uuid,
            user_id=user.user_id
        ).order_by(ExerciseAttempt.started_at.desc()).all()

        return [a.to_dict() for a in attempts]
