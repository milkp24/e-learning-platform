# นำเข้าไลบรารีมาตรฐานสำหรับส่งอีเมลผ่านโพรโทคอล SMTP
import smtplib
# นำเข้าคลาสสำหรับสร้างเนื้อหาอีเมลแบบหลายส่วน (Multipart เช่น ข้อความธรรมดาและ HTML)
from email.mime.multipart import MIMEMultipart
# นำเข้าคลาสสำหรับสร้างข้อความเนื้อหาในอีเมล (MIMEText)
from email.mime.text import MIMEText
# นำเข้า os สำหรับอ่านค่าตัวแปรสภาพแวดล้อม
import os
# นำเข้า logging สำหรับบันทึกประวัติการทำงานของระบบอย่างปลอดภัย
import logging
# นำเข้า current_app จาก Flask เพื่อเข้าถึงการตั้งค่าคอนฟิกของแอปพลิเคชัน
from flask import current_app

# สร้าง Logger สำหรับโมดูลบริการส่งอีเมล
logger = logging.getLogger(__name__)


# ฟังก์ชันส่งอีเมลสำหรับรีเซ็ตรหัสผ่าน (Reset Password Email)
def send_reset_password_email(recipient_email: str, reset_token: str) -> tuple[bool, str]:
    # ดึงค่าการตั้งค่า SMTP จาก Flask Application Config หรือตัวแปรสภาพแวดล้อม
    mail_server = current_app.config.get("MAIL_SERVER") or os.getenv("MAIL_SERVER")
    # ดึงหมายเลขพอร์ต SMTP โดยใช้ค่าเริ่มต้น 587
    mail_port = int(current_app.config.get("MAIL_PORT") or os.getenv("MAIL_PORT", "587"))
    # ดึงชื่อผู้ใช้อีเมลสำหรับยืนยันตัวตนกับเซิร์ฟเวอร์ SMTP
    mail_username = current_app.config.get("MAIL_USERNAME") or os.getenv("MAIL_USERNAME")
    # ดึงรหัสผ่านหรือ App Password สำหรับยืนยันตัวตนกับเซิร์ฟเวอร์ SMTP
    mail_password = current_app.config.get("MAIL_PASSWORD") or os.getenv("MAIL_PASSWORD")
    # ตรวจสอบการเปิดใช้งาน TLS (Transport Layer Security)
    mail_use_tls = current_app.config.get("MAIL_USE_TLS")
    # หากค่าคอนฟิกยังไม่มี ให้ตรวจสอบจากตัวแปรสภาพแวดล้อม
    if mail_use_tls is None:
        mail_use_tls = os.getenv("MAIL_USE_TLS", "true").strip().lower() in ["true", "1", "yes"]
    # ดึงที่อยู่อีเมลผู้ส่ง
    mail_from = current_app.config.get("MAIL_FROM") or os.getenv("MAIL_FROM") or mail_username

    # ดึง URL ของ Frontend สำหรับประกอบเป็นลิงก์ตั้งรหัสผ่านใหม่
    frontend_url = (current_app.config.get("FRONTEND_URL") or os.getenv("FRONTEND_URL", "http://localhost:5173")).rstrip("/")

    # ตรวจสอบว่าได้กำหนดค่า SMTP Server และข้อมูลยืนยันตัวตนครบถ้วนหรือไม่
    if not mail_server or not mail_username or not mail_password:
        # บันทึกข้อความเตือนในเซิร์ฟเวอร์ว่ายังไม่ได้กำหนดค่า SMTP
        error_msg = "ไม่ได้กำหนดค่า SMTP ใน Environment Variables (MAIL_SERVER, MAIL_USERNAME, หรือ MAIL_PASSWORD ว่าง)"
        logger.error(error_msg)
        # ส่งคืนสถานะไม่สำเร็จพร้อมข้อความอธิบาย
        return False, error_msg

    # สร้างลิงก์สำหรับรีเซ็ตรหัสผ่านที่มี Token ผูกอยู่
    reset_url = f"{frontend_url}/reset-password?token={reset_token}"

    # กำหนดหัวข้ออีเมลตามข้อกำหนด E-learning Platform
    subject = "รีเซ็ตรหัสผ่าน — E-learning Platform"

    # สร้างเนื้อหาอีเมลแบบข้อความธรรมดา (Plain Text) ตามข้อกำหนดอย่างเคร่งครัด
    body_text = f"""สวัสดี,

เราได้รับคำขอให้เปลี่ยนรหัสผ่านสำหรับบัญชี E-learning Platform ของคุณ

หากคุณเป็นผู้ส่งคำขอนี้ กรุณากดลิงก์ด้านล่างเพื่อสร้างรหัสผ่านใหม่

[ เปลี่ยนรหัสผ่าน ]
{reset_url}

ลิงก์นี้จะหมดอายุภายใน 15 นาที
และสามารถใช้งานได้เพียงครั้งเดียว

หากคุณไม่ได้ร้องขอการเปลี่ยนรหัสผ่าน
สามารถละเว้นอีเมลฉบับนี้ได้

E-learning Platform
"""

    # สร้างเนื้อหาอีเมลแบบ HTML สำหรับการแสดงผลที่สวยงามและปุ่มกด
    body_html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAFAFA; margin: 0; padding: 24px; color: #26332F;">
    <div style="max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border-radius: 20px; border: 1px solid #E5E7EB; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
            <span style="font-size: 28px;">🤖</span>
            <span style="font-size: 20px; font-weight: 800; color: #26332F;">E-learning <span style="color: #004643;">Platform</span></span>
        </div>
        
        <h2 style="font-size: 20px; font-weight: 800; color: #26332F; margin-top: 0; margin-bottom: 16px;">รีเซ็ตรหัสผ่าน</h2>
        
        <p style="font-size: 14px; line-height: 1.6; color: #26332F; margin-bottom: 16px;">สวัสดี,</p>
        
        <p style="font-size: 14px; line-height: 1.6; color: #26332F; margin-bottom: 24px;">เราได้รับคำขอให้เปลี่ยนรหัสผ่านสำหรับบัญชี E-learning Platform ของคุณ</p>
        
        <p style="font-size: 14px; line-height: 1.6; color: #26332F; margin-bottom: 24px;">หากคุณเป็นผู้ส่งคำขอนี้ กรุณากดปุ่มด้านล่างเพื่อสร้างรหัสผ่านใหม่</p>
        
        <div style="text-align: center; margin-top: 32px; margin-bottom: 32px;">
            <a href="{reset_url}" style="background-color: #004643; color: #FFFFFF; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; display: inline-block;">เปลี่ยนรหัสผ่าน</a>
        </div>
        
        <p style="font-size: 12px; color: #6B7773; line-height: 1.6; margin-bottom: 12px;">
            หรือคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์ของคุณ:<br>
            <a href="{reset_url}" style="color: #004643; word-break: break-all;">{reset_url}</a>
        </p>
        
        <div style="background-color: #F8FAFC; border-radius: 12px; padding: 14px; margin-top: 24px; margin-bottom: 24px; border-left: 4px solid #ABD1C6;">
            <p style="font-size: 12px; color: #475569; margin: 0; line-height: 1.5;">
                ⏱️ <strong>ลิงก์นี้จะหมดอายุภายใน 15 นาที</strong> และสามารถใช้งานได้เพียงครั้งเดียว
            </p>
        </div>
        
        <p style="font-size: 12px; color: #6B7773; line-height: 1.6; margin-bottom: 24px;">
            หากคุณไม่ได้ร้องขอการเปลี่ยนรหัสผ่าน สามารถละเว้นอีเมลฉบับนี้ได้
        </p>
        
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin-top: 32px; margin-bottom: 20px;">
        
        <p style="font-size: 11px; color: #9CA3AF; margin: 0; text-align: center;">
            © 2026 E-learning Platform. สงวนลิขสิทธิ์
        </p>
    </div>
