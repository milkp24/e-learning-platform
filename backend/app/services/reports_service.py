# =====================================================================
# reports_service.py: รายงานและสถิติจากข้อมูลจริง (ข้อ 31, 32)
#
# - ช่วงวันที่: วันนี้ / 7 วัน / 30 วัน / กำหนดเอง (start, end เป็น YYYY-MM-DD)
#   นับวันตามเวลาประเทศไทย (UTC+7 ไม่มีเวลาออมแสง จึงใช้ offset คงที่ได้
#   และไม่ต้องพึ่ง tzdata ที่ Windows ไม่มีให้)
# - ทุกตัวเลขดึงจากตารางที่ระบบบันทึกอยู่แล้ว ไม่มีข้อมูลสมมติ:
#     refresh_tokens        → การเข้าสู่ระบบ
#     classroom_members     → การลงทะเบียนเรียน
#     lesson_progress       → บทเรียนที่เรียนจบ
#     content_progress      → การเปิดดูเนื้อหา/วิดีโอ
#     quiz_attempts         → การส่งแบบทดสอบ
#     mission_progress      → ภารกิจที่สำเร็จ
#   "ผู้เรียนที่เข้าใช้งาน" = ผู้ใช้ที่มีกิจกรรมการเรียนอย่างน้อย 1 อย่างในวันนั้น/ช่วงนั้น
# =====================================================================
import csv
import io
import re
from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import func, union

from app.extensions import db
from app.models.classroom import Classroom, ClassroomMember, Lesson
from app.models.gamification import MissionProgress
from app.models.progress import ContentProgress, LessonProgress
from app.models.quiz import QuizAttempt
from app.models.role import Role
from app.models.security import RefreshToken
from app.models.user import User

THAI_TZ = timezone(timedelta(hours=7))
MAX_RANGE_DAYS = 366
_DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")
THAI_WEEKDAYS = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."]
RANGE_LABELS = {"today": "วันนี้", "7d": "7 วันที่ผ่านมา", "30d": "30 วันที่ผ่านมา", "custom": "ช่วงที่กำหนดเอง"}


