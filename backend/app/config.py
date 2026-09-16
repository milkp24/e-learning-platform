import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Config:
    """Base configuration for Flask application."""

    # Secret Key
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-fallback-secret-key")

    # Database Configuration (PostgreSQL)
    db_user = os.getenv("DB_USER", "postgres")
    db_password = os.getenv("DB_PASSWORD", "postgres")
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("DB_NAME", "elearning_db")

    default_db_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", default_url := default_db_url)
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT Configuration (UAT-011: Access Token อายุ 15 นาที)
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-fallback-jwt-secret-key")
    jwt_minutes = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "15"))
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=jwt_minutes)

    # CORS Configuration
    cors_origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173")
    CORS_ORIGINS = [origin.strip() for origin in cors_origins_raw.split(",") if origin.strip()]

    # การตั้งค่าระบบส่งอีเมล (SMTP Email Configuration)
    # ที่อยู่เซิร์ฟเวอร์ SMTP เช่น smtp.gmail.com
    MAIL_SERVER = os.getenv("MAIL_SERVER")
    # พอร์ตการเชื่อมต่อ SMTP ค่าเริ่มต้น 587 (TLS) หรือ 465 (SSL)
    MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
    # บัญชีผู้ใช้อีเมลสำหรับส่ง
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    # รหัสผ่านแอป (App Password) หรือรหัสผ่านอีเมล
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
    # เปิดใช้งานการเข้ารหัส TLS หรือไม่ (ค่าเริ่มต้น True)
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "true").strip().lower() in ["true", "1", "yes"]
    # ที่อยู่อีเมลผู้ส่งที่แสดง (ค่าเริ่มต้นใช้ MAIL_USERNAME)
    MAIL_FROM = os.getenv("MAIL_FROM", os.getenv("MAIL_USERNAME"))

    # URL ของ Frontend สำหรับสร้างลิงก์ Reset Password (ค่าเริ่มต้น http://localhost:5173)
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")

