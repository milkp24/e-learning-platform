import uuid
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.role import Role
from app.models.classroom import Classroom, ClassroomMember, Lesson, Content


def create_test_user(client, email, password, display_name, role_name):
    """Helper to register a user and assign a specific role."""
    res = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": password,
        "display_name": display_name
    })
    user_data = res.get_json()["user"]
    user_id = user_data["user_id"]

    if role_name != "student":
        with client.application.app_context():
            u = db.session.get(User, uuid.UUID(user_id))
            r = Role.query.filter_by(role_name=role_name).first()
            if not u.has_role(role_name):
                u.roles.append(r)
                db.session.commit()

    # Login and get token
    res_login = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password
    })
    token = res_login.get_json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    return user_id, headers


def run_tests():
    app = create_app()
    client = app.test_client()

    print("==========================================")
    print("Running Classroom Management Test Suite...")
    print("==========================================")

    with app.app_context():
        # 1. Verify Database Tables
        tables = db.session.execute(text(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
        )).fetchall()
        table_names = [t[0] for t in tables]
        print("1. Tables in PostgreSQL:", table_names)
        assert "classrooms" in table_names
        assert "classroom_members" in table_names
        assert "lessons" in table_names
        assert "contents" in table_names
        print("   -> PASS: All 4 Module 3 tables exist.")

        # Clean existing test data if any
        emails = [
            "inst1@test.com", "inst2@test.com", "admin_m3@test.com",
            "stud1@test.com", "stud2@test.com", "stud3@test.com"
        ]
        for e in emails:
            u = User.query.filter_by(email=e).first()
            if u:
                for c in Classroom.query.filter_by(instructor_id=u.user_id).all():
                    db.session.delete(c)
                db.session.commit()
                db.session.delete(u)
        db.session.commit()

    # Setup Users
    inst1_id, inst1_headers = create_test_user(client, "inst1@test.com", "Password123!", "Instructor 1", "instructor")
    inst2_id, inst2_headers = create_test_user(client, "inst2@test.com", "Password123!", "Instructor 2", "instructor")
    admin_id, admin_headers = create_test_user(client, "admin_m3@test.com", "Password123!", "Admin User", "admin")
    stud1_id, stud1_headers = create_test_user(client, "stud1@test.com", "Password123!", "Student 1", "student")
    stud2_id, stud2_headers = create_test_user(client, "stud2@test.com", "Password123!", "Student 2", "student")
    stud3_id, stud3_headers = create_test_user(client, "stud3@test.com", "Password123!", "Student 3", "student")

    # 2. Classroom CRUD & Instructor Ownership
    print("\n2. Testing Classroom CRUD & Ownership:")
    # Instructor 1 creates Classroom
    res_c1 = client.post("/api/v1/classrooms", headers=inst1_headers, json={
        "title": "IoT Fundamentals",
        "description": "Introduction to IoT Devices",
        "status": "active"
    })
    assert res_c1.status_code == 201
    c1 = res_c1.get_json()["classroom"]
    c1_id = c1["classroom_id"]
    print("   Classroom 1 created by Instructor 1:", c1["title"])

    # Instructor 2 attempts to update Classroom 1 -> 403
    res_c1_update_by_i2 = client.put(f"/api/v1/classrooms/{c1_id}", headers=inst2_headers, json={
        "title": "Hacked Title"
    })
    print("   Instructor 2 updating Classroom 1 status:", res_c1_update_by_i2.status_code)
    assert res_c1_update_by_i2.status_code == 403

    # Instructor 2 attempts to delete Classroom 1 -> 403
    res_c1_del_by_i2 = client.delete(f"/api/v1/classrooms/{c1_id}", headers=inst2_headers)
    print("   Instructor 2 deleting Classroom 1 status:", res_c1_del_by_i2.status_code)
    assert res_c1_del_by_i2.status_code == 403

    # Instructor 1 updates Classroom 1 -> 200
    res_c1_update_by_i1 = client.put(f"/api/v1/classrooms/{c1_id}", headers=inst1_headers, json={
        "title": "IoT Fundamentals (Updated)"
    })
    assert res_c1_update_by_i1.status_code == 200
    assert res_c1_update_by_i1.get_json()["classroom"]["title"] == "IoT Fundamentals (Updated)"
    print("   Instructor 1 updated Classroom 1 successfully.")

    # Admin updates Classroom 1 -> 200
    res_c1_update_by_admin = client.put(f"/api/v1/classrooms/{c1_id}", headers=admin_headers, json={
        "description": "Updated by Admin"
    })
    assert res_c1_update_by_admin.status_code == 200
    print("   Admin updated Classroom 1 successfully (Admin override).")

    # 3. Test ON DELETE RESTRICT on Classroom.instructor_id
    print("\n3. Testing ON DELETE RESTRICT on Classroom.instructor_id:")
    with app.app_context():
        try:
            instructor_user = db.session.get(User, uuid.UUID(inst1_id))
            db.session.delete(instructor_user)
            db.session.commit()
            assert False, "Should have raised IntegrityError due to RESTRICT!"
        except IntegrityError:
            db.session.rollback()
            print("   -> PASS: ON DELETE RESTRICT prevented deleting Instructor with active Classroom.")

    # 4. Student-Only Join & Duplicate Prevention
    print("\n4. Testing Student-Only Join & Duplicate Prevention:")
    # Student 1 joins Classroom 1 -> 201
    res_join_s1 = client.post(f"/api/v1/classrooms/{c1_id}/join", headers=stud1_headers)
    print("   Student 1 join status:", res_join_s1.status_code)
    assert res_join_s1.status_code == 201

    # Student 1 attempts to join again -> 409 Conflict
    res_join_s1_dup = client.post(f"/api/v1/classrooms/{c1_id}/join", headers=stud1_headers)
    print("   Student 1 duplicate join status:", res_join_s1_dup.status_code)
    assert res_join_s1_dup.status_code == 409

    # Instructor 1 attempts to join -> 403 Forbidden (Student only!)
    res_join_i1 = client.post(f"/api/v1/classrooms/{c1_id}/join", headers=inst1_headers)
    print("   Instructor join status:", res_join_i1.status_code)
    assert res_join_i1.status_code == 403

    # Admin attempts to join -> 403 Forbidden (Student only!)
    res_join_admin = client.post(f"/api/v1/classrooms/{c1_id}/join", headers=admin_headers)
    print("   Admin join status:", res_join_admin.status_code)
    assert res_join_admin.status_code == 403
    print("   -> PASS: POST /join is strictly Student-only and prevents duplicate join.")

    # 5. Classroom Member Management
    print("\n5. Testing Classroom Member Management:")
    # Instructor 2 attempts to add member to Classroom 1 -> 403
    res_add_by_i2 = client.post(f"/api/v1/classrooms/{c1_id}/members", headers=inst2_headers, json={
        "user_id": stud2_id
    })
    assert res_add_by_i2.status_code == 403

    # Instructor 1 adds Student 2 -> 201
    res_add_s2 = client.post(f"/api/v1/classrooms/{c1_id}/members", headers=inst1_headers, json={
        "user_id": stud2_id
    })
    assert res_add_s2.status_code == 201
    print("   Instructor 1 added Student 2 to Classroom 1.")

    # List members
    res_members = client.get(f"/api/v1/classrooms/{c1_id}/members", headers=stud1_headers)
    assert res_members.status_code == 200
    member_ids = [m["user_id"] for m in res_members.get_json()["members"]]
    assert stud1_id in member_ids and stud2_id in member_ids
    print("   Members in Classroom 1 verified:", len(member_ids))

    # 6. Lesson Management & Sequencing
    print("\n6. Testing Lesson Management & Sequencing:")
    # Instructor 2 attempts to create lesson in Classroom 1 -> 403
    res_l_by_i2 = client.post(f"/api/v1/classrooms/{c1_id}/lessons", headers=inst2_headers, json={
        "title": "Hacked Lesson",
        "sequence_no": 1
    })
    assert res_l_by_i2.status_code == 403

    # Instructor 1 creates Lesson 2 first (seq 2) and Lesson 1 (seq 1)
    res_l2 = client.post(f"/api/v1/classrooms/{c1_id}/lessons", headers=inst1_headers, json={
        "title": "Lesson Two: Sensors",
        "sequence_no": 2
    })
    assert res_l2.status_code == 201
    l2_id = res_l2.get_json()["lesson"]["lesson_id"]

    res_l1 = client.post(f"/api/v1/classrooms/{c1_id}/lessons", headers=inst1_headers, json={
        "title": "Lesson One: Overview",
        "sequence_no": 1
    })
    assert res_l1.status_code == 201
    l1_id = res_l1.get_json()["lesson"]["lesson_id"]

    # Retrieve lessons, verify ordered by sequence_no
    res_lessons = client.get(f"/api/v1/classrooms/{c1_id}/lessons", headers=stud1_headers)
    assert res_lessons.status_code == 200
    lessons_list = res_lessons.get_json()["lessons"]
    assert len(lessons_list) == 2
    assert lessons_list[0]["sequence_no"] == 1 and lessons_list[0]["title"] == "Lesson One: Overview"
    assert lessons_list[1]["sequence_no"] == 2 and lessons_list[1]["title"] == "Lesson Two: Sensors"
    print("   -> PASS: Lessons correctly sequenced (1, 2).")

    # 7. Content Management & Content Types
    print("\n7. Testing Content Management & Content Types:")
    content_types = ["text", "video", "pdf", "image", "code"]
    for ct in content_types:
        res_cnt = client.post(f"/api/v1/lessons/{l1_id}/contents", headers=inst1_headers, json={
            "content_type": ct,
            "content_data": f"Sample data for {ct}"
        })
        assert res_cnt.status_code == 201, f"Failed for content_type {ct}"
    print("   -> PASS: All 5 supported content types accepted.")

    # Invalid content_type -> 400 Bad Request
    res_cnt_bad = client.post(f"/api/v1/lessons/{l1_id}/contents", headers=inst1_headers, json={
        "content_type": "audio",
        "content_data": "https://example.com/sound.mp3"
    })
    print("   Invalid content_type 'audio' status:", res_cnt_bad.status_code)
    assert res_cnt_bad.status_code == 400
    print("   -> PASS: Unsupported content_type rejected with 400.")

    # 8. Student Access Control to Lessons & Content
    print("\n8. Testing Student Access Control:")
    # Student 1 (Enrolled) views Lesson 1 contents -> 200
    res_view_s1 = client.get(f"/api/v1/lessons/{l1_id}/contents", headers=stud1_headers)
    assert res_view_s1.status_code == 200
    assert len(res_view_s1.get_json()["contents"]) == 5

    # Student 3 (Not enrolled) attempts to view Lesson 1 contents -> 403 Forbidden
    res_view_s3 = client.get(f"/api/v1/lessons/{l1_id}/contents", headers=stud3_headers)
    print("   Non-enrolled Student 3 accessing lesson contents status:", res_view_s3.status_code)
    assert res_view_s3.status_code == 403
    print("   -> PASS: Non-enrolled students blocked with 403 Forbidden.")

    # 9. Cascade Deletion
    print("\n9. Testing Cascade Deletion on Classroom:")
    res_del_c1 = client.delete(f"/api/v1/classrooms/{c1_id}", headers=inst1_headers)
    assert res_del_c1.status_code == 200

    with app.app_context():
        # Verify classroom, members, lessons, contents deleted
        assert db.session.get(Classroom, uuid.UUID(c1_id)) is None
        assert Lesson.query.filter_by(classroom_id=c1_id).count() == 0
        assert ClassroomMember.query.filter_by(classroom_id=c1_id).count() == 0
        assert Content.query.filter_by(lesson_id=l1_id).count() == 0
    print("   -> PASS: Classroom cascade deletion removed members, lessons, and contents.")

    # Cleanup test users
    with app.app_context():
        for e in emails:
            u = User.query.filter_by(email=e).first()
            if u:
                for c in Classroom.query.filter_by(instructor_id=u.user_id).all():
                    db.session.delete(c)
                db.session.commit()
                db.session.delete(u)
        db.session.commit()
    print("\nCleaned up test data.")
    print("==========================================")
    print("ALL CLASSROOM MANAGEMENT TESTS PASSED!")
    print("==========================================")


if __name__ == "__main__":
    run_tests()
