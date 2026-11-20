# =====================================================================
# test_course_ownership_item14.py
# ข้อ 14: อาจารย์จัดการบท/ตอนได้เฉพาะคอร์สของตัวเอง และกันการเข้าผ่าน API ตรง
# - อาจารย์คนอื่นแก้ / ลบ / เพิ่มบท ตอน เนื้อหา แบบฝึกหัด ในคอร์สที่ไม่ใช่ของตัวเองไม่ได้
# - โครงร่างบท/ตอนของคอร์สฉบับร่าง เปิดผ่าน API ตรงไม่ได้ (ตอบ 404 เหมือนหน้าคอร์ส)
# - แบบฝึกหัด: Guest ต้องเข้าสู่ระบบ, ไม่เห็นฉบับร่าง และไม่มีใครนอกจากผู้จัดการได้เฉลย
#   cd backend
#   pytest tests/test_course_ownership_item14.py -v
# =====================================================================

import unittest

from flask_jwt_extended import create_access_token

from app import create_app
from app.config import TestingPostgresConfig
from app.extensions import db
from app.models.classroom import Classroom
from app.models.role import Role, seed_default_roles
from app.models.user import User, UserProfile

PREFIX = "own14_"
API = "/api/v1"
SECRET = "print('secret-answer')"


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


