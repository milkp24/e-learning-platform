import uuid
import sys
import os

# Ensure backend directory is in python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.role import Role
from app.models.classroom import Classroom, Episode, Journal
from app.services.journal_service import JournalService, JournalServiceError
from flask_jwt_extended import create_access_token


def test_journal_domain():
    print("=" * 70)
    print("      TEST SUITE 4G: JOURNAL DOMAIN EXTRACTION & SECURITY CHECKS      ")
    print("=" * 70)

    app = create_app()
    with app.app_context():
        client = app.test_client()

        # Step 0: Identify test accounts
        super_admin = User.query.filter(User.roles.any(Role.role_name == "super_admin")).first()
        admin = User.query.filter(User.roles.any(Role.role_name == "admin")).filter(
            ~User.roles.any(Role.role_name == "super_admin")
        ).first()
        instructor = User.query.filter(User.roles.any(Role.role_name == "instructor")).first()
        
        # Get or create two distinct students for IDOR testing
        students = User.query.filter(User.roles.any(Role.role_name == "student")).limit(2).all()
        student_a = students[0]
        student_b = students[1] if len(students) > 1 else None

        if not student_b:
            student_b = User(email="student_b_4g@test.com", status="active")
            student_b.set_password("Password123!")
            student_role = Role.query.filter_by(role_name="student").first()
            student_b.roles = [student_role]
            db.session.add(student_b)
            db.session.commit()

        assert super_admin, "Super Admin user required in DB"
        assert admin, "Admin user required in DB"
        assert instructor, "Instructor user required in DB"
        assert student_a, "Student A required in DB"
        assert student_b, "Student B required in DB"

        sa_token = create_access_token(identity=str(super_admin.user_id))
        admin_token = create_access_token(identity=str(admin.user_id))
        inst_token = create_access_token(identity=str(instructor.user_id))
        st_a_token = create_access_token(identity=str(student_a.user_id))
        st_b_token = create_access_token(identity=str(student_b.user_id))

        sa_headers = {"Authorization": f"Bearer {sa_token}"}
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        inst_headers = {"Authorization": f"Bearer {inst_token}"}
        st_a_headers = {"Authorization": f"Bearer {st_a_token}"}
        st_b_headers = {"Authorization": f"Bearer {st_b_token}"}

        # ------------------------------------------------------------------
        # TEST 1: Unauthenticated (Guest) Access
        # ------------------------------------------------------------------
        print("\n[TEST 1] Testing Guest Access Control:")
        r = client.get("/api/v1/journals")
        assert r.status_code == 401
        r = client.post("/api/v1/journals", json={"title": "Test", "content": "Test"})
        assert r.status_code == 401
        print("   -> PASS: Guest blocked with 401 Unauthorized from all endpoints")

        # ------------------------------------------------------------------
        # TEST 2: Journal Creation & Validation
        # ------------------------------------------------------------------
        print("\n[TEST 2] Testing Journal Creation & Validation:")
        # Empty title
        r = client.post("/api/v1/journals", headers=st_a_headers, json={"title": "", "content": "Some content"})
        assert r.status_code == 400
        print("   -> PASS: Empty title rejected with 400 Validation Error")

        # Empty content
        r = client.post("/api/v1/journals", headers=st_a_headers, json={"title": "Valid Title", "content": ""})
        assert r.status_code == 400
        print("   -> PASS: Empty content rejected with 400 Validation Error")

        # Missing JSON body
        r = client.post("/api/v1/journals", headers=st_a_headers, data="not json", content_type="text/plain")
        assert r.status_code == 400
        print("   -> PASS: Missing JSON body rejected with 400 Bad Request")

        # Valid journal creation
        test_title = f"Learning IoT Notes {uuid.uuid4().hex[:6]}"
        test_content = "Today I learned about MQTT brokers and publish/subscribe architecture."
        r = client.post(
            "/api/v1/journals",
            headers=st_a_headers,
            json={"title": test_title, "content": test_content}
        )
        assert r.status_code == 201, f"Expected 201, got {r.status_code}: {r.get_data(as_text=True)}"
        created_j = r.get_json()["journal"]
        j_id = created_j["journal_id"]
        assert created_j["title"] == test_title
        assert created_j["content"] == test_content
        print(f"   -> PASS: Journal created successfully by Student A (ID: {j_id})")

        # ------------------------------------------------------------------
        # TEST 3: List & Filter Journals
        # ------------------------------------------------------------------
        print("\n[TEST 3] Testing List & Filter Journals:")
        r = client.get("/api/v1/journals", headers=st_a_headers)
        assert r.status_code == 200
        j_list = r.get_json()["journals"]
        assert any(j["journal_id"] == j_id for j in j_list)
        print("   -> PASS: Student A listed own journals")

        # Filter by non-existent classroom_id returns empty or filtered list
        r = client.get(f"/api/v1/journals?classroom_id={uuid.uuid4()}", headers=st_a_headers)
        assert r.status_code == 200
        assert len(r.get_json()["journals"]) == 0
        print("   -> PASS: Filtering by non-matching classroom_id returned empty list")

        # ------------------------------------------------------------------
        # TEST 4: Get Journal Details & IDOR Cross-User Protection
        # ------------------------------------------------------------------
        print("\n[TEST 4] Testing Read Details & Cross-User IDOR Defenses:")
        # Student A reads own journal
        r = client.get(f"/api/v1/journals/{j_id}", headers=st_a_headers)
        assert r.status_code == 200
        assert r.get_json()["journal"]["journal_id"] == j_id
        print("   -> PASS: Student A read own journal details")

        # Student B attempts to read Student A's journal (IDOR check)
        r = client.get(f"/api/v1/journals/{j_id}", headers=st_b_headers)
        assert r.status_code == 403, f"Expected 403, got {r.status_code}"
        assert "Access denied" in r.get_json()["message"]
        print("   -> PASS: Student B blocked from reading Student A's journal (403 Forbidden)")

        # Instructor attempts to read Student A's journal
        r = client.get(f"/api/v1/journals/{j_id}", headers=inst_headers)
        assert r.status_code == 403
        print("   -> PASS: Instructor blocked from reading Student's private journal (403 Forbidden)")

        # Admin oversight access
        r = client.get(f"/api/v1/journals/{j_id}", headers=admin_headers)
        assert r.status_code == 200
        print("   -> PASS: Admin allowed to read journal (200 OK)")

        # Super Admin oversight access
        r = client.get(f"/api/v1/journals/{j_id}", headers=sa_headers)
        assert r.status_code == 200
        print("   -> PASS: Super Admin allowed to read journal (200 OK)")

        # ------------------------------------------------------------------
        # TEST 5: Update Journal & IDOR Protection
        # ------------------------------------------------------------------
        print("\n[TEST 5] Testing Update & IDOR Protection:")
        # Student B attempts to update Student A's journal
        r = client.put(
            f"/api/v1/journals/{j_id}",
            headers=st_b_headers,
            json={"title": "Hacked Title", "content": "Hacked Content"}
        )
        assert r.status_code == 403
        print("   -> PASS: Student B blocked from updating Student A's journal (403 Forbidden)")

        # Student A updates own journal
        updated_title = f"Updated MQTT Notes {uuid.uuid4().hex[:6]}"
        updated_content = "Added details about QoS levels (0, 1, 2) in MQTT protocol."
        r = client.put(
            f"/api/v1/journals/{j_id}",
            headers=st_a_headers,
            json={"title": updated_title, "content": updated_content}
        )
        assert r.status_code == 200
        assert r.get_json()["journal"]["title"] == updated_title
        assert r.get_json()["journal"]["content"] == updated_content
        print("   -> PASS: Student A updated own journal successfully")

        # ------------------------------------------------------------------
        # TEST 6: Delete Journal & IDOR Protection
        # ------------------------------------------------------------------
        print("\n[TEST 6] Testing Delete & IDOR Protection:")
        # Student B attempts to delete Student A's journal
        r = client.delete(f"/api/v1/journals/{j_id}", headers=st_b_headers)
        assert r.status_code == 403
        print("   -> PASS: Student B blocked from deleting Student A's journal (403 Forbidden)")

        # Student A deletes own journal
        r = client.delete(f"/api/v1/journals/{j_id}", headers=st_a_headers)
        assert r.status_code == 200
        print("   -> PASS: Student A deleted own journal successfully")

        # Verify journal is deleted from DB
        assert db.session.get(Journal, uuid.UUID(j_id)) is None
        print("   -> PASS: Verified journal deleted from PostgreSQL")

        # 404 for deleted journal
        r = client.get(f"/api/v1/journals/{j_id}", headers=st_a_headers)
        assert r.status_code == 404
        print("   -> PASS: GET on deleted journal returns 404 Not Found")

        # ------------------------------------------------------------------
        # TEST 7: Direct Service Layer Execution & Error Handling
        # ------------------------------------------------------------------
        print("\n[TEST 7] Testing Direct JournalService Layer & Exceptions:")
        # Service call with None user raises 401
        try:
            JournalService.list_journals(None)
            assert False, "Should have raised JournalServiceError"
        except JournalServiceError as e:
            assert e.status_code == 401
            assert e.message == "User not found."
            print("   -> PASS: JournalService raises 401 on None user")

        # Invalid UUID raises 400
        try:
            JournalService.get_journal("invalid-uuid", student_a)
            assert False, "Should have raised JournalServiceError"
        except JournalServiceError as e:
            assert e.status_code == 400
            assert e.message == "Invalid journal ID format."
            print("   -> PASS: JournalService raises 400 on invalid UUID format")

    print("\n" + "=" * 70)
    print("          ALL 7 TESTS IN PHASE 4G SUITE PASSED SUCCESSFULLY!          ")
    print("=" * 70)


if __name__ == "__main__":
    test_journal_domain()
