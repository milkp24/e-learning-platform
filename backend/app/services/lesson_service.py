import uuid
from sqlalchemy import func
from app.extensions import db
from app.models.user import User
from app.models.classroom import Classroom, Lesson, Episode, Content
from app.models.progress import LessonProgress
from app.utils.validators import (
    validate_title,
    validate_content_type,
    sanitize_content_by_type,
)


class LessonServiceError(Exception):
    """Base exception for lesson and content service operations."""
    def __init__(self, message: str, status_code: int = 400, error: str = "Bad Request"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error = error


class LessonService:
    """
    LessonService: Central business logic service for Chapters (Lessons), Episodes, and Contents.
    Encapsulates 4-tier hierarchy logic (Course -> Chapter -> Episode -> Content),
    Dual-pointer content synchronization, type-specific sanitization,
    ownership validation, student enrollment verification, and transaction management.
    """

    # =========================================================================
    # 1. Authorization & Ownership Helpers
    # =========================================================================

    @staticmethod
    def get_classroom_from_lesson(lesson: Lesson | None) -> Classroom | None:
        """ดึงออบเจ็กต์ Classroom จาก Lesson ไม่ว่าจะเชื่อมตรงหรือผ่าน Chapter"""
        if not lesson:
            return None
        if lesson.classroom:
            return lesson.classroom
        if lesson.chapter and lesson.chapter.course:
            return lesson.chapter.course
        return None

    @staticmethod
    def can_manage_classroom(classroom: Classroom | None, user: User | None) -> bool:
        """ตรวจสอบสิทธิ์: เฉพาะ Admin, Super Admin หรือ Instructor เจ้าของคอร์สเท่านั้น"""
        if not classroom or not user:
            return False
        if user.has_role("admin") or user.has_role("super_admin"):
            return True
        if user.has_role("instructor") and str(classroom.instructor_id) == str(user.user_id):
            return True
        return False

    @staticmethod
    def can_view_classroom_content(classroom: Classroom | None, user: User | None) -> bool:
        """
        ตรวจสอบสิทธิ์การเข้าดูเนื้อหาภายในคอร์ส (UAT-028, UAT-029)
        - Admin, Super Admin, Instructor เจ้าของคอร์ส, หรือผู้เรียนที่ลงทะเบียน (Enrolled Member)
        - สำหรับ Guest Preview อนุญาตให้ดูโครงร่างได้ แต่เนื้อหาเต็มต้องลงทะเบียน
        """
        if not user or not classroom:
            return False
        if user.has_role("admin") or user.has_role("super_admin"):
            return True
        if str(classroom.instructor_id) == str(user.user_id):
            return True
        if classroom.has_member(user.user_id):
            return True
        return False

    @classmethod
    def is_lesson_unlocked_for_user(cls, lesson: Lesson | None, user: User | None) -> tuple[bool, str | None]:
        """
        ตรวจสอบเงื่อนไขการปลดล็อกบทเรียนตามลำดับก่อนหน้า (GAP-2: Sequential Lesson Gating)
        - Admin, Super Admin, หรือ Instructor เจ้าของคอร์ส -> ปลดล็อกเสมอ (True, None)
        - ถ้าไม่มี user (Guest Preview Mode):
          - บทเรียนแรกสุดของคอร์ส (index 0) -> ปลดล็อก (True, None) (อนุญาตให้ดูโครงร่าง/พรีวิว)
          - บทเรียนถัดไป -> ล็อก (False, "AUTHENTICATION_REQUIRED")
        - ถ้าผู้เรียนลงทะเบียนแล้ว (Enrolled Student):
          - ค้นหาบทเรียนทั้งหมดในคอร์ส เรียงตาม sequence_no ASC, lesson_id ASC
          - บทเรียนแรกสุด (index 0) -> ปลดล็อกเสมอ (True, None)
          - บทเรียนถัดไป (index > 0):
            - ต้องผ่านบทเรียนก่อนหน้าทั้งหมด (index 0 ถึง index - 1) ในตาราง lesson_progress โดย status == 'completed'
            - หากครบถ้วน -> ปลดล็อก (True, None)
            - หากยังไม่ครบ -> ล็อก (False, "PREVIOUS_LESSON_INCOMPLETE")
        """
        if not lesson:
            return False, "LESSON_NOT_FOUND"

        classroom = cls.get_classroom_from_lesson(lesson)
        if not classroom:
            return False, "CLASSROOM_NOT_FOUND"

        # 1. Bypass สำหรับ Instructor เจ้าของคอร์ส และ Admin / Super Admin
        if cls.can_manage_classroom(classroom, user):
            return True, None

        # ดึงลำดับบทเรียนทั้งหมดในคอร์ส (Ordered by sequence_no ASC, lesson_id ASC)
        course_lessons = (
            Lesson.query.filter_by(classroom_id=classroom.classroom_id)
            .order_by(Lesson.sequence_no.asc(), Lesson.lesson_id.asc())
            .all()
        )

        # หา Index ของบทเรียนปัจจุบัน
        current_idx = None
        for idx, l in enumerate(course_lessons):
            if l.lesson_id == lesson.lesson_id:
                current_idx = idx
                break

        if current_idx is None or current_idx == 0:
            return True, None

        # หากยังไม่ได้ล็อกอิน (Guest) สำหรับบทเรียน index > 0 ให้ล็อก
        if not user:
            return False, "AUTHENTICATION_REQUIRED"

        # 2. ตรวจสอบเงื่อนไขบทเรียนก่อนหน้า (index 0 ถึง current_idx - 1)
        prev_lesson_ids = [l.lesson_id for l in course_lessons[:current_idx]]
        completed_count = (
            db.session.query(func.count(LessonProgress.id))
            .filter(
                LessonProgress.user_id == user.user_id,
                LessonProgress.lesson_id.in_(prev_lesson_ids),
                LessonProgress.status == "completed",
            )
            .scalar()
            or 0
        )

        if completed_count == len(prev_lesson_ids):
            return True, None
        return False, "PREVIOUS_LESSON_INCOMPLETE"

    # =========================================================================
    # 2. Chapter (Lesson) CRUD
    # =========================================================================

    @classmethod
    def list_lessons(cls, classroom_id_raw: str, user: User | None) -> dict:
        """
        แสดงรายการบทเรียน (Chapters) ทั้งหมดในคอร์ส เรียงตาม sequence_no
        - ผู้ใช้ทั่วไป / Guest สามารถดูโครงร่างบทเรียนและตอนย่อย (Episodes) ได้ (Preview Mode)
        - สมาชิกที่ลงทะเบียนแล้วจะสามารถเข้าดูรายละเอียดเนื้อหาได้
        - บังคับใช้เงื่อนไข Sequential Lesson Gating (GAP-2)
        """
        try:
            c_uuid = uuid.UUID(classroom_id_raw)
        except (ValueError, TypeError):
            raise LessonServiceError("Invalid classroom ID format.", 400, "Bad Request")

        classroom = db.session.get(Classroom, c_uuid)
        if not classroom:
            raise LessonServiceError("Classroom not found.", 404, "Not Found")

        is_member = cls.can_view_classroom_content(classroom, user)
        is_manager = cls.can_manage_classroom(classroom, user)
        lessons = Lesson.query.filter_by(classroom_id=c_uuid).order_by(Lesson.sequence_no.asc(), Lesson.lesson_id.asc()).all()

        completed_lesson_ids = set()
        if user and not is_manager:
            rows = db.session.query(LessonProgress.lesson_id).filter(
                LessonProgress.user_id == user.user_id,
                LessonProgress.lesson_id.in_([l.lesson_id for l in lessons]),
                LessonProgress.status == "completed"
            ).all()
            completed_lesson_ids = {r[0] for r in rows}

        formatted_lessons = []
        all_prev_completed = True
        for idx, l in enumerate(lessons):
            if is_manager:
                is_unlocked = True
                lock_reason = None
            elif not is_member:
                is_unlocked = (idx == 0)
                lock_reason = None if is_unlocked else "AUTHENTICATION_REQUIRED"
            else:
                if idx == 0:
                    is_unlocked = True
                    lock_reason = None
                else:
                    is_unlocked = all_prev_completed
                    lock_reason = None if is_unlocked else "PREVIOUS_LESSON_INCOMPLETE"

            if l.lesson_id not in completed_lesson_ids:
                all_prev_completed = False

            l_dict = l.to_dict(include_contents=is_member and is_unlocked, include_episodes=True)
            l_dict["is_unlocked"] = is_unlocked
            l_dict["is_locked"] = not is_unlocked
            l_dict["lock_reason"] = lock_reason
            if not is_unlocked:
                l_dict["contents"] = []
                for ep in l_dict.get("episodes", []):
                    ep["contents"] = []
                    ep["is_unlocked"] = False
                    ep["is_locked"] = True
            else:
                for ep in l_dict.get("episodes", []):
                    ep["is_unlocked"] = True
                    ep["is_locked"] = False

            formatted_lessons.append(l_dict)

        return {
            "classroom_id": str(classroom.classroom_id),
            "course_id": str(classroom.classroom_id),
            "is_enrolled": is_member,
            "lessons": formatted_lessons,
            "chapters": formatted_lessons
        }

    @classmethod
    def create_lesson(cls, classroom_id_raw: str, user: User | None, data: dict) -> tuple[dict, int]:
        """สร้าง Chapter (Lesson) ใหม่ในคอร์สเรียน (UAT-028)"""
        if not user:
            raise LessonServiceError("User not found.", 401, "Unauthorized")

        try:
            c_uuid = uuid.UUID(classroom_id_raw)
        except (ValueError, TypeError):
            raise LessonServiceError("Invalid classroom ID format.", 400, "Bad Request")

        classroom = db.session.get(Classroom, c_uuid)
        if not classroom:
            raise LessonServiceError("Classroom not found.", 404, "Not Found")

        if not cls.can_manage_classroom(classroom, user):
            raise LessonServiceError("Access denied: you are not the instructor owner of this classroom.", 403, "Forbidden")

        if not data:
            raise LessonServiceError("JSON body is required.", 400, "Bad Request")

        title = data.get("title")
        is_valid_title, title_err = validate_title(title, field_name="Chapter/Lesson title")
        if not is_valid_title:
            raise LessonServiceError(title_err, 400, "Validation Error")

        sequence_no = data.get("sequence_no")
        if sequence_no is None or not isinstance(sequence_no, int) or sequence_no < 1:
            last_lesson = Lesson.query.filter_by(classroom_id=c_uuid).order_by(Lesson.sequence_no.desc()).first()
            sequence_no = (last_lesson.sequence_no + 1) if last_lesson else 1

        description = data.get("description")
        status = data.get("status", "active")

        new_lesson = Lesson(
            classroom_id=c_uuid,
            title=title.strip(),
            sequence_no=sequence_no,
            description=description.strip() if description else None,
            status=status
        )

        try:
            db.session.add(new_lesson)
            db.session.commit()
            return {
                "message": "Lesson created successfully.",
                "lesson": new_lesson.to_dict(include_episodes=True),
                "chapter": new_lesson.to_dict(include_episodes=True)
            }, 201
        except Exception:
            db.session.rollback()
            raise LessonServiceError("Failed to create lesson.", 500, "Internal Server Error")

    @classmethod
    def get_lesson(cls, lesson_id_raw: str, user: User | None) -> dict:
        """ดึงรายละเอียด Chapter (Lesson) พร้อมรายการตอนย่อย (Episodes) (UAT-028, GAP-2)"""
        try:
            l_uuid = uuid.UUID(lesson_id_raw)
        except (ValueError, TypeError):
            raise LessonServiceError("Invalid lesson ID format.", 400, "Bad Request")

        lesson = db.session.get(Lesson, l_uuid)
        if not lesson:
            raise LessonServiceError("Lesson not found.", 404, "Not Found")

        is_member = cls.can_view_classroom_content(lesson.classroom, user)
        is_unlocked, lock_reason = cls.is_lesson_unlocked_for_user(lesson, user)

        lesson_dict = lesson.to_dict(include_contents=is_member and is_unlocked, include_episodes=True)
        lesson_dict["is_unlocked"] = is_unlocked
        lesson_dict["is_locked"] = not is_unlocked
        lesson_dict["lock_reason"] = lock_reason

        if not is_unlocked:
            lesson_dict["contents"] = []
            for ep in lesson_dict.get("episodes", []):
                ep["contents"] = []
                ep["is_unlocked"] = False
                ep["is_locked"] = True
        else:
            for ep in lesson_dict.get("episodes", []):
                ep["is_unlocked"] = True
                ep["is_locked"] = False

        return {
            "lesson": lesson_dict,
            "chapter": lesson_dict,
            "is_enrolled": is_member,
            "is_unlocked": is_unlocked,
            "is_locked": not is_unlocked,
            "lock_reason": lock_reason
        }

    @classmethod
    def update_lesson(cls, lesson_id_raw: str, user: User | None, data: dict) -> dict:
        """แก้ไขข้อมูล Chapter (Lesson) (UAT-028)"""
        if not user:
            raise LessonServiceError("User not found.", 401, "Unauthorized")

        try:
            l_uuid = uuid.UUID(lesson_id_raw)
        except (ValueError, TypeError):
            raise LessonServiceError("Invalid lesson ID format.", 400, "Bad Request")

        lesson = db.session.get(Lesson, l_uuid)
        if not lesson:
            raise LessonServiceError("Lesson not found.", 404, "Not Found")

        if not cls.can_manage_classroom(lesson.classroom, user):
            raise LessonServiceError("Access denied: you are not the instructor owner of this classroom.", 403, "Forbidden")

        if not data:
            raise LessonServiceError("JSON body is required.", 400, "Bad Request")

        if "title" in data:
            is_valid_title, title_err = validate_title(data.get("title"), field_name="Chapter title")
            if not is_valid_title:
                raise LessonServiceError(title_err, 400, "Validation Error")
            lesson.title = data.get("title").strip()

        if "sequence_no" in data:
            seq = data.get("sequence_no")
            if seq is None or not isinstance(seq, int) or seq < 1:
                raise LessonServiceError("sequence_no must be a positive integer.", 400, "Validation Error")
            lesson.sequence_no = seq

        if "description" in data:
            lesson.description = data.get("description")

        if "status" in data:
            lesson.status = data.get("status")

        try:
            db.session.commit()
            return {
                "message": "Lesson updated successfully.",
                "lesson": lesson.to_dict(include_episodes=True),
                "chapter": lesson.to_dict(include_episodes=True)
            }
        except Exception:
            db.session.rollback()
            raise LessonServiceError("Failed to update lesson.", 500, "Internal Server Error")

    @classmethod
    def delete_lesson(cls, lesson_id_raw: str, user: User | None) -> dict:
        """ลบ Chapter (Lesson) (Episodes และ Contents ภายในจะถูกลบตามแบบ CASCADE)"""
        if not user:
            raise LessonServiceError("User not found.", 401, "Unauthorized")

        try:
            l_uuid = uuid.UUID(lesson_id_raw)
        except (ValueError, TypeError):
            raise LessonServiceError("Invalid lesson ID format.", 400, "Bad Request")

        lesson = db.session.get(Lesson, l_uuid)
        if not lesson:
            raise LessonServiceError("Lesson not found.", 404, "Not Found")

        if not cls.can_manage_classroom(lesson.classroom, user):
            raise LessonServiceError("Access denied: you are not the instructor owner of this classroom.", 403, "Forbidden")

        try:
            db.session.delete(lesson)
            db.session.commit()
            return {"message": "Lesson deleted successfully."}
        except Exception:
            db.session.rollback()
            raise LessonServiceError("Failed to delete lesson.", 500, "Internal Server Error")

    # =========================================================================
    # 3. Episode CRUD (ตอนย่อยใน Chapter)
    # =========================================================================

    @classmethod
    def list_episodes(cls, lesson_id_raw: str, user: User | None) -> dict:
        """แสดงรายการ Episodes ทั้งหมดใน Chapter (UAT-028, GAP-2)"""
        try:
            l_uuid = uuid.UUID(lesson_id_raw)
        except (ValueError, TypeError):
            raise LessonServiceError("Invalid lesson ID format.", 400, "Bad Request")

        lesson = db.session.get(Lesson, l_uuid)
        if not lesson:
            raise LessonServiceError("Lesson not found.", 404, "Not Found")

        is_member = cls.can_view_classroom_content(lesson.classroom, user)
        is_unlocked, lock_reason = cls.is_lesson_unlocked_for_user(lesson, user)
        episodes = Episode.query.filter_by(lesson_id=l_uuid).order_by(Episode.sequence_no.asc()).all()

        ep_list = []
        for e in episodes:
            e_dict = e.to_dict(include_contents=is_member and is_unlocked)
            e_dict["is_unlocked"] = is_unlocked
            e_dict["is_locked"] = not is_unlocked
            if not is_unlocked:
                e_dict["contents"] = []
                e_dict["lock_reason"] = lock_reason
            ep_list.append(e_dict)

        return {
            "lesson_id": str(lesson.lesson_id),
            "chapter_id": str(lesson.lesson_id),
            "is_enrolled": is_member,
            "is_unlocked": is_unlocked,
            "is_locked": not is_unlocked,
            "lock_reason": lock_reason,
            "episodes": ep_list
        }

    @classmethod
    def create_episode(cls, lesson_id_raw: str, user: User | None, data: dict) -> tuple[dict, int]:
        """
        สร้าง Episode (ตอนย่อย) ใหม่ใน Chapter (UAT-028)
        - ต้องระบุ title, sequence_no (optional), description, duration_seconds
        """
        if not user:
            raise LessonServiceError("User not found.", 401, "Unauthorized")

        try:
            l_uuid = uuid.UUID(lesson_id_raw)
        except (ValueError, TypeError):
            raise LessonServiceError("Invalid lesson ID format.", 400, "Bad Request")

        lesson = db.session.get(Lesson, l_uuid)
        if not lesson:
            raise LessonServiceError("Lesson not found.", 404, "Not Found")

        if not cls.can_manage_classroom(lesson.classroom, user):
            raise LessonServiceError("Access denied: you are not the instructor owner of this classroom.", 403, "Forbidden")

        if not data:
            raise LessonServiceError("JSON body is required.", 400, "Bad Request")

        title = data.get("title")
        is_valid_title, title_err = validate_title(title, field_name="Episode title")
        if not is_valid_title:
            raise LessonServiceError(title_err, 400, "Validation Error")

        sequence_no = data.get("sequence_no")
        if sequence_no is None or not isinstance(sequence_no, int) or sequence_no < 1:
            last_ep = Episode.query.filter_by(lesson_id=l_uuid).order_by(Episode.sequence_no.desc()).first()
            sequence_no = (last_ep.sequence_no + 1) if last_ep else 1

        description = data.get("description")
        duration_seconds = data.get("duration_seconds", 0)
        status = data.get("status", "active")

        new_episode = Episode(
            lesson_id=l_uuid,
            title=title.strip(),
            sequence_no=sequence_no,
            description=description.strip() if description else None,
            duration_seconds=int(duration_seconds) if duration_seconds else 0,
            status=status
        )

        try:
            db.session.add(new_episode)
            db.session.commit()
            return {
                "message": "Episode created successfully.",
                "episode": new_episode.to_dict(include_contents=True)
            }, 201
        except Exception:
            db.session.rollback()
            raise LessonServiceError("Failed to create episode.", 500, "Internal Server Error")

    @classmethod
    def get_episode(cls, episode_id_raw: str, user: User | None) -> dict:
        """ดึงรายละเอียด Episode และรายการ Content ทั้งหมด (UAT-028, UAT-029, GAP-2)"""
        try:
            ep_uuid = uuid.UUID(episode_id_raw)
        except (ValueError, TypeError):
            raise LessonServiceError("Invalid episode ID format.", 400, "Bad Request")

        episode = db.session.get(Episode, ep_uuid)
        if not episode:
            raise LessonServiceError("Episode not found.", 404, "Not Found")

        is_member = cls.can_view_classroom_content(episode.lesson.classroom, user)
        is_unlocked, lock_reason = cls.is_lesson_unlocked_for_user(episode.lesson, user)

        ep_dict = episode.to_dict(include_contents=is_member and is_unlocked)
        ep_dict["is_unlocked"] = is_unlocked
        ep_dict["is_locked"] = not is_unlocked
        if not is_unlocked:
            ep_dict["contents"] = []
            ep_dict["lock_reason"] = lock_reason

        return {
            "episode": ep_dict,
            "is_enrolled": is_member,
            "is_unlocked": is_unlocked,
            "is_locked": not is_unlocked,
            "lock_reason": lock_reason
        }

    @classmethod
    def update_episode(cls, episode_id_raw: str, user: User | None, data: dict) -> dict:
        """แก้ไข Episode (UAT-028)"""
        if not user:
            raise LessonServiceError("User not found.", 401, "Unauthorized")

        try:
            ep_uuid = uuid.UUID(episode_id_raw)
        except (ValueError, TypeError):
            raise LessonServiceError("Invalid episode ID format.", 400, "Bad Request")

        episode = db.session.get(Episode, ep_uuid)
        if not episode:
            raise LessonServiceError("Episode not found.", 404, "Not Found")

        if not cls.can_manage_classroom(episode.lesson.classroom, user):
            raise LessonServiceError("Access denied: you are not the instructor owner of this classroom.", 403, "Forbidden")

        if not data:
            raise LessonServiceError("JSON body is required.", 400, "Bad Request")

        if "title" in data:
            is_valid_title, title_err = validate_title(data.get("title"), field_name="Episode title")
            if not is_valid_title:
                raise LessonServiceError(title_err, 400, "Validation Error")
            episode.title = data.get("title").strip()

        if "sequence_no" in data:
            seq = data.get("sequence_no")
            if seq is None or not isinstance(seq, int) or seq < 1:
                raise LessonServiceError("sequence_no must be a positive integer.", 400, "Validation Error")
            episode.sequence_no = seq

        if "description" in data:
            episode.description = data.get("description")

        if "duration_seconds" in data:
            episode.duration_seconds = int(data.get("duration_seconds", 0))

        if "status" in data:
            episode.status = data.get("status")

        try:
            db.session.commit()
            return {
                "message": "Episode updated successfully.",
                "episode": episode.to_dict(include_contents=True)
            }
        except Exception:
            db.session.rollback()
            raise LessonServiceError("Failed to update episode.", 500, "Internal Server Error")

    @classmethod
    def delete_episode(cls, episode_id_raw: str, user: User | None) -> dict:
        """
        ลบ Episode (UAT-028)
        - Contents ทั้งหมดภายใน Episode จะถูกลบตามแบบ CASCADE ทันที
        """
        if not user:
            raise LessonServiceError("User not found.", 401, "Unauthorized")

        try:
            ep_uuid = uuid.UUID(episode_id_raw)
        except (ValueError, TypeError):
            raise LessonServiceError("Invalid episode ID format.", 400, "Bad Request")

        episode = db.session.get(Episode, ep_uuid)
        if not episode:
            raise LessonServiceError("Episode not found.", 404, "Not Found")

        if not cls.can_manage_classroom(episode.lesson.classroom, user):
            raise LessonServiceError("Access denied: you are not the instructor owner of this classroom.", 403, "Forbidden")

        try:
            db.session.delete(episode)
            db.session.commit()
            return {"message": "Episode deleted successfully."}
        except Exception:
            db.session.rollback()
            raise LessonServiceError("Failed to delete episode.", 500, "Internal Server Error")

    # =========================================================================
    # 4. Episode Content Operations
    # =========================================================================

    @classmethod
    def list_episode_contents(cls, episode_id_raw: str, user: User | None) -> dict:
        """แสดงรายการ Content ทั้งหมดของ Episode เรียงตาม sequence_no (UAT-029, GAP-2)"""
        if not user:
            raise LessonServiceError("User not found.", 401, "Unauthorized")

        try:
            ep_uuid = uuid.UUID(episode_id_raw)
        except (ValueError, TypeError):
            raise LessonServiceError("Invalid episode ID format.", 400, "Bad Request")

        episode = db.session.get(Episode, ep_uuid)
        if not episode:
            raise LessonServiceError("Episode not found.", 404, "Not Found")

        classroom = cls.get_classroom_from_lesson(episode.lesson)
        if not cls.can_view_classroom_content(classroom, user):
            raise LessonServiceError("Access denied: you must be an enrolled member of this classroom.", 403, "Forbidden")

        is_unlocked, lock_reason = cls.is_lesson_unlocked_for_user(episode.lesson, user)
        if not is_unlocked:
            return {
                "episode_id": str(episode.episode_id),
                "contents": [],
                "is_unlocked": False,
                "is_locked": True,
                "lock_reason": lock_reason
            }

        contents = Content.query.filter_by(episode_id=ep_uuid).order_by(Content.sequence_no.asc()).all()
        return {
            "episode_id": str(episode.episode_id),
            "is_unlocked": True,
            "is_locked": False,
            "contents": [c.to_dict() for c in contents]
        }

    @classmethod
    def add_episode_content(cls, episode_id_raw: str, user: User | None, data: dict) -> tuple[dict, int]:
        """
        เพิ่ม Content ใหม่เข้าสู่ Episode (UAT-029, UAT-034)
        - ใช้กลไก Dual-Pointer: กำหนด episode_id และดึง lesson_id จาก Parent มาเซ็ตคู่กันเสมอ
        - ใช้ Type-Specific Sanitizer: โค้ดไม่ตัดแท็ก, ยูทูปแปลงเป็น Safe No-Cookie URL, ข้อความกรองสคริปต์
        """
        if not user:
            raise LessonServiceError("User not found.", 401, "Unauthorized")

        try:
            ep_uuid = uuid.UUID(episode_id_raw)
        except (ValueError, TypeError):
            raise LessonServiceError("Invalid episode ID format.", 400, "Bad Request")

        episode = db.session.get(Episode, ep_uuid)
        if not episode:
            raise LessonServiceError("Episode not found.", 404, "Not Found")

        classroom = cls.get_classroom_from_lesson(episode.lesson)
        if not cls.can_manage_classroom(classroom, user):
            raise LessonServiceError("Access denied: you are not the instructor owner of this classroom.", 403, "Forbidden")

        if not data:
            raise LessonServiceError("JSON body is required.", 400, "Bad Request")

        content_type = data.get("content_type")
        is_valid_type, type_err = validate_content_type(content_type)
        if not is_valid_type:
            raise LessonServiceError(type_err, 400, "Validation Error")

        raw_data = data.get("content_data", "")
        caption = data.get("caption")

        # Type-Specific Sanitization (UAT-034)
        valid_data, sanitized_data, sanitize_err = sanitize_content_by_type(content_type, raw_data)
        if not valid_data:
            raise LessonServiceError(sanitize_err, 400, "Validation Error")

        sequence_no = data.get("sequence_no")
        if sequence_no is None or not isinstance(sequence_no, int) or sequence_no < 1:
            last_cnt = Content.query.filter_by(episode_id=ep_uuid).order_by(Content.sequence_no.desc()).first()
            sequence_no = (last_cnt.sequence_no + 1) if last_cnt else 1

        new_content = Content(
            episode_id=ep_uuid,
            lesson_id=episode.lesson_id,  # Dual-pointer synchronization
            content_type=content_type.strip().lower(),
            content_data=sanitized_data,
            caption=caption.strip() if caption else None,
            sequence_no=sequence_no
        )

        try:
            db.session.add(new_content)
            db.session.commit()
            return {
                "message": "Content added successfully.",
                "content": new_content.to_dict()
            }, 201
        except Exception:
            db.session.rollback()
            raise LessonServiceError("Failed to add content.", 500, "Internal Server Error")

    # =========================================================================
    # 5. Legacy Lesson Content Endpoints
    # =========================================================================

    @classmethod
    def list_contents(cls, lesson_id_raw: str, user: User | None) -> dict:
        """List all contents of a lesson (Legacy endpoint สำหรับโค้ดและ Query เดิม, GAP-2)."""
        if not user:
            raise LessonServiceError("User not found.", 401, "Unauthorized")

        try:
            l_uuid = uuid.UUID(lesson_id_raw)
        except (ValueError, TypeError):
            raise LessonServiceError("Invalid lesson ID format.", 400, "Bad Request")

        lesson = db.session.get(Lesson, l_uuid)
        if not lesson:
            raise LessonServiceError("Lesson not found.", 404, "Not Found")

        if not cls.can_view_classroom_content(lesson.classroom, user):
            raise LessonServiceError("Access denied: you must be an enrolled member of this classroom.", 403, "Forbidden")

        is_unlocked, lock_reason = cls.is_lesson_unlocked_for_user(lesson, user)
        if not is_unlocked:
            return {
                "lesson_id": str(lesson.lesson_id),
                "contents": [],
                "is_unlocked": False,
                "is_locked": True,
                "lock_reason": lock_reason
            }

        contents = Content.query.filter_by(lesson_id=l_uuid).order_by(Content.sequence_no.asc()).all()
        return {
            "lesson_id": str(lesson.lesson_id),
            "is_unlocked": True,
            "is_locked": False,
            "contents": [c.to_dict() for c in contents]
        }

    @classmethod
    def add_content(cls, lesson_id_raw: str, user: User | None, data: dict) -> tuple[dict, int]:
        """Add a content item to a lesson (Legacy endpoint พร้อมกลไกสร้าง/ผูก Episode อัตโนมัติ)."""
        if not user:
            raise LessonServiceError("User not found.", 401, "Unauthorized")

        try:
            l_uuid = uuid.UUID(lesson_id_raw)
        except (ValueError, TypeError):
            raise LessonServiceError("Invalid lesson ID format.", 400, "Bad Request")

        lesson = db.session.get(Lesson, l_uuid)
        if not lesson:
            raise LessonServiceError("Lesson not found.", 404, "Not Found")

        if not cls.can_manage_classroom(lesson.classroom, user):
            raise LessonServiceError("Access denied: you are not the instructor owner of this classroom.", 403, "Forbidden")

        if not data:
            raise LessonServiceError("JSON body is required.", 400, "Bad Request")

        content_type = data.get("content_type")
        is_valid_type, type_err = validate_content_type(content_type)
        if not is_valid_type:
            raise LessonServiceError(type_err, 400, "Validation Error")

        raw_data = data.get("content_data", "")
        caption = data.get("caption")

        valid_data, sanitized_data, sanitize_err = sanitize_content_by_type(content_type, raw_data)
        if not valid_data:
            raise LessonServiceError(sanitize_err, 400, "Validation Error")

        # หา Episode แรกของบทเรียน หรือสร้างให้อัตโนมัติถ้ายังไม่มี
        target_episode = Episode.query.filter_by(lesson_id=l_uuid).order_by(Episode.sequence_no.asc()).first()
        if not target_episode:
            target_episode = Episode(
                lesson_id=l_uuid,
                title=f"Episode 1: {lesson.title}",
                sequence_no=1,
                status="active"
            )
            db.session.add(target_episode)
            db.session.flush()

        new_content = Content(
            episode_id=target_episode.episode_id,
            lesson_id=l_uuid,
            content_type=content_type.strip().lower(),
            content_data=sanitized_data,
            caption=caption.strip() if caption else None,
            sequence_no=1
        )

        try:
            db.session.add(new_content)
            db.session.commit()
            return {
                "message": "Content added successfully.",
                "content": new_content.to_dict()
            }, 201
        except Exception:
            db.session.rollback()
            raise LessonServiceError("Failed to add content.", 500, "Internal Server Error")

    # =========================================================================
    # 6. Content Single Item CRUD
    # =========================================================================

    @classmethod
    def get_content(cls, content_id_raw: str, user: User | None) -> dict:
        """ดึงข้อมูล Content ชิ้นใดชิ้นหนึ่ง (GAP-2: Sequential Guard)"""
        if not user:
            raise LessonServiceError("User not found.", 401, "Unauthorized")

        try:
            cnt_uuid = uuid.UUID(content_id_raw)
        except (ValueError, TypeError):
            raise LessonServiceError("Invalid content ID format.", 400, "Bad Request")

        content = db.session.get(Content, cnt_uuid)
        if not content:
            raise LessonServiceError("Content not found.", 404, "Not Found")

        lesson_obj = content.lesson or (content.episode.lesson if content.episode else None)
        classroom = cls.get_classroom_from_lesson(lesson_obj)
        if not classroom or not cls.can_view_classroom_content(classroom, user):
            raise LessonServiceError("Access denied: you must be an enrolled member of this classroom.", 403, "Forbidden")

        is_unlocked, lock_reason = cls.is_lesson_unlocked_for_user(lesson_obj, user)
        if not is_unlocked:
            raise LessonServiceError(f"Access denied: previous lesson must be completed before accessing this content ({lock_reason}).", 403, "Forbidden")

        return {"content": content.to_dict()}

    @classmethod
    def update_content(cls, content_id_raw: str, user: User | None, data: dict) -> dict:
        """แก้ไขข้อมูล Content พร้อม Type-Specific Sanitizer (UAT-034)"""
        if not user:
            raise LessonServiceError("User not found.", 401, "Unauthorized")

        try:
            cnt_uuid = uuid.UUID(content_id_raw)
        except (ValueError, TypeError):
            raise LessonServiceError("Invalid content ID format.", 400, "Bad Request")

        content = db.session.get(Content, cnt_uuid)
        if not content:
            raise LessonServiceError("Content not found.", 404, "Not Found")

        lesson_obj = content.lesson or (content.episode.lesson if content.episode else None)
        classroom = cls.get_classroom_from_lesson(lesson_obj)
        if not classroom or not cls.can_manage_classroom(classroom, user):
            raise LessonServiceError("Access denied: you are not the instructor owner of this classroom.", 403, "Forbidden")

        if not data:
            raise LessonServiceError("JSON body is required.", 400, "Bad Request")

        c_type = data.get("content_type", content.content_type)
        if "content_type" in data:
            is_valid_type, type_err = validate_content_type(c_type)
            if not is_valid_type:
                raise LessonServiceError(type_err, 400, "Validation Error")
            content.content_type = c_type.strip().lower()

        if "content_data" in data:
            raw_data = data.get("content_data")
            valid_data, sanitized_data, sanitize_err = sanitize_content_by_type(content.content_type, raw_data)
            if not valid_data:
                raise LessonServiceError(sanitize_err, 400, "Validation Error")
            content.content_data = sanitized_data

        if "caption" in data:
            content.caption = data.get("caption")

        if "sequence_no" in data:
            seq = data.get("sequence_no")
            if seq is not None and isinstance(seq, int) and seq >= 1:
                content.sequence_no = seq

        try:
            db.session.commit()
            return {
                "message": "Content updated successfully.",
                "content": content.to_dict()
            }
        except Exception:
            db.session.rollback()
            raise LessonServiceError("Failed to update content.", 500, "Internal Server Error")

    @classmethod
    def delete_content(cls, content_id_raw: str, user: User | None) -> dict:
        """ลบ Content"""
        if not user:
            raise LessonServiceError("User not found.", 401, "Unauthorized")

        try:
            cnt_uuid = uuid.UUID(content_id_raw)
        except (ValueError, TypeError):
            raise LessonServiceError("Invalid content ID format.", 400, "Bad Request")

        content = db.session.get(Content, cnt_uuid)
        if not content:
            raise LessonServiceError("Content not found.", 404, "Not Found")

        lesson_obj = content.lesson or (content.episode.lesson if content.episode else None)
        classroom = cls.get_classroom_from_lesson(lesson_obj)
        if not classroom or not cls.can_manage_classroom(classroom, user):
            raise LessonServiceError("Access denied: you are not the instructor owner of this classroom.", 403, "Forbidden")

        try:
            db.session.delete(content)
            db.session.commit()
            return {"message": "Content deleted successfully."}
        except Exception:
            db.session.rollback()
            raise LessonServiceError("Failed to delete content.", 500, "Internal Server Error")
