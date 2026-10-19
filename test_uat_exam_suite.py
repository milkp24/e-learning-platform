"""
test_uat_exam_suite.py
Verification suite for UAT-EXAM-001 through UAT-EXAM-016.
Tests all examination capabilities required by the specification:
- UAT-EXAM-001: ตรวจคำตอบปรนัยถูกต้อง
- UAT-EXAM-002: ตรวจคำตอบปรนัยผิด
- UAT-EXAM-003: ตรวจคำตอบจับคู่ (Matching)
- UAT-EXAM-004: ตรวจคำตอบเรียงลำดับ (Ordering)
- UAT-EXAM-005: คำนวณคะแนน (Score calculation)
- UAT-EXAM-006: ตรวจผ่าน/ไม่ผ่าน (Pass/Fail criteria)
- UAT-EXAM-007: แสดงเฉลยและคำอธิบาย (Answer Review & Explanation)
- UAT-EXAM-008: แสดงโจทย์และตัวเลือก (Display questions & sanitized options)
- UAT-EXAM-009: ส่งคำตอบ (Submit answers)
- UAT-EXAM-010: แสดงคะแนน (Display score)
- UAT-EXAM-011: แสดงเฉลย (Display correct answers)
- UAT-EXAM-012: จำกัดจำนวนครั้ง (Enforce attempt limit)
- UAT-EXAM-013: เพิ่มข้อสอบ (Instructor add exam)
- UAT-EXAM-014: แก้ไขข้อสอบ (Instructor edit exam & questions)
- UAT-EXAM-015: กำหนดเกณฑ์ผ่าน (Configure passing score)
- UAT-EXAM-016: กำหนดจำนวนครั้ง (Configure max attempts)
"""
import uuid
import json
import unittest
from datetime import datetime, timezone, timedelta
from flask_jwt_extended import create_access_token
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


class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = "test-uat-exam-secret-key-32bytes-long-string"


