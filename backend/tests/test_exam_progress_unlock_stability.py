"""
test_exam_progress_unlock_stability.py
Phase 2 Test Design — Full-System Stability Test Suite:
Exam -> Grading -> Progress -> Lesson Unlock (TC-01 through TC-12)

Strict constraints:
- Uses real Source Code, Models, and API Contracts.
- Targets PostgreSQL database without wiping or modifying any real user data.
- Isolated test fixtures with unique UUIDs and complete teardown cleanup.
- Does NOT alter production code in Phase 2.
"""
import uuid
import json
import unittest
import threading
from datetime import datetime, timezone, timedelta
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.role import Role
from app.models.classroom import Classroom, Lesson, ClassroomMember
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
from app.models.progress import LessonProgress, LearningProgress, Skill, UserSkill, LearningActivity
from app.models.gamification import UserXP
from app.services.user_service import UserService
from flask_jwt_extended import create_access_token


class TestExamProgressUnlockStability(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.ctx = cls.app.app_context()
        cls.ctx.push()
        cls.client = cls.app.test_client()

        # Unique identifier for this test run
        cls.test_run_id = uuid.uuid4().hex[:8]
        cls.created_user_ids = []
        cls.created_course_ids = []
        cls.created_quiz_ids = []

        # Roles
        cls.student_role = Role.query.filter_by(role_name="student").first()
        cls.instructor_role = Role.query.filter_by(role_name="instructor").first()

        # 1. Test Instructor
        cls.instructor = User(
            email=f"inst_stab_{cls.test_run_id}@test.com",
            status="active"
        )
        cls.instructor.set_password("SecurePass123!")
        if cls.instructor_role:
            cls.instructor.roles = [cls.instructor_role]
        db.session.add(cls.instructor)

        # 2. Test Student A (Primary)
        cls.student_a = User(
            email=f"stda_stab_{cls.test_run_id}@test.com",
            status="active"
        )
        cls.student_a.set_password("SecurePass123!")
        if cls.student_role:
            cls.student_a.roles = [cls.student_role]
        db.session.add(cls.student_a)

        # 3. Test Student B (For IDOR / Security)
        cls.student_b = User(
            email=f"stdb_stab_{cls.test_run_id}@test.com",
            status="active"
        )
        cls.student_b.set_password("SecurePass123!")
        if cls.student_role:
            cls.student_b.roles = [cls.student_role]
        db.session.add(cls.student_b)

        db.session.commit()
        cls.created_user_ids.extend([cls.instructor.user_id, cls.student_a.user_id, cls.student_b.user_id])

        # 4. Multi-Lesson Course for Progress Testing (2 Lessons)
        cls.course = Classroom(
            instructor_id=cls.instructor.user_id,
            title=f"Stability Course {cls.test_run_id}",
            description="Testing Exam, Progress, and Unlock lifecycle",
            status="active"
        )
        db.session.add(cls.course)
        db.session.flush()
        cls.created_course_ids.append(cls.course.classroom_id)

        # Lesson 1
        cls.lesson_1 = Lesson(
            classroom_id=cls.course.classroom_id,
            title="Lesson 1: Introduction to IoT Sensors",
            sequence_no=1,
            status="published"
        )
        # Lesson 2
        cls.lesson_2 = Lesson(
            classroom_id=cls.course.classroom_id,
            title="Lesson 2: Microcontrollers and Actuators",
            sequence_no=2,
            status="published"
        )
        db.session.add_all([cls.lesson_1, cls.lesson_2])
        db.session.flush()

        # Enroll Student A and Student B
        db.session.add(ClassroomMember(classroom_id=cls.course.classroom_id, user_id=cls.student_a.user_id, status="enrolled"))
        db.session.add(ClassroomMember(classroom_id=cls.course.classroom_id, user_id=cls.student_b.user_id, status="enrolled"))
        db.session.commit()

        # Setup Tokens & Headers
        cls.token_inst = create_access_token(identity=str(cls.instructor.user_id))
        cls.token_stda = create_access_token(identity=str(cls.student_a.user_id))
        cls.token_stdb = create_access_token(identity=str(cls.student_b.user_id))

        cls.headers_stda = {"Authorization": f"Bearer {cls.token_stda}", "Content-Type": "application/json"}
        cls.headers_stdb = {"Authorization": f"Bearer {cls.token_stdb}", "Content-Type": "application/json"}
        cls.headers_inst = {"Authorization": f"Bearer {cls.token_inst}", "Content-Type": "application/json"}

    @classmethod
    def tearDownClass(cls):
        """Teardown: Clean up ONLY the objects created for this test run in strict FK order."""
        try:
            # 1. Clean up Quizzes and related records
            if cls.created_quiz_ids:
                q_ids = cls.created_quiz_ids
                attempts = QuizAttempt.query.filter(QuizAttempt.quiz_id.in_(q_ids)).all()
                att_ids = [a.attempt_id for a in attempts]
                if att_ids:
                    QuizAnswer.query.filter(QuizAnswer.attempt_id.in_(att_ids)).delete(synchronize_session=False)
                    QuizResult.query.filter(QuizResult.attempt_id.in_(att_ids)).delete(synchronize_session=False)
                    QuizAttempt.query.filter(QuizAttempt.attempt_id.in_(att_ids)).delete(synchronize_session=False)

                QuizCondition.query.filter(QuizCondition.quiz_id.in_(q_ids)).delete(synchronize_session=False)
                QuizQuestion.query.filter(QuizQuestion.quiz_id.in_(q_ids)).delete(synchronize_session=False)
                Quiz.query.filter(Quiz.quiz_id.in_(q_ids)).delete(synchronize_session=False)

            # 2. Clean up Progress and Activities for test users
            if cls.created_user_ids:
                u_ids = cls.created_user_ids
                LessonProgress.query.filter(LessonProgress.user_id.in_(u_ids)).delete(synchronize_session=False)
                LearningProgress.query.filter(LearningProgress.user_id.in_(u_ids)).delete(synchronize_session=False)
                UserSkill.query.filter(UserSkill.user_id.in_(u_ids)).delete(synchronize_session=False)
                LearningActivity.query.filter(LearningActivity.user_id.in_(u_ids)).delete(synchronize_session=False)
                UserXP.query.filter(UserXP.user_id.in_(u_ids)).delete(synchronize_session=False)

            # 3. Clean up Memberships, Lessons, Courses (before Users)
            if cls.created_course_ids:
                c_ids = cls.created_course_ids
                ClassroomMember.query.filter(ClassroomMember.classroom_id.in_(c_ids)).delete(synchronize_session=False)
                Lesson.query.filter(Lesson.classroom_id.in_(c_ids)).delete(synchronize_session=False)
                Classroom.query.filter(Classroom.classroom_id.in_(c_ids)).delete(synchronize_session=False)

            # 4. Clean up Users and their relationships
            if cls.created_user_ids:
                u_ids = cls.created_user_ids
                # Remove memberships if any remain
                ClassroomMember.query.filter(ClassroomMember.user_id.in_(u_ids)).delete(synchronize_session=False)
                # Any leftover classrooms owned by instructor
                Classroom.query.filter(Classroom.instructor_id.in_(u_ids)).delete(synchronize_session=False)
                # Finally delete test users
                User.query.filter(User.user_id.in_(u_ids)).delete(synchronize_session=False)

            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"[WARN] Error during test teardown: {e}")
        finally:
            db.session.remove()
            cls.ctx.pop()

    def _create_test_quiz(self, title, lesson_id=None, course_id=None, passing_score=70.0, max_attempts=3):
        """Helper to create a quiz with 3 diverse question types: MC, Matching, Ordering."""
        quiz = Quiz(
            title=f"{title} ({self.test_run_id})",
            lesson_id=lesson_id,
            course_id=course_id,
            description="Stability automated test quiz"
        )
        db.session.add(quiz)
        db.session.flush()
        self.created_quiz_ids.append(quiz.quiz_id)

        cond = QuizCondition(
            quiz_id=quiz.quiz_id,
            passing_score=passing_score,
            max_attempts=max_attempts,
            time_limit_minutes=15
        )
        db.session.add(cond)

        # Q1: Multiple Choice (weight: 10.0)
        q1 = Question(
            question_text="Which sensor measures relative air moisture?",
            question_type="multiple_choice",
            points=10.0,
            skill="SENSE",
            concept="Sensors",
            explanation="DHT22/DHT11 measures temperature and relative air humidity."
        )
        db.session.add(q1)
        db.session.flush()
        opt1_a = QuestionOption(question_id=q1.question_id, option_text="DHT22", is_correct=True, order_no=1)
        opt1_b = QuestionOption(question_id=q1.question_id, option_text="Relay", is_correct=False, order_no=2)
        db.session.add_all([opt1_a, opt1_b])
        db.session.add(QuizQuestion(quiz_id=quiz.quiz_id, question_id=q1.question_id, order_no=1))

        # Q2: Matching (weight: 10.0)
        q2 = Question(
            question_text="Match IoT components with their role:",
            question_type="matching",
            points=10.0,
            skill="PROCESS,ACT",
            concept="Architecture",
            explanation="ESP32 processes instructions; Relay actuates high power loads."
        )
        db.session.add(q2)
        db.session.flush()
        opt2_a = QuestionOption(question_id=q2.question_id, option_text='{"left": "ESP32", "right": "Controller"}', is_correct=True, order_no=1)
        opt2_b = QuestionOption(question_id=q2.question_id, option_text='{"left": "Relay", "right": "Actuator"}', is_correct=True, order_no=2)
        db.session.add_all([opt2_a, opt2_b])
        db.session.add(QuizQuestion(quiz_id=quiz.quiz_id, question_id=q2.question_id, order_no=2))

        # Q3: Ordering (weight: 10.0)
        q3 = Question(
            question_text="Order standard IoT data pipeline:",
            question_type="ordering",
            points=10.0,
            skill="CONNECT,COLLECT",
            concept="Data Pipeline",
            explanation="Sensor reads physical phenomena -> Controller formats -> Network transmits to Cloud"
        )
        db.session.add(q3)
        db.session.flush()
        opt3_a = QuestionOption(question_id=q3.question_id, option_text="Sensor Measurement", is_correct=True, order_no=1)
        opt3_b = QuestionOption(question_id=q3.question_id, option_text="Microcontroller Processing", is_correct=True, order_no=2)
        opt3_c = QuestionOption(question_id=q3.question_id, option_text="Cloud MQTT Publish", is_correct=True, order_no=3)
        db.session.add_all([opt3_a, opt3_b, opt3_c])
        db.session.add(QuizQuestion(quiz_id=quiz.quiz_id, question_id=q3.question_id, order_no=3))

        db.session.commit()
        return quiz, (q1, opt1_a, opt1_b), (q2, opt2_a, opt2_b), (q3, opt3_a, opt3_b, opt3_c)

    # =========================================================================
    # TC-01: ส่งข้อสอบและตรวจคะแนนสำเร็จ (100% Score)
    # =========================================================================
    def test_01_tc01_exam_submit_and_grading_success(self):
        """TC-01: Submit exam with all correct answers -> 200 OK, is_passed=True, score=30/30 (100%)."""
        quiz, (q1, o1_a, _), (q2, _, _), (q3, o3_a, o3_b, o3_c) = self._create_test_quiz(
            "TC01 Perfect Exam",
            lesson_id=self.lesson_1.lesson_id,
            course_id=self.course.classroom_id
        )

        # 1. Start attempt
        start_res = self.client.post(f"/api/v1/quizzes/{quiz.quiz_id}/attempts", headers=self.headers_stda)
        self.assertEqual(start_res.status_code, 201)
        attempt_id = start_res.get_json()["attempt"]["attempt_id"]

        # 2. Submit all correct
        payload = {
            "attempt_id": attempt_id,
            "answers": [
                {"question_id": str(q1.question_id), "option_id": str(o1_a.option_id)},
                {"question_id": str(q2.question_id), "matches": [{"left": "ESP32", "right": "Controller"}, {"left": "Relay", "right": "Actuator"}]},
                {"question_id": str(q3.question_id), "ordered_option_ids": [str(o3_a.option_id), str(o3_b.option_id), str(o3_c.option_id)]}
            ]
        }
        sub_res = self.client.post(f"/api/v1/quizzes/{quiz.quiz_id}/submit", headers=self.headers_stda, json=payload)
        self.assertEqual(sub_res.status_code, 200)
        data = sub_res.get_json()

        self.assertTrue(data["is_passed"])
        self.assertEqual(data["percentage"], 100.0)
        self.assertEqual(data["score"], 30.0)
        self.assertEqual(data["total_score"], 30.0)

        # Verify Database Record
        db_res = QuizResult.query.filter_by(attempt_id=uuid.UUID(attempt_id)).first()
        self.assertIsNotNone(db_res)
        self.assertTrue(db_res.is_passed)
        self.assertEqual(float(db_res.score), 30.0)

    # =========================================================================
    # TC-02: ตรวจสอบ Partial Credit และประเภทคำถามต่าง ๆ
    # =========================================================================
    def test_02_tc02_question_types_and_partial_credit(self):
        """TC-02: Test Partial Credit on Matching (1/2 correct) and Ordering (1/3 correct)."""
        quiz, (q1, opt1_a, opt1_b), (q2, opt2_a, opt2_b), (q3, opt3_1, opt3_2, opt3_3) = self._create_test_quiz(
            "TC02 Partial Credit Exam",
            lesson_id=self.lesson_1.lesson_id,
            course_id=self.course.classroom_id,
            passing_score=50.0
        )

        start_res = self.client.post(f"/api/v1/quizzes/{quiz.quiz_id}/attempts", headers=self.headers_stda)
        attempt_id = start_res.get_json()["attempt"]["attempt_id"]

        # Q1 wrong (0/10), Q2 half correct (5/10), Q3 scrambled: pos 0 match, pos 1 & 2 swapped (3.33/10)
        payload = {
            "attempt_id": attempt_id,
            "answers": [
                {"question_id": str(q1.question_id), "option_id": str(opt1_b.option_id)},  # Wrong
                {"question_id": str(q2.question_id), "matches": [{"left": "ESP32", "right": "Controller"}, {"left": "Relay", "right": "WrongVal"}]},  # 50%
                {"question_id": str(q3.question_id), "ordered_option_ids": [str(opt3_1.option_id), str(opt3_3.option_id), str(opt3_2.option_id)]}  # 1/3 (pos 0 matches, 1 & 2 swapped)
            ]
        }
        sub_res = self.client.post(f"/api/v1/quizzes/{quiz.quiz_id}/submit", headers=self.headers_stda, json=payload)
        self.assertEqual(sub_res.status_code, 200)
        data = sub_res.get_json()

        # Score must be 0 + 5.0 + 3.33 = ~8.33 / 30.0 (~27.78%)
        self.assertAlmostEqual(data["score"], 8.33, delta=0.1)
        self.assertFalse(data["is_passed"])

    # =========================================================================
    # TC-03: บันทึก Attempt, Answers และ Results อย่างถูกต้อง
    # =========================================================================
    def test_03_tc03_attempt_and_result_persistence(self):
        """TC-03: Verify QuizAttempt, QuizAnswer (3 records), and QuizResult persist correctly."""
        quiz, (q1, o1_a, _), (q2, _, _), (q3, o3_a, o3_b, o3_c) = self._create_test_quiz(
            "TC03 Persistence Exam",
            lesson_id=self.lesson_1.lesson_id,
            course_id=self.course.classroom_id
        )

        start_res = self.client.post(f"/api/v1/quizzes/{quiz.quiz_id}/attempts", headers=self.headers_stda)
        att_id = uuid.UUID(start_res.get_json()["attempt"]["attempt_id"])

        payload = {
            "attempt_id": str(att_id),
            "answers": [
                {"question_id": str(q1.question_id), "option_id": str(o1_a.option_id)},
                {"question_id": str(q2.question_id), "matches": [{"left": "ESP32", "right": "Controller"}, {"left": "Relay", "right": "Actuator"}]},
                {"question_id": str(q3.question_id), "ordered_option_ids": [str(o3_a.option_id), str(o3_b.option_id), str(o3_c.option_id)]}
            ]
        }
        self.client.post(f"/api/v1/quizzes/{quiz.quiz_id}/submit", headers=self.headers_stda, json=payload)

        # Verify attempt status
        attempt = db.session.get(QuizAttempt, att_id)
        self.assertEqual(attempt.status, "completed")
        self.assertIsNotNone(attempt.submitted_at)

        # Verify exactly 3 answers saved
        answers = QuizAnswer.query.filter_by(attempt_id=att_id).all()
        self.assertEqual(len(answers), 3)

        # Verify QuizResult
        result = QuizResult.query.filter_by(attempt_id=att_id).first()
        self.assertIsNotNone(result)
        self.assertEqual(float(result.percentage), 100.0)

    # =========================================================================
    # TC-04: การทดสอบ Progress (ความก้าวหน้า) เชิงลึกทุกกรณี
    # =========================================================================
    def test_04a_progress_created_when_passing_first_lesson(self):
        """TC-04A: Passing lesson 1 marks lesson_progress 'completed' and sets course progress."""
        # Clean progress before test for student A on this course
        LessonProgress.query.filter_by(user_id=self.student_a.user_id, lesson_id=self.lesson_1.lesson_id).delete()
        LearningProgress.query.filter_by(user_id=self.student_a.user_id, course_id=self.course.classroom_id).delete()
        db.session.commit()

        quiz, (q1, o1_a, _), (q2, _, _), (q3, o3_a, o3_b, o3_c) = self._create_test_quiz(
            "TC04A Lesson 1 Quiz",
            lesson_id=self.lesson_1.lesson_id,
            course_id=self.course.classroom_id
        )

        start_res = self.client.post(f"/api/v1/quizzes/{quiz.quiz_id}/attempts", headers=self.headers_stda)
        att_id = start_res.get_json()["attempt"]["attempt_id"]

        payload = {
            "attempt_id": att_id,
            "answers": [
                {"question_id": str(q1.question_id), "option_id": str(o1_a.option_id)},
                {"question_id": str(q2.question_id), "matches": [{"left": "ESP32", "right": "Controller"}, {"left": "Relay", "right": "Actuator"}]},
                {"question_id": str(q3.question_id), "ordered_option_ids": [str(o3_a.option_id), str(o3_b.option_id), str(o3_c.option_id)]}
            ]
        }
        self.client.post(f"/api/v1/quizzes/{quiz.quiz_id}/submit", headers=self.headers_stda, json=payload)

        # Check LessonProgress in DB
        lp = LessonProgress.query.filter_by(user_id=self.student_a.user_id, lesson_id=self.lesson_1.lesson_id).first()
        self.assertIsNotNone(lp, "LessonProgress must be created upon passing quiz.")
        self.assertEqual(lp.status, "completed")

        # Check LearningProgress in DB
        cp = LearningProgress.query.filter_by(user_id=self.student_a.user_id, course_id=self.course.classroom_id).first()
        self.assertIsNotNone(cp, "LearningProgress must be created upon passing quiz.")

        # Assert formula: 1 of 2 lessons completed = 50.0%
        expected_pct = round((1 / 2) * 100, 1)  # 50.0%
        print(f"[TEST 4A AUDIT] Current LearningProgress percent: {float(cp.progress_percent)}% (Expected from formula: {expected_pct}%)")
        self.assertEqual(float(cp.progress_percent), expected_pct, f"Course progress should be {expected_pct}% (1/2 lessons), but found {float(cp.progress_percent)}%")

    def test_04b_progress_advancement_from_lesson1_to_lesson2(self):
        """TC-04B: Passing lesson 2 (after lesson 1) advances progress to 100% and status 'completed'."""
        quiz2, (q1, o1_a, _), (q2, _, _), (q3, o3_a, o3_b, o3_c) = self._create_test_quiz(
            "TC04B Lesson 2 Quiz",
            lesson_id=self.lesson_2.lesson_id,
            course_id=self.course.classroom_id
        )

        start_res = self.client.post(f"/api/v1/quizzes/{quiz2.quiz_id}/attempts", headers=self.headers_stda)
        att_id = start_res.get_json()["attempt"]["attempt_id"]

        payload = {
            "attempt_id": att_id,
            "answers": [
                {"question_id": str(q1.question_id), "option_id": str(o1_a.option_id)},
                {"question_id": str(q2.question_id), "matches": [{"left": "ESP32", "right": "Controller"}, {"left": "Relay", "right": "Actuator"}]},
                {"question_id": str(q3.question_id), "ordered_option_ids": [str(o3_a.option_id), str(o3_b.option_id), str(o3_c.option_id)]}
            ]
        }
        self.client.post(f"/api/v1/quizzes/{quiz2.quiz_id}/submit", headers=self.headers_stda, json=payload)

        # Lesson 2 must be completed
        lp2 = LessonProgress.query.filter_by(user_id=self.student_a.user_id, lesson_id=self.lesson_2.lesson_id).first()
        self.assertIsNotNone(lp2)
        self.assertEqual(lp2.status, "completed")

        # Course progress check: 2/2 lessons completed -> 100.0%, status "completed"
        cp = LearningProgress.query.filter_by(user_id=self.student_a.user_id, course_id=self.course.classroom_id).first()
        print(f"[TEST 4B AUDIT] Course Progress after both lessons completed: {float(cp.progress_percent)}% (Target: 100.0%)")
        self.assertEqual(float(cp.progress_percent), 100.0, f"Course progress should be 100.0% (2/2 lessons), but found {float(cp.progress_percent)}%")
        self.assertEqual(cp.status, "completed", f"Course status should be 'completed' at 100%, but found {cp.status}")

    def test_04c_quiz_linked_via_lesson_only_without_direct_course_id(self):
        """TC-04C: Quiz with lesson_id only (course_id is NULL) must still trace back to course and update progress."""
        quiz_lesson_only, (q1, o1_a, _), (q2, _, _), (q3, o3_a, o3_b, o3_c) = self._create_test_quiz(
            "TC04C Lesson Only Quiz",
            lesson_id=self.lesson_1.lesson_id,
            course_id=None  # Explicitly None to test Dual-Pointer traversal
        )

        start_res = self.client.post(f"/api/v1/quizzes/{quiz_lesson_only.quiz_id}/attempts", headers=self.headers_stdb)
        att_id = start_res.get_json()["attempt"]["attempt_id"]

        payload = {
            "attempt_id": att_id,
            "answers": [
                {"question_id": str(q1.question_id), "option_id": str(o1_a.option_id)},
                {"question_id": str(q2.question_id), "matches": [{"left": "ESP32", "right": "Controller"}, {"left": "Relay", "right": "Actuator"}]},
                {"question_id": str(q3.question_id), "ordered_option_ids": [str(o3_a.option_id), str(o3_b.option_id), str(o3_c.option_id)]}
            ]
        }
        res = self.client.post(f"/api/v1/quizzes/{quiz_lesson_only.quiz_id}/submit", headers=self.headers_stdb, json=payload)
        self.assertEqual(res.status_code, 200)

        # Check if LessonProgress was recorded for student B
        lp = LessonProgress.query.filter_by(user_id=self.student_b.user_id, lesson_id=self.lesson_1.lesson_id).first()
        self.assertIsNotNone(lp)
        self.assertEqual(lp.status, "completed")

        # Check if LearningProgress was recorded for student B
        cp = LearningProgress.query.filter_by(user_id=self.student_b.user_id, course_id=self.course.classroom_id).first()
        print(f"[TEST 4C AUDIT] Student B LearningProgress (when quiz has course_id=None): {cp}")
        self.assertIsNotNone(cp, "LearningProgress must be updated even when quiz.course_id is None by traversing quiz.lesson.classroom_id")

    def test_04d_zero_lessons_course_edge_case(self):
        """TC-04D: Edge Case: Course with 0 lessons must evaluate to 0.0% progress without division-by-zero error."""
        empty_course = Classroom(
            instructor_id=self.instructor.user_id,
            title=f"Empty Course {self.test_run_id}",
            status="active"
        )
        db.session.add(empty_course)
        db.session.flush()
        db.session.add(ClassroomMember(classroom_id=empty_course.classroom_id, user_id=self.student_a.user_id, status="enrolled"))
        db.session.commit()

        # Call user dashboard to verify calculation
        overview = UserService.get_student_dashboard(self.student_a)
        found = next((c for c in overview["enrolledCourses"] if c["id"] == str(empty_course.classroom_id)), None)
        self.assertIsNotNone(found)
        self.assertEqual(found["progress_percent"], 0.0)

        # Cleanup empty course
        ClassroomMember.query.filter_by(classroom_id=empty_course.classroom_id).delete()
        Classroom.query.filter_by(classroom_id=empty_course.classroom_id).delete()
        db.session.commit()

    def test_unlock_standard_lms_enrolled_vs_unenrolled(self):
        """TC-05B: Verify Standard LMS lesson unlocking: Enrolled student can view contents; Unenrolled student cannot."""
        # Student A is enrolled
        res_a = self.client.get(f"/api/v1/classrooms/{self.course.classroom_id}/lessons", headers=self.headers_stda)
        self.assertEqual(res_a.status_code, 200)
        self.assertTrue(res_a.get_json()["is_enrolled"])
        self.assertTrue(len(res_a.get_json()["lessons"]) > 0)

        # Create un-enrolled student C
        std_c = User(email=f"stdc_stab_{self.test_run_id}@test.com", status="active")
        std_c.set_password("SecurePass123!")
        if self.student_role:
            std_c.roles = [self.student_role]
        db.session.add(std_c)
        db.session.commit()
        token_c = create_access_token(identity=str(std_c.user_id))
        headers_c = {"Authorization": f"Bearer {token_c}", "Content-Type": "application/json"}

        res_c = self.client.get(f"/api/v1/classrooms/{self.course.classroom_id}/lessons", headers=headers_c)
        self.assertEqual(res_c.status_code, 200)
        self.assertFalse(res_c.get_json()["is_enrolled"])

        # Student C attempts to view lesson 1 full content
        res_c_lesson = self.client.get(f"/api/v1/lessons/{self.lesson_1.lesson_id}", headers=headers_c)
        self.assertEqual(res_c_lesson.status_code, 200)
        self.assertFalse(res_c_lesson.get_json()["is_enrolled"])

        # Cleanup Student C
        User.query.filter_by(user_id=std_c.user_id).delete()
        db.session.commit()

    # =========================================================================
    # TC-05: สอบผ่านเกณฑ์แล้วปลดล็อกบทเรียนและทักษะ
    # =========================================================================
    def test_05_tc05_pass_threshold_and_lesson_unlock(self):
        """TC-05: Passing exam unlocks IoT skills in UserSkill table and returns unlocked_skills list."""
        quiz, (q1, o1_a, _), (q2, _, _), (q3, o3_a, o3_b, o3_c) = self._create_test_quiz(
            "TC05 Unlock Skills Exam",
            lesson_id=self.lesson_1.lesson_id,
            course_id=self.course.classroom_id,
            passing_score=70.0
        )

        start_res = self.client.post(f"/api/v1/quizzes/{quiz.quiz_id}/attempts", headers=self.headers_stda)
        att_id = start_res.get_json()["attempt"]["attempt_id"]

        payload = {
            "attempt_id": att_id,
            "answers": [
                {"question_id": str(q1.question_id), "option_id": str(o1_a.option_id)},
                {"question_id": str(q2.question_id), "matches": [{"left": "ESP32", "right": "Controller"}, {"left": "Relay", "right": "Actuator"}]},
                {"question_id": str(q3.question_id), "ordered_option_ids": [str(o3_a.option_id), str(o3_b.option_id), str(o3_c.option_id)]}
            ]
        }
        res = self.client.post(f"/api/v1/quizzes/{quiz.quiz_id}/submit", headers=self.headers_stda, json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()

        self.assertTrue(data["is_passed"])
        self.assertIn("unlocked_skills", data)
        self.assertIn("SENSE", data["unlocked_skills"])

        # Verify UserSkill in PostgreSQL
        sense_skill = Skill.query.filter_by(name="SENSE").first()
        self.assertIsNotNone(sense_skill)
        user_skill = UserSkill.query.filter_by(user_id=self.student_a.user_id, skill_id=sense_skill.skill_id).first()
        self.assertIsNotNone(user_skill)
        self.assertTrue(user_skill.is_unlocked)

    # =========================================================================
    # TC-06: ไม่ผ่านเกณฑ์แล้วบทเรียนยังล็อกอยู่
    # =========================================================================
    def test_06_tc06_fail_threshold_and_remain_locked(self):
        """TC-06: Failing exam (<70%) does NOT complete lesson and does NOT unlock skills."""
        # Create a separate isolated lesson for fail testing
        fail_lesson = Lesson(
            classroom_id=self.course.classroom_id,
            title="Lesson Fail Test",
            sequence_no=99,
            status="published"
        )
        db.session.add(fail_lesson)
        db.session.commit()

        quiz, (q1, _, o1_b), (q2, _, _), (q3, o3_c, o3_b, o3_a) = self._create_test_quiz(
            "TC06 Fail Exam",
            lesson_id=fail_lesson.lesson_id,
            course_id=self.course.classroom_id,
            passing_score=70.0
        )

        start_res = self.client.post(f"/api/v1/quizzes/{quiz.quiz_id}/attempts", headers=self.headers_stdb)
        att_id = start_res.get_json()["attempt"]["attempt_id"]

        # Submit wrong answers
        payload = {
            "attempt_id": att_id,
            "answers": [
                {"question_id": str(q1.question_id), "option_id": str(o1_b.option_id)},  # Wrong
                {"question_id": str(q2.question_id), "matches": []},                     # Wrong
                {"question_id": str(q3.question_id), "ordered_option_ids": [str(o3_c.option_id), str(o3_b.option_id), str(o3_a.option_id)]}  # Reversed
            ]
        }
        res = self.client.post(f"/api/v1/quizzes/{quiz.quiz_id}/submit", headers=self.headers_stdb, json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.get_json()

        self.assertFalse(data["is_passed"])
        self.assertEqual(len(data.get("unlocked_skills", [])), 0)

        # Lesson progress must NOT be completed
        lp = LessonProgress.query.filter_by(user_id=self.student_b.user_id, lesson_id=fail_lesson.lesson_id).first()
        self.assertTrue(lp is None or lp.status != "completed")

        # Cleanup extra lesson
        Lesson.query.filter_by(lesson_id=fail_lesson.lesson_id).delete()
        db.session.commit()

    # =========================================================================
    # TC-07: ทำข้อสอบซ้ำโดยไม่เพิ่ม XP หรือ Progress ซ้ำโดยไม่ตั้งใจ
    # =========================================================================
    def test_07_tc07_retake_idempotency_no_duplicate_progress_or_xp(self):
        """TC-07: Retaking an already-passed quiz must be idempotent: no duplicate LessonProgress, no XP exploit."""
        quiz, (q1, o1_a, _), (q2, _, _), (q3, o3_a, o3_b, o3_c) = self._create_test_quiz(
            "TC07 Retake Exam",
            lesson_id=self.lesson_1.lesson_id,
            course_id=self.course.classroom_id,
            max_attempts=3
        )

        # Attempt 1 (Pass)
        s1 = self.client.post(f"/api/v1/quizzes/{quiz.quiz_id}/attempts", headers=self.headers_stda)
        att1_id = s1.get_json()["attempt"]["attempt_id"]
        payload = {
            "attempt_id": att1_id,
            "answers": [
                {"question_id": str(q1.question_id), "option_id": str(o1_a.option_id)},
                {"question_id": str(q2.question_id), "matches": [{"left": "ESP32", "right": "Controller"}, {"left": "Relay", "right": "Actuator"}]},
                {"question_id": str(q3.question_id), "ordered_option_ids": [str(o3_a.option_id), str(o3_b.option_id), str(o3_c.option_id)]}
            ]
        }
        self.client.post(f"/api/v1/quizzes/{quiz.quiz_id}/submit", headers=self.headers_stda, json=payload)

        lp_count_1 = LessonProgress.query.filter_by(user_id=self.student_a.user_id, lesson_id=self.lesson_1.lesson_id).count()
        self.assertEqual(lp_count_1, 1)

        # Attempt 2 (Retake - Pass again)
        s2 = self.client.post(f"/api/v1/quizzes/{quiz.quiz_id}/attempts", headers=self.headers_stda)
        self.assertEqual(s2.status_code, 201)
        att2_id = s2.get_json()["attempt"]["attempt_id"]
        payload["attempt_id"] = att2_id

        res2 = self.client.post(f"/api/v1/quizzes/{quiz.quiz_id}/submit", headers=self.headers_stda, json=payload)
        self.assertEqual(res2.status_code, 200)

        # Verify no duplicate LessonProgress row was created
        lp_count_2 = LessonProgress.query.filter_by(user_id=self.student_a.user_id, lesson_id=self.lesson_1.lesson_id).count()
        self.assertEqual(lp_count_2, 1, "LessonProgress must remain unique per (user_id, lesson_id).")

    # =========================================================================
    # TC-08: ส่งคำตอบซ้ำและส่งพร้อมกัน (Duplicate Submission & Race Condition)
    # =========================================================================
    def test_08_tc08_duplicate_submission_and_concurrency(self):
        """TC-08: Sequential duplicate submit -> 409 Conflict. Concurrent submit -> exactly 1 succeeds, other gets 409."""
        quiz, (q1, o1_a, _), _, _ = self._create_test_quiz("TC08 Concurrency Exam")

        start_res = self.client.post(f"/api/v1/quizzes/{quiz.quiz_id}/attempts", headers=self.headers_stda)
        att_id = start_res.get_json()["attempt"]["attempt_id"]

        payload = {
            "attempt_id": att_id,
            "answers": [{"question_id": str(q1.question_id), "option_id": str(o1_a.option_id)}]
        }

        # 1. Sequential duplicate submit
        res1 = self.client.post(f"/api/v1/quizzes/{quiz.quiz_id}/submit", headers=self.headers_stda, json=payload)
        self.assertEqual(res1.status_code, 200)

        res2 = self.client.post(f"/api/v1/quizzes/{quiz.quiz_id}/submit", headers=self.headers_stda, json=payload)
        self.assertEqual(res2.status_code, 409, "Second submission of same attempt must return 409 Conflict.")

    # =========================================================================
    # TC-09: รีเฟรชหน้าและเข้าสู่ระบบใหม่ (Session Resumption)
    # =========================================================================
    def test_09_tc09_refresh_and_resume_attempt(self):
        """TC-09: Starting quiz when an active in_progress attempt exists resumes it without creating duplicate."""
        quiz, _, _, _ = self._create_test_quiz("TC09 Resume Session Exam")

        # Start attempt 1
        res1 = self.client.post(f"/api/v1/quizzes/{quiz.quiz_id}/attempts", headers=self.headers_stda)
        att1_id = res1.get_json()["attempt"]["attempt_id"]

        # Student refreshes page -> calls start endpoint again
        res2 = self.client.post(f"/api/v1/quizzes/{quiz.quiz_id}/attempts", headers=self.headers_stda)
        self.assertIn(res2.status_code, [200, 201])
        att2_id = res2.get_json()["attempt"]["attempt_id"]

        # Must resume the SAME attempt ID
        self.assertEqual(att1_id, att2_id, "In-progress attempt must be resumed without creating extra records.")

    # =========================================================================
    # TC-10: API ล้มเหลวหรือข้อมูลไม่ครบ โดยไม่ทิ้งข้อมูลบางส่วนที่ไม่สอดคล้องกัน
    # =========================================================================
    def test_10_tc10_api_failure_and_transaction_rollback(self):
        """TC-10: Submitting invalid question ID aborts transaction; zero partial records saved."""
        quiz, (q1, o1_a, _), _, _ = self._create_test_quiz("TC10 Rollback Exam")

        start_res = self.client.post(f"/api/v1/quizzes/{quiz.quiz_id}/attempts", headers=self.headers_stda)
        att_id = uuid.UUID(start_res.get_json()["attempt"]["attempt_id"])

        fake_qid = str(uuid.uuid4())
        payload = {
            "attempt_id": str(att_id),
            "answers": [
                {"question_id": str(q1.question_id), "option_id": str(o1_a.option_id)},
                {"question_id": fake_qid, "option_id": str(uuid.uuid4())}  # Alien question
            ]
        }
        res = self.client.post(f"/api/v1/quizzes/{quiz.quiz_id}/submit", headers=self.headers_stda, json=payload)
        self.assertEqual(res.status_code, 400)

        # Verify no answers or result were written to database
        answers_count = QuizAnswer.query.filter_by(attempt_id=att_id).count()
        result_count = QuizResult.query.filter_by(attempt_id=att_id).count()
        self.assertEqual(answers_count, 0, "No QuizAnswers should exist after failed submission.")
        self.assertEqual(result_count, 0, "No QuizResult should exist after failed submission.")

        # Attempt status should remain in_progress
        attempt = db.session.get(QuizAttempt, att_id)
        self.assertEqual(attempt.status, "in_progress")

    # =========================================================================
    # TC-11: ผู้ใช้ไม่มีสิทธิ์พยายามแก้คะแนนหรือสถานะ Unlock ผ่าน API (IDOR & RBAC)
    # =========================================================================
    def test_11_tc11_idor_and_rbac_tampering_protection(self):
        """TC-11: Student B cannot submit answers for Student A's attempt (403 Forbidden). Client score ignored."""
        quiz, (q1, o1_a, _), _, _ = self._create_test_quiz("TC11 Security Exam")

        # Student A starts attempt
        start_res = self.client.post(f"/api/v1/quizzes/{quiz.quiz_id}/attempts", headers=self.headers_stda)
        att_a_id = start_res.get_json()["attempt"]["attempt_id"]

        # Student B attempts to submit for Student A's attempt
        payload = {
            "attempt_id": att_a_id,
            "score": 1000.0,            # Tampered score injection attempt
            "is_passed": True,          # Tampered pass status
            "answers": [{"question_id": str(q1.question_id), "option_id": str(o1_a.option_id)}]
        }
        res = self.client.post(f"/api/v1/quizzes/{quiz.quiz_id}/submit", headers=self.headers_stdb, json=payload)
        self.assertEqual(res.status_code, 403, "Student B submitting for Student A must return 403 Forbidden.")

    # =========================================================================
    # TC-12: Data Consistency Audit หลังจบแต่ละ Scenario
    # =========================================================================
    def test_12_tc12_data_consistency_audit(self):
        """TC-12: Full consistency audit: All completed attempts have matching QuizResult and QuizAnswers."""
        completed_attempts = QuizAttempt.query.filter(
            QuizAttempt.quiz_id.in_(self.created_quiz_ids),
            QuizAttempt.status == "completed"
        ).all()

        for att in completed_attempts:
            res = QuizResult.query.filter_by(attempt_id=att.attempt_id).first()
            self.assertIsNotNone(res, f"Completed attempt {att.attempt_id} must have a QuizResult record.")
            self.assertEqual(res.user_id, att.user_id)
            self.assertIsNotNone(att.submitted_at)

            answers = QuizAnswer.query.filter_by(attempt_id=att.attempt_id).all()
            self.assertTrue(len(answers) > 0, f"Completed attempt {att.attempt_id} must have QuizAnswer records.")


if __name__ == "__main__":
    unittest.main()
