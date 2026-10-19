"""
test_classroom_service_4d.py: Phase 4D Dedicated Verification Suite
Validates:
1. ClassroomService business logic methods & ClassroomServiceError
2. Classroom CRUD & Catalog listing with status filtering
3. Admin instructor assignment & ownership validation
4. Student Enrollment & duplicate prevention (409 Conflict)
5. Member management (add by instructor, remove by self / instructor, 403 IDOR prevention)
6. Cascade dependency deletion (Grandchild -> Child -> Parent)
7. Instructor Dashboard aggregation & Public Stats
8. Thin Route Controller delegation via Flask test client
"""
import uuid
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.role import Role
from app.models.classroom import Classroom, ClassroomMember, Lesson, Episode, Content
from app.services.classroom_service import ClassroomService, ClassroomServiceError
from flask_jwt_extended import create_access_token


def run_phase_4d_tests():
    app = create_app()
    client = app.test_client()

    with app.app_context():
        print("======================================================================")
        print("        TEST SUITE 4D: CLASSROOM & ENROLLMENT DOMAIN EXTRACTION       ")
        print("======================================================================")

        # 0. Setup Test Users
        instructor1 = User.query.filter(User.roles.any(Role.role_name == "instructor")).first()
        student1 = User.query.filter(User.roles.any(Role.role_name == "student")).first()
        admin1 = User.query.filter(User.roles.any(Role.role_name == "admin")).first()

        assert instructor1 is not None, "Instructor user required"
        assert student1 is not None, "Student user required"
        assert admin1 is not None, "Admin user required"

        # Setup secondary instructor and secondary student for isolation/IDOR tests
        instructor2 = User.query.filter_by(email="inst2_4d@test.com").first()
        if not instructor2:
            from app.models import UserProfile
            instructor2 = User(email="inst2_4d@test.com", status="active")
            instructor2.set_password("pass123")
            inst_role = Role.query.filter_by(role_name="instructor").first()
            instructor2.roles.append(inst_role)
            db.session.add(instructor2)
            db.session.add(UserProfile(user=instructor2, display_name="Instructor Two"))
            db.session.commit()

        student2 = User.query.filter_by(email="student2_4d@test.com").first()
        if not student2:
            from app.models import UserProfile
            student2 = User(email="student2_4d@test.com", status="active")
            student2.set_password("pass123")
            st_role = Role.query.filter_by(role_name="student").first()
            student2.roles.append(st_role)
            db.session.add(student2)
            db.session.add(UserProfile(user=student2, display_name="Student Two"))
            db.session.commit()

        # Tokens & Headers
        inst1_token = create_access_token(identity=str(instructor1.user_id))
        inst2_token = create_access_token(identity=str(instructor2.user_id))
        st1_token = create_access_token(identity=str(student1.user_id))
        st2_token = create_access_token(identity=str(student2.user_id))
        adm_token = create_access_token(identity=str(admin1.user_id))

        inst1_headers = {"Authorization": f"Bearer {inst1_token}", "Content-Type": "application/json"}
        inst2_headers = {"Authorization": f"Bearer {inst2_token}", "Content-Type": "application/json"}
        st1_headers = {"Authorization": f"Bearer {st1_token}", "Content-Type": "application/json"}
        st2_headers = {"Authorization": f"Bearer {st2_token}", "Content-Type": "application/json"}
        adm_headers = {"Authorization": f"Bearer {adm_token}", "Content-Type": "application/json"}

        # -----------------------------------------------------------------
        # TEST 1: Service Validation & Creation (including Admin assignment)
        # -----------------------------------------------------------------
        print("\n[TEST 1] Testing ClassroomService.create_classroom validation & logic:")
        # Missing title
        try:
            ClassroomService.create_classroom(instructor1, {"title": ""})
            assert False, "Should raise ClassroomServiceError on empty title"
        except ClassroomServiceError as e:
            assert e.status_code == 400
            print("   -> PASS: Empty title rejected with 400")

        # Invalid instructor_id format by Admin
        try:
            ClassroomService.create_classroom(admin1, {"title": "Valid Title", "instructor_id": "not-a-uuid"})
            assert False, "Should raise ClassroomServiceError on invalid instructor_id"
        except ClassroomServiceError as e:
            assert e.status_code == 400
            print("   -> PASS: Invalid instructor_id format rejected with 400")

        # Admin assigns course to Instructor 2
        res_adm, code_adm = ClassroomService.create_classroom(admin1, {
            "title": "Admin Assigned Course",
            "instructor_id": str(instructor2.user_id),
            "description": "Course assigned to Instructor 2 by Admin"
        })
        assert code_adm == 201
        course_adm_id = res_adm["classroom"]["classroom_id"]
        assert res_adm["classroom"]["instructor_id"] == str(instructor2.user_id)
        print("   -> PASS: Admin successfully assigned instructor_id to new classroom")

        # Instructor 1 creates their own course via HTTP POST /classrooms
        resp_create = client.post("/api/v1/classrooms", headers=inst1_headers, json={
            "title": "Cloud Architecture 101",
            "description": "Distributed systems fundamentals",
            "status": "active"
        })
        assert resp_create.status_code == 201
        c1_data = resp_create.get_json()["classroom"]
        c1_id = c1_data["classroom_id"]
        print(f"   -> PASS: Instructor 1 created classroom via HTTP POST (ID: {c1_id})")

        try:
            # -----------------------------------------------------------------
            # TEST 2: Catalog Listing & Permissions
            # -----------------------------------------------------------------
            print("\n[TEST 2] Testing Course Catalog & Detail:")
            resp_list = client.get("/api/v1/classrooms")
            assert resp_list.status_code == 200
            list_data = resp_list.get_json()
            assert "classrooms" in list_data and "courses" in list_data
            assert any(c["classroom_id"] == c1_id for c in list_data["classrooms"])
            print("   -> PASS: GET /classrooms returned catalog containing newly created course")

            # GET details
            resp_detail = client.get(f"/api/v1/classrooms/{c1_id}", headers=inst1_headers)
            assert resp_detail.status_code == 200
            detail_data = resp_detail.get_json()["classroom"]
            assert detail_data["is_owner"] is True
            assert detail_data["is_enrolled"] is False
            print("   -> PASS: GET /classrooms/<id> enriched with is_owner=True for creator")

            # -----------------------------------------------------------------
            # TEST 3: Update & Ownership Protection
            # -----------------------------------------------------------------
            print("\n[TEST 3] Testing Update & Ownership Protection:")
            # Instructor 2 tries to update Instructor 1's course -> 403
            resp_upd_inst2 = client.put(f"/api/v1/classrooms/{c1_id}", headers=inst2_headers, json={
                "title": "Hacked Title"
            })
            assert resp_upd_inst2.status_code == 403
            print("   -> PASS: Non-owner instructor blocked from updating course (403)")

            # Instructor 1 updates course successfully
            resp_upd_inst1 = client.put(f"/api/v1/classrooms/{c1_id}", headers=inst1_headers, json={
                "description": "Updated description by owner"
            })
            assert resp_upd_inst1.status_code == 200
            assert resp_upd_inst1.get_json()["classroom"]["description"] == "Updated description by owner"
            print("   -> PASS: Owner instructor updated course successfully (200)")

            # Admin override update
            resp_upd_admin = client.put(f"/api/v1/classrooms/{c1_id}", headers=adm_headers, json={
                "description": "Updated by admin override"
            })
            assert resp_upd_admin.status_code == 200
            print("   -> PASS: Admin override update succeeded (200)")

            # -----------------------------------------------------------------
            # TEST 4: Enrollment & Student Join (with duplicate prevention)
            # -----------------------------------------------------------------
            print("\n[TEST 4] Testing Student Join & Duplicate Prevention:")
            # Instructor cannot join course -> 403
            resp_inst_join = client.post(f"/api/v1/classrooms/{c1_id}/join", headers=inst1_headers)
            assert resp_inst_join.status_code == 403
            print("   -> PASS: Instructor joining course rejected with 403")

            # Student 1 joins course -> 201
            resp_join = client.post(f"/api/v1/classrooms/{c1_id}/join", headers=st1_headers)
            assert resp_join.status_code == 201
            print("   -> PASS: Student 1 joined course successfully (201)")

            # Student 1 tries to join again -> 409 Conflict
            resp_join_dup = client.post(f"/api/v1/classrooms/{c1_id}/join", headers=st1_headers)
            assert resp_join_dup.status_code == 409
            print("   -> PASS: Duplicate enrollment rejected with 409 Conflict")

            # Verify list_my_enrollments
            resp_my = client.get("/api/v1/classrooms/my-enrollments", headers=st1_headers)
            assert resp_my.status_code == 200
            enrolled_ids = [e["classroom_id"] for e in resp_my.get_json()["enrollments"]]
            assert c1_id in enrolled_ids
            print("   -> PASS: GET /classrooms/my-enrollments contains joined course")

            # -----------------------------------------------------------------
            # TEST 5: Instructor Member Management & Removal
            # -----------------------------------------------------------------
            print("\n[TEST 5] Testing Member Management & Removal:")
            # Instructor 1 adds Student 2 directly
            resp_add_m = client.post(f"/api/v1/classrooms/{c1_id}/members", headers=inst1_headers, json={
                "user_id": str(student2.user_id)
            })
            assert resp_add_m.status_code == 201
            print("   -> PASS: Instructor added Student 2 directly (201)")

            # Duplicate add member -> 409
            resp_add_dup = client.post(f"/api/v1/classrooms/{c1_id}/members", headers=inst1_headers, json={
                "user_id": str(student2.user_id)
            })
            assert resp_add_dup.status_code == 409
            print("   -> PASS: Duplicate add member rejected with 409 Conflict")

            # Student 2 tries to remove Student 1 -> 403 (IDOR)
            resp_rem_idor = client.delete(f"/api/v1/classrooms/{c1_id}/members/{student1.user_id}", headers=st2_headers)
            assert resp_rem_idor.status_code == 403
            print("   -> PASS: Student 2 removing Student 1 blocked with 403 (IDOR prevention)")

            # Student 2 removes self (unenroll) -> 200
            resp_rem_self = client.delete(f"/api/v1/classrooms/{c1_id}/members/{student2.user_id}", headers=st2_headers)
            assert resp_rem_self.status_code == 200
            print("   -> PASS: Student 2 unenrolled self successfully (200)")

            # Instructor 1 removes Student 1 -> 200
            resp_rem_inst = client.delete(f"/api/v1/classrooms/{c1_id}/members/{student1.user_id}", headers=inst1_headers)
            assert resp_rem_inst.status_code == 200
            print("   -> PASS: Instructor 1 removed Student 1 successfully (200)")

            # -----------------------------------------------------------------
            # TEST 6: Instructor Dashboard & Platform Stats
            # -----------------------------------------------------------------
            print("\n[TEST 6] Testing Instructor Dashboard & Public Stats:")
            resp_dash = client.get("/api/v1/instructor/dashboard", headers=inst1_headers)
            assert resp_dash.status_code == 200
            dash_data = resp_dash.get_json()
            assert "courses" in dash_data and "totalStudents" in dash_data
            print("   -> PASS: GET /instructor/dashboard returned valid dashboard payload")

            resp_stats = client.get("/api/v1/classrooms/public/stats")
            assert resp_stats.status_code == 200
            stats_data = resp_stats.get_json()
            assert "total_courses" in stats_data and "total_lessons" in stats_data
            print("   -> PASS: GET /classrooms/public/stats returned platform statistics")

            # -----------------------------------------------------------------
            # TEST 7: Cascade Deletion Safety
            # -----------------------------------------------------------------
            print("\n[TEST 7] Testing Cascade Deletion via DELETE /classrooms/<id>:")
            # Create a chapter, episode, and content inside c1
            lesson = Lesson(classroom_id=uuid.UUID(c1_id), title="Ch 1", sequence_no=1)
            db.session.add(lesson)
            db.session.flush()
            ep = Episode(lesson_id=lesson.lesson_id, title="Ep 1", sequence_no=1)
            db.session.add(ep)
            db.session.flush()
            cnt = Content(lesson_id=lesson.lesson_id, episode_id=ep.episode_id, content_type="text", content_data="Test", sequence_no=1)
            db.session.add(cnt)
            db.session.commit()

            # Non-owner trying to delete -> 403
            resp_del_no = client.delete(f"/api/v1/classrooms/{c1_id}", headers=inst2_headers)
            assert resp_del_no.status_code == 403
            print("   -> PASS: Non-owner blocked from deleting classroom (403)")

            # Owner deletes -> 200 with cascade cleanup
            resp_del_ok = client.delete(f"/api/v1/classrooms/{c1_id}", headers=inst1_headers)
            assert resp_del_ok.status_code == 200
            assert db.session.get(Classroom, uuid.UUID(c1_id)) is None
            assert db.session.get(Lesson, lesson.lesson_id) is None
            assert db.session.get(Episode, ep.episode_id) is None
            assert db.session.get(Content, cnt.content_id) is None
            print("   -> PASS: Owner deleted classroom with complete cascade cleanup of children (200)")

            print("\n======================================================================")
            print("          ALL 7 TESTS IN PHASE 4D SUITE PASSED SUCCESSFULLY!          ")
            print("======================================================================")

        finally:
            # Cleanup admin assigned course
            c_adm_clean = db.session.get(Classroom, uuid.UUID(course_adm_id))
            if c_adm_clean:
                db.session.delete(c_adm_clean)
                db.session.commit()


if __name__ == "__main__":
    run_phase_4d_tests()
