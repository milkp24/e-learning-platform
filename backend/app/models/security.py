import uuid
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db

# =====================================================================
# security.py: Models สำหรับระบบความปลอดภัยและตั้งค่า (Security & Settings)
# =====================================================================
# โมเดลในไฟล์นี้ทำหน้าที่รองรับความปลอดภัยตาม UAT-011, UAT-013, UAT-014, UAT-035:
# 1. RefreshToken: เก็บข้อมูล Refresh Token แบบ Stateful มีอายุ 7 วัน และจัดเก็บในรูป SHA-256 Hash
# 2. TokenBlocklist: เก็บ JWT ID (jti) ของ Access Token ที่ถูก Logout ก่อนหมดอายุลง Database แทน In-Memory
# 3. SystemSetting: เก็บการตั้งค่าระบบ เช่น เวลา Timeout (Idle Timeout, Guest Timeout) เพื่อให้ Admin ปรับเปลี่ยนได้จริง


class RefreshToken(db.Model):
    """
    โมเดลจัดเก็บ Refresh Token สำหรับต่ออายุ Access Token (UAT-011)
    - เก็บ Token ในรูปแบบ SHA-256 Hash เพื่อความปลอดภัย หาก Database รั่วไหลก็ไม่สามารถนำ Token ไปใช้ได้
    - เมื่อผู้ใช้ Logout หรือเกิด Token Rotation ค่า revoked_at จะถูกบันทึกเวลาที่เพิกถอน
    """

    __tablename__ = "refresh_tokens"

    token_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    user_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    token_hash = db.Column(
        db.String(64),
        nullable=False,
        index=True
    )
    expires_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )
    revoked_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True
    )

    # ความสัมพันธ์กลับไปยังตาราง User
    user = db.relationship(
        "User",
        backref=db.backref("refresh_tokens", lazy="dynamic", cascade="all, delete-orphan")
    )

    def is_active(self) -> bool:
        """ตรวจสอบว่า Refresh Token ยังใช้งานได้อยู่หรือไม่ (ยังไม่ถูก Revoke และยังไม่หมดอายุ)"""
        now = datetime.now(timezone.utc)
        return self.revoked_at is None and self.expires_at > now

    def to_dict(self) -> dict:
        """แปลงข้อมูล Refresh Token เป็น Dictionary สำหรับตรวจสอบ (ไม่ส่ง token_hash ออกไป)"""
        return {
            "token_id": str(self.token_id),
            "user_id": str(self.user_id),
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "revoked_at": self.revoked_at.isoformat() if self.revoked_at else None,
            "is_active": self.is_active()
        }


class TokenBlocklist(db.Model):
    """
    โมเดลจัดเก็บ Access Token ที่ถูกเพิกถอน (Revoked) เมื่อผู้ใช้กด Logout (UAT-013, UAT-014)
    - บันทึก jti (JWT ID) ของ Access Token ลงใน PostgreSQL เพื่อให้การ Logout มีผลถาวรข้ามเซิร์ฟเวอร์
    - เมื่อผู้ใช้นำ Token เก่ากลับมาใช้ จะถูก JWT Callback ปฏิเสธด้วย 401 Unauthorized ทันที
    """

    __tablename__ = "token_blocklist"

    id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    jti = db.Column(
        db.String(36),
        nullable=False,
        unique=True,
        index=True
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )
    expires_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False
    )

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "jti": self.jti,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
        }


class SystemSetting(db.Model):
    """
    โมเดลจัดเก็บค่าคอนฟิกของระบบ เช่น เวลา Timeout (UAT-015, UAT-035)
    - ช่วยให้ Admin สามารถปรับแต่งเวลา Session Idle Timeout และ Guest Timeout ผ่านหน้าบ้านได้จริง
    """

    __tablename__ = "system_settings"

    key = db.Column(
        db.String(100),
        primary_key=True
    )
    value = db.Column(
        db.String(255),
        nullable=False
    )
    description = db.Column(
        db.String(255),
        nullable=True
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self) -> dict:
        return {
            "key": self.key,
            "value": self.value,
            "description": self.description,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


# =====================================================================
# PasswordResetToken Model (โมเดลจัดเก็บ Token สำหรับรีเซ็ตรหัสผ่าน)
# =====================================================================
# - สร้างขึ้นเมื่อผู้ใช้ส่งคำขอ Forgot Password
# - เก็บ Token ในรูปแบบ SHA-256 Hash เพื่อความปลอดภัยสูงสุด (ไม่เก็บ Plain Token)
# - มีอายุ 15 นาทีตามข้อกำหนดความปลอดภัย
# - ใช้งานได้เพียงครั้งเดียว (One-time Use) โดยเมื่อถูกใช้งานแล้วจะมีค่า used_at
# - ผูกกับ user_id และมี Foreign Key ON DELETE CASCADE


class PasswordResetToken(db.Model):
    # กำหนดชื่อตารางในฐานข้อมูล PostgreSQL
    __tablename__ = "password_reset_tokens"

    # รหัสระบุรายการ Token (Primary Key) แบบ UUID
    token_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    # รหัสผู้ใช้ที่เป็นเจ้าของคำขอรีเซ็ตรหัสผ่าน (Foreign Key เชื่อมกับ users)
    user_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    # ค่า SHA-256 Hash ของ Plain Token (ความยาว 64 ตัวอักษร)
    token_hash = db.Column(
        db.String(64),
        nullable=False,
        index=True
    )
    # วันและเวลาที่ Token จะหมดอายุ (15 นาทีหลังสร้าง)
    expires_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False
    )
    # วันและเวลาที่สร้างคำขอรีเซ็ต
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )
    # วันและเวลาที่มีการนำ Token ไปใช้งานเปลี่ยนรหัสผ่านสำเร็จ (None = ยังไม่ถูกใช้)
    used_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True
    )

    # สร้างความสัมพันธ์กลับไปยังโมเดล User
    user = db.relationship(
        "User",
        backref=db.backref("password_reset_tokens", lazy="dynamic", cascade="all, delete-orphan")
    )

    # เมธอดตรวจสอบว่า Token ยังใช้งานได้อยู่หรือไม่
    def is_valid(self) -> bool:
        # ดึงเวลาปัจจุบันใน Timezone UTC
        now = datetime.now(timezone.utc)
        # ตรวจสอบว่ายังไม่เคยถูกใช้งาน และเวลาปัจจุบันยังไม่เกินเวลาหมดอายุ
        return self.used_at is None and self.expires_at > now

    # เมธอดแปลงข้อมูลเป็น Dictionary
    def to_dict(self) -> dict:
        # ส่งคืนโครงสร้างข้อมูลแบบ Dictionary
        return {
            "token_id": str(self.token_id),
            "user_id": str(self.user_id),
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "used_at": self.used_at.isoformat() if self.used_at else None,
            "is_valid": self.is_valid()
        }