class ReportsServiceError(Exception):
    def __init__(self, message: str, status_code: int = 400, error: str = "Validation Error"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error = error


class DateRange:
    """ช่วงวันที่แบบรวมวันแรกและวันสุดท้าย (นับตามเวลาไทย)"""

    def __init__(self, key: str, start: date, end: date):
        self.key = key
        self.start = start
        self.end = end

    @property
    def days(self) -> int:
        return (self.end - self.start).days + 1

    @property
    def start_utc(self) -> datetime:
        return datetime.combine(self.start, time.min, tzinfo=THAI_TZ).astimezone(timezone.utc)

    @property
    def end_utc(self) -> datetime:
        """เวลาเริ่มของวันถัดจากวันสุดท้าย (ใช้แบบ < end_utc)"""
        return datetime.combine(self.end + timedelta(days=1), time.min, tzinfo=THAI_TZ).astimezone(timezone.utc)

    def each_day(self):
        for i in range(self.days):
            yield self.start + timedelta(days=i)

    def label(self) -> str:
        fmt = lambda d: f"{d.day}/{d.month}/{d.year + 543}"  # noqa: E731
        if self.start == self.end:
            return fmt(self.start)
        return f"{fmt(self.start)} – {fmt(self.end)}"

    def to_dict(self) -> dict:
        return {
            "range": self.key,
            "start": self.start.isoformat(),
            "end": self.end.isoformat(),
            "days": self.days,
            "label": RANGE_LABELS.get(self.key, ""),
            "display": self.label(),
        }


def _today_thai() -> date:
    return datetime.now(THAI_TZ).date()


def parse_date_range(range_key: str | None, start: str | None = None, end: str | None = None) -> DateRange:
    """แปลงค่าจาก Query String เป็นช่วงวันที่ พร้อมตรวจความถูกต้อง (ข้อ 31)"""
    key = (range_key or "7d").strip().lower()
    today = _today_thai()
    if key == "today":
        return DateRange(key, today, today)
    if key == "7d":
        return DateRange(key, today - timedelta(days=6), today)
    if key == "30d":
        return DateRange(key, today - timedelta(days=29), today)
    if key != "custom":
        raise ReportsServiceError("ช่วงเวลาไม่ถูกต้อง เลือกได้: วันนี้, 7 วัน, 30 วัน หรือกำหนดเอง")

    if not start or not end:
        raise ReportsServiceError("กรุณาเลือกวันที่เริ่มต้นและวันที่สิ้นสุด")
    if not _DATE_PATTERN.match(str(start)) or not _DATE_PATTERN.match(str(end)):
        raise ReportsServiceError("รูปแบบวันที่ไม่ถูกต้อง (ต้องเป็น ปปปป-ดด-วว)")
    try:
        start_d = date.fromisoformat(start)
        end_d = date.fromisoformat(end)
    except ValueError:
        raise ReportsServiceError("วันที่ที่เลือกไม่มีอยู่จริง กรุณาเลือกใหม่")
    if start_d > end_d:
        raise ReportsServiceError("วันที่เริ่มต้นต้องไม่อยู่หลังวันที่สิ้นสุด")
    if end_d > today:
        raise ReportsServiceError("วันที่สิ้นสุดต้องไม่เกินวันนี้")
    if (end_d - start_d).days + 1 > MAX_RANGE_DAYS:
        raise ReportsServiceError(f"เลือกช่วงวันที่ได้ไม่เกิน {MAX_RANGE_DAYS} วัน")
    return DateRange(key, start_d, end_d)


# ---------------------------------------------------------------------
# แหล่งกิจกรรม: (คอลัมน์ user_id, คอลัมน์เวลา, เงื่อนไขเพิ่ม)
# ---------------------------------------------------------------------
def _learning_activity_sources():
    return [
        (LessonProgress.user_id, LessonProgress.completed_at, None),
        (ContentProgress.user_id, ContentProgress.updated_at, None),
        (QuizAttempt.user_id, QuizAttempt.started_at, None),
        (ClassroomMember.user_id, ClassroomMember.joined_at, None),
        (MissionProgress.user_id, MissionProgress.completed_at, None),
    ]


def _student_ids():
    """subquery รหัสผู้ใช้ที่มีบทบาทผู้เรียน"""
    return (
        db.session.query(User.user_id)
        .join(User.roles)
        .filter(Role.role_name == "student")
        .scalar_subquery()
    )


def _thai_day(column):
    """แปลงเวลา (timestamptz) เป็นวันที่ตามเวลาไทยใน PostgreSQL"""
    return func.date(func.timezone("Asia/Bangkok", column))


def _active_user_query(dr: DateRange, by_day: bool):
    selects = []
    for user_col, time_col, extra in _learning_activity_sources():
        cols = [user_col.label("uid")]
        if by_day:
            cols.append(_thai_day(time_col).label("day"))
        q = db.session.query(*cols).filter(
            time_col.isnot(None),
            time_col >= dr.start_utc,
            time_col < dr.end_utc,
            user_col.in_(_student_ids()),  # นับเฉพาะบัญชีผู้เรียน (ไม่นับผู้สอน/แอดมินที่ทดลองเรียน)
        )
        if extra is not None:
            q = q.filter(extra)
        selects.append(q)
    return union(*[q.statement for q in selects]).subquery()


def _count_by_day(time_col, dr: DateRange, *filters, distinct_col=None) -> dict:
    day = _thai_day(time_col)
    counted = func.count(func.distinct(distinct_col)) if distinct_col is not None else func.count()
    rows = (
        db.session.query(day.label("day"), counted)
        .filter(time_col >= dr.start_utc, time_col < dr.end_utc, *filters)
        .group_by(day)
        .all()
    )
    return {str(r[0]): int(r[1]) for r in rows}


def _count_in_range(time_col, dr: DateRange, *filters, distinct_col=None) -> int:
    counted = func.count(func.distinct(distinct_col)) if distinct_col is not None else func.count()
    return int(
        db.session.query(counted).filter(time_col >= dr.start_utc, time_col < dr.end_utc, *filters).scalar() or 0
    )


class ReportsService:
    @classmethod
    def daily_series(cls, dr: DateRange) -> list[dict]:
        """ตัวเลขรายวันในช่วงที่เลือก (วันที่ไม่มีข้อมูล = 0)"""
        logins = _count_by_day(RefreshToken.created_at, dr, distinct_col=RefreshToken.user_id)
        enrollments = _count_by_day(ClassroomMember.joined_at, dr)
        lessons_done = _count_by_day(
            LessonProgress.completed_at, dr, LessonProgress.status == "completed"
        )
        quizzes = _count_by_day(QuizAttempt.submitted_at, dr)

        active_sub = _active_user_query(dr, by_day=True)
        active_rows = (
            db.session.query(active_sub.c.day, func.count(func.distinct(active_sub.c.uid)))
            .group_by(active_sub.c.day)
            .all()
        )
        active = {str(r[0]): int(r[1]) for r in active_rows}

        series = []
        for d in dr.each_day():
            key = d.isoformat()
            series.append({
                "date": key,
                "day": THAI_WEEKDAYS[d.weekday()],
                "label": f"{d.day}/{d.month}",
                "activeLearners": active.get(key, 0),
                "logins": logins.get(key, 0),
                "enrollments": enrollments.get(key, 0),
                "lessonsCompleted": lessons_done.get(key, 0),
                "quizzesSubmitted": quizzes.get(key, 0),
            })
        return series

    @classmethod
    def usage_overview(cls, dr: DateRange) -> dict:
        """ภาพรวมการใช้งานของ Dashboard (ข้อ 31) ตัวเลขทั้งหมดเปลี่ยนตามช่วงวันที่"""
        active_sub = _active_user_query(dr, by_day=False)
        active_learners = int(db.session.query(func.count(func.distinct(active_sub.c.uid))).scalar() or 0)

        total_students = int(
            db.session.query(func.count(func.distinct(User.user_id)))
            .join(User.roles)
            .filter(Role.role_name == "student", User.status == "active")
            .scalar()
            or 0
        )
        engagement = round(active_learners * 100 / total_students, 1) if total_students else 0.0

        metrics = {
            "logins": _count_in_range(RefreshToken.created_at, dr),
            "uniqueLogins": _count_in_range(RefreshToken.created_at, dr, distinct_col=RefreshToken.user_id),
            "activeLearners": active_learners,
            "lessonViews": _count_in_range(ContentProgress.updated_at, dr),
            "lessonsCompleted": _count_in_range(
                LessonProgress.completed_at, dr, LessonProgress.status == "completed"
            ),
            "enrollments": _count_in_range(ClassroomMember.joined_at, dr),
            "quizzesSubmitted": _count_in_range(QuizAttempt.submitted_at, dr),
            "missionsCompleted": _count_in_range(
                MissionProgress.completed_at, dr, MissionProgress.status == "completed"
            ),
            "totalStudents": total_students,
            "engagementRate": f"{engagement:g}%",
        }
        series = cls.daily_series(dr)
        return {**dr.to_dict(), **metrics, "metrics": metrics, "series": series}

    @classmethod
    def course_performance(cls, dr: DateRange, limit: int | None = None) -> list[dict]:
        """ผลของแต่ละคอร์ส: ลงทะเบียนในช่วงนี้, ผู้เรียนทั้งหมด, เรียนจบทั้งคอร์ส, บทเรียนที่จบในช่วงนี้"""
        courses = Classroom.query.filter(Classroom.status != "archived").all()
        rows = []
        for course in courses:
            lesson_ids = [lid for (lid,) in db.session.query(Lesson.lesson_id).filter(Lesson.classroom_id == course.classroom_id)]
            members = [
                uid
                for (uid,) in db.session.query(ClassroomMember.user_id).filter(
                    ClassroomMember.classroom_id == course.classroom_id
                )
            ]
            enrolled_in_range = _count_in_range(
                ClassroomMember.joined_at, dr, ClassroomMember.classroom_id == course.classroom_id
            )
            completed_members = 0
            lessons_done_in_range = 0
            if lesson_ids and members:
                done_counts = (
                    db.session.query(LessonProgress.user_id, func.count(func.distinct(LessonProgress.lesson_id)))
                    .filter(
                        LessonProgress.lesson_id.in_(lesson_ids),
                        LessonProgress.user_id.in_(members),
                        LessonProgress.status == "completed",
                    )
                    .group_by(LessonProgress.user_id)
                    .all()
                )
                completed_members = sum(1 for _, n in done_counts if n >= len(lesson_ids))
                lessons_done_in_range = _count_in_range(
                    LessonProgress.completed_at,
                    dr,
                    LessonProgress.lesson_id.in_(lesson_ids),
                    LessonProgress.status == "completed",
                )
            total_members = len(members)
            rows.append({
                "course_id": str(course.classroom_id),
                "title": course.title,
                "status": course.status,
                "lessonCount": len(lesson_ids),
                "totalLearners": total_members,
                "enrollmentsInRange": enrolled_in_range,
                "completedLearners": completed_members,
                "completionRate": round(completed_members * 100 / total_members, 1) if total_members else 0.0,
                "lessonsCompletedInRange": lessons_done_in_range,
            })
        rows.sort(key=lambda r: (r["enrollmentsInRange"], r["totalLearners"], r["lessonsCompletedInRange"]), reverse=True)
        return rows[:limit] if limit else rows

    @classmethod
    def summary(cls, dr: DateRange) -> dict:
        """ข้อมูลหน้า "รายงานและสถิติวิเคราะห์" (ข้อ 32)"""
        usage = cls.usage_overview(dr)
        courses = cls.course_performance(dr)
        total_learners = sum(c["totalLearners"] for c in courses)
        total_completed = sum(c["completedLearners"] for c in courses)
        series = usage["series"]
        avg_daily_active = round(sum(d["activeLearners"] for d in series) / len(series), 1) if series else 0
        return {
            **dr.to_dict(),
            "generatedAt": datetime.now(THAI_TZ).isoformat(timespec="seconds"),
            "metrics": {
                "enrollments": usage["enrollments"],
                "completionRate": round(total_completed * 100 / total_learners, 1) if total_learners else 0.0,
                "lessonsCompleted": usage["lessonsCompleted"],
                "avgDailyActiveLearners": avg_daily_active,
                "activeLearners": usage["activeLearners"],
                "quizzesSubmitted": usage["quizzesSubmitted"],
                "logins": usage["logins"],
            },
            "series": series,
            "courses": courses,
        }

    @classmethod
    def export_csv(cls, dr: DateRange) -> str:
        """ไฟล์ CSV ของรายงาน (UTF-8 พร้อม BOM ให้ Excel อ่านภาษาไทยได้)"""
        data = cls.summary(dr)
        m = data["metrics"]
        buf = io.StringIO()
        buf.write("﻿")
        w = csv.writer(buf)
        w.writerow(["รายงานสถิติ E-learning Platform"])
        w.writerow(["ช่วงวันที่", dr.label()])
        w.writerow(["สร้างเมื่อ", data["generatedAt"]])
        w.writerow([])
        w.writerow(["ตัวชี้วัด", "ค่า"])
        w.writerow(["การลงทะเบียนในช่วงนี้", m["enrollments"]])
        w.writerow(["อัตราเรียนจบทั้งคอร์สเฉลี่ย (%)", m["completionRate"]])
        w.writerow(["บทเรียนที่เรียนจบในช่วงนี้", m["lessonsCompleted"]])
        w.writerow(["ผู้เรียนที่เข้าใช้งาน (คน)", m["activeLearners"]])
        w.writerow(["ผู้เรียนที่เข้าใช้งานเฉลี่ยต่อวัน", m["avgDailyActiveLearners"]])
        w.writerow(["ส่งแบบทดสอบ (ครั้ง)", m["quizzesSubmitted"]])
        w.writerow(["การเข้าสู่ระบบ (ครั้ง)", m["logins"]])
        w.writerow([])
        w.writerow(["ข้อมูลรายวัน"])
        w.writerow(["วันที่", "ผู้เรียนที่เข้าใช้งาน", "ผู้ใช้ที่เข้าสู่ระบบ", "ลงทะเบียน", "บทเรียนที่จบ", "ส่งแบบทดสอบ"])
        for d in data["series"]:
            w.writerow([d["date"], d["activeLearners"], d["logins"], d["enrollments"], d["lessonsCompleted"], d["quizzesSubmitted"]])
        w.writerow([])
        w.writerow(["ผลรายคอร์ส"])
        w.writerow(["คอร์ส", "สถานะ", "จำนวนบทเรียน", "ผู้เรียนทั้งหมด", "ลงทะเบียนในช่วงนี้", "เรียนจบทั้งคอร์ส", "อัตราเรียนจบ (%)", "บทเรียนที่จบในช่วงนี้"])
        for c in data["courses"]:
            w.writerow([
                _csv_safe(c["title"]), c["status"], c["lessonCount"], c["totalLearners"], c["enrollmentsInRange"],
                c["completedLearners"], c["completionRate"], c["lessonsCompletedInRange"],
            ])
        return buf.getvalue()


def _csv_safe(value: str) -> str:
    """กัน CSV Injection: ข้อความที่ขึ้นต้นด้วย = + - @ จะถูกตีความเป็นสูตรใน Excel"""
    text = str(value or "")
    return "'" + text if text[:1] in ("=", "+", "-", "@", "\t", "\r") else text
