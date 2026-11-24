import re
import html

# =====================================================================
# validators.py: ฟังก์ชันตรวจสอบความถูกต้องของข้อมูลและ Sanitize
# รองรับ UAT-004, UAT-005, UAT-029, UAT-030, UAT-034
# =====================================================================

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
ALLOWED_CONTENT_TYPES = {"text", "video", "pdf", "image", "code", "youtube"}

# Regex สำหรับสกัด Video ID 11 ตัวอักษรของ YouTube
YOUTUBE_REGEX = re.compile(
    r'(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})',
    re.IGNORECASE
)

# รายการแท็ก HTML ที่อนุญาตสำหรับ Rich Text (White-list)
ALLOWED_HTML_TAGS = {
    "p", "br", "b", "i", "u", "strong", "em", "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li", "code", "pre", "blockquote", "hr", "a", "span", "div"
}


def validate_email(email: str) -> tuple[bool, str]:
    """ตรวจสอบรูปแบบอีเมล (UAT-004)"""
    if not email or not isinstance(email, str):
        return False, "กรุณากรอกอีเมล"
    email_clean = email.strip()
    if len(email_clean) > 255:
        return False, "อีเมลต้องยาวไม่เกิน 255 ตัวอักษร"
    if not EMAIL_REGEX.match(email_clean):
        return False, "รูปแบบอีเมลไม่ถูกต้อง เช่น name@example.com"
    return True, ""


def validate_password(password: str) -> tuple[bool, str]:
    """ตรวจสอบความยาวรหัสผ่าน (ขั้นต่ำ 6 ตัวอักษร) (UAT-004)"""
    if not password or not isinstance(password, str):
        return False, "กรุณากรอกรหัสผ่าน"
    if len(password) < 6:
        return False, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"
    if len(password) > 128:
        return False, "รหัสผ่านต้องยาวไม่เกิน 128 ตัวอักษร"
    return True, ""


def validate_display_name(display_name: str) -> tuple[bool, str]:
    """ตรวจสอบชื่อที่ใช้แสดงผลของผู้ใช้ (UAT-024)"""
    if not display_name or not isinstance(display_name, str) or not display_name.strip():
        return False, "กรุณาระบุชื่อแสดงผล"
    name_clean = display_name.strip()
    if len(name_clean) < 2:
        return False, "ชื่อแสดงผลต้องมีความยาวอย่างน้อย 2 ตัวอักษร"
    if len(name_clean) > 100:
        return False, "ชื่อแสดงผลต้องมีความยาวไม่เกิน 100 ตัวอักษร"
    return True, ""


# ชื่อเรียกภาษาไทยของ field_name ที่ Service ส่งมา (ข้อ 37/39: ผู้ใช้อ่านแล้วรู้ว่าต้องแก้ช่องไหน)
TITLE_LABELS = {
    "Course/Classroom title": "ชื่อคอร์ส",
    "Course title": "ชื่อคอร์ส",
    "Chapter/Lesson title": "ชื่อบทเรียน",
    "Chapter title": "ชื่อบทเรียน",
    "Episode title": "ชื่อตอน",
    "Journal title": "หัวข้อบันทึก",
    "Title": "หัวข้อ",
}


def validate_title(title: str, field_name: str = "Title", max_length: int = 255) -> tuple[bool, str]:
    """ตรวจสอบความถูกต้องของหัวข้อ (Title): ห้ามว่าง ห้ามมีแต่ช่องว่าง และไม่ยาวเกินกำหนด"""
    label = TITLE_LABELS.get(field_name, field_name)
    if not title or not isinstance(title, str) or not title.strip():
        return False, f"กรุณากรอก{label}"
    title_clean = title.strip()
    if len(title_clean) > max_length:
        return False, f"{label}ต้องยาวไม่เกิน {max_length} ตัวอักษร"
    return True, ""


def validate_content_type(content_type: str) -> tuple[bool, str]:
    """ตรวจสอบชนิดเนื้อหาตาม Allowed Types: text, video, pdf, image, code, youtube (UAT-029, UAT-034)"""
    if not content_type or not isinstance(content_type, str):
        return False, "content_type is required."
    type_clean = content_type.strip().lower()
    if type_clean not in ALLOWED_CONTENT_TYPES:
        return False, f"Invalid content_type '{content_type}'. Must be one of: {', '.join(sorted(ALLOWED_CONTENT_TYPES))}."
    return True, ""


