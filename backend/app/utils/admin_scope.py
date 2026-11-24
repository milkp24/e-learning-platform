# =====================================================================
# admin_scope.py: ขอบเขตการจัดการบัญชีของ Admin (ข้อ 12)
#
# ตาม Workflow ของระบบ:
# - Admin จัดการได้เฉพาะบัญชีผู้เรียนและผู้สอน (สร้าง แก้ไข ระงับ ลบ กำหนดบทบาท)
# - บัญชีผู้ดูแลระบบ (admin / super_admin) และสิทธิ์ของบทบาทผู้ดูแลระบบ จัดการได้โดย Super Admin เท่านั้น
#   กัน Admin ให้สิทธิ์ตัวเองเพิ่ม เช่น แก้สิทธิ์ของบทบาท admin หรือแต่งตั้ง/ปลด Admin คนอื่น
# ใช้ร่วมกันใน UserService และ RoleService เพื่อให้กติกาตรงกันทุก Endpoint
# =====================================================================
STAFF_ROLES = frozenset({"admin", "super_admin"})
ADMIN_ASSIGNABLE_ROLES = frozenset({"student", "instructor"})

OUT_OF_SCOPE_ACCOUNT_MESSAGE = (
    "Admin จัดการได้เฉพาะบัญชีผู้เรียนและผู้สอน บัญชีผู้ดูแลระบบต้องให้ Super Admin เป็นผู้จัดการ"
)
OUT_OF_SCOPE_ROLE_MESSAGE = (
    "Admin กำหนดได้เฉพาะบทบาทผู้เรียนและผู้สอน การแต่งตั้งผู้ดูแลระบบต้องให้ Super Admin เป็นผู้ดำเนินการ"
)
OUT_OF_SCOPE_PERMISSION_MESSAGE = "สิทธิ์ของบทบาทผู้ดูแลระบบแก้ไขได้โดย Super Admin เท่านั้น"


def _is_super_admin(caller) -> bool:
    return bool(caller and caller.has_role("super_admin"))


def can_manage_account(caller, target) -> bool:
    """Super Admin จัดการได้ทุกบัญชี Admin จัดการได้เฉพาะบัญชีที่ไม่มีบทบาทผู้ดูแลระบบ"""
    if _is_super_admin(caller):
        return True
    if target is None:
        return True
    return not any(target.has_role(role) for role in STAFF_ROLES)


def can_assign_roles(caller, role_names) -> bool:
    """Super Admin กำหนดได้ทุกบทบาท Admin กำหนดได้เฉพาะผู้เรียน/ผู้สอน"""
    if _is_super_admin(caller):
        return True
    return set(role_names or []) <= ADMIN_ASSIGNABLE_ROLES


def can_edit_role_permissions(caller, role_name: str) -> bool:
    """สิทธิ์ของบทบาท admin / super_admin แก้ได้โดย Super Admin เท่านั้น"""
    if _is_super_admin(caller):
        return True
    return role_name not in STAFF_ROLES
