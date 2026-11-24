# =====================================================================
# test_upload_validation_and_errors_items_23_39.py
# ข้อ 23: ตรวจไฟล์ที่อัปโหลด (ชนิด ขนาด และเนื้อไฟล์จริง) ไม่ผ่าน = แจ้งเตือนและไม่บันทึกไฟล์
#         เนื้อหาบทเรียนประเภทไฟล์รับเฉพาะลิงก์/ไฟล์ที่อัปโหลดผ่านระบบ ไม่รับ Base64
# ข้อ 39: ข้อความ Error อ่านเข้าใจง่าย ไม่แสดงรายละเอียดทางเทคนิค
#   cd backend
#   pytest tests/test_upload_validation_and_errors_items_23_39.py -v
# =====================================================================
import io
import os
import shutil
import tempfile

import pytest
from flask_jwt_extended import create_access_token

from app import create_app
from app.config import TestingPostgresConfig
from app.extensions import db
from app.models.classroom import Classroom, Media
from app.models.role import Role, seed_default_roles
from app.models.user import User, UserProfile

PREFIX = "up23_"
PDF = b"%PDF-1.4\n%test\n" + b"0" * 64
MP4 = b"\x00\x00\x00\x18ftypmp42" + b"\x00" * 64
DOCX = b"PK\x03\x04" + b"\x00" * 64
DOC = b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1" + b"\x00" * 64
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
EXE = b"MZ\x90\x00" + b"\x00" * 64


def _ensure_user(email, role_name):
    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(email=email)
        user.set_password("Password123")
        db.session.add(user)
        db.session.flush()
        db.session.add(UserProfile(user_id=user.user_id, display_name=email.split("@")[0]))
    user.status = "active"
    user.roles = [Role.query.filter_by(role_name=role_name).first()]
    return user


@pytest.fixture(scope="module")
def ctx():
    app = create_app(TestingPostgresConfig)
    upload_dir = tempfile.mkdtemp(prefix="up23_")
    app.config["UPLOAD_FOLDER"] = upload_dir  # ไม่เขียนไฟล์ทดสอบลงโฟลเดอร์ uploads จริง
    with app.app_context():
        seed_default_roles()
        inst = _ensure_user(PREFIX + "inst@test.com", "instructor")
        db.session.commit()
        headers = {"Authorization": f"Bearer {create_access_token(identity=str(inst.user_id))}"}
        inst_id = inst.user_id
    yield app, app.test_client(), headers, upload_dir
    with app.app_context():
        Media.query.filter(Media.user_id == inst_id).delete(synchronize_session=False)
        for c in Classroom.query.filter(Classroom.title.like(PREFIX + "%")).all():
            db.session.delete(c)
        db.session.commit()
    shutil.rmtree(upload_dir, ignore_errors=True)


def _upload(client, headers, content, name, mimetype):
    return client.post(
        "/api/v1/media/upload",
        headers=headers,
        data={"file": (io.BytesIO(content), name, mimetype)},
        content_type="multipart/form-data",
    )


