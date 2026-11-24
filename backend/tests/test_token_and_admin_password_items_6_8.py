# =====================================================================
# test_token_and_admin_password_items_6_8.py
# ข้อ 6: Access / Refresh Token และการออกจากระบบ
#   - หลัง Logout ใช้ Access Token และ Refresh Token เดิมไม่ได้
#   - Refresh Token หมุนเวียน (ใช้ซ้ำไม่ได้) ใช้ซ้ำหลังผ่านไปนาน = ยกเลิก Session ทั้งหมดของบัญชี
#   - บัญชีที่ถูกระงับใช้ Access Token เดิมไม่ได้ทันที
# ข้อ 8: Super Admin ตั้งรหัสผ่านใหม่ให้ผู้อื่นโดยไม่ต้องรู้รหัสเดิม
#   - Admin ทั่วไปทำไม่ได้ (403) และถูกบันทึก Audit Log
#   - บันทึก Audit Log ว่าใครทำ บัญชีไหน เมื่อไร ผลเป็นอย่างไร และไม่มีรหัสผ่านใน Log
#   - หลังตั้งรหัสใหม่ Session เดิมของบัญชีนั้นใช้ไม่ได้ทุกเครื่อง
# รันกับ elearning_test_db เท่านั้น
#   cd backend
#   .\venv\Scripts\python -m pytest tests/test_token_and_admin_password_items_6_8.py -v
# =====================================================================
import json
import time
from datetime import datetime, timedelta, timezone

import pytest

from app import create_app
from app.config import TestingPostgresConfig
from app.extensions import db, limiter
from app.models.admin import AuditLog
from app.models.role import Role
from app.models.security import RefreshToken
from app.models.user import User, UserProfile
from app.routes.auth import hash_token

PASSWORD = "Password123"
SUPER_EMAIL = "t68_superadmin@test.com"
ADMIN_EMAIL = "t68_admin@test.com"
STUDENT_EMAIL = "t68_student@test.com"


def _ensure_user(email, role_name):
    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(email=email)
        user.set_password(PASSWORD)
        db.session.add(user)
        db.session.flush()
        db.session.add(UserProfile(user_id=user.user_id, display_name=email.split("@")[0]))
    user.set_password(PASSWORD)
    user.status = "active"
    user.sessions_revoked_at = None
    user.roles = [Role.query.filter_by(role_name=role_name).first()]
    return user


@pytest.fixture()
def app():
    app = create_app(TestingPostgresConfig)
    app.config["RATELIMIT_ENABLED"] = False
    limiter.enabled = False
    with app.app_context():
        ids = {}
        for email, role in [(SUPER_EMAIL, "super_admin"), (ADMIN_EMAIL, "admin"), (STUDENT_EMAIL, "student")]:
            ids[email] = str(_ensure_user(email, role).user_id)
        db.session.commit()
    app.test_ids = ids
    yield app
    limiter.enabled = True


@pytest.fixture()
def client(app):
    return app.test_client()


def _login(client, email, password=PASSWORD):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.get_json()
    data = res.get_json()
    return data["access_token"], data["refresh_token"]


def _auth(token):
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------
# ข้อ 6
# ---------------------------------------------------------------------
def test_logout_blocks_old_access_and_refresh_token(client):
    access, refresh = _login(client, STUDENT_EMAIL)
    assert client.get("/api/v1/auth/me", headers=_auth(access)).status_code == 200

    assert client.post("/api/v1/auth/logout", headers=_auth(access), json={"refresh_token": refresh}).status_code == 200

    assert client.get("/api/v1/auth/me", headers=_auth(access)).status_code == 401
    assert client.get("/api/v1/users/me", headers=_auth(access)).status_code == 401
    assert client.post("/api/v1/auth/refresh", json={"refresh_token": refresh}).status_code == 401


def test_refresh_rotates_and_quick_reuse_is_rejected_without_logging_everyone_out(client):
    _, refresh = _login(client, STUDENT_EMAIL)
    res = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert res.status_code == 200
    new_refresh = res.get_json()["refresh_token"]
    assert new_refresh != refresh

    # ใช้ตัวเดิมซ้ำทันที (เช่น 2 แท็บขอพร้อมกัน) ถูกปฏิเสธ แต่ตัวใหม่ยังใช้ได้
    assert client.post("/api/v1/auth/refresh", json={"refresh_token": refresh}).status_code == 401
    assert client.post("/api/v1/auth/refresh", json={"refresh_token": new_refresh}).status_code == 200


def test_late_reuse_of_revoked_refresh_token_revokes_all_sessions(app, client):
    _, stolen = _login(client, STUDENT_EMAIL)
    res = client.post("/api/v1/auth/refresh", json={"refresh_token": stolen})
    current = res.get_json()["refresh_token"]

    with app.app_context():
        token = RefreshToken.query.filter_by(token_hash=hash_token(stolen)).first()
        token.revoked_at = datetime.now(timezone.utc) - timedelta(minutes=5)
        db.session.commit()

    assert client.post("/api/v1/auth/refresh", json={"refresh_token": stolen}).status_code == 401
    # Refresh Token ที่ยังใช้งานอยู่ของบัญชีนี้ถูกยกเลิกด้วย ต้อง Login ใหม่
    assert client.post("/api/v1/auth/refresh", json={"refresh_token": current}).status_code == 401


