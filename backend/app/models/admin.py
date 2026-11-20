import uuid
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import JSON
from app.extensions import db

# =====================================================================
# admin.py: Models งานผู้ดูแลระบบ (Module 9)
# - InteractiveComponent: คลัง component / template สื่อแบบโต้ตอบ
# - Announcement: ประกาศทั้งระบบหรือเฉพาะโรงเรียน
# - Notification: การแจ้งเตือนรายผู้ใช้ (read_at = เวลาที่อ่านแล้ว)
# - Report: รายงานสถิติสรุปของแพลตฟอร์ม
# - AuditLog: ประวัติการกระทำของผู้ดูแล (ใครทำอะไร กับอะไร เมื่อไร)
# - SecurityLog: เหตุการณ์ด้านความปลอดภัย
# - Backup: ประวัติการสำรองข้อมูล
# =====================================================================


class InteractiveComponent(db.Model):
    """Reusable interactive components, media templates and simulators (Module 9.5)."""

    __tablename__ = "interactive_components"

    component_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    name = db.Column(
        db.String(100),
        nullable=False
    )
    component_type = db.Column(
        db.String(50),
        nullable=False
    )
    config_data = db.Column(
        JSON,
        nullable=True
    )
    status = db.Column(
        db.String(30),
        nullable=False,
        default="active"
    )
    created_by = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True,
        index=True
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

    creator = db.relationship("User", backref=db.backref("created_interactive_components", lazy="dynamic"))

    def to_dict(self) -> dict:
        return {
            "component_id": str(self.component_id),
            "name": self.name,
            "component_type": self.component_type,
            "config_data": self.config_data,
            "status": self.status,
            "created_by": str(self.created_by) if self.created_by else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Announcement(db.Model):
    """System-wide or school-specific broadcast announcements (Module 9.7)."""

    __tablename__ = "announcements"

    announcement_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    title = db.Column(
        db.String(255),
        nullable=False
    )
    content = db.Column(
        db.Text,
        nullable=False
    )
    target_role = db.Column(
        db.String(50),
        nullable=True
    )
    school_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("schools.school_id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    created_by = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True,
        index=True
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

    author = db.relationship("User", backref=db.backref("authored_announcements", lazy="dynamic"))
    school = db.relationship("School", backref=db.backref("announcements", lazy="dynamic"))

    def to_dict(self) -> dict:
        return {
            "announcement_id": str(self.announcement_id),
            "title": self.title,
            "content": self.content,
            "target_role": self.target_role,
            "school_id": str(self.school_id) if self.school_id else None,
            "created_by": str(self.created_by) if self.created_by else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Notification(db.Model):
    """User notifications with notification_type, read_at, and link_url (Module 9.7)."""

    __tablename__ = "notifications"

    notification_id = db.Column(
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
    title = db.Column(
        db.String(255),
        nullable=False
    )
    message = db.Column(
        db.Text,
        nullable=False
    )
    notification_type = db.Column(
        db.String(50),
        nullable=False,
        default="general"
    )
    is_read = db.Column(
        db.Boolean,
        nullable=False,
        default=False
    )
    read_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True
    )
    link_url = db.Column(
        db.Text,
        nullable=True
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    user = db.relationship("User", backref=db.backref("notifications", lazy="dynamic"))

    def to_dict(self) -> dict:
        return {
            "notification_id": str(self.notification_id),
            "user_id": str(self.user_id),
            "title": self.title,
            "message": self.message,
            "notification_type": self.notification_type,
            "is_read": self.is_read,
            "read_at": self.read_at.isoformat() if self.read_at else None,
            "link_url": self.link_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Report(db.Model):
    """Platform executive statistical summaries and analytics reports (Module 9.6)."""

    __tablename__ = "reports"

    report_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    title = db.Column(
        db.String(255),
        nullable=False
    )
    report_type = db.Column(
        db.String(50),
        nullable=False
    )
    report_data = db.Column(
        JSON,
        nullable=True
    )
    generated_by = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    generator = db.relationship("User", backref=db.backref("generated_reports", lazy="dynamic"))

    def to_dict(self) -> dict:
        return {
            "report_id": str(self.report_id),
            "title": self.title,
            "report_type": self.report_type,
            "report_data": self.report_data,
            "generated_by": str(self.generated_by) if self.generated_by else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class AuditLog(db.Model):
    """Administrative and system audit action trail (Module 9.10)."""

    __tablename__ = "audit_logs"

    log_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    user_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    action = db.Column(
        db.String(100),
        nullable=False
    )
    entity_type = db.Column(
        db.String(50),
        nullable=True
    )
    entity_id = db.Column(
        UUID(as_uuid=True),
        nullable=True
    )
    details = db.Column(
        JSON,
        nullable=True
    )
    ip_address = db.Column(
        db.String(45),
        nullable=True
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    actor = db.relationship("User", backref=db.backref("audit_logs", lazy="dynamic"))

    def to_dict(self) -> dict:
        return {
            "log_id": str(self.log_id),
            "user_id": str(self.user_id) if self.user_id else None,
            "action": self.action,
            "entity_type": self.entity_type,
            "entity_id": str(self.entity_id) if self.entity_id else None,
            "details": self.details,
            "ip_address": self.ip_address,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class SecurityLog(db.Model):
    """Security events, intrusions, and violation records with user_agent (Module 9.9)."""

    __tablename__ = "security_logs"

    log_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    user_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    event_type = db.Column(
        db.String(100),
        nullable=False
    )
    severity = db.Column(
        db.String(20),
        nullable=False,
        default="info"
    )
    ip_address = db.Column(
        db.String(45),
        nullable=True
    )
    user_agent = db.Column(
        db.Text,
        nullable=True
    )
    details = db.Column(
        JSON,
        nullable=True
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    user = db.relationship("User", backref=db.backref("security_logs", lazy="dynamic"))

    def to_dict(self) -> dict:
        return {
            "log_id": str(self.log_id),
            "user_id": str(self.user_id) if self.user_id else None,
            "event_type": self.event_type,
            "severity": self.severity,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "details": self.details,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Backup(db.Model):
    """Database and file backup history with checksum, file size, status (Module 9.11)."""

    __tablename__ = "backups"

    backup_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    filename = db.Column(
        db.String(255),
        nullable=False
    )
    backup_type = db.Column(
        db.String(50),
        nullable=False,
        default="full"
    )
    file_size = db.Column(
        db.BigInteger,
        nullable=True
    )
    checksum = db.Column(
        db.String(255),
        nullable=True
    )
    status = db.Column(
        db.String(30),
        nullable=False,
        default="completed"
    )
    created_by = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    creator = db.relationship("User", backref=db.backref("executed_backups", lazy="dynamic"))

    def to_dict(self) -> dict:
        return {
            "backup_id": str(self.backup_id),
            "filename": self.filename,
            "backup_type": self.backup_type,
            "file_size": self.file_size,
            "checksum": self.checksum,
            "status": self.status,
            "created_by": str(self.created_by) if self.created_by else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
