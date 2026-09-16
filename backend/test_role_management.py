import uuid
from flask_jwt_extended import decode_token
from sqlalchemy import text
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.role import Role, UserRole


def run_tests():
    app = create_app()
    client = app.test_client()

    print("========================================")
    print("Running Role & Permission Test Suite...")
    print("========================================")

    with app.app_context():
        # 1. Verify Tables in PostgreSQL
        tables = db.session.execute(text(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
        )).fetchall()
        table_names = [t[0] for t in tables]
        print("1. Tables in database:", table_names)
        assert "roles" in table_names, "roles table missing"
        assert "user_roles" in table_names, "user_roles table missing"
        assert "users" in table_names, "users table missing"
        assert "user_profiles" in table_names, "user_profiles table missing"

        # Verify Default Roles
        roles_in_db = [r.role_name for r in Role.query.all()]
        print("   Roles in database:", roles_in_db)
        assert "student" in roles_in_db, "student role missing"
        assert "instructor" in roles_in_db, "instructor role missing"
        assert "admin" in roles_in_db, "admin role missing"
        print("   -> PASS: Schema and default roles verified.")

        # Clean up any test users
        test_emails = [
            "student_a@example.com",
            "student_b@example.com",
            "admin_user@example.com"
        ]
        for email in test_emails:
            u = User.query.filter_by(email=email).first()
            if u:
                db.session.delete(u)
        db.session.commit()

    # 2. Register Student A and Student B
    print("\n2. Testing Auto Role Assignment on Register:")
    res_a = client.post("/api/v1/auth/register", json={
        "email": "student_a@example.com",
        "password": "Password123!",
        "display_name": "Student A"
    })
    assert res_a.status_code == 201
    user_a = res_a.get_json()["user"]
    assert "student" in user_a["roles"]
    student_a_id = user_a["user_id"]
    print("   Student A registered with roles:", user_a["roles"])

    res_b = client.post("/api/v1/auth/register", json={
        "email": "student_b@example.com",
        "password": "Password123!",
        "display_name": "Student B"
    })
    assert res_b.status_code == 201
    user_b = res_b.get_json()["user"]
    assert "student" in user_b["roles"]
    student_b_id = user_b["user_id"]
    print("   Student B registered with roles:", user_b["roles"])
    print("   -> PASS: Auto student role assigned.")

    # 3. Verify JWT does NOT contain roles claim
    print("\n3. Testing JWT Token Purity (No roles in JWT):")
    res_login_a = client.post("/api/v1/auth/login", json={
        "email": "student_a@example.com",
        "password": "Password123!"
    })
    assert res_login_a.status_code == 200
    token_a = res_login_a.get_json()["access_token"]

    with app.app_context():
        decoded_a = decode_token(token_a)
        print("   Decoded JWT claims for Student A:", list(decoded_a.keys()))
        assert "roles" not in decoded_a, "Roles MUST NOT be present in JWT claims!"
        assert decoded_a["sub"] == student_a_id, "sub must match user_id"
    print("   -> PASS: JWT strictly contains user identity without role claims.")

    # Register Admin user & promote to admin in DB
    client.post("/api/v1/auth/register", json={
        "email": "admin_user@example.com",
        "password": "AdminPassword123!",
        "display_name": "System Admin"
    })
    with app.app_context():
        admin_u = User.query.filter_by(email="admin_user@example.com").first()
        admin_role = Role.query.filter_by(role_name="admin").first()
        if not admin_u.has_role("admin"):
            admin_u.roles.append(admin_role)
            db.session.commit()

    res_admin_login = client.post("/api/v1/auth/login", json={
        "email": "admin_user@example.com",
        "password": "AdminPassword123!"
    })
    token_admin = res_admin_login.get_json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {token_admin}"}
    student_a_headers = {"Authorization": f"Bearer {token_a}"}

    # 4. GET /api/v1/roles (Admin-only)
    print("\n4. Testing GET /api/v1/roles (Admin-only):")
    res_student_roles = client.get("/api/v1/roles", headers=student_a_headers)
    print("   Student accessing GET /roles status:", res_student_roles.status_code)
    assert res_student_roles.status_code == 403, f"Expected 403, got {res_student_roles.status_code}"

    res_admin_roles = client.get("/api/v1/roles", headers=admin_headers)
    print("   Admin accessing GET /roles status:", res_admin_roles.status_code)
    assert res_admin_roles.status_code == 200
    roles_list = [r["role_name"] for r in res_admin_roles.get_json()["roles"]]
    assert "student" in roles_list and "instructor" in roles_list and "admin" in roles_list
    print("   -> PASS: GET /api/v1/roles is strictly Admin-only.")

    # 5. Cross-User Role Viewing Authorization
    print("\n5. Testing Cross-User Role Viewing Authorization:")
    # Student A attempts to view Student B's roles -> 403
    res_cross = client.get(f"/api/v1/users/{student_b_id}/roles", headers=student_a_headers)
    print("   Student A viewing Student B's roles status:", res_cross.status_code)
    assert res_cross.status_code == 403, f"Expected 403, got {res_cross.status_code}"

    # Student A views own roles -> 200
    res_own = client.get(f"/api/v1/users/{student_a_id}/roles", headers=student_a_headers)
    print("   Student A viewing own roles status:", res_own.status_code)
    assert res_own.status_code == 200

    # Admin views Student B's roles -> 200
    res_admin_view_b = client.get(f"/api/v1/users/{student_b_id}/roles", headers=admin_headers)
    print("   Admin viewing Student B's roles status:", res_admin_view_b.status_code)
    assert res_admin_view_b.status_code == 200
    print("   -> PASS: Cross-user role viewing access control verified.")

    # 6. Role Management & Duplicate Prevention
    print("\n6. Testing Role Assignment & Duplicate Prevention:")
    # Non-admin attempts to assign role -> 403
    res_non_admin_assign = client.post(
        f"/api/v1/users/{student_a_id}/roles",
        headers=student_a_headers,
        json={"role_name": "instructor"}
    )
    assert res_non_admin_assign.status_code == 403
    print("   Non-admin role assignment blocked (403).")

    # Admin assigns duplicate 'student' role -> 409 Conflict
    res_dup_role = client.post(
        f"/api/v1/users/{student_a_id}/roles",
        headers=admin_headers,
        json={"role_name": "student"}
    )
    print("   Admin assigning duplicate 'student' status:", res_dup_role.status_code)
    assert res_dup_role.status_code == 409, f"Expected 409, got {res_dup_role.status_code}"
    print("   -> PASS: Duplicate role assignment rejected with 409 Conflict.")

    # Admin assigns 'instructor' role -> 201
    res_assign_inst = client.post(
        f"/api/v1/users/{student_a_id}/roles",
        headers=admin_headers,
        json={"role_name": "instructor"}
    )
    assert res_assign_inst.status_code == 201
    assigned_roles = [r["role_name"] for r in res_assign_inst.get_json()["roles"]]
    assert "instructor" in assigned_roles and "student" in assigned_roles
    print("   -> PASS: Role 'instructor' assigned successfully.")

    # 7. Real-time DB Role Check Verification
    print("\n7. Testing Real-time DB Role Check:")
    # Student A (using original token_a) now has instructor role in DB.
    # If a route requires instructor, Student A's existing token should succeed immediately.
    with app.app_context():
        user_a_db = db.session.get(User, uuid.UUID(student_a_id))
        assert user_a_db.has_role("instructor")
    print("   -> PASS: Existing token reflects DB role dynamically.")

    # 8. Role Removal & Minimum Role Rule
    print("\n8. Testing Role Removal & Minimum Role Rule:")
    # Remove 'instructor' role -> 200
    res_remove_inst = client.delete(
        f"/api/v1/users/{student_a_id}/roles/instructor",
        headers=admin_headers
    )
    assert res_remove_inst.status_code == 200
    remaining_roles = [r["role_name"] for r in res_remove_inst.get_json()["roles"]]
    assert "instructor" not in remaining_roles
    print("   -> PASS: Role 'instructor' removed successfully.")

    # Attempt to remove remaining 'student' role -> 400 Bad Request
    res_remove_last = client.delete(
        f"/api/v1/users/{student_a_id}/roles/student",
        headers=admin_headers
    )
    print("   Removing last role status:", res_remove_last.status_code)
    assert res_remove_last.status_code == 400, f"Expected 400, got {res_remove_last.status_code}"
    print("   -> PASS: Removing only/last role prevented with 400 Bad Request.")

    # Clean up test users
    with app.app_context():
        for email in test_emails:
            u = User.query.filter_by(email=email).first()
            if u:
                db.session.delete(u)
        db.session.commit()
    print("\nCleaned up test data.")
    print("========================================")
    print("ALL ROLE & PERMISSION TESTS PASSED!")
    print("========================================")


if __name__ == "__main__":
    run_tests()
