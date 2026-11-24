import uuid
from sqlalchemy import func, or_
from app.extensions import db
from app.models.user import User, UserProfile
from app.models.role import Role, Permission
from app.models.admin import AuditLog
from app.models.classroom import ClassroomMember, Lesson
from app.models.progress import LearningProgress, LessonProgress
from app.models.gamification import (
    UserXP, UserLevel, UserStreak, UserBadge, Mission, MissionProgress
)
from app.utils.admin_scope import (
    OUT_OF_SCOPE_ACCOUNT_MESSAGE,
    OUT_OF_SCOPE_ROLE_MESSAGE,
    can_assign_roles,
    can_manage_account,
)
from app.utils.validators import validate_email, validate_display_name, validate_password
from app.services.media_service import MediaService, MediaServiceError


def _clean_profile_image(value, current):
    """ข้อ 34: รูปโปรไฟล์เก็บเป็นที่อยู่ไฟล์/ลิงก์ ไม่รับ Base64
    ค่าที่ไม่เปลี่ยนจากเดิมไม่ต้องตรวจ (บัญชีเก่าที่ยังเป็น Base64 จะได้บันทึกชื่อได้)"""
    if value is not None and not isinstance(value, str):
        raise UserServiceError("รูปโปรไฟล์ไม่ถูกต้อง", 400, "Validation Error")
    stripped = value.strip() if isinstance(value, str) and value.strip() else None
    if stripped == current:
        return current
    try:
        return MediaService.clean_image_url(stripped, "รูปโปรไฟล์")
    except MediaServiceError as e:
        raise UserServiceError(e.message, 400, "Validation Error")


