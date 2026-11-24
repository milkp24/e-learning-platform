# =====================================================================
# test_course_ownership_matrix_item14.py
# ข้อ 14: อาจารย์จัดการบท/ตอน/เนื้อหา/แบบทดสอบ/แบบฝึกหัด ได้เฉพาะคอร์สของตัวเอง
#         และกันการเรียก API ตรงจากอาจารย์คนอื่นหรือผู้เรียน ทุก Endpoint ที่แก้ไขข้อมูลได้
#   cd backend
#   pytest tests/test_course_ownership_matrix_item14.py -v
# =====================================================================
import uuid

import pytest
from flask_jwt_extended import create_access_token

from app import create_app
from app.config import TestingPostgresConfig
from app.extensions import db, limiter
from app.models.classroom import Classroom
from app.models.role import Role, seed_default_roles
from app.models.user import User, UserProfile

PREFIX = "own14_"


def _user(email, role):
    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(email=email)
        user.set_password("Password123")
        db.session.add(user)
        db.session.flush()
        db.session.add(UserProfile(user_id=user.user_id, display_name=email.split("@")[0]))
    user.status = "active"
    user.roles = [Role.query.filter_by(role_name=role).first()]
    return user


@pytest.fixture(scope="module")
def world():
    app = create_app(TestingPostgresConfig)
    limiter.enabled = False
    client = app.test_client()
    with app.app_context():
        seed_default_roles()
        users = {
            "owner": _user(PREFIX + "owner@test.com", "instructor"),
            "other": _user(PREFIX + "other@test.com", "instructor"),
            "student": _user(PREFIX + "student@test.com", "student"),
            "admin": _user(PREFIX + "admin@test.com", "admin"),
        }
        db.session.commit()
        h = {k: {"Authorization": f"Bearer {create_access_token(identity=str(u.user_id))}"} for k, u in users.items()}
        student_id = str(users["student"].user_id)

    def post(url, who, body):
        res = client.post(url, headers=h[who], json=body)
        assert res.status_code == 201, (url, res.get_json())
        return res.get_json()

    cid = post("/api/v1/classrooms", "owner", {"title": f"{PREFIX}{uuid.uuid4().hex[:6]}"})["classroom"]["classroom_id"]
    lid = post(f"/api/v1/classrooms/{cid}/lessons", "owner", {"title": "บทที่ 1"})["chapter"]["chapter_id"]
    eid = post(f"/api/v1/lessons/{lid}/episodes", "owner", {"title": "ตอนที่ 1"})["episode"]["episode_id"]
    ctid = post(f"/api/v1/lessons/{lid}/contents", "owner", {"content_type": "text", "content_data": "x"})["content"]["content_id"]
    quiz = post(f"/api/v1/classrooms/{cid}/quizzes", "owner", {"title": "Quiz"})
    qid = (quiz.get("quiz") or quiz.get("exam"))["quiz_id"]
    question = post(f"/api/v1/quizzes/{qid}/questions", "owner", {
        "question_text": "1+1?", "options": [{"option_text": "2", "is_correct": True}, {"option_text": "3"}],
    })
    qqid = question["question"]["question_id"]
    xid = post("/api/v1/exercises", "owner", {"lesson_id": lid, "title": "Exercise"})["exercise"]["exercise_id"]

    ids = dict(cid=cid, lid=lid, eid=eid, ctid=ctid, qid=qid, qqid=qqid, xid=xid, sid=student_id)
    yield app, client, h, ids
    with app.app_context():
        c = db.session.get(Classroom, uuid.UUID(cid))
        if c:
            db.session.delete(c)
            db.session.commit()
    limiter.enabled = True


