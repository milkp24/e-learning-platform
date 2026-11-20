import uuid
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db

# =====================================================================
# school.py: Models โรงเรียน / สถาบัน (Module 1.10)
# - School / SchoolSetting: ข้อมูลโรงเรียน และค่าตั้งค่าเฉพาะโรงเรียน
# - SchoolUser: ผู้ใช้ที่สังกัดโรงเรียน
# - Student / Instructor / InstructorSchool: โปรไฟล์ผู้เรียน, ผู้สอน และสังกัดของผู้สอน
# - SchoolClassroom / ClassroomStudent: ห้องเรียนของโรงเรียน (เช่น ม.4/1) และนักเรียนในห้อง
# หมายเหตุ: SchoolClassroom คือห้องเรียนของโรงเรียน คนละอย่างกับ Classroom ใน
# classroom.py ซึ่งคือคอร์สเรียน (ตาราง courses)
# =====================================================================


class School(db.Model):
    """School institution entity for multi-tenancy (Module 1.10)."""

    __tablename__ = "schools"

    school_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    name = db.Column(
        db.String(255),
        nullable=False
    )
    code = db.Column(
        db.String(50),
        unique=True,
        nullable=True,
        index=True
    )
    address = db.Column(
        db.Text,
        nullable=True
    )
    contact_email = db.Column(
        db.String(255),
        nullable=True
    )
    contact_phone = db.Column(
        db.String(50),
        nullable=True
    )
    # สถานะโรงเรียน: active / inactive
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

    # Relationships
    settings = db.relationship("SchoolSetting", backref="school", cascade="all, delete-orphan", lazy="dynamic")
    school_users = db.relationship("SchoolUser", backref="school", cascade="all, delete-orphan", lazy="dynamic")
    classrooms = db.relationship("SchoolClassroom", backref="school", cascade="all, delete-orphan", lazy="dynamic")
    instructor_schools = db.relationship("InstructorSchool", backref="school", cascade="all, delete-orphan", lazy="dynamic")

    def to_dict(self) -> dict:
        return {
            "school_id": str(self.school_id),
            "name": self.name,
            "code": self.code,
            "address": self.address,
            "contact_email": self.contact_email,
            "contact_phone": self.contact_phone,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class SchoolSetting(db.Model):
    """Custom settings per school institution (Module 1.10)."""

    __tablename__ = "school_settings"

    setting_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    school_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("schools.school_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    key = db.Column(
        db.String(100),
        nullable=False
    )
    value = db.Column(
        db.Text,
        nullable=False
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

    def to_dict(self) -> dict:
        return {
            "setting_id": str(self.setting_id),
            "school_id": str(self.school_id),
            "key": self.key,
            "value": self.value,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class SchoolUser(db.Model):
    """Mapping between User and School institution (Module 1.10)."""

    __tablename__ = "school_users"

    school_user_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    school_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("schools.school_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    role = db.Column(
        db.String(50),
        nullable=False,
        default="member"
    )
    joined_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        db.UniqueConstraint("school_id", "user_id", name="uq_school_user"),
    )

    user = db.relationship("User", backref=db.backref("school_memberships", lazy="dynamic", cascade="all, delete-orphan"))

    def to_dict(self) -> dict:
        return {
            "school_user_id": str(self.school_user_id),
            "school_id": str(self.school_id),
            "user_id": str(self.user_id),
            "role": self.role,
            "joined_at": self.joined_at.isoformat() if self.joined_at else None,
        }


class Student(db.Model):
    """Specific student profile and metadata (Module 1.10)."""

    __tablename__ = "students"

    student_id = db.Column(
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
    student_code = db.Column(
        db.String(50),
        nullable=True,
        index=True
    )
    grade_level = db.Column(
        db.String(50),
        nullable=True
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

    user = db.relationship("User", backref=db.backref("student_profile", uselist=False, cascade="all, delete-orphan"))
    classroom_memberships = db.relationship("ClassroomStudent", backref="student", cascade="all, delete-orphan", lazy="dynamic")

    def to_dict(self) -> dict:
        return {
            "student_id": str(self.student_id),
            "user_id": str(self.user_id),
            "student_code": self.student_code,
            "grade_level": self.grade_level,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Instructor(db.Model):
    """Specific instructor profile and metadata (Module 1.10)."""

    __tablename__ = "instructors"

    instructor_id = db.Column(
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
    title = db.Column(
        db.String(100),
        nullable=True
    )
    bio = db.Column(
        db.Text,
        nullable=True
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

    user = db.relationship("User", backref=db.backref("instructor_profile", uselist=False, cascade="all, delete-orphan"))
    school_affiliations = db.relationship("InstructorSchool", backref="instructor", cascade="all, delete-orphan", lazy="dynamic")

    def to_dict(self) -> dict:
        return {
            "instructor_id": str(self.instructor_id),
            "user_id": str(self.user_id),
            "title": self.title,
            "bio": self.bio,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class InstructorSchool(db.Model):
    """Instructor affiliation with schools (Module 1.10)."""

    __tablename__ = "instructor_schools"

    id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    instructor_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("instructors.instructor_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    school_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("schools.school_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    department = db.Column(
        db.String(100),
        nullable=True
    )
    assigned_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        db.UniqueConstraint("instructor_id", "school_id", name="uq_instructor_school"),
    )

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "instructor_id": str(self.instructor_id),
            "school_id": str(self.school_id),
            "department": self.department,
            "assigned_at": self.assigned_at.isoformat() if self.assigned_at else None,
        }


class SchoolClassroom(db.Model):
    """School classroom entity belonging to a School institution (Module 1.10)."""

    __tablename__ = "classrooms"

    classroom_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    school_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("schools.school_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    classroom_name = db.Column(
        db.String(100),
        nullable=False
    )
    grade_level = db.Column(
        db.String(50),
        nullable=True
    )
    academic_year = db.Column(
        db.String(20),
        nullable=True
    )
    # สถานะห้องเรียนของโรงเรียน: active / inactive
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

    students = db.relationship("ClassroomStudent", backref="school_classroom", cascade="all, delete-orphan", lazy="dynamic")

    def to_dict(self) -> dict:
        return {
            "classroom_id": str(self.classroom_id),
            "school_id": str(self.school_id),
            "classroom_name": self.classroom_name,
            "grade_level": self.grade_level,
            "academic_year": self.academic_year,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


# Alias for backward compatibility
Classroom = SchoolClassroom


class ClassroomStudent(db.Model):
    """Mapping student members into school classrooms (Module 1.10)."""

    __tablename__ = "classroom_students"

    id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    classroom_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("classrooms.classroom_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    student_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("students.student_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    joined_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        db.UniqueConstraint("classroom_id", "student_id", name="uq_classroom_student"),
    )

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "classroom_id": str(self.classroom_id),
            "student_id": str(self.student_id),
            "joined_at": self.joined_at.isoformat() if self.joined_at else None,
        }
