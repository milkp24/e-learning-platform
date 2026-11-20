"""
test_quiz_architecture_and_crud.py
Verification suite for Phase 5D: Quiz Route Architecture & Complete CRUD Operations.

Verifies:
Part 1: Architecture Enforcement (Static Code Analysis on routes/quizzes.py)
  - 0 Direct Queries (Model.query, db.session.get, db.session.execute)
  - 0 Transaction Operations (commit, rollback, flush)
  - 0 Model Mutations (session.add, session.delete)
  - Exactly 1 endpoint handler registered for GET /quizzes/<quiz_id>/attempts

Part 2: Functional Management & Authoring CRUD Flow
  - Instructor creates quiz via POST /quizzes
  - Instructor adds question with auto order_no via POST /quizzes/<id>/questions
  - Instructor updates question via PUT /quizzes/<id>/questions/<qid>
  - Instructor retrieves full quiz in manage mode via GET /quizzes/<id>?mode=manage
  - Student retrieves sanitized quiz without leakages via GET /quizzes/<id>
  - Student starts attempt, submits, and views attempt history via GET /quizzes/<id>/attempts
  - Instructor views all attempt history via GET /quizzes/<id>/attempts
  - Instructor updates quiz via PUT /quizzes/<id>
  - Instructor deletes question via DELETE /quizzes/<id>/questions/<qid>
  - Instructor deletes quiz via DELETE /quizzes/<id>
"""
import uuid
import unittest
from flask_jwt_extended import create_access_token

from app import create_app
from app.config import TestingPostgresConfig, verify_test_database_safety
from app.extensions import db
from app.models.user import User
from app.models.role import Role
from app.models.classroom import Classroom, ClassroomMember
from app.models.quiz import Quiz, Question, QuizAttempt


