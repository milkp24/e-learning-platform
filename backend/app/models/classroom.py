import uuid
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import UUID
from app.extensions import db

# =====================================================================
# classroom.py: Models สำหรับโครงสร้างคอร์สเรียน และบันทึกการเรียนรู้
# โครงสร้างหลัก: Course (Classroom) -> Chapter (Lesson) -> Episode -> Content
# ตารางเสริม: ClassroomMember (Enrollment), Journal (บันทึกการเรียนรู้)
# =====================================================================

# ---------------------------------------------------------------------
# สถานะคอร์ส (Classroom.status) มี 4 ค่า
#   draft    = ฉบับร่าง     กำลังทำเนื้อหา เห็นเฉพาะเจ้าของคอร์สและ Admin
#   pending  = รอตรวจสอบ   ผู้สอนส่งขอเผยแพร่ รอผู้มีสิทธิ์ courses.publish อนุมัติ
#   active   = เผยแพร่แล้ว  ทุกคนเห็น (รวม Guest) และลงทะเบียนได้
#   archived = เก็บถาวร     ซ่อนจากรายการคอร์ส ไม่รับลงทะเบียนใหม่
#                           ผู้ที่ลงทะเบียนแล้วยังเข้าเรียนได้ กู้คืนกลับเป็นฉบับร่างได้
# คอร์สที่ไม่ใช่ active: เห็นได้เฉพาะผู้ที่จัดการคอร์สได้ และผู้เรียนที่ลงทะเบียนไว้แล้ว
# การเปลี่ยนสถานะทำผ่าน ClassroomService.change_status เท่านั้น (ตรวจสิทธิ์ตาม Permission Matrix)
# ---------------------------------------------------------------------
COURSE_STATUS_DRAFT = "draft"
COURSE_STATUS_PENDING = "pending"
COURSE_STATUS_ACTIVE = "active"
COURSE_STATUS_ARCHIVED = "archived"
COURSE_STATUSES = (
    COURSE_STATUS_DRAFT,
    COURSE_STATUS_PENDING,
    COURSE_STATUS_ACTIVE,
    COURSE_STATUS_ARCHIVED,
)
# ชื่อเรียกเดิมที่เคยใช้ในโค้ด จะถูกแปลงเป็นค่ามาตรฐานก่อนบันทึก
# (ข้อมูลเก่าในฐานข้อมูลแปลงด้วย migration c3a1d5e7f902)
COURSE_STATUS_ALIASES = {
    "published": COURSE_STATUS_ACTIVE,
    "under_review": COURSE_STATUS_PENDING,
    "inactive": COURSE_STATUS_ARCHIVED,
}


