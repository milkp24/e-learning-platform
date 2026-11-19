# =====================================================================
# test_profile_protected_fields.py
# FB-08: ห้ามแก้ไขอีเมลและบทบาทผ่าน PUT /api/v1/users/me/profile
# รันกับ elearning_test_db เท่านั้น (TestingPostgresConfig มี Safety Guard)
#   cd backend
#   .\venv\Scripts\python -m pytest tests/test_profile_protected_fields.py -v
# =====================================================================

import unittest

from flask_jwt_extended import create_access_token

from app import create_app
from app.config import TestingPostgresConfig
from app.extensions import db
from app.models.role import Role
from app.models.user import User, UserProfile

TEST_EMAIL = "fb08_profile_user@test.com"
URL = "/api/v1/users/me/profile"


class TestProfileProtectedFields(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app(config_class=TestingPostgresConfig)
        cls.client = cls.app.test_client()

    def setUp(self):
        with self.app.app_context():
            user = User.query.filter_by(email=TEST_EMAIL).first()
            if not user:
                user = User(email=TEST_EMAIL)
                user.set_password("Password123")
                db.session.add(user)
                db.session.flush()
            user.status = "active"
            student = Role.query.filter_by(role_name="student").first()
            user.roles = [student] if student else []
            if not user.profile:
                db.session.add(UserProfile(user_id=user.user_id, display_name="FB08 Original"))
            else:
                user.profile.display_name = "FB08 Original"
            db.session.commit()
            self.user_id = user.user_id
            self.headers = {"Authorization": f"Bearer {create_access_token(identity=str(user.user_id))}"}

    def _get_user(self):
        with self.app.app_context():
            u = db.session.get(User, self.user_id)
            return u.email, sorted(r.role_name for r in u.roles), u.profile.display_name

    def test_01_reject_email_change(self):
        res = self.client.put(URL, json={"display_name": "Hacked", "email": "evil@test.com"}, headers=self.headers)
        self.assertEqual(res.status_code, 400, res.get_json())
        self.assertIn("email", res.get_json()["message"])
        email, _, name = self._get_user()
        self.assertEqual(email, TEST_EMAIL)
        self.assertEqual(name, "FB08 Original", "no partial update allowed")

    def test_02_reject_role_change(self):
        for payload in ({"role": "admin"}, {"roles": ["super_admin"]}, {"status": "active", "display_name": "x y"}):
            res = self.client.put(URL, json=payload, headers=self.headers)
            self.assertEqual(res.status_code, 400, (payload, res.get_json()))
        _, roles, _ = self._get_user()
        self.assertEqual(roles, ["student"])

    def test_03_allowed_fields_still_work(self):
        res = self.client.put(URL, json={"display_name": "FB08 Updated"}, headers=self.headers)
        self.assertEqual(res.status_code, 200, res.get_json())
        _, _, name = self._get_user()
        self.assertEqual(name, "FB08 Updated")


if __name__ == "__main__":
    unittest.main()
