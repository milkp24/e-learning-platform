import unittest
import json
from app import create_app, db
from app.models.user import User, UserProfile
from app.models.role import Role

class TestRegisterAndRegression(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()
        cls.ctx = cls.app.app_context()
        cls.ctx.push()

    @classmethod
    def tearDownClass(cls):
        cls.ctx.pop()

    def test_01_register_student_success(self):
        """Case 1: Register Student with institution fields -> Success, role=student"""
        # Cleanup test user if exists
        email = "student-new@test.com"
        u = User.query.filter_by(email=email).first()
        if u:
            db.session.delete(u)
            db.session.commit()

        payload = {
            "title": "นาย",
            "first_name": "Test",
            "last_name": "Student",
            "occupation": "นักเรียน",
            "institution_name": "Test University",
            "institution_email": "student@test.ac.th",
            "email": email,
            "password": "password123"
        }
        res = self.client.post("/api/v1/auth/register", json=payload)
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertEqual(data["user"]["role"], "student")
        self.assertEqual(data["user"]["display_name"], "Test Student")
        profile = data["user"]["profile"]
        self.assertEqual(profile["title"], "นาย")
        self.assertEqual(profile["first_name"], "Test")
        self.assertEqual(profile["last_name"], "Student")
        self.assertEqual(profile["occupation"], "นักเรียน")
        self.assertEqual(profile["institution_name"], "Test University")
        self.assertEqual(profile["institution_email"], "student@test.ac.th")

    def test_02_register_instructor_role_is_student(self):
        """Case 2: Register with occupation=อาจารย์ -> requires institution, role=student"""
        email = "teacher-new@test.com"
        u = User.query.filter_by(email=email).first()
        if u:
            db.session.delete(u)
            db.session.commit()

        # Missing institution_name
        res_fail = self.client.post("/api/v1/auth/register", json={
            "title": "นาง",
            "first_name": "Teacher",
            "last_name": "One",
            "occupation": "อาจารย์",
            "email": email,
            "password": "password123"
        })
        self.assertEqual(res_fail.status_code, 400)

        # Complete payload
        res_ok = self.client.post("/api/v1/auth/register", json={
            "title": "นาง",
            "first_name": "Teacher",
            "last_name": "One",
            "occupation": "อาจารย์",
            "institution_name": "Satit School",
            "institution_email": "teacher@school.ac.th",
            "email": email,
            "password": "password123"
        })
        self.assertEqual(res_ok.status_code, 201)
        data = res_ok.get_json()
        self.assertEqual(data["user"]["role"], "student")
        self.assertEqual(data["user"]["profile"]["occupation"], "อาจารย์")

    def test_03_register_general_no_institution(self):
        """Case 3: Register General (พนักงานบริษัท) -> No institution required"""
        email = "employee-new@test.com"
        u = User.query.filter_by(email=email).first()
        if u:
            db.session.delete(u)
            db.session.commit()

        res = self.client.post("/api/v1/auth/register", json={
            "title": "นาย",
            "first_name": "Officer",
            "last_name": "Work",
            "occupation": "พนักงานบริษัท",
            "email": email,
            "password": "password123"
        })
        self.assertEqual(res.status_code, 201)
        data = res.get_json()
        self.assertEqual(data["user"]["role"], "student")
        self.assertIsNone(data["user"]["profile"]["institution_name"])
        self.assertIsNone(data["user"]["profile"]["institution_email"])

    def test_04_validations(self):
        """Case 4: Validations (duplicate email, missing name, invalid email)"""
        # Duplicate email
        res_dup = self.client.post("/api/v1/auth/register", json={
            "title": "นาย",
            "first_name": "Dup",
            "last_name": "User",
            "occupation": "พนักงานบริษัท",
            "email": "student-new@test.com",
            "password": "password123"
        })
        self.assertEqual(res_dup.status_code, 409)

        # Invalid email format
        res_invalid_email = self.client.post("/api/v1/auth/register", json={
            "title": "นาย",
            "first_name": "Invalid",
            "last_name": "Email",
            "occupation": "พนักงานบริษัท",
            "email": "invalid-email",
            "password": "password123"
        })
        self.assertEqual(res_invalid_email.status_code, 400)

        # Password too short
        res_short_pwd = self.client.post("/api/v1/auth/register", json={
            "title": "นาย",
            "first_name": "Short",
            "last_name": "Pwd",
            "occupation": "พนักงานบริษัท",
            "email": "short-pwd@test.com",
            "password": "123"
        })
        self.assertEqual(res_short_pwd.status_code, 400)

    def test_05_login_newly_registered_user(self):
        """Case 5: Newly registered student logs in via /api/v1/auth/login"""
        res = self.client.post("/api/v1/auth/login", json={
            "email": "student-new@test.com",
            "password": "password123"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["email"], "student-new@test.com")
        self.assertEqual(data["user"]["display_name"], "Test Student")
        self.assertIn("student", data["user"]["roles"])

    def test_06_login_existing_user(self):
        """Case 6: Existing user (superadmin@test.com) logs in with intact display_name and roles"""
        res = self.client.post("/api/v1/auth/login", json={
            "email": "superadmin@test.com",
            "password": "SuperAdmin@123"
        })
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["email"], "superadmin@test.com")
        self.assertTrue(len(data["user"]["roles"]) > 0)


if __name__ == "__main__":
    unittest.main()
