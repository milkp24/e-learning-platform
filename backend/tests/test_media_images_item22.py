# =====================================================================
# test_media_images_item22.py
# ข้อ 22 (+ส่วนหนึ่งของข้อ 23): รูปปกคอร์สเก็บเป็นไฟล์ บันทึกแค่ที่อยู่ไฟล์ ไม่เก็บ Base64
# ข้อ 34: รูปโปรไฟล์ใช้ระบบอัปโหลดเดียวกัน
# - POST /api/v1/media/images รับเฉพาะ PNG/JPG/WEBP ไม่เกิน 5 MB และต้องเป็นรูปจริง
# - สร้าง/แก้ไขคอร์สด้วย data:... ถูกปฏิเสธ 400 (เดิมยาวเกินคอลัมน์จนบันทึกไม่ได้)
#   cd backend
#   pytest tests/test_media_images_item22.py -v
# =====================================================================

import io
import shutil
import tempfile
import unittest

from flask_jwt_extended import create_access_token

from app import create_app
from app.config import TestingPostgresConfig
from app.extensions import db
from app.models.classroom import Classroom, Media
from app.models.role import Role, seed_default_roles
from app.models.user import User, UserProfile

PREFIX = "img22_"
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
JPG = b"\xff\xd8\xff\xe0" + b"\x00" * 64
WEBP = b"RIFF\x24\x00\x00\x00WEBPVP8 " + b"\x00" * 64


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


