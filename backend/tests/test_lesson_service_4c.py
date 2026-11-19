"""
test_lesson_service_4c.py: Phase 4C Dedicated Verification Suite
Validates:
1. LessonService business logic methods and LessonServiceError
2. 4-tier hierarchy: Course -> Chapter -> Episode -> Content
3. Dual-Pointer synchronization (content.episode_id and content.lesson_id)
4. Type-Specific Sanitizer (code, youtube, rich_text)
5. Access Control (Instructor ownership, Student enrollment, Admin override, IDOR prevention)
6. Thin Route Controller (app.routes.lessons delegating to LessonService)
"""
import uuid
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.classroom import Classroom, Lesson, Episode, Content
from app.services.lesson_service import LessonService, LessonServiceError
from flask_jwt_extended import create_access_token


def run_phase_4c_tests():
    app = create_app()
    client = app.test_client()

    with app.app_context():
        print("======================================================================")
        print("         TEST SUITE 4C: LESSON & CONTENT DOMAIN EXTRACTION            ")
        print("======================================================================")

        # Setup test users
        from app.models.role import Role
        instructor = User.query.filter(User.roles.any(Role.role_name == "instructor")).first()
        student = User.query.filter(User.roles.any(Role.role_name == "student")).first()
        admin = User.query.filter(User.roles.any(Role.role_name == "admin")).first()
        assert instructor is not None, "Instructor test user must exist"
        assert student is not None, "Student test user must exist"
        assert admin is not None, "Admin test user must exist"

        # Setup another instructor for ownership tests
        other_instructor = User.query.filter_by(email="instructor2_test@test.com").first()
        if not other_instructor:
            from app.models import Role, UserProfile
            other_instructor = User(email="instructor2_test@test.com", status="active")
            other_instructor.set_password("pass123")
            inst_role = Role.query.filter_by(role_name="instructor").first()
            other_instructor.roles.append(inst_role)
            db.session.add(other_instructor)
            db.session.add(UserProfile(user=other_instructor, display_name="Other Inst"))
            db.session.commit()

        # Tokens
        inst_token = create_access_token(identity=str(instructor.user_id))
        other_inst_token = create_access_token(identity=str(other_instructor.user_id))
        student_token = create_access_token(identity=str(student.user_id))
        admin_token = create_access_token(identity=str(admin.user_id))

        inst_headers = {"Authorization": f"Bearer {inst_token}", "Content-Type": "application/json"}
        other_inst_headers = {"Authorization": f"Bearer {other_inst_token}", "Content-Type": "application/json"}
        student_headers = {"Authorization": f"Bearer {student_token}", "Content-Type": "application/json"}
        admin_headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}

        # Create a test classroom owned by instructor
        test_classroom = Classroom(
            instructor_id=instructor.user_id,
            title="Phase 4C Test Course",
            description="Testing LessonService Refactor",
            status="active"
        )
        db.session.add(test_classroom)
        db.session.commit()
        classroom_id = str(test_classroom.classroom_id)

        try:
            # -----------------------------------------------------------------
            # TEST 1: Service Direct Call - create_lesson and validation
            # -----------------------------------------------------------------
            print("\n[TEST 1] Testing LessonService.create_lesson validation & logic:")
            # Bad UUID
            try:
                LessonService.create_lesson("not-a-uuid", instructor, {"title": "Ch 1"})
                assert False, "Should raise LessonServiceError for invalid UUID"
            except LessonServiceError as e:
                assert e.status_code == 400
                print("   -> PASS: Invalid classroom ID raises LessonServiceError(400)")

            # Forbidden instructor
            try:
                LessonService.create_lesson(classroom_id, other_instructor, {"title": "Ch 1"})
                assert False, "Should raise LessonServiceError(403) for non-owner"
            except LessonServiceError as e:
                assert e.status_code == 403
                print("   -> PASS: Non-owner instructor rejected with 403")

            # Empty title
            try:
                LessonService.create_lesson(classroom_id, instructor, {"title": ""})
                assert False, "Should raise LessonServiceError(400) for empty title"
            except LessonServiceError as e:
                assert e.status_code == 400
                print("   -> PASS: Empty title rejected with 400")

            # Valid creation via Service
            res, code = LessonService.create_lesson(classroom_id, instructor, {
                "title": "Chapter 1: Architecture Basics",
                "sequence_no": 1,
                "description": "Intro chapter"
            })
            assert code == 201
            assert "lesson" in res and "chapter" in res
            lesson_id = res["lesson"]["lesson_id"]
            print(f"   -> PASS: Lesson created successfully via LessonService (ID: {lesson_id})")

            # -----------------------------------------------------------------
            # TEST 2: Controller API - list_lessons & get_lesson
            # -----------------------------------------------------------------
            print("\n[TEST 2] Testing HTTP Route: GET /classrooms/<id>/lessons & GET /lessons/<id>:")
            resp = client.get(f"/api/v1/classrooms/{classroom_id}/lessons")
            assert resp.status_code == 200
            data = resp.get_json()
            assert "lessons" in data and "chapters" in data
            assert len(data["lessons"]) >= 1
            print("   -> PASS: GET /classrooms/<id>/lessons returned lessons and chapters contract")

            resp_detail = client.get(f"/api/v1/lessons/{lesson_id}")
            assert resp_detail.status_code == 200
            data_detail = resp_detail.get_json()
            assert "lesson" in data_detail and "chapter" in data_detail
            assert data_detail["lesson"]["title"] == "Chapter 1: Architecture Basics"
            print("   -> PASS: GET /lessons/<id> returned lesson and chapter details")

            # -----------------------------------------------------------------
            # TEST 3: Controller API - create_episode & list_episodes
            # -----------------------------------------------------------------
            print("\n[TEST 3] Testing Episode CRUD via HTTP Routes:")
            resp_ep = client.post(f"/api/v1/lessons/{lesson_id}/episodes", headers=inst_headers, json={
                "title": "Episode 1.1: Component Boundaries",
                "sequence_no": 1,
                "duration_seconds": 600,
                "description": "Explaining separation of concerns"
            })
            assert resp_ep.status_code == 201
            ep_data = resp_ep.get_json()
            assert "episode" in ep_data
            episode_id = ep_data["episode"]["episode_id"]
            print(f"   -> PASS: POST /lessons/<id>/episodes created episode (ID: {episode_id})")

            resp_ep_list = client.get(f"/api/v1/lessons/{lesson_id}/episodes")
            assert resp_ep_list.status_code == 200
            assert len(resp_ep_list.get_json()["episodes"]) >= 1
            print("   -> PASS: GET /lessons/<id>/episodes verified")

            # -----------------------------------------------------------------
            # TEST 4: Dual-Pointer Sync & Type-Specific Content Sanitizer
            # -----------------------------------------------------------------
            print("\n[TEST 4] Testing Dual-Pointer Sync & Content Type Sanitizers:")
            # Code content with HTML-like tags (must NOT be stripped)
            code_payload = {
                "content_type": "code",
                "content_data": "def test():\n    return '<div>keep me intact</div>'",
                "caption": "Python snippet",
                "sequence_no": 1
            }
            resp_code = client.post(f"/api/v1/episodes/{episode_id}/contents", headers=inst_headers, json=code_payload)
            assert resp_code.status_code == 201
            code_res = resp_code.get_json()["content"]
            assert "<div>keep me intact</div>" in code_res["content_data"]
            code_content_id = code_res["content_id"]

            # Verify Dual-Pointer in DB
            c_db = db.session.get(Content, uuid.UUID(code_content_id))
            assert str(c_db.episode_id) == str(episode_id)
            assert str(c_db.lesson_id) == str(lesson_id)
            print("   -> PASS: Code content preserved tags 100% and Dual-Pointer (episode_id + lesson_id) synchronized")

            # YouTube content normalization
            yt_payload = {
                "content_type": "youtube",
                "content_data": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "caption": "Video tutorial"
            }
            resp_yt = client.post(f"/api/v1/episodes/{episode_id}/contents", headers=inst_headers, json=yt_payload)
            assert resp_yt.status_code == 201
            yt_res = resp_yt.get_json()["content"]
            assert "youtube-nocookie.com/embed/dQw4w9WgXcQ" in yt_res["content_data"]
            print("   -> PASS: YouTube URL safely converted to nocookie embed")

            # Rich text (type: text) XSS sanitization
            rt_payload = {
                "content_type": "text",
                "content_data": "<p>Hello <b>world</b><script>alert('xss')</script></p>"
            }
            resp_rt = client.post(f"/api/v1/episodes/{episode_id}/contents", headers=inst_headers, json=rt_payload)
            assert resp_rt.status_code == 201
            rt_res = resp_rt.get_json()["content"]
            assert "<script>" not in rt_res["content_data"]
            assert "alert('xss')" not in rt_res["content_data"]
            assert "<b>world</b>" in rt_res["content_data"]
            print("   -> PASS: Rich text sanitized script injection while keeping safe tags")

            # -----------------------------------------------------------------
            # TEST 5: Student Access Control (Enrolled vs Non-Enrolled)
            # -----------------------------------------------------------------
            print("\n[TEST 5] Testing Student Access Control:")
            # Student not enrolled yet
            resp_no_enroll = client.get(f"/api/v1/episodes/{episode_id}/contents", headers=student_headers)
            assert resp_no_enroll.status_code == 403
            print("   -> PASS: Non-enrolled student blocked from viewing episode contents (403)")

            # Enroll student in classroom
            from app.models.classroom import ClassroomMember
            member = ClassroomMember(classroom_id=test_classroom.classroom_id, user_id=student.user_id, status="enrolled")
            db.session.add(member)
            db.session.commit()

            # Now enrolled student can access
            resp_enrolled = client.get(f"/api/v1/episodes/{episode_id}/contents", headers=student_headers)
            assert resp_enrolled.status_code == 200
            assert len(resp_enrolled.get_json()["contents"]) == 3
            print("   -> PASS: Enrolled student granted access to episode contents (200)")

            # -----------------------------------------------------------------
            # TEST 6: Legacy Content Endpoints with Auto-Episode Fallback
            # -----------------------------------------------------------------
            print("\n[TEST 6] Testing Legacy Content Endpoints:")
            # Create a chapter without episodes
            res_ch2, _ = LessonService.create_lesson(classroom_id, instructor, {
                "title": "Chapter 2: Legacy Test",
                "sequence_no": 2
            })
            ch2_id = res_ch2["lesson"]["lesson_id"]

            resp_legacy = client.post(f"/api/v1/lessons/{ch2_id}/contents", headers=inst_headers, json={
                "content_type": "text",
                "content_data": "Legacy content body"
            })
            assert resp_legacy.status_code == 201
            legacy_item = resp_legacy.get_json()["content"]
            assert legacy_item["episode_id"] is not None
            print("   -> PASS: Legacy POST /lessons/<id>/contents auto-generated fallback Episode")

            # -----------------------------------------------------------------
            # TEST 7: Single Content Item CRUD & Admin Override
            # -----------------------------------------------------------------
            print("\n[TEST 7] Testing Single Content CRUD & Admin Override:")
            # Student cannot update content (403)
            resp_upd_st = client.put(f"/api/v1/contents/{code_content_id}", headers=student_headers, json={
                "caption": "Student edit"
            })
            assert resp_upd_st.status_code == 403
            print("   -> PASS: Student blocked from editing content (403)")

            # Admin override update
            resp_upd_admin = client.put(f"/api/v1/contents/{code_content_id}", headers=admin_headers, json={
                "caption": "Admin verified caption"
            })
            assert resp_upd_admin.status_code == 200
            assert resp_upd_admin.get_json()["content"]["caption"] == "Admin verified caption"
            print("   -> PASS: Admin override allows updating content (200)")

            # Admin override delete
            resp_del_admin = client.delete(f"/api/v1/contents/{code_content_id}", headers=admin_headers)
            assert resp_del_admin.status_code == 200
            print("   -> PASS: Admin override allows deleting content (200)")

            # -----------------------------------------------------------------
            # TEST 8: Cascade Deletion
            # -----------------------------------------------------------------
            print("\n[TEST 8] Testing Cascade Deletion (Chapter -> Episodes -> Contents):")
            resp_del_ch = client.delete(f"/api/v1/lessons/{lesson_id}", headers=inst_headers)
            assert resp_del_ch.status_code == 200
            # Verify deleted from DB
            assert db.session.get(Lesson, uuid.UUID(lesson_id)) is None
            assert db.session.get(Episode, uuid.UUID(episode_id)) is None
            print("   -> PASS: DELETE /lessons/<id> cascade deleted all child episodes and contents")

            print("\n======================================================================")
            print("          ALL 8 TESTS IN PHASE 4C SUITE PASSED SUCCESSFULLY!          ")
            print("======================================================================")

        finally:
            # Cleanup test classroom
            db.session.rollback()
            c_clean = db.session.get(Classroom, uuid.UUID(classroom_id))
            if c_clean:
                db.session.delete(c_clean)
                db.session.commit()


if __name__ == "__main__":
    run_phase_4c_tests()
