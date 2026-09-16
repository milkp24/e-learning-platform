import uuid
from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db

DEFAULT_ROLES = ["student", "instructor", "admin"]


class Role(db.Model):
    """Role model defining access levels in the platform."""

    __tablename__ = "roles"

    role_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    role_name = db.Column(
        db.String(50),
        unique=True,
        nullable=False,
        index=True
    )

    def to_dict(self) -> dict:
        """Serialize role object to dictionary."""
        return {
            "role_id": str(self.role_id),
            "role_name": self.role_name
        }


class UserRole(db.Model):
    """Mapping model connecting Users and Roles with unique constraint."""

    __tablename__ = "user_roles"

    user_role_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    user_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False
    )
    role_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("roles.role_id", ondelete="CASCADE"),
        nullable=False
    )

    __table_args__ = (
        db.UniqueConstraint("user_id", "role_id", name="uq_user_role"),
    )

    def to_dict(self) -> dict:
        """Serialize user role mapping to dictionary."""
        return {
            "user_role_id": str(self.user_role_id),
            "user_id": str(self.user_id),
            "role_id": str(self.role_id)
        }


def seed_default_roles() -> list[Role]:
    """Ensure default roles (student, instructor, admin) exist in database."""
    roles = []
    for name in DEFAULT_ROLES:
        role = Role.query.filter_by(role_name=name).first()
        if not role:
            role = Role(role_name=name)
            db.session.add(role)
        roles.append(role)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
    return roles
