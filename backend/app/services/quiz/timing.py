from datetime import datetime, timezone


# =====================================================================
# timing.py: การจับเวลาสอบ
# - คำนวณเวลาที่ใช้ และตรวจว่าการสอบเกินเวลาที่กำหนดหรือยัง (มี grace period กันเน็ตช้า)
# (แยกออกมาจาก quiz_service.py เดิม โดยไม่เปลี่ยนตรรกะ)
# =====================================================================


TIME_LIMIT_GRACE_SECONDS = 30  # Grace period (seconds) for network latency buffer


def compute_time_difference_seconds(end_time, start_time) -> int:
    """คำนวณส่วนต่างเวลาเป็นวินาทีอย่างปลอดภัย รองรับทั้ง timezone-aware และ naive datetimes"""
    if not end_time or not start_time:
        return 0
    e = end_time
    s = start_time
    if getattr(e, "tzinfo", None) is not None and getattr(s, "tzinfo", None) is None:
        s = s.replace(tzinfo=timezone.utc)
    elif getattr(e, "tzinfo", None) is None and getattr(s, "tzinfo", None) is not None:
        e = e.replace(tzinfo=timezone.utc)
    return max(0, int((e - s).total_seconds()))


def check_quiz_attempt_time_limit(
    started_at: datetime | None,
    time_limit_minutes: int | None,
    now_time: datetime | None = None,
    grace_seconds: int = TIME_LIMIT_GRACE_SECONDS,
) -> tuple[bool, int, int]:
    """
    ตรวจสอบว่าการทำแบบทดสอบเกินกำหนดเวลา (Time Limit + Grace Period) หรือไม่
    Single Source of Truth ฝั่ง Backend (Server-Side Enforcement)

    :param started_at: วันเวลาที่เริ่มทำแบบทดสอบ (attempt.started_at)
    :param time_limit_minutes: เวลาจำกัดในหน่วยนาที (quiz.condition.time_limit_minutes)
    :param now_time: เวลาปัจจุบันของ Server (Default: datetime.now(timezone.utc))
    :param grace_seconds: ค่าเผื่อเวลาสำหรับ Network Latency (Default: TIME_LIMIT_GRACE_SECONDS)
    :return: (is_expired, time_spent_seconds, allowed_total_seconds)
    """
    if not started_at or not time_limit_minutes or time_limit_minutes <= 0:
        if now_time is None:
            now_time = datetime.now(timezone.utc)
        spent = compute_time_difference_seconds(now_time, started_at) if started_at else 0
        return False, spent, 0

    if now_time is None:
        now_time = datetime.now(timezone.utc)

    time_spent_seconds = compute_time_difference_seconds(now_time, started_at)
    allowed_seconds = int(time_limit_minutes) * 60
    allowed_total_seconds = allowed_seconds + grace_seconds

    is_expired = time_spent_seconds > allowed_total_seconds
    return is_expired, time_spent_seconds, allowed_total_seconds
