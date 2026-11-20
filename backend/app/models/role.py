import uuid
from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db

# =====================================================================
# role.py: Models บทบาทและสิทธิ์ (RBAC, Module 1.9)
# - Role: บทบาท (ค่าเริ่มต้นดู DEFAULT_ROLES)
# - Permission / RolePermission: สิทธิ์ย่อย และการผูกสิทธิ์กับบทบาท
# - UserRole: การผูกผู้ใช้กับบทบาท (ผู้ใช้ 1 คนมีได้หลายบทบาท)
# =====================================================================

DEFAULT_ROLES = ["student", "instructor", "admin", "super_admin"]


class Role(db.Model):
    """Role model defining access levels in the platform."""

    __tablename__ = "roles"

    role_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    role_name = db.Column(
        db.String(50),
        unique=True,
        nullable=False,
        index=True
    )
    description = db.Column(
        db.String(255),
        nullable=True
    )

    # Many-to-Many relationship with Permission via role_permissions
    permissions = db.relationship(
        "Permission",
        secondary="role_permissions",
        backref=db.backref("roles", lazy="dynamic"),
        lazy="dynamic"
    )

    def to_dict(self) -> dict:
        """Serialize role object to dictionary."""
        return {
            "role_id": str(self.role_id),
            "role_name": self.role_name,
            "description": self.description,
        }


class Permission(db.Model):
    """Granular functional permissions (Module 1.9)."""

    __tablename__ = "permissions"

    permission_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    permission_name = db.Column(
        db.String(100),
        unique=True,
        nullable=False,
        index=True
    )
    description = db.Column(
        db.String(255),
        nullable=True
    )
    module = db.Column(
        db.String(50),
        nullable=True
    )

    def to_dict(self) -> dict:
        return {
            "permission_id": str(self.permission_id),
            "permission_name": self.permission_name,
            "description": self.description,
            "module": self.module,
        }


class RolePermission(db.Model):
    """Many-to-Many mapping connecting Roles and Permissions."""

    __tablename__ = "role_permissions"

    role_permission_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    role_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("roles.role_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    permission_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("permissions.permission_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    __table_args__ = (
        db.UniqueConstraint("role_id", "permission_id", name="uq_role_permission"),
    )

    def to_dict(self) -> dict:
        return {
            "role_permission_id": str(self.role_permission_id),
            "role_id": str(self.role_id),
            "permission_id": str(self.permission_id),
        }


class UserRole(db.Model):
    """Mapping model connecting Users and Roles with unique constraint."""

    __tablename__ = "user_roles"

    user_role_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    user_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False
    )
    role_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("roles.role_id", ondelete="CASCADE"),
        nullable=False
    )

    __table_args__ = (
        db.UniqueConstraint("user_id", "role_id", name="uq_user_role"),
    )

    def to_dict(self) -> dict:
        """Serialize user role mapping to dictionary."""
        return {
            "user_role_id": str(self.user_role_id),
            "user_id": str(self.user_id),
            "role_id": str(self.role_id)
        }


