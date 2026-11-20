"""
test_uat_exercise_suite.py
Automated Verification Suite for UAT-EX-001 through UAT-EX-027.
Tests all Interactive Exercise capabilities required by the specification:
- UAT-EX-001: สร้าง Exercise
- UAT-EX-002: แก้ไข Exercise
- UAT-EX-003: ลบ Exercise
- UAT-EX-004: กำหนดคะแนน (total_score)
- UAT-EX-005: กำหนด XP (xp_reward)
- UAT-EX-006: กำหนดเวลา (time_limit)
- UAT-EX-007: กำหนดจำนวนครั้ง (max_attempts)
- UAT-EX-008: เพิ่ม Text Content
- UAT-EX-009: เพิ่ม Image Content
- UAT-EX-010: เพิ่ม Video Content
- UAT-EX-011: เพิ่ม Code Example Content
- UAT-EX-012: Fill in Code Activity
- UAT-EX-013: Debug Code Activity
- UAT-EX-014: Mission Activity
- UAT-EX-015: Checklist System
- UAT-EX-016: เริ่มทำ Exercise (Start attempt)
- UAT-EX-017: Server-side Timer & Time tracking
- UAT-EX-018: ส่งคำตอบ (Submit attempt)
- UAT-EX-019: คำนวณคะแนนอัตโนมัติ (Score calculation)
- UAT-EX-020: คำนวณและแจก XP (XP reward)
- UAT-EX-021: จำกัดจำนวนครั้ง (Enforce max attempts)
- UAT-EX-022: หมดเวลาทำข้อสอบ (Time expired handling)
- UAT-EX-023: แสดงผลลัพธ์ (Result card & breakdown)
- UAT-EX-024: ประวัติการทำ (Attempt history)
- UAT-EX-025: Student Access permissions
- UAT-EX-026: Instructor Access permissions
- UAT-EX-027: Unauthorized / Forbidden Access
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
from app.models.classroom import Classroom, ClassroomMember, Lesson
from app.models.exercise import Exercise, ExerciseAttempt
from app.models.gamification import UserXP, UserLevel, Level, Mission, MissionProgress
from app.models.progress import LessonProgress, LearningActivity


class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = "test-uat-exercise-secret-key-32bytes-string"


class TestUatExerciseSuite(unittest.TestCase):
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

        # Base level for gamification
        base_lvl = Level.query.filter_by(level_number=1).first()
        if not base_lvl:
            db.session.add(Level(level_number=1, title="Beginner", min_xp=0))
            db.session.commit()

        # Create instructor
        cls.instructor = User(email="inst_ex_uat@example.com", status="active")
        cls.instructor.set_password("SecurePass123!")
        cls.instructor.roles = [cls.instructor_role]
        db.session.add(cls.instructor)

        # Create student 1 (enrolled)
        cls.student1 = User(email="std1_ex_uat@example.com", status="active")
        cls.student1.set_password("SecurePass123!")
        cls.student1.roles = [cls.student_role]
        db.session.add(cls.student1)

        # Create student 2 (not enrolled)
        cls.student2 = User(email="std2_ex_uat@example.com", status="active")
        cls.student2.set_password("SecurePass123!")
        cls.student2.roles = [cls.student_role]
        db.session.add(cls.student2)

        db.session.commit()

        # Create Classroom
        cls.classroom = Classroom(
            instructor_id=cls.instructor.user_id,
            title="Interactive Programming with Python",
            status="active",
        )
        db.session.add(cls.classroom)
        db.session.flush()

        # Create Lesson
        cls.lesson = Lesson(
            classroom_id=cls.classroom.classroom_id,
            title="บทที่ 1: ตัวแปรและการแสดงผล",
            sequence_no=1,
            status="active"
        )
        db.session.add(cls.lesson)
        db.session.flush()

        # Enroll student1
        db.session.add(ClassroomMember(
            classroom_id=cls.classroom.classroom_id,
            user_id=cls.student1.user_id,
            status="enrolled"
        ))
        db.session.commit()

        # Create JWT Tokens
        cls.instructor_token = create_access_token(identity=str(cls.instructor.user_id))
        cls.student1_token = create_access_token(identity=str(cls.student1.user_id))
        cls.student2_token = create_access_token(identity=str(cls.student2.user_id))

        cls.inst_headers = {
            "Authorization": f"Bearer {cls.instructor_token}",
            "Content-Type": "application/json"
        }
        cls.std1_headers = {
            "Authorization": f"Bearer {cls.student1_token}",
            "Content-Type": "application/json"
        }
        cls.std2_headers = {
            "Authorization": f"Bearer {cls.student2_token}",
            "Content-Type": "application/json"
        }

    @classmethod
    def tearDownClass(cls):
        db.session.remove()
        db.drop_all()
        cls.ctx.pop()

    # =========================================================================
    # Test Group 1: UAT-EX-001 ถึง UAT-EX-007 (Exercise Management)
    # =========================================================================

    def test_01_exercise_crud_and_configurations(self):
        """Test UAT-EX-001 through UAT-EX-007 (Create, Update, Delete, Score, XP, Time, Attempts)."""
        # UAT-EX-001, 004, 005, 006, 007: Create Exercise with config
        create_payload = {
            "lesson_id": str(self.lesson.lesson_id),
            "title": "Mission: สร้างตัวแปรและพิมพ์ข้อความ",
            "instructions": "จงศึกษาเนื้อหาและทำกิจกรรมต่อไปนี้",
            "exercise_type": "practice",
            "total_score": 100,
            "xp_reward": 50,
            "time_limit": 20,
            "max_attempts": 2,
            "status": "published"
        }
        res = self.client.post("/api/v1/exercises", headers=self.inst_headers, data=json.dumps(create_payload))
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        ex_id = data["exercise"]["exercise_id"]
        self.assertEqual(data["exercise"]["title"], "Mission: สร้างตัวแปรและพิมพ์ข้อความ")
        self.assertEqual(data["exercise"]["total_score"], 100.0)
        self.assertEqual(data["exercise"]["xp_reward"], 50)
        self.assertEqual(data["exercise"]["time_limit"], 20)
        self.assertEqual(data["exercise"]["max_attempts"], 2)

        # UAT-EX-002: Update Exercise
        update_payload = {
            "title": "Mission: สร้างตัวแปรและพิมพ์ข้อความ (ฉบับปรับปรุง)",
            "xp_reward": 60,
            "total_score": 100
        }
        res_up = self.client.put(f"/api/v1/exercises/{ex_id}", headers=self.inst_headers, data=json.dumps(update_payload))
        self.assertEqual(res_up.status_code, 200)
        up_data = res_up.get_json()["exercise"]
        self.assertEqual(up_data["title"], "Mission: สร้างตัวแปรและพิมพ์ข้อความ (ฉบับปรับปรุง)")
        self.assertEqual(up_data["xp_reward"], 60)

        # UAT-EX-003: Delete Exercise
        # Create a temp exercise to test delete
        temp_res = self.client.post("/api/v1/exercises", headers=self.inst_headers, data=json.dumps({
            "lesson_id": str(self.lesson.lesson_id),
            "title": "Exercise to delete"
        }))
        temp_id = temp_res.get_json()["exercise"]["exercise_id"]
        del_res = self.client.delete(f"/api/v1/exercises/{temp_id}", headers=self.inst_headers)
        self.assertEqual(del_res.status_code, 200)

        # Verify 404 after delete
        chk_res = self.client.get(f"/api/v1/exercises/{temp_id}", headers=self.inst_headers)
        self.assertEqual(chk_res.status_code, 404)

    # =========================================================================
    # Test Group 2: UAT-EX-008 ถึง UAT-EX-011 (Content Sub-resources)
    # =========================================================================

    def test_02_content_management(self):
        """Test UAT-EX-008 to UAT-EX-011 (Add Text, Image, Video, Code Example)."""
        # Create exercise for content testing
        ex_res = self.client.post("/api/v1/exercises", headers=self.inst_headers, data=json.dumps({
            "lesson_id": str(self.lesson.lesson_id),
            "title": "Exercise for Content Test"
        }))
        ex_id = ex_res.get_json()["exercise"]["exercise_id"]

        # UAT-EX-008: Add Text Content
        res_text = self.client.post(f"/api/v1/exercises/{ex_id}/contents", headers=self.inst_headers, data=json.dumps({
            "type": "text",
            "title": "คำชี้แจง",
            "content_data": "ก่อนเริ่มทำแบบฝึกหัด ให้ศึกษาตัวอย่างโค้ดด้านล่างนี้"
        }))
        self.assertEqual(res_text.status_code, 201)
        text_id = res_text.get_json()["content"]["id"]

        # UAT-EX-009: Add Image Content
        res_img = self.client.post(f"/api/v1/exercises/{ex_id}/contents", headers=self.inst_headers, data=json.dumps({
            "type": "image",
            "caption": "แผนภาพแสดงหน่วยความจำ",
            "content_data": "https://example.com/memory-diagram.png"
        }))
        self.assertEqual(res_img.status_code, 201)

        # UAT-EX-010: Add Video Content
        res_vid = self.client.post(f"/api/v1/exercises/{ex_id}/contents", headers=self.inst_headers, data=json.dumps({
            "type": "video",
            "caption": "วิดีโออธิบายตัวแปร",
            "content_data": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        }))
        self.assertEqual(res_vid.status_code, 201)

        # UAT-EX-011: Add Code Example Content
        res_code = self.client.post(f"/api/v1/exercises/{ex_id}/contents", headers=self.inst_headers, data=json.dumps({
            "type": "code_example",
            "title": "ตัวอย่างโค้ดไพธอน",
            "content_data": "name = 'Milk'\nprint(name)",
            "language": "python"
        }))
        self.assertEqual(res_code.status_code, 201)

        # Verify all contents retrieved
        get_res = self.client.get(f"/api/v1/exercises/{ex_id}", headers=self.inst_headers)
        contents = get_res.get_json()["exercise"]["contents_data"]
        self.assertEqual(len(contents), 4)

        # Update and Delete a content item
        up_text = self.client.put(f"/api/v1/exercises/{ex_id}/contents/{text_id}", headers=self.inst_headers, data=json.dumps({
            "type": "text",
            "title": "คำชี้แจง (อัปเดต)",
            "content_data": "เนื้อหาที่แก้ไขแล้ว"
        }))
        self.assertEqual(up_text.status_code, 200)

        del_text = self.client.delete(f"/api/v1/exercises/{ex_id}/contents/{text_id}", headers=self.inst_headers)
        self.assertEqual(del_text.status_code, 200)

    # =========================================================================
    # Test Group 3: UAT-EX-012 ถึง UAT-EX-015 (Activities and Checklist)
    # =========================================================================

    def test_03_activities_and_checklists(self):
        """Test UAT-EX-012 to UAT-EX-015 (Fill Code, Debug Code, Mission, Checklist)."""
        ex_res = self.client.post("/api/v1/exercises", headers=self.inst_headers, data=json.dumps({
            "lesson_id": str(self.lesson.lesson_id),
            "title": "Exercise for Activities Test"
        }))
        ex_id = ex_res.get_json()["exercise"]["exercise_id"]

        # UAT-EX-012: Fill in Code Activity
        res_fill = self.client.post(f"/api/v1/exercises/{ex_id}/activities", headers=self.inst_headers, data=json.dumps({
            "type": "fill_code",
            "title": "เติมคำตอบในช่องว่าง",
            "instruction": "จงเติมชื่อตัวแปรที่ถูกต้อง",
            "code_template": 'const name = ______;\nconsole.log(name);',
            "correct_answer": '"Milk"',
            "score": 20,
            "hint": "ใส่เครื่องหมายคำพูดรอบข้อความ"
        }))
        self.assertEqual(res_fill.status_code, 201)

        # UAT-EX-013: Debug Code Activity
        res_debug = self.client.post(f"/api/v1/exercises/{ex_id}/activities", headers=self.inst_headers, data=json.dumps({
            "type": "debug_code",
            "title": "แก้ไขตัวแปรที่สะกดผิด",
            "instruction": "แก้ไขชื่อตัวแปรใน console.log ให้ถูกต้อง",
            "initial_code": 'let username = "Milk";\nconsole.log(usernmae);',
            "correct_code": 'let username = "Milk";\nconsole.log(username);',
            "score": 30,
            "hint": "สังเกตการสะกดคำว่า username"
        }))
        self.assertEqual(res_debug.status_code, 201)

        # UAT-EX-014: Mission Activity
        res_miss = self.client.post(f"/api/v1/exercises/{ex_id}/activities", headers=self.inst_headers, data=json.dumps({
            "type": "mission",
            "title": "Mission: สร้างหน้า Profile ของตัวเอง",
            "instruction": "สร้างหน้าเว็บส่วนตัวที่มีหัวเรื่อง รูปภาพ และคำอธิบาย",
            "score": 30
        }))
        self.assertEqual(res_miss.status_code, 201)

        # UAT-EX-015: Checklist Items
        res_ch1 = self.client.post(f"/api/v1/exercises/{ex_id}/checklists", headers=self.inst_headers, data=json.dumps({
            "title": "มี Heading ชัดเจน",
            "score": 10,
            "order": 1
        }))
        self.assertEqual(res_ch1.status_code, 201)

        res_ch2 = self.client.post(f"/api/v1/exercises/{ex_id}/checklists", headers=self.inst_headers, data=json.dumps({
            "title": "มีรูปภาพและคำอธิบายประกอบ",
            "score": 10,
            "order": 2
        }))
        self.assertEqual(res_ch2.status_code, 201)

        # Verify activity and checklist count
        get_res = self.client.get(f"/api/v1/exercises/{ex_id}", headers=self.inst_headers)
        ex_data = get_res.get_json()["exercise"]
        self.assertEqual(len(ex_data["activities_data"]), 3)
        self.assertEqual(len(ex_data["checklists_data"]), 2)

    # =========================================================================
    # Test Group 4: UAT-EX-016 ถึง UAT-EX-024 (Student Flow & Evaluation)
    # =========================================================================

    def test_04_student_flow_scoring_xp_and_attempts(self):
        """
        Comprehensive test for:
        - UAT-EX-016: เริ่มทำ Exercise
        - UAT-EX-017: Server-side Timer
        - UAT-EX-018: Submit
        - UAT-EX-019: Calculate Score (Activities + Checklists = Total)
        - UAT-EX-020: Calculate XP & Single XP per Exercise Rule
        - UAT-EX-021: Max Attempts Enforcement
        - UAT-EX-023: Get Result
        - UAT-EX-024: Attempt History
        """
        # Create full test exercise
        ex_res = self.client.post("/api/v1/exercises", headers=self.inst_headers, data=json.dumps({
            "lesson_id": str(self.lesson.lesson_id),
            "title": "Full Flow Interactive Exercise",
            "total_score": 100,
            "xp_reward": 50,
            "time_limit": 10,
            "max_attempts": 2,
            "status": "published",
            "activities_data": [
                {
                    "id": "act-1",
                    "type": "fill_code",
                    "title": "Fill variable",
                    "code_template": "const name = ______;",
                    "correct_answer": '"Milk"',
                    "score": 30
                },
                {
                    "id": "act-2",
                    "type": "debug_code",
                    "title": "Debug variable",
                    "initial_code": "let a = 1; console.log(b);",
                    "correct_code": "let a = 1; console.log(a);",
                    "score": 30
                }
            ],
            "checklists_data": [
                {
                    "id": "chk-1",
                    "title": "Checklist item 1",
                    "score": 20
                },
                {
                    "id": "chk-2",
                    "title": "Checklist item 2",
                    "score": 20
                }
            ]
        }))
        ex_id = ex_res.get_json()["exercise"]["exercise_id"]

        # Student gets details (solutions must be sanitized)
        std_get = self.client.get(f"/api/v1/exercises/{ex_id}", headers=self.std1_headers)
        self.assertEqual(std_get.status_code, 200)
        std_ex = std_get.get_json()["exercise"]
        self.assertNotIn("correct_answer", std_ex["activities_data"][0])
        self.assertNotIn("correct_code", std_ex["activities_data"][1])
        self.assertEqual(std_ex["remaining_attempts"], 2)

        # UAT-EX-016: Start Attempt 1
        start_res1 = self.client.post(f"/api/v1/exercises/{ex_id}/start", headers=self.std1_headers)
        self.assertEqual(start_res1.status_code, 201)
        att1 = start_res1.get_json()["attempt"]
        self.assertEqual(att1["status"], "in_progress")
        self.assertIsNotNone(att1["time_left_seconds"])

        # UAT-EX-018, 019, 020: Submit Attempt 1 with full correct answers
        submit_payload = {
            "answers": {
                "act-1": '"Milk"',
                "act-2": "let a = 1; console.log(a);"
            },
            "checklists": ["chk-1", "chk-2"]
        }
        sub_res1 = self.client.post(f"/api/v1/exercises/{ex_id}/submit", headers=self.std1_headers, data=json.dumps(submit_payload))
        self.assertEqual(sub_res1.status_code, 200)
        res1 = sub_res1.get_json()["result"]
        self.assertEqual(res1["score"], 100.0)
        self.assertEqual(res1["percentage"], 100.0)
        self.assertTrue(res1["is_passed"])
        self.assertEqual(res1["xp_earned"], 50)  # Awarded 50 XP on attempt 1!

        # Verify XP awarded in user_xps
        user_xp = UserXP.query.filter_by(user_id=self.student1.user_id, source_type="exercise").first()
        self.assertIsNotNone(user_xp)
        self.assertEqual(user_xp.amount, 50)

        # Verify LessonProgress updated to completed
        prog = LessonProgress.query.filter_by(user_id=self.student1.user_id, lesson_id=self.lesson.lesson_id).first()
        self.assertIsNotNone(prog)
        self.assertEqual(prog.status, "completed")

        # UAT-EX-023: Get Result
        res_endpoint = self.client.get(f"/api/v1/exercises/{ex_id}/result", headers=self.std1_headers)
        self.assertEqual(res_endpoint.status_code, 200)
        self.assertEqual(res_endpoint.get_json()["result"]["score"], 100.0)

        # Start Attempt 2 (Retake)
        start_res2 = self.client.post(f"/api/v1/exercises/{ex_id}/start", headers=self.std1_headers)
        self.assertEqual(start_res2.status_code, 201)

        # Submit Attempt 2 with partially correct answers
        sub_payload2 = {
            "answers": {
                "act-1": '"Milk"',  # +30
                "act-2": "wrong code"  # 0
            },
            "checklists": ["chk-1"]  # +20 -> Total 50
        }
        sub_res2 = self.client.post(f"/api/v1/exercises/{ex_id}/submit", headers=self.std1_headers, data=json.dumps(sub_payload2))
        self.assertEqual(sub_res2.status_code, 200)
        res2 = sub_res2.get_json()["result"]
        self.assertEqual(res2["score"], 50.0)
        # Verify Duplicate XP Prevention: Attempt 2 must NOT receive duplicate XP!
        self.assertEqual(res2["xp_earned"], 0, "Duplicate XP must not be awarded for retake attempts!")

        # Total XP logs for this exercise must still be exactly 1 record
        total_xp_logs = UserXP.query.filter_by(user_id=self.student1.user_id, source_type="exercise").count()
        self.assertEqual(total_xp_logs, 1)

        # UAT-EX-021: Max Attempts Enforcement
        # Attempt 3 should be rejected because max_attempts = 2
        start_res3 = self.client.post(f"/api/v1/exercises/{ex_id}/start", headers=self.std1_headers)
        self.assertEqual(start_res3.status_code, 403)
        self.assertIn("ครบกำหนดแล้ว", start_res3.get_json()["message"])

        # UAT-EX-024: Attempt History
        hist_res = self.client.get(f"/api/v1/exercises/{ex_id}/attempts", headers=self.std1_headers)
        self.assertEqual(hist_res.status_code, 200)
        self.assertEqual(hist_res.get_json()["total"], 2)

    # =========================================================================
    # Test Group 5: UAT-EX-022 (Time Expired Handling)
    # =========================================================================

    def test_05_time_expired_server_side_enforcement(self):
        """Test UAT-EX-022: Server calculates time elapsed and flags expired attempt."""
        ex_res = self.client.post("/api/v1/exercises", headers=self.inst_headers, data=json.dumps({
            "lesson_id": str(self.lesson.lesson_id),
            "title": "Strict Time Limit Exercise",
            "time_limit": 1,  # 1 minute limit
            "max_attempts": 3,
            "status": "published"
        }))
        ex_id = ex_res.get_json()["exercise"]["exercise_id"]

        # Start attempt
        start_res = self.client.post(f"/api/v1/exercises/{ex_id}/start", headers=self.std1_headers)
        self.assertEqual(start_res.status_code, 201)
        att_id = start_res.get_json()["attempt"]["attempt_id"]

        # Manually simulate time travel in DB: set started_at to 3 minutes ago
        attempt_obj = db.session.get(ExerciseAttempt, uuid.UUID(att_id))
        attempt_obj.started_at = datetime.now(timezone.utc) - timedelta(minutes=3)
        db.session.commit()

        # Submit attempt after time limit + grace
        sub_res = self.client.post(f"/api/v1/exercises/{ex_id}/submit", headers=self.std1_headers, data=json.dumps({
            "answers": {}
        }))
        self.assertEqual(sub_res.status_code, 200)
        res = sub_res.get_json()["result"]
        self.assertTrue(res["is_expired"], "Attempt submitted after time limit must be flagged as expired")
        self.assertFalse(res["is_passed"], "Expired attempt must not pass")

    # =========================================================================
    # Test Group 6: UAT-EX-025 ถึง UAT-EX-027 (Permissions & RBAC)
    # =========================================================================

    def test_06_rbac_and_permissions(self):
        """Test UAT-EX-025 (Student), UAT-EX-026 (Instructor), UAT-EX-027 (Unauthorized)."""
        # UAT-EX-027: Unenrolled student cannot start exercise
        ex_res = self.client.post("/api/v1/exercises", headers=self.inst_headers, data=json.dumps({
            "lesson_id": str(self.lesson.lesson_id),
            "title": "Members Only Exercise",
            "status": "published"
        }))
        ex_id = ex_res.get_json()["exercise"]["exercise_id"]

        # Student 2 is NOT enrolled
        res_std2 = self.client.post(f"/api/v1/exercises/{ex_id}/start", headers=self.std2_headers)
        self.assertEqual(res_std2.status_code, 403)

        # Student cannot create exercise
        std_create = self.client.post("/api/v1/exercises", headers=self.std1_headers, data=json.dumps({
            "lesson_id": str(self.lesson.lesson_id),
            "title": "Hacker Exercise"
        }))
        self.assertEqual(std_create.status_code, 403)

        # Unauthenticated request
        no_auth = self.client.post(f"/api/v1/exercises/{ex_id}/start")
        self.assertEqual(no_auth.status_code, 401)


if __name__ == "__main__":
    unittest.main()
