import hashlib
import secrets
import logging
from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt,
    get_jwt_identity,
)
from sqlalchemy import func
from app.extensions import db
from app.models.user import User, UserProfile
from app.models.role import Role
from app.models.security import RefreshToken, TokenBlocklist, PasswordResetToken
from app.services.email_service import send_reset_password_email
from app.utils.validators import (
    validate_email,
    validate_password,
    validate_display_name,
)

# =====================================================================
# auth.py: API การจัดการการเข้าสู่ระบบ ยืนยันตัวตน และ Refresh Token
# รองรับ UAT-004, UAT-005, UAT-006, UAT-007, UAT-011, UAT-013, UAT-014
# =====================================================================

auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")


def hash_token(raw_token: str) -> str:
    """แปลง Refresh Token ดิบเป็น SHA-256 Hex Digest เพื่อเก็บใน Database อย่างปลอดภัย"""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def generate_refresh_token_string() -> str:
    """สุ่มสร้าง Secure URL-safe String ความยาว 48 bytes (ประมาณ 64 ตัวอักษร) สำหรับเป็น Refresh Token"""
    return secrets.token_urlsafe(48)


@auth_bp.route("/register", methods=["POST"])
def register():
    """
    API สมัครสมาชิกใหม่ (Register) - รองรับ UAT-010
    1. ตรวจสอบว่า JSON body และฟิลด์ email, password, display_name ไม่ว่างเปล่า
    2. ทำ Validation รูปแบบอีเมล, ความยาวรหัสผ่าน (ขั้นต่ำ 6 ตัวอักษร), และชื่อที่แสดง
    3. ตรวจสอบอีเมลซ้ำในระบบ (Case-insensitive) หากซ้ำตอบกลับ HTTP 409 Conflict
    4. แฮชรหัสผ่านด้วย Password Hashing (werkzeug.security) ป้องกันการเก็บ Plain Text
    5. สร้าง User + UserProfile และกำหนด Role เริ่มต้นเป็น 'student'
    6. ตอบกลับ HTTP 201 Created พร้อมข้อมูลผู้ใช้ (ไม่มี password หรือ password_hash)
    """
    # 1. รับข้อมูล JSON Payload
    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return jsonify({
            "error": "Bad Request",
            "message": "กรุณาส่งข้อมูล JSON body ให้ถูกต้อง"
        }), 400

    email = data.get("email")
    password = data.get("password")
    display_name = data.get("display_name")

    # 2. Validation: ตรวจสอบความครบถ้วนและรูปแบบของข้อมูล
    # ตรวจสอบว่าไม่มีฟิลด์ใดที่เป็นค่าว่างหรือช่องว่างล้วน
    if not email or not str(email).strip():
        return jsonify({
            "error": "Bad Request",
            "message": "อีเมลต้องไม่เป็นค่าว่าง"
        }), 400

    if not password or not str(password).strip():
        return jsonify({
            "error": "Bad Request",
            "message": "รหัสผ่านต้องไม่เป็นค่าว่าง"
        }), 400

    if not display_name or not str(display_name).strip():
        return jsonify({
            "error": "Bad Request",
            "message": "ชื่อที่ใช้แสดงผลต้องไม่เป็นค่าว่าง"
        }), 400

    # ตรวจสอบรูปแบบอีเมล (Regex และความยาวไม่เกิน 255 ตัวอักษร)
    is_valid_email, email_err = validate_email(email)
    if not is_valid_email:
        return jsonify({"error": "Bad Request", "message": email_err}), 400

    # ตรวจสอบความปลอดภัยของรหัสผ่าน (ความยาวขั้นต่ำ 6 ตัวอักษร)
    is_valid_pwd, pwd_err = validate_password(password)
    if not is_valid_pwd:
        return jsonify({"error": "Bad Request", "message": pwd_err}), 400

    # ตรวจสอบความยาวชื่อที่แสดง (ความยาว 2 - 100 ตัวอักษร)
    is_valid_name, name_err = validate_display_name(display_name)
    if not is_valid_name:
        return jsonify({"error": "Bad Request", "message": name_err}), 400

    email_clean = str(email).strip().lower()

    # 3. ตรวจสอบอีเมลซ้ำ (Duplicate Email Check)
    existing_user = User.query.filter(func.lower(User.email) == email_clean).first()
    if existing_user:
        return jsonify({
            "error": "Conflict",
            "message": "อีเมลนี้มีผู้ใช้งานในระบบแล้ว"
        }), 409

    try:
        # 4. สร้าง User Entity และแฮชรหัสผ่าน (Password Hashing)
        new_user = User(
            email=email_clean,
            status="active"
        )
        # คำสั่ง set_password จะใช้ generate_password_hash ป้องกัน Plain Text ใน Database 100%
        new_user.set_password(str(password))

        # สร้าง UserProfile คู่กันเพื่อจัดเก็บ Display Name
        new_profile = UserProfile(
            user=new_user,
            display_name=str(display_name).strip()
        )

        # 5. กำหนดบทบาทเริ่มต้นเป็น 'student' (Default Role: Student)
        student_role = Role.query.filter_by(role_name="student").first()
        if not student_role:
            student_role = Role(role_name="student")
            db.session.add(student_role)
        new_user.roles.append(student_role)

        # บันทึกข้อมูลลงในฐานข้อมูล PostgreSQL (Database Insert)
        db.session.add(new_user)
        db.session.add(new_profile)
        db.session.commit()

        # 6. ตอบกลับ HTTP 201 Created (ห้ามส่ง password หรือ password_hash ใน Response)
        return jsonify({
            "message": "สมัครสมาชิกสำเร็จ",
            "user": {
                "user_id": str(new_user.user_id),
                "email": new_user.email,
                "display_name": new_profile.display_name,
                "role": "student",
                "roles": ["student"],
                "profile": new_profile.to_dict()
            }
        }), 201

    except Exception as exc:
        # กรณีเกิด Error ให้ Rollback ทันทีเพื่อความปลอดภัยของข้อมูล (Error Handling)
        db.session.rollback()
        return jsonify({
            "error": "Internal Server Error",
            "message": "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์ ไม่สามารถสร้างบัญชีผู้ใช้ได้"
        }), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    """
    API เข้าสู่ระบบ (Login) - รองรับ UAT-011 และ UAT-012
    1. ตรวจสอบว่า JSON body และฟิลด์ email, password ไม่ว่างเปล่า (400 Bad Request)
    2. ตรวจสอบรูปแบบอีเมล (400 Bad Request)
    3. ค้นหาผู้ใช้แบบ Case-insensitive
    4. ตรวจสอบรหัสผ่านด้วย Password Hash (user.check_password)
    5. หากไม่พบผู้ใช้หรือรหัสผ่านไม่ถูกต้อง ส่งกลับ HTTP 401 Unauthorized พร้อมข้อความกลาง
       "อีเมลหรือรหัสผ่านไม่ถูกต้อง" โดยไม่เปิดเผยสถานะการมีอยู่ของอีเมล (UAT-012)
    6. ตรวจสอบสถานะบัญชี (ห้าม inactive หรือ suspended)
    7. ออก Access Token (อายุ 15 นาที) และ Refresh Token (อายุ 7 วัน เก็บแบบ Hash ใน Database)
    8. ส่ง Response สำเร็จ (HTTP 200 OK) พร้อมข้อมูล User และ Role (UAT-011)
       โดยห้ามส่ง password หรือ password_hash ใน Response เด็ดขาด
    """
    # 1. รับและตรวจสอบข้อมูล JSON Payload
    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return jsonify({
            "error": "Bad Request",
            "message": "กรุณาส่งข้อมูล JSON body ให้ถูกต้อง"
        }), 400

    email = data.get("email")
    password = data.get("password")

    # ตรวจสอบค่าว่าง (Empty Validation)
    if not email or not str(email).strip():
        return jsonify({
            "error": "Bad Request",
            "message": "อีเมลต้องไม่เป็นค่าว่าง"
        }), 400

    if not password or not str(password).strip():
        return jsonify({
            "error": "Bad Request",
            "message": "รหัสผ่านต้องไม่เป็นค่าว่าง"
        }), 400

    email_clean = str(email).strip().lower()

    # ตรวจสอบรูปแบบอีเมลเบื้องต้น
    is_valid_email, email_err = validate_email(email_clean)
    if not is_valid_email:
        return jsonify({
            "error": "Bad Request",
            "message": email_err
        }), 400

    # 2. ค้นหาผู้ใช้ในฐานข้อมูล PostgreSQL (Case-insensitive)
    user = User.query.filter(func.lower(User.email) == email_clean).first()

    # 3. ตรวจสอบตัวตนและรหัสผ่าน (UAT-012: Wrong Password หรือ Unknown Email)
    # ใช้ check_password_hash ของ werkzeug.security ผ่าน user.check_password
    # หากไม่พบผู้ใช้ หรือ รหัสผ่านไม่ถูกต้อง ให้ส่งข้อความกลาง ไม่เปิดเผยว่าอีเมลมีอยู่หรือไม่
    if not user or not user.check_password(str(password)):
        return jsonify({
            "error": "Unauthorized",
            "message": "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
        }), 401

    # 4. ตรวจสอบสถานะบัญชีผู้ใช้
    if user.status != "active":
        return jsonify({
            "error": "Forbidden",
            "message": f"บัญชีนี้อยู่ในสถานะ {user.status} กรุณาติดต่อผู้ดูแลระบบ"
        }), 403

    # 5. สร้าง Access Token (อายุ 15 นาทีตาม Config โดย Identity คือ user_id ไม่มีข้อมูลลับ)
    access_token = create_access_token(identity=str(user.user_id))

    # 6. สร้าง Refresh Token (สุ่มความยาว 48 bytes) และแฮชด้วย SHA-256 บันทึกลงตาราง refresh_tokens
    raw_refresh_token = generate_refresh_token_string()
    token_hash = hash_token(raw_refresh_token)
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    db_refresh_token = RefreshToken(
        user_id=user.user_id,
        token_hash=token_hash,
        expires_at=expires_at
    )
    db.session.add(db_refresh_token)
    db.session.commit()

    # 7. กำหนด Primary Role ของผู้ใช้สำหรับการ Redirect และ Response
    primary_role = "student"
    if user.has_role("admin"):
        primary_role = "admin"
    elif user.has_role("instructor"):
        primary_role = "instructor"

    user_data = {
        "user_id": str(user.user_id),
        "email": user.email,
        "display_name": user.profile.display_name if user.profile else user.email,
        "role": primary_role,
        "roles": [r.role_name for r in user.roles],
        "profile": user.profile.to_dict() if user.profile else None,
        "status": user.status,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
    }

    # 8. ตอบกลับ HTTP 200 OK (UAT-011) พร้อมตั้งค่า HttpOnly Cookie
    response = make_response(jsonify({
        "message": "เข้าสู่ระบบสำเร็จ",
        "access_token": access_token,
        "refresh_token": raw_refresh_token,
        "token_type": "Bearer",
        "expires_in": 900,  # 15 นาที (วินาที)
        "user": user_data
    }), 200)

    # ตั้ง Cookie refresh_token (HttpOnly, SameSite=Lax, 7 days)
    response.set_cookie(
        "refresh_token",
        value=raw_refresh_token,
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        samesite="Lax",
        secure=False,  # Set False สำหรับ Localhost Development
        path="/"
    )

    return response


