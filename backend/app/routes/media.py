from flask import Blueprint, request, jsonify, send_from_directory
from flask_jwt_extended import jwt_required
from app.utils.decorators import roles_required, get_current_user
from app.services.media_service import MediaService, MediaServiceError

# =====================================================================
# media.py: API จัดการอัปโหลดและให้บริการไฟล์มัลติมีเดีย (Media Upload & Serving)
# รองรับ UAT-021: รองรับไฟล์วิดีโอ MP4 และไฟล์เอกสาร PDF
# รองรับ UAT-028: บริการไฟล์ PDF ให้กับ PDF Player
# (Delegated to MediaService)
# =====================================================================

media_bp = Blueprint("media", __name__, url_prefix="/api/v1/media")


@media_bp.route("/upload", methods=["POST"])
@roles_required("instructor", "admin")
def upload_file():
    """
    อัปโหลดไฟล์สื่อการเรียนรู้ (MP4 Video, PDF) (UAT-021)
    - ต้องใช้ Multipart/Form-Data ด้วยคีย์ 'file'
    - ตรวจสอบสิทธิ์: เฉพาะ Instructor, Admin, Super Admin
    - ตรวจสอบ MIME type และนามสกุลไฟล์
    - ตรวจสอบขนาดไฟล์ไม่เกิน 50 MB
    - ป้องกัน Path Traversal และตั้งชื่อไฟล์ที่ไม่ซ้ำกัน
    - บันทึกลงตาราง Media ในฐานข้อมูลจริง
    """
    if "file" not in request.files:
        return jsonify({
            "error": "Validation Error",
            "message": "กรุณาเลือกไฟล์ที่ต้องการอัปโหลด (ไม่พบพารามิเตอร์ 'file')"
        }), 400

    file = request.files["file"]
    caller = get_current_user()

    try:
        res, status_code = MediaService.save_uploaded_file(file, caller, request.host_url)
        return jsonify(res), status_code
    except MediaServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code


@media_bp.route("/images", methods=["POST"])
@jwt_required()
def upload_image():
    """
    อัปโหลดรูปภาพ (รูปปกคอร์ส, รูปโปรไฟล์) ข้อ 22, 23
    - ผู้ใช้ทุกบทบาทที่เข้าสู่ระบบ (รูปโปรไฟล์ของผู้เรียนก็ใช้ endpoint นี้)
    - Multipart/Form-Data คีย์ 'file'
    - คืน relative_url ให้นำไปบันทึก (ไม่ผูกกับชื่อโฮสต์ ย้ายเซิร์ฟเวอร์แล้วรูปไม่หาย)
    """
    caller = get_current_user()
    if not caller or caller.status != "active":
        return jsonify({"error": "Unauthorized", "message": "กรุณาเข้าสู่ระบบก่อนอัปโหลดรูปภาพ"}), 401
    file = request.files.get("file")
    try:
        res, status_code = MediaService.save_image(file, caller, request.host_url)
        return jsonify(res), status_code
    except MediaServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code


@media_bp.route("/uploads/<path:filename>", methods=["GET"])
def serve_uploaded_file(filename: str):
    """
    ให้บริการไฟล์มัลติมีเดียและเอกสารที่อัปโหลด (Streaming & Serving)
    - รองรับ HTTP Range Requests (206 Partial Content) สำหรับ Video Seek & Scrubbing
    - ป้องกัน Path Traversal
    """
    try:
        upload_dir, clean_name = MediaService.resolve_uploaded_file(filename)
        return send_from_directory(upload_dir, clean_name, as_attachment=False)
    except MediaServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code