class CourseCategory(db.Model):
    """Course category taxonomy (Module 2.1)."""

    __tablename__ = "course_categories"

    category_id = db.Column(
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
    icon_url = db.Column(
        db.String(512),
        nullable=True
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self) -> dict:
        return {
            "category_id": str(self.category_id),
            "name": self.name,
            "description": self.description,
            "icon_url": self.icon_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Classroom(db.Model):
    """
    โมเดล Course / Classroom (คอร์สเรียน)
    - ตารางทางกายภาพ: courses (เปลี่ยนจาก classrooms ใน Phase 1A เพื่อรองรับ Target Schema)
    - มีความสัมพันธ์ 1-to-many กับ Chapter (Lesson) และ ClassroomMember
    """

    __tablename__ = "courses"

    classroom_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    instructor_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.user_id", ondelete="RESTRICT"),
        nullable=False,
        index=True
    )
    category_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("course_categories.category_id", ondelete="SET NULL"),
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
    thumbnail_url = db.Column(
        db.String(512),
        nullable=True
    )
    # สถานะคอร์ส: ค่าที่ใช้ได้ดู COURSE_STATUSES ด้านบนของไฟล์
    # คอร์สใหม่เริ่มเป็นฉบับร่าง ต้องกดเผยแพร่ก่อนผู้เรียนจึงจะเห็น
    status = db.Column(
        db.String(30),
        nullable=False,
        default=COURSE_STATUS_DRAFT
    )
    # เหตุผลล่าสุดที่ผู้ตรวจไม่อนุมัติการเผยแพร่ (แสดงให้ผู้สอนเห็นบนคอร์ส)
    # ล้างค่าเมื่อส่งตรวจใหม่หรือเผยแพร่สำเร็จ
    review_note = db.Column(
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

    # Relationships
    instructor = db.relationship(
        "User",
        backref=db.backref("instructed_classrooms", lazy="dynamic", passive_deletes=True)
    )
    category = db.relationship(
        "CourseCategory",
        backref=db.backref("courses", lazy="dynamic")
    )
    members = db.relationship(
        "ClassroomMember",
        back_populates="classroom",
        cascade="all, delete-orphan"
    )
    chapters = db.relationship(
        "Chapter",
        back_populates="course",
        cascade="all, delete-orphan",
        order_by="Chapter.sequence_no"
    )
    lessons = db.relationship(
        "Lesson",
        back_populates="classroom",
        cascade="all, delete-orphan",
        order_by="Lesson.sequence_no"
    )
    reviews = db.relationship(
        "Review",
        back_populates="course",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )

    @property
    def is_published(self) -> bool:
        """คอร์สเผยแพร่แล้วหรือยัง (Guest และผู้เรียนทั่วไปเห็นได้)"""
        return self.status == COURSE_STATUS_ACTIVE

    def has_member(self, user_id) -> bool:
        """ตรวจสอบว่าผู้ใช้เป็นสมาชิก (ลงทะเบียน) ในคอร์สนี้หรือไม่"""
        str_id = str(user_id)
        return any(str(m.user_id) == str_id for m in self.members)

    def to_dict(self, include_members: bool = False, include_lessons: bool = False) -> dict:
        """แปลงข้อมูลคอร์สเรียนเป็น Dictionary สำหรับส่งกลับผ่าน API"""
        data = {
            "classroom_id": str(self.classroom_id),
            "course_id": str(self.classroom_id),  # Alias เพื่อให้ตรงกับ UAT Terminology
            "instructor_id": str(self.instructor_id),
            "instructor_name": self.instructor.profile.display_name if self.instructor and self.instructor.profile else None,
            "category_id": str(self.category_id) if self.category_id else None,
            "category_name": self.category.name if self.category else None,
            "title": self.title,
            "description": self.description,
            "thumbnail_url": self.thumbnail_url,
            "status": self.status,
            "review_note": self.review_note,
            "member_count": len(self.members),
            "lesson_count": len(self.lessons),
            "chapter_count": len(self.chapters) if self.chapters else len(self.lessons),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_members:
            data["members"] = [m.to_dict() for m in self.members]
        if include_lessons:
            data["lessons"] = [l.to_dict(include_episodes=True) for l in self.lessons]
            data["chapters"] = [c.to_dict(include_lessons=True) for c in self.chapters] if self.chapters else data["lessons"]
        return data


class Chapter(db.Model):
    """Chapter hierarchy between Course and Lesson (Module 2.1)."""

    __tablename__ = "chapters"

    chapter_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    course_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("courses.classroom_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title = db.Column(
        db.String(255),
        nullable=False
    )
    sequence_no = db.Column(
        db.Integer,
        nullable=False,
        default=1
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
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    course = db.relationship(
        "Classroom",
        back_populates="chapters"
    )
    lessons = db.relationship(
        "Lesson",
        back_populates="chapter",
        cascade="all, delete-orphan",
        order_by="Lesson.sequence_no"
    )

    def to_dict(self, include_lessons: bool = False) -> dict:
        data = {
            "chapter_id": str(self.chapter_id),
            "course_id": str(self.course_id),
            "title": self.title,
            "sequence_no": self.sequence_no,
            "description": self.description,
            "lesson_count": len(self.lessons),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_lessons:
            data["lessons"] = [l.to_dict() for l in self.lessons]
        return data


class ClassroomMember(db.Model):
    """
    โมเดล Enrollment / ClassroomMember (การลงทะเบียนเรียนในคอร์ส)
    - ตารางทางกายภาพ: classroom_members
    - รองรับสถานะการลงทะเบียน (status): 'enrolled', 'completed', 'cancelled'
    """

    __tablename__ = "classroom_members"

    classroom_member_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    classroom_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("courses.classroom_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    # สถานะการลงทะเบียน: ตอนนี้ใช้แค่ "enrolled"
    status = db.Column(
        db.String(30),
        nullable=False,
        default="enrolled"
    )
    joined_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        db.UniqueConstraint("classroom_id", "user_id", name="uq_classroom_member"),
    )

    # Relationships
    classroom = db.relationship(
        "Classroom",
        back_populates="members"
    )
    user = db.relationship(
        "User",
        backref=db.backref("classroom_memberships", lazy="dynamic")
    )

    def to_dict(self) -> dict:
        """แปลงข้อมูลการลงทะเบียนเป็น Dictionary"""
        return {
            "classroom_member_id": str(self.classroom_member_id),
            "enrollment_id": str(self.classroom_member_id),  # Alias
            "classroom_id": str(self.classroom_id),
            "course_id": str(self.classroom_id),  # Alias
            "user_id": str(self.user_id),
            "display_name": self.user.profile.display_name if self.user and self.user.profile else None,
            "status": self.status,
            "joined_at": self.joined_at.isoformat() if self.joined_at else None,
        }


class Lesson(db.Model):
    """
    โมเดล Chapter / Lesson (บทเรียน)
    - ตารางทางกายภาพ: lessons
    - เป็น Parent ของ Episode (ตอนย่อย)
    - ยังคงรักษาความสัมพันธ์ contents สำหรับ Backward Compatibility
    """

    __tablename__ = "lessons"

    lesson_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    classroom_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("courses.classroom_id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    chapter_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("chapters.chapter_id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    title = db.Column(
        db.String(255),
        nullable=False
    )
    sequence_no = db.Column(
        db.Integer,
        nullable=False
    )
    description = db.Column(
        db.Text,
        nullable=True
    )
    status = db.Column(
        db.String(30),
        nullable=False,
        default="active"
    )

    # Relationships
    classroom = db.relationship(
        "Classroom",
        back_populates="lessons"
    )
    chapter = db.relationship(
        "Chapter",
        back_populates="lessons"
    )
    # ความสัมพันธ์ใหม่: 1 Chapter มีหลาย Episode (เรียงตาม sequence_no)
    episodes = db.relationship(
        "Episode",
        back_populates="lesson",
        cascade="all, delete-orphan",
        order_by="Episode.sequence_no"
    )
    # คงความสัมพันธ์เดิมกับ Content เพื่อความเข้ากันได้ย้อนหลัง (Dual-Pointer)
    contents = db.relationship(
        "Content",
        back_populates="lesson",
        cascade="all, delete-orphan",
        order_by="Content.sequence_no"
    )

    def to_dict(self, include_contents: bool = False, include_episodes: bool = False) -> dict:
        """แปลงข้อมูลบทเรียนเป็น Dictionary"""
        data = {
            "lesson_id": str(self.lesson_id),
            "chapter_id": str(self.chapter_id) if self.chapter_id else str(self.lesson_id),
            "classroom_id": str(self.classroom_id),
            "course_id": str(self.classroom_id),  # Alias
            "title": self.title,
            "sequence_no": self.sequence_no,
            "description": self.description,
            "status": self.status,
            "episode_count": len(self.episodes),
            "content_count": len(self.contents),
        }
        if include_episodes:
            data["episodes"] = [e.to_dict(include_contents=include_contents) for e in self.episodes]
        if include_contents:
            data["contents"] = [c.to_dict() for c in self.contents]
        return data


class Episode(db.Model):
    """
    โมเดล Episode (ตอนย่อยในบทเรียน) ตามลำดับ Course -> Chapter -> Episode -> Content
    - ตารางทางกายภาพ: episodes (สร้างขึ้นใหม่)
    - ทำหน้าที่เป็น Parent Container โดยตรงของ Content
    - เมื่อ Episode ถูกลบ Content ภายในจะถูกลบตามอัตโนมัติ (ON DELETE CASCADE)
    """

    __tablename__ = "episodes"

    episode_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    lesson_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("lessons.lesson_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title = db.Column(
        db.String(255),
        nullable=False
    )
    sequence_no = db.Column(
        db.Integer,
        nullable=False,
        default=1
    )
    description = db.Column(
        db.Text,
        nullable=True
    )
    duration_seconds = db.Column(
        db.Integer,
        nullable=True,
        default=0
    )
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
    lesson = db.relationship(
        "Lesson",
        back_populates="episodes"
    )
    contents = db.relationship(
        "Content",
        back_populates="episode",
        cascade="all, delete-orphan",
        order_by="Content.sequence_no"
    )

    def to_dict(self, include_contents: bool = False) -> dict:
        """แปลงข้อมูล Episode เป็น Dictionary"""
        data = {
            "episode_id": str(self.episode_id),
            "lesson_id": str(self.lesson_id),
            "chapter_id": str(self.lesson_id),  # Alias
            "title": self.title,
            "sequence_no": self.sequence_no,
            "description": self.description,
            "duration_seconds": self.duration_seconds,
            "status": self.status,
            "content_count": len(self.contents),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_contents:
            data["contents"] = [c.to_dict() for c in self.contents]
        return data


class Content(db.Model):
    """
    โมเดล Content (เนื้อหาการเรียน เช่น วิดีโอ, ยูทูป, เอกสาร PDF, โค้ดตัวอย่าง, ข้อความ)
    - ตารางทางกายภาพ: contents
    - ใช้เทคนิค Dual-Pointer:
        1. episode_id (New FK -> episodes, ON DELETE CASCADE): ลำดับชั้นหลักตามโมเดลใหม่
        2. lesson_id (Legacy FK -> lessons, ON DELETE CASCADE, nullable=True): รักษาไว้ไม่ลบออกเด็ดขาด
           เพื่อให้โค้ด/Query เดิมทำงานได้สมบูรณ์ และไม่มีข้อขัดแย้งเชิงตรรกะแบบ SET NULL
    """

    __tablename__ = "contents"

    content_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    episode_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("episodes.episode_id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    lesson_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("lessons.lesson_id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    # ชนิดเนื้อหา: text, video, pdf, image, code, youtube
    # (ค่าที่อนุญาตกำหนดใน utils/validators.py: ALLOWED_CONTENT_TYPES)
    content_type = db.Column(
        db.String(30),
        nullable=False
    )
    content_data = db.Column(
        db.Text,
        nullable=True
    )
    caption = db.Column(
        db.String(255),
        nullable=True
    )
    sequence_no = db.Column(
        db.Integer,
        nullable=False,
        default=1
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
    episode = db.relationship(
        "Episode",
        back_populates="contents"
    )
    lesson = db.relationship(
        "Lesson",
        back_populates="contents"
    )

    def to_dict(self) -> dict:
        """แปลงข้อมูลเนื้อหาเป็น Dictionary สำหรับส่งกลับทาง API"""
        return {
            "content_id": str(self.content_id),
            "episode_id": str(self.episode_id) if self.episode_id else None,
            "lesson_id": str(self.lesson_id) if self.lesson_id else None,
            "content_type": self.content_type,
            "content_data": self.content_data,
            "caption": self.caption,
            "sequence_no": self.sequence_no,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Journal(db.Model):
    """
    โมเดล Journal (บันทึกการเรียนรู้ส่วนตัวของผู้เรียนตาม UAT-031 ถึง UAT-033)
    - ตารางทางกายภาพ: journals
    - user_id: ผูกกับ User แบบ ON DELETE CASCADE (หากผู้ใช้ถูกลบ บันทึกจะถูกลบตาม)
    - classroom_id: ผูกกับ Course แบบ ON DELETE SET NULL (หากคอร์สถูกลบ บันทึกของผู้เรียนจะไม่สูญหาย)
    - episode_id: ผูกกับ Episode แบบ ON DELETE SET NULL (หาก Episode ถูกลบ บันทึกของผู้เรียนจะไม่สูญหาย)
    """

    __tablename__ = "journals"

    journal_id = db.Column(
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
    classroom_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("courses.classroom_id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    episode_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("episodes.episode_id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    title = db.Column(
        db.String(255),
        nullable=False
    )
    content = db.Column(
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

    # Relationships
    user = db.relationship(
        "User",
        backref=db.backref("journals", lazy="dynamic", cascade="all, delete-orphan")
    )
    classroom = db.relationship(
        "Classroom",
        backref=db.backref("journals", lazy="dynamic")
    )
    episode = db.relationship(
        "Episode",
        backref=db.backref("journals", lazy="dynamic")
    )

    def to_dict(self) -> dict:
        """แปลงข้อมูล Journal เป็น Dictionary"""
        return {
            "journal_id": str(self.journal_id),
            "user_id": str(self.user_id),
            "classroom_id": str(self.classroom_id) if self.classroom_id else None,
            "course_id": str(self.classroom_id) if self.classroom_id else None,  # Alias
            "course_title": self.classroom.title if self.classroom else None,
            "episode_id": str(self.episode_id) if self.episode_id else None,
            "episode_title": self.episode.title if self.episode else None,
            "title": self.title,
            "content": self.content,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Media(db.Model):
    """Media assets library for curriculum content (Module 2.3.1 & 2.3.2)."""

    __tablename__ = "media"

    media_id = db.Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    content_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("contents.content_id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    user_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.user_id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    file_name = db.Column(
        db.String(255),
        nullable=False
    )
    file_url = db.Column(
        db.String(512),
        nullable=False
    )
    file_type = db.Column(
        db.String(50),
        nullable=False
    )
    file_size = db.Column(
        db.BigInteger,
        nullable=True
    )
    duration = db.Column(
        db.Integer,
        nullable=True
    )
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    content = db.relationship("Content", backref=db.backref("media_files", lazy="dynamic"))
    uploader = db.relationship("User", backref=db.backref("uploaded_media", lazy="dynamic"))

    def to_dict(self) -> dict:
        return {
            "media_id": str(self.media_id),
            "content_id": str(self.content_id) if self.content_id else None,
            "user_id": str(self.user_id) if self.user_id else None,
            "file_name": self.file_name,
            "file_url": self.file_url,
            "file_type": self.file_type,
            "file_size": self.file_size,
            "duration": self.duration,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Review(db.Model):
    """Course rating and reviews (Module 2.7 & 2.8)."""

    __tablename__ = "reviews"

    review_id = db.Column(
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
    rating = db.Column(
        db.Integer,
        nullable=False
    )
    comment = db.Column(
        db.Text,
        nullable=True
    )
    status = db.Column(
        db.String(30),
        nullable=False,
        default="published"
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

    __table_args__ = (
        db.UniqueConstraint("user_id", "course_id", name="uq_user_course_review"),
    )

    user = db.relationship("User", backref=db.backref("reviews", lazy="dynamic"))
    course = db.relationship("Classroom", back_populates="reviews")

    def to_dict(self) -> dict:
        return {
            "review_id": str(self.review_id),
            "user_id": str(self.user_id),
            "course_id": str(self.course_id),
            "rating": self.rating,
            "comment": self.comment,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


# =====================================================================
# Logical Aliases เพื่อความสะดวกในการเรียกใช้งานตาม UAT Terminology
# Course -> Chapter -> Episode -> Content
# =====================================================================
Course = Classroom
Enrollment = ClassroomMember
