import uuid
from app import create_app
from app.extensions import db
from app.models.user import User, UserProfile
from app.models.role import Role, UserRole
from app.models.classroom import Classroom, ClassroomMember, Lesson
from create_superadmin import provision_first_super_admin


def run_security_suite():
    app = create_app()
    client = app.test_client()

    print("======================================================================")
    print("      SUPER ADMIN & SECURITY RBAC AUTOMATED TEST SUITE (14 TESTS)     ")
    print("======================================================================")

    test_results = {}

    with app.app_context():
        def cleanup_test_data():
            test_emails = [
                "sec_admin@example.com",
                "sec_student@example.com",
                "sec_instructor_a@example.com",
                "sec_instructor_b@example.com",
                "sec_target@example.com",
            ]
            users = User.query.filter(User.email.in_(test_emails)).all()
            user_ids = [u.user_id for u in users]
            if user_ids:
                ClassroomMember.query.filter(ClassroomMember.user_id.in_(user_ids)).delete(synchronize_session=False)
                courses = Classroom.query.filter(Classroom.instructor_id.in_(user_ids)).all()
                course_ids = [c.classroom_id for c in courses]
                if course_ids:
                    ClassroomMember.query.filter(ClassroomMember.classroom_id.in_(course_ids)).delete(synchronize_session=False)
                    Lesson.query.filter(Lesson.classroom_id.in_(course_ids)).delete(synchronize_session=False)
                    Classroom.query.filter(Classroom.classroom_id.in_(course_ids)).delete(synchronize_session=False)
                UserRole.query.filter(UserRole.user_id.in_(user_ids)).delete(synchronize_session=False)
                UserProfile.query.filter(UserProfile.user_id.in_(user_ids)).delete(synchronize_session=False)
                User.query.filter(User.user_id.in_(user_ids)).delete(synchronize_session=False)
                db.session.commit()

        cleanup_test_data()

        # Helper to get JWT token
        def get_auth_token(email, password):
            resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
            assert resp.status_code == 200, f"Login failed for {email}: {resp.get_json()}"
            return resp.get_json()["access_token"]

        # Helper to create user with roles
        def create_user_with_role(email, password, role_name, display_name):
            u = User(email=email, status="active")
            u.set_password(password)
            p = UserProfile(user_id=u.user_id, display_name=display_name)
            u.profile = p
            r = Role.query.filter_by(role_name=role_name).first()
            if r:
                u.roles.append(r)
            db.session.add(u)
            db.session.commit()
            return u

        # ------------------------------------------------------------------
        # TEST 1: Provisioning Test
        # ------------------------------------------------------------------
        print("\n[TEST 1] Provisioning Test: Super Admin exists with secure hash...")
        super_admin_user = User.query.filter_by(email="superadmin@test.com").first() or User.query.join(UserRole).join(Role).filter(Role.role_name == "super_admin").first()
        assert super_admin_user is not None, "Super Admin user not found in database!"
        # Check password hash algorithm (bcrypt or argon2)
        pw_hash = super_admin_user.password_hash
        assert pw_hash.startswith("$2b$") or pw_hash.startswith("$argon2") or "argon2" in pw_hash or "scrypt" in pw_hash or pw_hash.startswith("scrypt:"), f"Invalid hash: {pw_hash}"
        assert super_admin_user.has_role("super_admin"), "User does not have super_admin role"
        test_results["Test 1: Provisioning & Password Hash"] = "PASS"
        print("  -> PASS: Super Admin exists, role is super_admin, password securely hashed.")

        # ------------------------------------------------------------------
        # TEST 2: Duplicate Prevention Test
        # ------------------------------------------------------------------
        print("\n[TEST 2] Duplicate Prevention Test: Running provisioner again...")
        count_before = User.query.join(UserRole).join(Role).filter(Role.role_name == "super_admin").count()
        success = provision_first_super_admin("another_superadmin@test.com", "SuperAdminPass123!", "Second Admin")
        count_after = User.query.join(UserRole).join(Role).filter(Role.role_name == "super_admin").count()
        assert not success, "Provisioning succeeded when a Super Admin already exists!"
        assert count_before == count_after, "Duplicate Super Admin was created in database!"
        test_results["Test 2: Duplicate Prevention"] = "PASS"
        print("  -> PASS: Rejected duplicate provisioning when a Super Admin already exists.")

        # ------------------------------------------------------------------
        # TEST 3: Registration Block Test
        # ------------------------------------------------------------------
        print("\n[TEST 3] Registration Block Test: Requesting role=super_admin or role=admin via register...")
        reg_res = client.post("/api/v1/auth/register", json={
            "email": "hacker@test.com",
            "password": "Password123!",
            "display_name": "Privilege Escalation Attempt",
            "role": "super_admin"
        })
        assert reg_res.status_code == 403, f"Expected 403 Forbidden, got {reg_res.status_code}"
        reg_data = reg_res.get_json()
        assert "not allowed" in reg_data.get("message", "").lower() or "403" in str(reg_res.status_code)
        test_results["Test 3: Registration Privilege Escalation Block"] = "PASS"
        print("  -> PASS: Registering with administrative role correctly blocked with 403 Forbidden.")

        # Set up test users for remaining tests
        admin_user = create_user_with_role("sec_admin@example.com", "AdminPass123!", "admin", "Sec Admin")
        student_user = create_user_with_role("sec_student@example.com", "StudentPass123!", "student", "Sec Student")
        inst_a = create_user_with_role("sec_instructor_a@example.com", "InstPass123!", "instructor", "Instructor A")
        inst_b = create_user_with_role("sec_instructor_b@example.com", "InstPass123!", "instructor", "Instructor B")
        target_user = create_user_with_role("sec_target@example.com", "TargetPass123!", "student", "Target Student")

        # Setup course for Instructor A
        course_a = Classroom(
            title="Course By Instructor A",
            description="Physics 101",
            instructor_id=inst_a.user_id,
            status="active"
        )
        db.session.add(course_a)
        # Setup course for Instructor B
        course_b = Classroom(
            title="Course By Instructor B",
            description="Chemistry 201",
            instructor_id=inst_b.user_id,
            status="active"
        )
        db.session.add(course_b)
        db.session.commit()

        # Add lesson to course A
        lesson_a = Lesson(
            classroom_id=course_a.classroom_id,
            title="Lesson A1",
            sequence_no=1,
            status="active"
        )
        db.session.add(lesson_a)
        # Enroll student in Course A
        enrollment = ClassroomMember(
            classroom_id=course_a.classroom_id,
            user_id=student_user.user_id,
            status="enrolled"
        )
        db.session.add(enrollment)
        db.session.commit()

        # Get tokens
        super_token = get_auth_token(super_admin_user.email, "SuperAdmin@123")
        admin_token = get_auth_token("sec_admin@example.com", "AdminPass123!")
        student_token = get_auth_token("sec_student@example.com", "StudentPass123!")
        inst_a_token = get_auth_token("sec_instructor_a@example.com", "InstPass123!")
        inst_b_token = get_auth_token("sec_instructor_b@example.com", "InstPass123!")

        super_headers = {"Authorization": f"Bearer {super_token}"}
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        student_headers = {"Authorization": f"Bearer {student_token}"}
        inst_a_headers = {"Authorization": f"Bearer {inst_a_token}"}
        inst_b_headers = {"Authorization": f"Bearer {inst_b_token}"}

        # ------------------------------------------------------------------
        # TEST 4: Normal Admin Restrictions Test
        # ------------------------------------------------------------------
        print("\n[TEST 4] Normal Admin Restrictions: Admin accessing Super Admin settings...")
        settings_res = client.get("/api/v1/admin/settings", headers=admin_headers)
        assert settings_res.status_code == 403, f"Expected 403 Forbidden, got {settings_res.status_code}"
        # Super admin accessing settings should succeed
        sa_settings_res = client.get("/api/v1/admin/settings", headers=super_headers)
        assert sa_settings_res.status_code == 200, f"Super Admin settings failed: {sa_settings_res.status_code}"
        test_results["Test 4: Normal Admin Settings Restriction"] = "PASS"
        print("  -> PASS: Normal Admin blocked with 403; Super Admin allowed with 200.")

        # ------------------------------------------------------------------
        # TEST 5: Normal Admin Cannot Assign Super Admin
        # ------------------------------------------------------------------
        print("\n[TEST 5] Normal Admin assigning Super Admin role...")
        assign_res = client.post(f"/api/v1/users/{target_user.user_id}/roles", json={
            "role_name": "super_admin"
        }, headers=admin_headers)
        assert assign_res.status_code == 403, f"Expected 403 Forbidden, got {assign_res.status_code}"
        test_results["Test 5: Normal Admin cannot assign Super Admin"] = "PASS"
        print("  -> PASS: Normal Admin cannot assign super_admin role (HTTP 403).")

        # ------------------------------------------------------------------
        # TEST 6: Normal Admin Cannot Delete or Suspend Super Admin
        # ------------------------------------------------------------------
        print("\n[TEST 6] Normal Admin deleting or suspending Super Admin...")
        del_res = client.delete(f"/api/v1/admin/users/{super_admin_user.user_id}", headers=admin_headers)
        assert del_res.status_code == 403, f"Expected 403 Forbidden on delete, got {del_res.status_code}"

        suspend_res = client.put(f"/api/v1/admin/users/{super_admin_user.user_id}/status", json={
            "status": "suspended"
        }, headers=admin_headers)
        assert suspend_res.status_code == 403, f"Expected 403 Forbidden on suspend, got {suspend_res.status_code}"
        test_results["Test 6: Normal Admin cannot delete/suspend Super Admin"] = "PASS"
        print("  -> PASS: Normal Admin cannot delete or suspend Super Admin (HTTP 403).")

        # ------------------------------------------------------------------
        # TEST 7: Self-Modification Prevention
        # ------------------------------------------------------------------
        print("\n[TEST 7] Self-Modification Prevention: Changing own role...")
        self_res = client.post(f"/api/v1/users/{super_admin_user.user_id}/roles", json={
            "role_name": "student"
        }, headers=super_headers)
        assert self_res.status_code == 403, f"Expected 403 Forbidden on self-assign, got {self_res.status_code}"

        self_revoke_res = client.delete(f"/api/v1/users/{super_admin_user.user_id}/roles/super_admin", headers=super_headers)
        assert self_revoke_res.status_code == 403, f"Expected 403 Forbidden on self-revoke, got {self_revoke_res.status_code}"
        test_results["Test 7: Self-Role Modification Prevention"] = "PASS"
        print("  -> PASS: Modifying own role/permissions is strictly blocked (HTTP 403).")

        # ------------------------------------------------------------------
        # TEST 8: Instructor Isolation Test
        # ------------------------------------------------------------------
        print("\n[TEST 8] Instructor Isolation: Instructor A vs Instructor B dashboard...")
        inst_a_res = client.get("/api/v1/instructor/dashboard", headers=inst_a_headers)
        assert inst_a_res.status_code == 200, f"Expected 200, got {inst_a_res.status_code}"
        data_a = inst_a_res.get_json()
        course_ids_a = [c["id"] for c in data_a["courses"]]
        assert str(course_a.classroom_id) in course_ids_a, "Course A should be in Instructor A's dashboard"
        assert str(course_b.classroom_id) not in course_ids_a, "Course B should NOT be in Instructor A's dashboard"

        inst_b_res = client.get("/api/v1/instructor/dashboard", headers=inst_b_headers)
        assert inst_b_res.status_code == 200
        data_b = inst_b_res.get_json()
        course_ids_b = [c["id"] for c in data_b["courses"]]
        assert str(course_b.classroom_id) in course_ids_b, "Course B should be in Instructor B's dashboard"
        assert str(course_a.classroom_id) not in course_ids_b, "Course A should NOT be in Instructor B's dashboard"
        test_results["Test 8: Instructor Isolation"] = "PASS"
        print("  -> PASS: Instructor A and B only see their respective courses.")

        # ------------------------------------------------------------------
        # TEST 9: Student Isolation Test
        # ------------------------------------------------------------------
        print("\n[TEST 9] Student Isolation: Student accessing admin and instructor endpoints...")
        assert client.get("/api/v1/admin/dashboard/admin-stats", headers=student_headers).status_code == 403
        assert client.get("/api/v1/admin/dashboard/superadmin-stats", headers=student_headers).status_code == 403
        assert client.get("/api/v1/admin/settings", headers=student_headers).status_code == 403
        assert client.get("/api/v1/instructor/dashboard", headers=student_headers).status_code == 403
        test_results["Test 9: Student Isolation"] = "PASS"
        print("  -> PASS: Student blocked with 403 from all Admin and Instructor endpoints.")

        # ------------------------------------------------------------------
        # TEST 10: Unauthenticated Access Test
        # ------------------------------------------------------------------
        print("\n[TEST 10] Unauthenticated Access: Anonymous requests to protected routes...")
        assert client.get("/api/v1/admin/dashboard/superadmin-stats").status_code == 401
        assert client.get("/api/v1/admin/dashboard/admin-stats").status_code == 401
        assert client.get("/api/v1/admin/settings").status_code == 401
        assert client.get("/api/v1/instructor/dashboard").status_code == 401
        assert client.get("/api/v1/student/dashboard").status_code == 401
        test_results["Test 10: Unauthenticated Access Block"] = "PASS"
        print("  -> PASS: All protected endpoints reject unauthenticated access with 401 Unauthorized.")

        # ------------------------------------------------------------------
        # TEST 11: Real Data Verification (Super Admin)
        # ------------------------------------------------------------------
        print("\n[TEST 11] Real Data Verification (Super Admin Stats)...")
        sa_stats_res = client.get("/api/v1/admin/dashboard/superadmin-stats", headers=super_headers)
        assert sa_stats_res.status_code == 200
        sa_json = sa_stats_res.get_json()
        sa_data = sa_json.get("stats", sa_json)
        db_user_count = User.query.count()
        db_super_admin_count = User.query.join(UserRole).join(Role).filter(Role.role_name == "super_admin").count()
        assert sa_data["totalUsers"] == db_user_count, f"DB users ({db_user_count}) != API ({sa_data['totalUsers']})"
        assert sa_data["superAdminsCount"] == db_super_admin_count, f"DB super admins != API"
        test_results["Test 11: Real Data (Super Admin)"] = "PASS"
        print(f"  -> PASS: Super Admin API data matches DB perfectly (Total Users: {db_user_count}, Super Admins: {db_super_admin_count}).")

        # ------------------------------------------------------------------
        # TEST 12: Real Data Verification (Admin)
        # ------------------------------------------------------------------
        print("\n[TEST 12] Real Data Verification (Admin Stats)...")
        admin_stats_res = client.get("/api/v1/admin/dashboard/admin-stats", headers=admin_headers)
        assert admin_stats_res.status_code == 200
        admin_json = admin_stats_res.get_json()
        admin_data = admin_json.get("stats", admin_json)
        db_active_users = User.query.filter_by(status="active").count()
        assert admin_data["totalUsers"] == db_user_count, "Admin API totalUsers != DB count"
        assert admin_data["activeAccounts"] == db_active_users, "Admin API activeAccounts != DB count"
        test_results["Test 12: Real Data (Admin)"] = "PASS"
        print(f"  -> PASS: Admin API data matches DB perfectly (Total Users: {db_user_count}, Active Accounts: {db_active_users}).")

        # ------------------------------------------------------------------
        # TEST 13: Real Data Verification (Instructor)
        # ------------------------------------------------------------------
        print("\n[TEST 13] Real Data Verification (Instructor Dashboard)...")
        inst_dash_res = client.get("/api/v1/instructor/dashboard", headers=inst_a_headers)
        assert inst_dash_res.status_code == 200
        inst_dash = inst_dash_res.get_json()
        assert inst_dash["coursesCount"] == 1, f"Expected 1 course, got {inst_dash['coursesCount']}"
        assert inst_dash["totalLessons"] == 1, f"Expected 1 lesson, got {inst_dash['totalLessons']}"
        assert inst_dash["totalStudents"] == 1, f"Expected 1 student, got {inst_dash['totalStudents']}"
        test_results["Test 13: Real Data (Instructor)"] = "PASS"
        print("  -> PASS: Instructor Dashboard returns real DB counts, no fallback/mock courses.")

        # ------------------------------------------------------------------
        # TEST 14: Real Data Verification (Student)
        # ------------------------------------------------------------------
        print("\n[TEST 14] Real Data Verification (Student Dashboard)...")
        student_dash_res = client.get("/api/v1/student/dashboard", headers=student_headers)
        assert student_dash_res.status_code == 200
        student_dash = student_dash_res.get_json()
        assert len(student_dash["enrolledCourses"]) == 1, f"Expected 1 enrolled course, got {len(student_dash['enrolledCourses'])}"
        assert student_dash["enrolledCourses"][0]["id"] == str(course_a.classroom_id)
        # dailyMissions should be real list (or empty list, not hardcoded mock quest string)
        assert isinstance(student_dash["dailyMissions"], list)
        test_results["Test 14: Real Data (Student)"] = "PASS"
        print("  -> PASS: Student Dashboard returns real enrolled course from DB, real missions structure.")

        # Clean up test accounts
        cleanup_test_data()

    print("\n======================================================================")
    print("                    SECURITY TEST SUITE SUMMARY                       ")
    print("======================================================================")
    for name, status in test_results.items():
        print(f"[{status}] {name}")
    print("======================================================================")
    all_passed = all(status == "PASS" for status in test_results.values()) and len(test_results) == 14
    if all_passed:
        print(">>> ALL 14 SECURITY TESTS PASSED SUCCESSFULLY! <<<")
    else:
        print(">>> SOME TESTS FAILED! <<<")
    return all_passed


if __name__ == "__main__":
    import sys
    success = run_security_suite()
    sys.exit(0 if success else 1)
