import uuid
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import UUID
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db

# =====================================================================
# user.py: Models บัญชีผู้ใช้ (Module 1)
# - User: บัญชีสำหรับเข้าสู่ระบบ (อีเมล, รหัสผ่านแบบ hash, สถานะบัญชี)
# - UserProfile: ข้อมูลส่วนตัวที่แสดงผล (ชื่อ, รูปโปรไฟล์ ฯลฯ)
# - UserAccess: ประวัติการให้สิทธิ์ และวันหมดอายุสิทธิ์รายบุคคล
# - Session: Session การใช้งานแยกตามอุปกรณ์
# - PasswordHistory: รหัสผ่านเก่า (hash) ใช้กันการตั้งรหัสซ้ำ
# =====================================================================


class User(db.Model):
    """User account model for authentication and account status."""

    __tablename__ = "users"

    user_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    email = db.Column(
        db.String(255),
        unique=True,
        nullable=False,
        index=True
    )
    password_hash = db.Column(
        db.String(255),
        nullable=False
    )
    # สถานะบัญชี: active / inactive / suspended (ตรวจใน user_service)
    # บัญชีที่ไม่ใช่ "active" เข้าสู่ระบบไม่ได้
    status = db.Column(
        db.String(30),
        nullable=False,
        default="active"
    )
    # ข้อ 8: Access Token ที่ออกก่อนเวลานี้ใช้ไม่ได้ (เช่น Super Admin ตั้งรหัสผ่านใหม่ให้)
    # ทำให้ผู้ใช้ต้อง Login ใหม่ทุกเครื่องทันที ไม่ต้องรอ Token หมดอายุ
    sessions_revoked_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # 1-to-1 relationship with UserProfile
    profile = db.relationship(
        "UserProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )

    # Many-to-Many relationship with Role via user_roles
    roles = db.relationship(
        "Role",
        secondary="user_roles",
        backref=db.backref("users", lazy="dynamic"),
        lazy="joined"
    )

    def set_password(self, password: str) -> None:
        """Hash and store the user password."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """Verify the password against stored hash."""
        return check_password_hash(self.password_hash, password)

    def has_role(self, role_name: str) -> bool:
        """Check if user has a specific role (case-insensitive)."""
        return any(r.role_name.lower() == role_name.lower() for r in self.roles)

    def to_dict(self, include_profile: bool = True, include_roles: bool = True) -> dict:
        """Serialize user object to dictionary (excluding password_hash)."""
        data = {
            "user_id": str(self.user_id),
            "email": self.email,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_profile and self.profile:
            data["profile"] = self.profile.to_dict()
            data["display_name"] = self.profile.display_name if (self.profile.display_name and self.profile.display_name.strip()) else self.email
        else:
            data["profile"] = None
            data["display_name"] = self.email
        if include_roles:
            data["roles"] = [role.role_name for role in self.roles]
            primary_role = "student"
            if self.has_role("super_admin"):
                primary_role = "super_admin"
            elif self.has_role("admin"):
                primary_role = "admin"
            elif self.has_role("instructor"):
                primary_role = "instructor"
            data["role"] = primary_role
            data["isSuperAdmin"] = self.has_role("super_admin")
            data["permissions"] = self.get_permissions()
        return data

    def get_permissions(self) -> list[str]:
        """Return list of distinct permission names for this user dynamically from database."""
        if self.status != "active":
            return []
        if self.has_role("super_admin"):
            from app.models.role import Permission
            return [p.permission_name for p in Permission.query.all()]
        perms = set()
        for role in self.roles:
            for p in role.permissions:
                perms.add(p.permission_name)
        return sorted(list(perms))

    def has_permission(self, perm_name: str) -> bool:
        """Check if active user possesses a specific permission (dynamically from DB)."""
        if self.status != "active":
            return False
        if self.has_role("super_admin"):
            return True
        for role in self.roles:
            for p in role.permissions:
                if p.permission_name == perm_name:
                    return True
        return False


class UserProfile(db.Model):
    """User profile model containing personal and display information."""

    __tablename__ = "user_profiles"

    profile_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    user_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.user_id", ondelete="CASCADE"),
        unique=True,
        nullable=False
    )
    display_name = db.Column(
        db.String(100),
        nullable=False
    )
    profile_image = db.Column(
        db.Text,
        nullable=True
    )
    title = db.Column(
        db.String(20),
        nullable=True
    )
    first_name = db.Column(
        db.String(100),
        nullable=True
    )
    last_name = db.Column(
        db.String(100),
        nullable=True
    )
    occupation = db.Column(
        db.String(50),
        nullable=True
    )
    institution_name = db.Column(
        db.String(255),
        nullable=True
    )
    institution_email = db.Column(
        db.String(255),
        nullable=True
    )

    # Relationship back to User
    user = db.relationship(
        "User",
        back_populates="profile"
    )

    def to_dict(self) -> dict:
        """Serialize user profile object to dictionary."""
        return {
            "profile_id": str(self.profile_id),
            "user_id": str(self.user_id),
            "display_name": self.display_name,
            "profile_image": self.profile_image,
            "title": self.title,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "occupation": self.occupation,
            "institution_name": self.institution_name,
            "institution_email": self.institution_email,
        }


class UserAccess(db.Model):
    """User access history and individual permission expiration (Module 1.7 & 1.9)."""

    __tablename__ = "user_access"

    access_id = db.Column(
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
    access_type = db.Column(
        db.String(50),
        nullable=False
    )
    ip_address = db.Column(
        db.String(45),
        nullable=True
    )
    user_agent = db.Column(
        db.Text,
        nullable=True
    )
    expires_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    user = db.relationship(
        "User",
        backref=db.backref("access_logs", lazy="dynamic", cascade="all, delete-orphan")
    )

    def to_dict(self) -> dict:
        return {
            "access_id": str(self.access_id),
            "user_id": str(self.user_id),
            "access_type": self.access_type,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Session(db.Model):
    """Stateful user session across devices with termination timestamps (Module 1.2, 1.3 & 1.8)."""

    __tablename__ = "sessions"

    session_id = db.Column(
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
    token = db.Column(
        db.String(255),
        nullable=True
    )
    ip_address = db.Column(
        db.String(45),
        nullable=True
    )
    user_agent = db.Column(
        db.Text,
        nullable=True
    )
    is_active = db.Column(
        db.Boolean,
        nullable=False,
        default=True
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )
    last_activity = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )
    ended_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True
    )
    revoked_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True
    )

    user = db.relationship(
        "User",
        backref=db.backref("sessions", lazy="dynamic", cascade="all, delete-orphan")
    )

    def to_dict(self) -> dict:
        return {
            "session_id": str(self.session_id),
            "user_id": str(self.user_id),
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_activity": self.last_activity.isoformat() if self.last_activity else None,
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
            "revoked_at": self.revoked_at.isoformat() if self.revoked_at else None,
        }


class PasswordHistory(db.Model):
    """Password history to prevent password reuse (Module 1.6)."""

    __tablename__ = "password_histories"

    history_id = db.Column(
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
    password_hash = db.Column(
        db.String(255),
        nullable=False
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    user = db.relationship(
        "User",
        backref=db.backref("password_history", lazy="dynamic", cascade="all, delete-orphan")
    )

    def to_dict(self) -> dict:
        return {
            "history_id": str(self.history_id),
            "user_id": str(self.user_id),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
