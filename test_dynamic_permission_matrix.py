import sys
import uuid
from app import create_app
from app.extensions import db
from app.models.user import User, UserProfile
from app.models.role import Role, Permission, RolePermission
from app.models.admin import AuditLog
from flask_jwt_extended import create_access_token

def run_tests():
    app = create_app()
    client = app.test_client()

    with app.app_context():
        print("======================================================================")
        print("       DYNAMIC PERMISSION MATRIX & USER EDIT TEST SUITE               ")
        print("======================================================================")

        # 1. Verify Permission Existence & Count
        print("\n--- Test 1: Verify 37 Permissions & users.edit in Database ---")
        total_perms = Permission.query.count()
        print(f"Total permissions in DB: {total_perms}")
        assert total_perms in [37, 41], f"Expected 37 or 41 permissions, found {total_perms}"

        perm_users_edit = Permission.query.filter_by(permission_name="users.edit").first()
        assert perm_users_edit is not None, "users.edit permission must exist in DB"
        print(f"Permission 'users.edit' found: id={perm_users_edit.permission_id}, module={perm_users_edit.module}")
        print("Test 1 Passed: permissions verified in DB.")

        # Setup test users
        super_admin = User.query.filter_by(email="superadmin@test.com").first()
        admin_user = User.query.filter_by(email="admin@test.com").first()
        student_user = User.query.filter_by(email="student@test.com").first()
        instructor = User.query.filter_by(email="instructor@test.com").first()

        assert super_admin is not None, "superadmin@test.com must exist"
        assert admin_user is not None, "admin@test.com must exist"
        assert student_user is not None, "student@test.com must exist"
        assert instructor is not None, "instructor@test.com must exist"

        admin_role = Role.query.filter_by(role_name="admin").first()
        sa_role = Role.query.filter_by(role_name="super_admin").first()

        # Ensure admin initially has users.edit
        admin_has_edit = RolePermission.query.filter_by(role_id=admin_role.role_id, permission_id=perm_users_edit.permission_id).first()
        if not admin_has_edit:
            db.session.add(RolePermission(role_id=admin_role.role_id, permission_id=perm_users_edit.permission_id))
            db.session.commit()

        sa_token = create_access_token(identity=str(super_admin.user_id))
        admin_token = create_access_token(identity=str(admin_user.user_id))
        student_token = create_access_token(identity=str(student_user.user_id))

        sa_headers = {"Authorization": f"Bearer {sa_token}", "Content-Type": "application/json"}
        admin_headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        student_headers = {"Authorization": f"Bearer {student_token}", "Content-Type": "application/json"}

        # 2. Test Role Matrix API endpoints
        print("\n--- Test 2: Role Permission Matrix API Endpoints ---")
        res_matrix = client.get("/api/v1/roles/matrix", headers=admin_headers)
        assert res_matrix.status_code == 200, f"Expected 200, got {res_matrix.status_code}"
        matrix = res_matrix.get_json()["matrix"]
        assert "super_admin" in matrix and len(matrix["super_admin"]) in [37, 41]
        assert "admin" in matrix and "users.edit" in matrix["admin"]
        print("GET /api/v1/roles/matrix returned 200 with full matrix.")

        res_admin_perms = client.get("/api/v1/roles/admin/permissions", headers=admin_headers)
        assert res_admin_perms.status_code == 200
        admin_perms_list = res_admin_perms.get_json()["permissions"]
        assert "users.edit" in admin_perms_list
        print("GET /api/v1/roles/admin/permissions returned 200.")
        print("Test 2 Passed: Role Matrix API endpoints work correctly.")

        # 3. Super Admin Edit User
        print("\n--- Test 3: Super Admin Can Edit User ---")
        edit_payload = {
            "title": "ดร.",
            "first_name": "สมชาย",
            "last_name": "ใจมั่น",
            "display_name": "ดร.สมชาย ใจมั่น",
            "occupation": "นักวิจัย"
        }
        res_sa_edit = client.patch(f"/api/v1/admin/users/{instructor.user_id}", headers=sa_headers, json=edit_payload)
        assert res_sa_edit.status_code == 200, f"Expected 200, got {res_sa_edit.status_code}: {res_sa_edit.get_json()}"
        print("Test 3 Passed: Super Admin successfully edited user.")

        # 4. Admin with users.edit ON
        print("\n--- Test 4: Admin with users.edit ON Can Edit User ---")
        db.session.expire_all()
        assert admin_user.has_permission("users.edit") is True, "Admin must have users.edit permission"

        edit_payload_admin = {
            "title": "อาจารย์",
            "first_name": "สมหญิง",
            "last_name": "ใจดี",
            "display_name": "อ.สมหญิง ใจดี",
            "occupation": "อาจารย์"
        }
        res_admin_edit = client.patch(f"/api/v1/admin/users/{instructor.user_id}", headers=admin_headers, json=edit_payload_admin)
        assert res_admin_edit.status_code == 200, f"Expected 200 for Admin with users.edit ON, got {res_admin_edit.status_code}: {res_admin_edit.get_json()}"
        print("Test 4 Passed: Admin with users.edit ON edited user successfully.")

        # 5. DYNAMIC PERMISSION TEST: Toggle users.edit OFF for Admin
        print("\n--- Test 5: Dynamic Matrix - Toggle users.edit OFF for Admin ---")
        # Remove users.edit from role admin
        RolePermission.query.filter_by(role_id=admin_role.role_id, permission_id=perm_users_edit.permission_id).delete()
        db.session.commit()
        db.session.expire_all()

        # Verify admin no longer has users.edit
        fresh_admin = db.session.get(User, admin_user.user_id)
        assert fresh_admin.has_permission("users.edit") is False, "Admin must NOT have users.edit after removal"

        # Admin attempts to edit user -> MUST BE REJECTED WITH 403 FORBIDDEN
        res_admin_off = client.patch(f"/api/v1/admin/users/{instructor.user_id}", headers=admin_headers, json=edit_payload_admin)
        assert res_admin_off.status_code == 403, f"Expected 403 Forbidden for Admin with users.edit OFF, got {res_admin_off.status_code}: {res_admin_off.get_json()}"
        assert "users.edit" in res_admin_off.get_json().get("message", "")
        print(f"Response when users.edit is OFF: HTTP {res_admin_off.status_code} - {res_admin_off.get_json()['message']}")
        print("Test 5 Passed: Admin with users.edit OFF is dynamically BLOCKED from editing user!")

        # 6. DYNAMIC PERMISSION TEST: Toggle users.edit back ON for Admin
        print("\n--- Test 6: Dynamic Matrix - Toggle users.edit back ON for Admin ---")
        # Re-add users.edit via the API endpoint PUT /api/v1/roles/admin/permissions
        current_admin_perms = [p.permission_name for p in admin_role.permissions.all()]
        new_admin_perms = current_admin_perms + ["users.edit"]
        res_toggle_on = client.put("/api/v1/roles/admin/permissions", headers=sa_headers, json={"permissions": new_admin_perms})
        assert res_toggle_on.status_code == 200, f"Expected 200 from PUT /roles/admin/permissions, got {res_toggle_on.status_code}"

        db.session.expire_all()
        fresh_admin = db.session.get(User, admin_user.user_id)
        assert fresh_admin.has_permission("users.edit") is True, "Admin must have users.edit restored"

        # Admin attempts to edit user -> MUST SUCCEED WITH 200
        res_admin_restored = client.patch(f"/api/v1/admin/users/{instructor.user_id}", headers=admin_headers, json=edit_payload_admin)
        assert res_admin_restored.status_code == 200, f"Expected 200 after restoration, got {res_admin_restored.status_code}: {res_admin_restored.get_json()}"
        print("Test 6 Passed: Admin with users.edit restored to ON can edit user again!")

        # 7. Non-privileged roles (Student, Guest)
        print("\n--- Test 7: Student and Guest Access Denied ---")
        res_student = client.patch(f"/api/v1/admin/users/{instructor.user_id}", headers=student_headers, json=edit_payload)
        assert res_student.status_code == 403, f"Expected 403 for student, got {res_student.status_code}"

        res_guest = client.patch(f"/api/v1/admin/users/{instructor.user_id}", json=edit_payload)
        assert res_guest.status_code == 401, f"Expected 401 for guest, got {res_guest.status_code}"
        print("Test 7 Passed: Student and Guest denied access.")

        # 8. IDOR & Privilege Escalation Protection
        print("\n--- Test 8: IDOR & Privilege Escalation Protection ---")
        # Admin cannot edit Super Admin
        res_admin_vs_sa = client.patch(f"/api/v1/admin/users/{super_admin.user_id}", headers=admin_headers, json=edit_payload)
        assert res_admin_vs_sa.status_code == 403, f"Expected 403, got {res_admin_vs_sa.status_code}"

        # Target user not found
        fake_uuid = str(uuid.uuid4())
        res_404 = client.patch(f"/api/v1/admin/users/{fake_uuid}", headers=admin_headers, json=edit_payload)
        assert res_404.status_code == 404, f"Expected 404 for unknown user, got {res_404.status_code}"

        # Invalid UUID
        res_400 = client.patch("/api/v1/admin/users/invalid-uuid", headers=admin_headers, json=edit_payload)
        assert res_400.status_code == 400, f"Expected 400 for bad UUID, got {res_400.status_code}"
        print("Test 8 Passed: IDOR & privilege escalation protected.")

        # 9. Audit Log Verification
        print("\n--- Test 9: Audit Log Verification ---")
        audits = AuditLog.query.filter_by(action="USER_UPDATED_BY_ADMIN").order_by(AuditLog.created_at.desc()).limit(3).all()
        assert len(audits) > 0, "Audit logs must be created for USER_UPDATED_BY_ADMIN"
        latest = audits[0]
        assert "target_email" in latest.details
        assert "changed_fields" in latest.details
        # Verify no sensitive data in audit log
        assert "password" not in latest.details
        assert "password_hash" not in latest.details
        assert "token" not in latest.details
        print("Test 9 Passed: AuditLog recorded with safe metadata.")

        print("\n======================================================================")
        print("       ALL 9 DYNAMIC PERMISSION MATRIX TESTS PASSED!                  ")
        print("======================================================================")

if __name__ == "__main__":
    run_tests()
