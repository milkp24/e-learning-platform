# =====================================================================
# test_learning_progress_items_1_24_25_27.py
# ข้อ 1  : การมองเห็นคอร์ส สาธารณะ / จำกัดสิทธิ์ / ซ่อน (Guest เห็นเฉพาะสาธารณะ)
# ข้อ 24 : ปุ่ม "เรียนจบแล้ว" + สถานะ ยังไม่เรียน / กำลังเรียน / เรียนจบแล้ว
#          (ต้องดูวิดีโอทุกคลิปในบทถึง 90% ก่อน)
# ข้อ 25 : บันทึกเปอร์เซ็นต์การดูวิดีโอ
# ข้อ 27 : บันทึกการเรียนรู้ผูกกับบทเรียน + หน้าคอร์สรู้ว่าบทไหนมีบันทึก
#   cd backend
#   pytest tests/test_learning_progress_items_1_24_25_27.py -v
# =====================================================================

import unittest

from flask_jwt_extended import create_access_token

from app import create_app
from app.config import TestingPostgresConfig
from app.extensions import db
from app.models.classroom import Classroom, Journal
from app.models.role import Role, seed_default_roles
from app.models.user import User, UserProfile

PREFIX = "lp24_"
API = "/api/v1"


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


class LearningProgressBase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app(config_class=TestingPostgresConfig)
        cls.client = cls.app.test_client()
        with cls.app.app_context():
            seed_default_roles()
            users = {
                "owner": _ensure_user(PREFIX + "owner@test.com", ["instructor"]),
                "student": _ensure_user(PREFIX + "student@test.com", ["student"]),
                "student2": _ensure_user(PREFIX + "student2@test.com", ["student"]),
                "admin": _ensure_user(PREFIX + "admin@test.com", ["admin"]),
            }
            db.session.commit()
            cls.ids = {k: str(u.user_id) for k, u in users.items()}
            cls.headers = {
                k: {"Authorization": f"Bearer {create_access_token(identity=v)}"} for k, v in cls.ids.items()
            }

    def setUp(self):
        self._cleanup()

    def tearDown(self):
        self._cleanup()

    def _cleanup(self):
        with self.app.app_context():
            for j in Journal.query.filter(Journal.title.like(PREFIX + "%")).all():
                db.session.delete(j)
            for c in Classroom.query.filter(Classroom.title.like(PREFIX + "%")).all():
                db.session.delete(c)
            db.session.commit()

    # ---------- helpers ----------
    def _req(self, method, url, who=None, body=None):
        headers = self.headers[who] if who else {}
        return getattr(self.client, method)(API + url, headers=headers, json=body)

    def _course(self, visibility="public", publish=True):
        res = self._req("post", "/classrooms", "owner", {"title": PREFIX + visibility, "visibility": visibility})
        self.assertEqual(res.status_code, 201, res.get_json())
        cid = res.get_json()["classroom"]["classroom_id"]
        if publish:
            self.assertEqual(self._req("post", f"/classrooms/{cid}/status", "admin", {"status": "active"}).status_code, 200)
        return cid

    def _lesson(self, cid, title, videos=()):
        res = self._req("post", f"/classrooms/{cid}/lessons", "owner", {"title": title})
        self.assertEqual(res.status_code, 201, res.get_json())
        body = res.get_json()
        lid = (body.get("lesson") or body.get("chapter"))["lesson_id"]
        content_ids = []
        for ctype, url in videos:
            r = self._req("post", f"/lessons/{lid}/contents", "owner", {"content_type": ctype, "content_data": url})
            self.assertEqual(r.status_code, 201, r.get_json())
            content_ids.append(r.get_json()["content"]["content_id"])
        return lid, content_ids

    def _join(self, cid, who="student"):
        self.assertEqual(self._req("post", f"/classrooms/{cid}/join", who).status_code, 201)

    def _list_ids(self, who=None):
        return {c["classroom_id"] for c in self._req("get", "/classrooms", who).get_json()["classrooms"]}


