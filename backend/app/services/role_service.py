import uuid
from sqlalchemy import func
from app.extensions import db
from app.models.user import User
from app.models.role import Role, Permission
from app.models.admin import AuditLog


class RoleServiceError(Exception):
    """Base exception for role and permission service operations."""
    def __init__(self, message: str, status_code: int = 400, error: str = "Bad Request"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error = error


class RoleService:
    """
    RoleService: Central business logic service for Roles, Permissions, and Dynamic Matrix.
    Encapsulates Role listing, User Role Assignment/Removal, Privilege Escalation Protection,
    Dynamic Permission Matrix queries/updates, and Security Audit Logging.
    """

    # =========================================================================
    # 1. Role Queries
    # =========================================================================

    @classmethod
    def list_all_roles(cls) -> dict:
        """List all available roles in the system ordered by role_name."""
        roles = Role.query.order_by(Role.role_name).all()
        return {
            "roles": [r.to_dict() for r in roles]
        }

    # =========================================================================
    # 2. User Roles Management & Privilege Escalation Protection
    # =========================================================================

    @classmethod
    def get_user_roles(cls, user_id_raw: str, caller: User | None) -> dict:
        """
        Get roles assigned to a user.
        Accessible only by the user themselves or by an Admin/Super Admin.
        """
        try:
            target_uuid = uuid.UUID(user_id_raw)
        except (ValueError, TypeError):
            raise RoleServiceError("Invalid user ID format.", 400, "Bad Request")

        if not caller or caller.status != "active":
            raise RoleServiceError("Caller account is inactive or not found.", 403, "Forbidden")

        # Check permission: caller must be self or have admin/super_admin role
        is_self = caller.user_id == target_uuid
        is_admin = caller.has_role("admin") or caller.has_role("super_admin")

        if not is_self and not is_admin:
            raise RoleServiceError("Access denied: cannot view another user's roles.", 403, "Forbidden")

        target_user = db.session.get(User, target_uuid)
        if not target_user:
            raise RoleServiceError("User not found.", 404, "Not Found")

        return {
            "user_id": str(target_user.user_id),
            "roles": [r.to_dict() for r in target_user.roles]
        }

    @classmethod
    def assign_role_to_user(
        cls,
        user_id_raw: str,
        caller: User | None,
        data: dict,
        remote_addr: str | None = None
    ) -> tuple[dict, int]:
        """
        Assign an additional role to a user.
        Enforces privilege escalation protections:
        - Users/Admins cannot modify their own roles
        - Only a Super Admin can assign the super_admin role
        - Prevents duplicate role assignments
        - Records AuditLog for super_admin assignments
        """
        try:
            target_uuid = uuid.UUID(user_id_raw)
        except (ValueError, TypeError):
            raise RoleServiceError("Invalid user ID format.", 400, "Bad Request")

        if not caller:
            raise RoleServiceError("Caller not found.", 401, "Unauthorized")

        target_user = db.session.get(User, target_uuid)
        if not target_user:
            raise RoleServiceError("User not found.", 404, "Not Found")

        # Privilege Escalation Protection: User/Admin cannot modify their own roles
        if str(caller.user_id) == str(target_user.user_id):
            raise RoleServiceError("Users cannot modify their own roles.", 403, "Forbidden")

        # #22: Admin ทั่วไปห้ามแก้ไขบทบาทใด ๆ ของบัญชี Super Admin (ทั้งเพิ่มและลบ)
        if target_user.has_role("super_admin") and not caller.has_role("super_admin"):
            raise RoleServiceError("Only a Super Admin can modify a Super Admin account.", 403, "Forbidden")

        if not data or not data.get("role_name"):
            raise RoleServiceError("role_name is required.", 400, "Bad Request")

        role_name = str(data.get("role_name")).strip().lower()
        role = Role.query.filter(func.lower(Role.role_name) == role_name).first()

        if not role:
            raise RoleServiceError(f"Role '{role_name}' does not exist.", 404, "Not Found")

        # Privilege Escalation Protection: Only Super Admin can assign super_admin role
        if role.role_name == "super_admin" and not caller.has_role("super_admin"):
            raise RoleServiceError("Only a Super Admin can assign the super_admin role.", 403, "Forbidden")

        # Prevent duplicate role assignment
        if target_user.has_role(role.role_name):
            raise RoleServiceError(f"User already has role '{role.role_name}'.", 409, "Conflict")

        previous_role = target_user.to_dict().get("role")
        target_user.roles.append(role)

        # Audit Log for super_admin assignments
        if role.role_name == "super_admin":
            audit = AuditLog(
                user_id=caller.user_id,
                action="SUPER_ADMIN_ROLE_ASSIGNED",
                entity_type="user",
                entity_id=target_user.user_id,
                details={
                    "actor_user_id": str(caller.user_id),
                    "target_user_id": str(target_user.user_id),
                    "action": "SUPER_ADMIN_ROLE_ASSIGNED",
                    "previous_role": previous_role,
                    "new_role": "super_admin",
                    "result": "SUCCESS"
                },
                ip_address=remote_addr
            )
            db.session.add(audit)

        try:
            db.session.commit()
            return {
                "message": f"Role '{role.role_name}' assigned successfully.",
                "user_id": str(target_user.user_id),
                "roles": [r.to_dict() for r in target_user.roles]
            }, 201
        except Exception:
            db.session.rollback()
            raise RoleServiceError("Failed to assign role.", 500, "Internal Server Error")

    @classmethod
    def remove_role_from_user(
        cls,
        user_id_raw: str,
        role_name_raw: str,
        caller: User | None,
        remote_addr: str | None = None
    ) -> dict:
        """
        Remove a role from a user.
        Enforces privilege escalation protections:
        - Users/Admins cannot modify their own roles
        - Only a Super Admin can modify the super_admin role
        - A user must retain at least one role
        - Records AuditLog for super_admin removals
        """
        try:
            target_uuid = uuid.UUID(user_id_raw)
        except (ValueError, TypeError):
            raise RoleServiceError("Invalid user ID format.", 400, "Bad Request")

        if not caller:
            raise RoleServiceError("Caller not found.", 401, "Unauthorized")

        target_user = db.session.get(User, target_uuid)
        if not target_user:
            raise RoleServiceError("User not found.", 404, "Not Found")

        # Privilege Escalation Protection: User/Admin cannot modify their own roles
        if str(caller.user_id) == str(target_user.user_id):
            raise RoleServiceError("Users cannot modify their own roles.", 403, "Forbidden")

        # #22: Admin ทั่วไปห้ามแก้ไขบทบาทใด ๆ ของบัญชี Super Admin (ทั้งเพิ่มและลบ)
        if target_user.has_role("super_admin") and not caller.has_role("super_admin"):
            raise RoleServiceError("Only a Super Admin can modify a Super Admin account.", 403, "Forbidden")

        clean_role_name = str(role_name_raw).strip().lower()
        role = Role.query.filter(func.lower(Role.role_name) == clean_role_name).first()

        if not role or not target_user.has_role(clean_role_name):
            raise RoleServiceError(f"User does not have role '{clean_role_name}'.", 404, "Not Found")

        # Privilege Escalation Protection: Only Super Admin can modify super_admin role
        if role.role_name == "super_admin" and not caller.has_role("super_admin"):
            raise RoleServiceError("Only a Super Admin can modify the super_admin role.", 403, "Forbidden")

        # User must retain at least one role
        if len(target_user.roles) <= 1:
            raise RoleServiceError(
                "Cannot remove user's only role. A user must have at least one role.",
                400,
                "Bad Request"
            )

        target_user.roles.remove(role)

        # Audit Log for super_admin removal
        if role.role_name == "super_admin":
            audit = AuditLog(
                user_id=caller.user_id,
                action="SUPER_ADMIN_ROLE_CHANGED",
                entity_type="user",
                entity_id=target_user.user_id,
                details={
                    "actor_user_id": str(caller.user_id),
                    "target_user_id": str(target_user.user_id),
                    "action": "SUPER_ADMIN_ROLE_CHANGED",
                    "previous_role": "super_admin",
                    "new_role": target_user.to_dict().get("role"),
                    "result": "SUCCESS"
                },
                ip_address=remote_addr
            )
            db.session.add(audit)

        try:
            db.session.commit()
            return {
                "message": f"Role '{role.role_name}' removed successfully.",
                "user_id": str(target_user.user_id),
                "roles": [r.to_dict() for r in target_user.roles]
            }
        except Exception:
            db.session.rollback()
            raise RoleServiceError("Failed to remove role.", 500, "Internal Server Error")

    # =========================================================================
    # 3. Dynamic Permission Matrix Management
    # =========================================================================

    @classmethod
    def get_roles_permission_matrix(cls) -> dict:
        """
        ดึงข้อมูล Dynamic Permission Matrix สำหรับทุก Role จากฐานข้อมูลจริง
        """
        roles = Role.query.all()
        matrix = {}
        for r in roles:
            matrix[r.role_name] = [p.permission_name for p in r.permissions.all()]
        return {"matrix": matrix}

    @classmethod
    def get_role_permissions(cls, role_identifier: str) -> dict:
        """ดึงรายการ Permission ของ Role ที่กำหนด (รองรับทั้ง UUID และ role_name)"""
        role = None
        try:
            r_uuid = uuid.UUID(role_identifier)
            role = db.session.get(Role, r_uuid)
        except (ValueError, TypeError):
            role = Role.query.filter(func.lower(Role.role_name) == str(role_identifier).strip().lower()).first()

        if not role:
            raise RoleServiceError("Role not found.", 404, "Not Found")

        return {
            "role_id": str(role.role_id),
            "role_name": role.role_name,
            "permissions": [p.permission_name for p in role.permissions.all()]
        }

    @classmethod
    def update_role_permissions(
        cls,
        role_identifier: str,
        caller: User | None,
        data: dict,
        remote_addr: str | None = None
    ) -> dict:
        """
        อัปเดตสิทธิ์ของบทบาทใน Dynamic Permission Matrix ลงในฐานข้อมูลจริง (role_permissions table)
        - ป้องกัน Privilege Escalation: Admin ธรรมดาไม่สามารถแก้ไขสิทธิ์ของ Super Admin ได้
        - บันทึก Audit Log เสมอ
        """
        if not caller:
            raise RoleServiceError("Caller not found.", 401, "Unauthorized")

        role = None
        try:
            r_uuid = uuid.UUID(role_identifier)
            role = db.session.get(Role, r_uuid)
        except (ValueError, TypeError):
            role = Role.query.filter(func.lower(Role.role_name) == str(role_identifier).strip().lower()).first()

        if not role:
            raise RoleServiceError("Role not found.", 404, "Not Found")

        # เฉพาะ Super Admin เท่านั้นที่สามารถแก้ไขสิทธิ์ของ Super Admin ได้
        if role.role_name == "super_admin" and not caller.has_role("super_admin"):
            raise RoleServiceError("Only a Super Admin can modify super_admin permissions.", 403, "Forbidden")

        if not data or "permissions" not in data or not isinstance(data.get("permissions"), list):
            raise RoleServiceError("permissions list is required.", 400, "Bad Request")

        new_perm_names = [str(p).strip().lower() for p in data["permissions"]]
        matched_perms = Permission.query.filter(Permission.permission_name.in_(new_perm_names)).all()

        # อัปเดตสิทธิ์ในฐานข้อมูล
        role.permissions = matched_perms

        # บันทึก Audit Log
        audit = AuditLog(
            user_id=caller.user_id,
            action="ROLE_PERMISSIONS_UPDATED",
            entity_type="role",
            entity_id=role.role_id,
            details={
                "actor_user_id": str(caller.user_id),
                "role_name": role.role_name,
                "permissions_count": len(matched_perms),
                "permissions": [p.permission_name for p in matched_perms],
                "result": "SUCCESS"
            },
            ip_address=remote_addr
        )
        db.session.add(audit)

        try:
            db.session.commit()
            return {
                "message": f"Permissions for role '{role.role_name}' updated successfully.",
                "role_name": role.role_name,
                "permissions": [p.permission_name for p in role.permissions.all()]
            }
        except Exception:
            db.session.rollback()
            raise RoleServiceError("Failed to update role permissions.", 500, "Internal Server Error")
