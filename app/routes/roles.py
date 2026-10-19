from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.utils.decorators import roles_required, get_current_user
from app.services.role_service import RoleService, RoleServiceError

# =====================================================================
# roles.py: Route Controller สำหรับ Role, Permission, และ Matrix Management
# รองรับ UAT RBAC, Dynamic Permission Matrix, และ Privilege Escalation Protection
# สถาปัตยกรรม: Thin Route Controller มอบหมาย Business Logic ให้ RoleService
# =====================================================================

roles_bp = Blueprint("roles", __name__, url_prefix="/api/v1")


@roles_bp.route("/roles", methods=["GET"])
@roles_required("admin")
def list_all_roles():
    """List all available roles in the system. Restricted to Admins only."""
    try:
        result = RoleService.list_all_roles()
        return jsonify(result), 200
    except RoleServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500


@roles_bp.route("/users/<user_id>/roles", methods=["GET"])
@jwt_required()
def get_user_roles(user_id):
    """
    Get roles assigned to a user.
    Accessible only by the user themselves or by an Admin.
    """
    caller = get_current_user()
    try:
        result = RoleService.get_user_roles(user_id, caller)
        return jsonify(result), 200
    except RoleServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500


@roles_bp.route("/users/<user_id>/roles", methods=["POST"])
@roles_required("admin")
def assign_role_to_user(user_id):
    """Assign an additional role to a user. Restricted to Admins only."""
    caller = get_current_user()
    data = request.get_json(silent=True)
    try:
        result, status_code = RoleService.assign_role_to_user(user_id, caller, data, request.remote_addr)
        return jsonify(result), status_code
    except RoleServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception:
        return jsonify({"error": "Internal Server Error", "message": "Failed to assign role."}), 500


@roles_bp.route("/users/<user_id>/roles/<role_name>", methods=["DELETE"])
@roles_required("admin")
def remove_role_from_user(user_id, role_name):
    """Remove a role from a user. Restricted to Admins only."""
    caller = get_current_user()
    try:
        result = RoleService.remove_role_from_user(user_id, role_name, caller, request.remote_addr)
        return jsonify(result), 200
    except RoleServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception:
        return jsonify({"error": "Internal Server Error", "message": "Failed to remove role."}), 500


@roles_bp.route("/roles/matrix", methods=["GET"])
@roles_required("admin")
def get_roles_permission_matrix():
    """
    ดึงข้อมูล Dynamic Permission Matrix สำหรับทุก Role จากฐานข้อมูลจริง
    """
    try:
        result = RoleService.get_roles_permission_matrix()
        return jsonify(result), 200
    except RoleServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500


@roles_bp.route("/roles/<role_identifier>/permissions", methods=["GET"])
@roles_required("admin")
def get_role_permissions(role_identifier):
    """ดึงรายการ Permission ของ Role ที่กำหนด"""
    try:
        result = RoleService.get_role_permissions(role_identifier)
        return jsonify(result), 200
    except RoleServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500


@roles_bp.route("/roles/<role_identifier>/permissions", methods=["PUT"])
@roles_required("admin")
def update_role_permissions(role_identifier):
    """
    อัปเดตสิทธิ์ของบทบาทใน Dynamic Permission Matrix ลงในฐานข้อมูลจริง (role_permissions table)
    - ป้องกัน Privilege Escalation: Admin ธรรมดาไม่สามารถแก้ไขสิทธิ์ของ Super Admin ได้
    - บันทึก Audit Log เสมอ
    """
    caller = get_current_user()
    data = request.get_json(silent=True)
    try:
        result = RoleService.update_role_permissions(role_identifier, caller, data, request.remote_addr)
        return jsonify(result), 200
    except RoleServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception:
        return jsonify({"error": "Internal Server Error", "message": "Failed to update role permissions."}), 500
