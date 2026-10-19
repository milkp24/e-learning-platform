"""
test_role_transition_suite.py
Verification suite for Role Transition, Upgrade, Downgrade, Permissions, and Token Security
Tests real Database (PostgreSQL) and real Flask endpoints:
- Test 1: User -> Super Admin upgrades to Admin -> Backend recognizes role, me returns admin, admin API allowed
- Test 2: Instructor -> Super Admin upgrades to Admin -> Backend recognizes role, me returns admin, admin API allowed
- Test 3: Admin -> Downgrade back to Instructor/User -> Admin API blocked with 403, me returns downgraded role
- Test 4: Student directly calls Admin APIs -> 403 Forbidden
- Test 5: Client-side role spoofing / Stale token permission enforcement in real-time
"""
import uuid
from app import create_app
from app.extensions import db
from app.models.user import User, UserProfile
from app.models.role import Role


def run_suite():
    app = create_app()
    client = app.test_client()

    print("======================================================================")
    print("       ROLE TRANSITION & ADMIN ACCESS TEST SUITE (REAL DB & API)      ")
    print("======================================================================")

    with app.app_context():
        # Setup clean test accounts
        student_user = User.query.filter_by(email="student@test.com").first()
        if not student_user:
            student_user = User(email="student@test.com", status="active")
            student_user.set_password("Password123")
            prof = UserProfile(user=student_user, display_name="Student Test")
            student_role = Role.query.filter_by(role_name="student").first()
            student_user.roles.append(student_role)
            db.session.add(student_user)
            db.session.add(prof)
        else:
            student_role = Role.query.filter_by(role_name="student").first()
            student_user.roles = [student_role]
            student_user.set_password("Password123")
            student_user.status = "active"

        instructor_user = User.query.filter_by(email="instructor@test.com").first()
        if not instructor_user:
            instructor_user = User(email="instructor@test.com", status="active")
            instructor_user.set_password("Password123")
            prof = UserProfile(user=instructor_user, display_name="Instructor Test")
            inst_role = Role.query.filter_by(role_name="instructor").first()
            instructor_user.roles.append(inst_role)
            db.session.add(instructor_user)
            db.session.add(prof)
        else:
            inst_role = Role.query.filter_by(role_name="instructor").first()
            instructor_user.roles = [inst_role]
            instructor_user.set_password("Password123")
            instructor_user.status = "active"

        super_admin_user = User.query.filter_by(email="superadmin@test.com").first()
        assert super_admin_user is not None, "Super admin must exist"
        super_admin_user.set_password("SuperAdmin@123")
        db.session.commit()

        # Login Super Admin
        sa_resp = client.post("/api/v1/auth/login", json={
            "email": "superadmin@test.com",
            "password": "SuperAdmin@123"
        })
        assert sa_resp.status_code == 200, f"Superadmin login failed: {sa_resp.get_json()}"
        sa_token = sa_resp.get_json()["access_token"]
        sa_headers = {"Authorization": f"Bearer {sa_token}"}

        # -------------------------------------------------------------
        # Test 4: User/Student calls Admin APIs directly -> 403 Forbidden
        # -------------------------------------------------------------
        print("\n[Test 4] User (Student) directly attempts to access Admin APIs:")
        st_resp = client.post("/api/v1/auth/login", json={
            "email": "student@test.com",
            "password": "Password123"
        })
        assert st_resp.status_code == 200
        st_data = st_resp.get_json()
        st_token = st_data["access_token"]
        assert st_data["role"] == "student"
        st_headers = {"Authorization": f"Bearer {st_token}"}

        # Attempt to access /admin/users
        res_admin_users = client.get("/api/v1/admin/users", headers=st_headers)
        assert res_admin_users.status_code == 403, f"Expected 403, got {res_admin_users.status_code}"
        print("   -> PASS: Student blocked from GET /api/v1/admin/users (403 Forbidden)")

        # Attempt to access /admin/dashboard/admin-stats
        res_admin_stats = client.get("/api/v1/admin/dashboard/admin-stats", headers=st_headers)
        assert res_admin_stats.status_code == 403, f"Expected 403, got {res_admin_stats.status_code}"
        print("   -> PASS: Student blocked from GET /api/v1/admin/dashboard/admin-stats (403 Forbidden)")

        # -------------------------------------------------------------
        # Test 1: User -> Super Admin upgrades to Admin
        # -------------------------------------------------------------
        print("\n[Test 1] User -> Super Admin upgrades to Admin:")
        upg_resp = client.put(
            f"/api/v1/admin/users/{student_user.user_id}/roles",
            headers=sa_headers,
            json={"roles": ["admin"]}
        )
        assert upg_resp.status_code == 200, f"Role upgrade failed: {upg_resp.get_json()}"
        upg_data = upg_resp.get_json()
        assert upg_data["user"]["role"] == "admin"
        print("   -> PASS: Database updated, Backend returned new role: admin")

        # User checks /auth/me with their EXISTING token
        me_resp = client.get("/api/v1/auth/me", headers=st_headers)
        assert me_resp.status_code == 200
        me_data = me_resp.get_json()
        assert me_data["role"] == "admin"
        assert me_data["user"]["role"] == "admin"
        print("   -> PASS: /auth/me returned role: admin for the upgraded user")

        # Upgraded user now calls Admin APIs with their token
        res_now_admin_users = client.get("/api/v1/admin/users", headers=st_headers)
        assert res_now_admin_users.status_code == 200
        assert "users" in res_now_admin_users.get_json()
        print("   -> PASS: Upgraded user successfully called GET /api/v1/admin/users (200 OK)")

        res_now_admin_stats = client.get("/api/v1/admin/dashboard/admin-stats", headers=st_headers)
        assert res_now_admin_stats.status_code == 200
        stats_body = res_now_admin_stats.get_json()
        assert "totalUsers" in stats_body
        assert "totalCourses" in stats_body
        print(f"   -> PASS: Real admin dashboard stats retrieved (totalUsers: {stats_body['totalUsers']}, totalCourses: {stats_body['totalCourses']})")

        # -------------------------------------------------------------
        # Test 2: Instructor -> Super Admin upgrades to Admin
        # -------------------------------------------------------------
        print("\n[Test 2] Instructor -> Super Admin upgrades to Admin:")
        inst_login = client.post("/api/v1/auth/login", json={
            "email": "instructor@test.com",
            "password": "Password123"
        })
        assert inst_login.status_code == 200
        inst_token = inst_login.get_json()["access_token"]
        inst_headers = {"Authorization": f"Bearer {inst_token}"}

        # Check instructor blocked from /admin/dashboard/admin-stats initially
        inst_init_stats = client.get("/api/v1/admin/dashboard/admin-stats", headers=inst_headers)
        assert inst_init_stats.status_code == 403
        print("   -> PASS: Instructor initially blocked from /admin/dashboard/admin-stats (403 Forbidden)")

        # Super Admin upgrades Instructor to Admin
        upg_inst = client.put(
            f"/api/v1/admin/users/{instructor_user.user_id}/roles",
            headers=sa_headers,
            json={"roles": ["admin"]}
        )
        assert upg_inst.status_code == 200

        # Instructor calls /auth/me
        inst_me = client.get("/api/v1/auth/me", headers=inst_headers)
        assert inst_me.status_code == 200
        assert inst_me.get_json()["role"] == "admin"
        print("   -> PASS: /auth/me recognized new role: admin for instructor")

        # Instructor calls /admin/dashboard/admin-stats
        inst_stats = client.get("/api/v1/admin/dashboard/admin-stats", headers=inst_headers)
        assert inst_stats.status_code == 200
        print("   -> PASS: Newly upgraded instructor accessed Admin Dashboard stats (200 OK)")

        # -------------------------------------------------------------
        # Test 3: Role Downgrade (Admin -> Instructor / User)
        # -------------------------------------------------------------
        print("\n[Test 3] Role Downgrade (Admin -> Instructor & Admin -> Student):")
        # Downgrade student_user back to student
        dwn_st = client.put(
            f"/api/v1/admin/users/{student_user.user_id}/roles",
            headers=sa_headers,
            json={"roles": ["student"]}
        )
        assert dwn_st.status_code == 200

        # Former admin immediately attempts admin endpoint with their old token
        blocked_st = client.get("/api/v1/admin/users", headers=st_headers)
        assert blocked_st.status_code == 403
        print("   -> PASS: Downgraded student immediately blocked from /admin/users (403 Forbidden)")

        # Downgrade instructor_user back to instructor
        dwn_inst = client.put(
            f"/api/v1/admin/users/{instructor_user.user_id}/roles",
            headers=sa_headers,
            json={"roles": ["instructor"]}
        )
        assert dwn_inst.status_code == 200

        blocked_inst = client.get("/api/v1/admin/dashboard/admin-stats", headers=inst_headers)
        assert blocked_inst.status_code == 403
        print("   -> PASS: Downgraded instructor immediately blocked from /admin/dashboard/admin-stats (403 Forbidden)")

        # -------------------------------------------------------------
        # Test 5: Client-side tampering / Security check
        # -------------------------------------------------------------
        print("\n[Test 5] Security Check - Cannot bypass Authorization by claiming admin role:")
        # Even if a client claims role is admin, the token identity is checked against the database
        fake_claim_headers = {
            "Authorization": f"Bearer {st_token}",
            "X-User-Role": "admin"
        }
        res_fake = client.get("/api/v1/admin/users", headers=fake_claim_headers)
        assert res_fake.status_code == 403
        print("   -> PASS: Real-time database check rejects any client-side role assertion (403 Forbidden)")

        print("\n======================================================================")
        print("        ALL ROLE TRANSITION & SECURITY TESTS PASSED PERFECTLY!        ")
        print("======================================================================")


if __name__ == "__main__":
    run_suite()
