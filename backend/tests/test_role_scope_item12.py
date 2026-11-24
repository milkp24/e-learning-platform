# =====================================================================
# test_role_scope_item12.py
# ข้อ 12: แต่ละบทบาททำได้ตรงหน้าที่ และ Admin จัดการบัญชีได้ตามขอบเขตของตัวเอง
# - Admin จัดการได้เฉพาะบัญชีผู้เรียน/ผู้สอน และกำหนดได้เฉพาะบทบาทผู้เรียน/ผู้สอน
# - บัญชีผู้ดูแลระบบ และสิทธิ์ของบทบาท admin/super_admin จัดการได้โดย Super Admin เท่านั้น
# - Student / Instructor เข้า API ของผู้ดูแลระบบไม่ได้
#   cd backend
#   pytest tests/test_role_scope_item12.py -v
# =====================================================================
import uuid

import pytest
from flask_jwt_extended import create_access_token

from app import create_app
from app.config import TestingPostgresConfig
from app.extensions import db, limiter
from app.models.role import Role, seed_default_roles
from app.models.user import User, UserProfile

PREFIX = "rs12_"
ROLES = {"sa": "super_admin", "ad": "admin", "ad2": "admin", "ins": "instructor", "st": "student", "st2": "student"}


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


@pytest.fixture()
def ctx():
    app = create_app(TestingPostgresConfig)
    limiter.enabled = False
    with app.app_context():
        seed_default_roles()
        users = {k: _user(f"{PREFIX}{k}@test.com", r) for k, r in ROLES.items()}
        db.session.commit()
        headers = {k: {"Authorization": f"Bearer {create_access_token(identity=str(u.user_id))}"} for k, u in users.items()}
        ids = {k: str(u.user_id) for k, u in users.items()}
        role_ids = {r.role_name: str(r.role_id) for r in Role.query.all()}
        perms = {
            name: [p.permission_name for p in Role.query.filter_by(role_name=name).first().permissions]
            for name in ("admin", "student")
        }
    yield app, app.test_client(), headers, ids, role_ids
    with app.app_context():
        for name, keys in perms.items():  # คืนสิทธิ์เดิมของบทบาท
            from app.models.role import Permission
            role = Role.query.filter_by(role_name=name).first()
            role.permissions = Permission.query.filter(Permission.permission_name.in_(keys)).all()
        db.session.commit()
    limiter.enabled = True


def _new_email():
    return f"{PREFIX}{uuid.uuid4().hex[:8]}@test.com"


@pytest.mark.parametrize(
    "method,url,body",
    [
        ("POST", "/api/v1/admin/users", {"email": "{email}", "password": "Password123", "display_name": "xx", "role": "admin"}),
        ("PUT", "/api/v1/admin/users/{st}/roles", {"roles": ["admin"]}),
        ("POST", "/api/v1/users/{st}/roles", {"role_name": "admin"}),
        ("PUT", "/api/v1/admin/users/{ad2}/roles", {"roles": ["student"]}),
        ("PUT", "/api/v1/admin/users/{ad2}/status", {"status": "suspended"}),
        ("PATCH", "/api/v1/admin/users/{ad2}", {"display_name": "hacked"}),
        ("DELETE", "/api/v1/users/{ad2}/roles/admin", None),
        ("DELETE", "/api/v1/admin/users/{ad2}", None),
        ("PUT", "/api/v1/admin/users/{sa}/status", {"status": "suspended"}),
        ("PUT", "/api/v1/roles/{admin_role}/permissions", {"permissions": ["users.view", "users.delete"]}),
        ("PUT", "/api/v1/roles/{super_admin_role}/permissions", {"permissions": []}),
    ],
)
def test_admin_cannot_manage_staff_accounts_or_staff_roles(ctx, method, url, body):
    _, client, h, ids, role_ids = ctx
    fill = {**ids, "email": _new_email(), "admin_role": role_ids["admin"], "super_admin_role": role_ids["super_admin"]}
    url = url.format(**fill)
    if body:
        body = {k: (v.format(**fill) if isinstance(v, str) else v) for k, v in body.items()}
    res = client.open(url, method=method, headers=h["ad"], json=body)
    assert res.status_code == 403, (method, url, res.get_json())