# ---------------------------------------------------------------------
# ข้อ 23: อัปโหลดไฟล์
# ---------------------------------------------------------------------
@pytest.mark.parametrize(
    "content,name,mime",
    [
        (PDF, "sheet.pdf", "application/pdf"),
        (MP4, "clip.mp4", "video/mp4"),
        (DOCX, "notes.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        (DOC, "old.doc", "application/msword"),
        (DOCX, "slides.pptx", "application/octet-stream"),  # บางเครื่องไม่รู้จักชนิดไฟล์
        (PNG, "pic.png", "image/png"),
    ],
)
def test_valid_files_are_saved(ctx, content, name, mime):
    _, client, headers, upload_dir = ctx
    res = _upload(client, headers, content, name, mime)
    assert res.status_code == 201, res.get_json()
    stored = res.get_json()["stored_filename"]
    assert os.path.exists(os.path.join(upload_dir, stored))


@pytest.mark.parametrize(
    "content,name,mime,expected",
    [
        (EXE, "virus.pdf", "application/pdf", "เนื้อไฟล์ไม่ใช่ไฟล์ .pdf"),  # เปลี่ยนนามสกุล
        (PDF, "fake.mp4", "video/mp4", "เนื้อไฟล์ไม่ใช่ไฟล์ .mp4"),
        (EXE, "notes.docx", "application/octet-stream", "เนื้อไฟล์ไม่ใช่ไฟล์ .docx"),
        (PDF, "sheet.pdf", "image/png", "ชนิดไฟล์ไม่ตรงกับนามสกุล"),  # MIME ไม่ตรงนามสกุล
        (EXE, "setup.exe", "application/octet-stream", "ประเภทไฟล์ไม่ถูกต้อง"),
        (b"", "empty.pdf", "application/pdf", "0 ไบต์"),
        (PNG + b"\x00" * (5 * 1024 * 1024), "big.png", "image/png", "5 MB"),  # รูปเกิน 5 MB
    ],
)
def test_invalid_files_are_rejected_and_not_saved(ctx, content, name, mime, expected):
    _, client, headers, upload_dir = ctx
    before = set(os.listdir(upload_dir))
    res = _upload(client, headers, content, name, mime)
    assert res.status_code == 400
    assert expected in res.get_json()["message"]
    assert set(os.listdir(upload_dir)) == before


def test_request_over_size_limit_returns_thai_json_413(ctx):
    app, client, headers, upload_dir = ctx
    old = app.config["MAX_CONTENT_LENGTH"]
    app.config["MAX_CONTENT_LENGTH"] = 1024
    try:
        before = set(os.listdir(upload_dir))
        res = _upload(client, headers, PDF + b"0" * 4096, "big.pdf", "application/pdf")
        assert res.status_code == 413
        assert res.is_json
        assert "ใหญ่เกินกำหนด" in res.get_json()["message"]
        assert set(os.listdir(upload_dir)) == before
    finally:
        app.config["MAX_CONTENT_LENGTH"] = old


@pytest.mark.parametrize(
    "content_type,data,ok",
    [
        ("pdf", "data:application/pdf;base64,JVBERi0xLjQK", False),
        ("image", "data:image/png;base64,iVBORw0KGgo=", False),
        ("video", "javascript:alert(1)", False),
        ("pdf", "/api/v1/media/uploads/abc_sheet.pdf", True),
        ("image", "https://example.com/pic.png", True),
    ],
)
def test_file_content_only_accepts_uploaded_path_or_http_link(content_type, data, ok):
    from app.utils.validators import sanitize_content_by_type

    valid, cleaned, message = sanitize_content_by_type(content_type, data)
    assert valid is ok
    if not ok:
        assert ("Base64" in message) or ("http" in message)


# ---------------------------------------------------------------------
# ข้อ 39: ข้อความ Error
# ---------------------------------------------------------------------
def test_unknown_route_returns_thai_json_404(ctx):
    _, client, _, _ = ctx
    res = client.get("/api/v1/does-not-exist")
    assert res.status_code == 404
    assert res.is_json
    assert "ไม่พบ" in res.get_json()["message"]


def test_wrong_method_returns_thai_json_405(ctx):
    _, client, _, _ = ctx
    res = client.delete("/api/v1/settings/public")
    assert res.status_code == 405
    assert res.is_json
    assert "<html" not in res.get_data(as_text=True).lower()


def test_unexpected_exception_hides_technical_details(ctx):
    from unittest.mock import patch

    _, client, headers, _ = ctx
    with patch(
        "app.services.lesson_service.LessonService.list_lessons",
        side_effect=RuntimeError("psycopg2.OperationalError: connection to 10.0.0.5 refused"),
    ):
        res = client.get("/api/v1/classrooms/00000000-0000-0000-0000-000000000000/lessons", headers=headers)
    assert res.status_code == 500
    body = res.get_data(as_text=True)
    assert "psycopg2" not in body and "10.0.0.5" not in body
    assert "ลองใหม่" in res.get_json()["message"]


def test_missing_and_invalid_token_messages_are_thai(ctx):
    _, client, _, _ = ctx
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401
    assert "เข้าสู่ระบบ" in res.get_json()["message"]

    res = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer not.a.token"})
    assert res.status_code in (401, 422)
    message = res.get_json()["message"]
    assert "เข้าสู่ระบบ" in message
    assert "Signature" not in message and "segments" not in message
