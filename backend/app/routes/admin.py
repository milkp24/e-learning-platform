import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_, func
from app.extensions import db
from app.models.user import User, UserProfile
from app.models.role import Role
from app.models.security import SystemSetting
from app.utils.decorators import roles_required

# =====================================================================
# admin.py: API การจัดการระบบสำหรับ Admin (User Management & System Settings)
# รองรับ UAT-015, UAT-020, UAT-021, UAT-022, UAT-023, UAT-024, UAT-025, UAT-035
# =====================================================================

admin_bp = Blueprint("admin", __name__, url_prefix="/api/v1")


def get_current_user() -> User | None:
    """ดึงข้อมูลผู้ใช้ปัจจุบันจาก JWT Identity"""
    user_id = get_jwt_identity()
    if not user_id:
        return None
    try:
        user_uuid = uuid.UUID(str(user_id))
        return db.session.get(User, user_uuid)
    except (ValueError, TypeError):
        return None


# =====================================================================
# 1. User Management Endpoints (UAT-021, UAT-022, UAT-023, UAT-024, UAT-025)
# =====================================================================

@admin_bp.route("/admin/users", methods=["GET"])
@roles_required("admin")
def list_users():
    """
    แสดงรายชื่อผู้ใช้ทั้งหมดในระบบ พร้อมการค้นหา การกรองตาม Role และ Status และ Pagination (UAT-021, UAT-022, UAT-023)
    Query Parameters:
    - search: ค้นหาจากอีเมล หรือ ชื่อที่แสดงผล
    - role: กรองตาม Role ('student', 'instructor', 'admin')
    - status: กรองตาม Status ('active', 'inactive', 'suspended')
    - page: หน้าที่ต้องการ (เริ่มต้น: 1)
    - per_page: จำนวนต่อหน้า (เริ่มต้น: 10, สูงสุด: 100)
    """
    search = request.args.get("search", "").strip()
    role_filter = request.args.get("role", "").strip().lower()
    status_filter = request.args.get("status", "").strip().lower()

    try:
        page = max(1, int(request.args.get("page", 1)))
        per_page = min(100, max(1, int(request.args.get("per_page", 10))))
    except ValueError:
        page = 1
        per_page = 10

    query = User.query.join(UserProfile, User.user_id == UserProfile.user_id)

    # 1. การค้นหา (Search by email or display_name)
    if search:
        search_pattern = f"%{search.lower()}%"
        query = query.filter(
            or_(
                func.lower(User.email).like(search_pattern),
                func.lower(UserProfile.display_name).like(search_pattern)
            )
        )

    # 2. การกรองตามสถานะ (Status filter)
    if status_filter:
        query = query.filter(User.status == status_filter)

    # 3. การกรองตาม Role
    if role_filter:
        query = query.filter(User.roles.any(Role.role_name == role_filter))

    # คำนวณ Pagination
    total = query.count()
    users = query.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    pages = (total + per_page - 1) // per_page if per_page > 0 else 1

    return jsonify({
        "users": [u.to_dict() for u in users],
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": pages
    }), 200


