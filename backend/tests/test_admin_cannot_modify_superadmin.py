# =====================================================================
# test_admin_cannot_modify_superadmin.py
# #22: Admin ทั่วไปต้องแก้ไขบัญชี Super Admin ผ่าน API โดยตรงไม่ได้ (ต้องได้ 403)
# ครอบคลุมทุกช่องทาง: แก้ข้อมูล / สถานะ / บทบาท / เพิ่ม-ลบ Role / ลบบัญชี
# รันกับ elearning_test_db เท่านั้น
#   cd backend
#   .\venv\Scripts\python -m pytest tests/test_admin_cannot_modify_superadmin.py -v
# =====================================================================

import unittest

from flask_jwt_extended import create_access_token

from app import create_app
from app.config import TestingPostgresConfig
from app.extensions import db
from app.models.role import Role
from app.models.user import User, UserProfile

ADMIN_EMAIL = "t22_admin@test.com"
SUPER_EMAIL = "t22_superadmin@test.com"
STUDENT_EMAIL = "t22_student@test.com"


def _ensure_user(email, role_names):
    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(email=email)
        user.set_password("Password123")
        db.session.add(user)
        db.session.flush()
        db.session.add(UserProfile(user_id=user.user_id, display_name=email.split("@")[0]))
    user.status = "active"
    user.roles = [Role.query.filter_by(role_name=n).first() for n in role_names]
    if user.profile:
        user.profile.display_name = email.split("@")[0]
    return user


class TestAdminCannotModifySuperAdmin(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app(config_class=TestingPostgresConfig)
        cls.client = cls.app.test_client()

    def setUp(self):
        with self.app.app_context():
            admin = _ensure_user(ADMIN_EMAIL, ["admin"])
            sa = _ensure_user(SUPER_EMAIL, ["super_admin"])
            st = _ensure_user(STUDENT_EMAIL, ["student"])
            db.session.commit()
            self.sa_id = str(sa.user_id)
            self.student_id = str(st.user_id)
            self.h = {"Authorization": f"Bearer {create_access_token(identity=str(admin.user_id))}"}

    def _snapshot(self):
        with self.app.app_context():
            u = db.session.get(User, self.sa_id)
            return (
                u.email,
                u.status,
                sorted(r.role_name for r in u.roles),
                u.profile.display_name if u.profile else None,
            )

    def _assert_forbidden(self, res, label):
        self.assertEqual(res.status_code, 403, f"{label}: {res.status_code} {res.get_json()}")

    def test_01_all_write_endpoints_return_403(self):
        before = self._snapshot()
        base = f"/api/v1/admin/users/{self.sa_id}"
        calls = [
            ("PUT profile", lambda: self.client.put(base, json={"display_name": "hacked"}, headers=self.h)),
            ("PATCH profile", lambda: self.client.patch(base, json={"display_name": "hacked"}, headers=self.h)),
            ("PUT status", lambda: self.client.put(f"{base}/status", json={"status": "suspended"}, headers=self.h)),
            ("PUT roles", lambda: self.client.put(f"{base}/roles", json={"roles": ["student"]}, headers=self.h)),
            ("POST add role", lambda: self.client.post(f"/api/v1/users/{self.sa_id}/roles", json={"role_name": "student"}, headers=self.h)),
            ("DELETE remove role", lambda: self.client.delete(f"/api/v1/users/{self.sa_id}/roles/super_admin", headers=self.h)),
            ("DELETE account", lambda: self.client.delete(base, headers=self.h)),
        ]
        for label, call in calls:
            self._assert_forbidden(call(), label)

        self.assertEqual(self._snapshot(), before, "Super Admin account must be unchanged")

    def test_02_admin_can_still_manage_normal_user(self):
        res = self.client.put(
            f"/api/v1/admin/users/{self.student_id}/status",
            json={"status": "inactive"},
            headers=self.h,
        )
        self.assertEqual(res.status_code, 200, res.get_json())


if __name__ == "__main__":
    unittest.main()
