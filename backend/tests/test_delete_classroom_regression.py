import sys
import uuid

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.role import Role
from app.models.classroom import Classroom, ClassroomMember, Chapter, Lesson, Episode, Content, Media, Journal
from app.models.exercise import Exercise, ExerciseAttempt
from app.models.progress import LessonProgress, LearningProgress, EpisodeProgress


def get_token(client, email, password):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    return res.get_json()["access_token"]


def create_user_helper(client, email, password, display_name, role_name):
    # Try login first
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    if res.status_code == 200:
        token = res.get_json()["access_token"]
        with client.application.app_context():
            u = User.query.filter_by(email=email).first()
            return str(u.user_id), {"Authorization": f"Bearer {token}"}

    client.post("/api/v1/auth/register", json={
        "email": email,
        "password": password,
        "display_name": display_name
    })
    with client.application.app_context():
        u = User.query.filter_by(email=email).first()
        r = Role.query.filter_by(role_name=role_name).first()
        if r and not u.has_role(role_name):
            u.roles.append(r)
            db.session.commit()
        uid = str(u.user_id)

    res2 = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    token = res2.get_json()["access_token"]
    return uid, {"Authorization": f"Bearer {token}"}


def run_regression_suite():
    app = create_app()
    client = app.test_client()

    print("=================================================================")
    print("STARTING COMPREHENSIVE DELETE CLASSROOM REGRESSION TEST SUITE")
    print("=================================================================")

    # Setup test users
    inst_a_id, inst_a_headers = create_user_helper(client, "test_inst_a@test.com", "Password123!", "Instructor A", "instructor")
    inst_b_id, inst_b_headers = create_user_helper(client, "test_inst_b@test.com", "Password123!", "Instructor B", "instructor")
    admin_id, admin_headers = create_user_helper(client, "test_admin_del@test.com", "Password123!", "Admin User", "admin")
    super_admin_id, super_admin_headers = create_user_helper(client, "test_sadmin_del@test.com", "Password123!", "Super Admin User", "super_admin")
    student_id, student_headers = create_user_helper(client, "test_student_del@test.com", "Password123!", "Student User", "student")

    results = {}

    # TEST 1: Delete Classroom without children
    print("\n[TEST 1] ลบ Classroom ที่ไม่มีข้อมูลลูก")
    res1 = client.post("/api/v1/classrooms", headers=inst_a_headers, json={"title": "Empty Course"})
    assert res1.status_code == 201
    c1_id = res1.get_json()["classroom"]["classroom_id"]
    res1_del = client.delete(f"/api/v1/classrooms/{c1_id}", headers=inst_a_headers)
    print(f"Status: {res1_del.status_code}, Body: {res1_del.get_json()}")
    assert res1_del.status_code == 200
    with app.app_context():
        assert db.session.get(Classroom, uuid.UUID(c1_id)) is None
    results["1. DELETE Classroom without children"] = "PASS"

    # TEST 2: Delete Classroom with Members
    print("\n[TEST 2] ลบ Classroom ที่มี Member")
    res2 = client.post("/api/v1/classrooms", headers=inst_a_headers, json={"title": "Course with Members"})
    c2_id = res2.get_json()["classroom"]["classroom_id"]
    client.post(f"/api/v1/classrooms/{c2_id}/members", headers=inst_a_headers, json={"user_id": student_id})
    with app.app_context():
        assert ClassroomMember.query.filter_by(classroom_id=c2_id).count() == 1
    res2_del = client.delete(f"/api/v1/classrooms/{c2_id}", headers=inst_a_headers)
    print(f"Status: {res2_del.status_code}, Body: {res2_del.get_json()}")
    assert res2_del.status_code == 200
    with app.app_context():
        assert db.session.get(Classroom, uuid.UUID(c2_id)) is None
        assert ClassroomMember.query.filter_by(classroom_id=c2_id).count() == 0
    results["2. DELETE Classroom with members"] = "PASS"

    # TEST 3: Delete Classroom with Chapter
    print("\n[TEST 3] ลบ Classroom ที่มี Chapter")
    res3 = client.post("/api/v1/classrooms", headers=inst_a_headers, json={"title": "Course with Chapter"})
    c3_id = res3.get_json()["classroom"]["classroom_id"]
    with app.app_context():
        ch = Chapter(course_id=uuid.UUID(c3_id), title="Chapter 1", sequence_no=1)
        db.session.add(ch)
        db.session.commit()
        ch_id = ch.chapter_id
    res3_del = client.delete(f"/api/v1/classrooms/{c3_id}", headers=inst_a_headers)
    print(f"Status: {res3_del.status_code}, Body: {res3_del.get_json()}")
    assert res3_del.status_code == 200
    with app.app_context():
        assert db.session.get(Classroom, uuid.UUID(c3_id)) is None
        assert db.session.get(Chapter, ch_id) is None
    results["3. DELETE Classroom with chapters"] = "PASS"

    # TEST 4: Delete Classroom with Lesson
    print("\n[TEST 4] ลบ Classroom ที่มี Lesson")
    res4 = client.post("/api/v1/classrooms", headers=inst_a_headers, json={"title": "Course with Lesson"})
    c4_id = res4.get_json()["classroom"]["classroom_id"]
    res4_l = client.post(f"/api/v1/classrooms/{c4_id}/lessons", headers=inst_a_headers, json={"title": "Lesson 1", "sequence_no": 1})
    l4_id = res4_l.get_json()["lesson"]["lesson_id"]
    res4_del = client.delete(f"/api/v1/classrooms/{c4_id}", headers=inst_a_headers)
    print(f"Status: {res4_del.status_code}, Body: {res4_del.get_json()}")
    assert res4_del.status_code == 200
    with app.app_context():
        assert db.session.get(Classroom, uuid.UUID(c4_id)) is None
        assert db.session.get(Lesson, uuid.UUID(l4_id)) is None
    results["4. DELETE Classroom with lessons"] = "PASS"

    # TEST 5: Delete Classroom with Exercise, Attempts & Lesson Progress
    print("\n[TEST 5] ลบ Classroom ที่มี Exercise, Attempts และ Lesson Progress")
    res5 = client.post("/api/v1/classrooms", headers=inst_a_headers, json={"title": "Course with Exercises & Progress"})
    c5_id = res5.get_json()["classroom"]["classroom_id"]
    res5_l = client.post(f"/api/v1/classrooms/{c5_id}/lessons", headers=inst_a_headers, json={"title": "Lesson with Exercise", "sequence_no": 1})
    l5_id = res5_l.get_json()["lesson"]["lesson_id"]
    with app.app_context():
        # Create exercise & attempt
        ex = Exercise(lesson_id=uuid.UUID(l5_id), title="Practice Exercise")
        db.session.add(ex)
        db.session.flush()
        ex_id = ex.exercise_id
        att = ExerciseAttempt(exercise_id=ex_id, user_id=uuid.UUID(student_id), score=100.0)
        # Create LessonProgress & LearningProgress
        lp = LessonProgress(lesson_id=uuid.UUID(l5_id), user_id=uuid.UUID(student_id), status="completed")
        lrnp = LearningProgress(course_id=uuid.UUID(c5_id), user_id=uuid.UUID(student_id), progress_percent=100.0)
        db.session.add_all([att, lp, lrnp])
        db.session.commit()
    res5_del = client.delete(f"/api/v1/classrooms/{c5_id}", headers=inst_a_headers)
    print(f"Status: {res5_del.status_code}, Body: {res5_del.get_json()}")
    assert res5_del.status_code == 200
    with app.app_context():
        assert db.session.get(Classroom, uuid.UUID(c5_id)) is None
        assert db.session.get(Lesson, uuid.UUID(l5_id)) is None
        assert db.session.get(Exercise, ex_id) is None
        assert ExerciseAttempt.query.filter_by(exercise_id=ex_id).count() == 0
        assert LessonProgress.query.filter_by(lesson_id=uuid.UUID(l5_id)).count() == 0
        assert LearningProgress.query.filter_by(course_id=uuid.UUID(c5_id)).count() == 0
    results["5. DELETE Classroom with exercises & progress"] = "PASS"

    # TEST 6: Delete Classroom that is NOT owned by the instructor (RBAC 403)
    print("\n[TEST 6] ลบ Classroom ที่ไม่ใช่ของผู้ใช้ (Forbidden 403)")
    res6 = client.post("/api/v1/classrooms", headers=inst_a_headers, json={"title": "Instructor A Course"})
    c6_id = res6.get_json()["classroom"]["classroom_id"]
    res6_del = client.delete(f"/api/v1/classrooms/{c6_id}", headers=inst_b_headers)
    print(f"Status: {res6_del.status_code}, Body: {res6_del.get_json()}")
    assert res6_del.status_code == 403
    results["6. DELETE Classroom by non-owner Instructor (403)"] = "PASS"

    # TEST 7: Delete Classroom with non-existent UUID (404)
    print("\n[TEST 7] ลบ Classroom ที่ไม่มีอยู่จริง (404)")
    random_uuid = str(uuid.uuid4())
    res7_del = client.delete(f"/api/v1/classrooms/{random_uuid}", headers=inst_a_headers)
    print(f"Status: {res7_del.status_code}, Body: {res7_del.get_json()}")
    assert res7_del.status_code == 404
    results["7. DELETE Non-existent Classroom (404)"] = "PASS"

    # TEST 8: Delete Classroom with invalid UUID format (400)
    print("\n[TEST 8] ลบ Classroom ด้วย Invalid ID format (400)")
    res8_del = client.delete("/api/v1/classrooms/invalid-id-123", headers=inst_a_headers)
    print(f"Status: {res8_del.status_code}, Body: {res8_del.get_json()}")
    assert res8_del.status_code == 400
    results["8. DELETE Invalid UUID format (400)"] = "PASS"

    # TEST 9: Delete Classroom by Student without permission (403)
    print("\n[TEST 9] ลบ Classroom โดย Student ที่ไม่มี permission (403)")
    res9_del = client.delete(f"/api/v1/classrooms/{c6_id}", headers=student_headers)
    print(f"Status: {res9_del.status_code}, Body: {res9_del.get_json()}")
    assert res9_del.status_code == 403
    results["9. DELETE Classroom by Student (403)"] = "PASS"

    # TEST 10: Delete Classroom by Admin (Admin override 200)
    print("\n[TEST 10] ลบ Classroom โดย Admin (Admin override 200)")
    res10_del = client.delete(f"/api/v1/classrooms/{c6_id}", headers=admin_headers)
    print(f"Status: {res10_del.status_code}, Body: {res10_del.get_json()}")
    assert res10_del.status_code == 200
    with app.app_context():
        assert db.session.get(Classroom, uuid.UUID(c6_id)) is None
    results["10. DELETE Classroom by Admin override"] = "PASS"

    # TEST 11: Delete Classroom by Super Admin (Super Admin override 200)
    print("\n[TEST 11] ลบ Classroom โดย Super Admin (Super Admin override 200)")
    res11 = client.post("/api/v1/classrooms", headers=inst_a_headers, json={"title": "Course for SuperAdmin test"})
    c11_id = res11.get_json()["classroom"]["classroom_id"]
    res11_del = client.delete(f"/api/v1/classrooms/{c11_id}", headers=super_admin_headers)
    print(f"Status: {res11_del.status_code}, Body: {res11_del.get_json()}")
    assert res11_del.status_code == 200
    with app.app_context():
        assert db.session.get(Classroom, uuid.UUID(c11_id)) is None
    results["11. DELETE Classroom by Super Admin override"] = "PASS"

    # =================================================================
    # CRITICAL: TEST DELETION OF THE ACTUAL REPORTED PROBLEM CLASSROOM
    # Classroom ID: d4877c7e-adb4-4d24-bf2f-fb1d93404236
    # =================================================================
    print("\n[CRITICAL TEST] ลบ Classroom ที่พบปัญหาจริง: d4877c7e-adb4-4d24-bf2f-fb1d93404236")
    prob_cid = "d4877c7e-adb4-4d24-bf2f-fb1d93404236"
    with app.app_context():
        prob_c = db.session.get(Classroom, uuid.UUID(prob_cid))
        if prob_c:
            print(f"   Found problem classroom in DB: '{prob_c.title}', Instructor: {prob_c.instructor_id}")
            res_prob_del = client.delete(f"/api/v1/classrooms/{prob_cid}", headers=admin_headers)
            print(f"   API Response Status: {res_prob_del.status_code}")
            print(f"   API Response Body: {res_prob_del.get_json()}")
            assert res_prob_del.status_code == 200
            
            # Verify in DB
            assert db.session.get(Classroom, uuid.UUID(prob_cid)) is None
            assert LessonProgress.query.filter_by(lesson_id=uuid.UUID("3df9b55e-86e4-4b80-b50c-dca5b15b19d3")).count() == 0
            assert Lesson.query.filter_by(lesson_id=uuid.UUID("3df9b55e-86e4-4b80-b50c-dca5b15b19d3")).count() == 0
            print("   -> Problem classroom and its lesson/progress/exercises successfully deleted!")
            results["12. DELETE Problem Classroom (d4877c7e...)"] = "PASS"
        else:
            print("   Problem classroom already deleted or not present.")
            results["12. DELETE Problem Classroom (d4877c7e...)"] = "ALREADY_DELETED/PASS"

    print("\n=================================================================")
    print("REGRESSION TEST RESULTS SUMMARY:")
    print("=================================================================")
    for k, v in results.items():
        print(f"  {k}: {v}")
    print("=================================================================")
    print("ALL TESTS PASSED SUCCESSFULLY!")
    print("=================================================================")


if __name__ == "__main__":
    run_regression_suite()
