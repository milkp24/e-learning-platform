# =====================================================================
# test_input_validation_item37.py
# ข้อ 37: ตรวจข้อมูลก่อนบันทึก (ช่องที่ต้องกรอก รูปแบบข้อมูล ข้อมูลห้ามซ้ำ) ฝั่ง Backend
# - ข้อมูลผิดต้องได้ 400/409 พร้อมข้อความภาษาไทย ไม่ใช่ 500 และไม่บันทึกลงฐานข้อมูล
#   cd backend
#   pytest tests/test_input_validation_item37.py -v
# =====================================================================
import uuid

import pytest
from flask_jwt_extended import create_access_token

from app import create_app
from app.config import TestingPostgresConfig
from app.extensions import db, limiter
from app.models.classroom import Classroom
from app.models.role import Role, seed_default_roles
from app.models.school import School
from app.models.user import User, UserProfile

PREFIX = "v37_"


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
def ctx():
    app = create_app(TestingPostgresConfig)
    limiter.enabled = False
    with app.app_context():
        seed_default_roles()
        users = {
            "sa": _user(PREFIX + "sa@test.com", "super_admin"),
            "ins": _user(PREFIX + "ins@test.com", "instructor"),
            "ins2": _user(PREFIX + "ins2@test.com", "instructor"),
            "st": _user(PREFIX + "st@test.com", "student"),
        }
        db.session.commit()
        headers = {k: {"Authorization": f"Bearer {create_access_token(identity=str(u.user_id))}"} for k, u in users.items()}
        ids = {k: str(u.user_id) for k, u in users.items()}
    yield app, app.test_client(), headers, ids
    with app.app_context():
        for c in Classroom.query.filter(Classroom.title.like(PREFIX + "%")).all():
            db.session.delete(c)
        for s in School.query.filter(School.name.like(PREFIX + "%")).all():
            db.session.delete(s)
        db.session.commit()
    limiter.enabled = True


def _unique(name):
    return f"{PREFIX}{name}_{uuid.uuid4().hex[:8]}"


def _course(client, headers, title=None):
    res = client.post("/api/v1/classrooms", headers=headers, json={"title": title or _unique("course")})
    assert res.status_code == 201, res.get_json()
    return res.get_json()["classroom"]["classroom_id"]


def _assert_thai_error(res, status):
    assert res.status_code == status, res.get_json()
    message = res.get_json()["message"]
    assert any("฀" <= ch <= "๿" for ch in message), message


# ---------------------------------------------------------------------
# รูปแบบคำขอ
# ---------------------------------------------------------------------
@pytest.mark.parametrize("body", [[1, 2], "text", 123])
def test_non_object_json_body_is_rejected_everywhere(ctx, body):
    _, client, headers, _ = ctx
    cid = _course(client, headers["ins"])
    for method, url, who in [
        ("POST", "/api/v1/classrooms", "ins"),
        ("POST", f"/api/v1/classrooms/{cid}/lessons", "ins"),
        ("POST", f"/api/v1/classrooms/{cid}/status", "ins"),
        ("POST", f"/api/v1/classrooms/{cid}/quizzes", "ins"),
        ("PUT", "/api/v1/users/me/profile", "st"),
    ]:
        res = client.open(url, method=method, headers=headers[who], json=body)
        _assert_thai_error(res, 400)


def test_broken_json_is_rejected(ctx):
    _, client, headers, _ = ctx
    res = client.post("/api/v1/classrooms", headers=headers["ins"], data="{bad json", content_type="application/json")
    _assert_thai_error(res, 400)


# ---------------------------------------------------------------------
# ชนิดข้อมูลและความยาว
# ---------------------------------------------------------------------
def test_course_description_wrong_type_or_too_long(ctx):
    _, client, headers, _ = ctx
    res = client.post("/api/v1/classrooms", headers=headers["ins"], json={"title": _unique("c"), "description": 123})
    _assert_thai_error(res, 400)
    res = client.post("/api/v1/classrooms", headers=headers["ins"], json={"title": _unique("c"), "description": "A" * 5001})
    _assert_thai_error(res, 400)
    res = client.post("/api/v1/classrooms", headers=headers["ins"], json={"title": "   "})
    _assert_thai_error(res, 400)
    assert "ชื่อคอร์ส" in res.get_json()["message"]


