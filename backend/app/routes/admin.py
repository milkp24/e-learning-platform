from flask import Blueprint, Response, request, jsonify
from app.extensions import db
from app.models.admin import AuditLog
from app.utils.decorators import roles_required, get_current_user
from app.services.user_service import UserService, UserServiceError
from app.services.settings_service import SettingsService, SettingsServiceError
from app.services.audit_log_service import AuditLogService, AuditLogServiceError
from app.services.analytics_service import AnalyticsService, AnalyticsServiceError
from app.services.security_service import SecurityService, SecurityServiceError

admin_bp = Blueprint("admin", __name__, url_prefix="/api/v1")


# =====================================================================
# 1. User Management Endpoints (Delegated to UserService)
# =====================================================================

@admin_bp.route("/admin/users", methods=["GET"])
@roles_required("admin")
def list_users():
    """แสดงรายชื่อผู้ใช้ทั้งหมดในระบบ พร้อมการค้นหา การกรองตาม Role และ Status และ Pagination"""
    search = request.args.get("search", "").strip()
    role_filter = request.args.get("role", "").strip().lower()
    status_filter = request.args.get("status", "").strip().lower()

    try:
        page = max(1, int(request.args.get("page", 1)))
        per_page = min(100, max(1, int(request.args.get("per_page", 10))))
    except ValueError:
        page = 1
        per_page = 10

    caller = get_current_user()
    try:
        res = UserService.list_users(
            caller=caller,
            search=search,
            role_filter=role_filter,
            status_filter=status_filter,
            page=page,
            per_page=per_page
        )
        return jsonify(res), 200
    except UserServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code


@admin_bp.route("/admin/users", methods=["POST"])
@roles_required("admin")
def create_user():
    """สร้างบัญชีผู้ใช้งานใหม่โดย Admin หรือ Super Admin"""
    caller = get_current_user()
    data = request.get_json(silent=True)
    try:
        res, status_code = UserService.create_user(
            caller=caller,
            data=data,
            remote_addr=request.remote_addr
        )
        return jsonify(res), status_code
    except UserServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code


@admin_bp.route("/admin/users/<user_id>/status", methods=["PUT"])
@roles_required("admin")
def update_user_status(user_id):
    """เปลี่ยนสถานะผู้ใช้ เช่น 'active', 'inactive', 'suspended'"""
    caller = get_current_user()
    data = request.get_json(silent=True)
    try:
        res = UserService.update_user_status(user_id, caller, data)
        return jsonify(res), 200
    except UserServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code


@admin_bp.route("/admin/users/<user_id>", methods=["DELETE"])
@roles_required("admin")
def delete_user(user_id):
    """ลบผู้ใช้งานออกจากระบบถาวร (Permanent User Deletion)"""
    caller = get_current_user()
    try:
        res = UserService.delete_user(user_id, caller, remote_addr=request.remote_addr)
        return jsonify(res), 200
    except UserServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code


@admin_bp.route("/admin/users/<user_id>/roles", methods=["PUT"])
@roles_required("admin")
def update_user_roles(user_id):
    """เปลี่ยนสิทธิ์หรือบทบาท (Role) ของผู้ใช้งาน"""
    caller = get_current_user()
    data = request.get_json(silent=True)
    try:
        res = UserService.update_user_roles(user_id, caller, data, remote_addr=request.remote_addr)
        return jsonify(res), 200
    except UserServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code


@admin_bp.route("/admin/users/<user_id>", methods=["GET"])
@roles_required("admin")
def get_user_detail(user_id):
    """ดึงข้อมูลรายละเอียดผู้ใช้รายบุคคล (User Detail) จากฐานข้อมูลจริง"""
    caller = get_current_user()
    try:
        res = UserService.get_user_detail(user_id, caller)
        return jsonify(res), 200
    except UserServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code


