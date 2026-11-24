# =====================================================================
# test_reports_items_31_32.py
# ข้อ 31: เลือกช่วงวันที่ได้จริง (วันนี้ / 7 วัน / 30 วัน / กำหนดเอง) และตัวเลขเปลี่ยนตามช่วง
# ข้อ 32: รายงานใช้ข้อมูลจริงจากฐานข้อมูล และส่งออก CSV ได้
#   cd backend
#   pytest tests/test_reports_items_31_32.py -v
# =====================================================================
import uuid
from datetime import datetime, timedelta, timezone

import pytest
from flask_jwt_extended import create_access_token

from app import create_app
from app.config import TestingPostgresConfig
from app.extensions import db, limiter
from app.models.classroom import Classroom, ClassroomMember, Lesson
from app.models.progress import LessonProgress
from app.models.role import Role, seed_default_roles
from app.models.user import User, UserProfile
from app.services.reports_service import THAI_TZ, parse_date_range

PREFIX = "rp32_"


def _user(email, role):
    user = User.query.filter_by(email=email).first()
    if not user:
        user = User(email=email)
        user.set_password("Password123")
        db.session.add(user)
        db.session.flush()
        db.session.add(UserProfile(user_id=user.user_id, display_name=email.split("@")[0]))
    user.status = "active"
    user.roles = [Role.query.filter_by(role_name=role).first()]
    return user


def _thai_noon(days_ago: int) -> datetime:
    day = datetime.now(THAI_TZ).date() - timedelta(days=days_ago)
    return datetime(day.year, day.month, day.day, 12, 0, tzinfo=THAI_TZ).astimezone(timezone.utc)


@pytest.fixture(scope="module")
def world():
    app = create_app(TestingPostgresConfig)
    limiter.enabled = False
    with app.app_context():
        seed_default_roles()
        admin = _user(PREFIX + "admin@test.com", "admin")
        inst = _user(PREFIX + "inst@test.com", "instructor")
        s1 = _user(f"{PREFIX}s1_{uuid.uuid4().hex[:6]}@test.com", "student")
        s2 = _user(f"{PREFIX}s2_{uuid.uuid4().hex[:6]}@test.com", "student")
        db.session.flush()

        title = f"=HYPERLINK(\"x\") {PREFIX}{uuid.uuid4().hex[:6]}"  # ใช้ทดสอบกัน CSV Injection ด้วย
        course = Classroom(instructor_id=inst.user_id, title=title, status="active")
        db.session.add(course)
        db.session.flush()
        lessons = [Lesson(classroom_id=course.classroom_id, title=f"L{i}", sequence_no=i) for i in (1, 2)]
        db.session.add_all(lessons)
        db.session.flush()

        # s1: ลงทะเบียนและเรียนจบทั้ง 2 บทเมื่อ 2 วันก่อน / s2: ลงทะเบียนและจบ 1 บทเมื่อ 20 วันก่อน
        db.session.add(ClassroomMember(classroom_id=course.classroom_id, user_id=s1.user_id, joined_at=_thai_noon(2)))
        db.session.add(ClassroomMember(classroom_id=course.classroom_id, user_id=s2.user_id, joined_at=_thai_noon(20)))
        for lesson in lessons:
            db.session.add(LessonProgress(user_id=s1.user_id, lesson_id=lesson.lesson_id, status="completed", completed_at=_thai_noon(2)))
        db.session.add(LessonProgress(user_id=s2.user_id, lesson_id=lessons[0].lesson_id, status="completed", completed_at=_thai_noon(20)))
        db.session.commit()

        headers = {
            k: {"Authorization": f"Bearer {create_access_token(identity=str(u.user_id))}"}
            for k, u in (("admin", admin), ("inst", inst), ("student", s1))
        }
        ids = {"course": str(course.classroom_id), "title": title}
    client = app.test_client()
    yield app, client, headers, ids
    with app.app_context():
        c = db.session.get(Classroom, uuid.UUID(ids["course"]))
        if c:
            db.session.delete(c)
            db.session.commit()
    limiter.enabled = True


def _course_row(data, course_id):
    return next(c for c in data["courses"] if c["course_id"] == course_id)


def _summary(client, h, query):
    res = client.get(f"/api/v1/admin/reports/summary?{query}", headers=h)
    assert res.status_code == 200, res.get_json()
    return res.get_json()


def test_course_numbers_change_with_selected_range(world):
    _, client, h, ids = world
    week = _course_row(_summary(client, h["admin"], "range=7d"), ids["course"])
    month = _course_row(_summary(client, h["admin"], "range=30d"), ids["course"])

    assert (week["enrollmentsInRange"], week["lessonsCompletedInRange"]) == (1, 2)
    assert (month["enrollmentsInRange"], month["lessonsCompletedInRange"]) == (2, 3)
    # ตัวเลขทั้งคอร์สไม่ขึ้นกับช่วงวันที่: ผู้เรียน 2 คน เรียนจบทั้งคอร์ส 1 คน
    for row in (week, month):
        assert (row["totalLearners"], row["completedLearners"], row["completionRate"], row["lessonCount"]) == (2, 1, 50.0, 2)


