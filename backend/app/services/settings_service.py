from app.extensions import db
from app.models.security import SystemSetting
from app.models.admin import AuditLog
from app.models.user import User
from app.utils.validators import parse_optional_number

# ข้อ 37: ค่าที่ตั้งได้ และช่วงที่ยอมรับ (ค่าอื่นหรือคีย์อื่นถูกปฏิเสธ ไม่บันทึกลงระบบ)
EDITABLE_SETTINGS = {
    "session_timeout_minutes": ("เวลา Session หมดอายุ (นาที)", 5, 480, 30),
    "guest_timeout_minutes": ("เวลาแจ้งเตือน Guest (นาที)", 1, 240, 15),
    "warning_countdown_seconds": ("เวลานับถอยหลังก่อนออกจากระบบ (วินาที)", 30, 600, 120),
}


class SettingsServiceError(Exception):
    """Base exception for system settings domain operations."""
    def __init__(self, message: str, status_code: int = 400, error: str = "Bad Request"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error = error


class SettingsService:
    """
    SettingsService: Business logic for system configuration and dynamic timeouts.
    Supports UAT-015, UAT-020, UAT-035.
    """

    @classmethod
    def get_public_settings(cls) -> dict:
        """
        ดึงค่าตั้งค่าสาธารณะสำหรับ Frontend เช่น ค่า Timeout (UAT-015, UAT-020)
        - ไม่ต้องใช้ JWT Token เพื่อให้ Guest Timer และ Inactivity Detector ทำงานได้ทันที
        """
        settings = SystemSetting.query.all()
        settings_map = {s.key: s.value for s in settings}

        # ค่าเสียในฐานข้อมูล (บันทึกไว้ก่อนมีการตรวจ) ใช้ค่าเริ่มต้นแทน ไม่ให้ทุกหน้าพัง
        result = {}
        for key, (label, low, high, default) in EDITABLE_SETTINGS.items():
            ok, value, _ = parse_optional_number(
                settings_map.get(key), label, integer=True, min_value=low, max_value=high, default=default
            )
            result[key] = value if ok else default
        return result

    @classmethod
    def get_all_settings(cls, caller: User | None = None) -> dict:
        """ดึงค่าคอนฟิกทั้งหมดของระบบสำหรับหน้า Admin Console (UAT-035) - Super Admin Only"""
        settings = SystemSetting.query.all()
        return {
            "settings": [s.to_dict() for s in settings]
        }

    @classmethod
    def update_settings(cls, caller: User | None, data: dict, remote_addr: str | None = None) -> dict:
        """
        ปรับปรุงค่าคอนฟิกของระบบ เช่น เวลา Timeout (UAT-015, UAT-020, UAT-035) - Super Admin Only
        - รับ JSON Object ในรูป key-value: {"session_timeout_minutes": "20", ...}
        """
        if not data or not isinstance(data, dict):
            raise SettingsServiceError(
                "JSON object with setting keys and values is required.",
                400,
                "Bad Request"
            )

        # ตรวจทุกค่าก่อน ไม่ผ่านแม้ค่าเดียว = ไม่บันทึกเลย
        unknown = [k for k in data if k not in EDITABLE_SETTINGS]
        if unknown:
            raise SettingsServiceError("มีค่าตั้งค่าที่ระบบไม่รู้จัก กรุณารีเฟรชหน้าแล้วลองใหม่อีกครั้ง", 400, "Validation Error")
        cleaned = {}
        for key, raw in data.items():
            label, low, high, _ = EDITABLE_SETTINGS[key]
            ok, value, message = parse_optional_number(raw, label, integer=True, min_value=low, max_value=high)
            if not ok:
                raise SettingsServiceError(message, 400, "Validation Error")
            if value is None:
                raise SettingsServiceError(f"กรุณากรอก{label}", 400, "Validation Error")
            cleaned[key] = str(value)
        warning = int(cleaned.get("warning_countdown_seconds") or cls.get_public_settings()["warning_countdown_seconds"])
        session_minutes = int(cleaned.get("session_timeout_minutes") or cls.get_public_settings()["session_timeout_minutes"])
        if warning >= session_minutes * 60:
            raise SettingsServiceError("เวลานับถอยหลังต้องน้อยกว่าเวลา Session หมดอายุ", 400, "Validation Error")

        updated = []
        for k, v in cleaned.items():
            setting = db.session.get(SystemSetting, k)
            if setting:
                setting.value = v
                updated.append(setting.to_dict())
            else:
                new_s = SystemSetting(key=k, value=v)
                db.session.add(new_s)
                updated.append(new_s.to_dict())
        data = cleaned

        # Record Audit Log for Settings Change
        audit = AuditLog(
            user_id=caller.user_id if caller else None,
            action="SYSTEM_SETTINGS_UPDATED",
            entity_type="system_settings",
            details=data,
            ip_address=remote_addr
        )
        db.session.add(audit)

        try:
            db.session.commit()
            return {
                "message": "บันทึกการตั้งค่าระบบเรียบร้อยแล้ว",
                "settings": updated
            }
        except Exception:
            db.session.rollback()
            raise SettingsServiceError("Failed to update settings.", 500, "Internal Server Error")