# Endpoint ที่แก้ไขข้อมูลของคอร์สได้ทั้งหมด (ห้ามคนที่ไม่ใช่เจ้าของ)
WRITE_ENDPOINTS = [
    ("PUT", "/api/v1/classrooms/{cid}", {"title": "hacked"}),
    ("POST", "/api/v1/classrooms/{cid}/status", {"status": "active"}),
    ("POST", "/api/v1/classrooms/{cid}/members", {"user_id": "{sid}"}),
    ("POST", "/api/v1/classrooms/{cid}/lessons", {"title": "x"}),
    ("PUT", "/api/v1/lessons/{lid}", {"title": "x"}),
    ("POST", "/api/v1/lessons/{lid}/episodes", {"title": "x"}),
    ("PUT", "/api/v1/episodes/{eid}", {"title": "x"}),
    ("POST", "/api/v1/episodes/{eid}/contents", {"content_type": "text", "content_data": "x"}),
    ("POST", "/api/v1/lessons/{lid}/contents", {"content_type": "text", "content_data": "x"}),
    ("PUT", "/api/v1/contents/{ctid}", {"content_data": "x"}),
    ("POST", "/api/v1/classrooms/{cid}/quizzes", {"title": "x"}),
    ("PUT", "/api/v1/quizzes/{qid}", {"title": "x"}),
    ("POST", "/api/v1/quizzes/{qid}/questions", {"question_text": "x"}),
    ("PUT", "/api/v1/quizzes/{qid}/questions/{qqid}", {"question_text": "x"}),
    ("POST", "/api/v1/exercises", {"lesson_id": "{lid}", "title": "x"}),
    ("PUT", "/api/v1/exercises/{xid}", {"title": "x"}),
    ("POST", "/api/v1/exercises/{xid}/checklists", {"title": "x"}),
    ("DELETE", "/api/v1/quizzes/{qid}/questions/{qqid}", None),
    ("DELETE", "/api/v1/quizzes/{qid}", None),
    ("DELETE", "/api/v1/exercises/{xid}", None),
    ("DELETE", "/api/v1/contents/{ctid}", None),
    ("DELETE", "/api/v1/episodes/{eid}", None),
    ("DELETE", "/api/v1/lessons/{lid}", None),
    ("DELETE", "/api/v1/classrooms/{cid}", None),
]


def _fill(value, ids):
    if isinstance(value, str):
        return value.format(**ids)
    if isinstance(value, dict):
        return {k: _fill(v, ids) for k, v in value.items()}
    return value


@pytest.mark.parametrize("who", ["other", "student"])
@pytest.mark.parametrize("method,url,body", WRITE_ENDPOINTS)
def test_non_owner_cannot_modify_course_via_api(world, who, method, url, body):
    _, client, h, ids = world
    res = client.open(_fill(url, ids), method=method, headers=h[who], json=_fill(body, ids))
    assert res.status_code in (403, 404), (who, method, url, res.status_code, res.get_json())


@pytest.mark.parametrize(
    "url",
    [
        "/api/v1/classrooms/{cid}",
        "/api/v1/classrooms/{cid}/lessons",
        "/api/v1/classrooms/{cid}/quizzes",
        "/api/v1/classrooms/{cid}/members",
        "/api/v1/quizzes/{qid}",
        "/api/v1/exercises/{xid}",
    ],
)
def test_other_instructor_cannot_read_draft_course(world, url):
    _, client, h, ids = world
    res = client.get(_fill(url, ids), headers=h["other"])
    assert res.status_code in (403, 404), (url, res.status_code)


def test_list_endpoints_do_not_leak_other_instructors_draft(world):
    _, client, h, ids = world
    for url in [
        "/api/v1/classrooms",
        "/api/v1/classrooms/instructor/dashboard",
        f"/api/v1/quizzes?course_id={ids['cid']}",
        f"/api/v1/exercises?classroom_id={ids['cid']}",
    ]:
        res = client.get(url, headers=h["other"])
        assert res.status_code == 200, url
        assert ids["cid"] not in res.get_data(as_text=True), url


def test_owner_and_admin_still_have_access(world):
    _, client, h, ids = world
    for who in ("owner", "admin"):
        assert client.get(f"/api/v1/classrooms/{ids['cid']}/quizzes", headers=h[who]).status_code == 200
        res = client.put(f"/api/v1/lessons/{ids['lid']}", headers=h[who], json={"title": f"บทที่ 1 ({who})"})
        assert res.status_code == 200, res.get_json()
    res = client.get(f"/api/v1/classrooms/{ids['cid']}", headers=h["other"])
    assert res.status_code in (403, 404)
    res = client.get(f"/api/v1/classrooms/{ids['cid']}", headers=h["owner"])
    assert res.get_json()["classroom"]["can_manage"] is True
