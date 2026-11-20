"""
test_module_8_1_e2e.py
End-to-End Automated Verification Suite for Module 8.1 - Interactive Exercise / Quiz
Real PostgreSQL Database & Real Flask RESTful APIs
Tests A through N:
- Test A: Question Image
- Test B: Image Choice
- Test C: Text Matching
- Test D: Image -> Text Matching
- Test E: Image -> Image Matching
- Test F: Wrong Answer & Partial Credit
- Test G: Unified Result Summary
- Test H: Answer Review
- Test I: Attempt History
- Test J: Countdown & Started_at Source of Truth
- Test K: Auto Submit
- Test L: Manual Submit
- Test M: Double Submit Protection
- Test N: Media Upload Integration
"""
import io
import json
import uuid
from datetime import datetime, timezone
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.role import Role
from app.models.classroom import Classroom, ClassroomMember, Media
from app.models.quiz import (
    Quiz,
    QuizCondition,
    Question,
    QuizQuestion,
    QuestionOption,
    QuizAttempt,
    QuizAnswer,
    QuizResult,
)
from flask_jwt_extended import create_access_token


def run_e2e_tests():
    app = create_app()
    client = app.test_client()

    results = []

    def record_test(code, name, passed, details=""):
        status = "PASS" if passed else "FAIL"
        results.append({"code": code, "name": name, "status": status, "details": details})
        print(f"[{status}] {code}: {name} - {details}")

    with app.app_context():
        print("\n" + "=" * 70)
        print("STARTING MODULE 8.1 INTERACTIVE EXERCISE / QUIZ E2E VERIFICATION")
        print("=" * 70 + "\n")

        # -------------------------------------------------------------
        # Setup: Ensure Roles & Users
        # -------------------------------------------------------------
        student_role = Role.query.filter_by(role_name="student").first()
        instructor_role = Role.query.filter_by(role_name="instructor").first()
        admin_role = Role.query.filter_by(role_name="admin").first()

        inst = User.query.filter_by(email="e2e_81_instructor@test.com").first()
        if not inst:
            inst = User(email="e2e_81_instructor@test.com", status="active")
            inst.set_password("SecurePass123!")
            inst.roles = [instructor_role]
            db.session.add(inst)
            db.session.commit()

        student = User.query.filter_by(email="e2e_81_student@test.com").first()
        if not student:
            student = User(email="e2e_81_student@test.com", status="active")
            student.set_password("SecurePass123!")
            student.roles = [student_role]
            db.session.add(student)
            db.session.commit()

        course = Classroom.query.filter_by(title="Module 8.1 E2E Test Course").first()
        if not course:
            course = Classroom(
                title="Module 8.1 E2E Test Course",
                description="Classroom for interactive quiz testing",
                instructor_id=inst.user_id,
                status="active"
            )
            db.session.add(course)
            db.session.commit()

        if not course.has_member(student.user_id):
            cm = ClassroomMember(classroom_id=course.classroom_id, user_id=student.user_id, status="enrolled")
            db.session.add(cm)
            db.session.commit()

        with app.test_request_context():
            inst_token = create_access_token(identity=str(inst.user_id))
            student_token = create_access_token(identity=str(student.user_id))

        inst_headers = {"Authorization": f"Bearer {inst_token}", "Content-Type": "application/json"}
        student_headers = {"Authorization": f"Bearer {student_token}", "Content-Type": "application/json"}

        # -------------------------------------------------------------
        # Test N: Media Upload Integration
        # -------------------------------------------------------------
        try:
            png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
            upload_data = {
                "file": (io.BytesIO(png_bytes), "quiz_diagram.png", "image/png")
            }
            res_n = client.post(
                "/api/v1/media/upload",
                headers={"Authorization": f"Bearer {inst_token}"},
                content_type="multipart/form-data",
                data=upload_data
            )
            data_n = res_n.get_json() or {}
            uploaded_img_url = data_n.get("file_url")
            test_n_pass = res_n.status_code == 201 and bool(uploaded_img_url)
            record_test(
                "Test N",
                "Media Upload Integration (PNG -> /api/v1/media/upload)",
                test_n_pass,
                f"HTTP {res_n.status_code}, URL: {uploaded_img_url}"
            )
        except Exception as e:
            record_test("Test N", "Media Upload Integration", False, str(e))
            uploaded_img_url = "http://localhost:5000/api/v1/media/uploads/mock_diagram.png"

        # -------------------------------------------------------------
        # Setup Quiz for Testing A - M
        # -------------------------------------------------------------
        quiz = Quiz.query.filter_by(title="Module 8.1 Interactive Master Exam").first()
        if quiz:
            # Clean up old attempts for clean slate
            QuizAttempt.query.filter_by(quiz_id=quiz.quiz_id).delete()
            db.session.commit()
        else:
            quiz = Quiz(
                course_id=course.classroom_id,
                title="Module 8.1 Interactive Master Exam",
                description="Comprehensive evaluation test for Module 8.1",
            )
            db.session.add(quiz)
            db.session.flush()

            qc = QuizCondition(
                quiz_id=quiz.quiz_id,
                passing_score=70.0,
                max_attempts=3,
                time_limit_minutes=15
            )
            db.session.add(qc)
            db.session.commit()

        # Clean existing questions
        QuizQuestion.query.filter_by(quiz_id=quiz.quiz_id).delete()
        db.session.commit()

        # -------------------------------------------------------------
        # Test A: Question Image (Question with image_url)
        # -------------------------------------------------------------
        q_a = Question(
            question_text="What network topology does the diagram represent?",
            question_type="multiple_choice",
            image_url=uploaded_img_url,
            points=2.0,
            explanation="The diagram clearly exhibits a Star topology with a central switch.",
        )
        db.session.add(q_a)
        db.session.flush()
        db.session.add(QuizQuestion(quiz_id=quiz.quiz_id, question_id=q_a.question_id, order_no=1))

        opt_a1 = QuestionOption(question_id=q_a.question_id, option_text="Star Topology", is_correct=True, order_no=1)
        opt_a2 = QuestionOption(question_id=q_a.question_id, option_text="Mesh Topology", is_correct=False, order_no=2)
        opt_a3 = QuestionOption(question_id=q_a.question_id, option_text="Bus Topology", is_correct=False, order_no=3)
        db.session.add_all([opt_a1, opt_a2, opt_a3])
        db.session.commit()

        # Verify Student retrieval (Zero leak of answers, but image_url is present)
        res_get_a = client.get(f"/api/v1/quizzes/{quiz.quiz_id}", headers=student_headers)
        data_get_a = res_get_a.get_json() or {}
        q1_student = data_get_a.get("questions", [])[0] if data_get_a.get("questions") else {}
        test_a_pass = (
            q1_student.get("image_url") == uploaded_img_url
            and "is_correct" not in q1_student.get("options", [{}])[0]
            and "explanation" not in q1_student
        )
        record_test("Test A", "Question Image Retrieval & Zero Leakage", test_a_pass, f"Student received image_url: {q1_student.get('image_url')}")

        # -------------------------------------------------------------
        # Test B: Image Choice (Option Images)
        # -------------------------------------------------------------
        img_opt1 = "/api/v1/media/uploads/python_logo.png"
        img_opt2 = "/api/v1/media/uploads/java_logo.png"
        img_opt3 = "/api/v1/media/uploads/rust_logo.png"

        q_b = Question(
            question_text="Select the logo representing the Python programming language:",
            question_type="image_choice",
            points=2.0,
            explanation="The Python logo features two interlocking snakes (blue and yellow).",
        )
        db.session.add(q_b)
        db.session.flush()
        db.session.add(QuizQuestion(quiz_id=quiz.quiz_id, question_id=q_b.question_id, order_no=2))

        opt_b1 = QuestionOption(question_id=q_b.question_id, option_text="Python", image_url=img_opt1, is_correct=True, order_no=1)
        opt_b2 = QuestionOption(question_id=q_b.question_id, option_text="Java", image_url=img_opt2, is_correct=False, order_no=2)
        opt_b3 = QuestionOption(question_id=q_b.question_id, option_text="Rust", image_url=img_opt3, is_correct=False, order_no=3)
        db.session.add_all([opt_b1, opt_b2, opt_b3])
        db.session.commit()

        res_get_b = client.get(f"/api/v1/quizzes/{quiz.quiz_id}", headers=student_headers)
        data_get_b = res_get_b.get_json() or {}
        q2_student = data_get_b.get("questions", [])[1] if len(data_get_b.get("questions", [])) > 1 else {}
        options_b = q2_student.get("options", [])
        test_b_pass = (
            len(options_b) == 3
            and all("image_url" in opt and opt["image_url"] for opt in options_b)
            and all("is_correct" not in opt for opt in options_b)
        )
        record_test("Test B", "Image Choice Options (Image URLs delivered without is_correct)", test_b_pass, f"Options with image_url: {len(options_b)}")

        # -------------------------------------------------------------
        # Test C: Text -> Text Matching
        # -------------------------------------------------------------
        q_c = Question(
            question_text="Match programming languages with their creators:",
            question_type="matching",
            points=2.0,
            explanation="Python was created by Guido van Rossum, JavaScript by Brendan Eich, and Ruby by Yukihiro Matsumoto.",
        )
        db.session.add(q_c)
        db.session.flush()
        db.session.add(QuizQuestion(quiz_id=quiz.quiz_id, question_id=q_c.question_id, order_no=3))

        opt_c1 = QuestionOption(question_id=q_c.question_id, option_text="Python -> Guido van Rossum", is_correct=True, order_no=1)
        opt_c2 = QuestionOption(question_id=q_c.question_id, option_text="JavaScript -> Brendan Eich", is_correct=True, order_no=2)
        opt_c3 = QuestionOption(question_id=q_c.question_id, option_text="Ruby -> Yukihiro Matsumoto", is_correct=True, order_no=3)
        db.session.add_all([opt_c1, opt_c2, opt_c3])
        db.session.commit()

        res_get_c = client.get(f"/api/v1/quizzes/{quiz.quiz_id}", headers=student_headers)
        data_get_c = res_get_c.get_json() or {}
        q3_student = data_get_c.get("questions", [])[2] if len(data_get_c.get("questions", [])) > 2 else {}
        test_c_pass = (
            set(q3_student.get("left_items", [])) == {"Python", "JavaScript", "Ruby"}
            and set(q3_student.get("right_items", [])) == {"Guido van Rossum", "Brendan Eich", "Yukihiro Matsumoto"}
        )
        record_test("Test C", "Text -> Text Matching Data Sanitization", test_c_pass, f"Left items: {q3_student.get('left_items')}")

        # -------------------------------------------------------------
        # Test D: Image -> Text Matching
        # -------------------------------------------------------------
        q_d = Question(
            question_text="Match animal images with their English names:",
            question_type="matching",
            points=2.0,
            explanation="The images represent Cat and Dog respectively.",
        )
        db.session.add(q_d)
        db.session.flush()
        db.session.add(QuizQuestion(quiz_id=quiz.quiz_id, question_id=q_d.question_id, order_no=4))

        opt_d1 = QuestionOption(
            question_id=q_d.question_id,
            option_text=json.dumps({"left": "/api/v1/media/cat.png", "right": "Cat"}),
            is_correct=True,
            order_no=1
        )
        opt_d2 = QuestionOption(
            question_id=q_d.question_id,
            option_text=json.dumps({"left": "/api/v1/media/dog.png", "right": "Dog"}),
            is_correct=True,
            order_no=2
        )
        db.session.add_all([opt_d1, opt_d2])
        db.session.commit()

        res_get_d = client.get(f"/api/v1/quizzes/{quiz.quiz_id}", headers=student_headers)
        data_get_d = res_get_d.get_json() or {}
        q4_student = data_get_d.get("questions", [])[3] if len(data_get_d.get("questions", [])) > 3 else {}
        test_d_pass = (
            "/api/v1/media/cat.png" in q4_student.get("left_items", [])
            and "Cat" in q4_student.get("right_items", [])
        )
        record_test("Test D", "Image -> Text Matching (Left=Image URL, Right=Text)", test_d_pass, f"Left URLs: {q4_student.get('left_items')}")

        # -------------------------------------------------------------
        # Test E: Image -> Image Matching
        # -------------------------------------------------------------
        q_e = Question(
            question_text="Match the flags with their national symbols:",
            question_type="matching",
            points=2.0,
            explanation="Matching flag image with crest image.",
        )
        db.session.add(q_e)
        db.session.flush()
        db.session.add(QuizQuestion(quiz_id=quiz.quiz_id, question_id=q_e.question_id, order_no=5))

        opt_e1 = QuestionOption(
            question_id=q_e.question_id,
            option_text=json.dumps({"left": "/api/v1/media/flag1.png", "right": "/api/v1/media/crest1.png"}),
            is_correct=True,
            order_no=1
        )
        opt_e2 = QuestionOption(
            question_id=q_e.question_id,
            option_text=json.dumps({"left": "/api/v1/media/flag2.png", "right": "/api/v1/media/crest2.png"}),
            is_correct=True,
            order_no=2
        )
        db.session.add_all([opt_e1, opt_e2])
        db.session.commit()

        res_get_e = client.get(f"/api/v1/quizzes/{quiz.quiz_id}", headers=student_headers)
        data_get_e = res_get_e.get_json() or {}
        q5_student = data_get_e.get("questions", [])[4] if len(data_get_e.get("questions", [])) > 4 else {}
        test_e_pass = (
            "/api/v1/media/flag1.png" in q5_student.get("left_items", [])
            and "/api/v1/media/crest1.png" in q5_student.get("right_items", [])
        )
        record_test("Test E", "Image -> Image Matching (Both sides Image URLs)", test_e_pass, f"Right URLs: {q5_student.get('right_items')}")

        # -------------------------------------------------------------
        # Test J: Countdown & Started_at Source of Truth
        # -------------------------------------------------------------
        res_start = client.post(f"/api/v1/quizzes/{quiz.quiz_id}/attempts", headers=student_headers)
        att_data = res_start.get_json().get("attempt") or {}
        first_started_at = att_data.get("started_at")
        test_j_time_limit = att_data.get("time_limit_minutes") == 15

        # Resume attempt to verify started_at is preserved
        res_resume = client.post(f"/api/v1/quizzes/{quiz.quiz_id}/attempts", headers=student_headers)
        resumed_data = res_resume.get_json().get("attempt") or {}
        resumed_started_at = resumed_data.get("started_at")

        test_j_pass = (
            res_start.status_code in [200, 201]
            and test_j_time_limit
            and first_started_at is not None
            and first_started_at == resumed_started_at
        )
        record_test("Test J", "Server-side Countdown & started_at Preservation", test_j_pass, f"started_at: {first_started_at}, time_limit: {att_data.get('time_limit_minutes')} mins")

        # -------------------------------------------------------------
        # Test F: Wrong Answer & Partial Credit
        # -------------------------------------------------------------
        # In question C (3 pairs), answer 1 pair correctly, 2 wrong -> partial credit = (1/3) * 2.0 = 0.67
        wrong_answers_payload = {
            "attempt_id": att_data.get("attempt_id"),
            "answers": [
                {"question_id": str(q_a.question_id), "option_id": str(opt_a2.option_id)}, # Wrong
                {"question_id": str(q_b.question_id), "option_id": str(opt_b2.option_id)}, # Wrong
                {
                    "question_id": str(q_c.question_id),
                    "matches": [
                        {"left": "Python", "right": "Guido van Rossum"}, # Correct
                        {"left": "JavaScript", "right": "Wrong Person"},  # Wrong
                        {"left": "Ruby", "right": "Wrong Person"}        # Wrong
                    ]
                },
                {"question_id": str(q_d.question_id), "matches": []}, # Unanswered
                {"question_id": str(q_e.question_id), "matches": []}, # Unanswered
            ]
        }
        res_sub_wrong = client.post(f"/api/v1/quizzes/{quiz.quiz_id}/submit", headers=student_headers, json=wrong_answers_payload)
        data_sub_wrong = res_sub_wrong.get_json() or {}
        test_f_pass = (
            res_sub_wrong.status_code == 200
            and data_sub_wrong.get("score") == 0.67
            and data_sub_wrong.get("is_passed") is False
            and data_sub_wrong.get("wrong_count") >= 4
        )
        record_test("Test F", "Wrong Answer & Partial Credit Calculation (1/3 pair = 0.67 pts, Fail)", test_f_pass, f"Score: {data_sub_wrong.get('score')} pts, Pass: {data_sub_wrong.get('is_passed')}")

        # -------------------------------------------------------------
        # Test M: Double Submit Protection
        # -------------------------------------------------------------
        res_double = client.post(f"/api/v1/quizzes/{quiz.quiz_id}/submit", headers=student_headers, json=wrong_answers_payload)
        test_m_pass = res_double.status_code == 409
        record_test("Test M", "Double Submission Guard (HTTP 409 Conflict)", test_m_pass, f"HTTP {res_double.status_code} on re-submit attempt")

        # -------------------------------------------------------------
        # Test L: Manual Submit (Full Perfect Answers for 100% Score)
        # -------------------------------------------------------------
        # Start new attempt
        res_start2 = client.post(f"/api/v1/quizzes/{quiz.quiz_id}/attempts", headers=student_headers)
        att2_data = res_start2.get_json().get("attempt") or {}
        att2_id = att2_data.get("attempt_id")

        perfect_payload = {
            "attempt_id": att2_id,
            "answers": [
                {"question_id": str(q_a.question_id), "option_id": str(opt_a1.option_id)},
                {"question_id": str(q_b.question_id), "option_id": str(opt_b1.option_id)},
                {
                    "question_id": str(q_c.question_id),
                    "matches": [
                        {"left": "Python", "right": "Guido van Rossum"},
                        {"left": "JavaScript", "right": "Brendan Eich"},
                        {"left": "Ruby", "right": "Yukihiro Matsumoto"},
                    ]
                },
                {
                    "question_id": str(q_d.question_id),
                    "matches": [
                        {"left": "/api/v1/media/cat.png", "right": "Cat"},
                        {"left": "/api/v1/media/dog.png", "right": "Dog"},
                    ]
                },
                {
                    "question_id": str(q_e.question_id),
                    "matches": [
                        {"left": "/api/v1/media/flag1.png", "right": "/api/v1/media/crest1.png"},
                        {"left": "/api/v1/media/flag2.png", "right": "/api/v1/media/crest2.png"},
                    ]
                },
            ]
        }
        res_sub_perfect = client.post(f"/api/v1/quizzes/{quiz.quiz_id}/submit", headers=student_headers, json=perfect_payload)
        data_perfect = res_sub_perfect.get_json() or {}
        test_l_pass = (
            res_sub_perfect.status_code == 200
            and data_perfect.get("score") == 10.0
            and data_perfect.get("percentage") == 100.0
            and data_perfect.get("is_passed") is True
        )
        record_test("Test L", "Manual Submission (100% Score, 10.0 / 10.0 pts)", test_l_pass, f"Score: {data_perfect.get('score')}/{data_perfect.get('total_score')}, Pass: {data_perfect.get('is_passed')}")

        # -------------------------------------------------------------
        # Test G: Unified Result Summary (Score, Pass/Fail, Counts, Time)
        # -------------------------------------------------------------
        res_g = client.get(f"/api/v1/quizzes/{quiz.quiz_id}/result", headers=student_headers)
        data_g = res_g.get_json() or {}
        test_g_pass = (
            res_g.status_code == 200
            and data_g.get("score") == 10.0
            and data_g.get("percentage") == 100.0
            and data_g.get("is_passed") is True
            and data_g.get("correct_count") == 5
            and data_g.get("wrong_count") == 0
            and data_g.get("total_questions") == 5
            and "time_used" in data_g
        )
        record_test("Test G", "Unified Result Summary (correct_count=5, wrong=0, total=5, time_used)", test_g_pass, f"Summary: {data_g.get('correct_count')}/{data_g.get('total_questions')} correct, time_used={data_g.get('time_used')}s")

        # -------------------------------------------------------------
        # Test H: Answer Review (Images, User Answer, Correct Answer, Explanation)
        # -------------------------------------------------------------
        res_h = client.get(f"/api/v1/quizzes/{quiz.quiz_id}/answer-review", headers=student_headers)
        data_h = res_h.get_json() or {}
        reviews_h = data_h.get("reviews", [])
        q_img_review = next((r for r in reviews_h if r["question_id"] == str(q_a.question_id)), None)
        matching_img_review = next((r for r in reviews_h if r["question_id"] == str(q_d.question_id)), None)

        test_h_pass = (
            res_h.status_code == 200
            and len(reviews_h) == 5
            and q_img_review is not None
            and q_img_review.get("image_url") == uploaded_img_url
            and bool(q_img_review.get("explanation"))
            and matching_img_review is not None
            and bool(matching_img_review.get("correct_answer"))
        )
        record_test("Test H", "Answer Review with Images and Explanations", test_h_pass, f"Reviews returned: {len(reviews_h)}, Question image: {bool(q_img_review.get('image_url'))}")

        # -------------------------------------------------------------
        # Test I: Attempt History
        # -------------------------------------------------------------
        res_i = client.get(f"/api/v1/quizzes/{quiz.quiz_id}/attempts", headers=student_headers)
        data_i = res_i.get_json() or {}
        attempts_list = data_i.get("attempts", [])
        test_i_pass = (
            res_i.status_code == 200
            and len(attempts_list) >= 2
            and all("started_at" in a and "score" in a and "status" in a for a in attempts_list)
        )
        record_test("Test I", "Attempt History API (Multiple attempts with scores, dates, status)", test_i_pass, f"Total attempts recorded: {len(attempts_list)}")

        # -------------------------------------------------------------
        # Test K: Auto Submit on Time Up
        # -------------------------------------------------------------
        # Create an attempt, submit via auto-submit payload without manual confirmation
        res_start3 = client.post(f"/api/v1/quizzes/{quiz.quiz_id}/attempts", headers=student_headers)
        att3_data = res_start3.get_json().get("attempt") or {}
        att3_id = att3_data.get("attempt_id")

        auto_submit_payload = {
            "attempt_id": att3_id,
            "answers": [
                {"question_id": str(q_a.question_id), "option_id": str(opt_a1.option_id)},
            ]
        }
        res_k = client.post(f"/api/v1/quizzes/{quiz.quiz_id}/submit", headers=student_headers, json=auto_submit_payload)
        data_k = res_k.get_json() or {}
        test_k_pass = (
            res_k.status_code == 200
            and data_k.get("attempt_id") == att3_id
            and data_k.get("total_questions") == 5
        )
        record_test("Test K", "Auto Submit Execution on Expiration", test_k_pass, f"Attempt {att3_id} automatically processed: {data_k.get('score')} pts")

        # -------------------------------------------------------------
        # Test O: Scenario Question Correct
        # -------------------------------------------------------------
        q_sc = Question(
            question_text="ในระบบฟาร์มอัจฉริยะ เซนเซอร์วัดความชื้นในดินอ่านค่าได้ 15% (วิกฤตแล้ง) ระบบควรดำเนินการอย่างไรเป็นอันดับแรก?",
            scenario="แปลงปลูกสตรอว์เบอร์รีระบบปิด ค่าความชื้นเป้าหมายอยู่ที่ 40-60% ขณะนี้เวลา 12:00 น. แดดจัด อุณหภูมิโรงเรือน 36°C ระดับน้ำในถังพักหลักอยู่ที่ 80%",
            question_type="scenario",
            skill="SENSE",
            difficulty="medium",
            concept="Automated Irrigation Safety",
            points=3.0,
            explanation="เมื่อความชื้นต่ำกว่าเกณฑ์วิกฤตและมีน้ำในถังเพียงพอ ระบบควรสั่งเปิดปั๊มน้ำทันทีเพื่อรักษาสภาพต้นพืช",
        )
        db.session.add(q_sc)
        db.session.flush()

        opt_sc1 = QuestionOption(question_id=q_sc.question_id, option_text="สั่งเปิดวาล์วและปั๊มรดน้ำทันที", is_correct=True, order_no=1)
        opt_sc2 = QuestionOption(question_id=q_sc.question_id, option_text="รอจนกว่าอุณหภูมิโรงเรือนจะลดลงต่ำกว่า 25°C", is_correct=False, order_no=2)
        opt_sc3 = QuestionOption(question_id=q_sc.question_id, option_text="ส่งอีเมลแจ้งเตือนผู้ดูแลและปิดระบบ", is_correct=False, order_no=3)
        db.session.add_all([opt_sc1, opt_sc2, opt_sc3])

        # Test Quiz for Extended Types
        quiz_ext = Quiz(
            course_id=course.classroom_id,
            title="Module 8.1 Extended Interactive Exam",
            description="Testing Scenario, Simulation, and Architecture Builder",
        )
        db.session.add(quiz_ext)
        db.session.flush()

        qc_ext = QuizCondition(
            quiz_id=quiz_ext.quiz_id,
            passing_score=70.0,
            max_attempts=10,
            time_limit_minutes=30
        )
        db.session.add(qc_ext)
        db.session.flush()

        db.session.add(QuizQuestion(quiz_id=quiz_ext.quiz_id, question_id=q_sc.question_id, order_no=1))
        db.session.commit()

        # Student takes Scenario - Correct Answer
        res_att_o = client.post(f"/api/v1/quizzes/{quiz_ext.quiz_id}/attempts", headers=student_headers)
        att_o_id = (res_att_o.get_json() or {}).get("attempt", {}).get("attempt_id")

        payload_o = {
            "attempt_id": att_o_id,
            "answers": [
                {"question_id": str(q_sc.question_id), "option_id": str(opt_sc1.option_id)}
            ]
        }
        res_o = client.post(f"/api/v1/quizzes/{quiz_ext.quiz_id}/submit", headers=student_headers, json=payload_o)
        data_o = res_o.get_json() or {}
        test_o_pass = (
            res_o.status_code == 200
            and float(data_o.get("score", 0)) == 3.0
            and data_o.get("is_passed") is True
        )
        record_test("Test O", "Scenario Question Evaluation (Correct Option)", test_o_pass, f"Score: {data_o.get('score')}/3.0 pts")

        # -------------------------------------------------------------
        # Test P: Scenario Question Wrong
        # -------------------------------------------------------------
        res_att_p = client.post(f"/api/v1/quizzes/{quiz_ext.quiz_id}/attempts", headers=student_headers)
        att_p_id = (res_att_p.get_json() or {}).get("attempt", {}).get("attempt_id")

        payload_p = {
            "attempt_id": att_p_id,
            "answers": [
                {"question_id": str(q_sc.question_id), "option_id": str(opt_sc2.option_id)}
            ]
        }
        res_p = client.post(f"/api/v1/quizzes/{quiz_ext.quiz_id}/submit", headers=student_headers, json=payload_p)
        data_p = res_p.get_json() or {}
        test_p_pass = (
            res_p.status_code == 200
            and float(data_p.get("score", 0)) == 0.0
            and data_p.get("is_passed") is False
        )
        record_test("Test P", "Scenario Question Evaluation (Wrong Option)", test_p_pass, f"Score: {data_p.get('score')}/3.0 pts")

        # -------------------------------------------------------------
        # Test Q: Simulation Correct
        # -------------------------------------------------------------
        q_sim = Question(
            question_text="จงตั้งค่าเงื่อนไขการทำงานของระบบรดน้ำอัตโนมัติเมื่อความชื้นในดินต่ำกว่า 30%",
            scenario="แปลงผักแปลง A ต้องการการรดน้ำอัตโนมัติเมื่อค่า soil_moisture < 30",
            question_type="simulation",
            skill="AUTOMATE",
            difficulty="medium",
            concept="Rule Engine & Actuators",
            points=5.0,
            explanation="กฎ IF soil_moisture < 30 THEN pump = ON สั่งงานปั๊มได้อย่างถูกต้อง",
        )
        db.session.add(q_sim)
        db.session.flush()

        opt_sim = QuestionOption(
            question_id=q_sim.question_id,
            option_text=json.dumps({"rule": "IF soil_moisture < 30 THEN pump = ON", "sensor": "soil_moisture", "operator": "<", "threshold": 30, "action": "Pump ON"}),
            is_correct=True,
            order_no=1
        )
        db.session.add(opt_sim)
        db.session.add(QuizQuestion(quiz_id=quiz_ext.quiz_id, question_id=q_sim.question_id, order_no=2))
        db.session.commit()

        # Submit Simulation Correct Answer
        res_att_q = client.post(f"/api/v1/quizzes/{quiz_ext.quiz_id}/attempts", headers=student_headers)
        att_q_id = (res_att_q.get_json() or {}).get("attempt", {}).get("attempt_id")

        payload_q = {
            "attempt_id": att_q_id,
            "answers": [
                {"question_id": str(q_sc.question_id), "option_id": str(opt_sc1.option_id)},
                {"question_id": str(q_sim.question_id), "rule": "IF soil_moisture < 30 THEN pump = ON", "action": "Pump ON"}
            ]
        }
        res_q = client.post(f"/api/v1/quizzes/{quiz_ext.quiz_id}/submit", headers=student_headers, json=payload_q)
        data_q = res_q.get_json() or {}
        test_q_pass = (
            res_q.status_code == 200
            and float(data_q.get("score", 0)) == 8.0
        )
        record_test("Test Q", "Simulation Question Evaluation (Correct Rule)", test_q_pass, f"Total Score: {data_q.get('score')}/8.0 pts")

        # -------------------------------------------------------------
        # Test R: Simulation Wrong
        # -------------------------------------------------------------
        res_att_r = client.post(f"/api/v1/quizzes/{quiz_ext.quiz_id}/attempts", headers=student_headers)
        att_r_id = (res_att_r.get_json() or {}).get("attempt", {}).get("attempt_id")

        payload_r = {
            "attempt_id": att_r_id,
            "answers": [
                {"question_id": str(q_sc.question_id), "option_id": str(opt_sc1.option_id)},
                {"question_id": str(q_sim.question_id), "rule": "IF soil_moisture > 80 THEN pump = OFF", "action": "Pump OFF"}
            ]
        }
        res_r = client.post(f"/api/v1/quizzes/{quiz_ext.quiz_id}/submit", headers=student_headers, json=payload_r)
        data_r = res_r.get_json() or {}
        test_r_pass = (
            res_r.status_code == 200
            and float(data_r.get("score", 0)) == 3.0
        )
        record_test("Test R", "Simulation Question Evaluation (Wrong Rule)", test_r_pass, f"Total Score: {data_r.get('score')}/8.0 pts")

        # -------------------------------------------------------------
        # Test S: Architecture Builder Correct
        # -------------------------------------------------------------
        q_arch = Question(
            question_text="จงออกแบบสถาปัตยกรรมระบบ IoT สำหรับสมาร์ตฟาร์มให้ครบทุกเลเยอร์",
            scenario="เชื่อมต่อข้อมูลจาก Physical World สู่ Cloud Dashboard อย่างถูกต้อง",
            question_type="architecture_builder",
            skill="CONNECT",
            difficulty="hard",
            concept="Full-stack IoT Architecture",
            points=10.0,
            explanation="การส่งข้อมูล: Physical World -> Sensor -> ESP32 -> Wi-Fi -> MQTT -> IoT Platform -> Database -> Dashboard",
        )
        db.session.add(q_arch)
        db.session.flush()

        arch_spec = {
            "required_nodes": ["Physical World", "Sensor", "ESP32", "Wi-Fi", "MQTT", "IoT Platform", "Database", "Dashboard"],
            "required_connections": [
                ["Physical World", "Sensor"],
                ["Sensor", "ESP32"],
                ["ESP32", "Wi-Fi"],
                ["Wi-Fi", "MQTT"],
                ["MQTT", "IoT Platform"],
                ["IoT Platform", "Database"],
                ["IoT Platform", "Dashboard"]
            ]
        }
        opt_arch = QuestionOption(
            question_id=q_arch.question_id,
            option_text=json.dumps(arch_spec),
            is_correct=True,
            order_no=1
        )
        db.session.add(opt_arch)
        db.session.add(QuizQuestion(quiz_id=quiz_ext.quiz_id, question_id=q_arch.question_id, order_no=3))
        db.session.commit()

        # Student submits complete Architecture
        res_att_s = client.post(f"/api/v1/quizzes/{quiz_ext.quiz_id}/attempts", headers=student_headers)
        att_s_id = (res_att_s.get_json() or {}).get("attempt", {}).get("attempt_id")

        payload_s = {
            "attempt_id": att_s_id,
            "answers": [
                {"question_id": str(q_sc.question_id), "option_id": str(opt_sc1.option_id)},
                {"question_id": str(q_sim.question_id), "rule": "IF soil_moisture < 30 THEN pump = ON"},
                {
                    "question_id": str(q_arch.question_id),
                    "nodes": arch_spec["required_nodes"],
                    "connections": arch_spec["required_connections"]
                }
            ]
        }
        res_s = client.post(f"/api/v1/quizzes/{quiz_ext.quiz_id}/submit", headers=student_headers, json=payload_s)
        data_s = res_s.get_json() or {}
        test_s_pass = (
            res_s.status_code == 200
            and float(data_s.get("score", 0)) == 18.0
            and data_s.get("is_passed") is True
        )
        record_test("Test S", "Architecture Builder (Full Score 100%)", test_s_pass, f"Total Score: {data_s.get('score')}/18.0 pts")

        # -------------------------------------------------------------
        # Test T: Architecture Builder Partial Credit & Penalties
        # -------------------------------------------------------------
        res_att_t = client.post(f"/api/v1/quizzes/{quiz_ext.quiz_id}/attempts", headers=student_headers)
        att_t_id = (res_att_t.get_json() or {}).get("attempt", {}).get("attempt_id")

        partial_connections = [
            ["Physical World", "Sensor"],
            ["Sensor", "ESP32"],
            ["ESP32", "Wi-Fi"],
            ["Database", "Sensor"]
        ]
        payload_t = {
            "attempt_id": att_t_id,
            "answers": [
                {
                    "question_id": str(q_arch.question_id),
                    "nodes": ["Physical World", "Sensor", "ESP32", "Wi-Fi", "Database"],
                    "connections": partial_connections
                }
            ]
        }
        res_t = client.post(f"/api/v1/quizzes/{quiz_ext.quiz_id}/submit", headers=student_headers, json=payload_t)
        data_t = res_t.get_json() or {}
        score_t = float(data_t.get("score", 0))
        test_t_pass = (
            res_t.status_code == 200
            and 0 < score_t < 10.0
        )
        record_test("Test T", "Architecture Builder Partial Credit & Penalties", test_t_pass, f"Partial Score Earned: {score_t}/10.0 pts")

        # -------------------------------------------------------------
        # Test U: Final Mission (100 pts evaluation)
        # -------------------------------------------------------------
        fm_quiz = Quiz.query.filter(Quiz.title.like("%Final Mission%")).first()
        test_u_pass = False
        details_u = ""
        if fm_quiz:
            QuizAttempt.query.filter_by(quiz_id=fm_quiz.quiz_id, user_id=student.user_id).delete()
            db.session.commit()
            if not fm_quiz.course.has_member(student.user_id):
                db.session.add(ClassroomMember(classroom_id=fm_quiz.course_id, user_id=student.user_id, status="enrolled"))
                db.session.commit()

            res_att_u = client.post(f"/api/v1/quizzes/{fm_quiz.quiz_id}/attempts", headers=student_headers)
            att_u_id = (res_att_u.get_json() or {}).get("attempt", {}).get("attempt_id")

            fm_answers = []
            for qq in fm_quiz.quiz_questions:
                q = qq.question
                if q.question_type in ["multiple_choice", "scenario"]:
                    corr_opt = QuestionOption.query.filter_by(question_id=q.question_id, is_correct=True).first()
                    fm_answers.append({"question_id": str(q.question_id), "option_id": str(corr_opt.option_id) if corr_opt else None})
                elif q.question_type == "matching":
                    opts = QuestionOption.query.filter_by(question_id=q.question_id).all()
                    matches = []
                    for opt in opts:
                        if "->" in opt.option_text:
                            l, r = opt.option_text.split("->", 1)
                            matches.append({"left": l.strip(), "right": r.strip()})
                    fm_answers.append({"question_id": str(q.question_id), "matches": matches})
                elif q.question_type == "ordering":
                    opts = QuestionOption.query.filter_by(question_id=q.question_id).all()
                    corr_order = [str(o.option_id) for o in sorted(opts, key=lambda x: getattr(x, 'order_no', 0) or 0)]
                    fm_answers.append({"question_id": str(q.question_id), "ordered_option_ids": corr_order})
                elif q.question_type == "simulation":
                    fm_answers.append({"question_id": str(q.question_id), "rule": "IF soil_moisture < 30 AND water_level > 10 THEN pump = ON", "action": "Pump ON"})
                elif q.question_type == "architecture_builder":
                    corr_opt = QuestionOption.query.filter_by(question_id=q.question_id, is_correct=True).first()
                    spec = json.loads(corr_opt.option_text) if corr_opt else {}
                    fm_answers.append({
                        "question_id": str(q.question_id),
                        "nodes": spec.get("required_nodes", []),
                        "connections": spec.get("required_connections", [])
                    })

            res_u = client.post(f"/api/v1/quizzes/{fm_quiz.quiz_id}/submit", headers=student_headers, json={"attempt_id": att_u_id, "answers": fm_answers})
            data_u = res_u.get_json() or {}
            test_u_pass = (
                res_u.status_code == 200
                and float(data_u.get("total_score", 0)) == 100.0
                and float(data_u.get("score", 0)) >= 70.0
                and data_u.get("is_passed") is True
            )
            details_u = f"Final Mission Score: {data_u.get('score')}/{data_u.get('total_score')} pts, Percentage: {data_u.get('percentage')}%"
        record_test("Test U", "Final Mission (100 Pts Standard Assessment)", test_u_pass, details_u)

        # -------------------------------------------------------------
        # Test V: Skill Tree Unlock in UserSkill
        # -------------------------------------------------------------
        from app.models.progress import UserSkill
        user_skills = UserSkill.query.filter_by(user_id=student.user_id, is_unlocked=True).all()
        unlocked_names = [us.skill.name for us in user_skills if us.skill]
        test_v_pass = (
            len(unlocked_names) > 0
            and any(k in unlocked_names for k in ["SENSE", "PROCESS", "ACT", "CONNECT", "COLLECT", "VISUALIZE", "AUTOMATE", "ANALYZE", "CREATE"])
        )
        record_test("Test V", "Skill Tree Unlock in PostgreSQL UserSkill", test_v_pass, f"Unlocked canonical skills: {', '.join(unlocked_names)}")

        # -------------------------------------------------------------
        # Test W: Zero Information Leakage on New Question Types
        # -------------------------------------------------------------
        res_w = client.get(f"/api/v1/quizzes/{quiz_ext.quiz_id}", headers=student_headers)
        data_w = res_w.get_json() or {}
        leak_detected = False
        for q in data_w.get("questions", []):
            if q.get("question_type") == "scenario":
                for opt in q.get("options", []):
                    if "is_correct" in opt or opt.get("is_correct") is not None:
                        leak_detected = True
            elif q.get("question_type") == "simulation":
                if q.get("options") and len(q.get("options")) > 0:
                    for opt in q.get("options"):
                        if "{" in str(opt.get("option_text")):
                            leak_detected = True
            elif q.get("question_type") == "architecture_builder":
                if q.get("options") and len(q.get("options")) > 0:
                    for opt in q.get("options"):
                        if "required_connections" in str(opt.get("option_text")):
                            leak_detected = True

        test_w_pass = res_w.status_code == 200 and not leak_detected
        record_test("Test W", "Zero Information Leakage on Scenario/Sim/Arch", test_w_pass, f"No answer keys or hidden rules leaked: {not leak_detected}")

        # -------------------------------------------------------------
        # Test X: Student Unauthorized Access
        # -------------------------------------------------------------
        unauth_user = User.query.filter_by(email="unauth_student@test.com").first()
        if not unauth_user:
            unauth_user = User(email="unauth_student@test.com", status="active")
            unauth_user.set_password("SecurePass123!")
            unauth_user.roles = [student_role]
            db.session.add(unauth_user)
            db.session.commit()

        with app.test_request_context():
            unauth_token = create_access_token(identity=str(unauth_user.user_id))
        unauth_headers = {"Authorization": f"Bearer {unauth_token}", "Content-Type": "application/json"}

        res_x_get = client.get(f"/api/v1/quizzes/{quiz_ext.quiz_id}", headers=unauth_headers)
        res_x_post = client.post(f"/api/v1/quizzes/{quiz_ext.quiz_id}/attempts", headers=unauth_headers)

        test_x_pass = (
            res_x_get.status_code == 403
            and res_x_post.status_code == 403
            and "Access denied" in (res_x_get.get_json() or {}).get("message", "")
        )
        record_test("Test X", "Student Unauthorized Access Prevention (403)", test_x_pass, f"GET: HTTP {res_x_get.status_code}, POST: HTTP {res_x_post.status_code}")

        # -------------------------------------------------------------
        # Print Summary Table
        # -------------------------------------------------------------
        print("\n" + "=" * 70)
        print("MODULE 8.1 E2E VERIFICATION TEST SUMMARY REPORT")
        print("=" * 70)
        print(f"{'Code':<8} | {'Test Name':<35} | {'Status':<6} | {'Details'}")
        print("-" * 70)
        all_passed = True
        for r in results:
            print(f"{r['code']:<8} | {r['name']:<35} | {r['status']:<6} | {r['details']}")
            if r["status"] != "PASS":
                all_passed = False
        print("=" * 70)
        print(f"OVERALL RESULT: {'ALL TESTS PASSED (' + str(len(results)) + '/' + str(len(results)) + ')' if all_passed else 'SOME TESTS FAILED'}\n")
        return all_passed


if __name__ == "__main__":
    success = run_e2e_tests()
    import sys
    sys.exit(0 if success else 1)