def test_custom_range_counts_only_selected_days(world):
    _, client, h, ids = world
    day = (datetime.now(THAI_TZ).date() - timedelta(days=20)).isoformat()
    data = _summary(client, h["admin"], f"range=custom&start={day}&end={day}")
    row = _course_row(data, ids["course"])
    assert (row["enrollmentsInRange"], row["lessonsCompletedInRange"]) == (1, 1)
    assert data["days"] == 1 and len(data["series"]) == 1
    assert data["series"][0]["date"] == day
    assert data["series"][0]["activeLearners"] >= 1


def test_daily_series_covers_every_day_and_places_activity_on_thai_date(world):
    _, client, h, _ = world
    data = _summary(client, h["admin"], "range=7d")
    assert data["days"] == 7 and len(data["series"]) == 7
    dates = [d["date"] for d in data["series"]]
    assert dates == sorted(dates)
    two_days_ago = (datetime.now(THAI_TZ).date() - timedelta(days=2)).isoformat()
    point = next(d for d in data["series"] if d["date"] == two_days_ago)
    assert point["activeLearners"] >= 1 and point["lessonsCompleted"] >= 2 and point["enrollments"] >= 1


def test_usage_overview_follows_range_and_returns_flat_numbers(world):
    _, client, h, _ = world
    res = client.get("/api/v1/admin/usage-overview?range=today", headers=h["admin"])
    data = res.get_json()
    assert res.status_code == 200
    for key in ("logins", "activeLearners", "lessonViews", "quizzesSubmitted", "missionsCompleted", "engagementRate"):
        assert key in data, key  # หน้า Dashboard อ่านค่าเหล่านี้ตรง ๆ (เดิมอยู่ใน metrics ซ้อนจึงแสดง 0 ตลอด)
    assert len(data["series"]) == 1


@pytest.mark.parametrize(
    "query,message",
    [
        ("range=custom", "กรุณาเลือกวันที่"),
        ("range=custom&start=2026-11-10&end=2026-11-01", "วันที่เริ่มต้น"),
        ("range=custom&start=2020-01-01&end=2099-01-01", "ไม่เกินวันนี้"),
        ("range=custom&start=2020-01-01&end=2022-01-01", "ไม่เกิน 366 วัน"),
        ("range=custom&start=2026-02-30&end=2026-03-01", "ไม่มีอยู่จริง"),
        ("range=custom&start=01/11/2026&end=2026-11-02", "รูปแบบวันที่"),
        ("range=yesterday", "ช่วงเวลาไม่ถูกต้อง"),
    ],
)
def test_invalid_ranges_rejected(world, query, message):
    _, client, h, _ = world
    for url in ("/api/v1/admin/reports/summary", "/api/v1/admin/usage-overview", "/api/v1/admin/reports/export"):
        res = client.get(f"{url}?{query}", headers=h["admin"])
        assert res.status_code == 400, (url, query)
        assert message in res.get_json()["message"]


def test_export_csv_real_data_with_thai_and_injection_guard(world):
    _, client, h, ids = world
    res = client.get("/api/v1/admin/reports/export?range=30d&format=csv", headers=h["admin"])
    assert res.status_code == 200
    assert res.mimetype == "text/csv"
    assert "attachment" in res.headers["Content-Disposition"] and ".csv" in res.headers["Content-Disposition"]
    text = res.get_data(as_text=True)
    assert text.startswith("﻿")  # BOM ให้ Excel อ่านภาษาไทยได้
    assert "ผลรายคอร์ส" in text
    assert "'=HYPERLINK" in text  # ชื่อที่ขึ้นต้นด้วย = ถูกกันไม่ให้ Excel ตีความเป็นสูตร
    assert "\n=HYPERLINK" not in text and ",=HYPERLINK" not in text


def test_export_rejects_unknown_format(world):
    _, client, h, _ = world
    assert client.get("/api/v1/admin/reports/export?range=7d&format=xlsx", headers=h["admin"]).status_code == 400


@pytest.mark.parametrize("who", ["inst", "student"])
def test_reports_are_admin_only(world, who):
    _, client, h, _ = world
    for url in ("/api/v1/admin/reports/summary?range=7d", "/api/v1/admin/reports/export?range=7d", "/api/v1/admin/usage-overview?range=7d"):
        assert client.get(url, headers=h[who]).status_code == 403


def test_preset_ranges_are_inclusive_thai_days():
    today = datetime.now(THAI_TZ).date()
    assert parse_date_range("today").days == 1
    week = parse_date_range("7d")
    assert week.days == 7 and week.end == today
    assert parse_date_range("30d").days == 30
