# =====================================================================
# errors.py: ข้อความ Error กลางของระบบ (ข้อ 39)
#
# - ผู้ใช้เห็นข้อความภาษาไทยที่อ่านเข้าใจง่าย และบอกว่าต้องทำอะไรต่อ
# - ไม่ส่งรายละเอียดทางเทคนิค (ข้อความ Exception, SQL, Stack Trace) ออกไปให้ผู้ใช้
#   รายละเอียดจริงบันทึกใน Log ของเซิร์ฟเวอร์แทน
# =====================================================================
from flask import current_app, jsonify, request
from sqlalchemy.exc import DataError, IntegrityError
from werkzeug.exceptions import HTTPException

INTERNAL_ERROR_MESSAGE = "ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้งในอีกสักครู่ หากยังไม่ได้ให้แจ้งผู้ดูแลระบบ"

HTTP_ERROR_MESSAGES = {
    400: ("Bad Request", "ข้อมูลที่ส่งมาไม่ถูกต้อง กรุณาตรวจสอบข้อมูลแล้วลองใหม่อีกครั้ง"),
    401: ("Unauthorized", "กรุณาเข้าสู่ระบบก่อนใช้งาน"),
    403: ("Forbidden", "คุณไม่มีสิทธิ์ทำรายการนี้ หากคิดว่าเป็นความผิดพลาด กรุณาติดต่อผู้ดูแลระบบ"),
    404: ("Not Found", "ไม่พบข้อมูลหรือหน้าที่ต้องการ ข้อมูลอาจถูกลบไปแล้ว กรุณารีเฟรชหน้าแล้วลองใหม่"),
    405: ("Method Not Allowed", "ไม่รองรับการทำรายการนี้ กรุณารีเฟรชหน้าแล้วลองใหม่อีกครั้ง"),
    413: ("Payload Too Large", "ไฟล์หรือข้อมูลมีขนาดใหญ่เกินกำหนด (สูงสุด 50 MB) กรุณาเลือกไฟล์ที่เล็กลง"),
    415: ("Unsupported Media Type", "รูปแบบข้อมูลไม่ถูกต้อง กรุณารีเฟรชหน้าแล้วลองใหม่อีกครั้ง"),
    500: ("Internal Server Error", INTERNAL_ERROR_MESSAGE),
}


# ข้อ 37: ตาข่ายกันพลาดชั้นสุดท้าย ถ้าข้อมูลหลุดการตรวจของ Service ไปถึงฐานข้อมูล
# ให้ตอบเป็น 400/409 ที่บอกผู้ใช้ว่าต้องแก้อะไร แทน 500
DATA_ERROR_MESSAGE = "ข้อมูลบางช่องยาวเกินกำหนดหรือรูปแบบไม่ถูกต้อง กรุณาตรวจสอบข้อมูลแล้วลองใหม่อีกครั้ง"
DUPLICATE_MESSAGE = "ข้อมูลนี้มีอยู่ในระบบแล้ว กรุณาใช้ค่าอื่น"
MISSING_MESSAGE = "กรุณากรอกข้อมูลที่จำเป็นให้ครบ"


def database_error_response(exc: Exception):
    """แปลง Error จากฐานข้อมูลที่เกิดจากข้อมูลของผู้ใช้เป็นคำตอบ 400/409 คืน None ถ้าไม่ใช่กรณีนั้น"""
    if isinstance(exc, DataError):
        return jsonify({"error": "Validation Error", "message": DATA_ERROR_MESSAGE}), 400
    if isinstance(exc, IntegrityError):
        code = getattr(getattr(exc, "orig", None), "pgcode", None)
        text = str(getattr(exc, "orig", exc)).lower()
        if code == "23505" or "unique" in text:
            return jsonify({"error": "Conflict", "message": DUPLICATE_MESSAGE}), 409
        if code == "23502" or "not null" in text or "not-null" in text:
            return jsonify({"error": "Validation Error", "message": MISSING_MESSAGE}), 400
        return jsonify({"error": "Validation Error", "message": DATA_ERROR_MESSAGE}), 400
    return None


def internal_error(exc: Exception | None = None):
    """คืน 500 พร้อมข้อความที่ปลอดภัย และบันทึกรายละเอียดจริงลง Log
    (ถ้าเป็น Error จากข้อมูลของผู้ใช้ เช่นยาวเกินหรือซ้ำ จะตอบ 400/409 แทน)"""
    if exc is not None:
        try:
            from app.extensions import db
            db.session.rollback()
        except Exception:
            pass
        mapped = database_error_response(exc)
        if mapped is not None:
            return mapped
        current_app.logger.exception("Unhandled error: %s", exc)
    return jsonify({"error": "Internal Server Error", "message": INTERNAL_ERROR_MESSAGE}), 500


def register_error_handlers(app):
    """ให้ทุก Error ตอบเป็น JSON ภาษาไทย แทนหน้า HTML ของ Werkzeug ที่มีรายละเอียดทางเทคนิค"""

    @app.before_request
    def require_json_object_body():
        """ข้อ 37: คำขอที่ส่ง JSON มา (POST/PUT/PATCH) ต้องเป็น Object { ... } ที่อ่านได้
        ทุก Endpoint ของระบบรับข้อมูลเป็น Object จึงตรวจที่เดียวแทนการตรวจซ้ำทุกจุด"""
        if request.method not in ("POST", "PUT", "PATCH") or not request.is_json:
            return None
        if not request.get_data(cache=True):
            return None  # ไม่มี body (เช่น logout / refresh) ให้ Endpoint ตัดสินเอง
        data = request.get_json(silent=True)
        if data is None:
            return jsonify({
                "error": "Bad Request",
                "message": "รูปแบบข้อมูลที่ส่งมาไม่ถูกต้อง กรุณารีเฟรชหน้าแล้วลองใหม่อีกครั้ง",
            }), 400
        if not isinstance(data, dict):
            return jsonify({
                "error": "Bad Request",
                "message": "รูปแบบข้อมูลที่ส่งมาไม่ถูกต้อง กรุณารีเฟรชหน้าแล้วลองใหม่อีกครั้ง",
            }), 400
        return None

    @app.errorhandler(HTTPException)
    def handle_http_exception(exc: HTTPException):
        code = exc.code or 500
        if code == 429:
            # ใช้ handler 429 ของ Rate Limiting ที่มีอยู่
            return jsonify({
                "error": "Too Many Requests",
                "message": "คำขอถี่เกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง",
            }), 429
        error, message = HTTP_ERROR_MESSAGES.get(
            code, (exc.name or "Error", "ไม่สามารถทำรายการได้ กรุณาลองใหม่อีกครั้ง")
        )
        return jsonify({"error": error, "message": message}), code

    @app.errorhandler(Exception)
    def handle_unexpected_exception(exc: Exception):
        if isinstance(exc, HTTPException):
            return handle_http_exception(exc)
        return internal_error(exc)
