from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.utils.decorators import roles_required, get_current_user
from app.services.lesson_service import LessonService, LessonServiceError
from app.utils.errors import internal_error

# =====================================================================
# lessons.py: Route Controller สำหรับ Chapter (Lesson), Episode, และ Content
# รองรับโครงสร้าง 4 ระดับ: Course -> Chapter -> Episode -> Content
# รองรับ UAT-028, UAT-029, UAT-034
# สถาปัตยกรรม: Thin Route Controller มอบหมาย Business Logic ให้ LessonService
# =====================================================================

lessons_bp = Blueprint("lessons", __name__, url_prefix="/api/v1")

# รักษา Helper references เพื่อความเข้ากันได้แบบ Backward Compatible
get_classroom_from_lesson = LessonService.get_classroom_from_lesson
can_manage_classroom = LessonService.can_manage_classroom
can_view_classroom_content = LessonService.can_view_classroom_content


# =====================================================================
# 1. Chapter (Lesson) Endpoints
# =====================================================================

@lessons_bp.route("/classrooms/<classroom_id>/lessons", methods=["GET"])
@jwt_required(optional=True)
def list_lessons(classroom_id):
    """
    แสดงรายการบทเรียน (Chapters) ทั้งหมดในคอร์ส เรียงตาม sequence_no
    - ผู้ใช้ทั่วไป / Guest สามารถดูโครงร่างบทเรียนและตอนย่อย (Episodes) ได้ (Preview Mode)
    - สมาชิกที่ลงทะเบียนแล้วจะสามารถเข้าดูรายละเอียดเนื้อหาได้
    """
    user = get_current_user()
    try:
        result = LessonService.list_lessons(classroom_id, user)
        return jsonify(result), 200
    except LessonServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


@lessons_bp.route("/classrooms/<classroom_id>/lessons", methods=["POST"])
@roles_required("instructor", "admin")
def create_lesson(classroom_id):
    """สร้าง Chapter (Lesson) ใหม่ในคอร์สเรียน (UAT-028)"""
    user = get_current_user()
    data = request.get_json()
    try:
        result, status_code = LessonService.create_lesson(classroom_id, user, data)
        return jsonify(result), status_code
    except LessonServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


@lessons_bp.route("/lessons/<lesson_id>", methods=["GET"])
@jwt_required(optional=True)
def get_lesson(lesson_id):
    """ดึงรายละเอียด Chapter (Lesson) พร้อมรายการตอนย่อย (Episodes) (UAT-028)"""
    user = get_current_user()
    try:
        result = LessonService.get_lesson(lesson_id, user)
        return jsonify(result), 200
    except LessonServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


@lessons_bp.route("/lessons/<lesson_id>", methods=["PUT"])
@roles_required("instructor", "admin")
def update_lesson(lesson_id):
    """แก้ไขข้อมูล Chapter (Lesson) (UAT-028)"""
    user = get_current_user()
    data = request.get_json()
    try:
        result = LessonService.update_lesson(lesson_id, user, data)
        return jsonify(result), 200
    except LessonServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


@lessons_bp.route("/lessons/<lesson_id>", methods=["DELETE"])
@roles_required("instructor", "admin")
def delete_lesson(lesson_id):
    """ลบ Chapter (Lesson) (Episodes และ Contents ภายในจะถูกลบตามแบบ CASCADE)"""
    user = get_current_user()
    try:
        result = LessonService.delete_lesson(lesson_id, user)
        return jsonify(result), 200
    except LessonServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


# =====================================================================
# 1.1 ความคืบหน้าการเรียน (ข้อ 24, 25) เฉพาะผู้เรียนที่ลงทะเบียนในคอร์ส
# =====================================================================

def _progress_response(call):
    try:
        return jsonify(call()), 200
    except LessonServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code


@lessons_bp.route("/lessons/<lesson_id>/progress/start", methods=["POST"])
@jwt_required()
def start_lesson(lesson_id):
    """เปิดบทเรียน: สถานะ "ยังไม่เรียน" -> "กำลังเรียน" """
    return _progress_response(lambda: LessonService.start_lesson(lesson_id, get_current_user()))


@lessons_bp.route("/lessons/<lesson_id>/complete", methods=["POST"])
@jwt_required()
def complete_lesson(lesson_id):
    """ปุ่ม "เรียนจบแล้ว" (ต้องดูวิดีโอทุกคลิปในบทถึง 90% ก่อน)"""
    return _progress_response(lambda: LessonService.complete_lesson(lesson_id, get_current_user()))


@lessons_bp.route("/contents/<content_id>/progress", methods=["PUT"])
@jwt_required()
def save_video_progress(content_id):
    """บันทึกตำแหน่งการดูวิดีโอ {position_seconds, duration_seconds}"""
    return _progress_response(
        lambda: LessonService.save_video_progress(content_id, get_current_user(), request.get_json(silent=True))
    )


# =====================================================================
# 2. Episode Endpoints (ตอนย่อยใน Chapter)
# =====================================================================

