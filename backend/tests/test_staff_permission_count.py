# =====================================================================
# test_staff_permission_count.py
# FB-18: ตัวเลขจำนวนสิทธิ์ต้องถูกต้อง และอัปเดตทันทีหลังเปลี่ยนสิทธิ์
# - บัญชีที่มีหลาย Role: นับสิทธิ์แบบ union (ไม่นับซ้ำ)
# - หลังแก้สิทธิ์ของ Role ผ่าน API ค่า permission_count ใน /admin/staff ต้องเปลี่ยนทันที
# รันกับ elearning_test_db เท่านั้น
#   cd backend
#   .\venv\Scripts\python -m pytest tests/test_staff_permission_count.py -v
# =====================================================================

import unittest

from flask_jwt_extended import create_access_token

from app import create_app
from app.config import TestingPostgresConfig
from app.extensions import db
from app.models.role import Permission, Role
from app.models.user import User, UserProfile

SUPER_EMAIL = "fb18_superadmin@test.com"
MULTI_EMAIL = "fb18_multirole@test.com"


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
    return user


class TestStaffPermissionCount(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app(config_class=TestingPostgresConfig)
        cls.client = cls.app.test_client()
        with cls.app.app_context():
            sa = _ensure_user(SUPER_EMAIL, ["super_admin"])
            mu = _ensure_user(MULTI_EMAIL, ["admin", "instructor"])
            db.session.commit()
            cls.multi_id = str(mu.user_id)
            cls.headers = {"Authorization": f"Bearer {create_access_token(identity=str(sa.user_id))}"}
            instructor = Role.query.filter_by(role_name="instructor").first()
            cls.original_instructor_perms = [p.permission_name for p in instructor.permissions.all()]

    @classmethod
    def tearDownClass(cls):
        # คืนค่าสิทธิ์เดิมของ instructor
        cls.client.put(
            "/api/v1/roles/instructor/permissions",
            json={"permissions": cls.original_instructor_perms},
            headers=cls.headers,
        )

    def _staff_entry(self):
        res = self.client.get("/api/v1/admin/staff", headers=self.headers)
        self.assertEqual(res.status_code, 200, res.get_json())
        data = res.get_json()
        entry = next(s for s in data["staff"] if s["id"] == self.multi_id)
        return data, entry

    def _expected_union(self):
        with self.app.app_context():
            names = set()
            for rn in ("admin", "instructor"):
                role = Role.query.filter_by(role_name=rn).first()
                names |= {p.permission_name for p in role.permissions.all()}
            return names

    def test_01_total_permissions_matches_db(self):
        data, _ = self._staff_entry()
        with self.app.app_context():
            self.assertEqual(data["total_permissions"], Permission.query.count())

    def test_02_multi_role_counted_as_union(self):
        _, entry = self._staff_entry()
        expected = self._expected_union()
        self.assertEqual(set(entry["permissions"]), expected)
        self.assertEqual(entry["permission_count"], len(expected))
        self.assertEqual(len(entry["permissions"]), len(set(entry["permissions"])), "no duplicates")

    def test_03_count_updates_immediately_after_role_change(self):
        with self.app.app_context():
            admin_perms = {
                p.permission_name
                for p in Role.query.filter_by(role_name="admin").first().permissions.all()
            }
            extra = sorted(
                p.permission_name for p in Permission.query.all() if p.permission_name not in admin_perms
            )
        if not extra:
            self.skipTest("admin role already has every permission")

        new_instructor_perms = sorted(set(self.original_instructor_perms) | {extra[0]})
        res = self.client.put(
            "/api/v1/roles/instructor/permissions",
            json={"permissions": new_instructor_perms},
            headers=self.headers,
        )
        self.assertEqual(res.status_code, 200, res.get_json())

        _, entry = self._staff_entry()
        self.assertIn(extra[0], entry["permissions"])
        self.assertEqual(entry["permission_count"], len(self._expected_union()))


if __name__ == "__main__":
    unittest.main()
