import sys
import uuid
from app import create_app
from app.extensions import db
from app.models.user import User, UserProfile
from app.models.role import Role
from app.models.admin import AuditLog
from flask_jwt_extended import create_access_token

def run_tests():
    app = create_app()
    client = app.test_client()

    with app.app_context():
        # Setup: Ensure super_admin and instructor exist
        super_admin = User.query.filter_by(email="superadmin@test.com").first()
        if not super_admin:
            super_admin = User(email="superadmin@test.com", status="active")
            super_admin.set_password("Admin@123456")
            db.session.add(super_admin)
            sa_role = Role.query.filter_by(role_name="super_admin").first()
            if not sa_role:
                sa_role = Role(role_name="super_admin")
                db.session.add(sa_role)
            super_admin.roles.append(sa_role)
            db.session.commit()

        # Normal admin
        admin_user = User.query.filter_by(email="admin@test.com").first()
        if not admin_user:
            admin_user = User(email="admin@test.com", status="active")
            admin_user.set_password("Admin@123456")
            db.session.add(admin_user)
            a_role = Role.query.filter_by(role_name="admin").first()
            if not a_role:
                a_role = Role(role_name="admin")
                db.session.add(a_role)
            admin_user.roles.append(a_role)
            db.session.commit()

        # Student user
        student_user = User.query.filter_by(email="student@test.com").first()
        if not student_user:
            student_user = User(email="student@test.com", status="active")
            student_user.set_password("Password@123")
            db.session.add(student_user)
            s_role = Role.query.filter_by(role_name="student").first()
            if not s_role:
                s_role = Role(role_name="student")
                db.session.add(s_role)
            student_user.roles.append(s_role)
            db.session.commit()

        # Instructor user to edit
        instructor = User.query.filter_by(email="instructor@test.com").first()
        assert instructor is not None, "instructor@test.com must exist in DB"

        # Generate tokens
        sa_token = create_access_token(identity=str(super_admin.user_id))
        admin_token = create_access_token(identity=str(admin_user.user_id))
        student_token = create_access_token(identity=str(student_user.user_id))

        sa_headers = {"Authorization": f"Bearer {sa_token}", "Content-Type": "application/json"}
        admin_headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        student_headers = {"Authorization": f"Bearer {student_token}", "Content-Type": "application/json"}

        print("=== Test 1: GET /api/v1/admin/users/<user_id> by Super Admin ===")
        res = client.get(f"/api/v1/admin/users/{instructor.user_id}", headers=sa_headers)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.get_json()}"
        data = res.get_json()["user"]
        assert data["email"] == "instructor@test.com"
        print("Test 1 Passed: Retrieved user detail successfully.")

        print("=== Test 2: RBAC - Non-admin cannot access GET or PATCH ===")
        res = client.get(f"/api/v1/admin/users/{instructor.user_id}", headers=student_headers)
        assert res.status_code == 403, f"Expected 403 for student, got {res.status_code}"
        res = client.patch(f"/api/v1/admin/users/{instructor.user_id}", headers=student_headers, json={"display_name": "Hack"})
        assert res.status_code == 403, f"Expected 403 for student PATCH, got {res.status_code}"
        print("Test 2 Passed: Student forbidden from admin endpoints.")

        print("=== Test 3: IDOR & Security - Admin cannot modify Super Admin ===")
        res = client.patch(f"/api/v1/admin/users/{super_admin.user_id}", headers=admin_headers, json={"display_name": "Admin Modifies SA"})
        assert res.status_code == 403, f"Expected 403, got {res.status_code}: {res.get_json()}"
        print("Test 3 Passed: Admin blocked from modifying Super Admin.")

        print("=== Test 4: Validation - Duplicate Email Rejected ===")
        res = client.patch(f"/api/v1/admin/users/{instructor.user_id}", headers=sa_headers, json={"email": "student@test.com"})
        assert res.status_code == 409, f"Expected 409 Conflict for duplicate email, got {res.status_code}: {res.get_json()}"
        print("Test 4 Passed: Duplicate email rejected with 409.")

        print("=== Test 5: Validation - Invalid Display Name (<2 chars) Rejected ===")
        res = client.patch(f"/api/v1/admin/users/{instructor.user_id}", headers=sa_headers, json={"display_name": "A"})
        assert res.status_code == 400, f"Expected 400 for short display_name, got {res.status_code}: {res.get_json()}"
        print("Test 5 Passed: Invalid display_name rejected with 400.")

        print("=== Test 6: Successful User Update by Super Admin ===")
        # Ensure at least one field differs so audit log change detection triggers
        if instructor.profile:
            instructor.profile.first_name = "สมหญิงก่อนแก้"
            db.session.commit()

        initial_audit_count = AuditLog.query.filter_by(action="USER_UPDATED_BY_ADMIN").count()
        old_password_hash = instructor.password_hash
        old_created_at = instructor.created_at

        update_payload = {
            "title": "อาจารย์",
            "first_name": "สมหญิง",
            "last_name": "ใจดี",
            "display_name": "อ.สมหญิง ใจดี",
            "email": "instructor@test.com",
            "occupation": "อาจารย์",
            "institution_name": "มหาวิทยาลัยแห่งหนึ่ง",
            "institution_email": "somying@university.ac.th",
            "role": "instructor",
            "status": "active"
        }

        res = client.patch(f"/api/v1/admin/users/{instructor.user_id}", headers=sa_headers, json=update_payload)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.get_json()}"
        updated_data = res.get_json()["user"]
        assert updated_data["display_name"] == "อ.สมหญิง ใจดี"
        assert updated_data["profile"]["title"] == "อาจารย์"
        assert updated_data["profile"]["first_name"] == "สมหญิง"
        assert updated_data["profile"]["last_name"] == "ใจดี"
        assert updated_data["profile"]["occupation"] == "อาจารย์"
        assert updated_data["profile"]["institution_name"] == "มหาวิทยาลัยแห่งหนึ่ง"
        assert updated_data["profile"]["institution_email"] == "somying@university.ac.th"
        print("Test 6 Passed: Response contains updated fields.")

        print("=== Test 7: Verify DB Direct Persistence & Security Invariants ===")
        # Expire session to load fresh from DB
        db.session.expire_all()
        db_instructor = db.session.get(User, instructor.user_id)
        assert db_instructor.email == "instructor@test.com"
        assert db_instructor.password_hash == old_password_hash, "Security invariant broken: password_hash must be untouched!"
        assert db_instructor.created_at == old_created_at, "created_at must be untouched!"
        assert db_instructor.profile.title == "อาจารย์"
        assert db_instructor.profile.first_name == "สมหญิง"
        assert db_instructor.profile.last_name == "ใจดี"
        assert db_instructor.profile.display_name == "อ.สมหญิง ใจดี"
        assert db_instructor.profile.occupation == "อาจารย์"
        assert db_instructor.profile.institution_name == "มหาวิทยาลัยแห่งหนึ่ง"
        assert db_instructor.profile.institution_email == "somying@university.ac.th"

        new_audit_count = AuditLog.query.filter_by(action="USER_UPDATED_BY_ADMIN").count()
        assert new_audit_count == initial_audit_count + 1, f"Expected audit log to increment, got {new_audit_count} vs {initial_audit_count}"
        latest_audit = AuditLog.query.filter_by(action="USER_UPDATED_BY_ADMIN").order_by(AuditLog.created_at.desc()).first()
        assert latest_audit.details["target_email"] == "instructor@test.com"
        print("Test 7 Passed: Direct DB persistence verified and AuditLog recorded.")

        print("=== Test 8: Verify /api/v1/users/me for Instructor reflect updated values ===")
        inst_token = create_access_token(identity=str(instructor.user_id))
        inst_headers = {"Authorization": f"Bearer {inst_token}"}
        res_me = client.get("/api/v1/users/me", headers=inst_headers)
        assert res_me.status_code == 200, f"Expected 200 from /me, got {res_me.status_code}"
        me_profile = res_me.get_json()["user"]["profile"]
        assert me_profile["title"] == "อาจารย์"
        assert me_profile["first_name"] == "สมหญิง"
        assert me_profile["last_name"] == "ใจดี"
        assert me_profile["occupation"] == "อาจารย์"
        assert me_profile["institution_name"] == "มหาวิทยาลัยแห่งหนึ่ง"
        assert me_profile["institution_email"] == "somying@university.ac.th"
        assert me_profile["display_name"] == "อ.สมหญิง ใจดี"
        print("Test 8 Passed: /api/v1/users/me returns all real data without '-' placeholders!")

        print("\nALL 8 TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
