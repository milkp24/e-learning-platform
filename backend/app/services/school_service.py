import uuid
from sqlalchemy import func, or_
from app.extensions import db
from app.models.school import School, SchoolClassroom, SchoolUser
from app.models.user import User, UserProfile
from app.models.admin import AuditLog
from app.utils.validators import validate_email, validate_phone
from flask import current_app
from app.utils.errors import INTERNAL_ERROR_MESSAGE


class SchoolServiceError(Exception):
    """Base exception for school service operations."""
    def __init__(self, message: str, status_code: int = 400, error: str = "Bad Request"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error = error


class SchoolService:
    """
    SchoolService: Central business logic service for School Management (Module 9.2).
    Encapsulates School CRUD, School Classrooms, School Members,
    Scoped Admin isolation, IDOR protection, and Audit Logging.
    """

    # =========================================================================
    # 1. Authorization & Scoped Admin Isolation Helper
    # =========================================================================

    @staticmethod
    def check_school_access(caller: User, school_id: uuid.UUID, required_perm: str = None) -> None:
        """
        ตรวจสอบสิทธิ์และป้องกัน IDOR ในการจัดการโรงเรียน:
        - Caller ต้องมี permission ตาม Dynamic Permission Matrix
        - Super Admin มีสิทธิ์จัดการทุกโรงเรียน
        - หาก Caller มีประวัติสังกัดโรงเรียนใน school_users ต้องเป็น admin ของโรงเรียนนั้น
        """
        if not caller:
            raise SchoolServiceError("Caller not found.", 401, "Unauthorized")

        if required_perm and not caller.has_permission(required_perm):
            raise SchoolServiceError(f"Access denied. Requires permission: {required_perm}.", 403, "Forbidden")

        if caller.has_role("super_admin"):
            return

        # Scoped Admin check: หากเป็น Admin ที่ผูกกับโรงเรียนเฉพาะ
        caller_memberships = SchoolUser.query.filter_by(user_id=caller.user_id).all()
        if caller_memberships:
            matching = [m for m in caller_memberships if str(m.school_id) == str(school_id)]
            if not matching or matching[0].role != "admin":
                raise SchoolServiceError("Access denied. You do not have permission to manage this school.", 403, "Forbidden")

    # =========================================================================
    # 2. School Core CRUD
    # =========================================================================

    @classmethod
    def list_schools(cls, caller: User, search: str = "", status_filter: str = "", page: int = 1, per_page: int = 10) -> dict:
        """
        แสดงรายการโรงเรียนและสถานศึกษาทั้งหมด พร้อมการค้นหา กรองสถานะ และ Pagination
        - ตรวจสอบสิทธิ์ schools.view ผ่าน Dynamic Permission Matrix
        - ดึงข้อมูลจาก PostgreSQL จริง พร้อมนับจำนวน classrooms และ members จริง
        """
        if not caller:
            raise SchoolServiceError("Caller not found.", 401, "Unauthorized")
        if not caller.has_permission("schools.view"):
            raise SchoolServiceError("Access denied. Requires permission: schools.view.", 403, "Forbidden")

        page = max(1, page)
        per_page = min(100, max(1, per_page))

        query = School.query
        if search:
            search_term = f"%{search.lower()}%"
            query = query.filter(
                or_(
                    func.lower(School.name).like(search_term),
                    func.lower(School.code).like(search_term),
                    func.lower(School.contact_email).like(search_term)
                )
            )
        if status_filter in ["active", "inactive"]:
            query = query.filter_by(status=status_filter)

        total = query.count()
        schools = query.order_by(School.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
        pages = max(1, (total + per_page - 1) // per_page)

        results = []
        for s in schools:
            item = s.to_dict()
            item["classroom_count"] = s.classrooms.count()
            item["member_count"] = s.school_users.count()
            results.append(item)

        return {
            "schools": results,
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": pages
        }

    @classmethod
    def get_school_detail(cls, caller: User, school_id_raw: str | uuid.UUID) -> dict:
        """
        ดึงข้อมูลรายละเอียดของโรงเรียน พร้อมรายการห้องเรียน สมาชิก และการตั้งค่า
        - ตรวจสอบสิทธิ์ schools.view ผ่าน Dynamic Permission Matrix
        """
        if not caller:
            raise SchoolServiceError("Caller not found.", 401, "Unauthorized")
        if not caller.has_permission("schools.view"):
            raise SchoolServiceError("Access denied. Requires permission: schools.view.", 403, "Forbidden")

        try:
            s_uuid = uuid.UUID(str(school_id_raw))
        except (ValueError, TypeError):
            raise SchoolServiceError("Invalid school ID format.", 400, "Bad Request")

        school = db.session.get(School, s_uuid)
        if not school:
            raise SchoolServiceError("School not found.", 404, "Not Found")

        school_data = school.to_dict()
        school_data["classroom_count"] = school.classrooms.count()
        school_data["member_count"] = school.school_users.count()
        school_data["classrooms"] = [
            {**c.to_dict(), "student_count": c.students.count()}
            for c in school.classrooms.order_by(SchoolClassroom.classroom_name.asc()).all()
        ]
        school_data["settings"] = [st.to_dict() for st in school.settings.all()]

        return {"school": school_data}

    @classmethod
    def create_school(cls, caller: User, data: dict, ip_address: str = "127.0.0.1") -> tuple[dict, int]:
        """
        สร้างโรงเรียนใหม่
        - ตรวจสอบสิทธิ์ schools.create ผ่าน Dynamic Permission Matrix
        - Validation: name (required, min 2 chars), code (optional, unique if provided), email validation
        - บันทึก Audit Log (SCHOOL_CREATED)
        """
        if not caller:
            raise SchoolServiceError("Caller not found.", 401, "Unauthorized")
        if not caller.has_permission("schools.create"):
            raise SchoolServiceError("Access denied. Requires permission: schools.create.", 403, "Forbidden")

        if not data or not isinstance(data, dict):
            raise SchoolServiceError("Invalid JSON payload.", 400, "Bad Request")
        _check_school_fields(data)

        name = str(data.get("name") or "").strip()
        code = str(data.get("code") or "").strip() if data.get("code") else None
        address = str(data.get("address") or "").strip() if data.get("address") else None
        contact_email = str(data.get("contact_email") or "").strip().lower() if data.get("contact_email") else None
        contact_phone = str(data.get("contact_phone") or "").strip() if data.get("contact_phone") else None
        status = str(data.get("status") or "active").strip().lower()

        if not name or len(name) < 2:
            raise SchoolServiceError("ชื่อโรงเรียนต้องมีความยาวอย่างน้อย 2 ตัวอักษร", 400, "Validation Error")

        if code:
            existing_code = School.query.filter(func.lower(School.code) == code.lower()).first()
            if existing_code:
                raise SchoolServiceError(f"รหัสโรงเรียน '{code}' มีอยู่ในระบบแล้ว", 409, "Conflict")

        if contact_email:
            is_valid_email, email_err = validate_email(contact_email)
            if not is_valid_email:
                raise SchoolServiceError(email_err or "รูปแบบอีเมลติดต่อไม่ถูกต้อง", 400, "Validation Error")

        if status not in ["active", "inactive"]:
            status = "active"

        try:
            new_school = School(
                name=name,
                code=code,
                address=address,
                contact_email=contact_email,
                contact_phone=contact_phone,
                status=status
            )
            db.session.add(new_school)
            db.session.flush()

            audit = AuditLog(
                user_id=caller.user_id,
                action="SCHOOL_CREATED",
                entity_type="school",
                entity_id=new_school.school_id,
                details={
                    "school_name": new_school.name,
                    "school_code": new_school.code,
                    "status": new_school.status,
                    "creator_email": caller.email
                },
                ip_address=ip_address or "127.0.0.1"
            )
            db.session.add(audit)
            db.session.commit()

            result = new_school.to_dict()
            result["classroom_count"] = 0
            result["member_count"] = 0
            return {
                "message": "สร้างโรงเรียนใหม่เรียบร้อยแล้ว",
                "school": result
            }, 201
        except SchoolServiceError:
            db.session.rollback()
            raise
        except Exception as e:
            db.session.rollback()
            current_app.logger.exception("School service error: %s", e)
            raise SchoolServiceError(INTERNAL_ERROR_MESSAGE, 500, "Internal Server Error")

    @classmethod
    def update_school(cls, caller: User, school_id_raw: str | uuid.UUID, data: dict, ip_address: str = "127.0.0.1") -> tuple[dict, int]:
        """
        แก้ไขข้อมูลโรงเรียน
        - ตรวจสอบสิทธิ์ schools.edit ผ่าน Dynamic Permission Matrix
        - Validation: name, code uniqueness, email format, status
        - บันทึก Audit Log (SCHOOL_UPDATED)
        """
        if not caller:
            raise SchoolServiceError("Caller not found.", 401, "Unauthorized")
        if not caller.has_permission("schools.edit"):
            raise SchoolServiceError("Access denied. Requires permission: schools.edit.", 403, "Forbidden")

        try:
            s_uuid = uuid.UUID(str(school_id_raw))
        except (ValueError, TypeError):
            raise SchoolServiceError("Invalid school ID format.", 400, "Bad Request")

        school = db.session.get(School, s_uuid)
        if not school:
            raise SchoolServiceError("School not found.", 404, "Not Found")

        if not data or not isinstance(data, dict):
            raise SchoolServiceError("Invalid JSON payload.", 400, "Bad Request")

        _check_school_fields(data, current_school_id=school.school_id)

        changed = {}
        if "name" in data:
            name = str(data["name"] or "").strip()
            if len(name) < 2:
                raise SchoolServiceError("ชื่อโรงเรียนต้องมีความยาวอย่างน้อย 2 ตัวอักษร", 400, "Validation Error")
            if name != school.name:
                changed["name"] = {"from": school.name, "to": name}
                school.name = name

        if "code" in data:
            code = str(data["code"] or "").strip() if data["code"] else None
            if code != school.code:
                if code:
                    existing_code = School.query.filter(
                        func.lower(School.code) == code.lower(),
                        School.school_id != school.school_id
                    ).first()
                    if existing_code:
                        raise SchoolServiceError(f"รหัสโรงเรียน '{code}' มีอยู่ในระบบแล้ว", 409, "Conflict")
                changed["code"] = {"from": school.code, "to": code}
                school.code = code

        if "address" in data:
            address = str(data["address"] or "").strip() if data["address"] else None
            if address != school.address:
                changed["address"] = {"from": school.address, "to": address}
                school.address = address

        if "contact_email" in data:
            email = str(data["contact_email"] or "").strip().lower() if data["contact_email"] else None
            if email:
                is_valid, err = validate_email(email)
                if not is_valid:
                    raise SchoolServiceError(err or "รูปแบบอีเมลไม่ถูกต้อง", 400, "Validation Error")
            if email != school.contact_email:
                changed["contact_email"] = {"from": school.contact_email, "to": email}
                school.contact_email = email

        if "contact_phone" in data:
            phone = str(data["contact_phone"] or "").strip() if data["contact_phone"] else None
            if phone != school.contact_phone:
                changed["contact_phone"] = {"from": school.contact_phone, "to": phone}
                school.contact_phone = phone

        if "status" in data:
            st = str(data["status"] or "").strip().lower()
            if st in ["active", "inactive"] and st != school.status:
                changed["status"] = {"from": school.status, "to": st}
                school.status = st

        if not changed:
            result = school.to_dict()
            result["classroom_count"] = school.classrooms.count()
            result["member_count"] = school.school_users.count()
            return {"message": "ไม่มีการเปลี่ยนแปลงข้อมูล", "school": result}, 200

        try:
            audit = AuditLog(
                user_id=caller.user_id,
                action="SCHOOL_UPDATED",
                entity_type="school",
                entity_id=school.school_id,
                details={
                    "school_name": school.name,
                    "changes": changed,
                    "updater_email": caller.email
                },
                ip_address=ip_address or "127.0.0.1"
            )
            db.session.add(audit)
            db.session.commit()

            result = school.to_dict()
            result["classroom_count"] = school.classrooms.count()
            result["member_count"] = school.school_users.count()
            return {
                "message": "อัปเดตข้อมูลโรงเรียนเรียบร้อยแล้ว",
                "school": result
            }, 200
        except SchoolServiceError:
            db.session.rollback()
            raise
        except Exception as e:
            db.session.rollback()
            current_app.logger.exception("School service error: %s", e)
            raise SchoolServiceError(INTERNAL_ERROR_MESSAGE, 500, "Internal Server Error")

    @classmethod
    def delete_school(cls, caller: User, school_id_raw: str | uuid.UUID, ip_address: str = "127.0.0.1") -> tuple[dict, int]:
        """
        ลบโรงเรียน
        - ตรวจสอบสิทธิ์ schools.delete ผ่าน Dynamic Permission Matrix (Super Admin)
        - Safety guard: ป้องกันการลบโรงเรียนที่มีห้องเรียนหรือสมาชิกอยู่
        - บันทึก Audit Log (SCHOOL_DELETED_PERMANENT)
        """
        if not caller:
            raise SchoolServiceError("Caller not found.", 401, "Unauthorized")
        if not caller.has_permission("schools.delete"):
            raise SchoolServiceError("Access denied. Requires permission: schools.delete.", 403, "Forbidden")

        try:
            s_uuid = uuid.UUID(str(school_id_raw))
        except (ValueError, TypeError):
            raise SchoolServiceError("Invalid school ID format.", 400, "Bad Request")

        school = db.session.get(School, s_uuid)
        if not school:
            raise SchoolServiceError("School not found.", 404, "Not Found")

        classroom_count = school.classrooms.count()
        member_count = school.school_users.count()
        if classroom_count > 0 or member_count > 0:
            raise SchoolServiceError(
                f"ไม่สามารถลบโรงเรียน '{school.name}' ได้เนื่องจากยังมี {classroom_count} ห้องเรียน และ {member_count} สมาชิกผูกอยู่ กรุณาระงับการใช้งาน (ปรับสถานะเป็น Inactive) หรือย้ายข้อมูลก่อน",
                409,
                "Conflict"
            )

        try:
            audit = AuditLog(
                user_id=caller.user_id,
                action="SCHOOL_DELETED_PERMANENT",
                entity_type="school",
                entity_id=school.school_id,
                details={
                    "school_name": school.name,
                    "school_code": school.code,
                    "deleted_by": caller.email
                },
                ip_address=ip_address or "127.0.0.1"
            )
            db.session.add(audit)
            db.session.delete(school)
            db.session.commit()

            return {
                "message": f"ลบโรงเรียน '{school.name}' ออกจากระบบเรียบร้อยแล้ว",
                "school_id": str(s_uuid)
            }, 200
        except SchoolServiceError:
            db.session.rollback()
            raise
        except Exception as e:
            db.session.rollback()
            current_app.logger.exception("School service error: %s", e)
            raise SchoolServiceError(INTERNAL_ERROR_MESSAGE, 500, "Internal Server Error")

    # =========================================================================
    # 3. School Classroom Management
    # =========================================================================

    @classmethod
    def list_school_classrooms(cls, caller: User, school_id_raw: str | uuid.UUID, search: str = "", status_filter: str = "") -> dict:
        """
        แสดงรายการห้องเรียนทั้งหมดภายใต้โรงเรียนที่ระบุ
        - ตรวจสอบสิทธิ์ schools.view
        """
        try:
            s_uuid = uuid.UUID(str(school_id_raw))
        except (ValueError, TypeError):
            raise SchoolServiceError("Invalid school ID format.", 400, "Bad Request")

        cls.check_school_access(caller, s_uuid, "schools.view")

        school = db.session.get(School, s_uuid)
        if not school:
            raise SchoolServiceError("School not found.", 404, "Not Found")

        query = SchoolClassroom.query.filter_by(school_id=s_uuid)
        if search:
            query = query.filter(func.lower(SchoolClassroom.classroom_name).like(f"%{search.lower()}%"))
        if status_filter in ["active", "inactive"]:
            query = query.filter_by(status=status_filter)

        classrooms = query.order_by(SchoolClassroom.classroom_name.asc()).all()
        results = [
            {
                **c.to_dict(),
                "student_count": c.students.count()
            }
            for c in classrooms
        ]

        return {
            "school_id": str(s_uuid),
            "school_name": school.name,
            "classrooms": results,
            "total": len(results)
        }

    @classmethod
    def create_school_classroom(cls, caller: User, school_id_raw: str | uuid.UUID, data: dict, ip_address: str = "127.0.0.1") -> tuple[dict, int]:
        """
        สร้างห้องเรียนใหม่ภายใต้โรงเรียน
        - ตรวจสอบสิทธิ์ schools.edit
        - ตรวจสอบความถูกต้องของข้อมูล (ชื่อห้องเรียน, ปีการศึกษา)
        - ป้องกันชื่อห้องเรียนซ้ำในปีการศึกษาเดียวกัน
        - บันทึก Audit Log (CLASSROOM_CREATED)
        """
        try:
            s_uuid = uuid.UUID(str(school_id_raw))
        except (ValueError, TypeError):
            raise SchoolServiceError("Invalid school ID format.", 400, "Bad Request")

        cls.check_school_access(caller, s_uuid, "schools.edit")

        school = db.session.get(School, s_uuid)
        if not school:
            raise SchoolServiceError("School not found.", 404, "Not Found")

        if not data or not isinstance(data, dict):
            raise SchoolServiceError("Invalid JSON payload.", 400, "Bad Request")
        _check_classroom_text_fields(data)

        classroom_name = str(data.get("classroom_name") or "").strip()
        grade_level = str(data.get("grade_level") or "").strip() if data.get("grade_level") else None
        academic_year = str(data.get("academic_year") or "").strip() if data.get("academic_year") else None
        status = str(data.get("status") or "active").strip().lower()

        if not classroom_name or len(classroom_name) < 1 or len(classroom_name) > 100:
            raise SchoolServiceError("ชื่อห้องเรียนต้องมีความยาว 1-100 ตัวอักษร", 400, "Validation Error")

        if status not in ["active", "inactive"]:
            status = "active"

        dup_query = SchoolClassroom.query.filter(
            SchoolClassroom.school_id == s_uuid,
            func.lower(SchoolClassroom.classroom_name) == classroom_name.lower()
        )
        if academic_year:
            dup_query = dup_query.filter(SchoolClassroom.academic_year == academic_year)
        else:
            dup_query = dup_query.filter(SchoolClassroom.academic_year.is_(None))

        if dup_query.first():
            raise SchoolServiceError(f"ห้องเรียน '{classroom_name}' ในปีการศึกษานี้มีอยู่แล้วในโรงเรียน", 409, "Conflict")

        try:
            new_classroom = SchoolClassroom(
                school_id=s_uuid,
                classroom_name=classroom_name,
                grade_level=grade_level,
                academic_year=academic_year,
                status=status
            )
            db.session.add(new_classroom)
            db.session.flush()

            audit = AuditLog(
                user_id=caller.user_id,
                action="CLASSROOM_CREATED",
                entity_type="classroom",
                entity_id=new_classroom.classroom_id,
                details={
                    "school_id": str(s_uuid),
                    "school_name": school.name,
                    "classroom_name": new_classroom.classroom_name,
                    "grade_level": new_classroom.grade_level,
                    "academic_year": new_classroom.academic_year,
                    "status": new_classroom.status,
                    "created_by": caller.email
                },
                ip_address=ip_address or "127.0.0.1"
            )
            db.session.add(audit)
            db.session.commit()

            result = new_classroom.to_dict()
            result["student_count"] = 0
            return {
                "message": "สร้างห้องเรียนเรียบร้อยแล้ว",
                "classroom": result
            }, 201
        except SchoolServiceError:
            db.session.rollback()
            raise
        except Exception as e:
            db.session.rollback()
            current_app.logger.exception("School service error: %s", e)
            raise SchoolServiceError(INTERNAL_ERROR_MESSAGE, 500, "Internal Server Error")

    @classmethod
    def update_school_classroom(cls, caller: User, school_id_raw: str | uuid.UUID, classroom_id_raw: str | uuid.UUID, data: dict, ip_address: str = "127.0.0.1") -> tuple[dict, int]:
        """
        แก้ไขข้อมูลห้องเรียน
        - ตรวจสอบสิทธิ์ schools.edit
        - IDOR Protection: ตรวจสอบว่าห้องเรียนสังกัด school_id ที่ระบุจริง
        - บันทึก Audit Log (CLASSROOM_UPDATED)
        """
        try:
            s_uuid = uuid.UUID(str(school_id_raw))
            c_uuid = uuid.UUID(str(classroom_id_raw))
        except (ValueError, TypeError):
            raise SchoolServiceError("Invalid ID format.", 400, "Bad Request")

        cls.check_school_access(caller, s_uuid, "schools.edit")

        school = db.session.get(School, s_uuid)
        if not school:
            raise SchoolServiceError("School not found.", 404, "Not Found")

        classroom = db.session.get(SchoolClassroom, c_uuid)
        if not classroom:
            raise SchoolServiceError("Classroom not found.", 404, "Not Found")

        if str(classroom.school_id) != str(s_uuid):
            raise SchoolServiceError("ห้องเรียนไม่ได้สังกัดโรงเรียนที่ระบุ", 400, "Bad Request")

        if not data or not isinstance(data, dict):
            raise SchoolServiceError("Invalid JSON payload.", 400, "Bad Request")

        changed = {}
        _check_classroom_text_fields(data)

        if "classroom_name" in data:
            name = str(data["classroom_name"] or "").strip()
            if not name or len(name) > 100:
                raise SchoolServiceError("ชื่อห้องเรียนต้องมีความยาว 1-100 ตัวอักษร", 400, "Validation Error")
            if name != classroom.classroom_name:
                changed["classroom_name"] = {"from": classroom.classroom_name, "to": name}
                classroom.classroom_name = name

        if "grade_level" in data:
            grade = str(data["grade_level"] or "").strip() if data["grade_level"] else None
            if grade != classroom.grade_level:
                changed["grade_level"] = {"from": classroom.grade_level, "to": grade}
                classroom.grade_level = grade

        if "academic_year" in data:
            year = str(data["academic_year"] or "").strip() if data["academic_year"] else None
            if year != classroom.academic_year:
                changed["academic_year"] = {"from": classroom.academic_year, "to": year}
                classroom.academic_year = year

        if "status" in data:
            st = str(data["status"] or "").strip().lower()
            if st in ["active", "inactive"] and st != classroom.status:
                changed["status"] = {"from": classroom.status, "to": st}
                classroom.status = st

        if not changed:
            result = classroom.to_dict()
            result["student_count"] = classroom.students.count()
            return {"message": "ไม่มีการเปลี่ยนแปลงข้อมูล", "classroom": result}, 200

        try:
            audit = AuditLog(
                user_id=caller.user_id,
                action="CLASSROOM_UPDATED",
                entity_type="classroom",
                entity_id=classroom.classroom_id,
                details={
                    "school_id": str(s_uuid),
                    "classroom_id": str(c_uuid),
                    "changes": changed,
                    "updater_email": caller.email
                },
                ip_address=ip_address or "127.0.0.1"
            )
            db.session.add(audit)
            db.session.commit()

            result = classroom.to_dict()
            result["student_count"] = classroom.students.count()
            return {
                "message": "อัปเดตข้อมูลห้องเรียนเรียบร้อยแล้ว",
                "classroom": result
            }, 200
        except SchoolServiceError:
            db.session.rollback()
            raise
        except Exception as e:
            db.session.rollback()
            current_app.logger.exception("School service error: %s", e)
            raise SchoolServiceError(INTERNAL_ERROR_MESSAGE, 500, "Internal Server Error")

    @classmethod
    def delete_school_classroom(cls, caller: User, school_id_raw: str | uuid.UUID, classroom_id_raw: str | uuid.UUID, ip_address: str = "127.0.0.1") -> tuple[dict, int]:
        """
        ลบห้องเรียน
        - ตรวจสอบสิทธิ์ schools.edit
        - IDOR Protection: ตรวจสอบว่าห้องเรียนสังกัด school_id ที่ระบุ
        - Business Rule Safety Check: ป้องกันการลบหากมีนักเรียนผูกอยู่ (409 Conflict)
        - บันทึก Audit Log (CLASSROOM_DELETED)
        """
        try:
            s_uuid = uuid.UUID(str(school_id_raw))
            c_uuid = uuid.UUID(str(classroom_id_raw))
        except (ValueError, TypeError):
            raise SchoolServiceError("Invalid ID format.", 400, "Bad Request")

        cls.check_school_access(caller, s_uuid, "schools.edit")

        school = db.session.get(School, s_uuid)
        if not school:
            raise SchoolServiceError("School not found.", 404, "Not Found")

        classroom = db.session.get(SchoolClassroom, c_uuid)
        if not classroom:
            raise SchoolServiceError("Classroom not found.", 404, "Not Found")

        if str(classroom.school_id) != str(s_uuid):
            raise SchoolServiceError("ห้องเรียนไม่ได้สังกัดโรงเรียนที่ระบุ", 400, "Bad Request")

        student_count = classroom.students.count()
        if student_count > 0:
            raise SchoolServiceError(
                f"ไม่สามารถลบห้องเรียน '{classroom.classroom_name}' ได้เนื่องจากมี {student_count} นักเรียนผูกอยู่ กรุณาระงับการใช้งาน (ปรับสถานะเป็น Inactive) แทน",
                409,
                "Conflict"
            )

        try:
            audit = AuditLog(
                user_id=caller.user_id,
                action="CLASSROOM_DELETED",
                entity_type="classroom",
                entity_id=classroom.classroom_id,
                details={
                    "school_id": str(s_uuid),
                    "classroom_name": classroom.classroom_name,
                    "deleted_by": caller.email
                },
                ip_address=ip_address or "127.0.0.1"
            )
            db.session.add(audit)
            db.session.delete(classroom)
            db.session.commit()

            return {
                "message": f"ลบห้องเรียน '{classroom.classroom_name}' ออกจากระบบเรียบร้อยแล้ว",
                "classroom_id": str(c_uuid)
            }, 200
        except SchoolServiceError:
            db.session.rollback()
            raise
        except Exception as e:
            db.session.rollback()
            current_app.logger.exception("School service error: %s", e)
            raise SchoolServiceError(INTERNAL_ERROR_MESSAGE, 500, "Internal Server Error")

    # =========================================================================
    # 4. School Membership Management
    # =========================================================================

    @classmethod
    def list_school_members(cls, caller: User, school_id_raw: str | uuid.UUID, search: str = "", role_filter: str = "") -> dict:
        """
        แสดงรายชื่อสมาชิกทั้งหมดของโรงเรียน (SchoolUser + User + Profile)
        - ตรวจสอบสิทธิ์ schools.view
        - รองรับการค้นหาตามชื่อ/อีเมล และการกรองตามบทบาทในโรงเรียน
        """
        try:
            s_uuid = uuid.UUID(str(school_id_raw))
        except (ValueError, TypeError):
            raise SchoolServiceError("Invalid school ID format.", 400, "Bad Request")

        cls.check_school_access(caller, s_uuid, "schools.view")

        school = db.session.get(School, s_uuid)
        if not school:
            raise SchoolServiceError("School not found.", 404, "Not Found")

        query = SchoolUser.query.filter_by(school_id=s_uuid)
        if role_filter:
            query = query.filter_by(role=role_filter)

        members = query.order_by(SchoolUser.joined_at.desc()).all()
        results = []
        for m in members:
            u = m.user
            if not u:
                continue
            profile = u.profile
            display_name = (profile.display_name if profile and profile.display_name else None) or u.email

            if search:
                match_name = display_name and search in display_name.lower()
                match_email = u.email and search in u.email.lower()
                if not (match_name or match_email):
                    continue

            results.append({
                "school_user_id": str(m.school_user_id),
                "school_id": str(m.school_id),
                "user_id": str(m.user_id),
                "email": u.email,
                "display_name": display_name,
                "first_name": profile.first_name if profile else None,
                "last_name": profile.last_name if profile else None,
                "school_role": m.role,
                "user_status": u.status,
                "joined_at": m.joined_at.isoformat() if m.joined_at else None,
            })

        return {
            "school_id": str(s_uuid),
            "school_name": school.name,
            "members": results,
            "total": len(results)
        }

    @classmethod
    def add_school_member(cls, caller: User, school_id_raw: str | uuid.UUID, data: dict, ip_address: str = "127.0.0.1") -> tuple[dict, int]:
        """
        เพิ่มสมาชิกเข้าโรงเรียนจากบัญชี User ที่มีอยู่จริงในระบบ
        - ตรวจสอบสิทธิ์ schools.edit
        - เลือก User จากระบบจริง
        - ตรวจสอบว่ายังไม่ได้เป็นสมาชิกในโรงเรียนนี้
        - ไม่กระทบ Global System Role ของ User
        - บันทึก Audit Log (SCHOOL_MEMBER_ADDED)
        """
        try:
            s_uuid = uuid.UUID(str(school_id_raw))
        except (ValueError, TypeError):
            raise SchoolServiceError("Invalid school ID format.", 400, "Bad Request")

        cls.check_school_access(caller, s_uuid, "schools.edit")

        school = db.session.get(School, s_uuid)
        if not school:
            raise SchoolServiceError("School not found.", 404, "Not Found")

        if not data or not isinstance(data, dict):
            raise SchoolServiceError("Invalid JSON payload.", 400, "Bad Request")

        user_id_raw = data.get("user_id")
        email_raw = data.get("email")
        role = str(data.get("role") or "member").strip().lower()

        allowed_roles = {"admin", "teacher", "student", "member"}
        if role not in allowed_roles:
            raise SchoolServiceError(f"บทบาทไม่ถูกต้อง เลือกได้จาก: {', '.join(sorted(allowed_roles))}", 400, "Validation Error")

        target_user = None
        if user_id_raw:
            try:
                target_user = db.session.get(User, uuid.UUID(str(user_id_raw)))
            except (ValueError, TypeError):
                raise SchoolServiceError("Invalid user ID format.", 400, "Bad Request")
        elif email_raw:
            target_user = User.query.filter(func.lower(User.email) == str(email_raw).strip().lower()).first()

        if not target_user:
            raise SchoolServiceError("ไม่พบผู้ใช้งานที่ระบุในระบบ", 404, "Not Found")

        existing_member = SchoolUser.query.filter_by(school_id=s_uuid, user_id=target_user.user_id).first()
        if existing_member:
            raise SchoolServiceError(f"ผู้ใช้ '{target_user.email}' เป็นสมาชิกของโรงเรียนนี้อยู่แล้ว", 409, "Conflict")

        try:
            new_member = SchoolUser(
                school_id=s_uuid,
                user_id=target_user.user_id,
                role=role
            )
            db.session.add(new_member)
            db.session.flush()

            audit = AuditLog(
                user_id=caller.user_id,
                action="SCHOOL_MEMBER_ADDED",
                entity_type="school_user",
                entity_id=new_member.school_user_id,
                details={
                    "school_id": str(s_uuid),
                    "school_name": school.name,
                    "target_user_id": str(target_user.user_id),
                    "target_email": target_user.email,
                    "school_role": role,
                    "added_by": caller.email
                },
                ip_address=ip_address or "127.0.0.1"
            )
            db.session.add(audit)
            db.session.commit()

            profile = target_user.profile
            display_name = (profile.display_name if profile and profile.display_name else None) or target_user.email
            return {
                "message": "เพิ่มสมาชิกเข้าโรงเรียนเรียบร้อยแล้ว",
                "member": {
                    "school_user_id": str(new_member.school_user_id),
                    "school_id": str(new_member.school_id),
                    "user_id": str(target_user.user_id),
                    "email": target_user.email,
                    "display_name": display_name,
                    "school_role": new_member.role,
                    "user_status": target_user.status,
                    "joined_at": new_member.joined_at.isoformat() if new_member.joined_at else None,
                }
            }, 201
        except SchoolServiceError:
            db.session.rollback()
            raise
        except Exception as e:
            db.session.rollback()
            current_app.logger.exception("School service error: %s", e)
            raise SchoolServiceError(INTERNAL_ERROR_MESSAGE, 500, "Internal Server Error")

    @classmethod
    def update_school_member_role(cls, caller: User, school_id_raw: str | uuid.UUID, membership_id_raw: str | uuid.UUID, data: dict, ip_address: str = "127.0.0.1") -> tuple[dict, int]:
        """
        เปลี่ยนบทบาทสมาชิกในโรงเรียน (SchoolUser.role)
        - ตรวจสอบสิทธิ์ schools.edit
        - IDOR Protection: ตรวจสอบว่าสมาชิกสังกัด school_id ที่ระบุ
        - สำคัญ: เปลี่ยนเฉพาะ School Role เท่านั้น ไม่เปลี่ยน Global System Role ของ User
        - บันทึก Audit Log (SCHOOL_MEMBER_UPDATED)
        """
        try:
            s_uuid = uuid.UUID(str(school_id_raw))
            m_uuid = uuid.UUID(str(membership_id_raw))
        except (ValueError, TypeError):
            raise SchoolServiceError("Invalid ID format.", 400, "Bad Request")

        cls.check_school_access(caller, s_uuid, "schools.edit")

        school = db.session.get(School, s_uuid)
        if not school:
            raise SchoolServiceError("School not found.", 404, "Not Found")

        membership = db.session.get(SchoolUser, m_uuid)
        if not membership:
            raise SchoolServiceError("Membership not found.", 404, "Not Found")

        if str(membership.school_id) != str(s_uuid):
            raise SchoolServiceError("สมาชิกไม่ได้สังกัดโรงเรียนที่ระบุ", 400, "Bad Request")

        if not data or not isinstance(data, dict):
            raise SchoolServiceError("Invalid JSON payload.", 400, "Bad Request")

        new_role = str(data.get("role") or "").strip().lower()
        allowed_roles = {"admin", "teacher", "student", "member"}
        if new_role not in allowed_roles:
            raise SchoolServiceError(f"บทบาทไม่ถูกต้อง เลือกได้จาก: {', '.join(sorted(allowed_roles))}", 400, "Validation Error")

        if new_role == membership.role:
            return {
                "message": "ไม่มีการเปลี่ยนแปลงบทบาท",
                "member": {
                    "school_user_id": str(membership.school_user_id),
                    "school_id": str(membership.school_id),
                    "user_id": str(membership.user_id),
                    "school_role": membership.role
                }
            }, 200

        old_role = membership.role
        membership.role = new_role

        try:
            audit = AuditLog(
                user_id=caller.user_id,
                action="SCHOOL_MEMBER_UPDATED",
                entity_type="school_user",
                entity_id=membership.school_user_id,
                details={
                    "school_id": str(s_uuid),
                    "membership_id": str(m_uuid),
                    "target_user_id": str(membership.user_id),
                    "previous_role": old_role,
                    "new_role": new_role,
                    "updated_by": caller.email
                },
                ip_address=ip_address or "127.0.0.1"
            )
            db.session.add(audit)
            db.session.commit()

            u = membership.user
            profile = u.profile if u else None
            display_name = (profile.display_name if profile and profile.display_name else None) or (u.email if u else "Unknown")
            return {
                "message": "อัปเดตบทบาทสมาชิกในโรงเรียนเรียบร้อยแล้ว",
                "member": {
                    "school_user_id": str(membership.school_user_id),
                    "school_id": str(membership.school_id),
                    "user_id": str(membership.user_id),
                    "email": u.email if u else None,
                    "display_name": display_name,
                    "school_role": membership.role,
                    "user_status": u.status if u else None,
                    "joined_at": membership.joined_at.isoformat() if membership.joined_at else None,
                }
            }, 200
        except SchoolServiceError:
            db.session.rollback()
            raise
        except Exception as e:
            db.session.rollback()
            current_app.logger.exception("School service error: %s", e)
            raise SchoolServiceError(INTERNAL_ERROR_MESSAGE, 500, "Internal Server Error")

    @classmethod
    def remove_school_member(cls, caller: User, school_id_raw: str | uuid.UUID, membership_id_raw: str | uuid.UUID, ip_address: str = "127.0.0.1") -> tuple[dict, int]:
        """
        นำสมาชิกออกจากโรงเรียน
        - ตรวจสอบสิทธิ์ schools.edit
        - IDOR Protection: ตรวจสอบว่าสมาชิกสังกัด school_id ที่ระบุ
        - ลบเฉพาะเรคคอร์ดใน SchoolUser เท่านั้น (ไม่ลบ User Account)
        - บันทึก Audit Log (SCHOOL_MEMBER_REMOVED)
        """
        try:
            s_uuid = uuid.UUID(str(school_id_raw))
            m_uuid = uuid.UUID(str(membership_id_raw))
        except (ValueError, TypeError):
            raise SchoolServiceError("Invalid ID format.", 400, "Bad Request")

        cls.check_school_access(caller, s_uuid, "schools.edit")

        school = db.session.get(School, s_uuid)
        if not school:
            raise SchoolServiceError("School not found.", 404, "Not Found")

        membership = db.session.get(SchoolUser, m_uuid)
        if not membership:
            raise SchoolServiceError("Membership not found.", 404, "Not Found")

        if str(membership.school_id) != str(s_uuid):
            raise SchoolServiceError("สมาชิกไม่ได้สังกัดโรงเรียนที่ระบุ", 400, "Bad Request")

        target_email = membership.user.email if membership.user else "Unknown"

        try:
            audit = AuditLog(
                user_id=caller.user_id,
                action="SCHOOL_MEMBER_REMOVED",
                entity_type="school_user",
                entity_id=membership.school_user_id,
                details={
                    "school_id": str(s_uuid),
                    "target_user_id": str(membership.user_id),
                    "target_email": target_email,
                    "previous_role": membership.role,
                    "removed_by": caller.email
                },
                ip_address=ip_address or "127.0.0.1"
            )
            db.session.add(audit)
            db.session.delete(membership)
            db.session.commit()

            return {
                "message": f"นำสมาชิก '{target_email}' ออกจากโรงเรียนเรียบร้อยแล้ว",
                "membership_id": str(m_uuid)
            }, 200
        except SchoolServiceError:
            db.session.rollback()
            raise
        except Exception as e:
            db.session.rollback()
            current_app.logger.exception("School service error: %s", e)
            raise SchoolServiceError(INTERNAL_ERROR_MESSAGE, 500, "Internal Server Error")

    @classmethod
    def get_available_users_for_school(cls, caller: User, search: str = "", school_id_param: str = None) -> dict:
        """
        ค้นหารายชื่อผู้ใช้ในระบบเพื่อเลือกเพิ่มเข้าเป็นสมาชิกโรงเรียน
        - ตรวจสอบสิทธิ์ schools.edit
        - ค้นหาด้วย email, display_name หรือ first_name/last_name
        - กรองผู้ใช้ที่สังกัด school_id ออก หากมีการส่ง school_id มา
        """
        if not caller.has_permission("schools.edit"):
            raise SchoolServiceError("Access denied. Requires permission: schools.edit.", 403, "Forbidden")

        query = User.query.filter(User.status == "active")

        if school_id_param:
            try:
                s_uuid = uuid.UUID(str(school_id_param))
                subq = db.session.query(SchoolUser.user_id).filter(SchoolUser.school_id == s_uuid).scalar_subquery()
                query = query.filter(User.user_id.notin_(subq))
            except (ValueError, TypeError):
                pass

        if search:
            search_term = f"%{search.lower()}%"
            query = query.join(UserProfile, isouter=True).filter(
                or_(
                    func.lower(User.email).like(search_term),
                    func.lower(UserProfile.display_name).like(search_term),
                    func.lower(UserProfile.first_name).like(search_term),
                    func.lower(UserProfile.last_name).like(search_term)
                )
            )

        users = query.order_by(User.email.asc()).limit(20).all()
        results = []
        for u in users:
            p = u.profile
            display_name = (p.display_name if p and p.display_name else None) or u.email
            results.append({
                "user_id": str(u.user_id),
                "email": u.email,
                "display_name": display_name,
                "first_name": p.first_name if p else None,
                "last_name": p.last_name if p else None,
                "roles": [r.role_name for r in u.roles] if u.roles else ["student"]
            })

        return {"users": results}


# ข้อ 37: ปีการศึกษา 4 หลัก (พ.ศ. หรือ ค.ศ.) และระบุภาคเรียนต่อท้ายได้ เช่น 2569 หรือ 2569/1
_ACADEMIC_YEAR_PATTERN = __import__("re").compile(r"^\d{4}(/[1-3])?$")


def _check_classroom_text_fields(data: dict) -> None:
    for key, label, max_len in (("classroom_name", "ชื่อห้องเรียน", 100), ("grade_level", "ระดับชั้น", 50)):
        value = data.get(key)
        if value is not None and not isinstance(value, (str, int)):
            raise SchoolServiceError(f"{label}ต้องเป็นข้อความ", 400, "Validation Error")
        if value is not None and len(str(value).strip()) > max_len:
            raise SchoolServiceError(f"{label}ต้องยาวไม่เกิน {max_len} ตัวอักษร", 400, "Validation Error")
    year = data.get("academic_year")
    if year is not None and str(year).strip():
        if isinstance(year, (dict, list, bool)) or not _ACADEMIC_YEAR_PATTERN.match(str(year).strip()):
            raise SchoolServiceError("ปีการศึกษาต้องเป็นตัวเลข 4 หลัก เช่น 2569 หรือ 2569/1", 400, "Validation Error")


def _check_school_fields(data: dict, current_school_id=None) -> None:
    """ข้อ 37: ตรวจข้อมูลโรงเรียนก่อนบันทึก (ชนิด ความยาว เบอร์โทร และชื่อห้ามซ้ำ)"""
    for key, label, max_len in (
        ("name", "ชื่อโรงเรียน", 255),
        ("code", "รหัสโรงเรียน", 50),
        ("address", "ที่อยู่", 1000),
        ("contact_email", "อีเมลติดต่อ", 255),
        ("contact_phone", "เบอร์โทรศัพท์", 50),
    ):
        value = data.get(key)
        if value is None:
            continue
        if not isinstance(value, str):
            raise SchoolServiceError(f"{label}ต้องเป็นข้อความ", 400, "Validation Error")
        if len(value.strip()) > max_len:
            raise SchoolServiceError(f"{label}ต้องยาวไม่เกิน {max_len} ตัวอักษร", 400, "Validation Error")

    phone = data.get("contact_phone")
    if isinstance(phone, str) and phone.strip():
        ok, message = validate_phone(phone)
        if not ok:
            raise SchoolServiceError(message, 400, "Validation Error")

    name = data.get("name")
    if isinstance(name, str) and name.strip():
        query = School.query.filter(func.lower(School.name) == name.strip().lower())
        if current_school_id is not None:
            query = query.filter(School.school_id != current_school_id)
        if query.first():
            raise SchoolServiceError(f"ชื่อโรงเรียน '{name.strip()}' มีอยู่ในระบบแล้ว", 409, "Conflict")
