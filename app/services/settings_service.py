from app.extensions import db
from app.models.security import SystemSetting
from app.models.admin import AuditLog
from app.models.user import User


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

        return {
            "session_timeout_minutes": int(settings_map.get("session_timeout_minutes", "30")),
            "guest_timeout_minutes": int(settings_map.get("guest_timeout_minutes", "15")),
            "warning_countdown_seconds": int(settings_map.get("warning_countdown_seconds", "120")),
        }

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

        updated = []
        for k, v in data.items():
            setting = db.session.get(SystemSetting, k)
            if setting:
                setting.value = str(v)
                updated.append(setting.to_dict())
            else:
                new_s = SystemSetting(key=k, value=str(v))
                db.session.add(new_s)
                updated.append(new_s.to_dict())

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
                "message": "Settings updated successfully.",
                "settings": updated
            }
        except Exception:
            db.session.rollback()
            raise SettingsServiceError("Failed to update settings.", 500, "Internal Server Error")
