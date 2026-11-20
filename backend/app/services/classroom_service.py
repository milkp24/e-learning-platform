import uuid
from sqlalchemy.exc import IntegrityError
from app.extensions import db
from app.models.user import User
from app.models.role import Role
from app.models.admin import AuditLog, Notification
from app.models.classroom import (
    Classroom, ClassroomMember, Lesson, Chapter, Episode, Content, Media, Journal,
    COURSE_STATUSES, COURSE_STATUS_ALIASES, COURSE_STATUS_ACTIVE, COURSE_STATUS_DRAFT,
    COURSE_STATUS_PENDING, COURSE_STATUS_ARCHIVED,
)

# สิทธิ์ใน Permission Matrix ที่ใช้กับสถานะคอร์ส
# - courses.publish   : เผยแพร่ได้ทันทีโดยไม่ต้องรออนุมัติ และอนุมัติคอร์สที่รอตรวจสอบได้
# - courses.unpublish : ยกเลิกเผยแพร่ / เก็บถาวรคอร์สที่เผยแพร่อยู่
# ค่าเริ่มต้น: Admin และ Super Admin มีทั้งสองสิทธิ์, Instructor ไม่มี (ต้องส่งตรวจ)
# Super Admin ปรับให้ Role ไหนเผยแพร่เองได้ผ่านหน้า Dynamic Permission Matrix
PERM_COURSE_PUBLISH = "courses.publish"
PERM_COURSE_UNPUBLISH = "courses.unpublish"
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

    @classmethod
    def can_view_classroom(cls, classroom: Classroom | None, user: User | None) -> bool:
        """ตรวจสอบสิทธิ์การมองเห็นคอร์ส (ข้อ 1, 17)
        - คอร์สที่เผยแพร่แล้ว (active): ทุกคนเห็น รวมถึง Guest
        - คอร์สฉบับร่าง (draft): เห็นเฉพาะผู้ที่จัดการคอร์สได้
          และผู้เรียนที่ลงทะเบียนไว้ก่อนแล้ว (เพื่อให้เรียนต่อได้เมื่อคอร์สถูกยกเลิกเผยแพร่)
        """
        if not classroom:
            return False
        if classroom.status == COURSE_STATUS_ACTIVE:
            return True
        if cls.can_manage_classroom(classroom, user):
            return True
        return bool(user and classroom.has_member(user.user_id))

    @staticmethod
    def normalize_status(raw_status) -> str:
        """แปลงและตรวจค่าสถานะคอร์สที่รับมาจาก Request
        รับชื่อเดิม (published, under_review, inactive) ได้ แต่จะบันทึกเป็นค่ามาตรฐานเสมอ
        ค่าที่ไม่รู้จักจะถูกปฏิเสธด้วย 400 แทนการบันทึกค่าผิดลงฐานข้อมูล
        """
        value = str(raw_status or "").strip().lower()
        value = COURSE_STATUS_ALIASES.get(value, value)
        if value not in COURSE_STATUSES:
            raise ClassroomServiceError(
                "สถานะคอร์สไม่ถูกต้อง ต้องเป็น draft, pending, active หรือ archived",
                400,
                "Validation Error",
            )
        return value

    # =========================================================================
    # 1b. สถานะคอร์สและการอนุมัติเผยแพร่ (ข้อ 1, 17, 19 + work flow ฝั่ง Admin)
    #
    #   draft ──(มีสิทธิ์ courses.publish)──────────────► active
    #   draft ──(ไม่มีสิทธิ์: ส่งตรวจ)──► pending ──อนุมัติ──► active
    #                                     pending ──ไม่อนุมัติ (มีเหตุผล)──► draft
    #                                     pending ──ผู้สอนยกเลิกคำขอ──► draft
    #   active ──(courses.unpublish)──► draft / archived
    #   archived ──กู้คืน──► draft
    # =========================================================================

    @staticmethod
    def can_publish_directly(user: User | None) -> bool:
        return bool(user and user.has_permission(PERM_COURSE_PUBLISH))

    @staticmethod
    def can_unpublish(user: User | None) -> bool:
        return bool(user and user.has_permission(PERM_COURSE_UNPUBLISH))

    @classmethod
    def course_capabilities(cls, classroom: Classroom, user: User | None) -> dict:
        """สิ่งที่ผู้ใช้ทำกับคอร์สนี้ได้ ส่งให้หน้าเว็บใช้ซ่อน/แสดงปุ่ม (Backend ตรวจซ้ำทุกครั้งที่กด)"""
        manage = cls.can_manage_classroom(classroom, user)
        publish = manage and cls.can_publish_directly(user)
        return {
            "can_manage": manage,
            "can_publish": publish,
            "can_unpublish": manage and cls.can_unpublish(user),
            "can_review": publish and classroom.status == COURSE_STATUS_PENDING,
        }

    @staticmethod
    def _log_status(user: User, classroom: Classroom, action: str, details: dict) -> None:
        db.session.add(AuditLog(
            user_id=user.user_id,
            action=action,
            entity_type="course",
            entity_id=classroom.classroom_id,
            details={"title": classroom.title, **details},
        ))

    @staticmethod
    def _notify(user_ids, title: str, message: str, classroom: Classroom) -> None:
        for uid in {str(u) for u in user_ids if u}:
            db.session.add(Notification(
                user_id=uuid.UUID(uid),
                title=title,
                message=message,
                notification_type="course_review",
                link_url=f"/classrooms/{classroom.classroom_id}",
            ))

    @staticmethod
    def _reviewer_ids() -> list:
        """ผู้ที่อนุมัติคอร์สได้ (Admin / Super Admin ที่มีสิทธิ์ courses.publish)"""
        candidates = User.query.filter(
            User.status == "active",
            User.roles.any(Role.role_name.in_(["admin", "super_admin"])),
        ).all()
        return [u.user_id for u in candidates if u.has_permission(PERM_COURSE_PUBLISH)]

    @classmethod
    def apply_status_change(cls, classroom: Classroom, user: User, target_raw) -> str:
        """เปลี่ยนสถานะคอร์สตามสิทธิ์ของผู้ใช้ (ยังไม่ commit) คืนข้อความสำหรับแสดงผล
        - ขอเผยแพร่ (active): มี courses.publish = เผยแพร่ทันที / ไม่มี = ส่งตรวจ (pending)
        - ออกจากสถานะเผยแพร่ (ยกเลิกเผยแพร่ / เก็บถาวร) ต้องมี courses.unpublish
        """
        if not cls.can_manage_classroom(classroom, user):
            raise ClassroomServiceError("คุณไม่มีสิทธิ์เปลี่ยนสถานะคอร์สนี้", 403, "Forbidden")

        target = cls.normalize_status(target_raw)
        current = classroom.status
        if target == current:
            return "สถานะคอร์สไม่มีการเปลี่ยนแปลง"

        if target in (COURSE_STATUS_ACTIVE, COURSE_STATUS_PENDING):
            if current == COURSE_STATUS_ACTIVE:
                raise ClassroomServiceError("คอร์สนี้เผยแพร่อยู่แล้ว", 409, "Conflict")
            if target == COURSE_STATUS_ACTIVE and cls.can_publish_directly(user):
                new_status = COURSE_STATUS_ACTIVE
            elif current == COURSE_STATUS_PENDING:
                raise ClassroomServiceError(
                    "คอร์สนี้รอผู้ดูแลตรวจสอบอยู่แล้ว", 409, "Conflict"
                )
            else:
                new_status = COURSE_STATUS_PENDING
        else:
            if current == COURSE_STATUS_ACTIVE and not cls.can_unpublish(user):
                raise ClassroomServiceError(
                    "คุณไม่มีสิทธิ์ยกเลิกการเผยแพร่คอร์ส กรุณาติดต่อผู้ดูแลระบบ", 403, "Forbidden"
                )
            new_status = target

        classroom.status = new_status
        if new_status in (COURSE_STATUS_ACTIVE, COURSE_STATUS_PENDING):
            classroom.review_note = None
        cls._log_status(user, classroom, "COURSE_STATUS_CHANGED", {"from": current, "to": new_status})

        is_owner = str(classroom.instructor_id) == str(user.user_id)
        if new_status == COURSE_STATUS_PENDING:
            cls._notify(
                cls._reviewer_ids(),
                "มีคอร์สรอตรวจสอบ",
                f'คอร์ส "{classroom.title}" ส่งขอเผยแพร่ กรุณาตรวจสอบก่อนเผยแพร่',
                classroom,
            )
            return "ส่งคอร์สให้ผู้ดูแลตรวจสอบแล้ว คอร์สจะเผยแพร่เมื่อได้รับการอนุมัติ"
        if new_status == COURSE_STATUS_ACTIVE:
            if current == COURSE_STATUS_PENDING and not is_owner:
                cls._notify(
                    [classroom.instructor_id],
                    "คอร์สได้รับการอนุมัติ",
                    f'คอร์ส "{classroom.title}" ได้รับการอนุมัติและเผยแพร่แล้ว',
                    classroom,
                )
                return "อนุมัติและเผยแพร่คอร์สแล้ว"
            return "เผยแพร่คอร์สแล้ว ผู้เรียนและผู้เยี่ยมชมเห็นคอร์สนี้ได้"
        if new_status == COURSE_STATUS_ARCHIVED:
            return "เก็บคอร์สถาวรแล้ว ผู้ที่ลงทะเบียนไว้ยังเข้าเรียนได้"
        if current == COURSE_STATUS_ARCHIVED:
            return "กู้คืนคอร์สเป็นฉบับร่างแล้ว"
        if current == COURSE_STATUS_PENDING:
            return "ยกเลิกคำขอเผยแพร่แล้ว คอร์สกลับเป็นฉบับร่าง"
        return "ยกเลิกการเผยแพร่แล้ว คอร์สกลับเป็นฉบับร่าง"

    @classmethod
    def _get_or_404(cls, classroom_id_raw: str) -> Classroom:
        try:
            c_uuid = uuid.UUID(str(classroom_id_raw))
        except (ValueError, TypeError):
            raise ClassroomServiceError("Invalid classroom ID format.", 400, "Bad Request")
        classroom = db.session.get(Classroom, c_uuid)
        if not classroom:
            raise ClassroomServiceError("Classroom not found.", 404, "Not Found")
        return classroom

    @classmethod
    def change_status(cls, classroom_id_raw: str, user: User | None, data: dict) -> dict:
        """POST /classrooms/<id>/status  { "status": "active" | "draft" | "archived" | "pending" }"""
        if not user:
            raise ClassroomServiceError("User not found.", 401, "Unauthorized")
        classroom = cls._get_or_404(classroom_id_raw)
        if not cls.can_view_classroom(classroom, user):
            raise ClassroomServiceError("Classroom not found.", 404, "Not Found")
        message = cls.apply_status_change(classroom, user, (data or {}).get("status"))
        db.session.commit()
        c_dict = classroom.to_dict()
        c_dict.update(cls.course_capabilities(classroom, user))
        return {"message": message, "classroom": c_dict, "course": c_dict}

    @classmethod
    def review_classroom(cls, classroom_id_raw: str, user: User | None, data: dict) -> dict:
        """POST /classrooms/<id>/review  { "approve": true } หรือ { "approve": false, "note": "เหตุผล" }
        ผู้ตรวจต้องจัดการคอร์สได้และมีสิทธิ์ courses.publish
        """
        if not user:
            raise ClassroomServiceError("User not found.", 401, "Unauthorized")
        classroom = cls._get_or_404(classroom_id_raw)
        if not cls.can_manage_classroom(classroom, user) or not cls.can_publish_directly(user):
            raise ClassroomServiceError("คุณไม่มีสิทธิ์อนุมัติการเผยแพร่คอร์ส", 403, "Forbidden")
        if classroom.status != COURSE_STATUS_PENDING:
            raise ClassroomServiceError("คอร์สนี้ไม่ได้อยู่ในสถานะรอตรวจสอบ", 409, "Conflict")

        data = data or {}
        if data.get("approve") is True:
            message = cls.apply_status_change(classroom, user, COURSE_STATUS_ACTIVE)
        elif data.get("approve") is False:
            note = str(data.get("note") or "").strip()
            if not note:
                raise ClassroomServiceError(
                    "กรุณาระบุเหตุผลที่ไม่อนุมัติ เพื่อให้ผู้สอนแก้ไขได้", 400, "Validation Error"
                )
            classroom.status = COURSE_STATUS_DRAFT
            classroom.review_note = note[:2000]
            cls._log_status(
                user, classroom, "COURSE_REVIEW_REJECTED",
                {"from": COURSE_STATUS_PENDING, "to": COURSE_STATUS_DRAFT, "note": classroom.review_note},
            )
            cls._notify(
                [classroom.instructor_id],
                "คอร์สไม่ได้รับการอนุมัติ",
                f'คอร์ส "{classroom.title}" ยังไม่ได้รับการอนุมัติ: {classroom.review_note}',
                classroom,
            )
            message = "ไม่อนุมัติการเผยแพร่ คอร์สกลับเป็นฉบับร่างพร้อมเหตุผลให้ผู้สอน"
        else:
            raise ClassroomServiceError("กรุณาระบุ approve เป็น true หรือ false", 400, "Validation Error")

        db.session.commit()
        c_dict = classroom.to_dict()
        c_dict.update(cls.course_capabilities(classroom, user))
        return {"message": message, "classroom": c_dict, "course": c_dict}

    # =========================================================================
    # 2. Classroom (Course) CRUD & Catalog
    # =========================================================================

    @classmethod
    def list_classrooms(cls, current_user: User | None, status_filter: str | None = None) -> dict:
        """
        แสดงรายการคอร์สเรียนทั้งหมดในระบบ (Course Catalog) (UAT-020, UAT-026)
        - Guest และผู้เรียน: เห็นเฉพาะคอร์สที่เผยแพร่แล้ว (active)
          + คอร์สที่ตัวเองลงทะเบียนไว้ แม้ถูกยกเลิกเผยแพร่หรือเก็บถาวรภายหลัง
          (ให้ "คอร์สเรียนของฉัน" ตรงกับ "คอร์สเรียนที่คุณกำลังเรียน" ในหน้าหลัก และตรงกับ can_view_classroom)
        - Instructor: เห็นคอร์สที่เผยแพร่แล้ว + คอร์สของตัวเองทุกสถานะ (ไม่เห็นฉบับร่างของคนอื่น)
        - Admin / Super Admin: เห็นทุกคอร์ส
        - status_filter (?status=draft ฯลฯ) ใช้กรองต่อจากสิทธิ์ข้างบน จึงขยายสิ่งที่มองเห็นไม่ได้
        - ตรวจสอบว่าผู้ใช้ปัจจุบันลงทะเบียนคอร์สใดไปแล้วบ้าง (is_enrolled)
        - ตรวจสอบความเป็นเจ้าของคอร์ส (is_owner)
        """
        query = Classroom.query

        is_admin = bool(current_user and (current_user.has_role("admin") or current_user.has_role("super_admin")))
        if not is_admin:
            visible = Classroom.status == COURSE_STATUS_ACTIVE
            if current_user and current_user.has_role("instructor"):
                visible = visible | (Classroom.instructor_id == current_user.user_id)
            if current_user:
                enrolled_ids = db.session.query(ClassroomMember.classroom_id).filter(
                    ClassroomMember.user_id == current_user.user_id
                )
                visible = visible | Classroom.classroom_id.in_(enrolled_ids)
            query = query.filter(visible)

        if status_filter:
            query = query.filter(Classroom.status == cls.normalize_status(status_filter))

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
            c_dict.update(cls.course_capabilities(c, current_user))
            results.append(c_dict)

        return {
            # สิ่งที่ผู้ใช้ทำได้ในระดับหน้า เช่น ตัวเลือกในฟอร์มสร้างคอร์ส
            "capabilities": {
                "can_publish": cls.can_publish_directly(current_user),
                "can_review": bool(is_admin and cls.can_publish_directly(current_user)),
            },
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
        # คอร์สใหม่เริ่มเป็นฉบับร่างเสมอ ถ้าขอสถานะอื่นจะเปลี่ยนผ่าน apply_status_change
        # (ผู้ไม่มีสิทธิ์ courses.publish ที่ขอเผยแพร่ จะกลายเป็นรอตรวจสอบ)
        requested_status = cls.normalize_status(data.get("status") or COURSE_STATUS_DRAFT)

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
            status=COURSE_STATUS_DRAFT
        )

        try:
            db.session.add(new_classroom)
            db.session.flush()
            message = "สร้างคอร์สเป็นฉบับร่างแล้ว"
            if requested_status != COURSE_STATUS_DRAFT:
                message = cls.apply_status_change(new_classroom, user, requested_status)
            db.session.commit()
        except ClassroomServiceError:
            db.session.rollback()
            raise
        except Exception:
            db.session.rollback()
            raise ClassroomServiceError("Failed to create classroom.", 500, "Internal Server Error")

        c_dict = new_classroom.to_dict(include_lessons=True)
        c_dict.update(cls.course_capabilities(new_classroom, user))
        return {"message": message, "classroom": c_dict, "course": c_dict}, 201

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
        # คอร์สที่ผู้ใช้ไม่มีสิทธิ์มองเห็น (เช่น Guest เปิดลิงก์ฉบับร่าง) ตอบเหมือนไม่มีคอร์สนี้
        # เพื่อไม่ให้รู้ได้ว่ามีคอร์สนี้อยู่
        if not classroom or not cls.can_view_classroom(classroom, current_user):
            raise ClassroomServiceError("Classroom not found.", 404, "Not Found")

        is_enrolled = False
        is_owner = False

        if current_user:
            is_enrolled = classroom.has_member(current_user.user_id)
            is_owner = (str(classroom.instructor_id) == str(current_user.user_id)) or current_user.has_role("admin")

        c_dict = classroom.to_dict(include_members=is_owner, include_lessons=True)
        c_dict["is_enrolled"] = is_enrolled
        c_dict["is_owner"] = is_owner
        c_dict.update(cls.course_capabilities(classroom, current_user))

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

        message = "Classroom updated successfully."
        if "status" in data:
            # เปลี่ยนสถานะผ่านกติกาเดียวกับปุ่มเผยแพร่ (ตรวจสิทธิ์ courses.publish / unpublish)
            message = cls.apply_status_change(classroom, user, data.get("status"))

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise ClassroomServiceError("Failed to update classroom.", 500, "Internal Server Error")
        c_dict = classroom.to_dict()
        c_dict.update(cls.course_capabilities(classroom, user))
        return {"message": message, "classroom": c_dict, "course": c_dict}

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
    def list_classroom_members(cls, classroom_id_raw: str, current_user: User | None = None) -> dict:
        """แสดงรายชื่อสมาชิกที่ลงทะเบียนในคอร์สเรียน
        - ผู้ที่มองไม่เห็นคอร์ส (เช่น คอร์สฉบับร่างของคนอื่น) จะได้ 404 เหมือน get_classroom
        - member_count ใช้ค่าเดียวกับ Classroom.to_dict เพื่อให้ทุกหน้าแสดงตัวเลขตรงกัน (ข้อ 30)
        """
        try:
            c_uuid = uuid.UUID(classroom_id_raw)
        except (ValueError, TypeError):
            raise ClassroomServiceError("Invalid classroom ID format.", 400, "Bad Request")

        classroom = db.session.get(Classroom, c_uuid)
        if not classroom or not cls.can_view_classroom(classroom, current_user):
            raise ClassroomServiceError("Classroom not found.", 404, "Not Found")

        members = [m.to_dict() for m in classroom.members]
        return {
            "classroom_id": str(classroom.classroom_id),
            "member_count": len(members),
            "members": members,
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

        if classroom.status != COURSE_STATUS_ACTIVE:
            raise ClassroomServiceError("คอร์สนี้ยังไม่เปิดให้ลงทะเบียน", 403, "Forbidden")

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

        # ข้อ 29: นับจำนวนเนื้อหา (Content) แยกจากจำนวนบทเรียน
        # Content ผูกกับ Episode (โครงสร้างใหม่) หรือผูกกับ Lesson ตรง ๆ (โครงสร้างเดิม)
        total_episodes = 0
        total_contents = 0
        if my_course_ids:
            lesson_ids_q = db.session.query(Lesson.lesson_id).filter(Lesson.classroom_id.in_(my_course_ids))
            episode_ids_q = db.session.query(Episode.episode_id).filter(Episode.lesson_id.in_(lesson_ids_q))
            total_episodes = (
                db.session.query(db.func.count(Episode.episode_id))
                .filter(Episode.lesson_id.in_(lesson_ids_q))
                .scalar() or 0
            )
            total_contents = (
                db.session.query(db.func.count(Content.content_id))
                .filter(db.or_(Content.episode_id.in_(episode_ids_q), Content.lesson_id.in_(lesson_ids_q)))
                .scalar() or 0
            )

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
            "totalEpisodes": total_episodes,
            "totalContents": total_contents,
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
