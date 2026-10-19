import uuid
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import JSON
from app.extensions import db


class Story(db.Model):
    """Narrative story theme and adventure line (Module 6.1)."""

    __tablename__ = "stories"

    story_id = db.Column(
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
    title = db.Column(
        db.String(255),
        nullable=False
    )
    description = db.Column(
        db.Text,
        nullable=True
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    scenes = db.relationship("StoryScene", backref="story", cascade="all, delete-orphan", order_by="StoryScene.sequence_no", lazy="dynamic")
    course = db.relationship("Classroom", backref=db.backref("stories", lazy="dynamic"))

    def to_dict(self, include_scenes: bool = False) -> dict:
        data = {
            "story_id": str(self.story_id),
            "course_id": str(self.course_id) if self.course_id else None,
            "title": self.title,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_scenes:
            data["scenes"] = [s.to_dict() for s in self.scenes]
        return data


class StoryScene(db.Model):
    """Dialogue and stage scenes in the story (Module 6.1)."""

    __tablename__ = "story_scenes"

    scene_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    story_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("stories.story_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    sequence_no = db.Column(
        db.Integer,
        nullable=False,
        default=1
    )
    title = db.Column(
        db.String(255),
        nullable=True
    )
    content = db.Column(
        db.Text,
        nullable=True
    )
    scene_data = db.Column(
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
            "scene_id": str(self.scene_id),
            "story_id": str(self.story_id),
            "sequence_no": self.sequence_no,
            "title": self.title,
            "content": self.content,
            "scene_data": self.scene_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class StoryProgress(db.Model):
    """Track student scene and story progress (Module 6.3)."""

    __tablename__ = "story_progress"

    story_progress_id = db.Column(
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
    story_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("stories.story_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    scene_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("story_scenes.scene_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    status = db.Column(
        db.String(30),
        nullable=False,
        default="in_progress"
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        db.UniqueConstraint("user_id", "story_id", name="uq_user_story_progress"),
    )

    user = db.relationship("User", backref=db.backref("story_progresses", lazy="dynamic"))
    story = db.relationship("Story", backref=db.backref("user_progresses", lazy="dynamic"))
    scene = db.relationship("StoryScene", backref=db.backref("user_progresses", lazy="dynamic"))

    def to_dict(self) -> dict:
        return {
            "story_progress_id": str(self.story_progress_id),
            "user_id": str(self.user_id),
            "story_id": str(self.story_id),
            "scene_id": str(self.scene_id),
            "status": self.status,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
