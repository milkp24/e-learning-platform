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
        return False, "Email is required."
    email_clean = email.strip()
    if len(email_clean) > 255:
        return False, "Email must not exceed 255 characters."
    if not EMAIL_REGEX.match(email_clean):
        return False, "Invalid email format."
    return True, ""


def validate_password(password: str) -> tuple[bool, str]:
    """ตรวจสอบความยาวรหัสผ่าน (ขั้นต่ำ 6 ตัวอักษร) (UAT-004)"""
    if not password or not isinstance(password, str):
        return False, "Password is required."
    if len(password) < 6:
        return False, "Password must be at least 6 characters long."
    if len(password) > 128:
        return False, "Password must not exceed 128 characters."
    return True, ""


def validate_display_name(display_name: str) -> tuple[bool, str]:
    """ตรวจสอบชื่อที่ใช้แสดงผลของผู้ใช้"""
    if not display_name or not isinstance(display_name, str):
        return False, "Display name is required."
    name_clean = display_name.strip()
    if len(name_clean) < 2:
        return False, "Display name must be at least 2 characters long."
    if len(name_clean) > 100:
        return False, "Display name must not exceed 100 characters."
    return True, ""


def validate_title(title: str, field_name: str = "Title", max_length: int = 255) -> tuple[bool, str]:
    """ตรวจสอบความถูกต้องของหัวข้อ (Title)"""
    if not title or not isinstance(title, str) or not title.strip():
        return False, f"{field_name} is required."
    title_clean = title.strip()
    if len(title_clean) > max_length:
        return False, f"{field_name} must not exceed {max_length} characters."
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
        return True, raw_data, ""

    return True, raw_data, ""
