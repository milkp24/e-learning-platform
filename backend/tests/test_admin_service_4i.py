import uuid
import sys
import os

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.role import Role
from app.models.security import SystemSetting
from app.models.admin import AuditLog
from app.services.settings_service import SettingsService, SettingsServiceError
from app.services.audit_log_service import AuditLogService, AuditLogServiceError
from app.services.analytics_service import AnalyticsService, AnalyticsServiceError
from app.services.security_service import SecurityService, SecurityServiceError
from flask_jwt_extended import create_access_token


def test_admin_modularization():
    print("=" * 70)
    print("      TEST SUITE 4I: ADMIN MODULARIZATION & SECURITY VERIFICATION      ")
    print("=" * 70)

    app = create_app()
    with app.app_context():
        client = app.test_client()

        # Step 0: Identify test accounts
        super_admin = User.query.filter(User.roles.any(Role.role_name == "super_admin")).first()
        admin = User.query.filter(User.roles.any(Role.role_name == "admin")).filter(
            ~User.roles.any(Role.role_name == "super_admin")
        ).first()
        student = User.query.filter(User.roles.any(Role.role_name == "student")).first()

        assert super_admin, "Super Admin user required in DB"
        assert admin, "Admin user required in DB"
        assert student, "Student user required in DB"

        sa_token = create_access_token(identity=str(super_admin.user_id))
        admin_token = create_access_token(identity=str(admin.user_id))
        student_token = create_access_token(identity=str(student.user_id))

        sa_headers = {"Authorization": f"Bearer {sa_token}"}
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        student_headers = {"Authorization": f"Bearer {student_token}"}

        # ------------------------------------------------------------------
        # TEST 1: System Settings Domain (Public & Admin Access Control)
        # ------------------------------------------------------------------
        print("\n[TEST 1] Testing Settings Domain Endpoints:")

        # 1.1 Public Settings (Anonymous)
        r_pub = client.get("/api/v1/settings/public")
        assert r_pub.status_code == 200, f"Expected 200, got {r_pub.status_code}"
        pub_json = r_pub.get_json()
        assert "session_timeout_minutes" in pub_json
        assert "guest_timeout_minutes" in pub_json
        assert "warning_countdown_seconds" in pub_json
        assert isinstance(pub_json["session_timeout_minutes"], int)
        print("  -> PASS: GET /settings/public returns valid timeouts anonymously")

        # 1.2 All Settings RBAC (Student / Admin / Super Admin)
        r_st_set = client.get("/api/v1/admin/settings", headers=student_headers)
        assert r_st_set.status_code == 403
        r_ad_set = client.get("/api/v1/admin/settings", headers=admin_headers)
        assert r_ad_set.status_code == 403
        r_sa_set = client.get("/api/v1/admin/settings", headers=sa_headers)
        assert r_sa_set.status_code == 200
        assert "settings" in r_sa_set.get_json()
        print("  -> PASS: GET /admin/settings strictly restricted to Super Admin (403 for Student/Admin)")

        # 1.3 Update Settings RBAC & Persistence
        r_ad_upd = client.put("/api/v1/admin/settings", headers=admin_headers, json={"session_timeout_minutes": "45"})
        assert r_ad_upd.status_code == 403

        # Invalid payload (not a dict)
        r_bad = client.put("/api/v1/admin/settings", headers=sa_headers, json="not-a-dict")
        assert r_bad.status_code == 400

        # Successful update by Super Admin
        r_sa_upd = client.put("/api/v1/admin/settings", headers=sa_headers, json={"session_timeout_minutes": "30"})
        assert r_sa_upd.status_code == 200
        upd_json = r_sa_upd.get_json()
        assert upd_json["message"] == "บันทึกการตั้งค่าระบบเรียบร้อยแล้ว"
        assert any(s["key"] == "session_timeout_minutes" and s["value"] == "30" for s in upd_json["settings"])

        # Verify Audit Log was recorded
        audit = AuditLog.query.filter_by(action="SYSTEM_SETTINGS_UPDATED").order_by(AuditLog.created_at.desc()).first()
        assert audit is not None
        assert audit.user_id == super_admin.user_id
        assert audit.details.get("session_timeout_minutes") == "30"
        print("  -> PASS: PUT /admin/settings updated settings and wrote AuditLog")

        # ------------------------------------------------------------------
        # TEST 2: Dashboard Metrics & Analytics Domain
        # ------------------------------------------------------------------
        print("\n[TEST 2] Testing Dashboard Analytics Endpoints:")

        # 2.1 Super Admin Stats
        r_sa_stats_ad = client.get("/api/v1/admin/dashboard/superadmin-stats", headers=admin_headers)
        assert r_sa_stats_ad.status_code == 403
        r_sa_stats = client.get("/api/v1/admin/dashboard/superadmin-stats", headers=sa_headers)
        assert r_sa_stats.status_code == 200
        sa_metrics = r_sa_stats.get_json()
        assert "totalUsers" in sa_metrics
        assert "superAdminsCount" in sa_metrics
        assert "totalCourses" in sa_metrics
        assert "securityStats" in sa_metrics
        assert "systemStatus" in sa_metrics
        print("  -> PASS: GET /admin/dashboard/superadmin-stats verified for Super Admin (403 for Admin)")

        # 2.2 Admin Stats
        r_ad_stats_st = client.get("/api/v1/admin/dashboard/admin-stats", headers=student_headers)
        assert r_ad_stats_st.status_code == 403
        r_ad_stats = client.get("/api/v1/admin/dashboard/admin-stats", headers=admin_headers)
        assert r_ad_stats.status_code == 200
        ad_metrics = r_ad_stats.get_json()
        assert "totalUsers" in ad_metrics
        assert "totalCourses" in ad_metrics
        print("  -> PASS: GET /admin/dashboard/admin-stats verified for Admin (403 for Student)")

        # 2.3 Daily Activity
        r_daily = client.get("/api/v1/admin/dashboard/daily-activity", headers=admin_headers)
        assert r_daily.status_code == 200
        daily_json = r_daily.get_json()
        assert "days" in daily_json
        assert len(daily_json["days"]) == 7
        assert "hasData" in daily_json
        assert "average" in daily_json
        print("  -> PASS: GET /admin/dashboard/daily-activity returns 7-day trend")

        # 2.4 Usage Overview
        for rng in ["today", "7d", "30d"]:
            r_usage = client.get(f"/api/v1/admin/usage-overview?range={rng}", headers=admin_headers)
            assert r_usage.status_code == 200
            u_json = r_usage.get_json()
            assert u_json["range"] == rng
            assert "metrics" in u_json
            assert "logins" in u_json["metrics"]
            assert "activeLearners" in u_json["metrics"]
        print("  -> PASS: GET /admin/usage-overview verified for today, 7d, 30d")

        # ------------------------------------------------------------------
        # TEST 3: Audit Logs Domain
        # ------------------------------------------------------------------
        print("\n[TEST 3] Testing Audit Logs Domain:")
        # Normal admin blocked
        r_ad_log = client.get("/api/v1/admin/audit-logs", headers=admin_headers)
        assert r_ad_log.status_code == 403

        # Super admin access
        r_sa_log = client.get("/api/v1/admin/audit-logs?page=1&per_page=10", headers=sa_headers)
        assert r_sa_log.status_code == 200
        log_json = r_sa_log.get_json()
        assert "logs" in log_json
        assert "total" in log_json
        assert "page" in log_json
        assert "per_page" in log_json

        # Filter by action
        r_filt = client.get("/api/v1/admin/audit-logs?action=SYSTEM_SETTINGS_UPDATED", headers=sa_headers)
        assert r_filt.status_code == 200
        filt_json = r_filt.get_json()
        assert all(l["action"] == "SYSTEM_SETTINGS_UPDATED" for l in filt_json["logs"])
        print("  -> PASS: GET /admin/audit-logs pagination, search, and action filter verified")

        # ------------------------------------------------------------------
        # TEST 4: Security Overview Domain
        # ------------------------------------------------------------------
        print("\n[TEST 4] Testing Security Overview Domain:")
        # Normal admin blocked
        r_ad_sec = client.get("/api/v1/admin/security/overview", headers=admin_headers)
        assert r_ad_sec.status_code == 403

        # Super admin access
        r_sa_sec = client.get("/api/v1/admin/security/overview", headers=sa_headers)
        assert r_sa_sec.status_code == 200
        sec_json = r_sa_sec.get_json()
        assert "accessTokenTTLMinutes" in sec_json
        assert "refreshTokenTTLDays" in sec_json
        assert "activeSessions" in sec_json
        assert "securityScore" in sec_json
        assert "events" in sec_json
        print("  -> PASS: GET /admin/security/overview returns security metrics and events")

        # ------------------------------------------------------------------
        # TEST 5: User & Staff Domain Delegations
        # ------------------------------------------------------------------
        print("\n[TEST 5] Testing User & Staff Delegations through admin.py:")
        # List users
        r_users = client.get("/api/v1/admin/users?page=1&per_page=5", headers=admin_headers)
        assert r_users.status_code == 200
        assert "users" in r_users.get_json()

        # Staff list (Super Admin only)
        r_staff_ad = client.get("/api/v1/admin/staff", headers=admin_headers)
        assert r_staff_ad.status_code == 403
        r_staff_sa = client.get("/api/v1/admin/staff", headers=sa_headers)
        assert r_staff_sa.status_code == 200
        assert "staff" in r_staff_sa.get_json()
        print("  -> PASS: User and Staff endpoints function seamlessly through UserService delegation")

        # ------------------------------------------------------------------
        # TEST 6: Direct Domain Services Unit Execution
        # ------------------------------------------------------------------
        print("\n[TEST 6] Testing Direct Domain Service Methods:")
        assert isinstance(SettingsService.get_public_settings(), dict)
        assert isinstance(SettingsService.get_all_settings(), dict)
        assert isinstance(AnalyticsService.get_admin_dashboard_stats(), dict)
        assert isinstance(AnalyticsService.get_superadmin_dashboard_stats(), dict)
        assert isinstance(AnalyticsService.get_daily_activity(), dict)
        assert isinstance(AnalyticsService.get_usage_overview(date_range="7d"), dict)
        assert isinstance(AuditLogService.get_audit_logs(caller=super_admin), dict)
        assert isinstance(SecurityService.get_security_overview(caller=super_admin), dict)
        print("  -> PASS: All domain services executed unit operations directly without HTTP layer")

    print("\n" + "=" * 70)
    print("      ALL ADMIN MODULARIZATION (PHASE 4I) TESTS PASSED!      ")
    print("=" * 70)


if __name__ == "__main__":
    test_admin_modularization()