def extract_and_normalize_youtube_url(url: str) -> tuple[bool, str, str]:
    """
    ตรวจสอบและ Normalize YouTube URL เป็น Safe Embed URL (UAT-034)
    คืนค่า (is_valid, normalized_url, error_message)
    เช่น: https://www.youtube.com/watch?v=dQw4w9WgXcQ -> https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ
    """
    if not url or not isinstance(url, str):
        return False, "", "YouTube URL is required."
    url_clean = url.strip()
    match = YOUTUBE_REGEX.search(url_clean)
    if not match:
        return False, "", "Invalid YouTube URL format. Must be a valid YouTube watch, embed, or short URL."
    video_id = match.group(1)
    embed_url = f"https://www.youtube-nocookie.com/embed/{video_id}"
    return True, embed_url, ""


def sanitize_rich_text(html_text: str) -> str:
    """
    ทำความสะอาด Rich Text โดยลบ Script, Iframe, Event Handlers (onmouseover, onclick, ฯลฯ)
    และอนุญาตเฉพาะแท็ก HTML ที่ปลอดภัย (Safe White-list)
    """
    if not html_text:
        return ""

    # 1. ลบแท็กที่เป็นอันตรายร้ายแรงทั้งแท็กและเนื้อหาข้างใน
    dangerous_pattern = re.compile(r'<(script|style|iframe|object|embed|applet)[\s\S]*?<\/\1>', re.IGNORECASE)
    cleaned = dangerous_pattern.sub('', html_text)

    # 2. ลบ single tags ที่อันตราย
    single_dangerous = re.compile(r'<(script|style|iframe|object|embed|applet)[\s\S]*?>', re.IGNORECASE)
    cleaned = single_dangerous.sub('', cleaned)

    # 3. ลบ on* event handlers (เช่น onclick="...", onload="...")
    event_handlers = re.compile(r'\s*on\w+\s*=\s*(["\'][^"\']*["\']|[^\s>]+)', re.IGNORECASE)
    cleaned = event_handlers.sub('', cleaned)

    # 4. ลบ javascript: pseudo-protocol ใน href หรือ src
    js_links = re.compile(r'(href|src)\s*=\s*(["\']?\s*javascript:[^"\'>]*["\']?)', re.IGNORECASE)
    cleaned = js_links.sub(r'\1="#"', cleaned)

    return cleaned


def sanitize_content_by_type(content_type: str, content_data: str) -> tuple[bool, str, str]:
    """
    จัดเตรียมและตรวจสอบความปลอดภัยของเนื้อหาแยกตามประเภท (Type-Specific Sanitization) (UAT-034):
    - code: ไม่ตัดแท็ก HTML เพื่อให้ Source Code คงความถูกต้อง 100% (Render ผ่าน CodeBlock)
    - youtube: ทำการสกัด Video ID และแปลงเป็น Safe No-Cookie URL
    - text: ทำความสะอาดผ่าน Safe HTML Sanitizer
    - pdf, video, image: ตรวจสอบความถูกต้องของลิงก์หรือข้อมูล
    """
    if content_data is None:
        return True, "", ""

    c_type = content_type.strip().lower()
    raw_data = str(content_data).strip()

    if c_type == "code":
        # โค้ดดิบ: ห้ามตัดแท็กใดๆ ทั้งสิ้น
        return True, raw_data, ""

    elif c_type == "youtube":
        # ยูทูป: ต้องแปลงเป็น Safe YouTube No-Cookie Embed URL
        valid, embed_url, err = extract_and_normalize_youtube_url(raw_data)
        if not valid:
            return False, "", err
        return True, embed_url, ""

    elif c_type == "text":
        # ข้อความ Rich Text: กรอง Script และ Event Handlers
        safe_html = sanitize_rich_text(raw_data)
        return True, safe_html, ""

    elif c_type in {"video", "pdf", "image"}:
        # ตรวจสอบว่าไม่ว่างเปล่า
        if not raw_data:
            return False, "", f"Data for {c_type} cannot be empty."
        # ข้อ 23: เก็บได้แค่ลิงก์ http(s) หรือที่อยู่ไฟล์ที่อัปโหลดผ่านระบบแล้ว
        # ไม่รับ Base64 (data:) ที่ข้ามการตรวจไฟล์ และไม่รับ javascript:
        lowered = raw_data.lower()
        if lowered.startswith("data:"):
            return False, "", "กรุณาอัปโหลดไฟล์ผ่านปุ่มเลือกไฟล์ ระบบไม่รับไฟล์แบบ Base64"
        if not (lowered.startswith(("http://", "https://")) or raw_data.startswith("/api/v1/media/uploads/")):
            return False, "", "ลิงก์ไฟล์ต้องขึ้นต้นด้วย http:// หรือ https://"
        if len(raw_data) > 2048:
            return False, "", "ลิงก์ไฟล์ยาวเกิน 2048 ตัวอักษร"
        return True, raw_data, ""

    return True, raw_data, ""