@admin_bp.route("/admin/users/<user_id>/status", methods=["PUT"])
@roles_required("admin")
def update_user_status(user_id):
    """
    เปลี่ยนสถานะผู้ใช้ เช่น 'active', 'inactive', 'suspended' (UAT-024)
    - ผู้ใช้ที่ถูกระงับ (suspended) จะไม่สามารถล็อกอินหรือใช้งานระบบได้
    """
    try:
        u_uuid = uuid.UUID(user_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid user ID format."}), 400

    target_user = db.session.get(User, u_uuid)
    if not target_user:
        return jsonify({"error": "Not Found", "message": "User not found."}), 404

    data = request.get_json(silent=True)
    if not data or "status" not in data:
        return jsonify({"error": "Bad Request", "message": "status is required."}), 400

    new_status = str(data.get("status")).strip().lower()
    allowed_statuses = {"active", "inactive", "suspended"}
    if new_status not in allowed_statuses:
        return jsonify({
            "error": "Validation Error",
            "message": f"Invalid status '{new_status}'. Allowed: {', '.join(sorted(allowed_statuses))}."
        }), 400

    # ป้องกัน Admin ระงับสถานะตนเอง
    caller = get_current_user()
    if caller and str(caller.user_id) == str(target_user.user_id) and new_status != "active":
        return jsonify({
            "error": "Forbidden",
            "message": "Cannot deactivate or suspend your own administrator account."
        }), 403

    target_user.status = new_status
    try:
        db.session.commit()
        return jsonify({
            "message": f"User status updated to '{new_status}'.",
            "user": target_user.to_dict()
        }), 200
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": "Failed to update user status."}), 500


@admin_bp.route("/admin/users/<user_id>/roles", methods=["PUT"])
@roles_required("admin")
def update_user_roles(user_id):
    """
    เปลี่ยนสิทธิ์หรือบทบาท (Role) ของผู้ใช้งาน (UAT-025)
    - กำหนดรายการ Roles เช่น ['student'], ['instructor'], หรือ ['admin']
    """
    try:
        u_uuid = uuid.UUID(user_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid user ID format."}), 400

    target_user = db.session.get(User, u_uuid)
    if not target_user:
        return jsonify({"error": "Not Found", "message": "User not found."}), 404

    data = request.get_json(silent=True)
    if not data or "roles" not in data:
        return jsonify({"error": "Bad Request", "message": "roles array is required."}), 400

    role_names = data.get("roles")
    if not isinstance(role_names, list) or len(role_names) == 0:
        return jsonify({"error": "Validation Error", "message": "roles must be a non-empty list of role names."}), 400

    # ค้นหา Roles ใน Database
    matched_roles = Role.query.filter(Role.role_name.in_([r.strip().lower() for r in role_names])).all()
    if not matched_roles:
        return jsonify({"error": "Validation Error", "message": "No valid roles found."}), 400

    # ป้องกัน Admin ถอดสิทธิ์แอดมินของตนเอง
    caller = get_current_user()
    if caller and str(caller.user_id) == str(target_user.user_id):
        if not any(r.role_name == "admin" for r in matched_roles):
            return jsonify({"error": "Forbidden", "message": "Cannot revoke admin role from your own account."}), 403

    target_user.roles = matched_roles
    try:
        db.session.commit()
        return jsonify({
            "message": "User roles updated successfully.",
            "user": target_user.to_dict()
        }), 200
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": "Failed to update user roles."}), 500


# =====================================================================
# 2. System Settings & Dynamic Timeouts (UAT-015, UAT-020, UAT-035)
# =====================================================================

@admin_bp.route("/settings/public", methods=["GET"])
def get_public_settings():
    """
    ดึงค่าตั้งค่าสาธารณะสำหรับ Frontend เช่น ค่า Timeout (UAT-015, UAT-020)
    - ไม่ต้องใช้ JWT Token เพื่อให้ Guest Timer และ Inactivity Detector ทำงานได้ทันที
    """
    settings = SystemSetting.query.all()
    settings_map = {s.key: s.value for s in settings}

    # ค่า Default เผื่อกรณีใน DB ยังไม่ได้ตั้ง
    response_data = {
        "session_timeout_minutes": int(settings_map.get("session_timeout_minutes", "15")),
        "guest_timeout_minutes": int(settings_map.get("guest_timeout_minutes", "10")),
        "warning_countdown_seconds": int(settings_map.get("warning_countdown_seconds", "120")),
    }
    return jsonify(response_data), 200


@admin_bp.route("/admin/settings", methods=["GET"])
@roles_required("admin")
def get_all_settings():
    """ดึงค่าคอนฟิกทั้งหมดของระบบสำหรับหน้า Admin Console (UAT-035)"""
    settings = SystemSetting.query.all()
    return jsonify({
        "settings": [s.to_dict() for s in settings]
    }), 200


@admin_bp.route("/admin/settings", methods=["PUT"])
@roles_required("admin")
def update_settings():
    """
    ปรับปรุงค่าคอนฟิกของระบบ เช่น เวลา Timeout (UAT-015, UAT-020, UAT-035)
    - รับ JSON Object ในรูป key-value: {"session_timeout_minutes": "20", ...}
    """
    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return jsonify({"error": "Bad Request", "message": "JSON object with setting keys and values is required."}), 400

    updated = []
    for k, v in data.items():
        setting = db.session.get(SystemSetting, k)
        if setting:
            setting.value = str(v)
            updated.append(setting.to_dict())
        else:
            new_s = SystemSetting(key=k, value=str(v))
            db.session.add(new_s)
            updated.append(new_s.to_dict())

    try:
        db.session.commit()
        return jsonify({
            "message": "Settings updated successfully.",
            "settings": updated
        }), 200
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": "Failed to update settings."}), 500