@admin_bp.route("/admin/users/<user_id>", methods=["PATCH", "PUT"])
@roles_required("admin")
def update_user_account_and_profile(user_id):
    """แก้ไขข้อมูลบัญชีและโปรไฟล์ของผู้ใช้โดย Admin / Super Admin จากข้อมูลจริงในฐานข้อมูล"""
    caller = get_current_user()
    data = request.get_json(silent=True)
    try:
        res = UserService.update_user_account_and_profile(
            user_id,
            caller,
            data,
            remote_addr=request.remote_addr
        )
        return jsonify(res), 200
    except UserServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code


@admin_bp.route("/admin/users/<user_id>/password", methods=["PUT"])
@roles_required("admin")
def set_user_password(user_id):
    """Super Admin ตั้งรหัสผ่านใหม่ให้ผู้อื่นโดยไม่ต้องรู้รหัสเดิม (ข้อ 8)

    เปิดให้ Admin เรียกถึง Service ได้ เพื่อให้ความพยายามของ Admin ถูกบันทึก Audit Log (DENIED)
    การตรวจสิทธิ์ Super Admin ทำใน UserService.set_user_password
    """
    caller = get_current_user()
    data = request.get_json(silent=True)
    try:
        res = UserService.set_user_password(user_id, caller, data, remote_addr=request.remote_addr)
        return jsonify(res), 200
    except UserServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code


# =====================================================================
# 2. Staff Management Endpoints (Delegated to UserService)
# =====================================================================

@admin_bp.route("/admin/staff", methods=["GET"])
@roles_required("super_admin")
def get_staff_list():
    """Real staff users from PostgreSQL (Super Admin Only)."""
    caller = get_current_user()
    try:
        res = UserService.get_staff_list(caller)
        return jsonify(res), 200
    except UserServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code


# =====================================================================
# 3. System Settings & Dynamic Timeouts (Delegated to SettingsService)
# =====================================================================

@admin_bp.route("/settings/public", methods=["GET"])
def get_public_settings():
    """ดึงค่าตั้งค่าสาธารณะสำหรับ Frontend เช่น ค่า Timeout (UAT-015, UAT-020)"""
    res = SettingsService.get_public_settings()
    return jsonify(res), 200


@admin_bp.route("/admin/settings", methods=["GET"])
@roles_required("super_admin")
def get_all_settings():
    """ดึงค่าคอนฟิกทั้งหมดของระบบสำหรับหน้า Admin Console (UAT-035) - Super Admin Only"""
    caller = get_current_user()
    res = SettingsService.get_all_settings(caller)
    return jsonify(res), 200


@admin_bp.route("/admin/settings", methods=["PUT"])
@roles_required("super_admin")
def update_settings():
    """ปรับปรุงค่าคอนฟิกของระบบ เช่น เวลา Timeout (UAT-015, UAT-020, UAT-035) - Super Admin Only"""
    caller = get_current_user()
    data = request.get_json(silent=True)
    try:
        res = SettingsService.update_settings(caller, data, remote_addr=request.remote_addr)
        return jsonify(res), 200
    except SettingsServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code


# =====================================================================
# 4. Dashboard Metrics & Analytics (Delegated to AnalyticsService)
# =====================================================================

@admin_bp.route("/admin/dashboard/superadmin-stats", methods=["GET"])
@roles_required("super_admin")
def get_superadmin_dashboard_stats():
    """Returns 100% real database metrics for the Super Admin Console."""
    caller = get_current_user()
    try:
        res = AnalyticsService.get_superadmin_dashboard_stats(caller)
        return jsonify(res), 200
    except AnalyticsServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code


@admin_bp.route("/admin/dashboard/daily-activity", methods=["GET"])
@roles_required("admin")
def get_daily_activity():
    """Returns real daily active user counts for past 7 days based on PostgreSQL."""
    caller = get_current_user()
    try:
        res = AnalyticsService.get_daily_activity(caller)
        return jsonify(res), 200
    except AnalyticsServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code