CANONICAL_PERMISSIONS = [
    # 1. users (7)
    ("users.view", "ดูผู้ใช้งาน", "users"),
    ("users.create", "เพิ่มผู้ใช้งาน", "users"),
    ("users.edit", "แก้ไขผู้ใช้งาน", "users"),
    ("users.delete", "ลบผู้ใช้งาน (ถาวร)", "users"),
    ("users.suspend", "ระงับบัญชี", "users"),
    ("users.reset_password", "รีเซ็ตรหัสผ่าน", "users"),
    ("users.change_role", "เปลี่ยนบทบาทและจัดการสิทธิ์", "users"),
    # 2. courses (6)
    ("courses.view", "ดูคอร์ส", "courses"),
    ("courses.create", "สร้างคอร์ส", "courses"),
    ("courses.edit", "แก้ไขคอร์ส", "courses"),
    ("courses.delete", "ลบคอร์ส", "courses"),
    ("courses.publish", "เผยแพร่คอร์ส", "courses"),
    ("courses.unpublish", "ยกเลิกการเผยแพร่", "courses"),
    # 3. lessons (5)
    ("lessons.view", "ดูบทเรียน", "lessons"),
    ("lessons.create", "เพิ่มบทเรียน", "lessons"),
    ("lessons.edit", "แก้ไขบทเรียน", "lessons"),
    ("lessons.delete", "ลบบทเรียน", "lessons"),
    ("lessons.reorder", "จัดลำดับบทเรียน", "lessons"),
    # 4. quizzes (5)
    ("quizzes.view", "ดูแบบทดสอบ", "quizzes"),
    ("quizzes.create", "สร้างแบบทดสอบ", "quizzes"),
    ("quizzes.edit", "แก้ไขแบบทดสอบ", "quizzes"),
    ("quizzes.delete", "ลบแบบทดสอบ", "quizzes"),
    ("quizzes.publish", "เผยแพร่แบบทดสอบ", "quizzes"),
    # 5. missions (5)
    ("missions.view", "ดูภารกิจ", "missions"),
    ("missions.create", "สร้างภารกิจ", "missions"),
    ("missions.edit", "แก้ไขภารกิจ", "missions"),
    ("missions.delete", "ลบภารกิจ", "missions"),
    ("missions.toggle", "เปิด/ปิดภารกิจ", "missions"),
    # 6. reports (4)
    ("reports.view", "ดูรายงาน", "reports"),
    ("reports.user_stats", "ดูสถิติผู้ใช้งาน", "reports"),
    ("reports.progress", "ดูความคืบหน้าการเรียน", "reports"),
    ("reports.export", "ส่งออกรายงาน", "reports"),
    # 7. security (5)
    ("security.view", "ดูภาพรวมความปลอดภัย", "security"),
    ("security.login_history", "ดูประวัติการเข้าสู่ระบบ", "security"),
    ("security.audit_log", "ดูบันทึกระบบ (Audit Log)", "security"),
    ("security.session_manage", "จัดการเซสชันและบังคับออกจากระบบ", "security"),
    ("security.account_suspend", "ระงับบัญชีฉุกเฉิน", "security"),
    # 8. schools (4)
    ("schools.view", "ดูโรงเรียนและสถานศึกษา", "schools"),
    ("schools.create", "สร้างโรงเรียน", "schools"),
    ("schools.edit", "แก้ไขข้อมูลโรงเรียน", "schools"),
    ("schools.delete", "ลบโรงเรียน", "schools"),
]

SUPER_ADMIN_ONLY_PERMISSIONS = {
    "users.delete",
    "security.session_manage",
    "security.audit_log",
    "users.change_role",
    "schools.delete",
}


def seed_default_roles() -> list[Role]:
    """
    Ensure 4 canonical roles exist (student, instructor, admin, super_admin)
    and 37 permissions are registered with full_admin granted to super_admin.
    """
    roles_map = {}
    for name in DEFAULT_ROLES:
        role = Role.query.filter_by(role_name=name).first()
        if not role:
            desc = "Super Administrator with full platform authority" if name == "super_admin" else f"Default {name} role"
            role = Role(role_name=name, description=desc)
            db.session.add(role)
            db.session.flush()
        roles_map[name] = role

    # Seed 37 permissions
    perm_map = {}
    for perm_name, desc, mod in CANONICAL_PERMISSIONS:
        perm = Permission.query.filter_by(permission_name=perm_name).first()
        if not perm:
            perm = Permission(permission_name=perm_name, description=desc, module=mod)
            db.session.add(perm)
            db.session.flush()
        perm_map[perm_name] = perm

    # Grant full_admin (all 37 permissions) to super_admin
    super_admin_role = roles_map.get("super_admin")
    if super_admin_role:
        existing_super_perm_ids = {
            rp.permission_id for rp in RolePermission.query.filter_by(role_id=super_admin_role.role_id).all()
        }
        for p in perm_map.values():
            if p.permission_id not in existing_super_perm_ids:
                rp = RolePermission(role_id=super_admin_role.role_id, permission_id=p.permission_id)
                db.session.add(rp)

    # Grant standard permissions to normal admin (exclude super_admin-only)
    admin_role = roles_map.get("admin")
    if admin_role:
        existing_admin_perm_ids = {
            rp.permission_id for rp in RolePermission.query.filter_by(role_id=admin_role.role_id).all()
        }
        for p_name, p in perm_map.items():
            if p_name not in SUPER_ADMIN_ONLY_PERMISSIONS:
                if p.permission_id not in existing_admin_perm_ids:
                    rp = RolePermission(role_id=admin_role.role_id, permission_id=p.permission_id)
                    db.session.add(rp)

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()

    return list(roles_map.values())
