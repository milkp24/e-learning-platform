# =====================================================================
# test_course_status_visibility.py
# ข้อ 1, 17, 19 + work flow อนุมัติการเผยแพร่
# สถานะคอร์ส: draft (ฉบับร่าง) / pending (รอตรวจสอบ) / active (เผยแพร่แล้ว) / archived (เก็บถาวร)
# - Guest และผู้เรียนเห็นเฉพาะคอร์สที่เผยแพร่แล้ว ทั้งในรายการและเมื่อเปิดลิงก์ตรง
# - ผู้สอนเห็นคอร์สของตัวเองทุกสถานะ แต่ไม่เห็นฉบับร่างของผู้สอนคนอื่น
# - เผยแพร่ได้ทันทีเฉพาะ Role ที่มีสิทธิ์ courses.publish ใน Permission Matrix
#   คนที่ไม่มีสิทธิ์ กดเผยแพร่ = ส่งให้ผู้ดูแลตรวจ (pending) แล้วผู้ดูแลอนุมัติ / ไม่อนุมัติ
# - ยกเลิกเผยแพร่ / เก็บถาวรคอร์สที่เผยแพร่อยู่ ต้องมีสิทธิ์ courses.unpublish
# ทุกเทสต์ยิง API ตรง (ไม่ผ่านหน้าเว็บ) เพื่อยืนยันว่ากติกาอยู่ที่ Backend
#   cd backend
#   pytest tests/test_course_status_visibility.py -v
# =====================================================================

import unittest
import uuid

from flask_jwt_extended import create_access_token

from app import create_app
from app.config import TestingPostgresConfig
from app.extensions import db
from app.models.admin import AuditLog, Notification
from app.models.classroom import Classroom
from app.models.role import Permission, Role, RolePermission, seed_default_roles
from app.models.user import User, UserProfile

PREFIX = "cs17_"
URL = "/api/v1/classrooms"


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


