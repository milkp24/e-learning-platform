import uuid
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db

# =====================================================================
# quiz.py: Models แบบทดสอบ (Module 8.2 - 8.4)
# - Question / QuestionOption: คลังคำถามกลาง และตัวเลือกของแต่ละข้อ
# - Quiz / QuizQuestion / QuizCondition: ชุดข้อสอบ, คำถามในชุด (มีลำดับ), เงื่อนไขการสอบ
# - QuizAttempt / QuizAnswer / QuizResult: การเข้าสอบแต่ละครั้ง, คำตอบรายข้อ, ผลคะแนน
# =====================================================================


class Quiz(db.Model):
    """Quiz assessment suite (Module 8.2)."""

    __tablename__ = "quizzes"

    quiz_id = db.Column(
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

    lesson = db.relationship("Lesson", backref=db.backref("quizzes", lazy="dynamic"))
    course = db.relationship("Classroom", backref=db.backref("quizzes", lazy="dynamic"))
    condition = db.relationship("QuizCondition", backref="quiz", uselist=False, cascade="all, delete-orphan")
    quiz_questions = db.relationship("QuizQuestion", backref="quiz", cascade="all, delete-orphan", order_by="QuizQuestion.order_no", lazy="dynamic")
    attempts = db.relationship("QuizAttempt", backref="quiz", cascade="all, delete-orphan", lazy="dynamic")

    def to_dict(self, include_condition: bool = True) -> dict:
        data = {
            "quiz_id": str(self.quiz_id),
            "lesson_id": str(self.lesson_id) if self.lesson_id else None,
            "course_id": str(self.course_id) if self.course_id else None,
            "title": self.title,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_condition and self.condition:
            data["condition"] = self.condition.to_dict()
        return data


class QuizCondition(db.Model):
    """Quiz rules, passing score, time limits, and attempt limits (Module 8.3)."""

    __tablename__ = "quiz_conditions"

    condition_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    quiz_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("quizzes.quiz_id", ondelete="CASCADE"),
        unique=True,
        nullable=False
    )
    max_attempts = db.Column(
        db.Integer,
        nullable=True
    )
    time_limit_minutes = db.Column(
        db.Integer,
        nullable=True
    )
    passing_score = db.Column(
        db.Numeric(5, 2),
        nullable=True
    )

    def to_dict(self) -> dict:
        return {
            "condition_id": str(self.condition_id),
            "quiz_id": str(self.quiz_id),
            "max_attempts": self.max_attempts,
            "time_limit_minutes": self.time_limit_minutes,
            "passing_score": float(self.passing_score) if self.passing_score is not None else None,
        }


class Question(db.Model):
    """Master question bank (Module 8.2 & 9.3)."""

    __tablename__ = "questions"

    question_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    question_text = db.Column(
        db.Text,
        nullable=False
    )
    # ชนิดคำถามที่ quiz_service รองรับ: multiple_choice, true_false, image_choice,
    # scenario, matching, ordering, simulation, architecture_builder
    question_type = db.Column(
        db.String(50),
        nullable=False,
        default="multiple_choice"
    )
    explanation = db.Column(
        db.Text,
        nullable=True
    )
    image_url = db.Column(
        db.String(500),
        nullable=True
    )
    points = db.Column(
        db.Numeric(5, 2),
        nullable=True,
        default=1.0
    )
    scenario = db.Column(
        db.Text,
        nullable=True
    )
    difficulty = db.Column(
        db.String(20),
        nullable=True
    )
    skill = db.Column(
        db.String(50),
        nullable=True
    )
    concept = db.Column(
        db.String(100),
        nullable=True
    )
    learning_objective = db.Column(
        db.Text,
        nullable=True
    )
    chapter = db.Column(
        db.String(50),
        nullable=True
    )
    episode = db.Column(
        db.String(50),
        nullable=True
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    options = db.relationship("QuestionOption", backref="question", cascade="all, delete-orphan", order_by="QuestionOption.order_no", lazy="dynamic")

    def to_dict(self, include_options: bool = True) -> dict:
        data = {
            "question_id": str(self.question_id),
            "question_text": self.question_text,
            "question_type": self.question_type,
            "image_url": self.image_url,
            "points": float(self.points) if self.points is not None else 1.0,
            "explanation": self.explanation,
            "scenario": self.scenario,
            "difficulty": self.difficulty,
            "skill": self.skill,
            "concept": self.concept,
            "learning_objective": self.learning_objective,
            "chapter": self.chapter,
            "episode": self.episode,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_options:
            data["options"] = [opt.to_dict() for opt in self.options]
        return data


class QuizQuestion(db.Model):
    """Mapping questions into quizzes with ordering (Module 8.2)."""

    __tablename__ = "quiz_questions"

    id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    quiz_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("quizzes.quiz_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    question_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("questions.question_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    order_no = db.Column(
        db.Integer,
        nullable=False,
        default=1
    )

    __table_args__ = (
        db.UniqueConstraint("quiz_id", "question_id", name="uq_quiz_question"),
    )

    question = db.relationship("Question")

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "quiz_id": str(self.quiz_id),
            "question_id": str(self.question_id),
            "order_no": self.order_no,
        }


class QuestionOption(db.Model):
    """Multiple choice options for questions (Module 8.2)."""

    __tablename__ = "question_options"

    option_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    question_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("questions.question_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    option_text = db.Column(
        db.Text,
        nullable=False
    )
    image_url = db.Column(
        db.String(500),
        nullable=True
    )
    is_correct = db.Column(
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
            "option_id": str(self.option_id),
            "question_id": str(self.question_id),
            "option_text": self.option_text,
            "image_url": self.image_url,
            "is_correct": self.is_correct,
            "order_no": self.order_no,
        }


class QuizAttempt(db.Model):
    """Student examination attempts with start/submit timestamps and status (Module 8.4)."""

    __tablename__ = "quiz_attempts"

    attempt_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    quiz_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("quizzes.quiz_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
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
    # สถานะการสอบ: in_progress -> submitted / completed
    # หรือ expired / time_expired เมื่อหมดเวลาหรือถูกแทนที่ด้วยการสอบรอบใหม่
    status = db.Column(
        db.String(30),
        nullable=False,
        default="in_progress"
    )

    user = db.relationship("User", backref=db.backref("quiz_attempts", lazy="dynamic"))
    answers = db.relationship("QuizAnswer", backref="attempt", cascade="all, delete-orphan", lazy="dynamic")
    result = db.relationship("QuizResult", backref="attempt", uselist=False, cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        data = {
            "attempt_id": str(self.attempt_id),
            "quiz_id": str(self.quiz_id),
            "user_id": str(self.user_id),
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None,
            "status": self.status,
        }
        if self.quiz and self.quiz.condition and self.quiz.condition.time_limit_minutes:
            tl = self.quiz.condition.time_limit_minutes
            data["time_limit_minutes"] = tl
            if self.started_at:
                from datetime import timedelta
                data["expires_at"] = (self.started_at + timedelta(minutes=tl)).isoformat()
        if self.started_at and self.submitted_at:
            data["time_spent"] = int((self.submitted_at - self.started_at).total_seconds())
        return data


class QuizAnswer(db.Model):
    """Student answers recorded per question with option_id and answer_text (Module 8.4)."""

    __tablename__ = "quiz_answers"
    __table_args__ = (
        db.UniqueConstraint("attempt_id", "question_id", name="uq_quiz_answers_attempt_question"),
    )

    answer_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    attempt_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("quiz_attempts.attempt_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    question_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("questions.question_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    option_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("question_options.option_id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    answer_text = db.Column(
        db.Text,
        nullable=True
    )
    is_correct = db.Column(
        db.Boolean,
        nullable=True
    )

    question = db.relationship("Question")
    option = db.relationship("QuestionOption")

    def to_dict(self) -> dict:
        return {
            "answer_id": str(self.answer_id),
            "attempt_id": str(self.attempt_id),
            "question_id": str(self.question_id),
            "option_id": str(self.option_id) if self.option_id else None,
            "answer_text": self.answer_text,
            "is_correct": self.is_correct,
        }


class QuizResult(db.Model):
    """Calculated quiz score and outcome feedback (Module 8.4)."""

    __tablename__ = "quiz_results"

    result_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    attempt_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("quiz_attempts.attempt_id", ondelete="CASCADE"),
        unique=True,
        nullable=False
    )
    user_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    score = db.Column(
        db.Numeric(5, 2),
        nullable=False
    )
    total_score = db.Column(
        db.Numeric(5, 2),
        nullable=False
    )
    percentage = db.Column(
        db.Numeric(5, 2),
        nullable=False
    )
    is_passed = db.Column(
        db.Boolean,
        nullable=False
    )
    feedback = db.Column(
        db.Text,
        nullable=True
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    user = db.relationship("User", backref=db.backref("quiz_results", lazy="dynamic"))

    def to_dict(self) -> dict:
        return {
            "result_id": str(self.result_id),
            "attempt_id": str(self.attempt_id),
            "user_id": str(self.user_id),
            "score": float(self.score),
            "total_score": float(self.total_score),
            "percentage": float(self.percentage),
            "is_passed": self.is_passed,
            "passed": self.is_passed,
            "feedback": self.feedback,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