@auth_bp.route("/refresh", methods=["POST"])
def refresh():
    """
    ต่ออายุ Access Token ด้วย Refresh Token พร้อม Token Rotation (UAT-011)
    - รับ Refresh Token จาก Cookie หรือ JSON Body
    - ตรวจสอบ Hash ในตาราง refresh_tokens
    - ตรวจสอบว่าไม่หมดอายุ และยังไม่ถูก Revoke
    - เพิกถอน (Revoke) Refresh Token เดิมทันที แล้วออก Token คู่ใหม่ (Token Rotation)
    """
    body = request.get_json(silent=True) or {}
    raw_refresh_token = body.get("refresh_token") or request.cookies.get("refresh_token")

    if not raw_refresh_token:
        return jsonify({
            "error": "Unauthorized",
            "message": "Refresh token is missing."
        }), 401

    token_hash = hash_token(raw_refresh_token)
    db_token = RefreshToken.query.filter_by(token_hash=token_hash).first()

    # ตรวจสอบการมีอยู่ ความถูกต้อง และวันหมดอายุ
    if not db_token or not db_token.is_active():
        return jsonify({
            "error": "Unauthorized",
            "message": "Invalid or expired refresh token."
        }), 401

    user = User.query.get(db_token.user_id)
    if not user or user.status != "active":
        return jsonify({
            "error": "Forbidden",
            "message": "User account is no longer active."
        }), 403

    # Token Rotation: เพิกถอน Token เก่า
    db_token.revoked_at = datetime.now(timezone.utc)

    # สร้าง Token คู่ใหม่
    new_raw_refresh = generate_refresh_token_string()
    new_hash = hash_token(new_raw_refresh)
    new_expires = datetime.now(timezone.utc) + timedelta(days=7)

    new_db_token = RefreshToken(
        user_id=user.user_id,
        token_hash=new_hash,
        expires_at=new_expires
    )
    db.session.add(new_db_token)

    new_access_token = create_access_token(identity=str(user.user_id))
    db.session.commit()

    response = make_response(jsonify({
        "message": "Token refreshed successfully.",
        "access_token": new_access_token,
        "refresh_token": new_raw_refresh,
        "token_type": "Bearer",
        "expires_in": 900,
        "user": user.to_dict()
    }), 200)

    response.set_cookie(
        "refresh_token",
        value=new_raw_refresh,
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        samesite="Lax",
        secure=False,
        path="/"
    )

    return response


