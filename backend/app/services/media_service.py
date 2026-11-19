import os
import uuid
from flask import current_app
from werkzeug.utils import secure_filename
from app.extensions import db
from app.models.user import User
from app.models.classroom import Media


class MediaServiceError(Exception):
    """Base exception for media domain operations."""
    def __init__(self, message: str, status_code: int = 400, error: str = "Bad Request"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error = error


class MediaService:
    """
    MediaService: Central business logic service for media upload, validation,
    storage management, metadata records, and file resolution.
    Supports UAT-021 (MP4/PDF uploads) and UAT-028 (PDF/Video streaming & serving).
    """

    ALLOWED_EXTENSIONS = {
        "mp4": "video/mp4",
        "pdf": "application/pdf",
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "webp": "image/webp"
    }

    ALLOWED_MIME_TYPES = {
        "video/mp4",
        "video/webm",
        "application/pdf",
        "application/x-pdf",
        "image/png",
        "image/jpeg",
        "image/webp"
    }

    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

    @classmethod
    def get_upload_dir(cls) -> str:
        """ดึงหรือสร้างโฟลเดอร์สำหรับจัดเก็บไฟล์ที่อัปโหลด"""
        upload_dir = current_app.config.get(
            "UPLOAD_FOLDER",
            os.path.join(os.path.abspath(os.path.dirname(__file__)), "..", "..", "uploads")
        )
        upload_dir = os.path.abspath(upload_dir)
        os.makedirs(upload_dir, exist_ok=True)
        return upload_dir

    @classmethod
    def save_uploaded_file(cls, file, caller: User | None, host_url: str) -> tuple[dict, int]:
        """
        อัปโหลดและจัดเก็บไฟล์สื่อการเรียนรู้ (MP4 Video, PDF, Images) (UAT-021)
        - ตรวจสอบความถูกต้องของไฟล์
        - ตรวจสอบ Path Traversal
        - ตรวจสอบ MIME type และนามสกุลไฟล์
        - ตรวจสอบขนาดไฟล์ไม่เกิน 50 MB
        - ตั้งชื่อไฟล์ปลอดภัยและไม่ซ้ำกัน
        - บันทึกลงตาราง Media ในฐานข้อมูลจริง
        """
        if not file or not file.filename or file.filename.strip() == "":
            raise MediaServiceError("กรุณาเลือกไฟล์ที่ต้องการอัปโหลด", 400, "Validation Error")

        raw_filename = file.filename.strip()

        # ตรวจสอบ Path Traversal ในชื่อไฟล์ดิบ
        if ".." in raw_filename or "/" in raw_filename or "\\" in raw_filename:
            raise MediaServiceError("ชื่อไฟล์ไม่ปลอดภัยหรือมีอักขระที่ไม่อนุญาต", 400, "Validation Error")

        # สกัดนามสกุลไฟล์
        if "." not in raw_filename:
            raise MediaServiceError("ไฟล์ต้องมีนามสกุลที่ถูกต้อง (.mp4 หรือ .pdf)", 400, "Validation Error")

        ext = raw_filename.rsplit(".", 1)[1].lower()
        if ext not in cls.ALLOWED_EXTENSIONS:
            raise MediaServiceError(
                f"ประเภทไฟล์ไม่ถูกต้อง (.{ext}) รองรับเฉพาะไฟล์ MP4, PDF, PNG, JPG, JPEG, WEBP เท่านั้น",
                400,
                "Validation Error"
            )

        # ตรวจสอบ MIME Type
        content_type = (file.content_type or "").lower().strip()
        if content_type and content_type not in cls.ALLOWED_MIME_TYPES and content_type != "application/octet-stream":
            raise MediaServiceError(
                f"MIME type '{content_type}' ไม่สอดคล้องกับประเภทไฟล์ที่อนุญาต",
                400,
                "Validation Error"
            )

        # ตรวจสอบขนาดไฟล์
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)

        if file_size == 0:
            raise MediaServiceError("ไฟล์ที่เลือกไม่มีข้อมูล (ขนาดไฟล์ 0 ไบต์)", 400, "Validation Error")

        if file_size > cls.MAX_FILE_SIZE:
            max_mb = cls.MAX_FILE_SIZE // (1024 * 1024)
            actual_mb = file_size / (1024 * 1024)
            raise MediaServiceError(
                f"ขนาดไฟล์เกินขีดจำกัดที่อนุญาต (สูงสุด {max_mb} MB) ไฟล์ของคุณมีขนาด {actual_mb:.1f} MB",
                400,
                "Payload Too Large"
            )

        # สร้างชื่อไฟล์ที่ปลอดภัยและไม่ซ้ำกัน
        safe_base = secure_filename(raw_filename.rsplit(".", 1)[0])
        if not safe_base:
            safe_base = "media"
        unique_suffix = uuid.uuid4().hex[:12]
        stored_filename = f"{unique_suffix}_{safe_base}.{ext}"

        upload_dir = cls.get_upload_dir()
        destination = os.path.join(upload_dir, stored_filename)

        # ป้องกัน Path Traversal จากปลายทาง
        if not os.path.abspath(destination).startswith(upload_dir):
            raise MediaServiceError("ปลายทางจัดเก็บไฟล์ไม่ปลอดภัย", 400, "Validation Error")

        try:
            file.save(destination)
        except Exception as e:
            raise MediaServiceError(f"ไม่สามารถบันทึกไฟล์ได้: {str(e)}", 500, "Internal Server Error")

        # สร้าง URL สำหรับเข้าถึงไฟล์
        clean_host = host_url.rstrip("/")
        file_url = f"{clean_host}/api/v1/media/uploads/{stored_filename}"

        # บันทึกข้อมูลลงฐานข้อมูลจริงในตาราง media
        determined_type = cls.ALLOWED_EXTENSIONS.get(ext, "application/octet-stream")

        try:
            media_record = Media(
                user_id=caller.user_id if caller else None,
                file_name=raw_filename,
                file_url=file_url,
                file_type=determined_type,
                file_size=file_size
            )
            db.session.add(media_record)
            db.session.commit()
            media_id = str(media_record.media_id)
        except Exception:
            db.session.rollback()
            # แม้บันทึกลงตาราง media ล้มเหลว ไฟล์ยังคงอยู่และใช้งานได้
            media_id = None

        return {
            "message": "อัปโหลดไฟล์สำเร็จ",
            "file_url": file_url,
            "relative_url": f"/api/v1/media/uploads/{stored_filename}",
            "file_name": raw_filename,
            "stored_filename": stored_filename,
            "file_type": determined_type,
            "file_size": file_size,
            "media_id": media_id
        }, 201

    @classmethod
    def resolve_uploaded_file(cls, filename: str) -> tuple[str, str]:
        """
        ตรวจสอบและระบุที่อยู่ของไฟล์ที่ต้องการให้บริการ (Streaming & Serving)
        - ป้องกัน Path Traversal
        - คืนค่า (upload_dir, clean_filename) หากไฟล์มีอยู่จริง
        """
        clean_name = os.path.basename(filename)
        if clean_name != filename or ".." in filename or "/" in filename or "\\" in filename:
            raise MediaServiceError("Invalid filename requested.", 400, "Bad Request")

        upload_dir = cls.get_upload_dir()
        file_path = os.path.join(upload_dir, clean_name)

        if not os.path.isfile(file_path):
            raise MediaServiceError("File not found.", 404, "Not Found")

        return upload_dir, clean_name
