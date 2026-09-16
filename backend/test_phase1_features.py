"""
test_phase1_features.py: Integration Test Suite for Phase 1 (UAT-001 to UAT-048)
Tests:
1. Refresh Token & Token Rotation (UAT-011)
2. Token Revocation & Database Blocklist (UAT-013, UAT-014)
3. 4-tier Hierarchy: Course -> Chapter -> Episode -> Content (UAT-026 - UAT-029)
4. Safe YouTube Embed & Type-Specific Sanitization (UAT-034)
5. Learning Journal CRUD (UAT-031 - UAT-033)
6. Admin User Management & System Settings (UAT-015, UAT-021 - UAT-025, UAT-035)
"""
import uuid
import json

BASE_URL = "http://localhost:5000/api/v1"


def test_suite():
    from app import create_app
    from app.extensions import db
    from app.models import User, Role, SystemSetting, TokenBlocklist, RefreshToken

    app = create_app()
    client = app.test_client()

    print("======================================================")
    print("Running Phase 1 Comprehensive Integration Test Suite...")
    print("======================================================")

    with app.app_context():
        # Setup Test Users
        # 1. Admin
        admin = User.query.filter(User.roles.any(Role.role_name == "admin")).first()
        if not admin:
            from app.models import UserProfile
            admin = User(email="admin_phase1@test.com", status="active")
            admin.set_password("adminpass123")
            prof = UserProfile(user=admin, display_name="Admin Test")
            admin_role = Role.query.filter_by(role_name="admin").first()
            admin.roles.append(admin_role)
            db.session.add(admin)
            db.session.add(prof)
            db.session.commit()

        # 2. Instructor
        inst = User.query.filter(User.roles.any(Role.role_name == "instructor")).first()
        if not inst:
            from app.models import UserProfile
            inst = User(email="instructor_phase1@test.com", status="active")
            inst.set_password("instpass123")
            prof = UserProfile(user=inst, display_name="Instructor Test")
            inst_role = Role.query.filter_by(role_name="instructor").first()
            inst.roles.append(inst_role)
            db.session.add(inst)
            db.session.add(prof)
            db.session.commit()

        # 3. Student
        student = User.query.filter(User.roles.any(Role.role_name == "student")).first()
        if not student:
            from app.models import UserProfile
            student = User(email="student_phase1@test.com", status="active")
            student.set_password("studentpass123")
            prof = UserProfile(user=student, display_name="Student Test")
            st_role = Role.query.filter_by(role_name="student").first()
            student.roles.append(st_role)
            db.session.add(student)
            db.session.add(prof)
            db.session.commit()

        inst.set_password("instpass123")
        student.set_password("studentpass123")
        admin.set_password("adminpass123")
        db.session.commit()

        inst_email = inst.email
        student_email = student.email
        admin_email = admin.email

    # --- 1. Test Login & Refresh Token (UAT-011) ---
    print("\n1. Testing Login, Refresh Token & Token Rotation (UAT-011):")
    res_login = client.post("/api/v1/auth/login", json={
        "email": student_email,
        "password": "studentpass123"
    })
    assert res_login.status_code == 200, f"Login failed: {res_login.data}"
    login_data = res_login.get_json()
    access_token = login_data["access_token"]
    refresh_token = login_data["refresh_token"]
    assert access_token is not None
    assert refresh_token is not None
    print("   -> PASS: Login issued access_token and refresh_token.")

    # Refresh Token Rotation
    res_refresh = client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_token
    })
    assert res_refresh.status_code == 200, f"Refresh failed: {res_refresh.data}"
    refreshed_data = res_refresh.get_json()
    new_access_token = refreshed_data["access_token"]
    new_refresh_token = refreshed_data["refresh_token"]
    assert new_access_token != access_token
    assert new_refresh_token != refresh_token
    print("   -> PASS: Refresh token rotation issued new tokens.")

    # Old refresh token should now be rejected (revoked)
    res_old_refresh = client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_token
    })
    assert res_old_refresh.status_code == 401
    print("   -> PASS: Revoked old refresh token was rejected with 401.")

    # --- 2. Test Logout & Token Blocklist (UAT-013, UAT-014) ---
    print("\n2. Testing Logout & Database Token Blocklist (UAT-013, UAT-014):")
    headers = {"Authorization": f"Bearer {new_access_token}"}
    res_logout = client.post("/api/v1/auth/logout", headers=headers, json={
        "refresh_token": new_refresh_token
    })
    assert res_logout.status_code == 200
    print("   -> PASS: POST /auth/logout succeeded (200).")

    # Access Token should now be blocked
    res_me_blocked = client.get("/api/v1/auth/me", headers=headers)
    assert res_me_blocked.status_code == 401, f"Expected 401 but got {res_me_blocked.status_code}"
    print("   -> PASS: Revoked access token immediately rejected with 401 Unauthorized via DB blocklist.")

    # --- 3. Test 4-tier Hierarchy: Course -> Chapter -> Episode -> Content ---
    print("\n3. Testing 4-tier Hierarchy: Course -> Chapter -> Episode -> Content (UAT-026 - UAT-029):")
    # Instructor Login
    res_inst_login = client.post("/api/v1/auth/login", json={
        "email": inst_email,
        "password": "instpass123"
    })
    inst_token = res_inst_login.get_json()["access_token"]
    inst_headers = {"Authorization": f"Bearer {inst_token}"}

    # Create Course (Classroom)
    res_course = client.post("/api/v1/classrooms", headers=inst_headers, json={
        "title": "Fullstack Web Development",
        "description": "Comprehensive fullstack course with React and Flask",
        "thumbnail_url": "https://example.com/thumb.jpg",
        "status": "active"
    })
    assert res_course.status_code == 201
    course_id = res_course.get_json()["classroom"]["classroom_id"]
    print(f"   -> PASS: Course created ({course_id}).")

    # Create Chapter (Lesson)
    res_chap = client.post(f"/api/v1/classrooms/{course_id}/lessons", headers=inst_headers, json={
        "title": "Chapter 1: Modern JavaScript",
        "sequence_no": 1,
        "description": "Core concepts of ES6+"
    })
    assert res_chap.status_code == 201
    chap_id = res_chap.get_json()["lesson"]["lesson_id"]
    print(f"   -> PASS: Chapter created ({chap_id}).")

    # Create Episode under Chapter
    res_ep = client.post(f"/api/v1/lessons/{chap_id}/episodes", headers=inst_headers, json={
        "title": "Episode 1.1: Promises and Async/Await",
        "sequence_no": 1,
        "description": "Understanding asynchronous programming",
        "duration_seconds": 900
    })
    assert res_ep.status_code == 201
    ep_id = res_ep.get_json()["episode"]["episode_id"]
    print(f"   -> PASS: Episode created ({ep_id}).")

    # --- 4. Test Content & Type-Specific Sanitizer (UAT-034) ---
    print("\n4. Testing Type-Specific Content Sanitizer & Safe YouTube (UAT-034):")
    # A. Code content: must NOT strip HTML tags
    raw_code = "<html><head><script>alert('test')</script></head><body>Hello</body></html>"
    res_code = client.post(f"/api/v1/episodes/{ep_id}/contents", headers=inst_headers, json={
        "content_type": "code",
        "content_data": raw_code,
        "caption": "Sample HTML code"
    })
    assert res_code.status_code == 201
    code_content = res_code.get_json()["content"]
    assert code_content["content_data"] == raw_code, "Code content must NOT have tags stripped!"
    assert code_content["episode_id"] == ep_id
    assert code_content["lesson_id"] == chap_id  # Dual-pointer verified!
    print("   -> PASS: Raw code preserved 100% without tag stripping, dual-pointer verified.")

    # B. YouTube content: must normalize to youtube-nocookie
    youtube_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    res_yt = client.post(f"/api/v1/episodes/{ep_id}/contents", headers=inst_headers, json={
        "content_type": "youtube",
        "content_data": youtube_url,
        "caption": "Introduction Video"
    })
    assert res_yt.status_code == 201
    yt_content = res_yt.get_json()["content"]
    expected_embed = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    assert yt_content["content_data"] == expected_embed, f"Expected {expected_embed}, got {yt_content['content_data']}"
    print(f"   -> PASS: YouTube URL normalized to safe no-cookie embed: {yt_content['content_data']}.")

    # C. Text content: must strip malicious script tags
    rich_text = "<p>Welcome to class!</p><script>alert('xss')</script><b>Read carefully</b>"
    res_txt = client.post(f"/api/v1/episodes/{ep_id}/contents", headers=inst_headers, json={
        "content_type": "text",
        "content_data": rich_text
    })
    assert res_txt.status_code == 201
    txt_content = res_txt.get_json()["content"]
    assert "<script>" not in txt_content["content_data"], "Script tag must be stripped!"
    assert "<b>Read carefully</b>" in txt_content["content_data"], "Safe HTML must be preserved!"
    print("   -> PASS: Rich text sanitized (script stripped, safe tags preserved).")

    # --- 5. Test Learning Journal (UAT-031 - UAT-033) ---
    print("\n5. Testing Learning Journal CRUD (UAT-031 - UAT-033):")
    # Student login
    res_st_login = client.post("/api/v1/auth/login", json={
        "email": student_email,
        "password": "studentpass123"
    })
    st_token = res_st_login.get_json()["access_token"]
    st_headers = {"Authorization": f"Bearer {st_token}"}

    # Create Journal
    res_j_create = client.post("/api/v1/journals", headers=st_headers, json={
        "title": "My JavaScript Notes",
        "content": "Async/await makes asynchronous code look synchronous!",
        "classroom_id": course_id,
        "episode_id": ep_id
    })
    assert res_j_create.status_code == 201
    j_id = res_j_create.get_json()["journal"]["journal_id"]
    print(f"   -> PASS: Journal entry created ({j_id}).")

    # List Journals
    res_j_list = client.get(f"/api/v1/journals?classroom_id={course_id}", headers=st_headers)
    assert res_j_list.status_code == 200
    journals = res_j_list.get_json()["journals"]
    assert len(journals) >= 1
    print("   -> PASS: List journals filtered by course succeeded.")

    # Update Journal
    res_j_update = client.put(f"/api/v1/journals/{j_id}", headers=st_headers, json={
        "title": "My Updated JS Notes",
        "content": "Remember to handle try/catch with async/await!"
    })
    assert res_j_update.status_code == 200
    print("   -> PASS: Journal update succeeded.")

    # Cross-user journal access control (Instructor cannot access student's journal)
    res_j_forbidden = client.get(f"/api/v1/journals/{j_id}", headers=inst_headers)
    assert res_j_forbidden.status_code == 403
    print("   -> PASS: Cross-user journal access blocked with 403.")

    # --- 6. Test Admin User Management & Settings (UAT-015, UAT-021 - UAT-025, UAT-035) ---
    print("\n6. Testing Admin User Management & System Settings (UAT-015, UAT-021 - UAT-025, UAT-035):")
    res_adm_login = client.post("/api/v1/auth/login", json={
        "email": admin_email,
        "password": "adminpass123"
    })
    adm_token = res_adm_login.get_json()["access_token"]
    adm_headers = {"Authorization": f"Bearer {adm_token}"}

    # A. Public settings (No auth needed)
    res_pub_set = client.get("/api/v1/settings/public")
    assert res_pub_set.status_code == 200
    pub_settings = res_pub_set.get_json()
    assert "session_timeout_minutes" in pub_settings
    assert "guest_timeout_minutes" in pub_settings
    print(f"   -> PASS: Public settings accessible without auth: {pub_settings}.")

    # B. Admin update settings
    res_upd_set = client.put("/api/v1/admin/settings", headers=adm_headers, json={
        "session_timeout_minutes": "20",
        "guest_timeout_minutes": "12"
    })
    assert res_upd_set.status_code == 200
    print("   -> PASS: Admin updated system settings.")

    # C. Admin search and filter users
    res_users = client.get("/api/v1/admin/users?role=student&page=1&per_page=10", headers=adm_headers)
    assert res_users.status_code == 200
    users_data = res_users.get_json()
    assert "total" in users_data
    assert len(users_data["users"]) >= 1
    print(f"   -> PASS: Admin user search with pagination succeeded (total: {users_data['total']}).")

    # Cleanup test course
    client.delete(f"/api/v1/classrooms/{course_id}", headers=inst_headers)
    client.delete(f"/api/v1/journals/{j_id}", headers=st_headers)

    print("\n======================================================")
    print("ALL PHASE 1 INTEGRATION TESTS PASSED 100%!")
    print("======================================================")


if __name__ == "__main__":
    test_suite()
