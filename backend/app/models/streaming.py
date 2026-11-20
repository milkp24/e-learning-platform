import uuid
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import JSON
from app.extensions import db

# =====================================================================
# streaming.py: Models การเรียนสด / Live Streaming (Module 3)
# - OnlineRoom: ห้องสำหรับถ่ายทอดสด
# - LiveSchedule: ตารางนัด Live ล่วงหน้า
# - LiveSession: รอบการ Live ที่กำลังเกิดหรือจบแล้ว
# - ChatMessage: ข้อความแชทระหว่าง Live
# - LiveRecording: ไฟล์บันทึกย้อนหลัง
# - LiveParticipant: ผู้เข้าร่วม และสิทธิ์เปิดไมค์
# =====================================================================


class OnlineRoom(db.Model):
    """WebRTC / Streaming virtual room container (Module 3.1)."""

    __tablename__ = "online_rooms"

    room_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    room_name = db.Column(
        db.String(255),
        nullable=False
    )
    room_type = db.Column(
        db.String(50),
        nullable=False,
        default="webrtc"
    )
    config_data = db.Column(
        JSON,
        nullable=True
    )
    status = db.Column(
        db.String(30),
        nullable=False,
        default="inactive"
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    sessions = db.relationship("LiveSession", backref="room", lazy="dynamic")

    def to_dict(self) -> dict:
        return {
            "room_id": str(self.room_id),
            "room_name": self.room_name,
            "room_type": self.room_type,
            "config_data": self.config_data,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class LiveSchedule(db.Model):
    """Scheduled live streaming sessions (Module 3.2)."""

    __tablename__ = "live_schedules"

    schedule_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    course_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("courses.classroom_id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    instructor_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title = db.Column(
        db.String(255),
        nullable=False
    )
    description = db.Column(
        db.Text,
        nullable=True
    )
    scheduled_start = db.Column(
        db.DateTime(timezone=True),
        nullable=False
    )
    scheduled_end = db.Column(
        db.DateTime(timezone=True),
        nullable=False
    )
    status = db.Column(
        db.String(30),
        nullable=False,
        default="scheduled"
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    instructor = db.relationship("User", backref=db.backref("live_schedules", lazy="dynamic"))
    course = db.relationship("Classroom", backref=db.backref("live_schedules", lazy="dynamic"))
    sessions = db.relationship("LiveSession", backref="schedule", lazy="dynamic")

    def to_dict(self) -> dict:
        return {
            "schedule_id": str(self.schedule_id),
            "course_id": str(self.course_id) if self.course_id else None,
            "instructor_id": str(self.instructor_id),
            "title": self.title,
            "description": self.description,
            "scheduled_start": self.scheduled_start.isoformat() if self.scheduled_start else None,
            "scheduled_end": self.scheduled_end.isoformat() if self.scheduled_end else None,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class LiveSession(db.Model):
    """Active or past live streaming session (Module 3.1)."""

    __tablename__ = "live_sessions"

    live_session_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    schedule_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("live_schedules.schedule_id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    room_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("online_rooms.room_id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    instructor_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title = db.Column(
        db.String(255),
        nullable=False
    )
    status = db.Column(
        db.String(30),
        nullable=False,
        default="live"
    )
    started_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )
    ended_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True
    )

    instructor = db.relationship("User", backref=db.backref("hosted_live_sessions", lazy="dynamic"))
    messages = db.relationship("ChatMessage", backref="session", cascade="all, delete-orphan", lazy="dynamic")
    recordings = db.relationship("LiveRecording", backref="session", cascade="all, delete-orphan", lazy="dynamic")
    participants = db.relationship("LiveParticipant", backref="session", cascade="all, delete-orphan", lazy="dynamic")

    def to_dict(self) -> dict:
        return {
            "live_session_id": str(self.live_session_id),
            "schedule_id": str(self.schedule_id) if self.schedule_id else None,
            "room_id": str(self.room_id) if self.room_id else None,
            "instructor_id": str(self.instructor_id),
            "title": self.title,
            "status": self.status,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
        }


class ChatMessage(db.Model):
    """In-stream live chat messages (Module 3.3)."""

    __tablename__ = "chat_messages"

    message_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    live_session_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("live_sessions.live_session_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    message = db.Column(
        db.Text,
        nullable=False
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    sender = db.relationship("User", backref=db.backref("chat_messages", lazy="dynamic"))

    def to_dict(self) -> dict:
        return {
            "message_id": str(self.message_id),
            "live_session_id": str(self.live_session_id),
            "user_id": str(self.user_id),
            "sender_name": self.sender.profile.display_name if self.sender and self.sender.profile else None,
            "message": self.message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class LiveRecording(db.Model):
    """Automated and saved live stream recordings (Module 3.4)."""

    __tablename__ = "live_recordings"

    recording_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    live_session_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("live_sessions.live_session_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    file_url = db.Column(
        db.String(512),
        nullable=False
    )
    duration_seconds = db.Column(
        db.Integer,
        nullable=True
    )
    file_size = db.Column(
        db.BigInteger,
        nullable=True
    )
    status = db.Column(
        db.String(30),
        nullable=False,
        default="ready"
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self) -> dict:
        return {
            "recording_id": str(self.recording_id),
            "live_session_id": str(self.live_session_id),
            "file_url": self.file_url,
            "duration_seconds": self.duration_seconds,
            "file_size": self.file_size,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class LiveParticipant(db.Model):
    """Live stream participant tracking and microphone permission (Module 3.5)."""

    __tablename__ = "live_participants"

    participant_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    live_session_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("live_sessions.live_session_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    mic_permission = db.Column(
        db.String(30),
        nullable=False,
        default="muted"
    )
    joined_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )
    left_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True
    )

    user = db.relationship("User", backref=db.backref("live_participations", lazy="dynamic"))

    def to_dict(self) -> dict:
        return {
            "participant_id": str(self.participant_id),
            "live_session_id": str(self.live_session_id),
            "user_id": str(self.user_id),
            "user_name": self.user.profile.display_name if self.user and self.user.profile else None,
            "mic_permission": self.mic_permission,
            "joined_at": self.joined_at.isoformat() if self.joined_at else None,
            "left_at": self.left_at.isoformat() if self.left_at else None,
        }
