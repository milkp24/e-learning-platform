import uuid
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import JSON
from app.extensions import db

# =====================================================================
# virtuallab.py: Models ห้องทดลองเสมือน (Module 7)
# - VirtualLab: ห้องทดลอง 1 ห้อง
# - LabProject / LabDevice: โปรเจกต์ของผู้เรียน และอุปกรณ์ที่วางบนวงจร
# - Simulation: สถานะการจำลองการทำงาน
# - LabAssignment: โจทย์การทดลองที่ผู้สอนมอบหมาย
# =====================================================================


class VirtualLab(db.Model):
    """Virtual laboratory environment (Module 7.1)."""

    __tablename__ = "virtual_labs"

    lab_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    name = db.Column(
        db.String(255),
        nullable=False
    )
    description = db.Column(
        db.Text,
        nullable=True
    )
    lab_type = db.Column(
        db.String(50),
        nullable=False,
        default="circuit"
    )
    config_data = db.Column(
        JSON,
        nullable=True
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    projects = db.relationship("LabProject", backref="lab", cascade="all, delete-orphan", lazy="dynamic")
    assignments = db.relationship("LabAssignment", backref="lab", cascade="all, delete-orphan", lazy="dynamic")

    def to_dict(self) -> dict:
        return {
            "lab_id": str(self.lab_id),
            "name": self.name,
            "description": self.description,
            "lab_type": self.lab_type,
            "config_data": self.config_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class LabProject(db.Model):
    """Student experiment and circuit projects (Module 7.4)."""

    __tablename__ = "lab_projects"

    project_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    lab_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("virtual_labs.lab_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    name = db.Column(
        db.String(255),
        nullable=False
    )
    project_data = db.Column(
        JSON,
        nullable=True
    )
    status = db.Column(
        db.String(30),
        nullable=False,
        default="draft"
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

    user = db.relationship("User", backref=db.backref("lab_projects", lazy="dynamic"))
    devices = db.relationship("LabDevice", backref="project", cascade="all, delete-orphan", lazy="dynamic")
    simulations = db.relationship("Simulation", backref="project", cascade="all, delete-orphan", lazy="dynamic")

    def to_dict(self) -> dict:
        return {
            "project_id": str(self.project_id),
            "lab_id": str(self.lab_id),
            "user_id": str(self.user_id),
            "name": self.name,
            "project_data": self.project_data,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class LabDevice(db.Model):
    """Virtual devices placed in experiment canvas (Module 7.2)."""

    __tablename__ = "lab_devices"

    device_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    project_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("lab_projects.project_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    device_name = db.Column(
        db.String(100),
        nullable=False
    )
    device_type = db.Column(
        db.String(50),
        nullable=False
    )
    device_config = db.Column(
        JSON,
        nullable=True
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self) -> dict:
        return {
            "device_id": str(self.device_id),
            "project_id": str(self.project_id),
            "device_name": self.device_name,
            "device_type": self.device_type,
            "device_config": self.device_config,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Simulation(db.Model):
    """Real-time simulation engine states and outputs (Module 7.3)."""

    __tablename__ = "simulations"

    simulation_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    project_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("lab_projects.project_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    state_data = db.Column(
        JSON,
        nullable=True
    )
    status = db.Column(
        db.String(30),
        nullable=False,
        default="idle"
    )
    last_run_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True
    )

    def to_dict(self) -> dict:
        return {
            "simulation_id": str(self.simulation_id),
            "project_id": str(self.project_id),
            "state_data": self.state_data,
            "status": self.status,
            "last_run_at": self.last_run_at.isoformat() if self.last_run_at else None,
        }


class LabAssignment(db.Model):
    """Assigned lab worksheets and project prompts (Module 7.4)."""

    __tablename__ = "lab_assignments"

    assignment_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    lab_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("virtual_labs.lab_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    course_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("courses.classroom_id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    title = db.Column(
        db.String(255),
        nullable=False
    )
    instructions = db.Column(
        db.Text,
        nullable=True
    )
    due_date = db.Column(
        db.DateTime(timezone=True),
        nullable=True
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    course = db.relationship("Classroom", backref=db.backref("lab_assignments", lazy="dynamic"))

    def to_dict(self) -> dict:
        return {
            "assignment_id": str(self.assignment_id),
            "lab_id": str(self.lab_id),
            "course_id": str(self.course_id) if self.course_id else None,
            "title": self.title,
            "instructions": self.instructions,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
