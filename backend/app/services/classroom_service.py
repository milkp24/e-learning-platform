import uuid
from sqlalchemy.exc import IntegrityError
from app.extensions import db
from app.models.user import User
from app.models.classroom import (
    Classroom, ClassroomMember, Lesson, Chapter, Episode, Content, Media, Journal
)
from app.models.progress import LearningProgress, LessonProgress, EpisodeProgress
from app.models.exercise import Exercise, ExerciseAttempt, CodingExercise, CodeSubmission, CodeExecution, TestCase
from app.models.quiz import Quiz, QuizCondition, QuizQuestion, QuizAttempt, QuizAnswer, QuizResult
from app.models.story import Story, StoryScene, StoryProgress
from app.models.streaming import LiveSchedule, LiveSession
from app.models.virtuallab import LabAssignment
from app.models.ai import AICodeRequest
from app.utils.validators import validate_title


class ClassroomServiceError(Exception):
    """Base exception for classroom service operations."""
    def __init__(self, message: str, status_code: int = 400, error: str = "Bad Request"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error = error


class ClassroomService:
    """
    ClassroomService: Central business logic service for Classrooms/Courses and Memberships.
    Encapsulates Course CRUD, Catalog listing, My Enrollments, Membership management,
    Cascade dependency deletion, Instructor Dashboard aggregation, and Public stats.
    """

    # =========================================================================
    # 1. Authorization & Ownership Helpers
    # =========================================================================

    @staticmethod
    def can_manage_classroom(classroom: Classroom | None, user: User | None) -> bool:
        """ตรวจสอบสิทธิ์: Admin, Super Admin หรือ Instructor เจ้าของคอร์สเท่านั้นที่สามารถจัดการคอร์สได้"""
        if not classroom or not user:
            return False
        if user.has_role("admin") or user.has_role("super_admin"):
            return True
        if user.has_role("instructor") and str(classroom.instructor_id) == str(user.user_id):
            return True
        return False

    # =========================================================================
    # 2. Classroom (Course) CRUD & Catalog
    # =========================================================================

    @classmethod
    def list_classrooms(cls, current_user: User | None, status_filter: str | None = None) -> dict:
        """
        แสดงรายการคอร์สเรียนทั้งหมดในระบบ (Course Catalog) (UAT-020, UAT-026)
        - หากเป็น Guest หรือ Student ให้แสดงเฉพาะคอร์สที่ active
        - ตรวจสอบว่าผู้ใช้ปัจจุบันลงทะเบียนคอร์สใดไปแล้วบ้าง (is_enrolled)
        - ตรวจสอบความเป็นเจ้าของคอร์ส (is_owner)
        """
        query = Classroom.query

        if not current_user or current_user.has_role("student"):
            query = query.filter_by(status="active")
        elif status_filter:
            query = query.filter_by(status=status_filter)

        classrooms = query.order_by(Classroom.created_at.desc()).all()

        enrolled_classroom_ids = set()
        if current_user:
            enrolled_classroom_ids = {
                str(m.classroom_id)
                for m in ClassroomMember.query.filter_by(user_id=current_user.user_id).all()
            }

        results = []
        for c in classrooms:
            c_dict = c.to_dict()
            c_dict["is_enrolled"] = str(c.classroom_id) in enrolled_classroom_ids
            c_dict["is_owner"] = bool(current_user and str(c.instructor_id) == str(current_user.user_id))
            results.append(c_dict)

        return {
            "classrooms": results,
            "courses": results  # Alias
        }

    @classmethod
    def list_my_enrollments(cls, user: User | None) -> dict:
        """
        แสดงรายการคอร์สเรียนที่ผู้เรียนปัจจุบันลงทะเบียนไว้ (My Enrolled Courses) (UAT-030)
        """
        if not user:
            raise ClassroomServiceError("User not found.", 401, "Unauthorized")

        memberships = (
            ClassroomMember.query.filter_by(user_id=user.user_id)
            .order_by(ClassroomMember.joined_at.desc())
            .all()
        )

        enrolled_courses = []
        for m in memberships:
            c = m.classroom
            if c:
                c_dict = c.to_dict(include_lessons=True)
                c_dict["enrollment_status"] = m.status
                c_dict["joined_at"] = m.joined_at.isoformat() if m.joined_at else None
                enrolled_courses.append(c_dict)

        return {
            "enrollments": enrolled_courses,
            "classrooms": enrolled_courses
        }

    @classmethod
    def create_classroom(cls, user: User | None, data: dict) -> tuple[dict, int]:
        """
        สร้างคอร์สเรียนใหม่ (UAT-027)
        - จำกัดสิทธิ์เฉพาะ Instructor และ Admin
        - รองรับชื่อคอร์ส (title), คำอธิบาย (description), รูปปก (thumbnail_url), และสถานะ (status)
        """
        if not user:
            raise ClassroomServiceError("User not found.", 401, "Unauthorized")

        if not data:
            raise ClassroomServiceError("JSON body is required.", 400, "Bad Request")

        title = data.get("title")
        is_valid_title, title_err = validate_title(title, field_name="Course/Classroom title")
        if not is_valid_title:
            raise ClassroomServiceError(title_err, 400, "Validation Error")

        description = data.get("description")
        thumbnail_url = data.get("thumbnail_url")
        status = data.get("status", "active")

        instructor_id = user.user_id
        if user.has_role("admin") and data.get("instructor_id"):
            try:
                target_inst_uuid = uuid.UUID(data.get("instructor_id"))
                target_inst = db.session.get(User, target_inst_uuid)
                if target_inst and (target_inst.has_role("instructor") or target_inst.has_role("admin")):
                    instructor_id = target_inst.user_id
            except (ValueError, TypeError):
                raise ClassroomServiceError("Invalid instructor_id format.", 400, "Bad Request")

        new_classroom = Classroom(
            instructor_id=instructor_id,
            title=title.strip(),
            description=description.strip() if description else None,
            thumbnail_url=thumbnail_url.strip() if thumbnail_url else None,
            status=status
        )

        try:
            db.session.add(new_classroom)
            db.session.commit()
            return {
                "message": "Classroom created successfully.",
                "classroom": new_classroom.to_dict(include_lessons=True),
                "course": new_classroom.to_dict(include_lessons=True)
            }, 201
        except Exception:
            db.session.rollback()
            raise ClassroomServiceError("Failed to create classroom.", 500, "Internal Server Error")

    @classmethod
    def get_classroom(cls, classroom_id_raw: str, current_user: User | None) -> dict:
        """
        ดูรายละเอียดของคอร์สเรียน พร้อมโครงสร้าง Chapters และ Episodes (UAT-020, UAT-026)
        - รองรับ Guest Preview: ดูภาพรวมและรายชื่อบทเรียนได้
        - หากล็อกอินแล้ว จะระบุสถานะ is_enrolled เพื่อให้หน้าบ้านแสดงปุ่ม เข้าเรียน หรือ ลงทะเบียน
        """
        try:
            c_uuid = uuid.UUID(classroom_id_raw)
        except (ValueError, TypeError):
            raise ClassroomServiceError("Invalid classroom ID format.", 400, "Bad Request")

        classroom = db.session.get(Classroom, c_uuid)
        if not classroom:
            raise ClassroomServiceError("Classroom not found.", 404, "Not Found")

        is_enrolled = False
        is_owner = False

        if current_user:
            is_enrolled = classroom.has_member(current_user.user_id)
            is_owner = (str(classroom.instructor_id) == str(current_user.user_id)) or current_user.has_role("admin")

        c_dict = classroom.to_dict(include_members=is_owner, include_lessons=True)
        c_dict["is_enrolled"] = is_enrolled
        c_dict["is_owner"] = is_owner

        return {
            "classroom": c_dict,
            "course": c_dict
        }

    @classmethod
    def update_classroom(cls, classroom_id_raw: str, user: User | None, data: dict) -> dict:
        """
        แก้ไขข้อมูลคอร์สเรียน (UAT-027)
        - จำกัดเฉพาะ Instructor เจ้าของคอร์ส หรือ Admin
        """
        if not user:
            raise ClassroomServiceError("User not found.", 401, "Unauthorized")

        try:
            c_uuid = uuid.UUID(classroom_id_raw)
        except (ValueError, TypeError):
            raise ClassroomServiceError("Invalid classroom ID format.", 400, "Bad Request")

        classroom = db.session.get(Classroom, c_uuid)
        if not classroom:
            raise ClassroomServiceError("Classroom not found.", 404, "Not Found")

        if not cls.can_manage_classroom(classroom, user):
            raise ClassroomServiceError("Access denied: you are not the instructor owner of this classroom.", 403, "Forbidden")

        if not data:
            raise ClassroomServiceError("JSON body is required.", 400, "Bad Request")

        if "title" in data:
            is_valid_title, title_err = validate_title(data.get("title"), field_name="Course title")
            if not is_valid_title:
                raise ClassroomServiceError(title_err, 400, "Validation Error")
            classroom.title = data.get("title").strip()

        if "description" in data:
            classroom.description = data.get("description")

        if "thumbnail_url" in data:
            classroom.thumbnail_url = data.get("thumbnail_url")

        if "status" in data:
            classroom.status = data.get("status")

        try:
            db.session.commit()
            return {
                "message": "Classroom updated successfully.",
                "classroom": classroom.to_dict(),
                "course": classroom.to_dict()
            }
        except Exception:
            db.session.rollback()
            raise ClassroomServiceError("Failed to update classroom.", 500, "Internal Server Error")

    @classmethod
    def delete_classroom(cls, classroom_id_raw: str, user: User | None) -> dict:
        """
        ลบคอร์สเรียน (UAT-027)
        - จำกัดเฉพาะ Instructor เจ้าของคอร์ส หรือ Admin
        - บทเรียน ตอนย่อย และเนื้อหา จะถูกลบตามลำดับ Cascade Dependency อย่างปลอดภัย
        """
        if not user:
            raise ClassroomServiceError("User not found.", 401, "Unauthorized")

        try:
            c_uuid = uuid.UUID(classroom_id_raw)
        except (ValueError, TypeError):
            raise ClassroomServiceError("Invalid classroom ID format.", 400, "Bad Request")

        classroom = db.session.get(Classroom, c_uuid)
        if not classroom:
            raise ClassroomServiceError("Classroom not found.", 404, "Not Found")

        if not cls.can_manage_classroom(classroom, user):
            raise ClassroomServiceError("Access denied: you are not the instructor owner of this classroom.", 403, "Forbidden")

        try:
            # =============================================================
            # Ordered Dependency Deletion (Grandchild -> Child -> Parent)
            # =============================================================
            chapters = Chapter.query.filter_by(course_id=c_uuid).all()
            chapter_ids = [ch.chapter_id for ch in chapters]

            lessons = Lesson.query.filter(
                (Lesson.classroom_id == c_uuid) | (Lesson.chapter_id.in_(chapter_ids))
            ).all() if chapter_ids else Lesson.query.filter_by(classroom_id=c_uuid).all()
            lesson_ids = [l.lesson_id for l in lessons]

            episodes = Episode.query.filter(Episode.lesson_id.in_(lesson_ids)).all() if lesson_ids else []
            episode_ids = [e.episode_id for e in episodes]

            contents = Content.query.filter(
                (Content.lesson_id.in_(lesson_ids)) | (Content.episode_id.in_(episode_ids))
            ).all() if (lesson_ids or episode_ids) else []
            content_ids = [c.content_id for c in contents]

            exercises = Exercise.query.filter(Exercise.lesson_id.in_(lesson_ids)).all() if lesson_ids else []
            exercise_ids = [e.exercise_id for e in exercises]

            coding_exercises = CodingExercise.query.filter(CodingExercise.lesson_id.in_(lesson_ids)).all() if lesson_ids else []
            coding_ids = [c.coding_exercise_id for c in coding_exercises]

            quizzes = Quiz.query.filter(
                (Quiz.course_id == c_uuid) | (Quiz.lesson_id.in_(lesson_ids))
            ).all() if lesson_ids else Quiz.query.filter(Quiz.course_id == c_uuid).all()
            quiz_ids = [q.quiz_id for q in quizzes]

            stories = Story.query.filter(Story.course_id == c_uuid).all()
            story_ids = [s.story_id for s in stories]

            # -------------------------------------------------------------
            # STEP 1: GRANDCHILDREN (ระดับหลาน / ข้อมูลย่อยสุด)
            # -------------------------------------------------------------
            if exercise_ids:
                ExerciseAttempt.query.filter(ExerciseAttempt.exercise_id.in_(exercise_ids)).delete(synchronize_session=False)

            if coding_ids:
                submissions = CodeSubmission.query.filter(CodeSubmission.coding_exercise_id.in_(coding_ids)).all()
                sub_ids = [s.submission_id for s in submissions]
                if sub_ids:
                    CodeExecution.query.filter(CodeExecution.submission_id.in_(sub_ids)).delete(synchronize_session=False)
                    CodeSubmission.query.filter(CodeSubmission.submission_id.in_(sub_ids)).delete(synchronize_session=False)
                TestCase.query.filter(TestCase.coding_exercise_id.in_(coding_ids)).delete(synchronize_session=False)
                AICodeRequest.query.filter(AICodeRequest.coding_exercise_id.in_(coding_ids)).update(
                    {"coding_exercise_id": None}, synchronize_session=False
                )

            if quiz_ids:
                quiz_attempts = QuizAttempt.query.filter(QuizAttempt.quiz_id.in_(quiz_ids)).all()
                qa_ids = [qa.attempt_id for qa in quiz_attempts]
                if qa_ids:
                    QuizAnswer.query.filter(QuizAnswer.attempt_id.in_(qa_ids)).delete(synchronize_session=False)
                    QuizResult.query.filter(QuizResult.attempt_id.in_(qa_ids)).delete(synchronize_session=False)
                    QuizAttempt.query.filter(QuizAttempt.attempt_id.in_(qa_ids)).delete(synchronize_session=False)
                QuizCondition.query.filter(QuizCondition.quiz_id.in_(quiz_ids)).delete(synchronize_session=False)
                QuizQuestion.query.filter(QuizQuestion.quiz_id.in_(quiz_ids)).delete(synchronize_session=False)

            if episode_ids:
                EpisodeProgress.query.filter(EpisodeProgress.episode_id.in_(episode_ids)).delete(synchronize_session=False)
            if lesson_ids:
                LessonProgress.query.filter(LessonProgress.lesson_id.in_(lesson_ids)).delete(synchronize_session=False)
            LearningProgress.query.filter(LearningProgress.course_id == c_uuid).delete(synchronize_session=False)

            if story_ids:
                StoryProgress.query.filter(StoryProgress.story_id.in_(story_ids)).delete(synchronize_session=False)
                StoryScene.query.filter(StoryScene.story_id.in_(story_ids)).delete(synchronize_session=False)

            # -------------------------------------------------------------
            # STEP 2: CHILDREN (ระดับลูกของ Classroom / Lesson / Episode)
            # -------------------------------------------------------------
            if exercise_ids:
                Exercise.query.filter(Exercise.exercise_id.in_(exercise_ids)).delete(synchronize_session=False)

            if coding_ids:
                CodingExercise.query.filter(CodingExercise.coding_exercise_id.in_(coding_ids)).delete(synchronize_session=False)

            if quiz_ids:
                Quiz.query.filter(Quiz.quiz_id.in_(quiz_ids)).delete(synchronize_session=False)

            if story_ids:
                Story.query.filter(Story.story_id.in_(story_ids)).delete(synchronize_session=False)

            scheds = LiveSchedule.query.filter(LiveSchedule.course_id == c_uuid).all()
            sched_ids = [s.schedule_id for s in scheds]
            if sched_ids:
                LiveSession.query.filter(LiveSession.schedule_id.in_(sched_ids)).update(
                    {"schedule_id": None}, synchronize_session=False
                )
                LiveSchedule.query.filter(LiveSchedule.schedule_id.in_(sched_ids)).delete(synchronize_session=False)

            LabAssignment.query.filter(LabAssignment.course_id == c_uuid).delete(synchronize_session=False)

            # Dissociate non-cascading relations (Journals & Media) as per ON DELETE SET NULL
            Journal.query.filter(Journal.classroom_id == c_uuid).update(
                {"classroom_id": None}, synchronize_session=False
            )
            if episode_ids:
                Journal.query.filter(Journal.episode_id.in_(episode_ids)).update(
                    {"episode_id": None}, synchronize_session=False
                )

            if content_ids:
                Media.query.filter(Media.content_id.in_(content_ids)).update(
                    {"content_id": None}, synchronize_session=False
                )

            # -------------------------------------------------------------
            # STEP 3: PARENT (ลบ Classroom พร้อม ORM Cascade บทเรียน/สมาชิก/รีวิว)
            # -------------------------------------------------------------
            db.session.delete(classroom)
            db.session.commit()
            return {"message": "Classroom deleted successfully."}
        except IntegrityError:
            db.session.rollback()
            raise ClassroomServiceError(
                "Cannot delete classroom due to existing dependencies that could not be removed.",
                409,
                "Conflict"
            )
        except Exception:
            db.session.rollback()
            raise ClassroomServiceError("Failed to delete classroom.", 500, "Internal Server Error")

    # =========================================================================
    # 3. Enrollment & Membership Operations
    # =========================================================================

    @classmethod
    def list_classroom_members(cls, classroom_id_raw: str) -> dict:
        """แสดงรายชื่อสมาชิกที่ลงทะเบียนในคอร์สเรียน"""
        try:
            c_uuid = uuid.UUID(classroom_id_raw)
        except (ValueError, TypeError):
            raise ClassroomServiceError("Invalid classroom ID format.", 400, "Bad Request")

        classroom = db.session.get(Classroom, c_uuid)
        if not classroom:
            raise ClassroomServiceError("Classroom not found.", 404, "Not Found")

        return {
            "classroom_id": str(classroom.classroom_id),
            "members": [m.to_dict() for m in classroom.members]
        }

    @classmethod
    def join_classroom(cls, classroom_id_raw: str, user: User | None) -> tuple[dict, int]:
        """
        ผู้เรียนลงทะเบียนเข้าสู่คอร์สเรียน (UAT-030)
        - ป้องกันการลงทะเบียนซ้ำ (คืนค่า 409 Conflict)
        """
        if not user or user.status != "active":
            raise ClassroomServiceError("Account is inactive or not found.", 401, "Unauthorized")

        try:
            c_uuid = uuid.UUID(classroom_id_raw)
        except (ValueError, TypeError):
            raise ClassroomServiceError("Invalid classroom ID format.", 400, "Bad Request")

        classroom = db.session.get(Classroom, c_uuid)
        if not classroom:
            raise ClassroomServiceError("Classroom not found.", 404, "Not Found")

        if classroom.status != "active":
            raise ClassroomServiceError("This course is not currently active for enrollment.", 403, "Forbidden")

        if user.has_role("instructor") or user.has_role("admin") or not user.has_role("student"):
            raise ClassroomServiceError(
                "Access denied: only students can join classrooms. Instructors and Admins already have direct access.",
                403,
                "Forbidden"
            )

        if classroom.has_member(user.user_id):
            raise ClassroomServiceError("You are already enrolled in this classroom.", 409, "Conflict")

        member = ClassroomMember(classroom=classroom, user=user, status="enrolled")
        try:
            db.session.add(member)
            db.session.commit()
            return {
                "message": "Successfully enrolled in classroom.",
                "member": member.to_dict(),
                "enrollment": member.to_dict()
            }, 201
        except Exception:
            db.session.rollback()
            raise ClassroomServiceError("Failed to join classroom.", 500, "Internal Server Error")

    @classmethod
    def add_classroom_member(cls, classroom_id_raw: str, caller: User | None, data: dict) -> tuple[dict, int]:
        """เพิ่มผู้เรียนเข้าคอร์สโดย Instructor หรือ Admin"""
        if not caller:
            raise ClassroomServiceError("User not found.", 401, "Unauthorized")

        try:
            c_uuid = uuid.UUID(classroom_id_raw)
        except (ValueError, TypeError):
            raise ClassroomServiceError("Invalid classroom ID format.", 400, "Bad Request")

        classroom = db.session.get(Classroom, c_uuid)
        if not classroom:
            raise ClassroomServiceError("Classroom not found.", 404, "Not Found")

        if not cls.can_manage_classroom(classroom, caller):
            raise ClassroomServiceError("Access denied: you are not the instructor owner of this classroom.", 403, "Forbidden")

        if not data or not data.get("user_id"):
            raise ClassroomServiceError("user_id is required.", 400, "Bad Request")

        try:
            target_user_uuid = uuid.UUID(data.get("user_id"))
        except (ValueError, TypeError):
            raise ClassroomServiceError("Invalid target user_id format.", 400, "Bad Request")

        target_user = db.session.get(User, target_user_uuid)
        if not target_user:
            raise ClassroomServiceError("Target user not found.", 404, "Not Found")

        if classroom.has_member(target_user.user_id):
            raise ClassroomServiceError("User is already a member of this classroom.", 409, "Conflict")

        member = ClassroomMember(classroom=classroom, user=target_user, status="enrolled")
        try:
            db.session.add(member)
            db.session.commit()
            return {
                "message": "Member added successfully.",
                "member": member.to_dict()
            }, 201
        except Exception:
            db.session.rollback()
            raise ClassroomServiceError("Failed to add member.", 500, "Internal Server Error")

    @classmethod
    def remove_classroom_member(cls, classroom_id_raw: str, target_user_id_raw: str, caller: User | None) -> dict:
        """ยกเลิกการลงทะเบียนเรียน (ผู้เรียนยกเลิกเอง หรือ Instructor/Admin นำออก)"""
        if not caller:
            raise ClassroomServiceError("User not found.", 401, "Unauthorized")

        try:
            c_uuid = uuid.UUID(classroom_id_raw)
            target_uuid = uuid.UUID(target_user_id_raw)
        except (ValueError, TypeError):
            raise ClassroomServiceError("Invalid ID format.", 400, "Bad Request")

        classroom = db.session.get(Classroom, c_uuid)
        if not classroom:
            raise ClassroomServiceError("Classroom not found.", 404, "Not Found")

        is_self = caller.user_id == target_uuid
        is_owner_or_admin = cls.can_manage_classroom(classroom, caller)

        if not is_self and not is_owner_or_admin:
            raise ClassroomServiceError("Access denied: you cannot remove this member.", 403, "Forbidden")

        member = ClassroomMember.query.filter_by(classroom_id=c_uuid, user_id=target_uuid).first()
        if not member:
            raise ClassroomServiceError("Classroom membership not found.", 404, "Not Found")

        try:
            db.session.delete(member)
            db.session.commit()
            return {"message": "Member removed successfully."}
        except Exception:
            db.session.rollback()
            raise ClassroomServiceError("Failed to remove member.", 500, "Internal Server Error")

    # =========================================================================
    # 4. Instructor Dashboard & Platform Stats
    # =========================================================================

    @classmethod
    def get_instructor_dashboard(cls, current_user: User | None) -> dict:
        """
        ดึงข้อมูล Dashboard สำหรับผู้สอน (Instructor Dashboard) จากฐานข้อมูลจริง
        - ตรวจสอบสิทธิ์ผู้สอน: เฉพาะ Instructor, Admin, Super Admin
        - ตรวจสอบ Object Ownership: Instructor เข้าถึงได้เฉพาะคอร์สของตนเอง
        """
        if not current_user:
            raise ClassroomServiceError("User not found.", 401, "Unauthorized")

        if not (current_user.has_role("instructor") or current_user.has_role("admin") or current_user.has_role("super_admin")):
            raise ClassroomServiceError("Instructor role required.", 403, "Forbidden")

        my_courses = (
            Classroom.query.filter_by(instructor_id=current_user.user_id)
            .order_by(Classroom.created_at.desc())
            .all()
        )
        my_course_ids = [c.classroom_id for c in my_courses]

        courses_data = []
        for c in my_courses:
            c_dict = c.to_dict()
            c_dict["id"] = str(c.classroom_id)
            c_dict["student_count"] = len(c.members)
            c_dict["lesson_count"] = len(c.lessons)
            courses_data.append(c_dict)

        if my_course_ids:
            total_students = (
                db.session.query(db.func.count(db.distinct(ClassroomMember.user_id)))
                .filter(ClassroomMember.classroom_id.in_(my_course_ids))
                .scalar() or 0
            )
            total_lessons = (
                db.session.query(db.func.count(Lesson.lesson_id))
                .filter(Lesson.classroom_id.in_(my_course_ids))
                .scalar() or 0
            )
        else:
            total_students = 0
            total_lessons = 0

        total_quizzes = 0
        try:
            if my_course_ids:
                total_quizzes = (
                    db.session.query(db.func.count(Quiz.quiz_id))
                    .filter(Quiz.course_id.in_(my_course_ids))
                    .scalar() or 0
                )
        except Exception:
            total_quizzes = 0

        recent_enrollments = []
        recent_activities = []
        if my_course_ids:
            memberships = (
                ClassroomMember.query.filter(ClassroomMember.classroom_id.in_(my_course_ids))
                .order_by(ClassroomMember.joined_at.desc())
                .limit(10)
                .all()
            )
            for m in memberships:
                u = m.user
                display_name = u.profile.display_name if u and u.profile else (u.email if u else "Unknown")
                course_title = m.classroom.title if m.classroom else "คอร์สเรียน"
                time_str = m.joined_at.isoformat() if m.joined_at else None
                recent_enrollments.append({
                    "id": str(m.classroom_member_id),
                    "user_id": str(m.user_id),
                    "student_name": display_name,
                    "student_email": u.email if u else "",
                    "classroom_id": str(m.classroom_id),
                    "course_title": course_title,
                    "joined_at": time_str,
                    "status": m.status
                })
                recent_activities.append({
                    "id": f"enrollment-{m.classroom_member_id}",
                    "title": f"นักเรียนใหม่ลงทะเบียน: {display_name}",
                    "description": f"คอร์ส {course_title}",
                    "timestamp": time_str,
                    "type": "enrollment"
                })

        return {
            "courses": courses_data,
            "coursesCount": len(courses_data),
            "totalStudents": total_students,
            "totalLessons": total_lessons,
            "totalQuizzes": total_quizzes,
            "recentEnrollments": recent_enrollments,
            "recentActivities": recent_activities
        }

    @classmethod
    def get_platform_stats(cls) -> dict:
        """
        ข้อมูลสถิติภาพรวมแพลตฟอร์มสำหรับ Public / Guest Home (ดึงจริงจาก Database 100%)
        """
        active_courses_count = Classroom.query.filter_by(status="active").count()
        total_lessons_count = (
            db.session.query(db.func.count(Lesson.lesson_id))
            .join(Classroom, Lesson.classroom_id == Classroom.classroom_id)
            .filter(Classroom.status == "active")
            .scalar() or 0
        )
        from app.models.role import Role
        student_role = Role.query.filter_by(role_name="student").first()
        total_students_count = student_role.users.count() if student_role else 0
        instructor_role = Role.query.filter_by(role_name="instructor").first()
        total_instructors_count = instructor_role.users.count() if instructor_role else 0

        return {
            "total_courses": active_courses_count,
            "total_lessons": total_lessons_count,
            "total_students": total_students_count,
            "total_instructors": total_instructors_count
        }
