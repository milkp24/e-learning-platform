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
    if token is not None:
        return True

    # ข้อ 6: บัญชีที่ถูกระงับ/ปิดใช้งาน/ลบไปแล้ว ใช้ Access Token เดิมต่อไม่ได้
    # (ไม่ต้องรอให้ Token หมดอายุเอง)
    user_id = jwt_payload.get("sub")
    if user_id:
        import uuid
        from app.models.user import User
        try:
            user = db.session.get(User, uuid.UUID(str(user_id)))
        except (ValueError, TypeError):
            return True
        except Exception:
            db.session.rollback()
            return True
        if user is None or user.status != "active":
            return True
        # ข้อ 8: Token ที่ออกก่อนการยกเลิก Session ทั้งหมดของบัญชีนี้ ใช้ไม่ได้
        revoked_at = getattr(user, "sessions_revoked_at", None)
        issued_at = jwt_payload.get("iat")
        if revoked_at is not None and issued_at is not None:
            from datetime import timezone as _tz
            if revoked_at.tzinfo is None:
                revoked_at = revoked_at.replace(tzinfo=_tz.utc)
            if int(issued_at) < int(revoked_at.timestamp()):
                return True
    return False


@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_payload: dict):
    """ส่งกลับ 401 เมื่อมีการพยายามนำ Token ที่ถูก Revoke แล้วกลับมาใช้งาน (UAT-013)"""
    return {
        "error": "Token revoked",
        "message": "เซสชันนี้ถูกยกเลิกแล้ว กรุณาเข้าสู่ระบบใหม่อีกครั้ง"
    }, 401


@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload: dict):
    """ส่งกลับ 401 เมื่อ Token หมดอายุ (UAT-012)"""
    return {
        "error": "Token expired",
        "message": "เซสชันหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่อีกครั้ง"
    }, 401


@jwt.invalid_token_loader
def invalid_token_callback(error_string: str):
    """ส่งกลับ 401 เมื่อรูปแบบ Token ไม่ถูกต้องหรือถูกแก้ไข (UAT-012)"""
    return {
        "error": "Invalid token",
        "message": "ข้อมูลการเข้าสู่ระบบไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่อีกครั้ง"
    }, 401


@jwt.unauthorized_loader
def missing_token_callback(error_string: str):
    """ส่งกลับ 401 เมื่อไม่มีการส่ง Authorization Header"""
    return {
        "error": "Authorization required",
        "message": "กรุณาเข้าสู่ระบบก่อนใช้งาน"
    }, 401