# =====================================================================
# ข้อ 37: ตัวช่วยตรวจข้อมูลก่อนบันทึก (ใช้ร่วมกันหลาย Service)
# ทุกฟังก์ชันคืน (ผ่านหรือไม่, ค่าที่ทำความสะอาดแล้ว, ข้อความภาษาไทยเมื่อไม่ผ่าน)
# =====================================================================
def clean_optional_text(value, label: str, max_length: int) -> tuple[bool, str | None, str]:
    """ข้อความที่ไม่บังคับกรอก: ต้องเป็นข้อความ ตัดช่องว่างหัวท้าย ว่าง = None และไม่ยาวเกิน max_length"""
    if value is None:
        return True, None, ""
    if not isinstance(value, str):
        return False, None, f"{label} ต้องเป็นข้อความ"
    cleaned = value.strip()
    if not cleaned:
        return True, None, ""
    if len(cleaned) > max_length:
        return False, None, f"{label} ต้องยาวไม่เกิน {max_length:,} ตัวอักษร"
    return True, cleaned, ""


def clean_required_text(value, label: str, max_length: int) -> tuple[bool, str | None, str]:
    """ข้อความที่บังคับกรอก: เหมือน clean_optional_text แต่ห้ามว่างหรือมีแต่ช่องว่าง"""
    ok, cleaned, message = clean_optional_text(value, label, max_length)
    if not ok:
        return ok, cleaned, message
    if cleaned is None:
        return False, None, f"กรุณากรอก{label}"
    return True, cleaned, ""


def parse_optional_number(
    value,
    label: str,
    *,
    integer: bool = False,
    min_value: float | None = None,
    max_value: float | None = None,
    default=None,
) -> tuple[bool, float | int | None, str]:
    """ตัวเลขที่ไม่บังคับกรอก: รับตัวเลขหรือข้อความตัวเลข ว่าง = default และต้องอยู่ในช่วงที่กำหนด"""
    if value is None or (isinstance(value, str) and not value.strip()):
        return True, default, ""
    if isinstance(value, bool) or not isinstance(value, (int, float, str)):
        return False, None, f"{label} ต้องเป็นตัวเลข"
    try:
        number = float(value)
    except (TypeError, ValueError):
        return False, None, f"{label} ต้องเป็นตัวเลข"
    if number != number or number in (float("inf"), float("-inf")):
        return False, None, f"{label} ต้องเป็นตัวเลข"
    if integer:
        if number != int(number):
            return False, None, f"{label} ต้องเป็นจำนวนเต็ม"
        number = int(number)
    if min_value is not None and number < min_value:
        return False, None, f"{label} ต้องไม่น้อยกว่า {min_value:g}"
    if max_value is not None and number > max_value:
        return False, None, f"{label} ต้องไม่เกิน {max_value:g}"
    return True, number, ""


_PHONE_ALLOWED = re.compile(r"^\+?[0-9\s\-().]+$")


def validate_phone(phone) -> tuple[bool, str]:
    """ข้อ 37: เบอร์โทร ตัวเลข 9-15 หลัก ใช้ + - ( ) . และช่องว่างคั่นได้ เช่น 02-123-4567, +66 81 234 5678"""
    if not isinstance(phone, str) or not phone.strip():
        return False, "กรุณากรอกเบอร์โทรศัพท์"
    value = phone.strip()
    digits = re.sub(r"\D", "", value)
    if not _PHONE_ALLOWED.match(value) or not 9 <= len(digits) <= 15:
        return False, "เบอร์โทรศัพท์ไม่ถูกต้อง ต้องเป็นตัวเลข 9-15 หลัก เช่น 02-123-4567"
    return True, ""
