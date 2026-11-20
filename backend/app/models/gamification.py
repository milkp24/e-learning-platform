import uuid
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import JSON
from app.extensions import db

# =====================================================================
# gamification.py: Models ระบบสร้างแรงจูงใจ (Module 5)
# - UserXP: บันทึกการได้ XP แต่ละครั้ง (source_type = ได้มาจากกิจกรรมอะไร)
# - Level / UserLevel: ระดับเลเวล และเลเวลปัจจุบันของผู้เรียน
# - Badge / UserBadge: เหรียญรางวัล และเหรียญที่ผู้เรียนได้รับ
# - UserStreak: จำนวนวันเรียนต่อเนื่อง
# - Leaderboard: ตารางอันดับตามช่วงเวลา
# - Mission / MissionProgress: ภารกิจ และความคืบหน้าของผู้เรียน
# - Reward / UserReward: รางวัล และรางวัลที่ผู้เรียนได้รับ
# =====================================================================


class UserXP(db.Model):
    """User experience points transaction log (Module 5.1)."""

    __tablename__ = "user_xps"

    xp_id = db.Column(
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
    amount = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )
    source_type = db.Column(
        db.String(50),
        nullable=False
    )
    source_id = db.Column(
        UUID(as_uuid=True),
        nullable=True
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    user = db.relationship("User", backref=db.backref("xp_logs", lazy="dynamic"))

    def to_dict(self) -> dict:
        return {
            "xp_id": str(self.xp_id),
            "user_id": str(self.user_id),
            "amount": self.amount,
            "source_type": self.source_type,
            "source_id": str(self.source_id) if self.source_id else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Level(db.Model):
    """Gamification level progression tiers (Module 5.2)."""

    __tablename__ = "levels"

    level_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    level_number = db.Column(
        db.Integer,
        unique=True,
        nullable=False,
        index=True
    )
    title = db.Column(
        db.String(100),
        nullable=False
    )
    min_xp = db.Column(
        db.Integer,
        nullable=False
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self) -> dict:
        return {
            "level_id": str(self.level_id),
            "level_number": self.level_number,
            "title": self.title,
            "min_xp": self.min_xp,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class UserLevel(db.Model):
    """Current player level status (Module 5.2)."""

    __tablename__ = "user_levels"

    id = db.Column(
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
    level_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("levels.level_id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    current_xp = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    user = db.relationship("User", backref=db.backref("user_level", uselist=False))
    level = db.relationship("Level", backref=db.backref("level_holders", lazy="dynamic"))

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "level_id": str(self.level_id),
            "level_number": self.level.level_number if self.level else None,
            "level_title": self.level.title if self.level else None,
            "current_xp": self.current_xp,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Badge(db.Model):
    """Badge / Achievement definitions (Module 5.3)."""

    __tablename__ = "badges"

    badge_id = db.Column(
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
    icon_url = db.Column(
        db.String(512),
        nullable=True
    )
    badge_type = db.Column(
        db.String(50),
        nullable=True
    )
    criteria_data = db.Column(
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
            "badge_id": str(self.badge_id),
            "name": self.name,
            "description": self.description,
            "icon_url": self.icon_url,
            "badge_type": self.badge_type,
            "criteria_data": self.criteria_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class UserBadge(db.Model):
    """Earned badges by user (Module 5.3)."""

    __tablename__ = "user_badges"

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
    badge_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("badges.badge_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    earned_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        db.UniqueConstraint("user_id", "badge_id", name="uq_user_badge"),
    )

    user = db.relationship("User", backref=db.backref("earned_badges", lazy="dynamic"))
    badge = db.relationship("Badge", backref=db.backref("recipients", lazy="dynamic"))

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "badge_id": str(self.badge_id),
            "badge_name": self.badge.name if self.badge else None,
            "icon_url": self.badge.icon_url if self.badge else None,
            "earned_at": self.earned_at.isoformat() if self.earned_at else None,
        }


class UserStreak(db.Model):
    """Daily learning streak tracking with longest streak and last activity date (Module 5.4)."""

    __tablename__ = "user_streaks"

    streak_id = db.Column(
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
    current_streak = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )
    longest_streak = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )
    last_activity_date = db.Column(
        db.Date,
        nullable=True
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    user = db.relationship("User", backref=db.backref("streak", uselist=False))

    def to_dict(self) -> dict:
        return {
            "streak_id": str(self.streak_id),
            "user_id": str(self.user_id),
            "current_streak": self.current_streak,
            "longest_streak": self.longest_streak,
            "last_activity_date": self.last_activity_date.isoformat() if self.last_activity_date else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Leaderboard(db.Model):
    """Ranking board across periods (Module 5.5)."""

    __tablename__ = "leaderboards"

    leaderboard_id = db.Column(
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
    rank = db.Column(
        db.Integer,
        nullable=False
    )
    score = db.Column(
        db.Integer,
        nullable=False
    )
    period_type = db.Column(
        db.String(30),
        nullable=True
    )
    period_start = db.Column(
        db.Date,
        nullable=True
    )
    period_end = db.Column(
        db.Date,
        nullable=True
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    user = db.relationship("User", backref=db.backref("leaderboard_entries", lazy="dynamic"))

    def to_dict(self) -> dict:
        return {
            "leaderboard_id": str(self.leaderboard_id),
            "user_id": str(self.user_id),
            "user_name": self.user.profile.display_name if self.user and self.user.profile else None,
            "rank": self.rank,
            "score": self.score,
            "period_type": self.period_type,
            "period_start": self.period_start.isoformat() if self.period_start else None,
            "period_end": self.period_end.isoformat() if self.period_end else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Mission(db.Model):
    """Missions and quests (Module 5.6)."""

    __tablename__ = "missions"

    mission_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    title = db.Column(
        db.String(255),
        nullable=False
    )
    description = db.Column(
        db.Text,
        nullable=True
    )
    mission_type = db.Column(
        db.String(50),
        nullable=True
    )
    reward_xp = db.Column(
        db.Integer,
        nullable=True
    )
    reward_data = db.Column(
        JSON,
        nullable=True
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    progresses = db.relationship("MissionProgress", backref="mission", cascade="all, delete-orphan", lazy="dynamic")

    def to_dict(self) -> dict:
        return {
            "mission_id": str(self.mission_id),
            "title": self.title,
            "description": self.description,
            "mission_type": self.mission_type,
            "reward_xp": self.reward_xp,
            "reward_data": self.reward_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class MissionProgress(db.Model):
    """User progress on missions (Module 5.6)."""

    __tablename__ = "mission_progress"

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
    mission_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("missions.mission_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    progress_percent = db.Column(
        db.Numeric(5, 2),
        nullable=False,
        default=0.00
    )
    # สถานะภารกิจของผู้เรียน: in_progress / completed
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
        db.UniqueConstraint("user_id", "mission_id", name="uq_user_mission_progress"),
    )

    user = db.relationship("User", backref=db.backref("mission_progresses", lazy="dynamic"))

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "mission_id": str(self.mission_id),
            "progress_percent": float(self.progress_percent) if self.progress_percent is not None else 0.0,
            "status": self.status,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }


class Reward(db.Model):
    """Reward catalog (Module 5.7)."""

    __tablename__ = "rewards"

    reward_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    name = db.Column(
        db.String(100),
        nullable=False
    )
    description = db.Column(
        db.Text,
        nullable=True
    )
    reward_type = db.Column(
        db.String(50),
        nullable=False
    )
    reward_value = db.Column(
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
            "reward_id": str(self.reward_id),
            "name": self.name,
            "description": self.description,
            "reward_type": self.reward_type,
            "reward_value": self.reward_value,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class UserReward(db.Model):
    """User awarded rewards (Module 5.7)."""

    __tablename__ = "user_rewards"

    user_reward_id = db.Column(
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
    reward_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("rewards.reward_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    awarded_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    user = db.relationship("User", backref=db.backref("rewards", lazy="dynamic"))
    reward = db.relationship("Reward", backref=db.backref("awardees", lazy="dynamic"))

    def to_dict(self) -> dict:
        return {
            "user_reward_id": str(self.user_reward_id),
            "user_id": str(self.user_id),
            "reward_id": str(self.reward_id),
            "reward_name": self.reward.name if self.reward else None,
            "awarded_at": self.awarded_at.isoformat() if self.awarded_at else None,
        }