class TestCourseOwnershipItem14(unittest.TestCase):
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
                "admin": _ensure_user(PREFIX + "admin@test.com", ["admin"]),
            }
            db.session.commit()
            ids = {k: str(u.user_id) for k, u in users.items()}
            cls.headers = {
                k: {"Authorization": f"Bearer {create_access_token(identity=v)}"} for k, v in ids.items()
            }

    def setUp(self):
        self._cleanup()

    def tearDown(self):
        self._cleanup()

    def _cleanup(self):
        with self.app.app_context():
            for c in Classroom.query.filter(Classroom.title.like(PREFIX + "%")).all():
                db.session.delete(c)
            db.session.commit()

    # ---------- helpers ----------
    def _post(self, url, who, body=None):
        return self.client.post(API + url, headers=self.headers[who] if who else {}, json=body or {})

    def _get(self, url, who=None):
        return self.client.get(API + url, headers=self.headers[who] if who else {})

    def _course(self, publish):
        res = self._post("/classrooms", "owner", {"title": PREFIX + "course"})
        self.assertEqual(res.status_code, 201, res.get_json())
        cid = res.get_json()["classroom"]["classroom_id"]
        if publish:
            self.assertEqual(self._post(f"/classrooms/{cid}/status", "admin", {"status": "active"}).status_code, 200)
        lesson = self._post(f"/classrooms/{cid}/lessons", "owner", {"title": "บทที่ 1"})
        self.assertEqual(lesson.status_code, 201, lesson.get_json())
        body = lesson.get_json()
        lid = (body.get("lesson") or body.get("chapter"))["lesson_id"]
        ep = self._post(f"/lessons/{lid}/episodes", "owner", {"title": "ตอนที่ 1"})
        self.assertEqual(ep.status_code, 201, ep.get_json())
        eid = ep.get_json()["episode"]["episode_id"]
        return cid, lid, eid

    def _exercise(self, lid, status="published"):
        res = self._post("/exercises", "owner", {
            "lesson_id": lid,
            "title": "แบบฝึกหัด",
            "status": status,
            "activities_data": [{
                "type": "fill_code", "title": "เติมโค้ด", "score": 10,
                "code_template": "print(___)", "correct_answer": SECRET,
            }],
        })
        self.assertEqual(res.status_code, 201, res.get_json())
        return res.get_json()["exercise"]["exercise_id"]

    # ---------- แก้ไขได้เฉพาะเจ้าของ ----------
    def test_other_instructor_cannot_manage_lessons_or_episodes(self):
        cid, lid, eid = self._course(publish=True)
        h = self.headers["other"]
        self.assertEqual(self._post(f"/classrooms/{cid}/lessons", "other", {"title": "x"}).status_code, 403)
        self.assertEqual(self.client.put(f"{API}/lessons/{lid}", headers=h, json={"title": "x"}).status_code, 403)
        self.assertEqual(self.client.delete(f"{API}/lessons/{lid}", headers=h).status_code, 403)
        self.assertEqual(self._post(f"/lessons/{lid}/episodes", "other", {"title": "x"}).status_code, 403)
        self.assertEqual(self.client.put(f"{API}/episodes/{eid}", headers=h, json={"title": "x"}).status_code, 403)
        self.assertEqual(self.client.delete(f"{API}/episodes/{eid}", headers=h).status_code, 403)
        self.assertEqual(self._post(f"/episodes/{eid}/contents", "other", {"content_type": "text", "title": "x"}).status_code, 403)
        # เจ้าของและ Admin ยังทำได้
        self.assertEqual(self.client.put(f"{API}/lessons/{lid}", headers=self.headers["owner"], json={"title": "บทที่ 1 (แก้)"}).status_code, 200)
        self.assertEqual(self.client.put(f"{API}/episodes/{eid}", headers=self.headers["admin"], json={"title": "ตอนที่ 1 (แก้)"}).status_code, 200)

    def test_other_instructor_cannot_manage_exercises(self):
        _, lid, _ = self._course(publish=True)
        ex = self._exercise(lid)
        h = self.headers["other"]
        self.assertEqual(self._post("/exercises", "other", {"lesson_id": lid, "title": "x"}).status_code, 403)
        self.assertEqual(self.client.put(f"{API}/exercises/{ex}", headers=h, json={"title": "x"}).status_code, 403)
        self.assertEqual(self.client.delete(f"{API}/exercises/{ex}", headers=h).status_code, 403)

    # ---------- โครงร่างคอร์สฉบับร่าง ----------
    def test_draft_course_outline_hidden_from_api(self):
        cid, lid, eid = self._course(publish=False)
        for who in (None, "student", "other"):
            self.assertEqual(self._get(f"/classrooms/{cid}/lessons", who).status_code, 404, who)
            self.assertEqual(self._get(f"/lessons/{lid}", who).status_code, 404, who)
            self.assertEqual(self._get(f"/lessons/{lid}/episodes", who).status_code, 404, who)
            self.assertEqual(self._get(f"/episodes/{eid}", who).status_code, 404, who)
        for who in ("owner", "admin"):
            self.assertEqual(self._get(f"/classrooms/{cid}/lessons", who).status_code, 200, who)
            self.assertEqual(self._get(f"/episodes/{eid}", who).status_code, 200, who)

    def test_published_course_outline_still_previewable(self):
        cid, lid, _ = self._course(publish=True)
        self.assertEqual(self._get(f"/classrooms/{cid}/lessons").status_code, 200)
        self.assertEqual(self._get(f"/lessons/{lid}").status_code, 200)

    # ---------- แบบฝึกหัด ----------
    def test_guest_cannot_open_exercise_or_see_answers(self):
        _, lid, _ = self._course(publish=True)
        ex = self._exercise(lid)
        self.assertEqual(self._get(f"/exercises/{ex}").status_code, 401)
        listed = self._get(f"/exercises?lesson_id={lid}").get_json()["exercises"]
        self.assertEqual(len(listed), 1)
        self.assertNotIn(SECRET, str(listed))

    def test_exercise_list_hides_drafts_and_answers_from_non_owners(self):
        _, lid, _ = self._course(publish=True)
        self._exercise(lid, status="published")
        self._exercise(lid, status="draft")
        for who in (None, "student", "other"):
            listed = self._get(f"/exercises?lesson_id={lid}", who).get_json()["exercises"]
            self.assertEqual([e["status"] for e in listed], ["published"], who)
            self.assertNotIn(SECRET, str(listed), who)
        owner_list = self._get(f"/exercises?lesson_id={lid}", "owner").get_json()["exercises"]
        self.assertEqual(len(owner_list), 2)
        self.assertIn(SECRET, str(owner_list))

    def test_exercises_of_draft_course_not_listed(self):
        _, lid, _ = self._course(publish=False)
        self._exercise(lid)
        for who in (None, "student", "other"):
            self.assertEqual(self._get(f"/exercises?lesson_id={lid}", who).get_json()["exercises"], [], who)

    def test_student_cannot_get_answers_with_manage_mode(self):
        cid, lid, _ = self._course(publish=True)
        ex = self._exercise(lid)
        self.assertEqual(self._post(f"/classrooms/{cid}/join", "student").status_code, 201)
        res = self._get(f"/exercises/{ex}?mode=manage", "student")
        self.assertEqual(res.status_code, 200)
        self.assertNotIn(SECRET, str(res.get_json()))
        self.assertIn(SECRET, str(self._get(f"/exercises/{ex}?mode=manage", "owner").get_json()))

    def test_student_cannot_open_draft_exercise(self):
        cid, lid, _ = self._course(publish=True)
        ex = self._exercise(lid, status="draft")
        self.assertEqual(self._post(f"/classrooms/{cid}/join", "student").status_code, 201)
        self.assertEqual(self._get(f"/exercises/{ex}", "student").status_code, 404)


if __name__ == "__main__":
    unittest.main()