class TestMediaImagesItem22(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app(config_class=TestingPostgresConfig)
        cls.upload_dir = tempfile.mkdtemp(prefix="img22_")
        cls.app.config["UPLOAD_FOLDER"] = cls.upload_dir  # ไม่เขียนไฟล์ทดสอบลงโฟลเดอร์ uploads จริง
        cls.client = cls.app.test_client()
        with cls.app.app_context():
            seed_default_roles()
            users = {
                "instructor": _ensure_user(PREFIX + "inst@test.com", ["instructor"]),
                "student": _ensure_user(PREFIX + "student@test.com", ["student"]),
            }
            db.session.commit()
            cls.user_ids = [u.user_id for u in users.values()]
            cls.headers = {
                k: {"Authorization": f"Bearer {create_access_token(identity=str(u.user_id))}"}
                for k, u in users.items()
            }

    @classmethod
    def tearDownClass(cls):
        with cls.app.app_context():
            Media.query.filter(Media.user_id.in_(cls.user_ids)).delete(synchronize_session=False)
            for c in Classroom.query.filter(Classroom.title.like(PREFIX + "%")).all():
                db.session.delete(c)
            db.session.commit()
        shutil.rmtree(cls.upload_dir, ignore_errors=True)

    # ---------- helpers ----------
    def _upload(self, content, name, who="instructor", mimetype="image/png"):
        return self.client.post(
            "/api/v1/media/images",
            headers=self.headers[who] if who else {},
            data={"file": (io.BytesIO(content), name, mimetype)},
            content_type="multipart/form-data",
        )

    def _create_course(self, thumbnail_url):
        return self.client.post(
            "/api/v1/classrooms",
            headers=self.headers["instructor"],
            json={"title": PREFIX + "course", "thumbnail_url": thumbnail_url},
        )

    # ---------- อัปโหลดรูป ----------
    def test_upload_png_jpg_webp_returns_relative_path(self):
        for content, name, mime in ((PNG, "cover.png", "image/png"), (JPG, "cover.jpg", "image/jpeg"),
                                    (WEBP, "cover.webp", "image/webp")):
            res = self._upload(content, name, mimetype=mime)
            self.assertEqual(res.status_code, 201, res.get_json())
            rel = res.get_json()["relative_url"]
            self.assertTrue(rel.startswith("/api/v1/media/uploads/"), rel)
            self.assertEqual(self.client.get(rel).status_code, 200)

    def test_student_can_upload_image_for_profile(self):
        self.assertEqual(self._upload(PNG, "me.png", who="student").status_code, 201)

    def test_guest_cannot_upload(self):
        self.assertEqual(self._upload(PNG, "cover.png", who=None).status_code, 401)

    def test_rejects_non_image_extension(self):
        res = self._upload(b"%PDF-1.4 ...", "doc.pdf", mimetype="application/pdf")
        self.assertEqual(res.status_code, 400)
        self.assertIn("PNG", res.get_json()["message"])

    def test_rejects_fake_image_renamed_to_png(self):
        res = self._upload(b"<script>alert(1)</script>", "evil.png")
        self.assertEqual(res.status_code, 400)
        self.assertIn("ไม่ใช่รูปภาพ", res.get_json()["message"])

    def test_rejects_image_over_5mb(self):
        res = self._upload(PNG + b"\x00" * (5 * 1024 * 1024), "big.png")
        self.assertEqual(res.status_code, 400)
        self.assertIn("5 MB", res.get_json()["message"])

    def test_rejected_file_is_not_saved(self):
        import os
        before = set(os.listdir(self.upload_dir))
        self._upload(b"not an image", "evil.png")
        self._upload(PNG + b"\x00" * (5 * 1024 * 1024), "big.png")
        self.assertEqual(set(os.listdir(self.upload_dir)), before)

    # ---------- บันทึกรูปปกคอร์ส ----------
    def test_create_course_with_uploaded_cover(self):
        rel = self._upload(PNG, "cover.png").get_json()["relative_url"]
        res = self._create_course(rel)
        self.assertEqual(res.status_code, 201, res.get_json())
        self.assertEqual(res.get_json()["classroom"]["thumbnail_url"], rel)

    def test_create_course_with_external_link(self):
        res = self._create_course("https://example.com/cover.jpg")
        self.assertEqual(res.status_code, 201)

    def test_base64_cover_rejected_with_thai_message(self):
        data_url = "data:image/png;base64," + "A" * 200000
        res = self._create_course(data_url)
        self.assertEqual(res.status_code, 400)
        self.assertIn("Base64", res.get_json()["message"])

        cid = self._create_course(None).get_json()["classroom"]["classroom_id"]
        res = self.client.put(f"/api/v1/classrooms/{cid}", headers=self.headers["instructor"],
                              json={"thumbnail_url": data_url})
        self.assertEqual(res.status_code, 400)

    def test_remove_cover(self):
        rel = self._upload(PNG, "cover.png").get_json()["relative_url"]
        cid = self._create_course(rel).get_json()["classroom"]["classroom_id"]
        res = self.client.put(f"/api/v1/classrooms/{cid}", headers=self.headers["instructor"],
                              json={"thumbnail_url": None})
        self.assertEqual(res.status_code, 200)
        self.assertIsNone(res.get_json()["classroom"]["thumbnail_url"])

    def test_rejects_javascript_link(self):
        self.assertEqual(self._create_course("javascript:alert(1)").status_code, 400)


    # ---------- ข้อ 34: รูปโปรไฟล์ ----------
    def _put_profile(self, body, who="student"):
        return self.client.put("/api/v1/users/me/profile", headers=self.headers[who], json=body)

    def test_profile_image_saved_as_uploaded_path(self):
        rel = self._upload(PNG, "me.png", who="student").get_json()["relative_url"]
        res = self._put_profile({"display_name": "img22 student", "profile_image": rel})
        self.assertEqual(res.status_code, 200, res.get_json())
        me = self.client.get("/api/v1/auth/me", headers=self.headers["student"]).get_json()
        self.assertIn(rel, str(me))

    def test_profile_image_base64_rejected(self):
        res = self._put_profile({"display_name": "img22 student", "profile_image": "data:image/png;base64,AAAA"})
        self.assertEqual(res.status_code, 400)
        self.assertIn("Base64", res.get_json()["message"])

    def test_old_base64_profile_image_does_not_block_name_change(self):
        """บัญชีเก่าที่เก็บรูปเป็น Base64 ไว้แล้ว ยังแก้ชื่อได้ถ้าไม่ได้เปลี่ยนรูป"""
        old = "data:image/png;base64,OLDIMAGE"
        with self.app.app_context():
            user = db.session.get(User, self.user_ids[1])
            user.profile.profile_image = old
            db.session.commit()
        res = self._put_profile({"display_name": "img22 renamed", "profile_image": old})
        self.assertEqual(res.status_code, 200, res.get_json())

    def test_profile_image_can_be_removed(self):
        res = self._put_profile({"display_name": "img22 student", "profile_image": None})
        self.assertEqual(res.status_code, 200)


if __name__ == "__main__":
    unittest.main()