class TestCourseVisibilityItem1(LearningProgressBase):
    def test_guest_sees_only_public_published_courses(self):
        public = self._course("public")
        members = self._course("members")
        hidden = self._course("hidden")
        draft = self._course("public", publish=False)

        guest = self._list_ids()
        self.assertIn(public, guest)
        for cid in (members, hidden, draft):
            self.assertNotIn(cid, guest)
        self.assertEqual(self._req("get", f"/classrooms/{members}").status_code, 404)
        self.assertEqual(self._req("get", f"/classrooms/{hidden}").status_code, 404)

    def test_logged_in_users_see_members_courses_but_not_hidden(self):
        members = self._course("members")
        hidden = self._course("hidden")
        listed = self._list_ids("student")
        self.assertIn(members, listed)
        self.assertNotIn(hidden, listed)
        self.assertEqual(self._req("get", f"/classrooms/{members}", "student").status_code, 200)
        self.assertEqual(self._req("get", f"/classrooms/{hidden}", "student").status_code, 404)

    def test_hidden_course_only_for_added_members_and_cannot_self_join(self):
        hidden = self._course("hidden")
        self.assertEqual(self._req("post", f"/classrooms/{hidden}/join", "student").status_code, 403)
        res = self._req("post", f"/classrooms/{hidden}/members", "owner", {"user_id": self.ids["student"]})
        self.assertEqual(res.status_code, 201, res.get_json())
        self.assertIn(hidden, self._list_ids("student"))
        self.assertEqual(self._req("get", f"/classrooms/{hidden}", "student").status_code, 200)
        self.assertNotIn(hidden, self._list_ids("student2"))

    def test_owner_and_admin_always_see_and_can_change_visibility(self):
        hidden = self._course("hidden")
        self.assertIn(hidden, self._list_ids("owner"))
        self.assertIn(hidden, self._list_ids("admin"))
        res = self._req("put", f"/classrooms/{hidden}", "owner", {"visibility": "public"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["classroom"]["visibility"], "public")
        self.assertIn(hidden, self._list_ids())

    def test_invalid_visibility_rejected(self):
        res = self._req("post", "/classrooms", "owner", {"title": PREFIX + "x", "visibility": "secret"})
        self.assertEqual(res.status_code, 400)

    def test_default_visibility_is_public(self):
        res = self._req("post", "/classrooms", "owner", {"title": PREFIX + "default"})
        self.assertEqual(res.get_json()["classroom"]["visibility"], "public")


class TestLessonProgressItems24And25(LearningProgressBase):
    VIDEOS = (("video", "https://example.com/a.mp4"), ("youtube", "https://youtu.be/dQw4w9WgXcQ"))

    def _setup_course(self):
        cid = self._course("public")
        l1, vids = self._lesson(cid, "บทที่ 1", self.VIDEOS)
        l2, _ = self._lesson(cid, "บทที่ 2")
        self._join(cid)
        return cid, l1, l2, vids

    def _watch(self, content_id, percent, who="student"):
        return self._req("put", f"/contents/{content_id}/progress", who,
                         {"position_seconds": percent, "duration_seconds": 100})

    def _statuses(self, cid, who="student"):
        lessons = self._req("get", f"/classrooms/{cid}/lessons", who).get_json()["lessons"]
        return [l["progress_status"] for l in lessons]

    def test_status_not_started_then_in_progress(self):
        cid, l1, _, _ = self._setup_course()
        self.assertEqual(self._statuses(cid), ["not_started", "not_started"])
        res = self._req("post", f"/lessons/{l1}/progress/start", "student")
        self.assertEqual(res.status_code, 200, res.get_json())
        self.assertEqual(self._statuses(cid), ["in_progress", "not_started"])

    def test_cannot_complete_before_watching_videos(self):
        _, l1, _, vids = self._setup_course()
        res = self._req("post", f"/lessons/{l1}/complete", "student")
        self.assertEqual(res.status_code, 400)
        self.assertIn("90%", res.get_json()["message"])

        self._watch(vids[0], 95)
        self._watch(vids[1], 50)
        res = self._req("post", f"/lessons/{l1}/complete", "student")
        self.assertEqual(res.status_code, 400)
        self.assertIn("1 คลิป", res.get_json()["message"])

    def test_complete_after_watching_unlocks_next_lesson(self):
        cid, l1, l2, vids = self._setup_course()
        lessons = self._req("get", f"/classrooms/{cid}/lessons", "student").get_json()["lessons"]
        self.assertTrue(lessons[1]["is_locked"])

        for v in vids:
            self.assertEqual(self._watch(v, 92).status_code, 200)
        progress = self._req("get", f"/lessons/{l1}", "student").get_json()["lesson"]["progress"]
        self.assertTrue(progress["can_complete"])
        self.assertEqual([v["percent"] for v in progress["videos"]], [92, 92])

        res = self._req("post", f"/lessons/{l1}/complete", "student")
        self.assertEqual(res.status_code, 200, res.get_json())
        self.assertEqual(res.get_json()["progress"]["status"], "completed")
        self.assertEqual(res.get_json()["next_lesson_id"], l2)
        self.assertEqual(self._statuses(cid), ["completed", "not_started"])
        lessons = self._req("get", f"/classrooms/{cid}/lessons", "student").get_json()["lessons"]
        self.assertFalse(lessons[1]["is_locked"])

    def test_video_percent_never_goes_down(self):
        _, l1, _, vids = self._setup_course()
        self._watch(vids[0], 80)
        res = self._watch(vids[0], 10)  # ย้อนกลับไปดูต้นคลิป
        self.assertEqual(res.get_json()["video"]["percent"], 80)
        self.assertEqual(res.get_json()["video"]["position_seconds"], 10)

    def test_lesson_without_video_can_be_completed_directly(self):
        cid = self._course("public")
        l1, _ = self._lesson(cid, "บทอ่านอย่างเดียว")
        self._join(cid)
        self.assertEqual(self._req("post", f"/lessons/{l1}/complete", "student").status_code, 200)

    def test_locked_lesson_cannot_be_started_or_completed(self):
        _, _, l2, _ = self._setup_course()
        self.assertEqual(self._req("post", f"/lessons/{l2}/progress/start", "student").status_code, 403)
        self.assertEqual(self._req("post", f"/lessons/{l2}/complete", "student").status_code, 403)

    def test_only_enrolled_students_are_tracked(self):
        cid, l1, _, vids = self._setup_course()
        self.assertEqual(self._req("post", f"/lessons/{l1}/progress/start", "student2").status_code, 403)
        self.assertEqual(self._req("post", f"/lessons/{l1}/progress/start", "owner").status_code, 403)
        self.assertEqual(self._watch(vids[0], 50, who="student2").status_code, 403)
        self.assertEqual(self._req("post", f"/lessons/{l1}/progress/start").status_code, 401)
        # เจ้าของคอร์สไม่มีสถานะการเรียน
        self.assertEqual(self._statuses(cid, who="owner"), [None, None])

    def test_owner_can_delete_lesson_that_students_completed(self):
        """เดิมลบบทเรียนที่มีความคืบหน้าของผู้เรียนไม่ได้ (ORM พยายามตั้ง lesson_id เป็นค่าว่าง)"""
        _, l1, _, vids = self._setup_course()
        for v in vids:
            self._watch(v, 100)
        self.assertEqual(self._req("post", f"/lessons/{l1}/complete", "student").status_code, 200)
        res = self._req("delete", f"/lessons/{l1}", "owner")
        self.assertEqual(res.status_code, 200, res.get_json())

    def test_invalid_video_progress_rejected(self):
        _, _, _, vids = self._setup_course()
        res = self._req("put", f"/contents/{vids[0]}/progress", "student", {"position_seconds": 10})
        self.assertEqual(res.status_code, 400)


class TestJournalLessonItem27(LearningProgressBase):
    def _note(self, who="student", **body):
        payload = {"title": PREFIX + "note", "content": "สิ่งที่ได้เรียนรู้", **body}
        return self._req("post", "/journals", who, payload)

    def test_note_linked_to_lesson_sets_course_automatically(self):
        cid = self._course("public")
        l1, _ = self._lesson(cid, "บทที่ 1")
        self._join(cid)
        res = self._note(lesson_id=l1)
        self.assertEqual(res.status_code, 201, res.get_json())
        journal = res.get_json()["journal"]
        self.assertEqual(journal["lesson_id"], l1)
        self.assertEqual(journal["classroom_id"], cid)
        self.assertEqual(journal["lesson_title"], "บทที่ 1")

        listed = self._req("get", f"/journals?lesson_id={l1}", "student").get_json()["journals"]
        self.assertEqual(len(listed), 1)

    def test_course_page_shows_which_lessons_have_notes_for_me_only(self):
        cid = self._course("public")
        l1, _ = self._lesson(cid, "บทที่ 1")
        self._lesson(cid, "บทที่ 2")
        self._join(cid)
        self._join(cid, "student2")
        self._note(lesson_id=l1)
        self._note(lesson_id=l1)

        mine = self._req("get", f"/classrooms/{cid}/lessons", "student").get_json()["lessons"]
        self.assertEqual([l["note_count"] for l in mine], [2, 0])
        other = self._req("get", f"/classrooms/{cid}/lessons", "student2").get_json()["lessons"]
        self.assertEqual([l["note_count"] for l in other], [0, 0])
        self.assertEqual(self._req("get", f"/lessons/{l1}", "student").get_json()["lesson"]["note_count"], 2)

    def test_lesson_must_belong_to_selected_course(self):
        c1 = self._course("public")
        c2 = self._course("members")
        l2, _ = self._lesson(c2, "บทของอีกคอร์ส")
        res = self._note(classroom_id=c1, lesson_id=l2)
        self.assertEqual(res.status_code, 400)

    def test_search_and_move_note_between_lessons(self):
        cid = self._course("public")
        l1, _ = self._lesson(cid, "บทที่ 1")
        l2, _ = self._lesson(cid, "บทที่ 2")
        jid = self._note(lesson_id=l1, content="เซนเซอร์วัดความชื้น").get_json()["journal"]["journal_id"]
        self._note(lesson_id=l1, content="อย่างอื่น")

        found = self._req("get", "/journals?q=ความชื้น", "student").get_json()["journals"]
        self.assertEqual([j["journal_id"] for j in found], [jid])

        res = self._req("put", f"/journals/{jid}", "student", {"lesson_id": l2})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.get_json()["journal"]["lesson_id"], l2)

    def test_notes_are_private(self):
        cid = self._course("public")
        l1, _ = self._lesson(cid, "บทที่ 1")
        jid = self._note(lesson_id=l1).get_json()["journal"]["journal_id"]
        self.assertEqual(self._req("get", f"/journals?lesson_id={l1}", "student2").get_json()["journals"], [])
        self.assertEqual(self._req("put", f"/journals/{jid}", "student2", {"title": "x"}).status_code, 403)
        self.assertEqual(self._req("delete", f"/journals/{jid}", "student2").status_code, 403)


if __name__ == "__main__":
    unittest.main()