@pytest.mark.parametrize(
    "payload",
    [
        {"title": "A" * 300},
        {"title": "q", "max_attempts": "abc"},
        {"title": "q", "max_attempts": 0},
        {"title": "q", "time_limit_minutes": 5000},
        {"title": "q", "passing_score": 150},
        {"title": "q", "description": {"a": 1}},
    ],
)
def test_quiz_invalid_values_rejected(ctx, payload):
    _, client, headers, _ = ctx
    cid = _course(client, headers["ins"])
    res = client.post(f"/api/v1/classrooms/{cid}/quizzes", headers=headers["ins"], json=payload)
    _assert_thai_error(res, 400)


def test_quiz_question_invalid_values_rejected(ctx):
    _, client, headers, _ = ctx
    cid = _course(client, headers["ins"])
    res = client.post(f"/api/v1/classrooms/{cid}/quizzes", headers=headers["ins"], json={"title": "quiz"})
    quiz = res.get_json().get("quiz") or res.get_json().get("exam")
    qid = quiz["quiz_id"]
    for payload in [
        {"question_text": "  "},
        {"question_text": "q", "points": "abc"},
        {"question_text": "q", "points": -5},
        {"question_text": "q", "question_type": 5},
        {"question_text": "q", "options": "not a list"},
        {"question_text": "q", "image_url": "A" * 600},
    ]:
        res = client.post(f"/api/v1/quizzes/{qid}/questions", headers=headers["ins"], json=payload)
        _assert_thai_error(res, 400)


@pytest.mark.parametrize("roles", [None, 5, "student", [1, 2], []])
def test_role_update_requires_list_of_names(ctx, roles):
    _, client, headers, ids = ctx
    res = client.put(f"/api/v1/admin/users/{ids['st']}/roles", headers=headers["sa"], json={"roles": roles})
    _assert_thai_error(res, 400)


@pytest.mark.parametrize("user_id", [123, {"a": 1}, "not-a-uuid"])
def test_add_course_member_with_bad_user_id(ctx, user_id):
    _, client, headers, _ = ctx
    cid = _course(client, headers["ins"])
    res = client.post(f"/api/v1/classrooms/{cid}/members", headers=headers["ins"], json={"user_id": user_id})
    assert res.status_code == 400


# ---------------------------------------------------------------------
# ค่าตั้งค่าระบบ
# ---------------------------------------------------------------------
@pytest.mark.parametrize(
    "payload",
    [
        {"session_timeout_minutes": "abc"},
        {"session_timeout_minutes": 0},
        {"session_timeout_minutes": 100000},
        {"guest_timeout_minutes": {"a": 1}},
        {"warning_countdown_seconds": 5},
        {"unknown_key": "1"},
        {"session_timeout_minutes": 5, "warning_countdown_seconds": 600},  # นับถอยหลังนานกว่า Session
    ],
)
def test_settings_reject_invalid_values_and_keep_public_settings_working(ctx, payload):
    _, client, headers, _ = ctx
    before = client.get("/api/v1/settings/public").get_json()
    res = client.put("/api/v1/admin/settings", headers=headers["sa"], json=payload)
    _assert_thai_error(res, 400)
    after = client.get("/api/v1/settings/public")
    assert after.status_code == 200
    assert after.get_json() == before