</body>
</html>
"""

    # สร้างวัตถุข้อความอีเมลแบบผสม (MIMEMultipart alternative)
    msg = MIMEMultipart("alternative")
    # กำหนดหัวข้อของอีเมล
    msg["Subject"] = subject
    # กำหนดที่อยู่อีเมลผู้ส่ง E-learning Platform
    msg["From"] = f"E-learning Platform <{mail_from}>"
    # กำหนดที่อยู่อีเมลผู้รับ
    msg["To"] = recipient_email

    # แนบข้อความแบบ Plain Text
    msg.attach(MIMEText(body_text, "plain", "utf-8"))
    # แนบข้อความแบบ HTML
    msg.attach(MIMEText(body_html, "html", "utf-8"))

    # เริ่มต้นการเชื่อมต่อและส่งอีเมลผ่าน SMTP
    server = None
    try:
        # บันทึก Log การเริ่มต้นส่งอีเมล
        logger.info(f"Connecting to SMTP server {mail_server}:{mail_port} (TLS: {mail_use_tls})")

        # ตรวจสอบว่าใช้พอร์ต SSL (465) หรือไม่
        if mail_port == 465:
            # สร้างการเชื่อมต่อแบบ SSL ทันที
            server = smtplib.SMTP_SSL(mail_server, mail_port, timeout=15)
        else:
            # สร้างการเชื่อมต่อแบบปกติก่อน
            server = smtplib.SMTP(mail_server, mail_port, timeout=15)
            # เปิดโหมด EHLO
            server.ehlo()
            # หากตั้งค่าให้ใช้ TLS ให้เริ่มการเข้ารหัส STARTTLS
            if mail_use_tls:
                server.starttls()
                server.ehlo()

        # ยืนยันตัวตนกับเซิร์ฟเวอร์ SMTP ด้วย Username และ Password
        server.login(mail_username, mail_password)

        # ส่งข้อความอีเมลไปยังผู้รับ
        server.send_message(msg)

        # บันทึก Log สำเร็จโดยไม่เปิดเผยรหัสผ่าน
        logger.info(f"Password reset email sent successfully to {recipient_email}")
        # ส่งคืนผลลัพธ์สำเร็จ
        return True, "ส่งอีเมลสำเร็จ"

    # ดักจับข้อผิดพลาดกรณีการยืนยันตัวตน SMTP ไม่ผ่าน (เช่น รหัสผ่านผิดหรือยังไม่ได้สร้าง App Password)
    except smtplib.SMTPAuthenticationError as auth_err:
        err_msg = f"SMTP Authentication Failed: ตรวจสอบอีเมลหรือรหัสผ่านแอป (App Password) ใน .env: {auth_err.smtp_code} {auth_err.smtp_error.decode('utf-8', errors='ignore') if isinstance(auth_err.smtp_error, bytes) else auth_err.smtp_error}"
        logger.error(err_msg)
        return False, err_msg

    # ดักจับข้อผิดพลาดทางโพรโทคอล SMTP ทั่วไป
    except smtplib.SMTPException as smtp_err:
        err_msg = f"SMTP Protocol Error: {type(smtp_err).__name__} - {str(smtp_err)}"
        logger.error(err_msg)
        return False, err_msg

    # ดักจับข้อผิดพลาดด้านเครือข่ายและการเชื่อมต่อ Socket (เช่น Connection refused หรือ Timeout)
    except (ConnectionError, TimeoutError, OSError) as net_err:
        err_msg = f"SMTP Network Connection Error ({mail_server}:{mail_port}): {type(net_err).__name__} - {str(net_err)}"
        logger.error(err_msg)
        return False, err_msg

    # ดักจับข้อผิดพลาดไม่คาดคิดอื่น ๆ
    except Exception as exc:
        err_msg = f"Unexpected Email Error: {type(exc).__name__} - {str(exc)}"
        logger.error(err_msg)
        return False, err_msg

    # ปิดการเชื่อมต่อ SMTP อย่างปลอดภัยเสมอ
    finally:
        # ตรวจสอบว่ามี Server Instance อยู่หรือไม่
        if server is not None:
            try:
                # ปิดเซสชัน SMTP
                server.quit()
            except Exception:
                # หากเกิดข้อผิดพลาดในการปิด ให้ข้ามไป
                pass
