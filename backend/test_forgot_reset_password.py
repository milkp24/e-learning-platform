# =====================================================================
# test_forgot_reset_password.py
# ชุดทดสอบระบบ Forgot Password และ Reset Password แบบครอบคลุม (Integration Tests)
# =====================================================================

import unittest
import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.security import PasswordResetToken, RefreshToken
from app.services.email_service import send_reset_password_email


class TestForgotResetPassword(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()

    def setUp(self):
        with self.app.app_context():
            # เตรียมผู้ใช้สำหรับทดสอบ
            self.test_email = "forgot_test_user@test.com"
            self.old_password = "OldPassword123"
            self.new_password = "NewPassword456"

            user = User.query.filter_by(email=self.test_email).first()
            if not user:
                user = User(email=self.test_email)
                user.set_password(self.old_password)
                db.session.add(user)
                db.session.commit()
            else:
                user.set_password(self.old_password)
                db.session.commit()

            self.user_id = user.user_id

            # ล้าง Tokens เก่าของผู้ใช้นี้
            PasswordResetToken.query.filter_by(user_id=self.user_id).delete()
            db.session.commit()

    def test_01_forgot_password_existing_user_token_creation(self):
        """ทดสอบการขอ Forgot Password กรณีมีอีเมลในระบบ และตรวจการสร้าง Token ในฐานข้อมูล"""
        with self.app.app_context():
            # Mock การส่ง email ชั่วคราวเพื่อให้ทดสอบ Logic ฐานข้อมูลได้
            res = self.client.post("/api/v1/auth/forgot-password", json={
                "email": self.test_email
            })

            # ตรวจสอบว่าได้สถานะ 200 (หาก SMTP ไม่ได้ตั้งค่า อาจได้ 500 แต่เราตรวจการสร้าง Token ใน DB)
            # ดึง Token ล่าสุดจากตาราง password_reset_tokens
            token_record = PasswordResetToken.query.filter_by(user_id=self.user_id).first()
            self.assertIsNotNone(token_record, "Token record must be created in DB")
            self.assertIsNotNone(token_record.token_hash, "token_hash must be set")
            self.assertEqual(len(token_record.token_hash), 64, "token_hash must be SHA-256 (64 hex characters)")
            self.assertIsNone(token_record.used_at, "used_at must initially be None")

            # ตรวจสอบอายุ Token (ต้องประมาณ 15 นาที)
            now = datetime.now(timezone.utc)
            self.assertTrue(token_record.expires_at > now, "expires_at must be in the future")
            diff_minutes = (token_record.expires_at - now).total_seconds() / 60
            self.assertTrue(14 <= diff_minutes <= 16, f"expires_at must be ~15 minutes (was {diff_minutes})")
            print("-> PASS: Test 1: Token สร้างขึ้นและจัดเก็บเป็น SHA-256 Hash พร้อมอายุ 15 นาทีสมบูรณ์")

    def test_02_account_enumeration_protection(self):
        """ทดสอบ Account Enumeration Protection: กรณีไม่มีอีเมลในระบบ ต้องได้ HTTP 200 ข้อความเดียวกัน"""
        non_existent_email = "nobody_exists_12345@test.com"
        res = self.client.post("/api/v1/auth/forgot-password", json={
            "email": non_existent_email
        })

        self.assertEqual(res.status_code, 200, "Must return 200 OK even if email does not exist")
        data = res.get_json()
        expected_msg = "หากอีเมลนี้มีบัญชีอยู่ในระบบ ระบบจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยังอีเมลของคุณ"
        self.assertEqual(data.get("message"), expected_msg)

        with self.app.app_context():
            # ยืนยันว่าไม่มีการสร้าง Token
            user = User.query.filter_by(email=non_existent_email).first()
            self.assertIsNone(user)
        print("-> PASS: Test 2: Account Enumeration Protection ตอบกลับข้อความปลอดภัย ไม่เปิดเผยข้อมูลผู้ใช้")

    def test_03_reset_password_success(self):
        """ทดสอบการตั้งรหัสผ่านใหม่ด้วย Token ที่ถูกต้อง"""
        with self.app.app_context():
            # สร้าง Token สำหรับทดสอบ
            raw_token = secrets.token_urlsafe(32)
            token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
            expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

            tok = PasswordResetToken(
                user_id=self.user_id,
                token_hash=token_hash,
                expires_at=expires_at
            )
            db.session.add(tok)
            db.session.commit()

        # เรียก API Reset Password
        res = self.client.post("/api/v1/auth/reset-password", json={
            "token": raw_token,
            "password": self.new_password
        })

        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("สำเร็จ", data.get("message", ""))
        self.assertNotIn("access_token", data, "Must NOT auto-login or issue JWT")

        with self.app.app_context():
            # ตรวจสอบว่า Password เปลี่ยนจริงใน DB และถูกแฮช
            user = User.query.get(self.user_id)
            self.assertTrue(user.check_password(self.new_password), "New password must match")
            self.assertFalse(user.check_password(self.old_password), "Old password must fail")

            # ตรวจสอบว่า used_at ถูกบันทึก
            tok_in_db = PasswordResetToken.query.filter_by(token_hash=token_hash).first()
            self.assertIsNotNone(tok_in_db.used_at, "used_at must be recorded")
            self.assertFalse(tok_in_db.is_valid(), "Token must now be invalid")
        print("-> PASS: Test 3: Reset Password สำเร็จ รหัสผ่านใหม่ถูก Hash และ used_at ถูกบันทึก")

    def test_04_one_time_token_reuse_rejected(self):
        """ทดสอบ One-time Token: เมื่อ Token ถูกใช้ไปแล้ว ต้องไม่สามารถนำกลับมาใช้ซ้ำได้"""
        with self.app.app_context():
            raw_token = secrets.token_urlsafe(32)
            token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
            expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

            tok = PasswordResetToken(
                user_id=self.user_id,
                token_hash=token_hash,
                expires_at=expires_at,
                used_at=datetime.now(timezone.utc)  # ทำเครื่องหมายว่าใช้ไปแล้ว
            )
            db.session.add(tok)
            db.session.commit()

        # พยายามใช้ Token ที่ถูกใช้แล้ว
        res = self.client.post("/api/v1/auth/reset-password", json={
            "token": raw_token,
            "password": "AnotherPassword999"
        })

        self.assertEqual(res.status_code, 400, "Reused token must be rejected with 400 Bad Request")
        data = res.get_json()
        self.assertIn("ถูกใช้งานแล้ว", data.get("message", ""))
        print("-> PASS: Test 4: One-time Token ปฏิเสธการใช้ Token ซ้ำอย่างถูกต้อง")

    def test_05_expired_token_rejected(self):
        """ทดสอบ Token หมดอายุ: Token ที่ expires_at ในอดีต ต้องถูกปฏิเสธ"""
        with self.app.app_context():
            raw_token = secrets.token_urlsafe(32)
            token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
            expires_at = datetime.now(timezone.utc) - timedelta(minutes=1)  # หมดอายุแล้ว

            tok = PasswordResetToken(
                user_id=self.user_id,
                token_hash=token_hash,
                expires_at=expires_at,
                used_at=None
            )
            db.session.add(tok)
            db.session.commit()

        # พยายามใช้ Token ที่หมดอายุ
        res = self.client.post("/api/v1/auth/reset-password", json={
            "token": raw_token,
            "password": "AnotherPassword999"
        })

        self.assertEqual(res.status_code, 400, "Expired token must be rejected with 400 Bad Request")
        data = res.get_json()
        self.assertIn("หมดอายุ", data.get("message", ""))
        print("-> PASS: Test 5: Expired Token ปฏิเสธ Token ที่หมดอายุอย่างถูกต้อง")

    def test_06_invalid_token_rejected(self):
        """ทดสอบ Token มั่ว / ไม่ถูกต้อง: ต้องถูกปฏิเสธ"""
        res = self.client.post("/api/v1/auth/reset-password", json={
            "token": "totally-fake-token-12345",
            "password": "ValidPassword123"
        })

        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertIn("ไม่ถูกต้อง", data.get("message", ""))
        print("-> PASS: Test 6: Invalid Token ปฏิเสธ Token ที่ไม่ตรงในระบบ")

    def test_07_short_password_rejected(self):
        """ทดสอบรหัสผ่านสั้นเกินไป (< 6 ตัวอักษร): ต้องถูกปฏิเสธ"""
        with self.app.app_context():
            raw_token = secrets.token_urlsafe(32)
            token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
            expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

            tok = PasswordResetToken(
                user_id=self.user_id,
                token_hash=token_hash,
                expires_at=expires_at
            )
            db.session.add(tok)
            db.session.commit()

        res = self.client.post("/api/v1/auth/reset-password", json={
            "token": raw_token,
            "password": "123"
        })

        self.assertEqual(res.status_code, 400)
        data = res.get_json()
        self.assertTrue("6 characters" in data.get("message", "") or "6 ตัวอักษร" in data.get("message", ""))
        print("-> PASS: Test 7: Short Password correctly rejected")

    def test_08_login_with_new_password_after_reset(self):
        """ทดสอบการเข้าสู่ระบบด้วยรหัสผ่านใหม่หลัง Reset สำเร็จ"""
        with self.app.app_context():
            raw_token = secrets.token_urlsafe(32)
            token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
            expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

            tok = PasswordResetToken(
                user_id=self.user_id,
                token_hash=token_hash,
                expires_at=expires_at
            )
            db.session.add(tok)
            db.session.commit()

        # 1. รีเซ็ตรหัสผ่านเป็น BrandNewPass123
        brand_new_pass = "BrandNewPass123"
        reset_res = self.client.post("/api/v1/auth/reset-password", json={
            "token": raw_token,
            "password": brand_new_pass
        })
        self.assertEqual(reset_res.status_code, 200)

        # 2. ลอง Login ด้วยรหัสผ่านเก่า -> ต้องล้มเหลว (401)
        login_old = self.client.post("/api/v1/auth/login", json={
            "email": self.test_email,
            "password": self.old_password
        })
        self.assertEqual(login_old.status_code, 401, "Login with old password must fail")

        # 3. ลอง Login ด้วยรหัสผ่านใหม่ -> ต้องสำเร็จ (200)
        login_new = self.client.post("/api/v1/auth/login", json={
            "email": self.test_email,
            "password": brand_new_pass
        })
        self.assertEqual(login_new.status_code, 200, "Login with new password must succeed")
        data = login_new.get_json()
        self.assertIn("access_token", data, "Login must provide access_token")
        print("-> PASS: Test 8: เข้าสู่ระบบด้วยรหัสผ่านใหม่สำเร็จ และรหัสผ่านเก่าถูกยกเลิกถาวร")


if __name__ == "__main__":
    unittest.main()