@lessons_bp.route("/lessons/<lesson_id>/episodes", methods=["GET"])
@jwt_required(optional=True)
def list_episodes(lesson_id):
    """แสดงรายการ Episodes ทั้งหมดใน Chapter (UAT-028)"""
    user = get_current_user()
    try:
        result = LessonService.list_episodes(lesson_id, user)
        return jsonify(result), 200
    except LessonServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


@lessons_bp.route("/lessons/<lesson_id>/episodes", methods=["POST"])
@roles_required("instructor", "admin")
def create_episode(lesson_id):
    """สร้าง Episode (ตอนย่อย) ใหม่ใน Chapter (UAT-028)"""
    user = get_current_user()
    data = request.get_json()
    try:
        result, status_code = LessonService.create_episode(lesson_id, user, data)
        return jsonify(result), status_code
    except LessonServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


@lessons_bp.route("/episodes/<episode_id>", methods=["GET"])
@jwt_required(optional=True)
def get_episode(episode_id):
    """ดึงรายละเอียด Episode และรายการ Content ทั้งหมด (UAT-028, UAT-029)"""
    user = get_current_user()
    try:
        result = LessonService.get_episode(episode_id, user)
        return jsonify(result), 200
    except LessonServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


@lessons_bp.route("/episodes/<episode_id>", methods=["PUT"])
@roles_required("instructor", "admin")
def update_episode(episode_id):
    """แก้ไข Episode (UAT-028)"""
    user = get_current_user()
    data = request.get_json()
    try:
        result = LessonService.update_episode(episode_id, user, data)
        return jsonify(result), 200
    except LessonServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


@lessons_bp.route("/episodes/<episode_id>", methods=["DELETE"])
@roles_required("instructor", "admin")
def delete_episode(episode_id):
    """ลบ Episode (Contents ทั้งหมดภายใน Episode จะถูกลบตามแบบ CASCADE ทันที)"""
    user = get_current_user()
    try:
        result = LessonService.delete_episode(episode_id, user)
        return jsonify(result), 200
    except LessonServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


# =====================================================================
# 3. Episode Content Endpoints (UAT-029, UAT-034)
# =====================================================================

@lessons_bp.route("/episodes/<episode_id>/contents", methods=["GET"])
@roles_required("student", "instructor", "admin")
def list_episode_contents(episode_id):
    """แสดงรายการ Content ทั้งหมดของ Episode เรียงตาม sequence_no (UAT-029)"""
    user = get_current_user()
    try:
        result = LessonService.list_episode_contents(episode_id, user)
        return jsonify(result), 200
    except LessonServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


@lessons_bp.route("/episodes/<episode_id>/contents", methods=["POST"])
@roles_required("instructor", "admin")
def add_episode_content(episode_id):
    """เพิ่ม Content ใหม่เข้าสู่ Episode ด้วย Dual-Pointer sync และ Type-Specific Sanitizer (UAT-029, UAT-034)"""
    user = get_current_user()
    data = request.get_json()
    try:
        result, status_code = LessonService.add_episode_content(episode_id, user, data)
        return jsonify(result), status_code
    except LessonServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


# =====================================================================
# 4. Legacy Lesson Content Endpoints
# =====================================================================

@lessons_bp.route("/lessons/<lesson_id>/contents", methods=["GET"])
@roles_required("student", "instructor", "admin")
def list_contents(lesson_id):
    """List all contents of a lesson (Legacy endpoint สำหรับโค้ดและ Query เดิม)."""
    user = get_current_user()
    try:
        result = LessonService.list_contents(lesson_id, user)
        return jsonify(result), 200
    except LessonServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


@lessons_bp.route("/lessons/<lesson_id>/contents", methods=["POST"])
@roles_required("instructor", "admin")
def add_content(lesson_id):
    """Add a content item to a lesson (Legacy endpoint พร้อมกลไกสร้าง/ผูก Episode อัตโนมัติ)."""
    user = get_current_user()
    data = request.get_json()
    try:
        result, status_code = LessonService.add_content(lesson_id, user, data)
        return jsonify(result), status_code
    except LessonServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


# =====================================================================
# 5. Content Single Item CRUD
# =====================================================================

@lessons_bp.route("/contents/<content_id>", methods=["GET"])
@roles_required("student", "instructor", "admin")
def get_content(content_id):
    """ดึงข้อมูล Content ชิ้นใดชิ้นหนึ่ง"""
    user = get_current_user()
    try:
        result = LessonService.get_content(content_id, user)
        return jsonify(result), 200
    except LessonServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


@lessons_bp.route("/contents/<content_id>", methods=["PUT"])
@roles_required("instructor", "admin")
def update_content(content_id):
    """แก้ไขข้อมูล Content พร้อม Type-Specific Sanitizer (UAT-034)"""
    user = get_current_user()
    data = request.get_json()
    try:
        result = LessonService.update_content(content_id, user, data)
        return jsonify(result), 200
    except LessonServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


@lessons_bp.route("/contents/<content_id>", methods=["DELETE"])
@roles_required("instructor", "admin")
def delete_content(content_id):
    """ลบ Content"""
    user = get_current_user()
    try:
        result = LessonService.delete_content(content_id, user)
        return jsonify(result), 200
    except LessonServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)