class TestUatExamSuite(unittest.TestCase):
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
        cls.admin_role = Role.query.filter_by(role_name="admin").first()

        # Create instructor
        cls.instructor = User(email="inst_uat@example.com", status="active")
        cls.instructor.set_password("SecurePass123!")
        cls.instructor.roles = [cls.instructor_role]
        db.session.add(cls.instructor)

        # Create admin
        cls.admin = User(email="admin_uat@example.com", status="active")
        cls.admin.set_password("SecurePass123!")
        cls.admin.roles = [cls.admin_role]
        db.session.add(cls.admin)

        # Create students
        cls.student1 = User(email="std1_uat@example.com", status="active")
        cls.student1.set_password("SecurePass123!")
        cls.student1.roles = [cls.student_role]
        db.session.add(cls.student1)

        cls.student2 = User(email="std2_uat@example.com", status="active")
        cls.student2.set_password("SecurePass123!")
        cls.student2.roles = [cls.student_role]
        db.session.add(cls.student2)

        db.session.commit()

        # Create Classroom
        cls.classroom = Classroom(
            instructor_id=cls.instructor.user_id,
            title="วิทยาการคอมพิวเตอร์เบื้องต้น",
            status="published",
        )
        db.session.add(cls.classroom)
        db.session.flush()

        # Enroll student1
        db.session.add(ClassroomMember(classroom_id=cls.classroom.classroom_id, user_id=cls.student1.user_id, status="enrolled"))
        db.session.commit()

        cls.inst_token = create_access_token(identity=str(cls.instructor.user_id))
        cls.admin_token = create_access_token(identity=str(cls.admin.user_id))
        cls.std1_token = create_access_token(identity=str(cls.student1.user_id))
        cls.std2_token = create_access_token(identity=str(cls.student2.user_id))

    @classmethod
    def tearDownClass(cls):
        db.session.remove()
        db.drop_all()
        cls.ctx.pop()

    def test_uat_exam_013_add_exam(self):
        """UAT-EXAM-013: เพิ่มข้อสอบโดยผู้สอน"""
        resp = self.client.post(
            "/api/v1/exams",
            headers={"Authorization": f"Bearer {self.inst_token}"},
            json={
                "course_id": str(self.classroom.classroom_id),
                "title": "แบบทดสอบท้ายบทเรียนที่ 1",
                "description": "ทดสอบความรู้เบื้องต้น",
                "passing_score": 75.0,
                "max_attempts": 2,
                "time_limit_minutes": 20,
            }
        )
        self.assertEqual(resp.status_code, 201)
        data = resp.get_json()
        self.assertIn("quiz", data)
        self.assertEqual(data["quiz"]["title"], "แบบทดสอบท้ายบทเรียนที่ 1")
        self.assertEqual(data["quiz"]["condition"]["passing_score"], 75.0)
        self.assertEqual(data["quiz"]["condition"]["max_attempts"], 2)

    def test_uat_exam_014_edit_exam(self):
        """UAT-EXAM-014: แก้ไขข้อสอบโดยผู้สอน"""
        # Create an exam first
        quiz = Quiz(course_id=self.classroom.classroom_id, title="Exam to Edit")
        db.session.add(quiz)
        db.session.flush()
        cond = QuizCondition(quiz_id=quiz.quiz_id, passing_score=60.0, max_attempts=1)
        db.session.add(cond)
        db.session.commit()

        resp = self.client.put(
            f"/api/v1/exams/{quiz.quiz_id}",
            headers={"Authorization": f"Bearer {self.inst_token}"},
            json={
                "title": "Exam Updated Title",
                "passing_score": 80.0,
                "max_attempts": 3,
            }
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertEqual(data["quiz"]["title"], "Exam Updated Title")
        self.assertEqual(data["quiz"]["condition"]["passing_score"], 80.0)
        self.assertEqual(data["quiz"]["condition"]["max_attempts"], 3)

    def test_uat_exam_015_016_passing_score_and_max_attempts(self):
        """UAT-EXAM-015 & UAT-EXAM-016: กำหนดเกณฑ์ผ่านและจำนวนครั้งที่ทำได้"""
        quiz = Quiz(course_id=self.classroom.classroom_id, title="Exam Threshold Test")
        db.session.add(quiz)
        db.session.flush()
        cond = QuizCondition(quiz_id=quiz.quiz_id, passing_score=85.5, max_attempts=4)
        db.session.add(cond)
        db.session.commit()

        resp = self.client.get(
            f"/api/v1/exams/{quiz.quiz_id}",
            headers={"Authorization": f"Bearer {self.std1_token}"}
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertEqual(data["condition"]["passing_score"], 85.5)
        self.assertEqual(data["max_attempts"], 4)

    def test_uat_exam_001_to_011_full_evaluation_lifecycle(self):
        """
        Covers:
        - UAT-EXAM-001 Multiple choice correct
        - UAT-EXAM-002 Multiple choice wrong
        - UAT-EXAM-003 Matching
        - UAT-EXAM-004 Ordering
        - UAT-EXAM-005 Score calculation
        - UAT-EXAM-006 Pass/Fail check
        - UAT-EXAM-007 Explanation display
        - UAT-EXAM-008 Question & sanitized options display
        - UAT-EXAM-009 Submit answer
        - UAT-EXAM-010 Display score
        - UAT-EXAM-011 Display correct answers
        """
        # 1. Setup Quiz with 4 questions:
        # Q1: Multiple choice (points=2.0)
        # Q2: Multiple choice (points=2.0)
        # Q3: Matching (points=3.0)
        # Q4: Ordering (points=3.0)
        # Total points = 10.0, passing_score = 70.0%
        quiz = Quiz(course_id=self.classroom.classroom_id, title="Comprehensive Exam")
        db.session.add(quiz)
        db.session.flush()

        cond = QuizCondition(quiz_id=quiz.quiz_id, passing_score=70.0, max_attempts=2)
        db.session.add(cond)

        # Q1: Multiple Choice
        q1 = Question(question_text="คำสั่งใดใช้แสดงผลในภาษา Python?", question_type="multiple_choice", points=2.0, explanation="ฟังก์ชัน print() ใช้สำหรับแสดงข้อความออกทางหน้าจอ")
        db.session.add(q1)
        db.session.flush()
        db.session.add(QuizQuestion(quiz_id=quiz.quiz_id, question_id=q1.question_id, order_no=1))
        opt1_corr = QuestionOption(question_id=q1.question_id, option_text="print()", is_correct=True, order_no=1)
        opt1_w1 = QuestionOption(question_id=q1.question_id, option_text="echo()", is_correct=False, order_no=2)
        opt1_w2 = QuestionOption(question_id=q1.question_id, option_text="display()", is_correct=False, order_no=3)
        db.session.add_all([opt1_corr, opt1_w1, opt1_w2])

        # Q2: Multiple Choice
        q2 = Question(question_text="ชนิดข้อมูลใดเก็บทศนิยม?", question_type="multiple_choice", points=2.0, explanation="float คือชนิดข้อมูลตัวเลขทศนิยม")
        db.session.add(q2)
        db.session.flush()
        db.session.add(QuizQuestion(quiz_id=quiz.quiz_id, question_id=q2.question_id, order_no=2))
        opt2_corr = QuestionOption(question_id=q2.question_id, option_text="float", is_correct=True, order_no=1)
        opt2_w1 = QuestionOption(question_id=q2.question_id, option_text="int", is_correct=False, order_no=2)
        db.session.add_all([opt2_corr, opt2_w1])

        # Q3: Matching
        q3 = Question(question_text="จับคู่ภาษาโปรแกรมกับผู้สร้าง", question_type="matching", points=3.0, explanation="Python สร้างโดย Guido, JS สร้างโดย Brendan")
        db.session.add(q3)
        db.session.flush()
        db.session.add(QuizQuestion(quiz_id=quiz.quiz_id, question_id=q3.question_id, order_no=3))
        m_opt1 = QuestionOption(question_id=q3.question_id, option_text="Python -> Guido van Rossum", order_no=1)
        m_opt2 = QuestionOption(question_id=q3.question_id, option_text="JavaScript -> Brendan Eich", order_no=2)
        db.session.add_all([m_opt1, m_opt2])

        # Q4: Ordering
        q4 = Question(question_text="เรียงลำดับขั้นตอน Software Development Life Cycle", question_type="ordering", points=3.0, explanation="ลำดับที่ถูกต้อง: Requirements -> Design -> Coding")
        db.session.add(q4)
        db.session.flush()
        db.session.add(QuizQuestion(quiz_id=quiz.quiz_id, question_id=q4.question_id, order_no=4))
        ord_opt1 = QuestionOption(question_id=q4.question_id, option_text="Requirements", order_no=1)
        ord_opt2 = QuestionOption(question_id=q4.question_id, option_text="Design", order_no=2)
        ord_opt3 = QuestionOption(question_id=q4.question_id, option_text="Coding", order_no=3)
        db.session.add_all([ord_opt1, ord_opt2, ord_opt3])

        db.session.commit()

        # UAT-EXAM-008: แสดงโจทย์และตัวเลือกแบบ Sanitized
        resp = self.client.get(
            f"/api/v1/exams/{quiz.quiz_id}",
            headers={"Authorization": f"Bearer {self.std1_token}"}
        )
        self.assertEqual(resp.status_code, 200)
        quiz_data = resp.get_json()
        self.assertEqual(len(quiz_data["questions"]), 4)
        for q in quiz_data["questions"]:
            self.assertNotIn("explanation", q, "Information leakage: explanation shown before submission!")
            if q["question_type"] == "multiple_choice":
                for opt in q["options"]:
                    self.assertNotIn("is_correct", opt, "Information leakage: is_correct shown before submission!")

        # UAT-EXAM-009 & UAT-EXAM-001, 002, 003, 004, 005, 006, 010, 011:
        # Student answers:
        # Q1: Correct (print()) -> 2.0 pts
        # Q2: Wrong (int) -> 0.0 pts
        # Q3: All Correct -> 3.0 pts
        # Q4: All Correct -> 3.0 pts
        # Total = 8.0 / 10.0 = 80.0% >= 70.0% -> PASSED!
        submit_payload = {
            "answers": [
                {"question_id": str(q1.question_id), "option_id": str(opt1_corr.option_id)},
                {"question_id": str(q2.question_id), "option_id": str(opt2_w1.option_id)},
                {
                    "question_id": str(q3.question_id),
                    "matches": [
                        {"left": "Python", "right": "Guido van Rossum"},
                        {"left": "JavaScript", "right": "Brendan Eich"},
                    ]
                },
                {
                    "question_id": str(q4.question_id),
                    "ordered_option_ids": [
                        str(ord_opt1.option_id),
                        str(ord_opt2.option_id),
                        str(ord_opt3.option_id),
                    ]
                }
            ]
        }

        start_resp = self.client.post(
            f"/api/v1/exams/{quiz.quiz_id}/attempts",
            headers={"Authorization": f"Bearer {self.std1_token}"}
        )
        self.assertEqual(start_resp.status_code, 201)
        submit_payload["attempt_id"] = start_resp.get_json()["attempt"]["attempt_id"]

        submit_resp = self.client.post(
            f"/api/v1/exams/{quiz.quiz_id}/submit",
            headers={"Authorization": f"Bearer {self.std1_token}"},
            json=submit_payload
        )
        self.assertEqual(submit_resp.status_code, 200)
        res_data = submit_resp.get_json()

        # UAT-EXAM-005: คำนวณคะแนน
        self.assertEqual(res_data["score"], 8.0)
        self.assertEqual(res_data["total_score"], 10.0)
        self.assertEqual(res_data["percentage"], 80.0)

        # UAT-EXAM-006: ตรวจผ่าน/ไม่ผ่าน
        self.assertTrue(res_data["is_passed"])
        self.assertTrue(res_data["passed"])

        # UAT-EXAM-010: แสดงคะแนน
        self.assertIn("score", res_data)

        # UAT-EXAM-007 & 011: แสดงเฉลยและคำอธิบาย
        self.assertIn("reviews", res_data)
        reviews = res_data["reviews"]
        self.assertEqual(len(reviews), 4)

        # Q1 review: correct
        self.assertTrue(reviews[0]["is_correct"])
        self.assertEqual(reviews[0]["score"], 2.0)
        self.assertEqual(reviews[0]["explanation"], "ฟังก์ชัน print() ใช้สำหรับแสดงข้อความออกทางหน้าจอ")

        # Q2 review: wrong
        self.assertFalse(reviews[1]["is_correct"])
        self.assertEqual(reviews[1]["score"], 0.0)
        self.assertEqual(reviews[1]["correct_answer"], "float")
        self.assertEqual(reviews[1]["explanation"], "float คือชนิดข้อมูลตัวเลขทศนิยม")

        # Q3 review: matching correct
        self.assertTrue(reviews[2]["is_correct"])
        self.assertEqual(reviews[2]["score"], 3.0)

        # Q4 review: ordering correct
        self.assertTrue(reviews[3]["is_correct"])
        self.assertEqual(reviews[3]["score"], 3.0)

        # Attempts count
        self.assertEqual(res_data["attempts_count"], 1)
        self.assertEqual(res_data["remaining_attempts"], 1)

    def test_uat_exam_012_attempt_limit_enforced(self):
        """UAT-EXAM-012: ป้องกันการทำเกินจำนวนครั้ง (Attempt Limit)"""
        # Create an exam with max_attempts = 1
        quiz = Quiz(course_id=self.classroom.classroom_id, title="Single Attempt Quiz")
        db.session.add(quiz)
        db.session.flush()
        cond = QuizCondition(quiz_id=quiz.quiz_id, passing_score=50.0, max_attempts=1)
        db.session.add(cond)

        q = Question(question_text="Q1", question_type="multiple_choice", points=1.0)
        db.session.add(q)
        db.session.flush()
        db.session.add(QuizQuestion(quiz_id=quiz.quiz_id, question_id=q.question_id, order_no=1))
        opt = QuestionOption(question_id=q.question_id, option_text="A", is_correct=True, order_no=1)
        db.session.add(opt)
        db.session.commit()

        # Start attempt 1
        start1 = self.client.post(
            f"/api/v1/exams/{quiz.quiz_id}/attempts",
            headers={"Authorization": f"Bearer {self.std1_token}"}
        )
        self.assertEqual(start1.status_code, 201)
        att1_id = start1.get_json()["attempt"]["attempt_id"]

        # Submit attempt 1
        resp1 = self.client.post(
            f"/api/v1/exams/{quiz.quiz_id}/submit",
            headers={"Authorization": f"Bearer {self.std1_token}"},
            json={"attempt_id": att1_id, "answers": [{"question_id": str(q.question_id), "option_id": str(opt.option_id)}]}
        )
        self.assertEqual(resp1.status_code, 200)

        # Attempt 2 should be rejected with 400 Bad Request
        resp2 = self.client.post(
            f"/api/v1/exams/{quiz.quiz_id}/attempts",
            headers={"Authorization": f"Bearer {self.std1_token}"}
        )
        self.assertEqual(resp2.status_code, 400)
        self.assertIn("Maximum attempts reached", resp2.get_json()["message"])

        # Also submit attempt 2 without attempt_id should be blocked (400)
        resp3 = self.client.post(
            f"/api/v1/exams/{quiz.quiz_id}/submit",
            headers={"Authorization": f"Bearer {self.std1_token}"},
            json={"answers": [{"question_id": str(q.question_id), "option_id": str(opt.option_id)}]}
        )
        self.assertEqual(resp3.status_code, 400)



    def test_17_exam_time_limit_server_side_enforcement(self):
        """UAT-EXAM-017: Server-Side Time Limit Enforcement (Single Source of Truth)."""
        # Create exam with 5 minutes time limit
        quiz = Quiz(course_id=self.classroom.classroom_id, title="Timed Physics Exam")
        db.session.add(quiz)
        db.session.flush()
        cond = QuizCondition(quiz_id=quiz.quiz_id, time_limit_minutes=5, passing_score=50.0, max_attempts=3)
        db.session.add(cond)

        q = Question(question_text="Force = ?", question_type="multiple_choice", points=10.0)
        db.session.add(q)
        db.session.flush()
        db.session.add(QuizQuestion(quiz_id=quiz.quiz_id, question_id=q.question_id, order_no=1))
        opt = QuestionOption(question_id=q.question_id, option_text="m * a", is_correct=True, order_no=1)
        db.session.add(opt)
        db.session.commit()

        # 1. Attempt submitted within time limit -> PASS (200)
        start1 = self.client.post(f"/api/v1/exams/{quiz.quiz_id}/attempts", headers={"Authorization": f"Bearer {self.std1_token}"})
        self.assertEqual(start1.status_code, 201)
        att1_id = start1.get_json()["attempt"]["attempt_id"]

        att1 = db.session.get(QuizAttempt, uuid.UUID(att1_id))
        att1.started_at = datetime.now(timezone.utc) - timedelta(minutes=3)
        db.session.commit()

        sub1 = self.client.post(
            f"/api/v1/exams/{quiz.quiz_id}/submit",
            headers={"Authorization": f"Bearer {self.std1_token}"},
            json={"attempt_id": att1_id, "answers": [{"question_id": str(q.question_id), "option_id": str(opt.option_id)}]}
        )
        self.assertEqual(sub1.status_code, 200)
        self.assertEqual(sub1.get_json()["score"], 10.0)

        # 2. Attempt submitted within grace period (5 mins + 20s) -> PASS (200)
        start2 = self.client.post(f"/api/v1/exams/{quiz.quiz_id}/attempts", headers={"Authorization": f"Bearer {self.std1_token}"})
        self.assertEqual(start2.status_code, 201)
        att2_id = start2.get_json()["attempt"]["attempt_id"]

        att2 = db.session.get(QuizAttempt, uuid.UUID(att2_id))
        att2.started_at = datetime.now(timezone.utc) - timedelta(minutes=5, seconds=20)
        db.session.commit()

        sub2 = self.client.post(
            f"/api/v1/exams/{quiz.quiz_id}/submit",
            headers={"Authorization": f"Bearer {self.std1_token}"},
            json={"attempt_id": att2_id, "answers": [{"question_id": str(q.question_id), "option_id": str(opt.option_id)}]}
        )
        self.assertEqual(sub2.status_code, 200)

        # 3. Attempt submitted after grace period (5 mins + 40s) -> REJECTED (400) and marked expired
        start3 = self.client.post(f"/api/v1/exams/{quiz.quiz_id}/attempts", headers={"Authorization": f"Bearer {self.std1_token}"})
        self.assertEqual(start3.status_code, 201)
        att3_id = start3.get_json()["attempt"]["attempt_id"]

        att3 = db.session.get(QuizAttempt, uuid.UUID(att3_id))
        att3.started_at = datetime.now(timezone.utc) - timedelta(minutes=5, seconds=40)
        db.session.commit()

        sub3 = self.client.post(
            f"/api/v1/exams/{quiz.quiz_id}/submit",
            headers={"Authorization": f"Bearer {self.std1_token}"},
            json={"attempt_id": att3_id, "answers": [{"question_id": str(q.question_id), "option_id": str(opt.option_id)}]}
        )
        self.assertEqual(sub3.status_code, 400)
        self.assertIn("Time limit exceeded", sub3.get_json()["message"])

        db.session.refresh(att3)
        self.assertEqual(att3.status, "expired")
        self.assertIsNone(att3.result)

    def test_uat_exam_019_attempt_history(self):
        """UAT-EXAM-019: ประวัติการสอบของผู้เรียน (Attempt History & Isolation)"""
        # 1. สร้างข้อสอบสำหรับทดสอบประวัติ
        quiz = Quiz(course_id=self.classroom.classroom_id, title="History Verification Exam")
        db.session.add(quiz)
        db.session.flush()
        db.session.add(QuizCondition(quiz_id=quiz.quiz_id, passing_score=50.0, max_attempts=3))

        q = Question(question_text="Q_Hist", question_type="multiple_choice", points=10.0)
        db.session.add(q)
        db.session.flush()
        db.session.add(QuizQuestion(quiz_id=quiz.quiz_id, question_id=q.question_id, order_no=1))
        opt = QuestionOption(question_id=q.question_id, option_text="Answer", is_correct=True, order_no=1)
        db.session.add(opt)
        db.session.commit()

        # 2. ก่อนเริ่มสอบ: student1 เรียกดูประวัติ -> ต้องได้ HTTP 200 พร้อม attempts ว่างเปล่า []
        pre_resp = self.client.get(
            f"/api/v1/exams/{quiz.quiz_id}/attempts",
            headers={"Authorization": f"Bearer {self.std1_token}"}
        )
        self.assertEqual(pre_resp.status_code, 200)
        self.assertEqual(pre_resp.get_json()["attempts"], [])

        # 3. student1 เริ่มทำข้อสอบและส่งคำตอบ
        start_res = self.client.post(
            f"/api/v1/exams/{quiz.quiz_id}/attempts",
            headers={"Authorization": f"Bearer {self.std1_token}"}
        )
        self.assertEqual(start_res.status_code, 201)
        att_id = start_res.get_json()["attempt"]["attempt_id"]

        sub_res = self.client.post(
            f"/api/v1/exams/{quiz.quiz_id}/submit",
            headers={"Authorization": f"Bearer {self.std1_token}"},
            json={"attempt_id": att_id, "answers": [{"question_id": str(q.question_id), "option_id": str(opt.option_id)}]}
        )
        self.assertEqual(sub_res.status_code, 200)

        # 4. student1 เรียกดูประวัติการสอบของตนเอง -> ต้องพบ 1 attempt ที่มีคะแนนและสถานะถูกต้อง
        hist_resp = self.client.get(
            f"/api/v1/exams/{quiz.quiz_id}/attempts",
            headers={"Authorization": f"Bearer {self.std1_token}"}
        )
        self.assertEqual(hist_resp.status_code, 200)
        stu_attempts = hist_resp.get_json()["attempts"]
        self.assertEqual(len(stu_attempts), 1)
        self.assertEqual(stu_attempts[0]["attempt_id"], att_id)
        self.assertEqual(stu_attempts[0]["score"], 10.0)
        self.assertTrue(stu_attempts[0]["is_passed"])
        self.assertIn("time_spent", stu_attempts[0])

        # 5. การควบคุมสิทธิ์ (Isolation): student2 (ผู้เรียนคนอื่น) เรียกดูข้อสอบนี้ -> ต้องไม่เห็น attempt ของ student1
        std2_resp = self.client.get(
            f"/api/v1/exams/{quiz.quiz_id}/attempts",
            headers={"Authorization": f"Bearer {self.std2_token}"}
        )
        self.assertEqual(std2_resp.status_code, 200)
        self.assertEqual(std2_resp.get_json()["attempts"], [])

        # 6. ผู้สอน (Instructor เจ้าของคอร์ส) เรียกดู -> ต้องเห็น attempt ของผู้เรียนทุกคน
        inst_resp = self.client.get(
            f"/api/v1/exams/{quiz.quiz_id}/attempts",
            headers={"Authorization": f"Bearer {self.inst_token}"}
        )
        self.assertEqual(inst_resp.status_code, 200)
        inst_attempts = inst_resp.get_json()["attempts"]
        self.assertEqual(len(inst_attempts), 1)
        self.assertEqual(inst_attempts[0]["attempt_id"], att_id)

        # 7. ผู้ดูแลระบบ (Admin) เรียกดู -> ต้องเห็น attempt ของผู้เรียนทุกคนเช่นเดียวกับผู้สอน
        admin_resp = self.client.get(
            f"/api/v1/exams/{quiz.quiz_id}/attempts",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(admin_resp.status_code, 200)
        admin_attempts = admin_resp.get_json()["attempts"]
        self.assertEqual(len(admin_attempts), 1)
        self.assertEqual(admin_attempts[0]["attempt_id"], att_id)
        self.assertEqual(admin_attempts[0]["user_email"], "std1_uat@example.com")

    def test_uat_exam_019_service_attempt_history_and_rbac(self):
        """UAT-EXAM-019: ตรวจสอบระดับ Service Layer โดยตรง (list_quiz_attempts_service & RBAC)"""
        from app.services.quiz_service import list_quiz_attempts_service

        quiz = Quiz(course_id=self.classroom.classroom_id, title="Service Layer History Exam")
        db.session.add(quiz)
        db.session.flush()
        db.session.add(QuizCondition(quiz_id=quiz.quiz_id, passing_score=50.0, max_attempts=3))

        q = Question(question_text="Q_Serv", question_type="multiple_choice", points=10.0)
        db.session.add(q)
        db.session.flush()
        db.session.add(QuizQuestion(quiz_id=quiz.quiz_id, question_id=q.question_id, order_no=1))
        opt = QuestionOption(question_id=q.question_id, option_text="Answer", is_correct=True, order_no=1)
        db.session.add(opt)
        db.session.commit()

        # สร้าง attempt และ submit ผ่าน endpoint เพื่อให้มีข้อมูลใน DB
        start_res = self.client.post(
            f"/api/v1/exams/{quiz.quiz_id}/attempts",
            headers={"Authorization": f"Bearer {self.std1_token}"}
        )
        att_id = start_res.get_json()["attempt"]["attempt_id"]
        self.client.post(
            f"/api/v1/exams/{quiz.quiz_id}/submit",
            headers={"Authorization": f"Bearer {self.std1_token}"},
            json={"attempt_id": att_id, "answers": [{"question_id": str(q.question_id), "option_id": str(opt.option_id)}]}
        )

        # 1. ทดสอบ Service กับ student1 -> ได้ 1 attempt (ของตนเอง)
        s1_data, s1_msg, s1_code = list_quiz_attempts_service(quiz.quiz_id, self.student1)
        self.assertEqual(s1_code, 200)
        self.assertEqual(len(s1_data), 1)
        self.assertEqual(s1_data[0]["user_id"], str(self.student1.user_id))
        self.assertEqual(s1_data[0]["attempt_id"], att_id)

        # 2. ทดสอบ Service กับ student2 -> ได้ 0 attempt (Data Isolation)
        s2_data, s2_msg, s2_code = list_quiz_attempts_service(quiz.quiz_id, self.student2)
        self.assertEqual(s2_code, 200)
        self.assertEqual(len(s2_data), 0)

        # 3. ทดสอบ Service กับ instructor -> ได้ 1 attempt พร้อมข้อมูลนักเรียน (user_display_name, email)
        inst_data, inst_msg, inst_code = list_quiz_attempts_service(quiz.quiz_id, self.instructor)
        self.assertEqual(inst_code, 200)
        self.assertEqual(len(inst_data), 1)
        self.assertEqual(inst_data[0]["user_email"], self.student1.email)

        # 4. ทดสอบ Service กับ admin -> ได้ 1 attempt พร้อมข้อมูลนักเรียน (user_display_name, email)
        admin_data, admin_msg, admin_code = list_quiz_attempts_service(quiz.quiz_id, self.admin)
        self.assertEqual(admin_code, 200)
        self.assertEqual(len(admin_data), 1)
        self.assertEqual(admin_data[0]["user_email"], self.student1.email)

    def test_uat_exam_027_empty_questions_quiz_rejected(self):
        """UAT-EXAM-027: ป้องกันทำข้อสอบที่ไม่มีคำถาม (Empty Questions Quiz Rejection) พร้อมตรวจระเบียนใน DB"""
        # 1. สร้างข้อสอบที่ไม่มีคำถาม
        empty_quiz = Quiz(
            course_id=self.classroom.classroom_id,
            title="Empty Questions Exam",
            description="Exam without any questions"
        )
        db.session.add(empty_quiz)
        db.session.flush()
        db.session.add(QuizCondition(quiz_id=empty_quiz.quiz_id, passing_score=60.0, max_attempts=2))
        db.session.commit()

        # 2. เริ่มทำข้อสอบ (Start Attempt)
        start_res = self.client.post(
            f"/api/v1/exams/{empty_quiz.quiz_id}/attempts",
            headers={"Authorization": f"Bearer {self.std1_token}"}
        )
        self.assertEqual(start_res.status_code, 201)
        att_id = start_res.get_json()["attempt"]["attempt_id"]

        # ตรวจสอบจำนวนระเบียนก่อนส่งคำตอบ (Pre-submission Database Counts)
        attempts_before = QuizAttempt.query.filter_by(quiz_id=empty_quiz.quiz_id).count()
        results_before = QuizResult.query.filter_by(attempt_id=uuid.UUID(att_id)).count()
        answers_before = QuizAnswer.query.filter_by(attempt_id=uuid.UUID(att_id)).count()

        self.assertEqual(attempts_before, 1, "Should have exactly 1 attempt created at start_attempt")
        self.assertEqual(results_before, 0, "Should have 0 QuizResult before submission")
        self.assertEqual(answers_before, 0, "Should have 0 QuizAnswer before submission")

        # 3. ส่งคำตอบ (Submit) กับข้อสอบที่ไม่มีคำถาม -> ต้องถูกปฏิเสธด้วย 400 Bad Request
        sub_res = self.client.post(
            f"/api/v1/exams/{empty_quiz.quiz_id}/submit",
            headers={"Authorization": f"Bearer {self.std1_token}"},
            json={"attempt_id": att_id, "answers": []}
        )
        self.assertEqual(sub_res.status_code, 400)
        data = sub_res.get_json()
        self.assertIn("This quiz currently has no questions.", data.get("message", ""))

        # ตรวจสอบจำนวนระเบียนหลังส่งคำตอบที่ถูกปฏิเสธ (Post-rejection Database Counts)
        attempts_after = QuizAttempt.query.filter_by(quiz_id=empty_quiz.quiz_id).count()
        results_after = QuizResult.query.filter_by(attempt_id=uuid.UUID(att_id)).count()
        answers_after = QuizAnswer.query.filter_by(attempt_id=uuid.UUID(att_id)).count()

        self.assertEqual(attempts_after, 1, "QuizAttempt count must remain 1 (no duplicate attempts)")
        self.assertEqual(results_after, 0, "QuizResult count must remain 0 (no result record created)")
        self.assertEqual(answers_after, 0, "QuizAnswer count must remain 0 (no answer records created)")

        # สถานะของ Attempt ต้องยังคงเป็น in_progress ไม่ถูกเปลี่ยนเป็น completed
        attempt_obj = db.session.get(QuizAttempt, uuid.UUID(att_id))
        self.assertEqual(attempt_obj.status, "in_progress")
        self.assertIsNone(attempt_obj.submitted_at)


if __name__ == "__main__":
    unittest.main()


