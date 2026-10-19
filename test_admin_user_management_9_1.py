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
        # Setup: Ensure super_admin, admin, instructor, student exist
        sa_role = Role.query.filter_by(role_name="super_admin").first()
        if not sa_role:
            sa_role = Role(role_name="super_admin")
            db.session.add(sa_role)

        admin_role = Role.query.filter_by(role_name="admin").first()
        if not admin_role:
            admin_role = Role(role_name="admin")
            db.session.add(admin_role)

        student_role = Role.query.filter_by(role_name="student").first()
        if not student_role:
            student_role = Role(role_name="student")
            db.session.add(student_role)

        inst_role = Role.query.filter_by(role_name="instructor").first()
        if not inst_role:
            inst_role = Role(role_name="instructor")
            db.session.add(inst_role)

        db.session.commit()

        # Ensure permissions exist
        p_create = Permission.query.filter_by(permission_name="users.create").first()
        if not p_create:
            p_create = Permission(permission_name="users.create", module="users")
            db.session.add(p_create)

        p_delete = Permission.query.filter_by(permission_name="users.delete").first()
        if not p_delete:
            p_delete = Permission(permission_name="users.delete", module="users")
            db.session.add(p_delete)

        db.session.commit()

        # Ensure super_admin has permissions
        super_admin = User.query.filter_by(email="sa_test_9_1@test.com").first()
        if not super_admin:
            super_admin = User(email="sa_test_9_1@test.com", status="active")
            super_admin.set_password("Admin@123456")
            super_admin.roles = [sa_role]
            super_admin.profile = UserProfile(display_name="Super Admin 9.1")
            db.session.add(super_admin)
            db.session.commit()

        # Admin WITH users.create permission
        admin_with_perm = User.query.filter_by(email="admin_with_create_9_1@test.com").first()
        if not admin_with_perm:
            admin_with_perm = User(email="admin_with_create_9_1@test.com", status="active")
            admin_with_perm.set_password("Admin@123456")
            admin_with_perm.roles = [admin_role]
            admin_with_perm.profile = UserProfile(display_name="Admin With Perm 9.1")
            db.session.add(admin_with_perm)
            db.session.commit()

        # Ensure admin_role has users.create permission
        rp_create = RolePermission.query.filter_by(role_id=admin_role.role_id, permission_id=p_create.permission_id).first()
        if not rp_create:
            rp_create = RolePermission(role_id=admin_role.role_id, permission_id=p_create.permission_id)
            db.session.add(rp_create)
            db.session.commit()

        # Create a restricted admin role WITHOUT users.create and WITHOUT users.delete
        restricted_role = Role.query.filter_by(role_name="restricted_admin_9_1").first()
        if not restricted_role:
            restricted_role = Role(role_name="restricted_admin_9_1")
            db.session.add(restricted_role)
            db.session.commit()

        admin_no_perm = User.query.filter_by(email="admin_no_perm_9_1@test.com").first()
        if not admin_no_perm:
            admin_no_perm = User(email="admin_no_perm_9_1@test.com", status="active")
            admin_no_perm.set_password("Admin@123456")
            admin_no_perm.roles = [restricted_role, admin_role]
            admin_no_perm.profile = UserProfile(display_name="Admin No Perm 9.1")
            db.session.add(admin_no_perm)
            db.session.commit()

        # Student user
        student_user = User.query.filter_by(email="student_test_9_1@test.com").first()
        if not student_user:
            student_user = User(email="student_test_9_1@test.com", status="active")
            student_user.set_password("Password@123")
            student_user.roles = [student_role]
            student_user.profile = UserProfile(display_name="Student 9.1")
            db.session.add(student_user)
            db.session.commit()

        # Instructor user
        inst_user = User.query.filter_by(email="instructor_test_9_1@test.com").first()
        if not inst_user:
            inst_user = User(email="instructor_test_9_1@test.com", status="active")
            inst_user.set_password("Password@123")
            inst_user.roles = [inst_role]
            inst_user.profile = UserProfile(display_name="Instructor 9.1")
            db.session.add(inst_user)
            db.session.commit()

        # Tokens
        sa_token = create_access_token(identity=str(super_admin.user_id))
        admin_token = create_access_token(identity=str(admin_with_perm.user_id))
        student_token = create_access_token(identity=str(student_user.user_id))
        inst_token = create_access_token(identity=str(inst_user.user_id))

        print("=== Test 1: Super Admin creates user successfully ===")
        unique_email_1 = f"created_by_sa_{uuid.uuid4().hex[:6]}@test.com"
        res = client.post(
            "/api/v1/admin/users",
            headers={"Authorization": f"Bearer {sa_token}"},
            json={
                "email": unique_email_1,
                "password": "Password@1234",
                "display_name": "Created By SA",
                "title": "นาย",
                "first_name": "สมชาย",
                "last_name": "ใจดี",
                "roles": ["student"],
                "status": "active"
            }
        )
        assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.get_json()}"
        data = res.get_json()
        assert data["user"]["email"] == unique_email_1
        assert data["user"]["profile"]["display_name"] == "Created By SA"
        print("Test 1 Passed: Super Admin created user.")

        print("=== Test 2: Admin with users.create permission creates student ===")
        unique_email_2 = f"created_by_admin_{uuid.uuid4().hex[:6]}@test.com"
        res = client.post(
            "/api/v1/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "email": unique_email_2,
                "password": "Password@1234",
                "display_name": "Created By Admin",
                "roles": ["student"],
                "status": "active"
            }
        )
        assert res.status_code == 201, f"Expected 201, got {res.status_code}: {res.get_json()}"
        print("Test 2 Passed: Admin with users.create created user.")

        print("=== Test 3: Admin WITHOUT users.create permission receives 403 ===")
        # Temporarily remove users.create from admin_role to test restricted access
        RolePermission.query.filter_by(role_id=admin_role.role_id, permission_id=p_create.permission_id).delete()
        db.session.commit()

        unique_email_3 = f"should_fail_{uuid.uuid4().hex[:6]}@test.com"
        res = client.post(
            "/api/v1/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "email": unique_email_3,
                "password": "Password@1234",
                "display_name": "Should Fail"
            }
        )
        assert res.status_code == 403, f"Expected 403, got {res.status_code}: {res.get_json()}"
        # Restore permission
        db.session.add(RolePermission(role_id=admin_role.role_id, permission_id=p_create.permission_id))
        db.session.commit()
        print("Test 3 Passed: Admin without users.create was forbidden (403).")

        print("=== Test 4: Student and Instructor forbidden from creating user ===")
        res_student = client.post(
            "/api/v1/admin/users",
            headers={"Authorization": f"Bearer {student_token}"},
            json={"email": "student_create@test.com", "password": "Password@1234"}
        )
        assert res_student.status_code == 403, f"Expected 403 for student, got {res_student.status_code}"

        res_inst = client.post(
            "/api/v1/admin/users",
            headers={"Authorization": f"Bearer {inst_token}"},
            json={"email": "inst_create@test.com", "password": "Password@1234"}
        )
        assert res_inst.status_code == 403, f"Expected 403 for instructor, got {res_inst.status_code}"

        res_guest = client.post(
            "/api/v1/admin/users",
            json={"email": "guest_create@test.com", "password": "Password@1234"}
        )
        assert res_guest.status_code in [401, 403], f"Expected 401/403 for guest, got {res_guest.status_code}"
        print("Test 4 Passed: Non-admins rejected.")

        print("=== Test 5: Role Security - Admin CANNOT create Super Admin ===")
        res = client.post(
            "/api/v1/admin/users",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "email": f"escalation_attempt_{uuid.uuid4().hex[:6]}@test.com",
                "password": "Password@1234",
                "display_name": "Hacker",
                "roles": ["super_admin"]
            }
        )
        assert res.status_code == 403, f"Expected 403, got {res.status_code}: {res.get_json()}"
        assert "Only a Super Admin can assign the super_admin role" in res.get_json()["message"]
        print("Test 5 Passed: Privilege escalation prevented (Admin cannot create Super Admin).")

        print("=== Test 6: Validation - Duplicate Email Rejected with 409 ===")
        res = client.post(
            "/api/v1/admin/users",
            headers={"Authorization": f"Bearer {sa_token}"},
            json={
                "email": unique_email_1,
                "password": "Password@1234",
                "display_name": "Duplicate User"
            }
        )
        assert res.status_code == 409, f"Expected 409, got {res.status_code}"
        print("Test 6 Passed: Duplicate email rejected with 409.")

        print("=== Test 7: Validation - Invalid Email Rejected with 400 ===")
        res = client.post(
            "/api/v1/admin/users",
            headers={"Authorization": f"Bearer {sa_token}"},
            json={
                "email": "not-an-email",
                "password": "Password@1234",
                "display_name": "Invalid Email User"
            }
        )
        assert res.status_code == 400, f"Expected 400, got {res.status_code}"
        print("Test 7 Passed: Invalid email rejected with 400.")

        print("=== Test 8: Validation - Short Password (<6 chars) Rejected with 400 ===")
        res = client.post(
            "/api/v1/admin/users",
            headers={"Authorization": f"Bearer {sa_token}"},
            json={
                "email": f"shortpw_{uuid.uuid4().hex[:6]}@test.com",
                "password": "123",
                "display_name": "Short Password User"
            }
        )
        assert res.status_code == 400, f"Expected 400, got {res.status_code}"
        print("Test 8 Passed: Short password rejected with 400.")

        print("=== Test 9: Delete User - Super Admin deletes user successfully ===")
        # Create a user to delete
        user_to_delete = User(email=f"del_target_{uuid.uuid4().hex[:6]}@test.com", status="active")
        user_to_delete.set_password("Password@1234")
        user_to_delete.roles = [student_role]
        user_to_delete.profile = UserProfile(display_name="To Delete")
        db.session.add(user_to_delete)
        db.session.commit()
        del_user_id = str(user_to_delete.user_id)

        res = client.delete(
            f"/api/v1/admin/users/{del_user_id}",
            headers={"Authorization": f"Bearer {sa_token}"}
        )
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.get_json()}"
        # Verify user is gone from DB
        assert db.session.get(User, uuid.UUID(del_user_id)) is None
        print("Test 9 Passed: Super Admin deleted user.")

        print("=== Test 10: Delete User - Admin WITHOUT users.delete permission is forbidden (403) ===")
        user_target2 = User(email=f"del_target2_{uuid.uuid4().hex[:6]}@test.com", status="active")
        user_target2.set_password("Password@1234")
        user_target2.roles = [student_role]
        db.session.add(user_target2)
        db.session.commit()
        del_user_id_2 = str(user_target2.user_id)

        # Admin does NOT have users.delete by default
        res = client.delete(
            f"/api/v1/admin/users/{del_user_id_2}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert res.status_code == 403, f"Expected 403, got {res.status_code}: {res.get_json()}"
        print("Test 10 Passed: Admin without users.delete permission rejected.")

        print("=== Test 11: Delete User - Admin CANNOT delete Super Admin (403) ===")
        # Grant users.delete temporarily to admin_role to test super_admin protection
        rp_del = RolePermission(role_id=admin_role.role_id, permission_id=p_delete.permission_id)
        db.session.add(rp_del)
        db.session.commit()

        res = client.delete(
            f"/api/v1/admin/users/{str(super_admin.user_id)}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert res.status_code == 403, f"Expected 403, got {res.status_code}"
        # Clean up
        db.session.delete(rp_del)
        db.session.commit()
        print("Test 11 Passed: Admin cannot delete Super Admin.")

        print("=== Test 12: Delete User - Self Delete is Forbidden (403) ===")
        res = client.delete(
            f"/api/v1/admin/users/{str(super_admin.user_id)}",
            headers={"Authorization": f"Bearer {sa_token}"}
        )
        assert res.status_code == 403, f"Expected 403 for self-delete, got {res.status_code}"
        print("Test 12 Passed: Self-delete blocked.")

        print("=== Test 13: Delete User - Target not found returns 404 ===")
        fake_uuid = str(uuid.uuid4())
        res = client.delete(
            f"/api/v1/admin/users/{fake_uuid}",
            headers={"Authorization": f"Bearer {sa_token}"}
        )
        assert res.status_code == 404, f"Expected 404, got {res.status_code}"
        print("Test 13 Passed: Non-existent user returned 404.")

        print("=== Test 14: Audit Log Verification - USER_CREATED & USER_DELETED_PERMANENT ===")
        audit_create = AuditLog.query.filter_by(action="USER_CREATED").order_by(AuditLog.created_at.desc()).first()
        assert audit_create is not None, "USER_CREATED audit log must exist"
        assert "password" not in str(audit_create.details).lower(), "Password must not be in audit log"
        assert "token" not in str(audit_create.details).lower(), "Token must not be in audit log"

        audit_delete = AuditLog.query.filter_by(action="USER_DELETED_PERMANENT").order_by(AuditLog.created_at.desc()).first()
        assert audit_delete is not None, "USER_DELETED_PERMANENT audit log must exist"
        assert audit_delete.actor is not None
        print("Test 14 Passed: Audit logs verified without sensitive data exposure.")

        print("\n=== ALL 14 TESTS IN 9.1 SUITE PASSED SUCCESSFULLY! ===")


if __name__ == "__main__":
    run_tests()
