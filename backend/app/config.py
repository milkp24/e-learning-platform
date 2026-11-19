import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file (supports running from root or backend directory)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
dotenv_path = os.path.join(BASE_DIR, ".env")
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path, override=True)
else:
    load_dotenv(override=True)


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

    # JWT Configuration (UAT-015: Access Token อายุ 30 นาทีตาม Session Timeout)
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-fallback-jwt-secret-key")
    jwt_minutes = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_MINUTES", "30"))
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=jwt_minutes)

    # CORS Configuration
    cors_origins_raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
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

    # Rate Limiting Configuration (สำหรับป้องกัน Brute-Force / Abuse)
    RATELIMIT_STORAGE_URI = os.getenv("RATELIMIT_STORAGE_URI", "memory://")
    RATELIMIT_CHANGE_PASSWORD = os.getenv("RATELIMIT_CHANGE_PASSWORD", "5 per minute")

    # จำกัดการกรอกรหัสยืนยันตั้งรหัสผ่านใหม่ผิด (FB-02): ผิดครบ 5 ครั้ง ล็อก 15 นาที
    PASSWORD_RESET_MAX_ATTEMPTS = int(os.getenv("PASSWORD_RESET_MAX_ATTEMPTS", "5"))
    PASSWORD_RESET_LOCK_MINUTES = int(os.getenv("PASSWORD_RESET_LOCK_MINUTES", "15"))


def verify_test_database_safety(db_uri: str) -> str:
    """
    Safety Guard: Verifies destination database is strictly an isolated test database.
    Rejects immediately if empty, pointing to elearning_db, or missing 'test' in db name.
    NEVER logs credentials.
    """
    if not db_uri or not isinstance(db_uri, str):
        raise RuntimeError("SAFETY GUARD: Database URI is empty or invalid. Tests aborted.")

    from urllib.parse import urlparse
    clean_uri = db_uri
    if "+psycopg2" in clean_uri:
        clean_uri = clean_uri.replace("+psycopg2", "")
    parsed = urlparse(clean_uri)
    db_name = parsed.path.lstrip("/").split("?")[0]

    if not db_name:
        raise RuntimeError("SAFETY GUARD: Could not determine database name from URI. Tests aborted.")

    if db_name == "elearning_db" or "elearning_db" in db_uri:
        raise RuntimeError(
            f"SAFETY GUARD CRITICAL VIOLATION: Target database '{db_name}' is PRODUCTION database 'elearning_db'. "
            "Write operations strictly prohibited!"
        )

    if "prod" in db_name.lower():
        raise RuntimeError(
            f"SAFETY GUARD CRITICAL VIOLATION: Target database '{db_name}' contains 'prod'. "
            "Write operations strictly prohibited!"
        )

    if "test" not in db_name.lower() and db_name != ":memory:":
        raise RuntimeError(
            f"SAFETY GUARD: Target database '{db_name}' does not contain 'test'. "
            "Automated test suites must run only against explicit test databases."
        )

    return db_name


class TestingPostgresConfig(Config):
    """Configuration specifically for automated testing against isolated PostgreSQL test DB."""
    TESTING = True

    # 1. Check TEST_DATABASE_URL
    _env_test_url = os.getenv("TEST_DATABASE_URL")
    if _env_test_url:
        _test_url = _env_test_url
    else:
        _db_user = os.getenv("DB_USER", "postgres")
        _db_password = os.getenv("DB_PASSWORD", "postgres")
        _db_host = os.getenv("DB_HOST", "localhost")
        _db_port = os.getenv("DB_PORT", "5432")
        _db_test_name = os.getenv("TEST_DB_NAME", "elearning_test_db")
        _test_url = f"postgresql+psycopg2://{_db_user}:{_db_password}@{_db_host}:{_db_port}/{_db_test_name}"

    # Enforce safety guard
    verify_test_database_safety(_test_url)

    SQLALCHEMY_DATABASE_URI = _test_url

