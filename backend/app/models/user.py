import uuid
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import UUID
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db


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
    status = db.Column(
        db.String(30),
        nullable=False,
        default="active"
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
        if include_roles:
            data["roles"] = [role.role_name for role in self.roles]
        return data


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
        }
