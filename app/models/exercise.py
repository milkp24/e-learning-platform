import uuid
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db


class CodingExercise(db.Model):
    """Coding programming exercise prompt and environment specs (Module 8.1)."""

    __tablename__ = "coding_exercises"

    coding_exercise_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    lesson_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("lessons.lesson_id", ondelete="CASCADE"),
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
    programming_language = db.Column(
        db.String(50),
        nullable=False
    )
    starter_code = db.Column(
        db.Text,
        nullable=True
    )
    solution_code = db.Column(
        db.Text,
        nullable=True
    )
    time_limit_ms = db.Column(
        db.Integer,
        nullable=False,
        default=5000
    )
    memory_limit_mb = db.Column(
        db.Integer,
        nullable=False,
        default=128
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    test_cases = db.relationship("TestCase", backref="coding_exercise", cascade="all, delete-orphan", order_by="TestCase.order_no", lazy="dynamic")
    submissions = db.relationship("CodeSubmission", backref="coding_exercise", cascade="all, delete-orphan", lazy="dynamic")
    lesson = db.relationship("Lesson", backref=db.backref("coding_exercises", lazy="dynamic"))

    def to_dict(self, include_test_cases: bool = False) -> dict:
        data = {
            "coding_exercise_id": str(self.coding_exercise_id),
            "lesson_id": str(self.lesson_id) if self.lesson_id else None,
            "title": self.title,
            "description": self.description,
            "programming_language": self.programming_language,
            "starter_code": self.starter_code,
            "time_limit_ms": self.time_limit_ms,
            "memory_limit_mb": self.memory_limit_mb,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_test_cases:
            data["test_cases"] = [tc.to_dict() for tc in self.test_cases if not tc.is_hidden]
        return data


class TestCase(db.Model):
    """Automated unit test case for code verification (Module 8.1)."""

    __tablename__ = "test_cases"

    test_case_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    coding_exercise_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("coding_exercises.coding_exercise_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    input_data = db.Column(
        db.Text,
        nullable=False
    )
    expected_output = db.Column(
        db.Text,
        nullable=False
    )
    is_hidden = db.Column(
        db.Boolean,
        nullable=False,
        default=False
    )
    order_no = db.Column(
        db.Integer,
        nullable=False,
        default=1
    )

    def to_dict(self) -> dict:
        return {
            "test_case_id": str(self.test_case_id),
            "coding_exercise_id": str(self.coding_exercise_id),
            "input_data": self.input_data,
            "expected_output": self.expected_output,
            "is_hidden": self.is_hidden,
            "order_no": self.order_no,
        }


class CodeSubmission(db.Model):
    """Student code submissions for evaluation (Module 8.1)."""

    __tablename__ = "code_submissions"

    submission_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    coding_exercise_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("coding_exercises.coding_exercise_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    submitted_code = db.Column(
        db.Text,
        nullable=False
    )
    language = db.Column(
        db.String(50),
        nullable=False
    )
    status = db.Column(
        db.String(30),
        nullable=False,
        default="pending"
    )
    score = db.Column(
        db.Numeric(5, 2),
        nullable=True
    )
    submitted_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    user = db.relationship("User", backref=db.backref("code_submissions", lazy="dynamic"))
    executions = db.relationship("CodeExecution", backref="submission", cascade="all, delete-orphan", lazy="dynamic")

    def to_dict(self) -> dict:
        return {
            "submission_id": str(self.submission_id),
            "coding_exercise_id": str(self.coding_exercise_id),
            "user_id": str(self.user_id),
            "language": self.language,
            "status": self.status,
            "score": float(self.score) if self.score is not None else None,
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None,
        }


class CodeExecution(db.Model):
    """Sandbox runtime metrics and execution outputs (Module 8.1)."""

    __tablename__ = "code_executions"

    execution_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    submission_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("code_submissions.submission_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    status = db.Column(
        db.String(30),
        nullable=False
    )
    stdout = db.Column(
        db.Text,
        nullable=True
    )
    stderr = db.Column(
        db.Text,
        nullable=True
    )
    execution_time_ms = db.Column(
        db.Integer,
        nullable=True
    )
    memory_used_kb = db.Column(
        db.Integer,
        nullable=True
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self) -> dict:
        return {
            "execution_id": str(self.execution_id),
            "submission_id": str(self.submission_id),
            "status": self.status,
            "stdout": self.stdout,
            "stderr": self.stderr,
            "execution_time_ms": self.execution_time_ms,
            "memory_used_kb": self.memory_used_kb,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Exercise(db.Model):
    """General practice exercises (Module 8.1)."""

    __tablename__ = "exercises"

    exercise_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    lesson_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("lessons.lesson_id", ondelete="CASCADE"),
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
    exercise_type = db.Column(
        db.String(50),
        nullable=False,
        default="practice"
    )
    total_score = db.Column(
        db.Numeric(5, 2),
        nullable=False,
        default=100.00
    )
    xp_reward = db.Column(
        db.Integer,
        nullable=False,
        default=50
    )
    time_limit = db.Column(
        db.Integer,
        nullable=True,
        default=0
    )
    max_attempts = db.Column(
        db.Integer,
        nullable=True,
        default=None
    )
    status = db.Column(
        db.String(30),
        nullable=False,
        default="published"
    )
    contents_data = db.Column(
        db.JSON,
        nullable=True,
        default=list
    )
    activities_data = db.Column(
        db.JSON,
        nullable=True,
        default=list
    )
    checklists_data = db.Column(
        db.JSON,
        nullable=True,
        default=list
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    lesson = db.relationship("Lesson", backref=db.backref("exercises", lazy="dynamic"))
    attempts = db.relationship("ExerciseAttempt", backref="exercise", cascade="all, delete-orphan", lazy="dynamic")

    def to_dict(self) -> dict:
        return {
            "exercise_id": str(self.exercise_id),
            "lesson_id": str(self.lesson_id) if self.lesson_id else None,
            "title": self.title,
            "instructions": self.instructions,
            "exercise_type": self.exercise_type,
            "total_score": float(self.total_score) if self.total_score is not None else 100.0,
            "xp_reward": self.xp_reward if self.xp_reward is not None else 50,
            "time_limit": self.time_limit if self.time_limit is not None else 0,
            "max_attempts": self.max_attempts,
            "status": self.status,
            "contents_data": self.contents_data or [],
            "activities_data": self.activities_data or [],
            "checklists_data": self.checklists_data or [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class ExerciseAttempt(db.Model):
    """Exercise attempt records with score, status, and submitted_at (Module 8.1)."""

    __tablename__ = "exercise_attempts"

    attempt_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    exercise_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("exercises.exercise_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    score = db.Column(
        db.Numeric(5, 2),
        nullable=True
    )
    status = db.Column(
        db.String(30),
        nullable=False,
        default="in_progress"
    )
    time_spent = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )
    xp_earned = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )
    answers_data = db.Column(
        db.JSON,
        nullable=True,
        default=dict
    )
    feedback_data = db.Column(
        db.JSON,
        nullable=True,
        default=dict
    )
    started_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )
    submitted_at = db.Column(
        db.DateTime(timezone=True),
        nullable=True
    )

    user = db.relationship("User", backref=db.backref("exercise_attempts", lazy="dynamic"))

    def to_dict(self) -> dict:
        return {
            "attempt_id": str(self.attempt_id),
            "exercise_id": str(self.exercise_id),
            "user_id": str(self.user_id),
            "score": float(self.score) if self.score is not None else None,
            "status": self.status,
            "time_spent": self.time_spent if self.time_spent is not None else 0,
            "xp_earned": self.xp_earned if self.xp_earned is not None else 0,
            "answers_data": self.answers_data or {},
            "feedback_data": self.feedback_data or {},
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None,
        }