class TestCourseStatusVisibility(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app(config_class=TestingPostgresConfig)
        cls.client = cls.app.test_client()
        with cls.app.app_context():
            seed_default_roles()
            users = {
                "owner": _ensure_user(PREFIX + "owner@test.com", ["instructor"]),
                "other": _ensure_user(PREFIX + "other_inst@test.com", ["instructor"]),
                "student": _ensure_user(PREFIX + "student@test.com", ["student"]),
                "student2": _ensure_user(PREFIX + "student2@test.com", ["student"]),
                "admin": _ensure_user(PREFIX + "admin@test.com", ["admin"]),
            }
            db.session.commit()
            cls.ids = {k: str(u.user_id) for k, u in users.items()}
            cls.headers = {
                k: {"Authorization": f"Bearer {create_access_token(identity=v)}"}
                for k, v in cls.ids.items()
            }

    def setUp(self):
        self._cleanup()

    def tearDown(self):
        self._cleanup()
        self._set_instructor_perms(publish=False, unpublish=False)

    def _cleanup(self):
        with self.app.app_context():
            for c in Classroom.query.filter(Classroom.title.like(PREFIX + "%")).all():
                db.session.delete(c)
            Notification.query.filter(Notification.user_id.in_([uuid.UUID(v) for v in self.ids.values()])).delete(
                synchronize_session=False
            )
            db.session.commit()

    def _set_instructor_perms(self, publish, unpublish):
        """จำลองการเปิด/ปิดสิทธิ์ของ Role instructor ในหน้า Dynamic Permission Matrix"""
        with self.app.app_context():
            role = Role.query.filter_by(role_name="instructor").first()
            for name, on in (("courses.publish", publish), ("courses.unpublish", unpublish)):
                perm = Permission.query.filter_by(permission_name=name).first()
                rp = RolePermission.query.filter_by(role_id=role.role_id, permission_id=perm.permission_id).first()
                if on and not rp:
                    db.session.add(RolePermission(role_id=role.role_id, permission_id=perm.permission_id))
                if not on and rp:
                    db.session.delete(rp)
            db.session.commit()

    # ---------- helpers ----------
    def _create(self, title="course", who="owner", **extra):
        res = self.client.post(URL, headers=self.headers[who], json={"title": PREFIX + title, **extra})
        self.assertEqual(res.status_code, 201, res.get_json())
        return res.get_json()["classroom"]

    def _status(self, cid, status, who="owner"):
        return self.client.post(f"{URL}/{cid}/status", headers=self.headers[who], json={"status": status})

    def _review(self, cid, approve, note=None, who="admin"):
        body = {"approve": approve}
        if note is not None:
            body["note"] = note
        return self.client.post(f"{URL}/{cid}/review", headers=self.headers[who], json=body)

    def _published(self, title="published"):
        """คอร์สที่เผยแพร่แล้ว: ผู้สอนส่งตรวจ แล้ว Admin อนุมัติ"""
        cid = self._create(title)["classroom_id"]
        self.assertEqual(self._status(cid, "active").status_code, 200)
        self.assertEqual(self._review(cid, True).status_code, 200)
        return cid

    def _list_ids(self, who=None, query=""):
        res = self.client.get(URL + query, headers=self.headers[who] if who else {})
        self.assertEqual(res.status_code, 200)
        return {c["classroom_id"] for c in res.get_json()["classrooms"]}

    def _get(self, cid, who=None):
        return self.client.get(f"{URL}/{cid}", headers=self.headers[who] if who else {})

    def _db_status(self, cid):
        with self.app.app_context():
            return db.session.get(Classroom, uuid.UUID(cid)).status

    # ---------- การมองเห็น ----------
    def test_01_new_course_defaults_to_draft(self):
        self.assertEqual(self._create()["status"], "draft")

    def test_02_guest_cannot_see_draft_in_list_or_by_link(self):
        cid = self._create()["classroom_id"]
        self.assertNotIn(cid, self._list_ids())
        self.assertEqual(self._get(cid).status_code, 404)

    def test_03_guest_status_filter_cannot_reveal_hidden_courses(self):
        cid = self._create()["classroom_id"]
        self.assertNotIn(cid, self._list_ids(query="?status=draft"))

    def test_04_student_cannot_see_or_join_draft(self):
        cid = self._create()["classroom_id"]
        self.assertNotIn(cid, self._list_ids("student"))
        self.assertEqual(self._get(cid, "student").status_code, 404)
        self.assertEqual(self.client.post(f"{URL}/{cid}/join", headers=self.headers["student"]).status_code, 403)

    def test_05_other_instructor_cannot_see_draft(self):
        cid = self._create()["classroom_id"]
        self.assertNotIn(cid, self._list_ids("other"))
        self.assertEqual(self._get(cid, "other").status_code, 404)

    def test_06_owner_and_admin_can_see_draft(self):
        cid = self._create()["classroom_id"]
        self.assertIn(cid, self._list_ids("owner"))
        self.assertIn(cid, self._list_ids("admin"))
        self.assertEqual(self._get(cid, "admin").status_code, 200)

    # ---------- ส่งตรวจ / อนุมัติ ----------
    def test_07_instructor_publish_becomes_pending_and_notifies_reviewers(self):
        cid = self._create()["classroom_id"]
        res = self._status(cid, "active")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["classroom"]["status"], "pending")
        self.assertNotIn(cid, self._list_ids())  # Guest ยังไม่เห็น
        with self.app.app_context():
            n = Notification.query.filter_by(user_id=uuid.UUID(self.ids["admin"])).count()
            self.assertGreaterEqual(n, 1)
            self.assertGreaterEqual(
                AuditLog.query.filter_by(action="COURSE_STATUS_CHANGED", entity_id=uuid.UUID(cid)).count(), 1
            )

    def test_08_admin_approves_pending_course(self):
        cid = self._create()["classroom_id"]
        self._status(cid, "active")
        res = self._review(cid, True)
        self.assertEqual(res.status_code, 200, res.get_json())
        self.assertEqual(res.get_json()["classroom"]["status"], "active")
        self.assertIn(cid, self._list_ids())
        with self.app.app_context():
            self.assertEqual(Notification.query.filter_by(user_id=uuid.UUID(self.ids["owner"])).count(), 1)

    def test_09_reject_requires_reason_and_returns_to_draft_with_note(self):
        cid = self._create()["classroom_id"]
        self._status(cid, "active")
        self.assertEqual(self._review(cid, False).status_code, 400)
        res = self._review(cid, False, note="ยังไม่มีบทเรียน")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["classroom"]["status"], "draft")
        owner_view = self._get(cid, "owner").get_json()["classroom"]
        self.assertEqual(owner_view["review_note"], "ยังไม่มีบทเรียน")
        # ส่งตรวจใหม่แล้วเหตุผลเดิมถูกล้าง
        self._status(cid, "active")
        self.assertIsNone(self._get(cid, "owner").get_json()["classroom"]["review_note"])

    def test_10_instructor_cannot_review_or_bypass_with_put(self):
        cid = self._create()["classroom_id"]
        self._status(cid, "active")
        self.assertEqual(self._review(cid, True, who="owner").status_code, 403)
        # ยิง PUT ตรงก็ยังเป็นแค่ส่งตรวจ ไม่เผยแพร่ทันที
        cid2 = self._create("put")["classroom_id"]
        res = self.client.put(f"{URL}/{cid2}", headers=self.headers["owner"], json={"status": "active"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(self._db_status(cid2), "pending")

    def test_11_instructor_can_cancel_own_request(self):
        cid = self._create()["classroom_id"]
        self._status(cid, "active")
        self.assertEqual(self._status(cid, "draft").status_code, 200)
        self.assertEqual(self._db_status(cid), "draft")

    def test_12_create_with_publish_follows_permission(self):
        self.assertEqual(self._create("ins", status="active")["status"], "pending")
        self.assertEqual(self._create("adm", who="admin", status="active")["status"], "active")

    def test_13_instructor_with_publish_permission_publishes_directly(self):
        self._set_instructor_perms(publish=True, unpublish=False)
        cid = self._create()["classroom_id"]
        res = self._status(cid, "active")
        self.assertEqual(res.get_json()["classroom"]["status"], "active")
        self.assertIn(cid, self._list_ids())
        # มี publish แต่ไม่มี unpublish: ยกเลิกเผยแพร่ไม่ได้
        self.assertEqual(self._status(cid, "draft").status_code, 403)
        # อนุมัติคอร์สของผู้สอนอื่นไม่ได้ (ไม่ใช่ Admin)
        self.assertEqual(self._review(cid, True, who="owner").status_code, 403)

    # ---------- ยกเลิกเผยแพร่ / เก็บถาวร ----------
    def test_14_instructor_without_unpublish_permission_cannot_take_down(self):
        cid = self._published()
        self.assertEqual(self._status(cid, "draft").status_code, 403)
        self.assertEqual(self._status(cid, "archived").status_code, 403)
        self.assertEqual(self._db_status(cid), "active")

    def test_15_archive_hides_course_but_enrolled_student_keeps_access(self):
        cid = self._published()
        self.assertEqual(self.client.post(f"{URL}/{cid}/join", headers=self.headers["student"]).status_code, 201)
        self.assertEqual(self._status(cid, "archived", who="admin").status_code, 200)
        self.assertNotIn(cid, self._list_ids())
        self.assertEqual(self._get(cid).status_code, 404)
        self.assertEqual(self._get(cid, "student").status_code, 200)
        self.assertEqual(self.client.post(f"{URL}/{cid}/join", headers=self.headers["student2"]).status_code, 403)
        # กู้คืนกลับเป็นฉบับร่าง
        self.assertEqual(self._status(cid, "draft").status_code, 200)
        self.assertEqual(self._db_status(cid), "draft")

    # ---------- ตรวจค่าและสิทธิ์ ----------
    def test_16_invalid_status_rejected(self):
        res = self.client.post(URL, headers=self.headers["owner"], json={"title": PREFIX + "bad", "status": "hacked"})
        self.assertEqual(res.status_code, 400)
        cid = self._create()["classroom_id"]
        self.assertEqual(self._status(cid, "whatever").status_code, 400)
        self.assertEqual(self._db_status(cid), "draft")

    def test_17_legacy_aliases(self):
        cid = self._create(who="admin")["classroom_id"]
        self.assertEqual(self._status(cid, "published", who="admin").get_json()["classroom"]["status"], "active")
        self.assertEqual(self._status(cid, "inactive", who="admin").get_json()["classroom"]["status"], "archived")

    def test_18_only_owner_or_admin_can_change_status(self):
        cid = self._create()["classroom_id"]
        self.assertEqual(self._status(cid, "active", who="other").status_code, 404)
        self.assertEqual(self._status(cid, "active", who="student").status_code, 403)
        self.assertEqual(self._status(cid, "active", who="admin").status_code, 200)

    # ---------- ข้อ 30: จำนวนสมาชิกต้องตรงกันทุกหน้า ----------
    def test_30_member_count_same_for_guest_and_members_list(self):
        cid = self._published("members")
        for who in ("student", "student2"):
            res = self.client.post(f"{URL}/{cid}/join", headers=self.headers[who])
            self.assertEqual(res.status_code, 201, res.get_json())

        # Guest เปิดหน้าคอร์ส (ไม่มีสิทธิ์ดูรายชื่อ) ต้องเห็นจำนวนเท่ากับรายชื่อจริง
        guest = self.client.get(f"{URL}/{cid}").get_json()["classroom"]
        self.assertEqual(guest["member_count"], 2)

        members = self.client.get(f"{URL}/{cid}/members", headers=self.headers["student"]).get_json()
        self.assertEqual(members["member_count"], 2)
        self.assertEqual(len(members["members"]), 2)

        listed = {
            c["classroom_id"]: c["member_count"]
            for c in self.client.get(URL).get_json()["classrooms"]
        }
        self.assertEqual(listed[cid], 2)

    def test_30_members_of_hidden_course_not_listed(self):
        cid = self._create("hidden_members")["classroom_id"]
        self.assertEqual(self.client.get(f"{URL}/{cid}/members", headers=self.headers["other"]).status_code, 404)
        self.assertEqual(self.client.get(f"{URL}/{cid}/members", headers=self.headers["student"]).status_code, 404)
        self.assertEqual(self.client.get(f"{URL}/{cid}/members", headers=self.headers["owner"]).status_code, 200)
        self.assertEqual(self.client.get(f"{URL}/{cid}/members", headers=self.headers["admin"]).status_code, 200)


    def test_enrolled_student_keeps_archived_course_in_my_courses(self):
        """คอร์สที่ลงทะเบียนแล้วถูกเก็บถาวร ยังต้องอยู่ใน "คอร์สเรียนของฉัน" ของผู้เรียนเดิม"""
        cid = self._published("archived_enrolled")
        self.assertEqual(self.client.post(f"{URL}/{cid}/join", headers=self.headers["student"]).status_code, 201)
        self.assertEqual(self._status(cid, "archived", who="admin").status_code, 200)

        self.assertIn(cid, self._list_ids("student"))
        self.assertNotIn(cid, self._list_ids("student2"))
        self.assertNotIn(cid, self._list_ids())


if __name__ == "__main__":
    unittest.main()