@admin_bp.route("/admin/dashboard/admin-stats", methods=["GET"])
@roles_required("admin")
def get_admin_dashboard_stats():
    """Returns real database metrics for normal Admin Dashboard."""
    caller = get_current_user()
    try:
        res = AnalyticsService.get_admin_dashboard_stats(caller)
        return jsonify(res), 200
    except AnalyticsServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code


@admin_bp.route("/admin/usage-overview", methods=["GET"])
@roles_required("admin")
def get_usage_overview():
    """Usage overview aggregated from actual database records."""
    caller = get_current_user()
    date_range = request.args.get("range", "7d")
    try:
        res = AnalyticsService.get_usage_overview(
            caller,
            date_range=date_range,
            start=request.args.get("start"),
            end=request.args.get("end"),
        )
        return jsonify(res), 200
    except AnalyticsServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code


# =====================================================================
# 4.1 Reports (ข้อ 32): รายงานจากข้อมูลจริง ตามช่วงวันที่ และส่งออก CSV
# =====================================================================

@admin_bp.route("/admin/reports/summary", methods=["GET"])
@roles_required("admin")
def get_reports_summary():
    """สรุปรายงาน: ตัวชี้วัด ข้อมูลรายวัน และผลรายคอร์ส ตามช่วงวันที่"""
    from app.services.reports_service import ReportsService, ReportsServiceError, parse_date_range
    try:
        dr = parse_date_range(request.args.get("range"), request.args.get("start"), request.args.get("end"))
        return jsonify(ReportsService.summary(dr)), 200
    except ReportsServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code


@admin_bp.route("/admin/reports/export", methods=["GET"])
@roles_required("admin")
def export_reports():
    """ส่งออกรายงานเป็นไฟล์ CSV (PDF สร้างจากหน้ารายงานด้วยการพิมพ์ของเบราว์เซอร์)"""
    from app.services.reports_service import ReportsService, ReportsServiceError, parse_date_range
    fmt = (request.args.get("format") or "csv").lower()
    if fmt != "csv":
        return jsonify({"error": "Validation Error", "message": "รองรับการส่งออกเป็น CSV เท่านั้น"}), 400
    try:
        dr = parse_date_range(request.args.get("range"), request.args.get("start"), request.args.get("end"))
    except ReportsServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code

    caller = get_current_user()
    db.session.add(AuditLog(
        user_id=caller.user_id if caller else None,
        action="REPORT_EXPORTED",
        entity_type="report",
        details={"format": "csv", "start": dr.start.isoformat(), "end": dr.end.isoformat()},
        ip_address=request.remote_addr,
    ))
    db.session.commit()

    filename = f"elearning-report_{dr.start.isoformat()}_{dr.end.isoformat()}.csv"
    return Response(
        ReportsService.export_csv(dr),
        mimetype="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# =====================================================================
# 5. Audit Logs (Delegated to AuditLogService)
# =====================================================================

@admin_bp.route("/admin/audit-logs", methods=["GET"])
@roles_required("super_admin")
def get_audit_logs():
    """Real audit logs from PostgreSQL audit_logs table."""
    caller = get_current_user()
    search = request.args.get("search", "").strip().lower()
    action_filter = request.args.get("action", "").strip()

    try:
        page = max(1, int(request.args.get("page", 1)))
        per_page = min(100, max(1, int(request.args.get("per_page", 20))))
    except ValueError:
        page = 1
        per_page = 20

    try:
        res = AuditLogService.get_audit_logs(
            caller=caller,
            search=search,
            action_filter=action_filter,
            page=page,
            per_page=per_page
        )
        return jsonify(res), 200
    except AuditLogServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code


# =====================================================================
# 6. Security Overview (Delegated to SecurityService)
# =====================================================================

@admin_bp.route("/admin/security/overview", methods=["GET"])
@roles_required("super_admin")
def get_security_overview():
    """Real security metrics and logs for the Security dashboard."""
    caller = get_current_user()
    try:
        res = SecurityService.get_security_overview(caller)
        return jsonify(res), 200
    except SecurityServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
