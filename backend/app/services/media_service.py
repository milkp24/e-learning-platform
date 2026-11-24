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
        "webm": "video/webm",
        "pdf": "application/pdf",
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "webp": "image/webp",
        # เอกสารแนบ (ข้อ 23): เดิมหน้าเว็บแปลงเป็น Base64 เก็บลงฐานข้อมูลโดยไม่ผ่านการตรวจ
        "doc": "application/msword",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "ppt": "application/vnd.ms-powerpoint",
        "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "xls": "application/vnd.ms-excel",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "zip": "application/zip",
    }

    # MIME ที่เบราว์เซอร์ส่งมาได้สำหรับแต่ละนามสกุล (application/octet-stream ยอมรับเสมอ
    # เพราะบางเบราว์เซอร์/ระบบปฏิบัติการไม่รู้จักชนิดไฟล์ แต่ยังต้องผ่านการตรวจเนื้อไฟล์)
    EXTENSION_MIME_TYPES = {
        "mp4": {"video/mp4"},
        "webm": {"video/webm"},
        "pdf": {"application/pdf", "application/x-pdf"},
        "png": {"image/png"},
        "jpg": {"image/jpeg", "image/pjpeg"},
        "jpeg": {"image/jpeg", "image/pjpeg"},
        "webp": {"image/webp"},
        "doc": {"application/msword"},
        "docx": {"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
        "ppt": {"application/vnd.ms-powerpoint"},
        "pptx": {"application/vnd.openxmlformats-officedocument.presentationml.presentation"},
        "xls": {"application/vnd.ms-excel"},
        "xlsx": {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},
        "zip": {"application/zip", "application/x-zip-compressed", "multipart/x-zip"},
    }

    ALLOWED_MIME_TYPES = set().union(*EXTENSION_MIME_TYPES.values())

    FILE_TYPE_LABEL = "MP4, WEBM, PDF, PNG, JPG, WEBP, DOC, DOCX, PPT, PPTX, XLS, XLSX, ZIP"

    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

    # รูปภาพ (รูปปกคอร์ส, รูปโปรไฟล์) ข้อ 22, 23: รับเฉพาะรูป ขนาดไม่เกิน 5 MB
    IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
    MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB
    UPLOADS_PATH = "/api/v1/media/uploads/"
    MAX_IMAGE_URL_LENGTH = 512  # เท่ากับความยาวคอลัมน์ thumbnail_url

    @staticmethod
    def detect_image_type(head: bytes) -> str | None:
        """ดูจากเนื้อไฟล์จริง (Magic Bytes) ว่าเป็นรูปชนิดไหน กันการเปลี่ยนนามสกุลไฟล์อื่นเป็น .png"""
        if head.startswith(b"\x89PNG\r\n\x1a\n"):
            return "png"
        if head[:3] == b"\xff\xd8\xff":
            return "jpeg"
        if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
            return "webp"
        return None

    @classmethod
    def content_matches_extension(cls, ext: str, head: bytes) -> bool:
        """ข้อ 23: ตรวจเนื้อไฟล์จริง (Magic Bytes) ว่าตรงกับนามสกุล กันการเปลี่ยนชื่อไฟล์อื่นมาอัปโหลด"""
        if ext in cls.IMAGE_EXTENSIONS:
            detected = cls.detect_image_type(head)
            return detected == ("jpeg" if ext in {"jpg", "jpeg"} else ext)
        if ext == "pdf":
            return head.startswith(b"%PDF-")
        if ext == "mp4":
            return len(head) >= 12 and head[4:8] == b"ftyp"
        if ext == "webm":
            return head.startswith(b"\x1a\x45\xdf\xa3")
        if ext in {"docx", "pptx", "xlsx", "zip"}:
            return head.startswith(b"PK\x03\x04") or (ext == "zip" and head.startswith(b"PK\x05\x06"))
        if ext in {"doc", "ppt", "xls"}:
            return head.startswith(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1")
        return False

    @classmethod
    def save_image(cls, file, caller: User | None, host_url: str) -> tuple[dict, int]:
        """
        อัปโหลดรูปภาพ (ข้อ 22, 23) แล้วคืนที่อยู่ไฟล์ไปบันทึกแทนการเก็บ Base64 ลงฐานข้อมูล
        - รับเฉพาะ PNG, JPG, JPEG, WEBP ไม่เกิน 5 MB
        - ตรวจเนื้อไฟล์ว่าเป็นรูปจริง ไม่ใช่แค่นามสกุล
        - ไม่บันทึกไฟล์ที่ไม่ผ่านการตรวจ
        """
        if not file or not file.filename or not file.filename.strip():
            raise MediaServiceError("กรุณาเลือกไฟล์รูปภาพ", 400, "Validation Error")

        name = file.filename.strip()
        ext = name.rsplit(".", 1)[1].lower() if "." in name else ""
        if ext not in cls.IMAGE_EXTENSIONS:
            raise MediaServiceError(
                "รองรับเฉพาะไฟล์รูปภาพ PNG, JPG หรือ WEBP เท่านั้น", 400, "Validation Error"
            )

        file.seek(0, os.SEEK_END)
        size = file.tell()
        file.seek(0)
        if size == 0:
            raise MediaServiceError("ไฟล์รูปภาพว่างเปล่า กรุณาเลือกไฟล์ใหม่", 400, "Validation Error")
        if size > cls.MAX_IMAGE_SIZE:
            raise MediaServiceError(
                f"รูปภาพต้องมีขนาดไม่เกิน {cls.MAX_IMAGE_SIZE // (1024 * 1024)} MB "
                f"(ไฟล์นี้ {size / (1024 * 1024):.1f} MB) กรุณาย่อรูปแล้วลองใหม่",
                400,
                "Payload Too Large",
            )

        head = file.read(16)
        file.seek(0)
        if cls.detect_image_type(head) is None:
            raise MediaServiceError(
                "ไฟล์นี้ไม่ใช่รูปภาพที่ถูกต้อง กรุณาเลือกไฟล์ PNG, JPG หรือ WEBP", 400, "Validation Error"
            )

        return cls.save_uploaded_file(file, caller, host_url)

    @classmethod
    def clean_image_url(cls, value, field_label: str = "รูปภาพ") -> str | None:
        """
        ตรวจค่ารูปภาพก่อนบันทึก (ข้อ 22): เก็บได้แค่ลิงก์ http(s) หรือที่อยู่ไฟล์ที่อัปโหลดแล้ว
        ไม่รับ Base64 (data:) เพราะยาวเกินคอลัมน์และทำให้บันทึกไม่ได้
        """
        if value is None:
            return None
        if not isinstance(value, str):
            raise MediaServiceError(f"{field_label}ไม่ถูกต้อง", 400, "Validation Error")
        url = value.strip()
        if not url:
            return None
        if url.startswith("data:"):
            raise MediaServiceError(
                f"{field_label}ต้องอัปโหลดผ่านปุ่มเลือกรูปก่อน ระบบไม่รับรูปแบบ Base64", 400, "Validation Error"
            )
        if len(url) > cls.MAX_IMAGE_URL_LENGTH:
            raise MediaServiceError(
                f"ลิงก์{field_label}ยาวเกิน {cls.MAX_IMAGE_URL_LENGTH} ตัวอักษร", 400, "Validation Error"
            )
        if not (url.startswith(("http://", "https://")) or url.startswith(cls.UPLOADS_PATH)):
            raise MediaServiceError(
                f"ลิงก์{field_label}ต้องขึ้นต้นด้วย http:// หรือ https://", 400, "Validation Error"
            )
        return url

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
            raise MediaServiceError(f"ไฟล์ต้องมีนามสกุล รองรับ {cls.FILE_TYPE_LABEL}", 400, "Validation Error")

        ext = raw_filename.rsplit(".", 1)[1].lower()
        if ext not in cls.ALLOWED_EXTENSIONS:
            raise MediaServiceError(
                f"ประเภทไฟล์ไม่ถูกต้อง (.{ext}) รองรับเฉพาะไฟล์ {cls.FILE_TYPE_LABEL}",
                400,
                "Validation Error"
            )

        # ตรวจสอบ MIME Type ให้ตรงกับนามสกุล (เช่น .pdf แต่ส่งมาเป็น image/png = ไม่ผ่าน)
        content_type = (file.content_type or "").lower().split(";")[0].strip()
        if (
            content_type
            and content_type != "application/octet-stream"
            and content_type not in cls.EXTENSION_MIME_TYPES.get(ext, set())
        ):
            raise MediaServiceError(
                f"ชนิดไฟล์ไม่ตรงกับนามสกุล .{ext} กรุณาตรวจสอบไฟล์แล้วลองใหม่",
                400,
                "Validation Error"
            )

        # ตรวจสอบขนาดไฟล์
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)

        if file_size == 0:
            raise MediaServiceError("ไฟล์ที่เลือกไม่มีข้อมูล (ขนาดไฟล์ 0 ไบต์)", 400, "Validation Error")

        # รูปภาพจำกัด 5 MB เหมือนการอัปโหลดรูปปก/โปรไฟล์ ไฟล์อื่น 50 MB
        max_size = cls.MAX_IMAGE_SIZE if ext in cls.IMAGE_EXTENSIONS else cls.MAX_FILE_SIZE
        if file_size > max_size:
            max_mb = max_size // (1024 * 1024)
            actual_mb = file_size / (1024 * 1024)
            raise MediaServiceError(
                f"ขนาดไฟล์เกินขีดจำกัดที่อนุญาต (สูงสุด {max_mb} MB) ไฟล์ของคุณมีขนาด {actual_mb:.1f} MB",
                400,
                "Payload Too Large"
            )

        # ตรวจเนื้อไฟล์จริงว่าตรงกับนามสกุล ไม่ผ่าน = ไม่บันทึกไฟล์
        head = file.read(16)
        file.seek(0)
        if not cls.content_matches_extension(ext, head):
            raise MediaServiceError(
                f"เนื้อไฟล์ไม่ใช่ไฟล์ .{ext} ที่ถูกต้อง (ไฟล์อาจเสียหายหรือถูกเปลี่ยนนามสกุล) กรุณาเลือกไฟล์ใหม่",
                400,
                "Validation Error"
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
        except Exception:
            current_app.logger.exception("Failed to save uploaded file")
            raise MediaServiceError(
                "ระบบบันทึกไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง หากยังไม่ได้ให้แจ้งผู้ดูแลระบบ",
                500,
                "Internal Server Error",
            )

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