class UserServiceError(Exception):
    """Base exception for user domain operations."""
    def __init__(self, message: str, status_code: int = 400, error: str = "Bad Request"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error = error


class UserService:
    """
    UserService: Central business logic service for User profiles, accounts,
    student dashboard metrics, and administrative user lifecycle management.
    """

    # =========================================================================
    # 1. User Profile & Account (Self-Service)
    # =========================================================================

    @classmethod
    def get_my_profile(cls, current_user: User | None) -> dict:
        """Retrieve profile and account details for the authenticated user."""
        if not current_user:
            raise UserServiceError("User not found.", 404, "Not Found")
        return {"user": current_user.to_dict()}

    # ฟิลด์ที่ห้ามแก้ไขผ่าน PUT /users/me/profile (FB-08)
    PROFILE_PROTECTED_FIELDS = frozenset({
        "email", "role", "roles", "role_name", "role_names", "user_role",
        "status", "password", "password_hash", "user_id",
    })

    @classmethod
    def update_my_profile(cls, current_user: User | None, data: dict) -> dict:
        """Update profile information (display_name, profile_image) for authenticated user."""
        if not current_user:
            raise UserServiceError("User not found.", 404, "Not Found")

        if not data or not isinstance(data, dict):
            raise UserServiceError("JSON body is required.", 400, "Bad Request")

        if not current_user.profile:
            raise UserServiceError("User profile not found.", 404, "Not Found")

        # FB-08: หน้าข้อมูลส่วนตัวห้ามแก้ไขอีเมล บทบาท สถานะ หรือรหัสผ่าน
        # ปฏิเสธทั้งคำขอ (ไม่บันทึกฟิลด์อื่นด้วย) เพื่อไม่ให้เกิดการแก้ไขบางส่วนแบบเงียบ ๆ
        protected_fields = sorted(cls.PROFILE_PROTECTED_FIELDS.intersection(data.keys()))
        if protected_fields:
            raise UserServiceError(
                "ไม่สามารถแก้ไขอีเมลหรือบทบาทจากหน้าข้อมูลส่วนตัวได้ "
                f"(ฟิลด์ที่ไม่อนุญาต: {', '.join(protected_fields)}) กรุณาติดต่อผู้ดูแลระบบ",
                400,
                "Validation Error",
            )

        if "display_name" in data:
            new_name = data.get("display_name")
            is_valid, err_msg = validate_display_name(new_name)
            if not is_valid:
                raise UserServiceError(err_msg, 400, "Validation Error")
            current_user.profile.display_name = new_name.strip()

        if "profile_image" in data:
            current_user.profile.profile_image = _clean_profile_image(
                data.get("profile_image"), current_user.profile.profile_image
            )

        try:
            db.session.commit()
            return {
                "message": "อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว",
                "user": current_user.to_dict()
            }
        except Exception:
            db.session.rollback()
            raise UserServiceError("ไม่สามารถอัปเดตข้อมูลโปรไฟล์ได้", 500, "Internal Server Error")

    @classmethod
    def get_student_dashboard(cls, current_user: User | None) -> dict:
        """
        ดึงข้อมูล Dashboard สำหรับผู้เรียน (Student Dashboard) จากฐานข้อมูลจริง 100%
        - Enrolled Courses พร้อม % ความคืบหน้า
        - Recent Activities จากประวัติการเรียนจริง
        - Gamification Stats (XP, Level, Streak, Badges) จาก DB จริง
        - Daily Quests จากตาราง Mission/MissionProgress จริง
        """
        if not current_user:
            raise UserServiceError("User not found.", 404, "Not Found")

        # 1. Enrolled Courses & Progress
        memberships = (
            ClassroomMember.query.filter_by(user_id=current_user.user_id)
            .order_by(ClassroomMember.joined_at.desc())
            .all()
        )
        enrolled_courses = []
        total_progress_sum = 0.0

        for m in memberships:
            c = m.classroom
            if not c:
                continue

            lp = LearningProgress.query.filter_by(user_id=current_user.user_id, course_id=c.classroom_id).first()
            if lp and lp.progress_percent is not None:
                progress_pct = float(lp.progress_percent)
                course_status = lp.status
            else:
                total_lessons = len(c.lessons)
                if total_lessons > 0:
                    completed_count = LessonProgress.query.filter(
                        LessonProgress.user_id == current_user.user_id,
                        LessonProgress.lesson_id.in_([l.lesson_id for l in c.lessons]),
                        LessonProgress.status == "completed"
                    ).count()
                    progress_pct = round((completed_count / total_lessons) * 100, 1)
                else:
                    progress_pct = 0.0
                course_status = "completed" if progress_pct >= 100.0 else "in_progress"

            total_progress_sum += progress_pct
            c_dict = c.to_dict()
            c_dict["id"] = str(c.classroom_id)
            c_dict["progress_percent"] = progress_pct
            c_dict["enrollment_status"] = m.status
            c_dict["course_status"] = course_status
            c_dict["joined_at"] = m.joined_at.isoformat() if m.joined_at else None
            enrolled_courses.append(c_dict)

        overall_progress = round(total_progress_sum / len(enrolled_courses), 1) if enrolled_courses else 0.0

        # 2. Recent Activities
        recent_activities = []
        recent_lps = (
            LessonProgress.query.filter_by(user_id=current_user.user_id)
            .order_by(LessonProgress.completed_at.desc())
            .limit(5)
            .all()
        )
        for lp in recent_lps:
            lesson = lp.lesson
            course_name = lesson.classroom.title if lesson and lesson.classroom else "คอร์สเรียน"
            recent_activities.append({
                "id": f"lesson-{lp.id}",
                "title": f"บทเรียน: {lesson.title if lesson else 'บทเรียน'}",
                "description": course_name,
                "timestamp": lp.completed_at.isoformat() if lp.completed_at else None,
                "type": "lesson",
                "status": lp.status
            })

        if not recent_activities:
            for m in memberships[:5]:
                c = m.classroom
                if c:
                    recent_activities.append({
                        "id": f"enrollment-{m.classroom_member_id}",
                        "title": f"ลงทะเบียนคอร์สเรียน: {c.title}",
                        "description": "เข้าสู่การเรียนรู้",
                        "timestamp": m.joined_at.isoformat() if m.joined_at else None,
                        "type": "enrollment",
                        "status": "enrolled"
                    })

        # 3. Gamification Stats
        user_level = UserLevel.query.filter_by(user_id=current_user.user_id).first()
        if user_level:
            current_xp = user_level.current_xp
            level_number = user_level.level.level_number if user_level.level else 1
            level_title = user_level.level.title if user_level.level else "ผู้เรียนเริ่มต้น"
        else:
            xp_sum = db.session.query(db.func.sum(UserXP.amount)).filter_by(user_id=current_user.user_id).scalar() or 0
            current_xp = int(xp_sum)
            level_number = 1
            level_title = "ผู้เรียนเริ่มต้น"

        user_streak = UserStreak.query.filter_by(user_id=current_user.user_id).first()
        streak_data = {
            "current_streak": user_streak.current_streak if user_streak else 0,
            "longest_streak": user_streak.longest_streak if user_streak else 0,
            "last_activity_date": user_streak.last_activity_date.isoformat() if user_streak and user_streak.last_activity_date else None
        }

        user_badges = UserBadge.query.filter_by(user_id=current_user.user_id).all()
        badges_data = [b.to_dict() for b in user_badges]

        # 4. Daily Quests / Missions
        daily_quests = []
        missions = Mission.query.all()
        user_mp_map = {
            str(mp.mission_id): mp
            for mp in MissionProgress.query.filter_by(user_id=current_user.user_id).all()
        }
        for m in missions:
            mp = user_mp_map.get(str(m.mission_id))
            daily_quests.append({
                "id": str(m.mission_id),
                "title": m.title,
                "description": m.description,
                "xp": m.reward_xp or 0,
                "completed": mp.status == "completed" if mp else False,
                "status": mp.status if mp else "not_started"
            })

        return {
            "enrolledCourses": enrolled_courses,
            "coursesCount": len(enrolled_courses),
            "overallProgress": overall_progress,
            "recentActivities": recent_activities,
            "gamification": {
                "current_xp": current_xp,
                "level_number": level_number,
                "level_title": level_title,
                "streak": streak_data,
                "badges": badges_data
            },
            "dailyQuests": daily_quests,
            "dailyMissions": daily_quests
        }

    # =========================================================================
    # 2. Administrative User Management (Admin & Super Admin)
    # =========================================================================

    @classmethod
    def list_users(
        cls,
        caller: User | None,
        search: str = "",
        role_filter: str = "",
        status_filter: str = "",
        page: int = 1,
        per_page: int = 10
    ) -> dict:
        """
        แสดงรายชื่อผู้ใช้ทั้งหมดในระบบ พร้อมการค้นหา การกรองตาม Role และ Status และ Pagination (UAT-021, UAT-022, UAT-023)
        """
        query = User.query.outerjoin(UserProfile, User.user_id == UserProfile.user_id)

        if search:
            search_pattern = f"%{search.lower()}%"
            query = query.filter(
                or_(
                    func.lower(User.email).like(search_pattern),
                    func.coalesce(func.lower(UserProfile.display_name), "").like(search_pattern)
                )
            )

        if status_filter:
            query = query.filter(User.status == status_filter)

        if role_filter:
            query = query.filter(User.roles.any(Role.role_name == role_filter))

        total = query.count()
        users = query.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
        pages = (total + per_page - 1) // per_page if per_page > 0 else 1

        return {
            "users": [u.to_dict() for u in users],
            "total": total,
            "page": page,
            "per_page": per_page,
            "pages": pages
        }

    @classmethod
    def create_user(cls, caller: User | None, data: dict, remote_addr: str | None = None) -> tuple[dict, int]:
        """
        สร้างบัญชีผู้ใช้งานใหม่โดย Admin หรือ Super Admin
        - ตรวจสอบสิทธิ์ users.create ผ่าน Dynamic Permission Matrix
        - ป้องกัน Privilege Escalation: Admin ทั่วไปห้ามสร้างหรือกำหนดบทบาท super_admin
        - ทำงานแบบ Atomic Transaction พร้อมบันทึก Audit Log (USER_CREATED)
        """
        if not caller:
            raise UserServiceError("Caller not found.", 401, "Unauthorized")

        if not caller.has_permission("users.create"):
            raise UserServiceError("Access denied. Requires permission: users.create.", 403, "Forbidden")

        if not data or not isinstance(data, dict):
            raise UserServiceError("JSON body is required.", 400, "Bad Request")

        email_raw = data.get("email")
        if not email_raw or not str(email_raw).strip():
            raise UserServiceError("Email is required.", 400, "Validation Error")

        clean_email = str(email_raw).strip().lower()
        is_valid_email, email_err = validate_email(clean_email)
        if not is_valid_email:
            raise UserServiceError(email_err, 400, "Validation Error")

        existing_user = User.query.filter(func.lower(User.email) == clean_email).first()
        if existing_user:
            raise UserServiceError("อีเมลนี้มีผู้ใช้งานในระบบแล้ว", 409, "Conflict")

        password_raw = data.get("password")
        if not password_raw or not str(password_raw).strip():
            raise UserServiceError("Password is required.", 400, "Validation Error")

        password_str = str(password_raw)
        is_valid_pw, pw_err = validate_password(password_str)
        if not is_valid_pw:
            raise UserServiceError(pw_err, 400, "Validation Error")

        display_name_raw = data.get("display_name")
        if not display_name_raw or not str(display_name_raw).strip():
            first_name_tmp = (data.get("first_name") or "").strip()
            last_name_tmp = (data.get("last_name") or "").strip()
            if first_name_tmp or last_name_tmp:
                display_name_raw = f"{first_name_tmp} {last_name_tmp}".strip()
            else:
                display_name_raw = clean_email.split("@")[0]

        display_name_clean = str(display_name_raw).strip()
        is_valid_name, name_err = validate_display_name(display_name_clean)
        if not is_valid_name:
            raise UserServiceError(name_err, 400, "Validation Error")

        raw_roles = data.get("roles")
        if raw_roles is None and "role" in data:
            raw_role_val = data.get("role")
            raw_roles = [raw_role_val] if raw_role_val else []

        if raw_roles is None:
            raw_roles = ["student"]
        elif not isinstance(raw_roles, list):
            raw_roles = [raw_roles]

        role_names = [str(r).strip().lower() for r in raw_roles if r]
        if not role_names:
            role_names = ["student"]

        if "super_admin" in role_names and not caller.has_role("super_admin"):
            raise UserServiceError("Only a Super Admin can assign the super_admin role.", 403, "Forbidden")

        if not can_assign_roles(caller, role_names):
            raise UserServiceError(OUT_OF_SCOPE_ROLE_MESSAGE, 403, "Forbidden")

        matched_roles = Role.query.filter(Role.role_name.in_(role_names)).all()
        if not matched_roles:
            raise UserServiceError("ไม่พบบทบาทที่เลือก กรุณารีเฟรชหน้าแล้วเลือกใหม่", 400, "Validation Error")

        status = str(data.get("status", "active")).strip().lower()
        allowed_statuses = {"active", "inactive", "suspended"}
        if status not in allowed_statuses:
            raise UserServiceError(
                f"Invalid status '{status}'. Allowed: {', '.join(sorted(allowed_statuses))}.",
                400,
                "Validation Error"
            )

        institution_email = data.get("institution_email")
        if institution_email and str(institution_email).strip():
            inst_clean = str(institution_email).strip().lower()
            is_inst_valid, inst_err = validate_email(inst_clean)
            if not is_inst_valid:
                raise UserServiceError(f"Invalid institution email: {inst_err}", 400, "Validation Error")
            institution_email = inst_clean
        else:
            institution_email = None

        new_user = User(
            email=clean_email,
            status=status
        )
        new_user.set_password(password_str)
        new_user.roles = matched_roles

        new_profile = UserProfile(
            user=new_user,
            display_name=display_name_clean,
            title=str(data.get("title")).strip() if data.get("title") else None,
            first_name=str(data.get("first_name")).strip() if data.get("first_name") else None,
            last_name=str(data.get("last_name")).strip() if data.get("last_name") else None,
            occupation=str(data.get("occupation")).strip() if data.get("occupation") else None,
            institution_name=str(data.get("institution_name")).strip() if data.get("institution_name") else None,
            institution_email=institution_email
        )
        new_user.profile = new_profile

        db.session.add(new_user)
        db.session.add(new_profile)

        audit = AuditLog(
            user_id=caller.user_id,
            action="USER_CREATED",
            entity_type="user",
            entity_id=new_user.user_id,
            details={
                "actor_user_id": str(caller.user_id),
                "created_email": clean_email,
                "display_name": display_name_clean,
                "roles": [r.role_name for r in matched_roles],
                "status": status,
                "result": "SUCCESS"
            },
            ip_address=remote_addr
        )
        db.session.add(audit)

        try:
            db.session.commit()
            return {
                "message": "สร้างบัญชีผู้ใช้งานสำเร็จ",
                "user": new_user.to_dict()
            }, 201
        except Exception:
            db.session.rollback()
            raise UserServiceError("Failed to create user.", 500, "Internal Server Error")

    @classmethod
    def get_user_detail(cls, user_id_raw: str, caller: User | None) -> dict:
        """ดึงข้อมูลรายละเอียดผู้ใช้รายบุคคล (User Detail) จากฐานข้อมูลจริง"""
        try:
            u_uuid = uuid.UUID(user_id_raw)
        except (ValueError, TypeError):
            raise UserServiceError("Invalid user ID format.", 400, "Bad Request")

        target_user = db.session.get(User, u_uuid)
        if not target_user:
            raise UserServiceError("User not found.", 404, "Not Found")

        return {"user": target_user.to_dict()}

    @classmethod
    def update_user_account_and_profile(
        cls,
        user_id_raw: str,
        caller: User | None,
        data: dict,
        remote_addr: str | None = None
    ) -> dict:
        """
        แก้ไขข้อมูลบัญชีและโปรไฟล์ของผู้ใช้โดย Admin / Super Admin
        - ตรวจสอบสิทธิ์ users.edit ผ่าน Dynamic Permission Matrix
        - ป้องกัน Admin แก้ไขข้อมูลของ Super Admin
        - ป้องกัน Admin แก้ไข Role หรือระงับบัญชีตนเอง
        - บันทึก Audit Log ทุกครั้งที่มีการแก้ไข
        """
        try:
            u_uuid = uuid.UUID(user_id_raw)
        except (ValueError, TypeError):
            raise UserServiceError("Invalid user ID format.", 400, "Bad Request")

        target_user = db.session.get(User, u_uuid)
        if not target_user:
            raise UserServiceError("User not found.", 404, "Not Found")

        if not caller:
            raise UserServiceError("Caller not found.", 401, "Unauthorized")

        if not caller.has_permission("users.edit"):
            raise UserServiceError("Access denied. Requires permission: users.edit.", 403, "Forbidden")

        if target_user.has_role("super_admin") and not caller.has_role("super_admin"):
            raise UserServiceError("Only a Super Admin can modify a Super Admin account.", 403, "Forbidden")

        if not can_manage_account(caller, target_user):
            raise UserServiceError(OUT_OF_SCOPE_ACCOUNT_MESSAGE, 403, "Forbidden")

        if not data or not isinstance(data, dict):
            raise UserServiceError("JSON body is required.", 400, "Bad Request")

        changed_fields = []

        # 1. Email
        if "email" in data:
            new_email = str(data["email"] or "").strip().lower()
            is_valid_email, email_err = validate_email(new_email)
            if not is_valid_email:
                raise UserServiceError(email_err, 400, "Validation Error")

            if new_email != target_user.email.lower():
                existing_user = User.query.filter(
                    func.lower(User.email) == new_email,
                    User.user_id != target_user.user_id
                ).first()
                if existing_user:
                    raise UserServiceError("อีเมลนี้มีผู้ใช้งานในระบบแล้ว", 409, "Conflict")
                target_user.email = new_email
                changed_fields.append("email")

        # 2. Status
        if "status" in data:
            new_status = str(data["status"] or "").strip().lower()
            allowed_statuses = {"active", "inactive", "suspended"}
            if new_status not in allowed_statuses:
                raise UserServiceError(
                    f"Invalid status '{new_status}'. Allowed: {', '.join(sorted(allowed_statuses))}.",
                    400,
                    "Validation Error"
                )

            if str(caller.user_id) == str(target_user.user_id) and new_status != "active":
                raise UserServiceError("Cannot deactivate or suspend your own administrator account.", 403, "Forbidden")

            if new_status != target_user.status:
                target_user.status = new_status
                changed_fields.append("status")

        # 3. Roles
        if "roles" in data or "role" in data:
            raw_roles = data.get("roles")
            if raw_roles is None and "role" in data:
                raw_role_val = data.get("role")
                raw_roles = [raw_role_val] if raw_role_val else []

            if not isinstance(raw_roles, list):
                raw_roles = [raw_roles]

            role_names = [str(r).strip().lower() for r in raw_roles if r]
            if not role_names:
                raise UserServiceError("ผู้ใช้ต้องมีอย่างน้อย 1 บทบาท", 400, "Validation Error")

            old_roles_set = {r.role_name.lower() for r in target_user.roles}
            new_roles_set = set(role_names)

            if str(caller.user_id) == str(target_user.user_id) and old_roles_set != new_roles_set:
                raise UserServiceError("Users cannot modify their own roles.", 403, "Forbidden")

            wants_super_admin = "super_admin" in role_names
            is_target_super_admin = target_user.has_role("super_admin")
            if (wants_super_admin or is_target_super_admin) and not caller.has_role("super_admin"):
                raise UserServiceError("Only a Super Admin can assign or modify the super_admin role.", 403, "Forbidden")

            if not can_assign_roles(caller, role_names):
                raise UserServiceError(OUT_OF_SCOPE_ROLE_MESSAGE, 403, "Forbidden")

            matched_roles = Role.query.filter(Role.role_name.in_(role_names)).all()
            if not matched_roles:
                raise UserServiceError("ไม่พบบทบาทที่เลือก กรุณารีเฟรชหน้าแล้วเลือกใหม่", 400, "Validation Error")

            if old_roles_set != new_roles_set:
                target_user.roles = matched_roles
                changed_fields.append("roles")

        # 4. UserProfile
        if not target_user.profile:
            target_user.profile = UserProfile(
                user_id=target_user.user_id,
                display_name=target_user.email.split("@")[0]
            )
            db.session.add(target_user.profile)
            changed_fields.append("profile_created")

        profile = target_user.profile

        if "display_name" in data:
            new_dname = str(data["display_name"] or "").strip()
            is_valid_dname, dname_err = validate_display_name(new_dname)
            if not is_valid_dname:
                raise UserServiceError(dname_err, 400, "Validation Error")
            if new_dname != profile.display_name:
                profile.display_name = new_dname
                changed_fields.append("display_name")

        if "title" in data:
            new_title = str(data["title"]).strip() if data["title"] else None
            if new_title and len(new_title) > 20:
                raise UserServiceError("คำนำหน้าต้องมีความยาวไม่เกิน 20 ตัวอักษร", 400, "Validation Error")
            if new_title != profile.title:
                profile.title = new_title
                changed_fields.append("title")

        if "first_name" in data:
            new_fname = str(data["first_name"]).strip() if data["first_name"] else None
            if new_fname and len(new_fname) > 100:
                raise UserServiceError("ชื่อจริงต้องมีความยาวไม่เกิน 100 ตัวอักษร", 400, "Validation Error")
            if new_fname != profile.first_name:
                profile.first_name = new_fname
                changed_fields.append("first_name")

        if "last_name" in data:
            new_lname = str(data["last_name"]).strip() if data["last_name"] else None
            if new_lname and len(new_lname) > 100:
                raise UserServiceError("นามสกุลต้องมีความยาวไม่เกิน 100 ตัวอักษร", 400, "Validation Error")
            if new_lname != profile.last_name:
                profile.last_name = new_lname
                changed_fields.append("last_name")

        if "occupation" in data:
            new_occ = str(data["occupation"]).strip() if data["occupation"] else None
            if new_occ and len(new_occ) > 50:
                raise UserServiceError("อาชีพต้องมีความยาวไม่เกิน 50 ตัวอักษร", 400, "Validation Error")
            if new_occ != profile.occupation:
                profile.occupation = new_occ
                changed_fields.append("occupation")

        if "institution_name" in data:
            new_inst_name = str(data["institution_name"]).strip() if data["institution_name"] else None
            if new_inst_name and len(new_inst_name) > 255:
                raise UserServiceError("ชื่อสถาบันต้องมีความยาวไม่เกิน 255 ตัวอักษร", 400, "Validation Error")
            if new_inst_name != profile.institution_name:
                profile.institution_name = new_inst_name
                changed_fields.append("institution_name")

        if "institution_email" in data:
            raw_inst_email = data["institution_email"]
            new_inst_email = str(raw_inst_email).strip().lower() if raw_inst_email else None
            if new_inst_email:
                is_valid_inst, inst_err = validate_email(new_inst_email)
                if not is_valid_inst:
                    raise UserServiceError(f"รูปแบบอีเมลสถาบันไม่ถูกต้อง: {inst_err}", 400, "Validation Error")
            if new_inst_email != profile.institution_email:
                profile.institution_email = new_inst_email
                changed_fields.append("institution_email")

        if "profile_image" in data:
            clean_img = _clean_profile_image(data["profile_image"], profile.profile_image)
            if clean_img != profile.profile_image:
                profile.profile_image = clean_img
                changed_fields.append("profile_image")

        if changed_fields:
            audit = AuditLog(
                user_id=caller.user_id,
                action="USER_UPDATED_BY_ADMIN",
                entity_type="user",
                entity_id=target_user.user_id,
                details={
                    "actor_user_id": str(caller.user_id),
                    "target_user_id": str(target_user.user_id),
                    "target_email": target_user.email,
                    "changed_fields": changed_fields,
                    "result": "SUCCESS"
                },
                ip_address=remote_addr
            )
            db.session.add(audit)

        try:
            db.session.commit()
            return {
                "message": "อัปเดตข้อมูลผู้ใช้เรียบร้อยแล้ว",
                "changed_fields": changed_fields,
                "user": target_user.to_dict()
            }
        except Exception:
            db.session.rollback()
            raise UserServiceError("Failed to update user details.", 500, "Internal Server Error")

    @classmethod
    def update_user_status(cls, user_id_raw: str, caller: User | None, data: dict) -> dict:
        """
        เปลี่ยนสถานะผู้ใช้ เช่น 'active', 'inactive', 'suspended' (UAT-024)
        """
        try:
            u_uuid = uuid.UUID(user_id_raw)
        except (ValueError, TypeError):
            raise UserServiceError("Invalid user ID format.", 400, "Bad Request")

        target_user = db.session.get(User, u_uuid)
        if not target_user:
            raise UserServiceError("User not found.", 404, "Not Found")

        if not data or "status" not in data:
            raise UserServiceError("status is required.", 400, "Bad Request")

        new_status = str(data.get("status")).strip().lower()
        allowed_statuses = {"active", "inactive", "suspended"}
        if new_status not in allowed_statuses:
            raise UserServiceError(
                f"Invalid status '{new_status}'. Allowed: {', '.join(sorted(allowed_statuses))}.",
                400,
                "Validation Error"
            )

        if caller and str(caller.user_id) == str(target_user.user_id) and new_status != "active":
            raise UserServiceError("Cannot deactivate or suspend your own administrator account.", 403, "Forbidden")

        if target_user.has_role("super_admin") and caller and not caller.has_role("super_admin"):
            raise UserServiceError("Only a Super Admin can modify the status of another Super Admin.", 403, "Forbidden")

        if not can_manage_account(caller, target_user):
            raise UserServiceError(OUT_OF_SCOPE_ACCOUNT_MESSAGE, 403, "Forbidden")

        target_user.status = new_status
        try:
            db.session.commit()
            return {
                "message": f"User status updated to '{new_status}'.",
                "user": target_user.to_dict()
            }
        except Exception:
            db.session.rollback()
            raise UserServiceError("Failed to update user status.", 500, "Internal Server Error")

    @classmethod
    def update_user_roles(
        cls,
        user_id_raw: str,
        caller: User | None,
        data: dict,
        remote_addr: str | None = None
    ) -> dict:
        """
        เปลี่ยนสิทธิ์หรือบทบาท (Role) ของผู้ใช้งาน (UAT-025)
        """
        try:
            u_uuid = uuid.UUID(user_id_raw)
        except (ValueError, TypeError):
            raise UserServiceError("Invalid user ID format.", 400, "Bad Request")

        target_user = db.session.get(User, u_uuid)
        if not target_user:
            raise UserServiceError("User not found.", 404, "Not Found")

        if not caller:
            raise UserServiceError("Caller not found.", 401, "Unauthorized")

        if str(caller.user_id) == str(target_user.user_id):
            raise UserServiceError("Users cannot modify their own roles.", 403, "Forbidden")

        if not data or "roles" not in data:
            raise UserServiceError("กรุณาเลือกบทบาทอย่างน้อย 1 บทบาท", 400, "Bad Request")

        raw_roles = data.get("roles")
        # ข้อ 37: roles ต้องเป็นรายการชื่อบทบาท (ข้อความ) เท่านั้น
        if not isinstance(raw_roles, list) or not all(isinstance(r, str) for r in raw_roles):
            raise UserServiceError("กรุณาเลือกบทบาทอย่างน้อย 1 บทบาท", 400, "Validation Error")
        role_names = [r.strip().lower() for r in raw_roles if r.strip()]
        if len(role_names) == 0:
            raise UserServiceError("กรุณาเลือกบทบาทอย่างน้อย 1 บทบาท", 400, "Validation Error")

        wants_super_admin = "super_admin" in role_names
        is_target_super_admin = target_user.has_role("super_admin")

        if (wants_super_admin or is_target_super_admin) and not caller.has_role("super_admin"):
            raise UserServiceError("Only a Super Admin can assign or modify the super_admin role.", 403, "Forbidden")

        if not can_manage_account(caller, target_user):
            raise UserServiceError(OUT_OF_SCOPE_ACCOUNT_MESSAGE, 403, "Forbidden")

        if not can_assign_roles(caller, role_names):
            raise UserServiceError(OUT_OF_SCOPE_ROLE_MESSAGE, 403, "Forbidden")

        matched_roles = Role.query.filter(Role.role_name.in_(role_names)).all()
        if not matched_roles:
            raise UserServiceError("ไม่พบบทบาทที่เลือก กรุณารีเฟรชหน้าแล้วเลือกใหม่", 400, "Validation Error")

        previous_role = target_user.to_dict().get("role")
        target_user.roles = matched_roles

        if wants_super_admin and not is_target_super_admin:
            action_name = "SUPER_ADMIN_ROLE_ASSIGNED"
        elif is_target_super_admin and not wants_super_admin:
            action_name = "SUPER_ADMIN_ROLE_CHANGED"
        elif "admin" in role_names and previous_role != "admin":
            action_name = "ADMIN_ROLE_ASSIGNED"
        elif previous_role == "admin" and "admin" not in role_names:
            action_name = "ADMIN_ROLE_REVOKED"
        else:
            action_name = "USER_ROLES_UPDATED"

        audit = AuditLog(
            user_id=caller.user_id,
            action=action_name,
            entity_type="user",
            entity_id=target_user.user_id,
            details={
                "actor_user_id": str(caller.user_id),
                "target_user_id": str(target_user.user_id),
                "action": action_name,
                "previous_role": previous_role,
                "new_roles": [r.role_name for r in matched_roles],
                "result": "SUCCESS"
            },
            ip_address=remote_addr
        )
        db.session.add(audit)

        try:
            db.session.commit()
            return {
                "message": "User roles updated successfully.",
                "user": target_user.to_dict()
            }
        except Exception:
            db.session.rollback()
            raise UserServiceError("Failed to update user roles.", 500, "Internal Server Error")

    @classmethod
    def set_user_password(
        cls,
        user_id_raw: str,
        caller: User | None,
        data: dict | None,
        remote_addr: str | None = None,
    ) -> dict:
        """
        Super Admin ตั้งรหัสผ่านใหม่ให้บัญชีอื่นโดยไม่ต้องรู้รหัสเดิม (ข้อ 8)
        - ทำได้เฉพาะ Super Admin (Admin ทั่วไปได้ 403 และถูกบันทึก Audit Log ว่า DENIED)
        - ห้ามใช้กับบัญชีตัวเอง ให้ใช้เมนูเปลี่ยนรหัสผ่านที่ต้องกรอกรหัสเดิม
        - ตรวจรหัสผ่านตามกติกาเดียวกับการสมัคร และต้องกรอกยืนยันให้ตรงกัน
        - สำเร็จแล้วยกเลิก Session ทุกเครื่องของบัญชีนั้น (Refresh Token + Access Token เดิม)
        - บันทึก Audit Log ทุกครั้ง: ใครทำ บัญชีไหน เมื่อไร ผลเป็นอย่างไร
          ห้ามเก็บรหัสผ่าน (ทั้งตัวจริงและแฮช) ลง Log เด็ดขาด
        """
        from datetime import datetime, timezone
        from app.models.security import RefreshToken

        if not caller:
            raise UserServiceError("Caller not found.", 401, "Unauthorized")

        try:
            u_uuid = uuid.UUID(str(user_id_raw))
        except (ValueError, TypeError):
            raise UserServiceError("รูปแบบรหัสผู้ใช้ไม่ถูกต้อง", 400, "Bad Request")

        target = db.session.get(User, u_uuid)

        def write_log(result: str, reason: str | None = None):
            details = {
                "actor_user_id": str(caller.user_id),
                "actor_email": caller.email,
                "target_user_id": str(u_uuid),
                "target_email": target.email if target else None,
                "result": result,
            }
            if reason:
                details["reason"] = reason
            db.session.add(AuditLog(
                user_id=caller.user_id,
                action="USER_PASSWORD_SET_BY_ADMIN",
                entity_type="user",
                entity_id=u_uuid,
                details=details,
                ip_address=remote_addr,
            ))
            try:
                db.session.commit()
            except Exception:
                db.session.rollback()

        def fail(message: str, status_code: int, error: str, reason: str):
            write_log("DENIED" if status_code == 403 else "FAILED", reason)
            raise UserServiceError(message, status_code, error)

        if not caller.has_role("super_admin"):
            fail("เฉพาะ Super Admin เท่านั้นที่ตั้งรหัสผ่านให้ผู้อื่นได้", 403, "Forbidden", "not_super_admin")

        if not target:
            fail("ไม่พบบัญชีผู้ใช้", 404, "Not Found", "user_not_found")

        if str(caller.user_id) == str(target.user_id):
            fail(
                "ไม่สามารถตั้งรหัสผ่านให้บัญชีตัวเองจากหน้านี้ได้ กรุณาใช้เมนูเปลี่ยนรหัสผ่านที่หน้าโปรไฟล์",
                403,
                "Forbidden",
                "own_account",
            )

        data = data or {}
        new_password = data.get("new_password")
        confirm_password = data.get("confirm_password")
        if not isinstance(new_password, str) or not new_password:
            fail("กรุณากรอกรหัสผ่านใหม่", 400, "Validation Error", "missing_password")
        is_valid, _ = validate_password(new_password)
        if not is_valid:
            fail("รหัสผ่านต้องมีความยาว 6-128 ตัวอักษร", 400, "Validation Error", "invalid_password")
        if new_password != confirm_password:
            fail("รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน", 400, "Validation Error", "confirm_mismatch")

        now = datetime.now(timezone.utc)
        target.set_password(new_password)
        target.sessions_revoked_at = now
        RefreshToken.query.filter(
            RefreshToken.user_id == target.user_id,
            RefreshToken.revoked_at.is_(None),
        ).update({RefreshToken.revoked_at: now}, synchronize_session=False)

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            write_log("FAILED", "database_error")
            raise UserServiceError("ตั้งรหัสผ่านไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", 500, "Internal Server Error")

        write_log("SUCCESS")
        return {
            "message": f"ตั้งรหัสผ่านใหม่ให้ {target.email} เรียบร้อยแล้ว ผู้ใช้ต้องเข้าสู่ระบบใหม่ด้วยรหัสผ่านนี้",
            "user": target.to_dict(),
        }

    @classmethod
    def delete_user(cls, user_id_raw: str, caller: User | None, remote_addr: str | None = None) -> dict:
        """
        ลบผู้ใช้งานออกจากระบบถาวร (Permanent User Deletion)
        - ตรวจสอบสิทธิ์ users.delete ผ่าน Dynamic Permission Matrix
        - ป้องกัน Admin ลบ Super Admin
        - ป้องกัน Admin / Super Admin ลบบัญชีตนเอง
        - บันทึก Audit Log เสมอ
        """
        if not caller:
            raise UserServiceError("Caller not found.", 401, "Unauthorized")

        if not caller.has_permission("users.delete"):
            raise UserServiceError("Access denied. Requires permission: users.delete.", 403, "Forbidden")

        try:
            u_uuid = uuid.UUID(user_id_raw)
        except (ValueError, TypeError):
            raise UserServiceError("Invalid user ID format.", 400, "Bad Request")

        target = db.session.get(User, u_uuid)
        if not target:
            raise UserServiceError("User not found.", 404, "Not Found")

        if str(caller.user_id) == str(target.user_id):
            raise UserServiceError("Cannot delete your own administrator account.", 403, "Forbidden")

        if target.has_role("super_admin") and not caller.has_role("super_admin"):
            raise UserServiceError("Only a Super Admin can delete another Super Admin.", 403, "Forbidden")

        if not can_manage_account(caller, target):
            raise UserServiceError(OUT_OF_SCOPE_ACCOUNT_MESSAGE, 403, "Forbidden")

        deleted_email = target.email
        deleted_roles = [r.role_name for r in target.roles]

        audit = AuditLog(
            user_id=caller.user_id,
            action="USER_DELETED_PERMANENT",
            entity_type="user",
            entity_id=target.user_id,
            details={
                "deleted_email": deleted_email,
                "deleted_roles": deleted_roles,
                "actor_user_id": str(caller.user_id),
                "result": "SUCCESS"
            },
            ip_address=remote_addr
        )
        db.session.add(audit)
        db.session.delete(target)

        try:
            db.session.commit()
            return {"message": f"User {deleted_email} permanently deleted."}
        except Exception:
            db.session.rollback()
            raise UserServiceError("Failed to delete user.", 500, "Internal Server Error")

    @classmethod
    def get_staff_list(cls, caller: User | None) -> dict:
        """Real staff users from PostgreSQL (super_admin, admin, instructor)."""
        staff_users = User.query.filter(
            User.roles.any(Role.role_name.in_(["super_admin", "admin", "instructor"]))
        ).order_by(User.created_at.desc()).all()

        total_permissions = Permission.query.count()

        results = []
        for u in staff_users:
            role_names = [r.role_name for r in u.roles]
            primary = "super_admin" if "super_admin" in role_names else ("admin" if "admin" in role_names else "instructor")
            # FB-18: สิทธิ์ที่มีผลจริง = ผลรวม (union) ของสิทธิ์จากทุก Role ที่ผู้ใช้มี ไม่นับซ้ำ
            effective_permissions = sorted({
                p.permission_name
                for r in u.roles
                for p in r.permissions.all()
            })
            results.append({
                "id": str(u.user_id),
                "name": u.profile.display_name if u.profile else u.email,
                "email": u.email,
                "roleId": primary,
                "roles": role_names,
                "status": u.status,
                "createdAt": u.created_at.strftime("%Y-%m-%d") if u.created_at else "",
                "customPermissions": {},
                "permissions": effective_permissions,
                "permission_count": len(effective_permissions),
            })

        return {"staff": results, "total": len(results), "total_permissions": total_permissions}
