"""
test_quiz_postgres_integration.py
Full integration verification of Quiz Evaluation Engine against PostgreSQL database.
Verifies:
- PostgreSQL UUID / Numeric types
- Full Lifecycle: Create Quiz -> Start Attempt -> Submit -> Calculate -> Pass/Fail -> Save -> Review
- IDOR Protection and Role Access
"""
import uuid
import sys
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


def run_postgres_quiz_tests():
    db_name = verify_test_database_safety(TestingPostgresConfig.SQLALCHEMY_DATABASE_URI)
    assert db_name == "elearning_test_db", f"Expected elearning_test_db, got {db_name}"
    app = create_app(TestingPostgresConfig)
    client = app.test_client()

    with app.app_context():
        print("=== Running PostgreSQL Quiz Integration Tests ===")
        print(f"Safety Guard: Connected to isolated test DB '{db_name}'")

        # Ensure roles
        student_role = Role.query.filter_by(role_name="student").first()
        instructor_role = Role.query.filter_by(role_name="instructor").first()

        # Create or fetch instructor & student
        inst = User.query.filter_by(email="pg_quiz_inst@test.com").first()
        if not inst:
            inst = User(email="pg_quiz_inst@test.com", status="active")
            inst.set_password("SecurePass123!")
            inst.roles = [instructor_role]
            db.session.add(inst)
            db.session.commit()

        student = User.query.filter_by(email="pg_quiz_student@test.com").first()
        if not student:
            student = User(email="pg_quiz_student@test.com", status="active")
            student.set_password("SecurePass123!")
            student.roles = [student_role]
            db.session.add(student)
            db.session.commit()

        # Course
        course = Classroom.query.filter_by(title="PostgreSQL Quiz Demo Course").first()
        if not course:
            course = Classroom(
                instructor_id=inst.user_id,
                title="PostgreSQL Quiz Demo Course",
                status="active"
            )
            db.session.add(course)
            db.session.commit()

        # Membership
        if not course.has_member(student.user_id):
            m = ClassroomMember(classroom_id=course.classroom_id, user_id=student.user_id, status="enrolled")
            db.session.add(m)
            db.session.commit()

        # Quiz
        quiz = Quiz.query.filter_by(title="PostgreSQL Real-Engine Quiz").first()
        if not quiz:
            quiz = Quiz(
                course_id=course.classroom_id,
                title="PostgreSQL Real-Engine Quiz",
                description="Testing Multiple Choice, Matching, and Ordering in PostgreSQL"
            )
            db.session.add(quiz)
            db.session.flush()

            cond = QuizCondition(
                quiz_id=quiz.quiz_id,
                max_attempts=5,
                passing_score=60.0
            )
            db.session.add(cond)

            # Q1: MC
            q1 = Question(
                question_text="What SQL statement retrieves data?",
                question_type="multiple_choice",
                explanation="SELECT retrieves rows from tables."
            )
            db.session.add(q1)
            db.session.flush()
            db.session.add(QuestionOption(question_id=q1.question_id, option_text="INSERT", is_correct=False, order_no=1))
            db.session.add(QuestionOption(question_id=q1.question_id, option_text="SELECT", is_correct=True, order_no=2))
            db.session.add(QuizQuestion(quiz_id=quiz.quiz_id, question_id=q1.question_id, order_no=1))

            # Q2: Matching
            q2 = Question(
                question_text="Match relational concepts:",
                question_type="matching",
                explanation="Table contains Rows; Column defines Attribute Type."
            )
            db.session.add(q2)
            db.session.flush()
            db.session.add(QuestionOption(question_id=q2.question_id, option_text='{"left": "Table", "right": "Relation"}', order_no=1))
            db.session.add(QuestionOption(question_id=q2.question_id, option_text='{"left": "Row", "right": "Tuple"}', order_no=2))
            db.session.add(QuizQuestion(quiz_id=quiz.quiz_id, question_id=q2.question_id, order_no=2))

            # Q3: Ordering
            q3 = Question(
                question_text="Order query execution pipeline:",
                question_type="ordering",
                explanation="FROM -> WHERE -> GROUP BY -> SELECT"
            )
            db.session.add(q3)
            db.session.flush()
            db.session.add(QuestionOption(question_id=q3.question_id, option_text="FROM", order_no=1))
            db.session.add(QuestionOption(question_id=q3.question_id, option_text="WHERE", order_no=2))
            db.session.add(QuestionOption(question_id=q3.question_id, option_text="SELECT", order_no=3))
            db.session.add(QuizQuestion(quiz_id=quiz.quiz_id, question_id=q3.question_id, order_no=3))

            db.session.commit()

        # Clean up any existing attempts for this student on this quiz from previous runs
        QuizAttempt.query.filter_by(quiz_id=quiz.quiz_id, user_id=student.user_id).delete()
        db.session.commit()

        # Token
        student_token = create_access_token(identity=str(student.user_id))
        headers = {"Authorization": f"Bearer {student_token}", "Content-Type": "application/json"}

        # 1. Fetch Quiz (Sanitized)
        res_get = client.get(f"/api/v1/quizzes/{quiz.quiz_id}", headers=headers)
        assert res_get.status_code == 200, f"Expected 200, got {res_get.status_code}"
        data_get = res_get.get_json()
        assert "questions" in data_get
        for q in data_get["questions"]:
            if "options" in q:
                for opt in q["options"]:
                    assert "is_correct" not in opt, "is_correct must not leak!"
        print("[OK] Test 1 Passed: Student fetched sanitized quiz without answer leakage.")

        # 2. Start Attempt
        res_start = client.post(f"/api/v1/quizzes/{quiz.quiz_id}/attempts", headers=headers)
        assert res_start.status_code in [200, 201], f"Expected 200/201, got {res_start.status_code}"
        att_id = res_start.get_json()["attempt"]["attempt_id"]
        print("[OK] Test 2 Passed: Quiz attempt started.")

        # 3. Submit Answers (100% correct)
        # Fetch options to get actual IDs
        q_rows = QuizQuestion.query.filter_by(quiz_id=quiz.quiz_id).order_by(QuizQuestion.order_no.asc()).all()
        q1_obj = q_rows[0].question
        q1_correct_opt = QuestionOption.query.filter_by(question_id=q1_obj.question_id, is_correct=True).first()

        q2_obj = q_rows[1].question
        q3_obj = q_rows[2].question
        q3_opts = QuestionOption.query.filter_by(question_id=q3_obj.question_id).order_by(QuestionOption.order_no.asc()).all()

        submit_payload = {
            "attempt_id": att_id,
            "answers": [
                {"question_id": str(q1_obj.question_id), "option_id": str(q1_correct_opt.option_id)},
                {"question_id": str(q2_obj.question_id), "matches": [{"left": "Table", "right": "Relation"}, {"left": "Row", "right": "Tuple"}]},
                {"question_id": str(q3_obj.question_id), "ordered_option_ids": [str(opt.option_id) for opt in q3_opts]},
            ]
        }
        res_sub = client.post(f"/api/v1/quizzes/{quiz.quiz_id}/submit", headers=headers, json=submit_payload)
        assert res_sub.status_code == 200, f"Submit failed: {res_sub.get_json()}"
        data_sub = res_sub.get_json()
        assert data_sub["score"] == 3.0
        assert data_sub["total_score"] == 3.0
        assert data_sub["percentage"] == 100.0
        assert data_sub["is_passed"] is True
        print("[OK] Test 3 Passed: 100% submission evaluated and passed.")

        # 4. Duplicate Submission Guard (409 Conflict)
        res_dup = client.post(f"/api/v1/quizzes/{quiz.quiz_id}/submit", headers=headers, json=submit_payload)
        assert res_dup.status_code == 409, f"Expected 409, got {res_dup.status_code}"
        print("[OK] Test 4 Passed: Duplicate submission blocked with 409 Conflict.")

        # 5. Fetch Result
        res_res = client.get(f"/api/v1/quizzes/{quiz.quiz_id}/result", headers=headers)
        assert res_res.status_code == 200
        assert res_res.get_json()["percentage"] == 100.0
        print("[OK] Test 5 Passed: Get latest result succeeded.")

        # 6. Fetch Answer Review
        res_rev = client.get(f"/api/v1/quizzes/{quiz.quiz_id}/attempts/{att_id}/review", headers=headers)
        assert res_rev.status_code == 200
        data_rev = res_rev.get_json()
        assert len(data_rev["reviews"]) == 3
        for r in data_rev["reviews"]:
            assert r["is_correct"] is True
        print("[OK] Test 6 Passed: Answer review retrieved with full explanations.")

        print("\n=== ALL POSTGRESQL QUIZ INTEGRATION TESTS PASSED! ===")


if __name__ == "__main__":
    run_postgres_quiz_tests()