# ---------------------------------------------------------------------
# โรงเรียน
# ---------------------------------------------------------------------
def test_school_phone_name_and_duplicates(ctx):
    _, client, headers, _ = ctx
    name = _unique("school")
    res = client.post("/api/v1/admin/schools", headers=headers["sa"], json={"name": name, "contact_phone": "02-123-4567"})
    assert res.status_code == 201, res.get_json()
    school_id = res.get_json()["school"]["school_id"]

    # ชื่อซ้ำ (ไม่สนตัวพิมพ์เล็ก/ใหญ่) = 409
    res = client.post("/api/v1/admin/schools", headers=headers["sa"], json={"name": name.upper()})
    _assert_thai_error(res, 409)

    for phone in ["abc", "123", "+66 81-234-5678-9999-99"]:
        res = client.post("/api/v1/admin/schools", headers=headers["sa"], json={"name": _unique("s"), "contact_phone": phone})
        _assert_thai_error(res, 400)

    res = client.patch(f"/api/v1/admin/schools/{school_id}", headers=headers["sa"], json={"name": "A" * 300})
    _assert_thai_error(res, 400)

    # ห้องเรียน: ปีการศึกษาต้องเป็น 4 หลัก
    url = f"/api/v1/admin/schools/{school_id}/classrooms"
    assert client.post(url, headers=headers["sa"], json={"classroom_name": "ม.1/1", "academic_year": "2569"}).status_code == 201
    assert client.post(url, headers=headers["sa"], json={"classroom_name": "ม.1/2", "academic_year": "2569/1"}).status_code == 201
    for year in ["69", "abcd", {"a": 1}]:
        res = client.post(url, headers=headers["sa"], json={"classroom_name": "ม.1/3", "academic_year": year})
        _assert_thai_error(res, 400)


# ---------------------------------------------------------------------
# ข้อมูลห้ามซ้ำ
# ---------------------------------------------------------------------
def test_course_title_unique_per_instructor(ctx):
    _, client, headers, _ = ctx
    title = _unique("dup")
    first = _course(client, headers["ins"], title)
    _assert_thai_error(client.post("/api/v1/classrooms", headers=headers["ins"], json={"title": f"  {title.upper()} "}), 409)

    # ผู้สอนคนอื่นใช้ชื่อเดียวกันได้
    assert client.post("/api/v1/classrooms", headers=headers["ins2"], json={"title": title}).status_code == 201

    # แก้ชื่อคอร์สอื่นให้ซ้ำไม่ได้ แต่บันทึกชื่อเดิมของตัวเองได้
    other = _course(client, headers["ins"])
    _assert_thai_error(client.put(f"/api/v1/classrooms/{other}", headers=headers["ins"], json={"title": title}), 409)
    assert client.put(f"/api/v1/classrooms/{first}", headers=headers["ins"], json={"title": title}).status_code == 200


def test_register_duplicate_email_case_insensitive(ctx):
    _, client, _, _ = ctx
    email = f"{PREFIX}{uuid.uuid4().hex[:6]}@test.com"
    payload = {"email": email, "password": "Password123", "display_name": "dup"}
    assert client.post("/api/v1/auth/register", json=payload).status_code == 201
    res = client.post("/api/v1/auth/register", json={**payload, "email": "  " + email.upper()})
    _assert_thai_error(res, 409)


# ---------------------------------------------------------------------
# ตาข่ายกันพลาด: Error จากฐานข้อมูลที่มาจากข้อมูลผู้ใช้ ไม่เป็น 500
# ---------------------------------------------------------------------
def test_database_errors_map_to_user_errors(ctx):
    from sqlalchemy.exc import DataError, IntegrityError

    from app.utils.errors import internal_error

    app = ctx[0]

    class Orig(Exception):
        def __init__(self, code, text):
            super().__init__(text)
            self.pgcode = code

    with app.test_request_context():
        res, status = internal_error(DataError("stmt", {}, Orig("22001", "value too long")))
        assert status == 400
        res, status = internal_error(IntegrityError("stmt", {}, Orig("23505", "duplicate key value violates unique constraint")))
        assert status == 409
        res, status = internal_error(IntegrityError("stmt", {}, Orig("23502", "null value violates not-null constraint")))
        assert status == 400
        res, status = internal_error(RuntimeError("boom"))
        assert status == 500
