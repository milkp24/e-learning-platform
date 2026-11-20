import uuid
import sys
import os

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from app.extensions import db
from app.models.user import User, UserProfile
from app.models.role import Role
from app.models.admin import AuditLog
from app.services.user_service import UserService, UserServiceError


def test_user_domain():
    print("=" * 70)
    print("      TEST SUITE 4F: USER DOMAIN EXTRACTION & SECURITY CHECKS      ")
    print("=" * 70)

    app = create_app()
    with app.app_context():
        client = app.test_client()

        # Step 0: Identify test accounts
        super_admin = User.query.filter(User.roles.any(Role.role_name == "super_admin")).first()
        admin = User.query.filter(User.roles.any(Role.role_name == "admin")).filter(
            ~User.roles.any(Role.role_name == "super_admin")
        ).first()
        # ต้องเป็น student ที่มีโปรไฟล์ เพราะเทสต์นี้แก้ไขโปรไฟล์ (PUT /users/me/profile)
        student = User.query.filter(
            User.roles.any(Role.role_name == "student"), User.profile.has()
        ).first()

        assert super_admin, "Super Admin user required in DB"
        assert admin, "Admin user required in DB"
        assert student, "Student user required in DB"

        # Generate tokens
        from flask_jwt_extended import create_access_token
        sa_token = create_access_token(identity=str(super_admin.user_id))
        admin_token = create_access_token(identity=str(admin.user_id))
        student_token = create_access_token(identity=str(student.user_id))

        sa_headers = {"Authorization": f"Bearer {sa_token}"}
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        student_headers = {"Authorization": f"Bearer {student_token}"}

        # ------------------------------------------------------------------
        # TEST 1: Self Profile Endpoints (GET /users/me, PUT /users/me/profile)
        # ------------------------------------------------------------------
        print("\n[TEST 1] Testing Self Profile Endpoints:")
        r = client.get("/api/v1/users/me", headers=student_headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        me_data = r.get_json()
        assert "user" in me_data
        assert me_data["user"]["email"] == student.email
        print("   -> PASS: GET /users/me returned profile")

        # Update profile
        orig_name = student.profile.display_name if student.profile else "Student"
        new_name = f"Student 4F {uuid.uuid4().hex[:6]}"
        r = client.put(
            "/api/v1/users/me/profile",
            headers=student_headers,
            json={"display_name": new_name, "profile_image": "https://example.com/avatar.png"}
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        assert r.get_json()["user"]["profile"]["display_name"] == new_name
        print("   -> PASS: PUT /users/me/profile updated display name")

        # Validation failure
        r = client.put("/api/v1/users/me/profile", headers=student_headers, json={"display_name": "A"})
        assert r.status_code == 400
        print("   -> PASS: PUT /users/me/profile rejected invalid display name (400)")

        # Restore original display name
        client.put("/api/v1/users/me/profile", headers=student_headers, json={"display_name": orig_name})

        # ------------------------------------------------------------------
        # TEST 2: Student Dashboard (GET /student/dashboard & /users/me/dashboard)
        # ------------------------------------------------------------------
        print("\n[TEST 2] Testing Student Dashboard Endpoints:")
        r1 = client.get("/api/v1/student/dashboard", headers=student_headers)
        assert r1.status_code == 200, f"Expected 200, got {r1.status_code}"
        d1 = r1.get_json()
        assert "enrolledCourses" in d1
        assert "gamification" in d1
        assert "dailyQuests" in d1
        print("   -> PASS: GET /student/dashboard returned expected schema")

        r2 = client.get("/api/v1/users/me/dashboard", headers=student_headers)
        assert r2.status_code == 200
        assert r2.get_json()["coursesCount"] == d1["coursesCount"]
        print("   -> PASS: GET /users/me/dashboard matches /student/dashboard")

        # ------------------------------------------------------------------
        # TEST 3: Admin List Users (GET /admin/users)
        # ------------------------------------------------------------------
        print("\n[TEST 3] Testing Admin List Users (Pagination, Filter, Search):")
        # Student blocked
        r = client.get("/api/v1/admin/users", headers=student_headers)
        assert r.status_code == 403
        print("   -> PASS: Student blocked from GET /admin/users (403)")

        # Admin allowed
        r = client.get("/api/v1/admin/users?page=1&per_page=5", headers=admin_headers)
        assert r.status_code == 200
        users_page = r.get_json()
        assert "users" in users_page
        assert len(users_page["users"]) <= 5
        assert "total" in users_page
        print("   -> PASS: Admin listed users with pagination")

        # Filter by role
        r = client.get("/api/v1/admin/users?role=admin", headers=admin_headers)
        assert r.status_code == 200
        for u in r.get_json()["users"]:
            assert "admin" in u.get("roles", []) or u.get("role") == "admin"
        print("   -> PASS: Filter by role=admin verified")

        # ------------------------------------------------------------------
        # TEST 4: Admin Create User & Duplicate Check
        # ------------------------------------------------------------------
        print("\n[TEST 4] Testing User Creation Lifecycle:")
        test_email = f"test4f_{uuid.uuid4().hex[:8]}@example.com"
        create_payload = {
            "email": test_email,
            "password": "Password123!",
            "display_name": "Test User 4F",
            "roles": ["student"],
            "status": "active"
        }
        r = client.post("/api/v1/admin/users", headers=admin_headers, json=create_payload)
        assert r.status_code == 201, f"Expected 201, got {r.status_code}: {r.get_data(as_text=True)}"
        new_user_data = r.get_json()["user"]
        created_user_id = new_user_data["user_id"]
        print(f"   -> PASS: Admin created user (ID: {created_user_id})")

        # Duplicate email conflict
        r = client.post("/api/v1/admin/users", headers=admin_headers, json=create_payload)
        assert r.status_code == 409
        print("   -> PASS: Duplicate email rejected with 409 Conflict")

        # ------------------------------------------------------------------
        # TEST 5: Get User Detail & Update Profile
        # ------------------------------------------------------------------
        print("\n[TEST 5] Testing User Detail & Administrative Update:")
        r = client.get(f"/api/v1/admin/users/{created_user_id}", headers=admin_headers)
        assert r.status_code == 200
        assert r.get_json()["user"]["email"] == test_email
        print("   -> PASS: GET /admin/users/<id> returned user details")

        # Update user profile via Admin
        r = client.patch(
            f"/api/v1/admin/users/{created_user_id}",
            headers=admin_headers,
            json={
                "display_name": "Updated 4F Name",
                "occupation": "Engineer",
                "institution_name": "Acme Corp"
            }
        )
        assert r.status_code == 200
        updated_dict = r.get_json()["user"]
        assert updated_dict["profile"]["display_name"] == "Updated 4F Name"
        assert updated_dict["profile"]["occupation"] == "Engineer"
        assert updated_dict["profile"]["institution_name"] == "Acme Corp"
        print("   -> PASS: Admin updated user account and profile")

        # ------------------------------------------------------------------
        # TEST 6: User Status & Roles Update
        # ------------------------------------------------------------------
        print("\n[TEST 6] Testing Status & Role Transitions:")
        # Update status to suspended
        r = client.put(
            f"/api/v1/admin/users/{created_user_id}/status",
            headers=admin_headers,
            json={"status": "suspended"}
        )
        assert r.status_code == 200
        assert r.get_json()["user"]["status"] == "suspended"
        print("   -> PASS: User status transitioned to suspended")

        # Update role to instructor
        r = client.put(
            f"/api/v1/admin/users/{created_user_id}/roles",
            headers=admin_headers,
            json={"roles": ["instructor"]}
        )
        assert r.status_code == 200
        assert "instructor" in r.get_json()["user"]["roles"]
        print("   -> PASS: User role updated to instructor")

        # ------------------------------------------------------------------
        # TEST 7: Privilege Escalation & Self-Protection Rules
        # ------------------------------------------------------------------
        print("\n[TEST 7] Testing Security & Privilege Escalation Defenses:")
        # Normal Admin attempting to create super_admin
        sa_create_payload = {
            "email": f"hacker_{uuid.uuid4().hex[:6]}@hack.com",
            "password": "Password123!",
            "display_name": "Hacker Super Admin",
            "roles": ["super_admin"]
        }
        r = client.post("/api/v1/admin/users", headers=admin_headers, json=sa_create_payload)
        assert r.status_code == 403, f"Expected 403, got {r.status_code}"
        print("   -> PASS: Normal Admin cannot create super_admin (403)")

        # Normal Admin attempting to assign super_admin to user
        r = client.put(
            f"/api/v1/admin/users/{created_user_id}/roles",
            headers=admin_headers,
            json={"roles": ["super_admin"]}
        )
        assert r.status_code == 403
        print("   -> PASS: Normal Admin cannot assign super_admin role (403)")

        # Normal Admin attempting to modify Super Admin account
        r = client.patch(
            f"/api/v1/admin/users/{super_admin.user_id}",
            headers=admin_headers,
            json={"display_name": "Hacked SA"}
        )
        assert r.status_code == 403
        print("   -> PASS: Normal Admin cannot modify Super Admin account (403)")

        # Normal Admin attempting to delete Super Admin
        r = client.delete(f"/api/v1/admin/users/{super_admin.user_id}", headers=admin_headers)
        assert r.status_code == 403
        print("   -> PASS: Normal Admin cannot delete Super Admin (403)")

        # Admin attempting to modify own roles
        r = client.put(
            f"/api/v1/admin/users/{admin.user_id}/roles",
            headers=admin_headers,
            json={"roles": ["student"]}
        )
        assert r.status_code == 403
        print("   -> PASS: Admin cannot modify own roles (403)")

        # Admin attempting to suspend own account
        r = client.put(
            f"/api/v1/admin/users/{admin.user_id}/status",
            headers=admin_headers,
            json={"status": "suspended"}
        )
        assert r.status_code == 403
        print("   -> PASS: Admin cannot suspend own account (403)")

        # Admin attempting to delete own account
        r = client.delete(f"/api/v1/admin/users/{admin.user_id}", headers=admin_headers)
        assert r.status_code == 403
        print("   -> PASS: Admin cannot delete own account (403)")

        # ------------------------------------------------------------------
        # TEST 8: Permanent Delete & AuditLog Verification
        # ------------------------------------------------------------------
        print("\n[TEST 8] Testing Permanent Deletion & AuditLog Recording:")
        # Normal Admin without users.delete permission should be blocked with 403
        r = client.delete(f"/api/v1/admin/users/{created_user_id}", headers=admin_headers)
        assert r.status_code == 403
        print("   -> PASS: Admin without users.delete permission blocked (403)")

        # Super Admin has users.delete permission and can delete the user
        r = client.delete(f"/api/v1/admin/users/{created_user_id}", headers=sa_headers)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.get_data(as_text=True)}"
        print("   -> PASS: User permanently deleted by super admin")

        # Verify user is gone
        assert db.session.get(User, uuid.UUID(created_user_id)) is None
        print("   -> PASS: Verified user removed from PostgreSQL")

        # Verify audit log was recorded
        audit = AuditLog.query.filter_by(action="USER_DELETED_PERMANENT").order_by(AuditLog.created_at.desc()).first()
        assert audit is not None
        assert audit.details.get("deleted_email") == test_email
        print("   -> PASS: AuditLog verified with USER_DELETED_PERMANENT")

        # ------------------------------------------------------------------
        # TEST 9: Staff List (GET /admin/staff)
        # ------------------------------------------------------------------
        print("\n[TEST 9] Testing Staff List Endpoint:")
        # Normal admin blocked
        r = client.get("/api/v1/admin/staff", headers=admin_headers)
        assert r.status_code == 403
        print("   -> PASS: Normal Admin blocked from /admin/staff (403)")

        # Super admin allowed
        r = client.get("/api/v1/admin/staff", headers=sa_headers)
        assert r.status_code == 200
        staff_data = r.get_json()
        assert "staff" in staff_data
        assert "total" in staff_data
        print(f"   -> PASS: Super Admin accessed /admin/staff (Found {staff_data['total']} staff members)")

    print("\n" + "=" * 70)
    print("          ALL 9 TESTS IN PHASE 4F SUITE PASSED SUCCESSFULLY!          ")
    print("=" * 70)


if __name__ == "__main__":
    test_user_domain()
