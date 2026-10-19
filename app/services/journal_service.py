import uuid
from app.extensions import db
from app.models.user import User
from app.models.classroom import Classroom, Episode, Journal
from app.utils.validators import validate_title


class JournalServiceError(Exception):
    """Base exception for journal domain operations."""
    def __init__(self, message: str, status_code: int = 400, error: str = "Bad Request"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error = error


class JournalService:
    """
    JournalService: Central business logic service for personal learning journals (UAT-031 to UAT-033).
    Handles journal lifecycle, student ownership isolation, admin oversight, and database transactions.
    """

    @classmethod
    def list_journals(
        cls,
        user: User | None,
        classroom_id: str | None = None,
        episode_id: str | None = None
    ) -> dict:
        """
        แสดงรายการบันทึกการเรียนรู้ทั้งหมดของผู้ใช้ปัจจุบัน (UAT-031, UAT-032)
        - กรองตาม classroom_id/course_id หรือ episode_id หากระบุ
        - บันทึกเป็นข้อมูลส่วนตัวของผู้เรียนแต่ละคน
        """
        if not user:
            raise JournalServiceError("User not found.", 401, "Unauthorized")

        query = Journal.query.filter_by(user_id=user.user_id)

        if classroom_id:
            try:
                c_uuid = uuid.UUID(classroom_id)
                query = query.filter_by(classroom_id=c_uuid)
            except (ValueError, TypeError):
                pass

        if episode_id:
            try:
                ep_uuid = uuid.UUID(episode_id)
                query = query.filter_by(episode_id=ep_uuid)
            except (ValueError, TypeError):
                pass

        journals = query.order_by(Journal.created_at.desc()).all()
        return {
            "journals": [j.to_dict() for j in journals]
        }

    @classmethod
    def create_journal(cls, user: User | None, data: dict) -> tuple[dict, int]:
        """
        สร้างบันทึกการเรียนรู้ใหม่ (UAT-031)
        - กำหนด title และ content เป็นฟิลด์บังคับ
        - สามารถเชื่อมโยงกับ classroom_id (คอร์ส) หรือ episode_id (ตอนย่อย) ได้
        """
        if not user:
            raise JournalServiceError("User not found.", 401, "Unauthorized")

        if not data or not isinstance(data, dict):
            raise JournalServiceError("JSON body is required.", 400, "Bad Request")

        title = data.get("title")
        is_valid_title, title_err = validate_title(title, field_name="Journal title")
        if not is_valid_title:
            raise JournalServiceError(title_err, 400, "Validation Error")

        content = data.get("content")
        if not content or not str(content).strip():
            raise JournalServiceError("Journal content is required.", 400, "Validation Error")

        # จัดการ Foreign Key classroom_id ถ้ามีส่งมา
        c_uuid = None
        classroom_id = data.get("classroom_id") or data.get("course_id")
        if classroom_id:
            try:
                c_uuid = uuid.UUID(classroom_id)
                if not db.session.get(Classroom, c_uuid):
                    c_uuid = None
            except (ValueError, TypeError):
                c_uuid = None

        # จัดการ Foreign Key episode_id ถ้ามีส่งมา
        ep_uuid = None
        episode_id = data.get("episode_id")
        if episode_id:
            try:
                ep_uuid = uuid.UUID(episode_id)
                if not db.session.get(Episode, ep_uuid):
                    ep_uuid = None
            except (ValueError, TypeError):
                ep_uuid = None

        new_journal = Journal(
            user_id=user.user_id,
            classroom_id=c_uuid,
            episode_id=ep_uuid,
            title=title.strip(),
            content=str(content).strip()
        )

        try:
            db.session.add(new_journal)
            db.session.commit()
            return {
                "message": "Journal created successfully.",
                "journal": new_journal.to_dict()
            }, 201
        except Exception:
            db.session.rollback()
            raise JournalServiceError("Failed to create journal.", 500, "Internal Server Error")

    @classmethod
    def get_journal(cls, journal_id: str, user: User | None) -> dict:
        """
        ดึงรายละเอียดบันทึกการเรียนรู้ (ต้องเป็นเจ้าของบันทึก หรือ Admin / Super Admin) (UAT-031, UAT-032)
        """
        if not user:
            raise JournalServiceError("User not found.", 401, "Unauthorized")

        try:
            j_uuid = uuid.UUID(journal_id)
        except (ValueError, TypeError):
            raise JournalServiceError("Invalid journal ID format.", 400, "Bad Request")

        journal = db.session.get(Journal, j_uuid)
        if not journal:
            raise JournalServiceError("Journal not found.", 404, "Not Found")

        # ตรวจสอบความเป็นเจ้าของและการเข้าถึง
        if str(journal.user_id) != str(user.user_id) and not (user.has_role("admin") or user.has_role("super_admin")):
            raise JournalServiceError("Access denied: this journal belongs to another user.", 403, "Forbidden")

        return {
            "journal": journal.to_dict()
        }

    @classmethod
    def update_journal(cls, journal_id: str, user: User | None, data: dict) -> dict:
        """
        แก้ไขบันทึกการเรียนรู้ (UAT-031)
        - ตรวจสอบความเป็นเจ้าของ หรือ สิทธิ์ Admin / Super Admin
        """
        if not user:
            raise JournalServiceError("User not found.", 401, "Unauthorized")

        try:
            j_uuid = uuid.UUID(journal_id)
        except (ValueError, TypeError):
            raise JournalServiceError("Invalid journal ID format.", 400, "Bad Request")

        journal = db.session.get(Journal, j_uuid)
        if not journal:
            raise JournalServiceError("Journal not found.", 404, "Not Found")

        if str(journal.user_id) != str(user.user_id) and not (user.has_role("admin") or user.has_role("super_admin")):
            raise JournalServiceError("Access denied: this journal belongs to another user.", 403, "Forbidden")

        if not data or not isinstance(data, dict):
            raise JournalServiceError("JSON body is required.", 400, "Bad Request")

        if "title" in data:
            is_valid_title, title_err = validate_title(data.get("title"), field_name="Journal title")
            if not is_valid_title:
                raise JournalServiceError(title_err, 400, "Validation Error")
            journal.title = data.get("title").strip()

        if "content" in data:
            content = data.get("content")
            if not content or not str(content).strip():
                raise JournalServiceError("Journal content cannot be empty.", 400, "Validation Error")
            journal.content = str(content).strip()

        if "classroom_id" in data or "course_id" in data:
            cid = data.get("classroom_id") or data.get("course_id")
            if cid:
                try:
                    journal.classroom_id = uuid.UUID(cid)
                except (ValueError, TypeError):
                    pass
            else:
                journal.classroom_id = None

        if "episode_id" in data:
            epid = data.get("episode_id")
            if epid:
                try:
                    journal.episode_id = uuid.UUID(epid)
                except (ValueError, TypeError):
                    pass
            else:
                journal.episode_id = None

        try:
            db.session.commit()
            return {
                "message": "Journal updated successfully.",
                "journal": journal.to_dict()
            }
        except Exception:
            db.session.rollback()
            raise JournalServiceError("Failed to update journal.", 500, "Internal Server Error")

    @classmethod
    def delete_journal(cls, journal_id: str, user: User | None) -> dict:
        """
        ลบบันทึกการเรียนรู้ (UAT-031)
        - ตรวจสอบความเป็นเจ้าของ หรือ สิทธิ์ Admin / Super Admin
        """
        if not user:
            raise JournalServiceError("User not found.", 401, "Unauthorized")

        try:
            j_uuid = uuid.UUID(journal_id)
        except (ValueError, TypeError):
            raise JournalServiceError("Invalid journal ID format.", 400, "Bad Request")

        journal = db.session.get(Journal, j_uuid)
        if not journal:
            raise JournalServiceError("Journal not found.", 404, "Not Found")

        if str(journal.user_id) != str(user.user_id) and not (user.has_role("admin") or user.has_role("super_admin")):
            raise JournalServiceError("Access denied: this journal belongs to another user.", 403, "Forbidden")

        try:
            db.session.delete(journal)
            db.session.commit()
            return {
                "message": "Journal deleted successfully."
            }
        except Exception:
            db.session.rollback()
            raise JournalServiceError("Failed to delete journal.", 500, "Internal Server Error")