class TestQuizArchitectureAndCRUD(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        db_name = verify_test_database_safety(TestingPostgresConfig.SQLALCHEMY_DATABASE_URI)
        assert db_name == "elearning_test_db", f"Expected elearning_test_db, got {db_name}"
        cls.app = create_app(TestingPostgresConfig)
        cls.ctx = cls.app.app_context()
        cls.ctx.push()
        cls.client = cls.app.test_client()

        # Ensure roles exist
        cls.student_role = Role.query.filter_by(role_name="student").first()
        if not cls.student_role:
            cls.student_role = Role(role_name="student", description="Student")
            db.session.add(cls.student_role)

        cls.instructor_role = Role.query.filter_by(role_name="instructor").first()
        if not cls.instructor_role:
            cls.instructor_role = Role(role_name="instructor", description="Instructor")
            db.session.add(cls.instructor_role)
        db.session.commit()

        # Create instructor
        cls.instructor = User.query.filter_by(email="arch_instructor@test.com").first()
        if not cls.instructor:
            cls.instructor = User(email="arch_instructor@test.com", status="active")
            cls.instructor.set_password("SecurePass123!")
            cls.instructor.roles = [cls.instructor_role]
            db.session.add(cls.instructor)
            db.session.commit()

        # Create student
        cls.student = User.query.filter_by(email="arch_student@test.com").first()
        if not cls.student:
            cls.student = User(email="arch_student@test.com", status="active")
            cls.student.set_password("SecurePass123!")
            cls.student.roles = [cls.student_role]
            db.session.add(cls.student)
            db.session.commit()

        cls.instructor_token = create_access_token(identity=str(cls.instructor.user_id))
        cls.student_token = create_access_token(identity=str(cls.student.user_id))
        cls.instructor_headers = {"Authorization": f"Bearer {cls.instructor_token}"}
        cls.student_headers = {"Authorization": f"Bearer {cls.student_token}"}

        # Create course
        cls.course = Classroom.query.filter_by(title="Architecture Test Course").first()
        if not cls.course:
            cls.course = Classroom(
                instructor_id=cls.instructor.user_id,
                title="Architecture Test Course",
                description="Architecture Test Course Description",
                status="active"
            )
            db.session.add(cls.course)
            db.session.commit()

        # Enroll student
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

    # =================================================================
    # Part 1: Architecture Enforcement Tests
    # =================================================================

    def test_01_routes_quizzes_zero_db_access(self):
        """Verify routes/quizzes.py contains 0 direct DB queries and 0 transaction operations."""
        import os
        route_path = os.path.join(self.app.root_path, "routes", "quizzes.py")
        with open(route_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        violations = []
        for idx, line in enumerate(lines, 1):
            s = line.strip()
            if s.startswith("#"):
                continue
            if ".query" in s:
                violations.append((idx, ".query", s))
            if "db.session" in s:
                violations.append((idx, "db.session", s))
            if "with_for_update" in s:
                violations.append((idx, "with_for_update", s))
            if "pg_advisory" in s:
                violations.append((idx, "pg_advisory", s))

        self.assertEqual(
            len(violations),
            0,
            f"Expected 0 DB operations in routes/quizzes.py, found {len(violations)}: {violations}"
        )

    def test_02_attempts_endpoint_uniquely_registered(self):
        """Verify GET /api/v1/quizzes/<quiz_id>/attempts is uniquely registered (no route shadowing)."""
        rules = [
            r for r in self.app.url_map.iter_rules()
            if r.rule == "/api/v1/quizzes/<quiz_id>/attempts" and "GET" in r.methods
        ]
        self.assertEqual(
            len(rules),
            1,
            f"Expected exactly 1 rule for GET /api/v1/quizzes/<quiz_id>/attempts, found {len(rules)}"
        )
        self.assertEqual(rules[0].endpoint, "quizzes.list_quiz_attempts_endpoint")

    # =================================================================
    # Part 2: Functional CRUD & Management Integration Tests
    # =================================================================

    def test_03_quiz_crud_and_management_lifecycle(self):
        """Complete lifecycle: create quiz -> add question -> update -> manage mode -> attempts -> delete."""
        course_id = str(self.course.classroom_id)

        # 1. Create Quiz
        create_payload = {
            "course_id": course_id,
            "title": f"Lifecycle Test Quiz {uuid.uuid4().hex[:6]}",
            "description": "Lifecycle test description",
            "max_attempts": 3,
            "time_limit_minutes": 20,
            "passing_score": 75.0,
        }
        res_create = self.client.post(
            "/api/v1/quizzes",
            headers=self.instructor_headers,
            json=create_payload
        )
        self.assertEqual(res_create.status_code, 201)
        quiz_data = res_create.get_json()["quiz"]
        quiz_id = quiz_data["quiz_id"]

        # 2. Add Question 1 (auto order_no)
        q1_payload = {
            "question_text": "What is IoT?",
            "question_type": "multiple_choice",
            "points": 5.0,
            "explanation": "Internet of Things connects devices.",
            "options": [
                {"option_text": "Internet of Things", "is_correct": True, "order_no": 1},
                {"option_text": "Input of Technology", "is_correct": False, "order_no": 2},
            ]
        }
        res_q1 = self.client.post(
            f"/api/v1/quizzes/{quiz_id}/questions",
            headers=self.instructor_headers,
            json=q1_payload
        )
        self.assertEqual(res_q1.status_code, 201)
        q1_data = res_q1.get_json()
        self.assertEqual(q1_data["order_no"], 1)
        question1_id = q1_data["question"]["question_id"]

        # 3. Add Question 2 (auto order_no should be 2)
        q2_payload = {
            "question_text": "Is MQTT a lightweight protocol?",
            "question_type": "multiple_choice",
            "points": 5.0,
            "options": [
                {"option_text": "Yes", "is_correct": True, "order_no": 1},
                {"option_text": "No", "is_correct": False, "order_no": 2},
            ]
        }
        res_q2 = self.client.post(
            f"/api/v1/quizzes/{quiz_id}/questions",
            headers=self.instructor_headers,
            json=q2_payload
        )
        self.assertEqual(res_q2.status_code, 201)
        self.assertEqual(res_q2.get_json()["order_no"], 2)

        # 4. Update Question 1
        update_q_payload = {
            "question_text": "What does IoT stand for?",
            "points": 10.0,
            "options": [
                {"option_text": "Internet of Things", "is_correct": True, "order_no": 1},
                {"option_text": "Internet of Tools", "is_correct": False, "order_no": 2},
            ]
        }
        res_uq = self.client.put(
            f"/api/v1/quizzes/{quiz_id}/questions/{question1_id}",
            headers=self.instructor_headers,
            json=update_q_payload
        )
        self.assertEqual(res_uq.status_code, 200)
        self.assertEqual(res_uq.get_json()["question"]["question_text"], "What does IoT stand for?")

        # 5. Instructor Manage Mode: receives full quiz with questions and answers
        res_manage = self.client.get(
            f"/api/v1/quizzes/{quiz_id}?mode=manage",
            headers=self.instructor_headers
        )
        self.assertEqual(res_manage.status_code, 200)
        manage_data = res_manage.get_json()
        self.assertEqual(len(manage_data["questions"]), 2)
        # Check answer is visible in manage mode
        first_opt = manage_data["questions"][0]["options"][0]
        self.assertIn("is_correct", first_opt)

        # 6. Student Taking Mode: receives sanitized quiz (is_correct hidden)
        res_student = self.client.get(
            f"/api/v1/quizzes/{quiz_id}",
            headers=self.student_headers
        )
        self.assertEqual(res_student.status_code, 200)
        student_data = res_student.get_json()
        student_first_opt = student_data["questions"][0]["options"][0]
        self.assertNotIn("is_correct", student_first_opt)

        # 7. Student Starts and Submits Attempt
        res_start = self.client.post(
            f"/api/v1/quizzes/{quiz_id}/attempts",
            headers=self.student_headers
        )
        self.assertIn(res_start.status_code, [200, 201])
        att_id = res_start.get_json()["attempt"]["attempt_id"]

        submit_payload = {
            "attempt_id": att_id,
            "answers": [
                {
                    "question_id": question1_id,
                    "option_id": first_opt["option_id"]
                }
            ]
        }
        res_submit = self.client.post(
            f"/api/v1/quizzes/{quiz_id}/submit",
            headers=self.student_headers,
            json=submit_payload
        )
        self.assertEqual(res_submit.status_code, 200)

        # 8. Student Lists Attempts: sees own attempts
        res_student_att = self.client.get(
            f"/api/v1/quizzes/{quiz_id}/attempts",
            headers=self.student_headers
        )
        self.assertEqual(res_student_att.status_code, 200)
        stu_attempts = res_student_att.get_json()["attempts"]
        self.assertEqual(len(stu_attempts), 1)
        self.assertEqual(stu_attempts[0]["attempt_id"], att_id)
        self.assertIn("score", stu_attempts[0])
        self.assertIn("time_spent", stu_attempts[0])

        # 9. Instructor Lists Attempts: sees attempts with user info
        res_inst_att = self.client.get(
            f"/api/v1/quizzes/{quiz_id}/attempts",
            headers=self.instructor_headers
        )
        self.assertEqual(res_inst_att.status_code, 200)
        inst_attempts = res_inst_att.get_json()["attempts"]
        self.assertEqual(len(inst_attempts), 1)
        self.assertIn("user_email", inst_attempts[0])

        # 10. Update Quiz
        res_update_quiz = self.client.put(
            f"/api/v1/quizzes/{quiz_id}",
            headers=self.instructor_headers,
            json={"title": "Updated Quiz Title", "passing_score": 80.0}
        )
        self.assertEqual(res_update_quiz.status_code, 200)
        self.assertEqual(res_update_quiz.get_json()["quiz"]["title"], "Updated Quiz Title")

        # 11. Delete Question
        res_del_q = self.client.delete(
            f"/api/v1/quizzes/{quiz_id}/questions/{question1_id}",
            headers=self.instructor_headers
        )
        self.assertEqual(res_del_q.status_code, 200)

        # 12. Delete Quiz
        res_del_quiz = self.client.delete(
            f"/api/v1/quizzes/{quiz_id}",
            headers=self.instructor_headers
        )
        self.assertEqual(res_del_quiz.status_code, 200)

        # Verify Quiz no longer exists
        res_check = self.client.get(
            f"/api/v1/quizzes/{quiz_id}",
            headers=self.student_headers
        )
        self.assertEqual(res_check.status_code, 404)


if __name__ == "__main__":
    unittest.main()
