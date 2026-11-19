# =====================================================================
# test_reset_password_lockout.py
# FB-02: จำกัดจำนวนครั้งการกรอกรหัสยืนยันตั้งรหัสผ่านใหม่
# - ผิดครบ 5 ครั้ง -> HTTP 429 ล็อก 15 นาที + Audit Log
# - ระหว่างล็อก แม้ใช้รหัสยืนยันที่ถูกต้องก็ต้องถูกปฏิเสธ
# - IP อื่นไม่ได้รับผลกระทบ / หมดเวลาล็อกแล้วใช้งานได้ตามปกติ
# รันกับ elearning_test_db เท่านั้น (TestingPostgresConfig มี Safety Guard)
#   cd backend
#   .\venv\Scripts\python -m pytest tests/test_reset_password_lockout.py -v
# =====================================================================

import hashlib
import secrets
import unittest
from datetime import datetime, timedelta, timezone

from app import create_app
from app.config import TestingPostgresConfig
from app.extensions import db
from app.models.admin import AuditLog
from app.models.security import PasswordResetToken
from app.models.user import User

TEST_EMAIL = "fb02_lockout_user@test.com"
OLD_PASSWORD = "OldPassword123"
NEW_PASSWORD = "NewPassword456"
TEST_IPS = ["10.250.0.1", "10.250.0.2", "10.250.0.3", "10.250.0.4"]
URL = "/api/v1/auth/reset-password"


def _hash(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


class TestResetPasswordLockout(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app(config_class=TestingPostgresConfig)
        cls.client = cls.app.test_client()

    def setUp(self):
        with self.app.app_context():
            user = User.query.filter_by(email=TEST_EMAIL).first()
            if not user:
                user = User(email=TEST_EMAIL)
                db.session.add(user)
            user.set_password(OLD_PASSWORD)
            db.session.commit()
            self.user_id = user.user_id
            PasswordResetToken.query.filter_by(user_id=self.user_id).delete()
            AuditLog.query.filter(AuditLog.ip_address.in_(TEST_IPS)).delete(synchronize_session=False)
            db.session.commit()

    tearDown = setUp

    # ---------- helpers ----------
    def _make_token(self, expired: bool = False) -> tuple[str, str]:
        raw = secrets.token_urlsafe(32)
        with self.app.app_context():
            offset = timedelta(minutes=-1) if expired else timedelta(minutes=15)
            rec = PasswordResetToken(
                user_id=self.user_id,
                token_hash=_hash(raw),
                expires_at=datetime.now(timezone.utc) + offset,
            )
            db.session.add(rec)
            db.session.commit()
            return raw, str(rec.token_id)

    def _post(self, token: str, ip: str):
        return self.client.post(
            URL,
            json={"token": token, "password": NEW_PASSWORD},
            environ_overrides={"REMOTE_ADDR": ip},
        )

    def _count_logs(self, action: str, ip: str) -> int:
        with self.app.app_context():
            return AuditLog.query.filter_by(action=action, ip_address=ip).count()

    # ---------- tests ----------
    def test_01_fifth_wrong_attempt_locks_and_logs(self):
        ip = TEST_IPS[0]
        for attempt in range(1, 5):
            res = self._post("wrong-code-" + str(attempt), ip)
            self.assertEqual(res.status_code, 400, res.get_json())
            self.assertEqual(res.get_json()["remaining_attempts"], 5 - attempt)

        res = self._post("wrong-code-5", ip)
        self.assertEqual(res.status_code, 429, res.get_json())
        self.assertEqual(res.get_json()["retry_after_minutes"], 15)

        self.assertEqual(self._count_logs("PASSWORD_RESET_FAILED", ip), 5)
        self.assertEqual(self._count_logs("PASSWORD_RESET_LOCKED", ip), 1)

    def test_02_valid_code_rejected_while_locked(self):
        ip = TEST_IPS[1]
        for i in range(5):
            self._post(f"wrong-{i}", ip)
        raw, _ = self._make_token()

        res = self._post(raw, ip)
        self.assertEqual(res.status_code, 429)
        with self.app.app_context():
            user = db.session.get(User, self.user_id)
            self.assertTrue(user.check_password(OLD_PASSWORD), "password must NOT change while locked")

    def test_03_other_ip_not_affected(self):
        for i in range(5):
            self._post(f"wrong-{i}", TEST_IPS[2])
        raw, _ = self._make_token()
        res = self._post(raw, TEST_IPS[3])
        self.assertEqual(res.status_code, 200, res.get_json())

    def test_04_lock_expires_after_15_minutes(self):
        ip = TEST_IPS[0]
        for i in range(5):
            self._post(f"wrong-{i}", ip)
        # จำลองเวลาผ่านไป 16 นาที
        with self.app.app_context():
            past = datetime.now(timezone.utc) - timedelta(minutes=16)
            for log in AuditLog.query.filter_by(ip_address=ip).all():
                log.created_at = past
            db.session.commit()

        raw, _ = self._make_token()
        res = self._post(raw, ip)
        self.assertEqual(res.status_code, 200, res.get_json())

    def test_05_lock_invalidates_known_token(self):
        ip = TEST_IPS[1]
        raw_expired, token_id = self._make_token(expired=True)
        for _ in range(5):
            res = self._post(raw_expired, ip)
        self.assertEqual(res.status_code, 429)
        with self.app.app_context():
            rec = PasswordResetToken.query.filter_by(token_hash=_hash(raw_expired)).first()
            self.assertIsNotNone(rec.used_at, "token must be invalidated when lock triggers")
            lock_log = AuditLog.query.filter_by(action="PASSWORD_RESET_LOCKED", ip_address=ip).first()
            self.assertEqual(str(lock_log.user_id), str(self.user_id))


if __name__ == "__main__":
    unittest.main()