def test_admin_cannot_escalate_own_permissions(ctx):
    app, client, h, _, role_ids = ctx
    res = client.put(
        f"/api/v1/roles/{role_ids['admin']}/permissions", headers=h["ad"], json={"permissions": ["users.delete"]}
    )
    assert res.status_code == 403
    with app.app_context():
        admin_role = Role.query.filter_by(role_name="admin").first()
        assert "users.delete" not in [p.permission_name for p in admin_role.permissions]


def test_admin_manages_students_and_instructors(ctx):
    _, client, h, ids, role_ids = ctx
    res = client.post("/api/v1/admin/users", headers=h["ad"], json={
        "email": _new_email(), "password": "Password123", "display_name": "new student", "role": "student",
    })
    assert res.status_code == 201, res.get_json()
    assert client.put(f"/api/v1/admin/users/{ids['st2']}/roles", headers=h["ad"], json={"roles": ["instructor"]}).status_code == 200
    assert client.put(f"/api/v1/admin/users/{ids['st2']}/status", headers=h["ad"], json={"status": "suspended"}).status_code == 200
    assert client.patch(f"/api/v1/admin/users/{ids['ins']}", headers=h["ad"], json={"display_name": "Teacher A"}).status_code == 200
    # สิทธิ์ของบทบาทผู้เรียน Admin ยังแก้ได้
    res = client.get(f"/api/v1/roles/{role_ids['student']}/permissions", headers=h["ad"])
    keys = [p["permission_name"] if isinstance(p, dict) else p for p in res.get_json().get("permissions", [])]
    assert client.put(f"/api/v1/roles/{role_ids['student']}/permissions", headers=h["ad"], json={"permissions": keys}).status_code == 200


def test_super_admin_manages_admin_accounts(ctx):
    _, client, h, ids, _ = ctx
    assert client.put(f"/api/v1/admin/users/{ids['st']}/roles", headers=h["sa"], json={"roles": ["admin"]}).status_code == 200
    assert client.put(f"/api/v1/admin/users/{ids['ad2']}/status", headers=h["sa"], json={"status": "suspended"}).status_code == 200
    res = client.post("/api/v1/admin/users", headers=h["sa"], json={
        "email": _new_email(), "password": "Password123", "display_name": "new admin", "role": "admin",
    })
    assert res.status_code == 201, res.get_json()


@pytest.mark.parametrize("who", ["st", "ins"])
@pytest.mark.parametrize(
    "method,url",
    [
        ("GET", "/api/v1/admin/users"),
        ("POST", "/api/v1/admin/users"),
        ("GET", "/api/v1/admin/audit-logs"),
        ("GET", "/api/v1/admin/settings"),
        ("GET", "/api/v1/roles/matrix"),
        ("GET", "/api/v1/admin/schools"),
        ("GET", "/api/v1/admin/dashboard/admin-stats"),
        ("PUT", "/api/v1/admin/users/{st2}/status"),
    ],
)
def test_student_and_instructor_blocked_from_admin_api(ctx, who, method, url):
    _, client, h, ids, _ = ctx
    res = client.open(url.format(**ids), method=method, headers=h[who], json={"status": "suspended"} if method != "GET" else None)
    assert res.status_code == 403


def test_student_cannot_create_teaching_content(ctx):
    _, client, h, _, _ = ctx
    assert client.post("/api/v1/classrooms", headers=h["st"], json={"title": "x"}).status_code == 403
    assert client.post("/api/v1/quizzes", headers=h["st"], json={"title": "x"}).status_code == 403
    assert client.post("/api/v1/exercises", headers=h["st"], json={"title": "x"}).status_code == 403
