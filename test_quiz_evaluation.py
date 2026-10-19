"""
test_quiz_evaluation.py
Comprehensive test suite for Backend Quiz Evaluation Engine.
Covers:
- UAT-QUIZ-001 Multiple Choice - Correct
- UAT-QUIZ-002 Multiple Choice - Wrong
- UAT-QUIZ-003 Matching - All Correct
- UAT-QUIZ-004 Matching - Partial
- UAT-QUIZ-005 Ordering - Correct
- UAT-QUIZ-006 Ordering - Wrong
- UAT-QUIZ-007 Total Score
- UAT-QUIZ-008 Percentage
- UAT-QUIZ-009 Pass
- UAT-QUIZ-010 Fail
- UAT-QUIZ-011 Save Result
- UAT-QUIZ-012 Get Result
- UAT-QUIZ-013 Answer Review
- UAT-QUIZ-014 Missing Answer
- UAT-QUIZ-015 Invalid Payload
- UAT-QUIZ-016 Duplicate Submission
- Security & Permission verification (IDOR, Tampering, Unauthenticated)
"""
import uuid
import json
import unittest
from datetime import datetime, timezone, timedelta
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.role import Role
from app.models.classroom import Classroom, ClassroomMember
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


class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = "test-quiz-secret-key-12345-very-long-and-secure-32bytes"


class TestQuizEvaluationSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app(TestConfig)
        cls.ctx = cls.app.app_context()
        cls.ctx.push()
        cls.client = cls.app.test_client()

        db.create_all()

        # Seed roles
        for r_name in ["super_admin", "admin", "instructor", "student"]:
            r = Role.query.filter_by(role_name=r_name).first()
            if not r:
                db.session.add(Role(role_name=r_name))
        db.session.commit()

        cls.student_role = Role.query.filter_by(role_name="student").first()
        cls.instructor_role = Role.query.filter_by(role_name="instructor").first()

        # สร้างผู้ใช้สำหรับทดสอบ
        cls.instructor = User(email="instructor_quiz@test.com", status="active")
        cls.instructor.set_password("SecurePass123!")
        cls.instructor.roles = [cls.instructor_role]
        db.session.add(cls.instructor)

        cls.student1 = User(email="student1_quiz@test.com", status="active")
        cls.student1.set_password("SecurePass123!")
        cls.student1.roles = [cls.student_role]
        db.session.add(cls.student1)

        cls.student2 = User(email="student2_quiz@test.com", status="active")
        cls.student2.set_password("SecurePass123!")
        cls.student2.roles = [cls.student_role]
        db.session.add(cls.student2)

        db.session.commit()

        # สร้าง Course และเพิ่ม student1 เป็นสมาชิก
        cls.course = Classroom(
            instructor_id=cls.instructor.user_id,
            title="Python and Algorithms Masterclass",
            status="published",
        )
        db.session.add(cls.course)
        db.session.flush()

        member = ClassroomMember(
            classroom_id=cls.course.classroom_id,
            user_id=cls.student1.user_id,
            status="enrolled",
        )
        db.session.add(member)
        db.session.commit()

        # สร้าง Quiz
        cls.quiz = Quiz(
            course_id=cls.course.classroom_id,
            title="Midterm Assessment: Fundamentals & Algorithms",
            description="Testing multiple choice, matching, and ordering capabilities.",
        )
        db.session.add(cls.quiz)
        db.session.flush()

        cls.condition = QuizCondition(
            quiz_id=cls.quiz.quiz_id,
            max_attempts=3,
            time_limit_minutes=45,
            passing_score=70.0,  # 70% เกณฑ์ผ่าน
        )
        db.session.add(cls.condition)

        # -------------------------------------------------------------
        # 1. Multiple Choice Question (Q1)
        # -------------------------------------------------------------
        cls.q1_mc = Question(
            question_text="What is the keyword to define a function in Python?",
            question_type="multiple_choice",
            explanation="In Python, functions are defined using the 'def' keyword.",
        )
        db.session.add(cls.q1_mc)
        db.session.flush()

        cls.q1_opt1 = QuestionOption(question_id=cls.q1_mc.question_id, option_text="func", is_correct=False, order_no=1)
        cls.q1_opt2 = QuestionOption(question_id=cls.q1_mc.question_id, option_text="def", is_correct=True, order_no=2)
        cls.q1_opt3 = QuestionOption(question_id=cls.q1_mc.question_id, option_text="function", is_correct=False, order_no=3)
        cls.q1_opt4 = QuestionOption(question_id=cls.q1_mc.question_id, option_text="lambda", is_correct=False, order_no=4)
        db.session.add_all([cls.q1_opt1, cls.q1_opt2, cls.q1_opt3, cls.q1_opt4])

        qq1 = QuizQuestion(quiz_id=cls.quiz.quiz_id, question_id=cls.q1_mc.question_id, order_no=1)
        db.session.add(qq1)

        # -------------------------------------------------------------
        # 2. Matching Question (Q2)
        # -------------------------------------------------------------
        cls.q2_match = Question(
            question_text="Match each programming language with its creator:",
            question_type="matching",
            explanation="Python was created by Guido van Rossum, JavaScript by Brendan Eich, C++ by Bjarne Stroustrup, and Rust by Graydon Hoare.",
        )
        db.session.add(cls.q2_match)
        db.session.flush()

        cls.q2_opt1 = QuestionOption(question_id=cls.q2_match.question_id, option_text='{"left": "Python", "right": "Guido van Rossum"}', order_no=1)
        cls.q2_opt2 = QuestionOption(question_id=cls.q2_match.question_id, option_text='{"left": "JavaScript", "right": "Brendan Eich"}', order_no=2)
        cls.q2_opt3 = QuestionOption(question_id=cls.q2_match.question_id, option_text='{"left": "C++", "right": "Bjarne Stroustrup"}', order_no=3)
        cls.q2_opt4 = QuestionOption(question_id=cls.q2_match.question_id, option_text='{"left": "Rust", "right": "Graydon Hoare"}', order_no=4)
        db.session.add_all([cls.q2_opt1, cls.q2_opt2, cls.q2_opt3, cls.q2_opt4])

        qq2 = QuizQuestion(quiz_id=cls.quiz.quiz_id, question_id=cls.q2_match.question_id, order_no=2)
        db.session.add(qq2)

        # -------------------------------------------------------------
        # 3. Ordering Question (Q3)
        # -------------------------------------------------------------
        cls.q3_order = Question(
            question_text="Order the SDLC phases chronologically:",
            question_type="ordering",
            explanation="The classic SDLC follows: Requirements Analysis -> System Design -> Implementation -> Testing & Deployment.",
        )
        db.session.add(cls.q3_order)
        db.session.flush()

        cls.q3_opt1 = QuestionOption(question_id=cls.q3_order.question_id, option_text="Requirements Analysis", order_no=1)
        cls.q3_opt2 = QuestionOption(question_id=cls.q3_order.question_id, option_text="System Design", order_no=2)
        cls.q3_opt3 = QuestionOption(question_id=cls.q3_order.question_id, option_text="Implementation", order_no=3)
        cls.q3_opt4 = QuestionOption(question_id=cls.q3_order.question_id, option_text="Testing & Deployment", order_no=4)
        db.session.add_all([cls.q3_opt1, cls.q3_opt2, cls.q3_opt3, cls.q3_opt4])

        qq3 = QuizQuestion(quiz_id=cls.quiz.quiz_id, question_id=cls.q3_order.question_id, order_no=3)
        db.session.add(qq3)

        db.session.commit()

        # Generate JWT headers
        cls.student1_token = create_access_token(identity=str(cls.student1.user_id))
        cls.student1_headers = {"Authorization": f"Bearer {cls.student1_token}", "Content-Type": "application/json"}

        cls.student2_token = create_access_token(identity=str(cls.student2.user_id))
        cls.student2_headers = {"Authorization": f"Bearer {cls.student2_token}", "Content-Type": "application/json"}

        cls.instructor_token = create_access_token(identity=str(cls.instructor.user_id))
        cls.instructor_headers = {"Authorization": f"Bearer {cls.instructor_token}", "Content-Type": "application/json"}

    @classmethod
    def tearDownClass(cls):
        db.session.remove()
        db.drop_all()
        cls.ctx.pop()

    def setUp(self):
        # Create an active in_progress attempt for student1 by default
        att = QuizAttempt(
            quiz_id=self.quiz.quiz_id,
            user_id=self.student1.user_id,
            started_at=datetime.now(timezone.utc),
            status="in_progress"
        )
        db.session.add(att)
        db.session.commit()
        self.current_attempt_id = str(att.attempt_id)

        self._orig_post = self.client.post
        def _auto_attempt_post(url, *args, **kwargs):
            if "/submit" in url and "json" in kwargs and isinstance(kwargs["json"], dict):
                if "attempt_id" not in kwargs["json"]:
                    headers = kwargs.get("headers", {})
                    if headers == self.student1_headers:
                        kwargs["json"]["attempt_id"] = self.current_attempt_id
            return self._orig_post(url, *args, **kwargs)
        self.client.post = _auto_attempt_post

    def tearDown(self):
        self.client.post = getattr(self, "_orig_post", self.client.post)
        # ล้างข้อมูล attempts หลังแต่ละ test เพื่อป้องกันผลกระทบข้ามเทสต์
        QuizResult.query.delete()
        QuizAnswer.query.delete()
        QuizAttempt.query.delete()
        db.session.commit()

    # =================================================================
    # UAT-QUIZ-001 & 002: Multiple Choice Evaluation
    # =================================================================
    def test_01_multiple_choice_correct(self):
        """UAT-QUIZ-001: Multiple Choice - Correct answer awards full points."""
        payload = {
            "answers": [
                {"question_id": str(self.q1_mc.question_id), "option_id": str(self.q1_opt2.option_id)},
            ]
        }
        res = self.client.post(f"/api/v1/quizzes/{self.quiz.quiz_id}/submit", headers=self.student1_headers, json=payload)
        self.assertEqual(res.status_code, 200, res.get_json())
        data = res.get_json()

        # Score: Q1 correct = 1.0, Q2 unanswered = 0.0, Q3 unanswered = 0.0 -> Total = 1.0 / 3.0
        self.assertEqual(data["score"], 1.0)
        self.assertEqual(data["total_score"], 3.0)

        ans = QuizAnswer.query.filter_by(attempt_id=uuid.UUID(data["attempt_id"]), question_id=self.q1_mc.question_id).first()
        self.assertIsNotNone(ans)
        self.assertTrue(ans.is_correct)
        self.assertEqual(ans.option_id, self.q1_opt2.option_id)

    def test_02_multiple_choice_wrong(self):
        """UAT-QUIZ-002: Multiple Choice - Wrong answer awards 0 points."""
        payload = {
            "answers": [
                {"question_id": str(self.q1_mc.question_id), "option_id": str(self.q1_opt1.option_id)},  # 'func' is wrong
            ]
        }
        res = self.client.post(f"/api/v1/quizzes/{self.quiz.quiz_id}/submit", headers=self.student1_headers, json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["score"], 0.0)

        ans = QuizAnswer.query.filter_by(attempt_id=uuid.UUID(data["attempt_id"]), question_id=self.q1_mc.question_id).first()
        self.assertIsNotNone(ans)
        self.assertFalse(ans.is_correct)

    def test_03_multiple_choice_invalid_choice_id(self):
        """Validation: Invalid choice ID returns 400 Bad Request."""
        payload = {
            "answers": [
                {"question_id": str(self.q1_mc.question_id), "option_id": str(uuid.uuid4())},  # Non-existent option
            ]
        }
        res = self.client.post(f"/api/v1/quizzes/{self.quiz.quiz_id}/submit", headers=self.student1_headers, json=payload)
        self.assertEqual(res.status_code, 400)
        self.assertIn("does not belong to question", res.get_json()["message"])

    # =================================================================
    # UAT-QUIZ-003 & 004: Matching Evaluation
    # =================================================================
    def test_04_matching_all_correct(self):
        """UAT-QUIZ-003: Matching - All correct pairs awards full question score."""
        payload = {
            "answers": [
                {
                    "question_id": str(self.q2_match.question_id),
                    "matches": [
                        {"left": "Python", "right": "Guido van Rossum"},
                        {"left": "JavaScript", "right": "Brendan Eich"},
                        {"left": "C++", "right": "Bjarne Stroustrup"},
                        {"left": "Rust", "right": "Graydon Hoare"},
                    ]
                }
            ]
        }
        res = self.client.post(f"/api/v1/quizzes/{self.quiz.quiz_id}/submit", headers=self.student1_headers, json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["score"], 1.0)

        ans = QuizAnswer.query.filter_by(attempt_id=uuid.UUID(data["attempt_id"]), question_id=self.q2_match.question_id).first()
        self.assertTrue(ans.is_correct)

    def test_05_matching_partial_credit(self):
        """UAT-QUIZ-004: Matching - Partial correct pairs awards proportional credit (e.g. 2/4 = 0.50)."""
        payload = {
            "answers": [
                {
                    "question_id": str(self.q2_match.question_id),
                    "matches": [
                        {"left": "Python", "right": "Guido van Rossum"},      # Correct
                        {"left": "JavaScript", "right": "Brendan Eich"},      # Correct
                        {"left": "C++", "right": "Wrong Person"},             # Wrong
                        {"left": "Rust", "right": "Wrong Person"},            # Wrong
                    ]
                }
            ]
        }
        res = self.client.post(f"/api/v1/quizzes/{self.quiz.quiz_id}/submit", headers=self.student1_headers, json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["score"], 0.5)

        ans = QuizAnswer.query.filter_by(attempt_id=uuid.UUID(data["attempt_id"]), question_id=self.q2_match.question_id).first()
        self.assertFalse(ans.is_correct)

    def test_06_matching_duplicates_and_incomplete(self):
        """Matching: Incomplete pairs and duplicate left keys are cleanly handled."""
        payload = {
            "answers": [
                {
                    "question_id": str(self.q2_match.question_id),
                    "matches": [
                        {"left": "Python", "right": "Guido van Rossum"},  # 1 correct
                        {"left": "Python", "right": "Guido van Rossum"},  # Duplicate key ignored
                    ]
                }
            ]
        }
        res = self.client.post(f"/api/v1/quizzes/{self.quiz.quiz_id}/submit", headers=self.student1_headers, json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        # 1 out of 4 correct = 0.25
        self.assertEqual(data["score"], 0.25)

    # =================================================================
    # UAT-QUIZ-005 & 006: Ordering Evaluation
    # =================================================================
    def test_07_ordering_all_correct(self):
        """UAT-QUIZ-005: Ordering - Correct chronological sequence awards full points."""
        payload = {
            "answers": [
                {
                    "question_id": str(self.q3_order.question_id),
                    "ordered_option_ids": [
                        str(self.q3_opt1.option_id),
                        str(self.q3_opt2.option_id),
                        str(self.q3_opt3.option_id),
                        str(self.q3_opt4.option_id),
                    ]
                }
            ]
        }
        res = self.client.post(f"/api/v1/quizzes/{self.quiz.quiz_id}/submit", headers=self.student1_headers, json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["score"], 1.0)

        ans = QuizAnswer.query.filter_by(attempt_id=uuid.UUID(data["attempt_id"]), question_id=self.q3_order.question_id).first()
        self.assertTrue(ans.is_correct)

    def test_08_ordering_wrong_and_partial(self):
        """UAT-QUIZ-006: Ordering - Partially correct positions award partial score (e.g. 2/4 = 0.50)."""
        payload = {
            "answers": [
                {
                    "question_id": str(self.q3_order.question_id),
                    "ordered_option_ids": [
                        str(self.q3_opt1.option_id),  # Pos 1: Correct
                        str(self.q3_opt3.option_id),  # Pos 2: Wrong (opt3 is order 3)
                        str(self.q3_opt2.option_id),  # Pos 3: Wrong (opt2 is order 2)
                        str(self.q3_opt4.option_id),  # Pos 4: Correct
                    ]
                }
            ]
        }
        res = self.client.post(f"/api/v1/quizzes/{self.quiz.quiz_id}/submit", headers=self.student1_headers, json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        # 2 out of 4 correct positions = 0.50
        self.assertEqual(data["score"], 0.5)

    def test_09_ordering_duplicates_and_invalid(self):
        """Ordering: Duplicate item submission and non-existent IDs do not exploit score."""
        payload = {
            "answers": [
                {
                    "question_id": str(self.q3_order.question_id),
                    "ordered_option_ids": [
                        str(self.q3_opt1.option_id),
                        str(self.q3_opt1.option_id),  # Duplicate
                        str(uuid.uuid4()),            # Non-existent item
                    ]
                }
            ]
        }
        res = self.client.post(f"/api/v1/quizzes/{self.quiz.quiz_id}/submit", headers=self.student1_headers, json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        # Only position 1 is valid & correct -> 1/4 = 0.25
        self.assertEqual(data["score"], 0.25)

    # =================================================================
    # UAT-QUIZ-007, 008, 009, 010: Score Calculation & Pass/Fail
    # =================================================================
    def test_10_total_score_and_percentage_pass(self):
        """UAT-QUIZ-007, 008, 009: 100% Score yields Pass (>= 70% threshold)."""
        payload = {
            "answers": [
                {"question_id": str(self.q1_mc.question_id), "option_id": str(self.q1_opt2.option_id)},
                {
                    "question_id": str(self.q2_match.question_id),
                    "matches": [
                        {"left": "Python", "right": "Guido van Rossum"},
                        {"left": "JavaScript", "right": "Brendan Eich"},
                        {"left": "C++", "right": "Bjarne Stroustrup"},
                        {"left": "Rust", "right": "Graydon Hoare"},
                    ]
                },
                {
                    "question_id": str(self.q3_order.question_id),
                    "ordered_option_ids": [
                        str(self.q3_opt1.option_id),
                        str(self.q3_opt2.option_id),
                        str(self.q3_opt3.option_id),
                        str(self.q3_opt4.option_id),
                    ]
                }
            ]
        }
        res = self.client.post(f"/api/v1/quizzes/{self.quiz.quiz_id}/submit", headers=self.student1_headers, json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()

        self.assertEqual(data["score"], 3.0)
        self.assertEqual(data["total_score"], 3.0)
        self.assertEqual(data["percentage"], 100.0)
        self.assertTrue(data["is_passed"])
        self.assertIn("ยินดีด้วย! คุณผ่านแบบทดสอบ", data["feedback"])

    def test_11_total_score_and_fail(self):
        """UAT-QUIZ-010: Score below 70% yields Fail (e.g. 1.0 / 3.0 = 33.33%)."""
        payload = {
            "answers": [
                {"question_id": str(self.q1_mc.question_id), "option_id": str(self.q1_opt2.option_id)},  # 1.0
                {"question_id": str(self.q2_match.question_id), "matches": []},                          # 0.0
                {"question_id": str(self.q3_order.question_id), "ordered_option_ids": []},               # 0.0
            ]
        }
        res = self.client.post(f"/api/v1/quizzes/{self.quiz.quiz_id}/submit", headers=self.student1_headers, json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()

        self.assertEqual(data["score"], 1.0)
        self.assertEqual(data["total_score"], 3.0)
        self.assertEqual(data["percentage"], 33.33)
        self.assertFalse(data["is_passed"])
        self.assertIn("คุณยังไม่ผ่านแบบทดสอบ", data["feedback"])

    # =================================================================
    # UAT-QUIZ-011 & 012: Save Result & Get Result
    # =================================================================
    def test_12_save_and_get_result(self):
        """UAT-QUIZ-011 & 012: Verify database persistence and retrieval of quiz result."""
        payload = {
            "answers": [
                {"question_id": str(self.q1_mc.question_id), "option_id": str(self.q1_opt2.option_id)},
            ]
        }
        submit_res = self.client.post(f"/api/v1/quizzes/{self.quiz.quiz_id}/submit", headers=self.student1_headers, json=payload)
        att_id = submit_res.get_json()["attempt_id"]

        # Get latest result endpoint
        res = self.client.get(f"/api/v1/quizzes/{self.quiz.quiz_id}/result", headers=self.student1_headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["attempt_id"], att_id)
        self.assertEqual(data["score"], 1.0)

        # Get by attempt ID endpoint
        res2 = self.client.get(f"/api/v1/quizzes/{self.quiz.quiz_id}/attempts/{att_id}", headers=self.student1_headers)
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2.get_json()["attempt_id"], att_id)

    # =================================================================
    # UAT-QUIZ-013: Answer Review / เฉลย
    # =================================================================
    def test_13_answer_review(self):
        """UAT-QUIZ-013: Answer review provides correct answer and explanation after submit."""
        payload = {
            "answers": [
                {"question_id": str(self.q1_mc.question_id), "option_id": str(self.q1_opt2.option_id)},
            ]
        }
        submit_res = self.client.post(f"/api/v1/quizzes/{self.quiz.quiz_id}/submit", headers=self.student1_headers, json=payload)
        att_id = submit_res.get_json()["attempt_id"]

        review_res = self.client.get(f"/api/v1/quizzes/{self.quiz.quiz_id}/attempts/{att_id}/review", headers=self.student1_headers)
        self.assertEqual(review_res.status_code, 200)
        review_data = review_res.get_json()

        self.assertEqual(len(review_data["reviews"]), 3)
        mc_rev = next(r for r in review_data["reviews"] if r["question_id"] == str(self.q1_mc.question_id))
        self.assertTrue(mc_rev["is_correct"])
        self.assertEqual(mc_rev["correct_answer"], "def")
        self.assertIn("def", mc_rev["explanation"])

    # =================================================================
    # UAT-QUIZ-014: Missing Answer
    # =================================================================
    def test_14_missing_answers_handled_gracefully(self):
        """UAT-QUIZ-014: Missing answers in submission are evaluated as unanswered with 0 points."""
        payload = {
            "answers": []  # Zero questions answered
        }
        res = self.client.post(f"/api/v1/quizzes/{self.quiz.quiz_id}/submit", headers=self.student1_headers, json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertEqual(data["score"], 0.0)
        self.assertEqual(data["total_score"], 3.0)
        self.assertEqual(data["percentage"], 0.0)
        self.assertFalse(data["is_passed"])

    # =================================================================
    # UAT-QUIZ-015: Invalid Payload
    # =================================================================
    def test_15_invalid_payload_rejected(self):
        """UAT-QUIZ-015: Malformed payload formats are rejected with 400 Bad Request."""
        # Non-JSON or bad format
        res = self.client.post(
            f"/api/v1/quizzes/{self.quiz.quiz_id}/submit",
            headers=self.student1_headers,
            data="not-a-json",
            content_type="text/plain"
        )
        # Empty or bad answers
        res2 = self.client.post(
            f"/api/v1/quizzes/{self.quiz.quiz_id}/submit",
            headers=self.student1_headers,
            json={"answers": "invalid-string"}
        )
        self.assertEqual(res2.status_code, 400)

        # Question ID not in quiz
        res3 = self.client.post(
            f"/api/v1/quizzes/{self.quiz.quiz_id}/submit",
            headers=self.student1_headers,
            json={"answers": [{"question_id": str(uuid.uuid4()), "option_id": "none"}]}
        )
        self.assertEqual(res3.status_code, 400)
        self.assertIn("does not belong to this quiz", res3.get_json()["message"])

    # =================================================================
    # UAT-QUIZ-016: Duplicate Submission
    # =================================================================
    def test_16_duplicate_submission_blocked(self):
        """UAT-QUIZ-016: Attempt already completed cannot be re-submitted (409 Conflict)."""
        # Start an attempt
        start_res = self.client.post(f"/api/v1/quizzes/{self.quiz.quiz_id}/attempts", headers=self.student1_headers)
        self.assertIn(start_res.status_code, [200, 201])
        att_id = start_res.get_json()["attempt"]["attempt_id"]

        # Submit first time
        payload = {
            "attempt_id": att_id,
            "answers": [{"question_id": str(self.q1_mc.question_id), "option_id": str(self.q1_opt2.option_id)}]
        }
        res1 = self.client.post(f"/api/v1/quizzes/{self.quiz.quiz_id}/submit", headers=self.student1_headers, json=payload)
        self.assertEqual(res1.status_code, 200)

        # Submit second time with same attempt_id -> 409 Conflict
        res2 = self.client.post(f"/api/v1/quizzes/{self.quiz.quiz_id}/submit", headers=self.student1_headers, json=payload)
        self.assertEqual(res2.status_code, 409)
        self.assertIn("already been submitted", res2.get_json()["message"])

    # =================================================================
    # Security, Authorization & Tampering Tests
    # =================================================================
    def test_17_frontend_score_tampering_ignored(self):
        """Security: Frontend sending fake 'score' or 'is_correct' is strictly ignored."""
        payload = {
            "score": 999.0,          # Attacker injection
            "is_correct": True,      # Attacker injection
            "total_score": 1000.0,   # Attacker injection
            "answers": [
                {
                    "question_id": str(self.q1_mc.question_id),
                    "option_id": str(self.q1_opt1.option_id),  # Wrong answer!
                    "is_correct": True,                        # Fake correctness
                    "score": 100.0                             # Fake score
                }
            ]
        }
        res = self.client.post(f"/api/v1/quizzes/{self.quiz.quiz_id}/submit", headers=self.student1_headers, json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        # Backend calculates truth: 0.0 points
        self.assertEqual(data["score"], 0.0)
        self.assertFalse(data["is_passed"])

    def test_18_student_quiz_fetch_does_not_leak_correct_answer(self):
        """Security: GET quiz details omits is_correct from student response."""
        res = self.client.get(f"/api/v1/quizzes/{self.quiz.quiz_id}", headers=self.student1_headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()

        for q in data["questions"]:
            if "options" in q:
                for opt in q["options"]:
                    self.assertNotIn("is_correct", opt, "SECURITY BREACH: is_correct leaked in student quiz response!")

    def test_19_non_enrolled_student_cannot_submit(self):
        """Security: Student not enrolled in course is rejected with 403 Forbidden."""
        res = self.client.post(
            f"/api/v1/quizzes/{self.quiz.quiz_id}/submit",
            headers=self.student2_headers,  # student2 is NOT enrolled
            json={"answers": []}
        )
        self.assertEqual(res.status_code, 403)
        self.assertIn("must be enrolled", res.get_json()["message"])

    def test_20_unauthenticated_request_rejected(self):
        """Security: Requests without JWT token are rejected with 401 Unauthorized."""
        res = self.client.post(f"/api/v1/quizzes/{self.quiz.quiz_id}/submit", json={"answers": []})
        self.assertEqual(res.status_code, 401)

    def test_21_idor_protection_cannot_view_other_student_attempt(self):
        """Security (IDOR): Student 2 cannot access Student 1's attempt or review."""
        # Student 1 submits
        payload = {"answers": [{"question_id": str(self.q1_mc.question_id), "option_id": str(self.q1_opt2.option_id)}]}
        res = self.client.post(f"/api/v1/quizzes/{self.quiz.quiz_id}/submit", headers=self.student1_headers, json=payload)
        att_id = res.get_json()["attempt_id"]

        # Enroll student 2 so course access passes, but attempt ownership does not
        m2 = ClassroomMember(classroom_id=self.course.classroom_id, user_id=self.student2.user_id, status="enrolled")
        db.session.add(m2)
        db.session.commit()

        # Student 2 tries to fetch Student 1's result
        res2 = self.client.get(f"/api/v1/quizzes/{self.quiz.quiz_id}/attempts/{att_id}", headers=self.student2_headers)
        self.assertEqual(res2.status_code, 403)

        # Student 2 tries to fetch Student 1's review
        res3 = self.client.get(f"/api/v1/quizzes/{self.quiz.quiz_id}/attempts/{att_id}/review", headers=self.student2_headers)
        self.assertEqual(res3.status_code, 403)

    def test_22_transaction_rollback_on_failure(self):
        """Atomicity: Database failure during submission triggers transaction rollback."""
        from unittest.mock import patch
        payload = {
            "answers": [
                {"question_id": str(self.q1_mc.question_id), "option_id": str(self.q1_opt2.option_id)},
            ]
        }
        with patch("app.extensions.db.session.commit", side_effect=Exception("Database crash simulated")):
            res = self.client.post(f"/api/v1/quizzes/{self.quiz.quiz_id}/submit", headers=self.student1_headers, json=payload)
            self.assertEqual(res.status_code, 500)
            self.assertIn("Database transaction failed", res.get_json()["message"])

        # Verify rollback prevented persistence of results and answers
        self.assertEqual(QuizResult.query.count(), 0)
        self.assertEqual(QuizAnswer.query.count(), 0)

    def test_23_ordering_and_matching_zero_information_leakage(self):
        """Security: Zero information leakage for Ordering and Matching questions before submit."""
        res = self.client.get(f"/api/v1/quizzes/{self.quiz.quiz_id}", headers=self.student1_headers)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()

        for q in data["questions"]:
            # Explanation must NEVER be leaked in quiz taking mode
            self.assertNotIn("explanation", q)

            if q["question_type"] == "ordering":
                # order_no must NOT be present in options
                for opt in q["options"]:
                    self.assertNotIn("order_no", opt)
                    self.assertNotIn("is_correct", opt)
                # Option texts should be sorted alphabetically, not matching the answer order
                texts = [opt["option_text"] for opt in q["options"]]
                self.assertEqual(texts, sorted(texts, key=lambda s: s.lower()))

            elif q["question_type"] == "matching":
                # Matching should return left_items and right_items
                self.assertIn("left_items", q)
                self.assertIn("right_items", q)
                # right_items must be alphabetized so their index doesn't correspond to left_items
                self.assertEqual(q["right_items"], sorted(list(set(q["right_items"]))))
                # Raw options with correct mappings must not be exposed
                self.assertNotIn("options", q)

    def test_24_answer_review_convenience_endpoints(self):
        """API Contract: /answer-review with ?attempt_id= and default latest attempt."""
        payload = {
            "answers": [
                {"question_id": str(self.q1_mc.question_id), "option_id": str(self.q1_opt2.option_id)},
            ]
        }
        res_sub = self.client.post(f"/api/v1/quizzes/{self.quiz.quiz_id}/submit", headers=self.student1_headers, json=payload)
        att_id = res_sub.get_json()["attempt_id"]

        # 1. Convenience endpoint with query param ?attempt_id=
        res_query = self.client.get(f"/api/v1/quizzes/{self.quiz.quiz_id}/answer-review?attempt_id={att_id}", headers=self.student1_headers)
        self.assertEqual(res_query.status_code, 200)
        self.assertEqual(res_query.get_json()["attempt_id"], att_id)

        # 2. Convenience endpoint without query param (defaults to latest completed attempt)
        res_latest = self.client.get(f"/api/v1/quizzes/{self.quiz.quiz_id}/answer-review", headers=self.student1_headers)
        self.assertEqual(res_latest.status_code, 200)
        self.assertEqual(res_latest.get_json()["attempt_id"], att_id)

        # 3. Primary RESTful endpoint /attempts/<attempt_id>/review
        res_rest = self.client.get(f"/api/v1/quizzes/{self.quiz.quiz_id}/attempts/{att_id}/review", headers=self.student1_headers)
        self.assertEqual(res_rest.status_code, 200)
        self.assertEqual(res_rest.get_json()["attempt_id"], att_id)

    def test_25_max_attempts_exhausted(self):
        """Business Rule: Exceeding max_attempts blocks new attempts and submissions (400 Bad Request)."""
        payload = {
            "answers": [
                {"question_id": str(self.q1_mc.question_id), "option_id": str(self.q1_opt2.option_id)},
            ]
        }

        # Max attempts is 3 for this quiz
        for i in range(3):
            start = self.client.post(f"/api/v1/quizzes/{self.quiz.quiz_id}/attempts", headers=self.student1_headers)
            self.assertIn(start.status_code, [200, 201])
            att_id = start.get_json()["attempt"]["attempt_id"]
            iter_payload = dict(payload)
            iter_payload["attempt_id"] = att_id
            sub_res = self.client.post(f"/api/v1/quizzes/{self.quiz.quiz_id}/submit", headers=self.student1_headers, json=iter_payload)
            self.assertEqual(sub_res.status_code, 200)

        # 4th start attempt should fail
        start_res = self.client.post(f"/api/v1/quizzes/{self.quiz.quiz_id}/attempts", headers=self.student1_headers)
        self.assertEqual(start_res.status_code, 400)
        self.assertIn("Maximum attempts reached", start_res.get_json()["message"])

        # 4th submit attempt on completed attempt should fail (409 Conflict)
        submit_4th = self.client.post(f"/api/v1/quizzes/{self.quiz.quiz_id}/submit", headers=self.student1_headers, json=iter_payload)
        self.assertEqual(submit_4th.status_code, 409)





class TestQuizTimeLimitEnforcementSuite(unittest.TestCase):
    """
    UAT & Security Verification Suite for Server-Side Quiz Time Limit Enforcement (Phase 5A).
    Proves:
    1. Quizzes without time limit submit normally
    2. Submissions before deadline pass and evaluate accurately
    3. Submissions exactly at deadline pass
    4. Submissions within grace period (+15s) pass
    5. Submissions after grace period (+35s) are rejected (400) and marked 'expired'
    6. Client spoofed time_spent, submitted_at, and score are completely ignored
    7. Expired attempts cannot be resubmitted
    8. Duplicate submissions return 409 Conflict
    9. Expired attempts count towards max_attempts limit
    10. start_attempt automatically marks stale in_progress attempts as expired
    11. Expired attempts are blocked from leaking answer reviews
    12. Regression verification across multiple question types
    """

    @classmethod
    def setUpClass(cls):
        cls.app = create_app(TestConfig)
        cls.ctx = cls.app.app_context()
        cls.ctx.push()
        cls.client = cls.app.test_client()

        db.create_all()

        # Seed roles
        for r_name in ["super_admin", "admin", "instructor", "student"]:
            r = Role.query.filter_by(role_name=r_name).first()
            if not r:
                db.session.add(Role(role_name=r_name))
        db.session.commit()

        cls.student_role = Role.query.filter_by(role_name="student").first()
        cls.instructor_role = Role.query.filter_by(role_name="instructor").first()

        # Users
        cls.inst = User(email="timed_instructor@test.com", status="active")
        cls.inst.set_password("SecurePass123!")
        cls.inst.roles = [cls.instructor_role]
        db.session.add(cls.inst)

        cls.std1 = User(email="timed_student1@test.com", status="active")
        cls.std1.set_password("SecurePass123!")
        cls.std1.roles = [cls.student_role]
        db.session.add(cls.std1)

        cls.std2 = User(email="timed_student2@test.com", status="active")
        cls.std2.set_password("SecurePass123!")
        cls.std2.roles = [cls.student_role]
        db.session.add(cls.std2)

        db.session.commit()

        # Classroom
        cls.room = Classroom(instructor_id=cls.inst.user_id, title="Embedded Systems Lab", status="published")
        db.session.add(cls.room)
        db.session.flush()

        db.session.add(ClassroomMember(classroom_id=cls.room.classroom_id, user_id=cls.std1.user_id, status="enrolled"))
        db.session.add(ClassroomMember(classroom_id=cls.room.classroom_id, user_id=cls.std2.user_id, status="enrolled"))
        db.session.commit()

        # Auth headers
        cls.std1_token = create_access_token(identity=str(cls.std1.user_id))
        cls.std1_headers = {"Authorization": f"Bearer {cls.std1_token}"}

        cls.std2_token = create_access_token(identity=str(cls.std2.user_id))
        cls.std2_headers = {"Authorization": f"Bearer {cls.std2_token}"}

        # 1. Timed Quiz (time_limit = 10 minutes, max_attempts = 2)
        cls.timed_quiz = Quiz(course_id=cls.room.classroom_id, title="10-Minute Microcontroller Exam")
        db.session.add(cls.timed_quiz)
        db.session.flush()

        cls.timed_cond = QuizCondition(
            quiz_id=cls.timed_quiz.quiz_id,
            time_limit_minutes=10,
            passing_score=70.0,
            max_attempts=2,
        )
        db.session.add(cls.timed_cond)

        cls.q1 = Question(question_text="What is SPI?", question_type="multiple_choice", points=5.0)
        cls.q2 = Question(question_text="What is I2C?", question_type="multiple_choice", points=5.0)
        db.session.add_all([cls.q1, cls.q2])
        db.session.flush()

        db.session.add(QuizQuestion(quiz_id=cls.timed_quiz.quiz_id, question_id=cls.q1.question_id, order_no=1))
        db.session.add(QuizQuestion(quiz_id=cls.timed_quiz.quiz_id, question_id=cls.q2.question_id, order_no=2))

        cls.q1_opt_correct = QuestionOption(question_id=cls.q1.question_id, option_text="Serial Peripheral Interface", is_correct=True, order_no=1)
        cls.q1_opt_wrong = QuestionOption(question_id=cls.q1.question_id, option_text="Slow Parallel Interface", is_correct=False, order_no=2)

        cls.q2_opt_correct = QuestionOption(question_id=cls.q2.question_id, option_text="Inter-Integrated Circuit", is_correct=True, order_no=1)
        cls.q2_opt_wrong = QuestionOption(question_id=cls.q2.question_id, option_text="Internal Internet Control", is_correct=False, order_no=2)

        db.session.add_all([cls.q1_opt_correct, cls.q1_opt_wrong, cls.q2_opt_correct, cls.q2_opt_wrong])

        # 2. Untimed Quiz (time_limit = None, max_attempts = 5)
        cls.untimed_quiz = Quiz(course_id=cls.room.classroom_id, title="Untimed Practice Quiz")
        db.session.add(cls.untimed_quiz)
        db.session.flush()

        cls.untimed_cond = QuizCondition(
            quiz_id=cls.untimed_quiz.quiz_id,
            time_limit_minutes=None,
            passing_score=50.0,
            max_attempts=5,
        )
        db.session.add(cls.untimed_cond)

        cls.q_untimed = Question(question_text="What is UART?", question_type="multiple_choice", points=10.0)
        db.session.add(cls.q_untimed)
        db.session.flush()

        db.session.add(QuizQuestion(quiz_id=cls.untimed_quiz.quiz_id, question_id=cls.q_untimed.question_id, order_no=1))
        cls.q_untimed_opt = QuestionOption(question_id=cls.q_untimed.question_id, option_text="Universal Asynchronous Receiver-Transmitter", is_correct=True, order_no=1)
        db.session.add(cls.q_untimed_opt)

        db.session.commit()

    @classmethod
    def tearDownClass(cls):
        db.session.remove()
        db.drop_all()
        cls.ctx.pop()

    def test_01_no_time_limit_submits_successfully(self):
        """Rule 1: If quiz has no time_limit, submission succeeds regardless of elapsed time."""
        start_res = self.client.post(f"/api/v1/quizzes/{self.untimed_quiz.quiz_id}/attempts", headers=self.std1_headers)
        self.assertEqual(start_res.status_code, 201)
        att_id = start_res.get_json()["attempt"]["attempt_id"]

        # Simulate start from 8 hours ago
        att = db.session.get(QuizAttempt, uuid.UUID(att_id))
        att.started_at = datetime.now(timezone.utc) - timedelta(hours=8)
        db.session.commit()

        payload = {
            "attempt_id": att_id,
            "answers": [
                {"question_id": str(self.q_untimed.question_id), "option_id": str(self.q_untimed_opt.option_id)}
            ]
        }
        sub_res = self.client.post(f"/api/v1/quizzes/{self.untimed_quiz.quiz_id}/submit", headers=self.std1_headers, json=payload)
        self.assertEqual(sub_res.status_code, 200)
        data = sub_res.get_json()
        self.assertEqual(data["score"], 10.0)
        self.assertTrue(data["is_passed"])
        self.assertGreaterEqual(data["time_spent"], 28800)

    def test_02_submit_before_deadline_passes(self):
        """Rule 2: Submitting well before deadline (e.g. 5 mins into a 10 min quiz) succeeds."""
        start_res = self.client.post(f"/api/v1/quizzes/{self.timed_quiz.quiz_id}/attempts", headers=self.std1_headers)
        self.assertEqual(start_res.status_code, 201)
        att_id = start_res.get_json()["attempt"]["attempt_id"]

        # 5 minutes elapsed (deadline is 10 minutes)
        att = db.session.get(QuizAttempt, uuid.UUID(att_id))
        att.started_at = datetime.now(timezone.utc) - timedelta(minutes=5)
        db.session.commit()

        payload = {
            "attempt_id": att_id,
            "answers": [
                {"question_id": str(self.q1.question_id), "option_id": str(self.q1_opt_correct.option_id)},
                {"question_id": str(self.q2.question_id), "option_id": str(self.q2_opt_correct.option_id)},
            ]
        }
        sub_res = self.client.post(f"/api/v1/quizzes/{self.timed_quiz.quiz_id}/submit", headers=self.std1_headers, json=payload)
        self.assertEqual(sub_res.status_code, 200)
        data = sub_res.get_json()
        self.assertEqual(data["score"], 10.0)
        self.assertTrue(data["is_passed"])

        # Verify DB attempt status is completed
        db.session.refresh(att)
        self.assertEqual(att.status, "completed")
        self.assertIsNotNone(att.submitted_at)

    def test_03_submit_exactly_at_deadline_passes(self):
        """Rule 3: Submitting exactly at deadline (10 minutes elapsed) succeeds."""
        # Using std2 for clean attempt limits
        start_res = self.client.post(f"/api/v1/quizzes/{self.timed_quiz.quiz_id}/attempts", headers=self.std2_headers)
        self.assertEqual(start_res.status_code, 201)
        att_id = start_res.get_json()["attempt"]["attempt_id"]

        # Exactly 10 minutes elapsed (600 seconds)
        att = db.session.get(QuizAttempt, uuid.UUID(att_id))
        att.started_at = datetime.now(timezone.utc) - timedelta(minutes=10)
        db.session.commit()

        payload = {
            "attempt_id": att_id,
            "answers": [
                {"question_id": str(self.q1.question_id), "option_id": str(self.q1_opt_correct.option_id)},
            ]
        }
        sub_res = self.client.post(f"/api/v1/quizzes/{self.timed_quiz.quiz_id}/submit", headers=self.std2_headers, json=payload)
        self.assertEqual(sub_res.status_code, 200)
        db.session.refresh(att)
        self.assertEqual(att.status, "completed")

    def test_04_submit_within_grace_period_passes(self):
        """Rule 4: Submitting within grace period (10 minutes + 15 seconds) succeeds."""
        # Reset std2 attempt count by using a dedicated quiz
        q_grace = Quiz(course_id=self.room.classroom_id, title="Grace Period Test Quiz")
        db.session.add(q_grace)
        db.session.flush()
        db.session.add(QuizCondition(quiz_id=q_grace.quiz_id, time_limit_minutes=5, max_attempts=3))
        q_item = Question(question_text="Q?", question_type="multiple_choice", points=1.0)
        db.session.add(q_item)
        db.session.flush()
        db.session.add(QuizQuestion(quiz_id=q_grace.quiz_id, question_id=q_item.question_id, order_no=1))
        opt_item = QuestionOption(question_id=q_item.question_id, option_text="Opt", is_correct=True, order_no=1)
        db.session.add(opt_item)
        db.session.commit()

        start_res = self.client.post(f"/api/v1/quizzes/{q_grace.quiz_id}/attempts", headers=self.std1_headers)
        self.assertEqual(start_res.status_code, 201)
        att_id = start_res.get_json()["attempt"]["attempt_id"]

        # 5 minutes + 15 seconds elapsed (within 30s grace window)
        att = db.session.get(QuizAttempt, uuid.UUID(att_id))
        att.started_at = datetime.now(timezone.utc) - timedelta(minutes=5, seconds=15)
        db.session.commit()

        payload = {
            "attempt_id": att_id,
            "answers": [{"question_id": str(q_item.question_id), "option_id": str(opt_item.option_id)}]
        }
        sub_res = self.client.post(f"/api/v1/quizzes/{q_grace.quiz_id}/submit", headers=self.std1_headers, json=payload)
        self.assertEqual(sub_res.status_code, 200)
        db.session.refresh(att)
        self.assertEqual(att.status, "completed")

    def test_05_submit_after_grace_period_rejected_and_marked_expired(self):
        """Rule 5: Submitting after grace period (10 mins + 35s) is rejected (400) and marked expired."""
        q_exp = Quiz(course_id=self.room.classroom_id, title="Expired Test Quiz")
        db.session.add(q_exp)
        db.session.flush()
        db.session.add(QuizCondition(quiz_id=q_exp.quiz_id, time_limit_minutes=5, max_attempts=2))
        q_item = Question(question_text="Q?", question_type="multiple_choice", points=10.0)
        db.session.add(q_item)
        db.session.flush()
        db.session.add(QuizQuestion(quiz_id=q_exp.quiz_id, question_id=q_item.question_id, order_no=1))
        opt_item = QuestionOption(question_id=q_item.question_id, option_text="Opt", is_correct=True, order_no=1)
        db.session.add(opt_item)
        db.session.commit()

        start_res = self.client.post(f"/api/v1/quizzes/{q_exp.quiz_id}/attempts", headers=self.std1_headers)
        self.assertEqual(start_res.status_code, 201)
        att_id = start_res.get_json()["attempt"]["attempt_id"]

        # 5 minutes + 35 seconds elapsed (exceeds 30s grace window)
        att = db.session.get(QuizAttempt, uuid.UUID(att_id))
        att.started_at = datetime.now(timezone.utc) - timedelta(minutes=5, seconds=35)
        db.session.commit()

        payload = {
            "attempt_id": att_id,
            "answers": [{"question_id": str(q_item.question_id), "option_id": str(opt_item.option_id)}]
        }
        sub_res = self.client.post(f"/api/v1/quizzes/{q_exp.quiz_id}/submit", headers=self.std1_headers, json=payload)
        self.assertEqual(sub_res.status_code, 400)
        self.assertIn("Time limit exceeded", sub_res.get_json()["message"])

        # Verify DB attempt state
        db.session.refresh(att)
        self.assertEqual(att.status, "expired", "Attempt must be flagged as 'expired'")
        self.assertIsNotNone(att.submitted_at, "submitted_at must be recorded with server time")
        self.assertIsNone(att.result, "No QuizResult should be generated for expired submission")
        self.assertEqual(QuizAnswer.query.filter_by(attempt_id=att.attempt_id).count(), 0, "No answers recorded")

    def test_06_client_spoofed_fields_ignored_by_backend(self):
        """Security: Backend ignores client-sent time_spent, submitted_at, score, and is_passed."""
        q_sec = Quiz(course_id=self.room.classroom_id, title="Security Spoof Test Quiz")
        db.session.add(q_sec)
        db.session.flush()
        db.session.add(QuizCondition(quiz_id=q_sec.quiz_id, time_limit_minutes=15, max_attempts=2))
        q_item = Question(question_text="Q?", question_type="multiple_choice", points=10.0)
        db.session.add(q_item)
        db.session.flush()
        db.session.add(QuizQuestion(quiz_id=q_sec.quiz_id, question_id=q_item.question_id, order_no=1))
        opt_wrong = QuestionOption(question_id=q_item.question_id, option_text="Wrong", is_correct=False, order_no=1)
        db.session.add(opt_wrong)
        db.session.commit()

        start_res = self.client.post(f"/api/v1/quizzes/{q_sec.quiz_id}/attempts", headers=self.std1_headers)
        att_id = start_res.get_json()["attempt"]["attempt_id"]

        att = db.session.get(QuizAttempt, uuid.UUID(att_id))
        att.started_at = datetime.now(timezone.utc) - timedelta(minutes=2)
        db.session.commit()

        # Attacker crafts spoofed payload trying to award themselves full marks and claim fake time
        spoofed_payload = {
            "attempt_id": att_id,
            "score": 100.0,
            "points": 100.0,
            "is_passed": True,
            "time_spent": 1,
            "submitted_at": "1999-01-01T00:00:00Z",
            "answers": [{"question_id": str(q_item.question_id), "option_id": str(opt_wrong.option_id)}]
        }
        sub_res = self.client.post(f"/api/v1/quizzes/{q_sec.quiz_id}/submit", headers=self.std1_headers, json=spoofed_payload)
        self.assertEqual(sub_res.status_code, 200)
        data = sub_res.get_json()

        # Backend must evaluate accurately: student chose wrong answer -> score is 0.0
        self.assertEqual(data["score"], 0.0, "Backend must ignore spoofed score")
        self.assertFalse(data["is_passed"], "Backend must ignore spoofed is_passed")
        self.assertGreaterEqual(data["time_spent"], 115, "Backend must calculate time_spent from server clock")

    def test_07_expired_attempt_cannot_be_resubmitted(self):
        """Security: An attempt already marked expired cannot be submitted again."""
        q_resub = Quiz(course_id=self.room.classroom_id, title="Resubmit Expired Quiz")
        db.session.add(q_resub)
        db.session.flush()
        db.session.add(QuizCondition(quiz_id=q_resub.quiz_id, time_limit_minutes=1, max_attempts=2))
        q_item = Question(question_text="Q?", question_type="multiple_choice", points=5.0)
        db.session.add(q_item)
        db.session.flush()
        db.session.add(QuizQuestion(quiz_id=q_resub.quiz_id, question_id=q_item.question_id, order_no=1))
        opt_item = QuestionOption(question_id=q_item.question_id, option_text="Opt", is_correct=True, order_no=1)
        db.session.add(opt_item)
        db.session.commit()

        start_res = self.client.post(f"/api/v1/quizzes/{q_resub.quiz_id}/attempts", headers=self.std1_headers)
        att_id = start_res.get_json()["attempt"]["attempt_id"]

        att = db.session.get(QuizAttempt, uuid.UUID(att_id))
        att.started_at = datetime.now(timezone.utc) - timedelta(minutes=5)
        db.session.commit()

        payload = {
            "attempt_id": att_id,
            "answers": [{"question_id": str(q_item.question_id), "option_id": str(opt_item.option_id)}]
        }
        # First submit exceeds deadline -> rejected and marked expired
        res1 = self.client.post(f"/api/v1/quizzes/{q_resub.quiz_id}/submit", headers=self.std1_headers, json=payload)
        self.assertEqual(res1.status_code, 400)

        # Second submit on the expired attempt -> rejected
        res2 = self.client.post(f"/api/v1/quizzes/{q_resub.quiz_id}/submit", headers=self.std1_headers, json=payload)
        self.assertEqual(res2.status_code, 400)
        self.assertIn("expired", res2.get_json()["message"].lower())

    def test_08_duplicate_submission_guard_409(self):
        """API Contract: Duplicate submission on a completed attempt returns 409 Conflict."""
        q_dup = Quiz(course_id=self.room.classroom_id, title="Duplicate Submit Quiz")
        db.session.add(q_dup)
        db.session.flush()
        db.session.add(QuizCondition(quiz_id=q_dup.quiz_id, time_limit_minutes=10, max_attempts=2))
        q_item = Question(question_text="Q?", question_type="multiple_choice", points=5.0)
        db.session.add(q_item)
        db.session.flush()
        db.session.add(QuizQuestion(quiz_id=q_dup.quiz_id, question_id=q_item.question_id, order_no=1))
        opt_item = QuestionOption(question_id=q_item.question_id, option_text="Opt", is_correct=True, order_no=1)
        db.session.add(opt_item)
        db.session.commit()

        start_res = self.client.post(f"/api/v1/quizzes/{q_dup.quiz_id}/attempts", headers=self.std1_headers)
        att_id = start_res.get_json()["attempt"]["attempt_id"]

        payload = {
            "attempt_id": att_id,
            "answers": [{"question_id": str(q_item.question_id), "option_id": str(opt_item.option_id)}]
        }
        # First submit succeeds
        res1 = self.client.post(f"/api/v1/quizzes/{q_dup.quiz_id}/submit", headers=self.std1_headers, json=payload)
        self.assertEqual(res1.status_code, 200)

        # Second submit returns 409 Conflict
        res2 = self.client.post(f"/api/v1/quizzes/{q_dup.quiz_id}/submit", headers=self.std1_headers, json=payload)
        self.assertEqual(res2.status_code, 409)
        self.assertIn("already been submitted", res2.get_json()["message"])

    def test_09_expired_attempt_counts_towards_max_attempts(self):
        """Business Rule: An expired attempt counts towards max_attempts, blocking infinite retries."""
        q_limit = Quiz(course_id=self.room.classroom_id, title="Max Attempts With Expiry")
        db.session.add(q_limit)
        db.session.flush()
        db.session.add(QuizCondition(quiz_id=q_limit.quiz_id, time_limit_minutes=2, max_attempts=2))
        q_item = Question(question_text="Q?", question_type="multiple_choice", points=5.0)
        db.session.add(q_item)
        db.session.flush()
        db.session.add(QuizQuestion(quiz_id=q_limit.quiz_id, question_id=q_item.question_id, order_no=1))
        opt_item = QuestionOption(question_id=q_item.question_id, option_text="Opt", is_correct=True, order_no=1)
        db.session.add(opt_item)
        db.session.commit()

        # Attempt 1: Start and let expire
        start_res1 = self.client.post(f"/api/v1/quizzes/{q_limit.quiz_id}/attempts", headers=self.std1_headers)
        att1_id = start_res1.get_json()["attempt"]["attempt_id"]
        att1 = db.session.get(QuizAttempt, uuid.UUID(att1_id))
        att1.started_at = datetime.now(timezone.utc) - timedelta(minutes=10)
        db.session.commit()

        payload = {
            "attempt_id": att1_id,
            "answers": [{"question_id": str(q_item.question_id), "option_id": str(opt_item.option_id)}]
        }
        res_exp = self.client.post(f"/api/v1/quizzes/{q_limit.quiz_id}/submit", headers=self.std1_headers, json=payload)
        self.assertEqual(res_exp.status_code, 400)

        # Attempt 2: Start and submit on time
        start_res2 = self.client.post(f"/api/v1/quizzes/{q_limit.quiz_id}/attempts", headers=self.std1_headers)
        self.assertEqual(start_res2.status_code, 201)
        att2_id = start_res2.get_json()["attempt"]["attempt_id"]

        payload2 = {
            "attempt_id": att2_id,
            "answers": [{"question_id": str(q_item.question_id), "option_id": str(opt_item.option_id)}]
        }
        res_ok = self.client.post(f"/api/v1/quizzes/{q_limit.quiz_id}/submit", headers=self.std1_headers, json=payload2)
        self.assertEqual(res_ok.status_code, 200)

        # Attempt 3: Blocked by max_attempts = 2
        start_res3 = self.client.post(f"/api/v1/quizzes/{q_limit.quiz_id}/attempts", headers=self.std1_headers)
        self.assertEqual(start_res3.status_code, 400)
        self.assertIn("Maximum attempts reached", start_res3.get_json()["message"])

        submit_res3 = self.client.post(f"/api/v1/quizzes/{q_limit.quiz_id}/submit", headers=self.std1_headers, json={"answers": []})
        self.assertEqual(submit_res3.status_code, 400)
        self.assertIn("Missing attempt_id", submit_res3.get_json()["message"])

    def test_10_start_attempt_auto_expires_stale_in_progress_attempt(self):
        """Resilience: start_attempt detects and closes stale in_progress attempts exceeding time limit."""
        q_stale = Quiz(course_id=self.room.classroom_id, title="Stale In-Progress Quiz")
        db.session.add(q_stale)
        db.session.flush()
        db.session.add(QuizCondition(quiz_id=q_stale.quiz_id, time_limit_minutes=5, max_attempts=2))
        q_item = Question(question_text="Q?", question_type="multiple_choice", points=5.0)
        db.session.add(q_item)
        db.session.flush()
        db.session.add(QuizQuestion(quiz_id=q_stale.quiz_id, question_id=q_item.question_id, order_no=1))
        opt_item = QuestionOption(question_id=q_item.question_id, option_text="Opt", is_correct=True, order_no=1)
        db.session.add(opt_item)
        db.session.commit()

        # Start attempt 1
        res1 = self.client.post(f"/api/v1/quizzes/{q_stale.quiz_id}/attempts", headers=self.std2_headers)
        self.assertEqual(res1.status_code, 201)
        att1_id = res1.get_json()["attempt"]["attempt_id"]

        # Student abandoned session: simulate time travel 3 hours ago
        att1 = db.session.get(QuizAttempt, uuid.UUID(att1_id))
        att1.started_at = datetime.now(timezone.utc) - timedelta(hours=3)
        db.session.commit()

        # Student comes back and starts attempt again: backend auto-expires attempt 1 and creates attempt 2
        res2 = self.client.post(f"/api/v1/quizzes/{q_stale.quiz_id}/attempts", headers=self.std2_headers)
        self.assertEqual(res2.status_code, 201)
        att2_id = res2.get_json()["attempt"]["attempt_id"]
        self.assertNotEqual(att1_id, att2_id)

        # Verify attempt 1 was marked expired
        db.session.refresh(att1)
        self.assertEqual(att1.status, "expired")

    def test_11_expired_attempt_denies_answer_review(self):
        """Security: Expired attempt cannot access answer review endpoint."""
        q_rev = Quiz(course_id=self.room.classroom_id, title="Review Lockout Quiz")
        db.session.add(q_rev)
        db.session.flush()
        db.session.add(QuizCondition(quiz_id=q_rev.quiz_id, time_limit_minutes=2, max_attempts=2))
        q_item = Question(question_text="Secret Question", question_type="multiple_choice", points=5.0, explanation="Secret Explanation")
        db.session.add(q_item)
        db.session.flush()
        db.session.add(QuizQuestion(quiz_id=q_rev.quiz_id, question_id=q_item.question_id, order_no=1))
        opt_item = QuestionOption(question_id=q_item.question_id, option_text="Secret Answer", is_correct=True, order_no=1)
        db.session.add(opt_item)
        db.session.commit()

        start_res = self.client.post(f"/api/v1/quizzes/{q_rev.quiz_id}/attempts", headers=self.std2_headers)
        att_id = start_res.get_json()["attempt"]["attempt_id"]

        att = db.session.get(QuizAttempt, uuid.UUID(att_id))
        att.started_at = datetime.now(timezone.utc) - timedelta(minutes=10)
        db.session.commit()

        # Submit past time limit
        sub_res = self.client.post(f"/api/v1/quizzes/{q_rev.quiz_id}/submit", headers=self.std2_headers, json={"attempt_id": att_id, "answers": []})
        self.assertEqual(sub_res.status_code, 400)

        # Try to view answer review for expired attempt
        rev_res = self.client.get(f"/api/v1/quizzes/{q_rev.quiz_id}/answer-review?attempt_id={att_id}", headers=self.std2_headers)
        self.assertEqual(rev_res.status_code, 400)
        self.assertIn("Answer review is only available after submitting the quiz", rev_res.get_json()["message"])


if __name__ == "__main__":
    unittest.main()