def test_suspended_user_access_token_stops_working_immediately(app, client):
    access, _ = _login(client, STUDENT_EMAIL)
    with app.app_context():
        user = db.session.get(User, app.test_ids[STUDENT_EMAIL])
        user.status = "suspended"
        db.session.commit()
    try:
        assert client.get("/api/v1/auth/me", headers=_auth(access)).status_code == 401
    finally:
        with app.app_context():
            db.session.get(User, app.test_ids[STUDENT_EMAIL]).status = "active"
            db.session.commit()


# ---------------------------------------------------------------------
# ข้อ 8
# ---------------------------------------------------------------------
NEW_PASSWORD = "BrandNew456"


def _set_password(client, token, user_id, new=NEW_PASSWORD, confirm=None):
    return client.put(
        f"/api/v1/admin/users/{user_id}/password",
        headers=_auth(token),
        json={"new_password": new, "confirm_password": new if confirm is None else confirm},
    )


def _last_log(app, target_id):
    with app.app_context():
        log = (
            AuditLog.query.filter_by(action="USER_PASSWORD_SET_BY_ADMIN", entity_id=target_id)
            .order_by(AuditLog.created_at.desc())
            .first()
        )
        return log.to_dict() if log else None


def test_super_admin_sets_password_without_old_password_and_logs_it(app, client):
    sa_access, _ = _login(client, SUPER_EMAIL)
    st_access, st_refresh = _login(client, STUDENT_EMAIL)
    target_id = app.test_ids[STUDENT_EMAIL]

    time.sleep(1)  # iat ของ Token เดิมต้องอยู่ก่อนเวลายกเลิก Session (ละเอียดระดับวินาที)
    res = _set_password(client, sa_access, target_id)
    assert res.status_code == 200, res.get_json()

    # รหัสเดิมใช้ไม่ได้ รหัสใหม่ใช้ได้
    assert client.post("/api/v1/auth/login", json={"email": STUDENT_EMAIL, "password": PASSWORD}).status_code == 401
    _login(client, STUDENT_EMAIL, NEW_PASSWORD)

    # Session เดิมของผู้ใช้ถูกยกเลิกทั้ง Access และ Refresh Token
    assert client.get("/api/v1/auth/me", headers=_auth(st_access)).status_code == 401
    assert client.post("/api/v1/auth/refresh", json={"refresh_token": st_refresh}).status_code == 401

    log = _last_log(app, target_id)
    assert log is not None
    assert log["user_id"] == app.test_ids[SUPER_EMAIL]  # ใครทำ
    assert log["entity_id"] == target_id  # บัญชีไหน
    assert log["created_at"]  # เมื่อไร
    assert log["details"]["result"] == "SUCCESS"  # ผลเป็นอย่างไร
    assert log["details"]["target_email"] == STUDENT_EMAIL
    dumped = json.dumps(log)
    assert NEW_PASSWORD not in dumped and PASSWORD not in dumped
    assert "password_hash" not in dumped and "scrypt" not in dumped


def test_admin_cannot_set_password_and_attempt_is_logged(app, client):
    admin_access, _ = _login(client, ADMIN_EMAIL)
    target_id = app.test_ids[STUDENT_EMAIL]
    res = _set_password(client, admin_access, target_id)
    assert res.status_code == 403
    _login(client, STUDENT_EMAIL)  # รหัสเดิมยังใช้ได้

    log = _last_log(app, target_id)
    assert log["details"]["result"] == "DENIED"
    assert log["user_id"] == app.test_ids[ADMIN_EMAIL]
    assert NEW_PASSWORD not in json.dumps(log)


def test_student_cannot_call_endpoint(app, client):
    st_access, _ = _login(client, STUDENT_EMAIL)
    assert _set_password(client, st_access, app.test_ids[ADMIN_EMAIL]).status_code == 403


@pytest.mark.parametrize(
    "new,confirm",
    [("", ""), ("123", "123"), (NEW_PASSWORD, "Different789")],
)
def test_invalid_password_rejected_and_logged_as_failed(app, client, new, confirm):
    sa_access, _ = _login(client, SUPER_EMAIL)
    target_id = app.test_ids[STUDENT_EMAIL]
    res = _set_password(client, sa_access, target_id, new=new, confirm=confirm)
    assert res.status_code == 400
    _login(client, STUDENT_EMAIL)  # รหัสเดิมยังใช้ได้
    log = _last_log(app, target_id)
    assert log["details"]["result"] == "FAILED"
    if new:
        assert new not in json.dumps(log)


def test_super_admin_cannot_use_it_on_own_account(app, client):
    sa_access, _ = _login(client, SUPER_EMAIL)
    res = _set_password(client, sa_access, app.test_ids[SUPER_EMAIL])
    assert res.status_code == 403
    _login(client, SUPER_EMAIL)


def test_unknown_user_returns_404(client):
    sa_access, _ = _login(client, SUPER_EMAIL)
    res = _set_password(client, sa_access, "00000000-0000-0000-0000-000000000000")
    assert res.status_code == 404