@auth_bp.route("/logout", methods=["POST"])
@jwt_required(optional=True)
def logout():
    """
    API ออกจากระบบ (Logout) - รองรับ UAT-013
    - ระบุ Session ผู้ใช้ผ่าน Access Token (ถ้ามี) หรือ Refresh Token
    - เพิกถอน Access Token ลงในตาราง token_blocklist
    - เพิกถอน Refresh Token ลงในตาราง refresh_tokens โดยตั้งค่า revoked_at เป็นเวลาปัจจุบัน
    - ไม่ลบข้อมูล refresh_tokens ออกจากฐานข้อมูล เพื่อเก็บบันทึกประวัติ
    - ล้าง HttpOnly Cookie refresh_token ออกจาก Browser
    - ส่งกลับผลลัพธ์สำเร็จ HTTP 200 OK โดยไม่เปิดเผย token_hash หรือข้อมูลลับ
    """
    jwt_data = get_jwt()
    user_id = get_jwt_identity()
    body = request.get_json(silent=True) or {}
    raw_refresh = body.get("refresh_token") or request.cookies.get("refresh_token")

    # หากไม่มีทั้ง Access Token และ Refresh Token ให้ส่ง 401 Unauthorized
    if not jwt_data and not raw_refresh:
        return jsonify({
            "error": "Unauthorized",
            "message": "Authorization token or refresh token is required."
        }), 401

    # 1. บันทึก jti ของ Access Token ลงใน token_blocklist (Database-backed Token Blocklist)
    if jwt_data:
        jti = jwt_data.get("jti")
        exp = jwt_data.get("exp")
        if jti and exp:
            expires_at = datetime.fromtimestamp(exp, tz=timezone.utc)
            existing_block = TokenBlocklist.query.filter_by(jti=jti).first()
            if not existing_block:
                blocked_token = TokenBlocklist(
                    jti=jti,
                    expires_at=expires_at
                )
                db.session.add(blocked_token)

    # 2. เพิกถอน Refresh Token ในตาราง refresh_tokens (ตั้งค่า revoked_at)
    if raw_refresh:
        token_hash = hash_token(raw_refresh)
        db_token = RefreshToken.query.filter_by(token_hash=token_hash).first()
        if db_token and db_token.revoked_at is None:
            db_token.revoked_at = datetime.now(timezone.utc)
    elif user_id:
        # หากไม่ได้ส่ง raw_refresh มา ให้ค้นหา Refresh Token ที่ยังไม่ถูก revoke ของ user_id
        active_tokens = RefreshToken.query.filter(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked_at.is_(None)
        ).all()
        for t in active_tokens:
            t.revoked_at = datetime.now(timezone.utc)

    db.session.commit()

    # 3. เตรียมผลลัพธ์ตอบกลับสำเร็จ (HTTP 200 OK)
    response = make_response(jsonify({
        "message": "ออกจากระบบสำเร็จ"
    }), 200)

    # 4. ล้าง HttpOnly Cookie refresh_token ออกจาก Browser
    response.delete_cookie(
        "refresh_token",
        path="/",
        httponly=True,
        samesite="Lax"
    )

    return response


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """
    ดึงข้อมูลโปรไฟล์ของผู้ใช้งานปัจจุบันจาก Access Token (UAT-016)
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Not Found", "message": "User not found."}), 404

    return jsonify({
        "user": user.to_dict()
    }), 200


# สร้าง Logger สำหรับบันทึกเหตุการณ์ของ Auth Routes
logger = logging.getLogger(__name__)


# =====================================================================
# API ขอรีเซ็ตรหัสผ่าน (Forgot Password)
# =====================================================================
@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    # รับข้อมูล JSON จาก Request Body
    data = request.get_json(silent=True)
    # ตรวจสอบว่ามีข้อมูลส่งมาและเป็น Dictionary หรือไม่
    if not data or not isinstance(data, dict):
        # ส่งคืน 400 Bad Request หากรูปแบบข้อมูลไม่ถูกต้อง
        return jsonify({
            "error": "Bad Request",
            "message": "กรุณาส่งข้อมูล JSON ให้ถูกต้อง"
        }), 400

    # ดึงค่าอีเมลที่ผู้ใช้กรอก
    email = data.get("email")
    # ตรวจสอบว่าผู้ใช้กรอกอีเมลหรือไม่
    if not email or not str(email).strip():
        # ส่งคืน 400 Bad Request หากไม่ได้กรอกอีเมล
        return jsonify({
            "error": "Bad Request",
            "message": "กรุณากรอกอีเมลที่ลงทะเบียนไว้"
        }), 400

    # ตัดช่องว่างหัวท้ายและแปลงเป็นตัวพิมพ์เล็ก
    email_clean = str(email).strip().lower()

    # ตรวจสอบความถูกต้องของรูปแบบอีเมล
    is_valid_email, email_err = validate_email(email_clean)
    # หากรูปแบบอีเมลไม่ถูกต้อง
    if not is_valid_email:
        # ส่งคืน 400 Bad Request พร้อมข้อความแจ้งเตือน
        return jsonify({
            "error": "Bad Request",
            "message": email_err
        }), 400

    # ข้อความมาตรฐานเพื่อป้องกันการตรวจสอบรายชื่อบัญชี (Account Enumeration Protection)
    generic_success_message = "หากอีเมลนี้มีบัญชีอยู่ในระบบ ระบบจะส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยังอีเมลของคุณ"

    # ค้นหาผู้ใช้ในฐานข้อมูลตามอีเมล (Case-insensitive)
    user = User.query.filter(func.lower(User.email) == email_clean).first()

    # หากไม่พบบัญชีผู้ใช้ในระบบ
    if not user:
        # บันทึก Log ข้อมูลในเซิร์ฟเวอร์ว่ามีการขอ Reset แต่ไม่พบบัญชี
        logger.info(f"Forgot password requested for non-existent email: {email_clean}")
        # ส่งคืน HTTP 200 พร้อมข้อความทั่วไป เพื่อความปลอดภัยป้องกัน Account Enumeration
        return jsonify({
            "message": generic_success_message
        }), 200

    # สุ่มสร้าง Secure URL-safe Token ความยาว 32 bytes สำหรับเป็น Plain Reset Token
    raw_token = secrets.token_urlsafe(32)
    # แปลง Token เป็น SHA-256 Hash เพื่อจัดเก็บในฐานข้อมูล (ไม่เก็บ Plain Token)
    token_hash = hash_token(raw_token)
    # กำหนดเวลาหมดอายุ 15 นาทีหลังจากนี้ (UTC)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

    # ยกเลิก Token รีเซ็ตรหัสผ่านเดิมของผู้ใช้รายนี้ที่ยังไม่ได้ถูกใช้งาน
    existing_unused_tokens = PasswordResetToken.query.filter(
        PasswordResetToken.user_id == user.user_id,
        PasswordResetToken.used_at.is_(None)
    ).all()
    # วนลูปตั้งค่า used_at เพื่อเพิกถอน Token เก่า
    for old_token in existing_unused_tokens:
        # กำหนดเวลาที่เพิกถอนเป็นเวลาปัจจุบัน
        old_token.used_at = datetime.now(timezone.utc)

    # สร้าง Record ใหม่ในตาราง password_reset_tokens
    reset_record = PasswordResetToken(
        user_id=user.user_id,
        token_hash=token_hash,
        expires_at=expires_at
    )
    # เพิ่ม Record เข้าสู่เซสชันฐานข้อมูล
    db.session.add(reset_record)
    # บันทึกข้อมูลลงในฐานข้อมูล
    db.session.commit()

    # เรียกใช้ Email Service เพื่อส่งอีเมลจริงไปยังผู้รับพร้อม Token ดิบ
    email_sent, email_result_msg = send_reset_password_email(user.email, raw_token)

    # ตรวจสอบว่าส่งอีเมลสำเร็จหรือไม่
    if not email_sent:
        # บันทึกข้อผิดพลาดจริงของ SMTP ลงใน Server Log สำหรับ Debug
        logger.error(f"Failed to deliver reset password email to {user.email}: {email_result_msg}")
        # ส่งคืน HTTP 500 กรณีระบบส่งอีเมลล้มเหลว เพื่อไม่ให้เกิด Fake Success
        return jsonify({
            "error": "Email Service Error",
            "message": "ไม่สามารถส่งอีเมลรีเซ็ตรหัสผ่านได้ในขณะนี้ กรุณาตรวจสอบการตั้งค่า SMTP หรือลองใหม่อีกครั้ง"
        }), 500

    # บันทึก Log ว่าส่งอีเมลรีเซ็ตรหัสผ่านสำเร็จเรียบร้อยแล้ว
    logger.info(f"Forgot password email delivered to {user.email}")

    # ส่งคืน HTTP 200 พร้อมข้อความแจ้งเตือนทั่วไปที่ปลอดภัย
    return jsonify({
        "message": generic_success_message
    }), 200


# =====================================================================
# API ตั้งรหัสผ่านใหม่ (Reset Password)
# =====================================================================
@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    # รับข้อมูล JSON จาก Request Body
    data = request.get_json(silent=True)
    # ตรวจสอบว่ามีข้อมูลส่งมาและเป็น Dictionary หรือไม่
    if not data or not isinstance(data, dict):
        # ส่งคืน 400 Bad Request หากรูปแบบข้อมูลไม่ถูกต้อง
        return jsonify({
            "error": "Bad Request",
            "message": "กรุณาส่งข้อมูล JSON ให้ถูกต้อง"
        }), 400

    # ดึงค่า Token ที่ส่งมา
    token = data.get("token")
    # ดึงค่ารหัสผ่านใหม่
    password = data.get("password")

    # ตรวจสอบว่ามีค่า Token หรือไม่
    if not token or not str(token).strip():
        # ส่งคืน 400 Bad Request หากไม่มี Token
        return jsonify({
            "error": "Bad Request",
            "message": "กรุณาระบุรหัส Token สำหรับรีเซ็ตรหัสผ่าน"
        }), 400

    # ตรวจสอบว่ามีค่ารหัสผ่านใหม่หรือไม่
    if not password or not str(password).strip():
        # ส่งคืน 400 Bad Request หากรหัสผ่านว่าง
        return jsonify({
            "error": "Bad Request",
            "message": "รหัสผ่านต้องไม่เป็นค่าว่าง"
        }), 400

    # ตรวจสอบความถูกต้องและความยาวของรหัสผ่านใหม่ (ขั้นต่ำ 6 ตัวอักษร)
    is_valid_pw, pw_err = validate_password(password)
    # หากรหัสผ่านไม่ผ่านเกณฑ์
    if not is_valid_pw:
        # ส่งคืน 400 Bad Request พร้อมข้อความแจ้งเตือน
        return jsonify({
            "error": "Bad Request",
            "message": pw_err
        }), 400

    # แปลง Token ดิบที่ได้รับเป็น SHA-256 Hash เพื่อค้นหาในฐานข้อมูล
    token_hash = hash_token(str(token).strip())

    # ค้นหา Record ของ Token ในตาราง password_reset_tokens
    reset_record = PasswordResetToken.query.filter_by(token_hash=token_hash).first()

    # กรณีที่ 1: ไม่พบ Token ในระบบ
    if not reset_record:
        # ส่งคืน 400 Bad Request
        return jsonify({
            "error": "Bad Request",
            "message": "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง"
        }), 400

    # กรณีที่ 2: Token ถูกนำไปใช้งานแล้ว (One-time Use Requirement)
    if reset_record.used_at is not None:
        # ส่งคืน 400 Bad Request ตามข้อกำหนด
        return jsonify({
            "error": "Bad Request",
            "message": "ลิงก์นี้ถูกใช้งานแล้ว กรุณาขอลิงก์รีเซ็ตรหัสผ่านใหม่"
        }), 400

    # ดึงเวลาปัจจุบันใน Timezone UTC สำหรับเปรียบเทียบ
    now = datetime.now(timezone.utc)

    # กรณีที่ 3: Token หมดอายุแล้ว (อายุเกิน 15 นาที)
    if reset_record.expires_at <= now:
        # ส่งคืน 400 Bad Request ตามข้อกำหนด
        return jsonify({
            "error": "Bad Request",
            "message": "ลิงก์รีเซ็ตรหัสผ่านหมดอายุแล้ว กรุณาขอลิงก์ใหม่อีกครั้ง"
        }), 400

    # ดึงข้อมูลผู้ใช้งานที่เชื่อมโยงกับ Token นี้
    user = User.query.get(reset_record.user_id)
    # ตรวจสอบว่าพบบัญชีผู้ใช้หรือไม่
    if not user:
        # ส่งคืน 400 Bad Request หากไม่พบบัญชีผู้ใช้
        return jsonify({
            "error": "Bad Request",
            "message": "ไม่พบบัญชีผู้ใช้งานที่เกี่ยวข้อง"
        }), 400

    # แฮชรหัสผ่านใหม่และอัปเดตลงใน User Model
    user.set_password(password)
    # อัปเดตวันเวลาแก้ไขข้อมูลผู้ใช้
    user.updated_at = now

    # บันทึก used_at เพื่อทำให้ Token นี้ไม่สามารถนำกลับมาใช้ซ้ำได้อีก
    reset_record.used_at = now

    # เพิกถอน Refresh Token เดิมทั้งหมดของผู้ใช้ เพื่อบังคับให้เข้าสู่ระบบใหม่
    active_refresh_tokens = RefreshToken.query.filter(
        RefreshToken.user_id == user.user_id,
        RefreshToken.revoked_at.is_(None)
    ).all()
    # วนลูปเพิกถอน Refresh Token
    for ref_tok in active_refresh_tokens:
        # บันทึกเวลาที่เพิกถอน
        ref_tok.revoked_at = now

    # บันทึกการเปลี่ยนแปลงทั้งหมดลงในฐานข้อมูล
    db.session.commit()

    # บันทึก Log การเปลี่ยนรหัสผ่านสำเร็จ
    logger.info(f"Password reset successfully completed for user: {user.email}")

    # ส่งคืนผลลัพธ์สำเร็จ HTTP 200 โดยไม่สร้าง JWT และไม่อัตโนมัติล็อกอิน
    return jsonify({
        "message": "เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่"
    }), 200

