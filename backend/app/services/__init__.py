# นำเข้าโมดูลบริการส่งอีเมล
from app.services.email_service import send_reset_password_email

# ส่งออกฟังก์ชันบริการที่พร้อมใช้งาน
__all__ = ["send_reset_password_email"]
