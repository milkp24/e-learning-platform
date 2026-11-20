import uuid
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import JSON
from app.extensions import db

# =====================================================================
# progress.py: Models ความก้าวหน้าการเรียน (Module 4)
# ลำดับความละเอียด: LearningProgress (ระดับคอร์ส) -> LessonProgress (ระดับบท)
#                  -> EpisodeProgress (ระดับตอน / ตำแหน่งวิดีโอ)
# - LearningActivity: เหตุการณ์การเรียนรายครั้ง ใช้คำนวณสถิติและ Streak
# - Skill / UserSkill: ทักษะ และระดับทักษะที่ผู้เรียนปลดล็อกแล้ว
# - LearningSummary: ตัวเลขสรุปการเรียนที่คำนวณไว้แล้ว
# =====================================================================


class LearningProgress(db.Model):
    """Course-level learning progress tracking (Module 4.1)."""

    __tablename__ = "learning_progress"

    progress_id = db.Column(
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
    course_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("courses.classroom_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    progress_percent = db.Column(
        db.Numeric(5, 2),
        nullable=False,
        default=0.00
    )
    # ความคืบหน้าระดับคอร์ส: in_progress / completed
    status = db.Column(
        db.String(30),
        nullable=False,
        default="in_progress"
    )
    last_accessed_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )
    completed_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True
    )

    __table_args__ = (
        db.UniqueConstraint("user_id", "course_id", name="uq_user_course_progress"),
    )

    user = db.relationship("User", backref=db.backref("course_progresses", lazy="dynamic"))
    course = db.relationship("Classroom", backref=db.backref("user_progresses", lazy="dynamic"))

    def to_dict(self) -> dict:
        return {
            "progress_id": str(self.progress_id),
            "user_id": str(self.user_id),
            "course_id": str(self.course_id),
            "progress_percent": float(self.progress_percent) if self.progress_percent is not None else 0.0,
            "status": self.status,
            "last_accessed_at": self.last_accessed_at.isoformat() if self.last_accessed_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


class LessonProgress(db.Model):
    """Lesson-level completion status (Module 4.1)."""

    __tablename__ = "lesson_progress"

    id = db.Column(
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
    lesson_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("lessons.lesson_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    # ความคืบหน้าระดับบท: in_progress / completed
    # บทถัดไปจะปลดล็อกเมื่อบทก่อนหน้าทุกบทเป็น "completed" (lesson_service)
    status = db.Column(
        db.String(30),
        nullable=False,
        default="in_progress"
    )
    completed_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True
    )

    __table_args__ = (
        db.UniqueConstraint("user_id", "lesson_id", name="uq_user_lesson_progress"),
    )

    user = db.relationship("User", backref=db.backref("lesson_progresses", lazy="dynamic"))
    lesson = db.relationship("Lesson", backref=db.backref("user_progresses", lazy="dynamic"))

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "lesson_id": str(self.lesson_id),
            "status": self.status,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


class EpisodeProgress(db.Model):
    """Episode-level playback tracking (Module 4.1)."""

    __tablename__ = "episode_progress"

    id = db.Column(
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
    episode_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("episodes.episode_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    watched_seconds = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )
    is_completed = db.Column(
        db.Boolean,
        nullable=False,
        default=False
    )
    completed_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True
    )

    __table_args__ = (
        db.UniqueConstraint("user_id", "episode_id", name="uq_user_episode_progress"),
    )

    user = db.relationship("User", backref=db.backref("episode_progresses", lazy="dynamic"))
    episode = db.relationship("Episode", backref=db.backref("user_progresses", lazy="dynamic"))

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "episode_id": str(self.episode_id),
            "watched_seconds": self.watched_seconds,
            "is_completed": self.is_completed,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


class LearningActivity(db.Model):
    """Activity event stream for analytics and streak calculation (Module 4.1)."""

    __tablename__ = "learning_activities"

    activity_id = db.Column(
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
    activity_type = db.Column(
        db.String(50),
        nullable=False
    )
    activity_data = db.Column(
        JSON,
        nullable=True
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    user = db.relationship("User", backref=db.backref("learning_activities", lazy="dynamic"))

    def to_dict(self) -> dict:
        return {
            "activity_id": str(self.activity_id),
            "user_id": str(self.user_id),
            "activity_type": self.activity_type,
            "activity_data": self.activity_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Skill(db.Model):
    """Skill taxonomy dictionary (Module 4.2)."""

    __tablename__ = "skills"

    skill_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    name = db.Column(
        db.String(100),
        unique=True,
        nullable=False,
        index=True
    )
    description = db.Column(
        db.Text,
        nullable=True
    )
    category = db.Column(
        db.String(50),
        nullable=True
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self) -> dict:
        return {
            "skill_id": str(self.skill_id),
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class UserSkill(db.Model):
    """Student skill unlock levels (Module 4.2)."""

    __tablename__ = "user_skills"

    id = db.Column(
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
    skill_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("skills.skill_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    level = db.Column(
        db.Integer,
        nullable=False,
        default=1
    )
    is_unlocked = db.Column(
        db.Boolean,
        nullable=False,
        default=True
    )
    unlocked_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        db.UniqueConstraint("user_id", "skill_id", name="uq_user_skill"),
    )

    user = db.relationship("User", backref=db.backref("user_skills", lazy="dynamic"))
    skill = db.relationship("Skill", backref=db.backref("user_skills", lazy="dynamic"))

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "skill_id": str(self.skill_id),
            "skill_name": self.skill.name if self.skill else None,
            "level": self.level,
            "is_unlocked": self.is_unlocked,
            "unlocked_at": self.unlocked_at.isoformat() if self.unlocked_at else None,
        }


class LearningSummary(db.Model):
    """Aggregated learning metrics and summary (Module 4.3)."""

    __tablename__ = "learning_summaries"

    summary_id = db.Column(
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
    total_courses_enrolled = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )
    total_courses_completed = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )
    total_learning_time_minutes = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )
    total_xp_earned = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )
    summary_data = db.Column(
        JSON,
        nullable=True
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    user = db.relationship("User", backref=db.backref("learning_summary", uselist=False))

    def to_dict(self) -> dict:
        return {
            "summary_id": str(self.summary_id),
            "user_id": str(self.user_id),
            "total_courses_enrolled": self.total_courses_enrolled,
            "total_courses_completed": self.total_courses_completed,
            "total_learning_time_minutes": self.total_learning_time_minutes,
            "total_xp_earned": self.total_xp_earned,
            "summary_data": self.summary_data,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
