from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address


def get_rate_limit_key():
    """
    Key function สำหรับ Rate Limiting:
    หากผู้ใช้ยืนยันตัวตนผ่าน JWT จะใช้ 'user:<user_id>' เพื่อให้แต่ละบัญชีมี bucket แยกกัน
    หากไม่มี JWT จะ fallback ไปใช้ Client IP (get_remote_address)
    """
    try:
        from flask_jwt_extended import get_jwt_identity
        user_id = get_jwt_identity()
        if user_id:
            return f"user:{user_id}"
    except Exception:
        pass
    return get_remote_address()


# =====================================================================
# extensions.py: การตั้งค่า Flask Extensions และ JWT Token Blocklist
# รองรับ UAT-013, UAT-014 (Database-backed Token Blocklist)
# =====================================================================

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
cors = CORS()
limiter = Limiter(
    key_func=get_rate_limit_key,
    default_limits=[],
    storage_uri="memory://"
)


@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload: dict) -> bool:
    """
    ตรวจสอบว่า Access Token jti นี้ถูก Revoke ลง Database หรือไม่ (UAT-013, UAT-014)
    หากพบว่ามี jti อยู่ในตาราง token_blocklist จะปฏิเสธคำขอทันที
    """
    jti = jwt_payload.get("jti")
    if not jti:
        return True
    from app.models.security import TokenBlocklist
    token = TokenBlocklist.query.filter_by(jti=jti).first()
    return token is not None


@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_payload: dict):
    """ส่งกลับ 401 เมื่อมีการพยายามนำ Token ที่ถูก Revoke แล้วกลับมาใช้งาน (UAT-013)"""
    return {
        "error": "Token revoked",
        "message": "The token has been revoked. Please log in again."
    }, 401


@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload: dict):
    """ส่งกลับ 401 เมื่อ Token หมดอายุ (UAT-012)"""
    return {
        "error": "Token expired",
        "message": "The token has expired. Please log in again."
    }, 401


@jwt.invalid_token_loader
def invalid_token_callback(error_string: str):
    """ส่งกลับ 401 เมื่อรูปแบบ Token ไม่ถูกต้องหรือถูกแก้ไข (UAT-012)"""
    return {
        "error": "Invalid token",
        "message": error_string
    }, 401


@jwt.unauthorized_loader
def missing_token_callback(error_string: str):
    """ส่งกลับ 401 เมื่อไม่มีการส่ง Authorization Header"""
    return {
        "error": "Authorization required",
        "message": "Request does not contain an access token."
    }, 401
