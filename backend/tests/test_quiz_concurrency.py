"""
test_quiz_concurrency.py
Phase 5B: Comprehensive Concurrency & Race Condition Verification Suite.

Validates that all concurrency race windows identified in Phase 5B Audit are eliminated:
- Test 01: Concurrent Start at max_attempts - 1 (never exceeds max_attempts)
- Test 02: Concurrent Start Empty (10 concurrent requests yield exactly 1 in_progress attempt)
- Test 03: Concurrent Submit (2 threads: exactly one 200, one 409, zero 500)
- Test 04: Three Concurrent Submit (3 threads: exactly one 200, two 409, zero 500)
- Test 05: Completed Attempt Submit (5 concurrent requests: all 409 Conflict)
- Test 06: Expired Attempt Submit (5 concurrent requests: all 400, no QuizResult created)
- Test 07: Max Attempts = 1 (10 concurrent starts: exactly one attempt created)
- Test 08: Missing attempt_id (returns 400, zero implicit attempts created)

Database: PostgreSQL (enforces pg_advisory_xact_lock and SELECT FOR UPDATE)
"""
import os
import uuid
import json
import threading
import unittest
from datetime import datetime, timezone, timedelta
import concurrent.futures
from unittest.mock import patch
from sqlalchemy.exc import IntegrityError

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
from app.config import TestingPostgresConfig, verify_test_database_safety


class TestQuizConcurrencySuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        db_name = verify_test_database_safety(TestingPostgresConfig.SQLALCHEMY_DATABASE_URI)
        assert db_name == "elearning_test_db", f"Expected elearning_test_db, got {db_name}"
        cls.app = create_app(TestingPostgresConfig)
        cls.ctx = cls.app.app_context()
        cls.ctx.push()
        cls.client = cls.app.test_client()

        # Ensure database tables exist in test db
        db.create_all()

        # Ensure student & instructor roles exist
        cls.student_role = Role.query.filter_by(role_name="student").first()
        if not cls.student_role:
            cls.student_role = Role(role_name="student", description="Student")
            db.session.add(cls.student_role)

        cls.instructor_role = Role.query.filter_by(role_name="instructor").first()
        if not cls.instructor_role:
            cls.instructor_role = Role(role_name="instructor", description="Instructor")
            db.session.add(cls.instructor_role)
        db.session.commit()

        # Create instructor user
        cls.instructor = User.query.filter_by(email="conc_instructor@test.com").first()
        if not cls.instructor:
            cls.instructor = User(
                email="conc_instructor@test.com",
                status="active"
            )
            cls.instructor.set_password("SecurePass123!")
            cls.instructor.roles = [cls.instructor_role]
            db.session.add(cls.instructor)
            db.session.commit()

        # Create student user
        cls.student = User.query.filter_by(email="conc_student@test.com").first()
        if not cls.student:
            cls.student = User(
                email="conc_student@test.com",
                status="active"
            )
            cls.student.set_password("SecurePass123!")
            cls.student.roles = [cls.student_role]
            db.session.add(cls.student)
            db.session.commit()

        cls.student_token = create_access_token(
            identity=str(cls.student.user_id),
            additional_claims={"roles": ["student"], "role": "student"}
        )
        cls.student_headers = {
            "Authorization": f"Bearer {cls.student_token}",
            "Content-Type": "application/json"
        }

        # Create course and enroll student
        cls.course = Classroom.query.filter_by(title="Concurrency Hardening Course").first()
        if not cls.course:
            cls.course = Classroom(
                instructor_id=cls.instructor.user_id,
                title="Concurrency Hardening Course",
                description="Testing concurrent attempt handling",
                status="active"
            )
            db.session.add(cls.course)
            db.session.commit()

        membership = ClassroomMember.query.filter_by(
            classroom_id=cls.course.classroom_id,
            user_id=cls.student.user_id
        ).first()
        if not membership:
            membership = ClassroomMember(
                classroom_id=cls.course.classroom_id,
                user_id=cls.student.user_id,
                status="enrolled"
            )
            db.session.add(membership)
            db.session.commit()

    @classmethod
    def tearDownClass(cls):
        cls.ctx.pop()

    def _create_test_quiz(self, max_attempts=2, time_limit_minutes=30):
        """Helper to create an isolated quiz with condition and questions"""
        quiz = Quiz(
            course_id=self.course.classroom_id,
            title=f"Concurrency Test Quiz {uuid.uuid4().hex[:8]}",
            description="Concurrency test quiz"
        )
        db.session.add(quiz)
        db.session.flush()

        condition = QuizCondition(
            quiz_id=quiz.quiz_id,
            max_attempts=max_attempts,
            time_limit_minutes=time_limit_minutes,
            passing_score=50.0
        )
        db.session.add(condition)

        # Question 1: Multiple Choice
        q1 = Question(
            question_text="What is 2 + 2?",
            question_type="multiple_choice",
            points=10.0
        )
        db.session.add(q1)
        db.session.flush()

        opt1 = QuestionOption(question_id=q1.question_id, option_text="4", is_correct=True, order_no=1)
        opt2 = QuestionOption(question_id=q1.question_id, option_text="5", is_correct=False, order_no=2)
        db.session.add_all([opt1, opt2])

        qq1 = QuizQuestion(quiz_id=quiz.quiz_id, question_id=q1.question_id, order_no=1)
        db.session.add(qq1)
        db.session.commit()

        return quiz, q1, opt1, opt2

    # =================================================================
    # Test 01: Concurrent Start at max_attempts - 1
    # =================================================================
    def test_01_concurrent_start_at_max_minus_one(self):
        """
        Test 01: Concurrent Start
        max_attempts = 2, completed = 1
        5 concurrent requests to start attempt.
        Expected: exactly 1 new attempt created, remaining requests rejected/resumed,
        never > 2 total counted attempts.
        """
        quiz, _, _, _ = self._create_test_quiz(max_attempts=2)
        quiz_id_str = str(quiz.quiz_id)

        # 1 existing completed attempt
        prior_attempt = QuizAttempt(
            quiz_id=quiz.quiz_id,
            user_id=self.student.user_id,
            started_at=datetime.now(timezone.utc) - timedelta(minutes=10),
            submitted_at=datetime.now(timezone.utc) - timedelta(minutes=5),
            status="completed"
        )
        db.session.add(prior_attempt)
        db.session.commit()

        # 5 concurrent start requests
        num_threads = 5
        barrier = threading.Barrier(num_threads)
        results = []

        def worker():
            barrier.wait()
            with self.app.app_context():
                res = self.client.post(
                    f"/api/v1/quizzes/{quiz_id_str}/attempts",
                    headers=self.student_headers
                )
                return res.status_code, res.get_json()

        with concurrent.futures.ThreadPoolExecutor(max_workers=num_threads) as executor:
            futures = [executor.submit(worker) for _ in range(num_threads)]
            for f in concurrent.futures.as_completed(futures):
                results.append(f.result())

        status_codes = [r[0] for r in results]

        # Verify database attempt counts
        total_attempts = QuizAttempt.query.filter_by(
            quiz_id=quiz.quiz_id,
            user_id=self.student.user_id
        ).count()

        # Must never exceed max_attempts (2)
        self.assertLessEqual(total_attempts, 2, f"Total attempts {total_attempts} exceeded max_attempts 2!")
        self.assertEqual(total_attempts, 2, "Expected exactly 2 attempts total (1 prior + 1 new)")

        # Verify active attempts count is at most 1
        active_attempts = QuizAttempt.query.filter_by(
            quiz_id=quiz.quiz_id,
            user_id=self.student.user_id,
            status="in_progress"
        ).count()
        self.assertEqual(active_attempts, 1, "Expected exactly 1 in_progress attempt")

        # Status codes should be 201 (Created) and/or 200 (Resumed active attempt)
        for code in status_codes:
            self.assertIn(code, [200, 201, 400], f"Unexpected status code {code}")

    # =================================================================
    # Test 02: Concurrent Start Empty (10 threads)
    # =================================================================
    def test_02_concurrent_start_empty(self):
        """
        Test 02: Concurrent Start Empty
        10 concurrent start requests with no existing attempt.
        Expected: exactly one in_progress attempt created, all successful responses
        return the same attempt_id.
        """
        quiz, _, _, _ = self._create_test_quiz(max_attempts=3)
        quiz_id_str = str(quiz.quiz_id)

        num_threads = 10
        barrier = threading.Barrier(num_threads)
        results = []

        def worker():
            barrier.wait()
            with self.app.app_context():
                res = self.client.post(
                    f"/api/v1/quizzes/{quiz_id_str}/attempts",
                    headers=self.student_headers
                )
                return res.status_code, res.get_json()

        with concurrent.futures.ThreadPoolExecutor(max_workers=num_threads) as executor:
            futures = [executor.submit(worker) for _ in range(num_threads)]
            for f in concurrent.futures.as_completed(futures):
                results.append(f.result())

        status_codes = [r[0] for r in results]

        # Exactly 1 in_progress attempt in DB
        in_progress_count = QuizAttempt.query.filter_by(
            quiz_id=quiz.quiz_id,
            user_id=self.student.user_id,
            status="in_progress"
        ).count()
        self.assertEqual(in_progress_count, 1, f"Expected exactly 1 in_progress attempt, got {in_progress_count}")

        # Total attempts must be 1
        total_attempts = QuizAttempt.query.filter_by(
            quiz_id=quiz.quiz_id,
            user_id=self.student.user_id
        ).count()
        self.assertEqual(total_attempts, 1, f"Expected total attempts = 1, got {total_attempts}")

        # All 200/201 responses must return the same attempt_id
        attempt_ids = set()
        for code, body in results:
            self.assertIn(code, [200, 201])
            att_id = body.get("attempt", {}).get("attempt_id")
            if att_id:
                attempt_ids.add(att_id)

        self.assertEqual(len(attempt_ids), 1, f"Expected all threads to share 1 attempt_id, got: {attempt_ids}")

    # =================================================================
    # Test 03: Concurrent Submit (2 threads)
    # =================================================================
    def test_03_concurrent_submit_two_threads(self):
        """
        Test 03: Concurrent Submit (2 requests on same attempt)
        Expected:
        Request 1 -> 200 OK
        Request 2 -> 409 Conflict
        Zero 500 errors!
        """
        quiz, q1, opt1, _ = self._create_test_quiz(max_attempts=2)
        quiz_id_str = str(quiz.quiz_id)

        # Create active attempt
        attempt = QuizAttempt(
            quiz_id=quiz.quiz_id,
            user_id=self.student.user_id,
            started_at=datetime.now(timezone.utc),
            status="in_progress"
        )
        db.session.add(attempt)
        db.session.commit()

        attempt_id_str = str(attempt.attempt_id)
        payload = {
            "attempt_id": attempt_id_str,
            "answers": [
                {"question_id": str(q1.question_id), "option_id": str(opt1.option_id)}
            ]
        }

        num_threads = 2
        barrier = threading.Barrier(num_threads)
        results = []

        def worker():
            barrier.wait()
            with self.app.app_context():
                res = self.client.post(
                    f"/api/v1/quizzes/{quiz_id_str}/submit",
                    headers=self.student_headers,
                    json=payload
                )
                return res.status_code, res.get_json()

        with concurrent.futures.ThreadPoolExecutor(max_workers=num_threads) as executor:
            futures = [executor.submit(worker) for _ in range(num_threads)]
            for f in concurrent.futures.as_completed(futures):
                results.append(f.result())

        status_codes = sorted([r[0] for r in results])
        self.assertEqual(status_codes, [200, 409], f"Expected [200, 409], got: {status_codes}")

        # Database verification: exactly 1 QuizResult
        results_in_db = QuizResult.query.filter_by(attempt_id=attempt.attempt_id).all()
        self.assertEqual(len(results_in_db), 1, "Expected exactly 1 QuizResult in database")

        # Attempt status must be completed
        db.session.expire_all()
        updated_attempt = db.session.get(QuizAttempt, attempt.attempt_id)
        self.assertEqual(updated_attempt.status, "completed")

    # =================================================================
    # Test 04: Three Concurrent Submit
    # =================================================================
    def test_04_three_concurrent_submit(self):
        """
        Test 04: Three Concurrent Submit
        Expected:
        One 200 OK
        Two 409 Conflict
        Zero 500 errors
        """
        quiz, q1, opt1, _ = self._create_test_quiz(max_attempts=2)
        quiz_id_str = str(quiz.quiz_id)

        attempt = QuizAttempt(
            quiz_id=quiz.quiz_id,
            user_id=self.student.user_id,
            started_at=datetime.now(timezone.utc),
            status="in_progress"
        )
        db.session.add(attempt)
        db.session.commit()

        attempt_id_str = str(attempt.attempt_id)
        payload = {
            "attempt_id": attempt_id_str,
            "answers": [
                {"question_id": str(q1.question_id), "option_id": str(opt1.option_id)}
            ]
        }

        num_threads = 3
        barrier = threading.Barrier(num_threads)
        results = []

        def worker():
            barrier.wait()
            with self.app.app_context():
                res = self.client.post(
                    f"/api/v1/quizzes/{quiz_id_str}/submit",
                    headers=self.student_headers,
                    json=payload
                )
                return res.status_code, res.get_json()

        with concurrent.futures.ThreadPoolExecutor(max_workers=num_threads) as executor:
            futures = [executor.submit(worker) for _ in range(num_threads)]
            for f in concurrent.futures.as_completed(futures):
                results.append(f.result())

        status_codes = sorted([r[0] for r in results])
        self.assertEqual(status_codes, [200, 409, 409], f"Expected [200, 409, 409], got: {status_codes}")

        # Database verification: exactly 1 QuizResult
        results_in_db = QuizResult.query.filter_by(attempt_id=attempt.attempt_id).all()
        self.assertEqual(len(results_in_db), 1)

    # =================================================================
    # Test 05: Completed Attempt Submit (5 threads)
    # =================================================================
    def test_05_completed_attempt_concurrent_submit(self):
        """
        Test 05: Completed Attempt
        5 concurrent submits on an already-completed attempt.
        Expected: all 409 Conflict.
        """
        quiz, q1, opt1, _ = self._create_test_quiz()
        quiz_id_str = str(quiz.quiz_id)

        attempt = QuizAttempt(
            quiz_id=quiz.quiz_id,
            user_id=self.student.user_id,
            started_at=datetime.now(timezone.utc) - timedelta(minutes=10),
            submitted_at=datetime.now(timezone.utc) - timedelta(minutes=5),
            status="completed"
        )
        db.session.add(attempt)
        db.session.commit()

        attempt_id_str = str(attempt.attempt_id)
        payload = {
            "attempt_id": attempt_id_str,
            "answers": [
                {"question_id": str(q1.question_id), "option_id": str(opt1.option_id)}
            ]
        }

        num_threads = 5
        barrier = threading.Barrier(num_threads)
        results = []

        def worker():
            barrier.wait()
            with self.app.app_context():
                res = self.client.post(
                    f"/api/v1/quizzes/{quiz_id_str}/submit",
                    headers=self.student_headers,
                    json=payload
                )
                return res.status_code, res.get_json()

        with concurrent.futures.ThreadPoolExecutor(max_workers=num_threads) as executor:
            futures = [executor.submit(worker) for _ in range(num_threads)]
            for f in concurrent.futures.as_completed(futures):
                results.append(f.result())

        status_codes = [r[0] for r in results]
        self.assertEqual(status_codes, [409] * num_threads, f"Expected all 409, got: {status_codes}")

        for _, body in results:
            self.assertIn("already been submitted", body.get("message", ""))

    # =================================================================
    # Test 06: Expired Attempt Submit (5 threads)
    # =================================================================
    def test_06_expired_attempt_concurrent_submit(self):
        """
        Test 06: Expired Attempt
        5 concurrent submits on an expired attempt.
        Expected:
        all 400 Bad Request.
        No QuizResult, no new score, no new answers saved.
        """
        quiz, q1, opt1, _ = self._create_test_quiz(time_limit_minutes=10)
        quiz_id_str = str(quiz.quiz_id)

        # Attempt that has been marked expired
        attempt = QuizAttempt(
            quiz_id=quiz.quiz_id,
            user_id=self.student.user_id,
            started_at=datetime.now(timezone.utc) - timedelta(minutes=25),
            submitted_at=datetime.now(timezone.utc) - timedelta(minutes=10),
            status="expired"
        )
        db.session.add(attempt)
        db.session.commit()

        attempt_id_str = str(attempt.attempt_id)
        payload = {
            "attempt_id": attempt_id_str,
            "answers": [
                {"question_id": str(q1.question_id), "option_id": str(opt1.option_id)}
            ]
        }

        num_threads = 5
        barrier = threading.Barrier(num_threads)
        results = []

        def worker():
            barrier.wait()
            with self.app.app_context():
                res = self.client.post(
                    f"/api/v1/quizzes/{quiz_id_str}/submit",
                    headers=self.student_headers,
                    json=payload
                )
                return res.status_code, res.get_json()

        with concurrent.futures.ThreadPoolExecutor(max_workers=num_threads) as executor:
            futures = [executor.submit(worker) for _ in range(num_threads)]
            for f in concurrent.futures.as_completed(futures):
                results.append(f.result())

        status_codes = [r[0] for r in results]
        self.assertEqual(status_codes, [400] * num_threads, f"Expected all 400, got: {status_codes}")

        # Verification: No QuizResult created
        results_in_db = QuizResult.query.filter_by(attempt_id=attempt.attempt_id).all()
        self.assertEqual(len(results_in_db), 0, "No QuizResult should be created for expired attempt")

        # Verification: No QuizAnswer created
        answers_in_db = QuizAnswer.query.filter_by(attempt_id=attempt.attempt_id).all()
        self.assertEqual(len(answers_in_db), 0, "No QuizAnswer should be saved for expired attempt")

    # =================================================================
    # Test 07: Max Attempts = 1 (10 threads)
    # =================================================================
    def test_07_max_attempts_one_concurrent_starts(self):
        """
        Test 07: Max Attempts = 1
        10 concurrent start requests with max_attempts = 1.
        Expected: exactly one attempt created in database.
        """
        quiz, _, _, _ = self._create_test_quiz(max_attempts=1)
        quiz_id_str = str(quiz.quiz_id)

        num_threads = 10
        barrier = threading.Barrier(num_threads)
        results = []

        def worker():
            barrier.wait()
            with self.app.app_context():
                res = self.client.post(
                    f"/api/v1/quizzes/{quiz_id_str}/attempts",
                    headers=self.student_headers
                )
                return res.status_code, res.get_json()

        with concurrent.futures.ThreadPoolExecutor(max_workers=num_threads) as executor:
            futures = [executor.submit(worker) for _ in range(num_threads)]
            for f in concurrent.futures.as_completed(futures):
                results.append(f.result())

        # Verify DB: exactly 1 attempt exists for this user and quiz
        total_attempts = QuizAttempt.query.filter_by(
            quiz_id=quiz.quiz_id,
            user_id=self.student.user_id
        ).count()
        self.assertEqual(total_attempts, 1, f"Expected exactly 1 attempt in DB, got {total_attempts}")

    # =================================================================
    # Test 08: Missing attempt_id on Submit
    # =================================================================
    def test_08_missing_attempt_id_rejected(self):
        """
        Test 08: Missing attempt_id
        Expected: 400 Bad Request and NO implicit attempt creation.
        """
        quiz, q1, opt1, _ = self._create_test_quiz()
        quiz_id_str = str(quiz.quiz_id)

        initial_attempt_count = QuizAttempt.query.filter_by(
            quiz_id=quiz.quiz_id,
            user_id=self.student.user_id
        ).count()

        # Submit without attempt_id
        payload = {
            "answers": [
                {"question_id": str(q1.question_id), "option_id": str(opt1.option_id)}
            ]
        }

        res = self.client.post(
            f"/api/v1/quizzes/{quiz_id_str}/submit",
            headers=self.student_headers,
            json=payload
        )

        self.assertEqual(res.status_code, 400)
        body = res.get_json()
        self.assertIn("Missing attempt_id", body.get("message", ""))

        # Verify NO new attempt was created in database
        final_attempt_count = QuizAttempt.query.filter_by(
            quiz_id=quiz.quiz_id,
            user_id=self.student.user_id
        ).count()
        self.assertEqual(final_attempt_count, initial_attempt_count, "No implicit attempt should be created!")

    # =================================================================
    # Test 09: Database Constraint Enforcement on QuizAnswer (SEC-5C-03)
    # =================================================================
    def test_09_quiz_answer_unique_constraint(self):
        """
        Test 09: DB Unique Constraint uq_quiz_answers_attempt_question
        Enforces UNIQUE(attempt_id, question_id).
        - Same attempt_id + same question_id -> second insert rejected (IntegrityError).
        - Same attempt_id + different question_id -> allowed.
        - Different attempt_id + same question_id -> allowed.
        """
        quiz, q1, opt1, opt2 = self._create_test_quiz()

        # Create second question on same quiz
        q2 = Question(
            question_text="What is 3 + 3?",
            question_type="multiple_choice",
            points=10.0
        )
        db.session.add(q2)
        db.session.flush()
        opt2_1 = QuestionOption(question_id=q2.question_id, option_text="6", is_correct=True, order_no=1)
        db.session.add(opt2_1)
        qq2 = QuizQuestion(quiz_id=quiz.quiz_id, question_id=q2.question_id, order_no=2)
        db.session.add(qq2)

        # Create two distinct attempts
        attempt1 = QuizAttempt(
            quiz_id=quiz.quiz_id,
            user_id=self.student.user_id,
            started_at=datetime.now(timezone.utc),
            status="in_progress"
        )
        attempt2 = QuizAttempt(
            quiz_id=quiz.quiz_id,
            user_id=self.student.user_id,
            started_at=datetime.now(timezone.utc),
            status="in_progress"
        )
        db.session.add_all([attempt1, attempt2])
        db.session.commit()

        # 1. First insert for attempt1, q1 -> must succeed
        ans1 = QuizAnswer(
            attempt_id=attempt1.attempt_id,
            question_id=q1.question_id,
            option_id=opt1.option_id,
            is_correct=True
        )
        db.session.add(ans1)
        db.session.commit()

        # 2. Duplicate insert for same (attempt1, q1) -> must fail with IntegrityError
        ans1_dup = QuizAnswer(
            attempt_id=attempt1.attempt_id,
            question_id=q1.question_id,
            option_id=opt2.option_id,
            is_correct=False
        )
        db.session.add(ans1_dup)
        with self.assertRaises(IntegrityError):
            db.session.commit()
        db.session.rollback()

        # 3. Same attempt, different question (attempt1, q2) -> must succeed
        ans2 = QuizAnswer(
            attempt_id=attempt1.attempt_id,
            question_id=q2.question_id,
            option_id=opt2_1.option_id,
            is_correct=True
        )
        db.session.add(ans2)
        db.session.commit()

        # 4. Different attempt, same question (attempt2, q1) -> must succeed
        ans3 = QuizAnswer(
            attempt_id=attempt2.attempt_id,
            question_id=q1.question_id,
            option_id=opt1.option_id,
            is_correct=True
        )
        db.session.add(ans3)
        db.session.commit()

        # Verify record counts in DB
        self.assertEqual(
            QuizAnswer.query.filter_by(attempt_id=attempt1.attempt_id).count(),
            2
        )
        self.assertEqual(
            QuizAnswer.query.filter_by(attempt_id=attempt2.attempt_id).count(),
            1
        )

    # =================================================================
    # Test 10: Secondary Side Effect Failure Logging (SEC-5C-02)
    # =================================================================
    def test_10_secondary_side_effects_logging_on_failure(self):
        """
        Test 10: Secondary Side Effect Failure Handled with Logging
        When a secondary side effect (e.g. LearningActivity) raises an exception,
        it must be logged as a warning, and the primary transaction must succeed
        with 200 OK and valid score calculation without 500 error.
        """
        quiz, q1, opt1, _ = self._create_test_quiz()
        quiz_id_str = str(quiz.quiz_id)

        # Create active attempt directly in DB
        attempt = QuizAttempt(
            quiz_id=quiz.quiz_id,
            user_id=self.student.user_id,
            started_at=datetime.now(timezone.utc),
            status="in_progress"
        )
        db.session.add(attempt)
        db.session.commit()
        attempt_id = str(attempt.attempt_id)

        payload = {
            "attempt_id": attempt_id,
            "answers": [
                {"question_id": str(q1.question_id), "option_id": str(opt1.option_id)}
            ]
        }

        # Patch LearningActivity in app.models.progress to raise an exception
        with patch("app.models.progress.LearningActivity", side_effect=RuntimeError("Simulated activity logging failure")):
            with patch.object(self.app.logger, "warning") as mock_logger_warning:
                res = self.client.post(
                    f"/api/v1/quizzes/{quiz_id_str}/submit",
                    headers=self.student_headers,
                    json=payload
                )

                # Primary transaction must succeed
                self.assertEqual(res.status_code, 200)
                body = res.get_json()
                self.assertTrue(body["is_passed"])
                self.assertEqual(body["score"], 10.0)

                # Logger must have recorded the warning
                mock_logger_warning.assert_called()
                warning_logged = any(
                    "Quiz secondary side effect" in str(call_arg)
                    for call_arg in mock_logger_warning.call_args_list
                )
                self.assertTrue(warning_logged, "Expected warning log for secondary side effect failure")

        # Verify attempt in DB is completed and result exists
        att = QuizAttempt.query.filter_by(attempt_id=uuid.UUID(attempt_id)).first()
        self.assertEqual(att.status, "completed")
        res_record = QuizResult.query.filter_by(attempt_id=uuid.UUID(attempt_id)).first()
        self.assertIsNotNone(res_record)
        self.assertEqual(float(res_record.score), 10.0)


if __name__ == "__main__":
    unittest.main()
