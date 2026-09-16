import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.user import User
from app.models.classroom import Classroom, Lesson, Episode, Content
from app.utils.decorators import roles_required
from app.utils.validators import (
    validate_title,
    validate_content_type,
    sanitize_content_by_type,
)

# =====================================================================
# lessons.py: API จัดการ Chapter (Lesson), Episode (ตอนย่อย), และ Content (เนื้อหา)
# รองรับโครงสร้าง 4 ระดับ: Course -> Chapter -> Episode -> Content
# รองรับ UAT-028, UAT-029, UAT-034 (Dual-Pointer, Type-Specific Sanitizer)
# =====================================================================

lessons_bp = Blueprint("lessons", __name__, url_prefix="/api/v1")


def get_current_user() -> User | None:
    """ดึงข้อมูลผู้ใช้ปัจจุบันจาก JWT Identity"""
    user_id = get_jwt_identity()
    if not user_id:
        return None
    try:
        user_uuid = uuid.UUID(str(user_id))
        return db.session.get(User, user_uuid)
    except (ValueError, TypeError):
        return None


def can_manage_classroom(classroom: Classroom, user: User) -> bool:
    """ตรวจสอบสิทธิ์: เฉพาะ Admin หรือ Instructor เจ้าของคอร์สเท่านั้น"""
    if user.has_role("admin"):
        return True
    if user.has_role("instructor") and str(classroom.instructor_id) == str(user.user_id):
        return True
    return False


def can_view_classroom_content(classroom: Classroom, user: User | None) -> bool:
    """
    ตรวจสอบสิทธิ์การเข้าดูเนื้อหาภายในคอร์ส (UAT-028, UAT-029)
    - Admin, Instructor เจ้าของคอร์ส, หรือผู้เรียนที่ลงทะเบียน (Enrolled Member)
    - สำหรับ Guest Preview อนุญาตให้ดูโครงร่างได้ แต่เนื้อหาเต็มต้องลงทะเบียน
    """
    if not user:
        return False
    if user.has_role("admin"):
        return True
    if str(classroom.instructor_id) == str(user.user_id):
        return True
    if classroom.has_member(user.user_id):
        return True
    return False


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
        c_uuid = uuid.UUID(classroom_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid classroom ID format."}), 400

    classroom = db.session.get(Classroom, c_uuid)
    if not classroom:
        return jsonify({"error": "Not Found", "message": "Classroom not found."}), 404

    is_member = can_view_classroom_content(classroom, user)

    lessons = Lesson.query.filter_by(classroom_id=c_uuid).order_by(Lesson.sequence_no.asc()).all()
    # include_contents ให้เฉพาะสมาชิกที่ลงทะเบียนหรือผู้ดูแลคอร์ส
    return jsonify({
        "classroom_id": str(classroom.classroom_id),
        "course_id": str(classroom.classroom_id),
        "is_enrolled": is_member,
        "lessons": [l.to_dict(include_contents=is_member, include_episodes=True) for l in lessons],
        "chapters": [l.to_dict(include_contents=is_member, include_episodes=True) for l in lessons]
    }), 200


@lessons_bp.route("/classrooms/<classroom_id>/lessons", methods=["POST"])
@roles_required("instructor", "admin")
def create_lesson(classroom_id):
    """สร้าง Chapter (Lesson) ใหม่ในคอร์สเรียน (UAT-028)"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    try:
        c_uuid = uuid.UUID(classroom_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid classroom ID format."}), 400

    classroom = db.session.get(Classroom, c_uuid)
    if not classroom:
        return jsonify({"error": "Not Found", "message": "Classroom not found."}), 404

    if not can_manage_classroom(classroom, user):
        return jsonify({
            "error": "Forbidden",
            "message": "Access denied: you are not the instructor owner of this classroom."
        }), 403

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Bad Request", "message": "JSON body is required."}), 400

    title = data.get("title")
    is_valid_title, title_err = validate_title(title, field_name="Chapter/Lesson title")
    if not is_valid_title:
        return jsonify({"error": "Validation Error", "message": title_err}), 400

    sequence_no = data.get("sequence_no")
    if sequence_no is None or not isinstance(sequence_no, int) or sequence_no < 1:
        # กำหนด sequence_no อัตโนมัติเป็นลำดับถัดไป
        last_lesson = Lesson.query.filter_by(classroom_id=c_uuid).order_by(Lesson.sequence_no.desc()).first()
        sequence_no = (last_lesson.sequence_no + 1) if last_lesson else 1

    description = data.get("description")
    status = data.get("status", "active")

    new_lesson = Lesson(
        classroom_id=c_uuid,
        title=title.strip(),
        sequence_no=sequence_no,
        description=description.strip() if description else None,
        status=status
    )

    try:
        db.session.add(new_lesson)
        db.session.commit()
        return jsonify({
            "message": "Lesson created successfully.",
            "lesson": new_lesson.to_dict(include_episodes=True),
            "chapter": new_lesson.to_dict(include_episodes=True)
        }), 201
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": "Failed to create lesson."}), 500


@lessons_bp.route("/lessons/<lesson_id>", methods=["GET"])
@jwt_required(optional=True)
def get_lesson(lesson_id):
    """ดึงรายละเอียด Chapter (Lesson) พร้อมรายการตอนย่อย (Episodes) (UAT-028)"""
    user = get_current_user()

    try:
        l_uuid = uuid.UUID(lesson_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid lesson ID format."}), 400

    lesson = db.session.get(Lesson, l_uuid)
    if not lesson:
        return jsonify({"error": "Not Found", "message": "Lesson not found."}), 404

    is_member = can_view_classroom_content(lesson.classroom, user)

    return jsonify({
        "lesson": lesson.to_dict(include_contents=is_member, include_episodes=True),
        "chapter": lesson.to_dict(include_contents=is_member, include_episodes=True),
        "is_enrolled": is_member
    }), 200


@lessons_bp.route("/lessons/<lesson_id>", methods=["PUT"])
@roles_required("instructor", "admin")
def update_lesson(lesson_id):
    """แก้ไขข้อมูล Chapter (Lesson) (UAT-028)"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    try:
        l_uuid = uuid.UUID(lesson_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid lesson ID format."}), 400

    lesson = db.session.get(Lesson, l_uuid)
    if not lesson:
        return jsonify({"error": "Not Found", "message": "Lesson not found."}), 404

    if not can_manage_classroom(lesson.classroom, user):
        return jsonify({
            "error": "Forbidden",
            "message": "Access denied: you are not the instructor owner of this classroom."
        }), 403

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Bad Request", "message": "JSON body is required."}), 400

    if "title" in data:
        is_valid_title, title_err = validate_title(data.get("title"), field_name="Chapter title")
        if not is_valid_title:
            return jsonify({"error": "Validation Error", "message": title_err}), 400
        lesson.title = data.get("title").strip()

    if "sequence_no" in data:
        seq = data.get("sequence_no")
        if seq is None or not isinstance(seq, int) or seq < 1:
            return jsonify({"error": "Validation Error", "message": "sequence_no must be a positive integer."}), 400
        lesson.sequence_no = seq

    if "description" in data:
        lesson.description = data.get("description")

    if "status" in data:
        lesson.status = data.get("status")

    try:
        db.session.commit()
        return jsonify({
            "message": "Lesson updated successfully.",
            "lesson": lesson.to_dict(include_episodes=True),
            "chapter": lesson.to_dict(include_episodes=True)
        }), 200
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": "Failed to update lesson."}), 500


@lessons_bp.route("/lessons/<lesson_id>", methods=["DELETE"])
@roles_required("instructor", "admin")
def delete_lesson(lesson_id):
    """ลบ Chapter (Lesson) (Episodes และ Contents ภายในจะถูกลบตามแบบ CASCADE)"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    try:
        l_uuid = uuid.UUID(lesson_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid lesson ID format."}), 400

    lesson = db.session.get(Lesson, l_uuid)
    if not lesson:
        return jsonify({"error": "Not Found", "message": "Lesson not found."}), 404

    if not can_manage_classroom(lesson.classroom, user):
        return jsonify({
            "error": "Forbidden",
            "message": "Access denied: you are not the instructor owner of this classroom."
        }), 403

    try:
        db.session.delete(lesson)
        db.session.commit()
        return jsonify({
            "message": "Lesson deleted successfully."
        }), 200
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": "Failed to delete lesson."}), 500


# =====================================================================
# 2. Episode Endpoints (ตอนย่อยใน Chapter)
# =====================================================================

@lessons_bp.route("/lessons/<lesson_id>/episodes", methods=["GET"])
@jwt_required(optional=True)
def list_episodes(lesson_id):
    """แสดงรายการ Episodes ทั้งหมดใน Chapter (UAT-028)"""
    user = get_current_user()

    try:
        l_uuid = uuid.UUID(lesson_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid lesson ID format."}), 400

    lesson = db.session.get(Lesson, l_uuid)
    if not lesson:
        return jsonify({"error": "Not Found", "message": "Lesson not found."}), 404

    is_member = can_view_classroom_content(lesson.classroom, user)
    episodes = Episode.query.filter_by(lesson_id=l_uuid).order_by(Episode.sequence_no.asc()).all()

    return jsonify({
        "lesson_id": str(lesson.lesson_id),
        "chapter_id": str(lesson.lesson_id),
        "is_enrolled": is_member,
        "episodes": [e.to_dict(include_contents=is_member) for e in episodes]
    }), 200


@lessons_bp.route("/lessons/<lesson_id>/episodes", methods=["POST"])
@roles_required("instructor", "admin")
def create_episode(lesson_id):
    """
    สร้าง Episode (ตอนย่อย) ใหม่ใน Chapter (UAT-028)
    - ต้องระบุ title, sequence_no (optional), description, duration_seconds
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    try:
        l_uuid = uuid.UUID(lesson_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid lesson ID format."}), 400

    lesson = db.session.get(Lesson, l_uuid)
    if not lesson:
        return jsonify({"error": "Not Found", "message": "Lesson not found."}), 404

    if not can_manage_classroom(lesson.classroom, user):
        return jsonify({
            "error": "Forbidden",
            "message": "Access denied: you are not the instructor owner of this classroom."
        }), 403

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Bad Request", "message": "JSON body is required."}), 400

    title = data.get("title")
    is_valid_title, title_err = validate_title(title, field_name="Episode title")
    if not is_valid_title:
        return jsonify({"error": "Validation Error", "message": title_err}), 400

    sequence_no = data.get("sequence_no")
    if sequence_no is None or not isinstance(sequence_no, int) or sequence_no < 1:
        last_ep = Episode.query.filter_by(lesson_id=l_uuid).order_by(Episode.sequence_no.desc()).first()
        sequence_no = (last_ep.sequence_no + 1) if last_ep else 1

    description = data.get("description")
    duration_seconds = data.get("duration_seconds", 0)
    status = data.get("status", "active")

    new_episode = Episode(
        lesson_id=l_uuid,
        title=title.strip(),
        sequence_no=sequence_no,
        description=description.strip() if description else None,
        duration_seconds=int(duration_seconds) if duration_seconds else 0,
        status=status
    )

    try:
        db.session.add(new_episode)
        db.session.commit()
        return jsonify({
            "message": "Episode created successfully.",
            "episode": new_episode.to_dict(include_contents=True)
        }), 201
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": "Failed to create episode."}), 500


@lessons_bp.route("/episodes/<episode_id>", methods=["GET"])
@jwt_required(optional=True)
def get_episode(episode_id):
    """ดึงรายละเอียด Episode และรายการ Content ทั้งหมด (UAT-028, UAT-029)"""
    user = get_current_user()

    try:
        ep_uuid = uuid.UUID(episode_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid episode ID format."}), 400

    episode = db.session.get(Episode, ep_uuid)
    if not episode:
        return jsonify({"error": "Not Found", "message": "Episode not found."}), 404

    is_member = can_view_classroom_content(episode.lesson.classroom, user)

    return jsonify({
        "episode": episode.to_dict(include_contents=is_member),
        "is_enrolled": is_member
    }), 200


@lessons_bp.route("/episodes/<episode_id>", methods=["PUT"])
@roles_required("instructor", "admin")
def update_episode(episode_id):
    """แก้ไข Episode (UAT-028)"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    try:
        ep_uuid = uuid.UUID(episode_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid episode ID format."}), 400

    episode = db.session.get(Episode, ep_uuid)
    if not episode:
        return jsonify({"error": "Not Found", "message": "Episode not found."}), 404

    if not can_manage_classroom(episode.lesson.classroom, user):
        return jsonify({
            "error": "Forbidden",
            "message": "Access denied: you are not the instructor owner of this classroom."
        }), 403

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Bad Request", "message": "JSON body is required."}), 400

    if "title" in data:
        is_valid_title, title_err = validate_title(data.get("title"), field_name="Episode title")
        if not is_valid_title:
            return jsonify({"error": "Validation Error", "message": title_err}), 400
        episode.title = data.get("title").strip()

    if "sequence_no" in data:
        seq = data.get("sequence_no")
        if seq is None or not isinstance(seq, int) or seq < 1:
            return jsonify({"error": "Validation Error", "message": "sequence_no must be a positive integer."}), 400
        episode.sequence_no = seq

    if "description" in data:
        episode.description = data.get("description")

    if "duration_seconds" in data:
        episode.duration_seconds = int(data.get("duration_seconds", 0))

    if "status" in data:
        episode.status = data.get("status")

    try:
        db.session.commit()
        return jsonify({
            "message": "Episode updated successfully.",
            "episode": episode.to_dict(include_contents=True)
        }), 200
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": "Failed to update episode."}), 500


@lessons_bp.route("/episodes/<episode_id>", methods=["DELETE"])
@roles_required("instructor", "admin")
def delete_episode(episode_id):
    """
    ลบ Episode (UAT-028)
    - Contents ทั้งหมดภายใน Episode จะถูกลบตามแบบ CASCADE ทันที
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    try:
        ep_uuid = uuid.UUID(episode_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid episode ID format."}), 400

    episode = db.session.get(Episode, ep_uuid)
    if not episode:
        return jsonify({"error": "Not Found", "message": "Episode not found."}), 404

    if not can_manage_classroom(episode.lesson.classroom, user):
        return jsonify({
            "error": "Forbidden",
            "message": "Access denied: you are not the instructor owner of this classroom."
        }), 403

    try:
        db.session.delete(episode)
        db.session.commit()
        return jsonify({
            "message": "Episode deleted successfully."
        }), 200
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": "Failed to delete episode."}), 500


# =====================================================================
# 3. Content Endpoints (เนื้อหาบทเรียน: วิดีโอ, ยูทูป, เอกสาร PDF, โค้ด, ข้อความ)
# =====================================================================

@lessons_bp.route("/episodes/<episode_id>/contents", methods=["GET"])
@jwt_required()
def list_episode_contents(episode_id):
    """แสดงรายการ Content ทั้งหมดของ Episode เรียงตาม sequence_no (UAT-029)"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    try:
        ep_uuid = uuid.UUID(episode_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid episode ID format."}), 400

    episode = db.session.get(Episode, ep_uuid)
    if not episode:
        return jsonify({"error": "Not Found", "message": "Episode not found."}), 404

    if not can_view_classroom_content(episode.lesson.classroom, user):
        return jsonify({
            "error": "Forbidden",
            "message": "Access denied: you must be an enrolled member of this classroom."
        }), 403

    contents = Content.query.filter_by(episode_id=ep_uuid).order_by(Content.sequence_no.asc()).all()
    return jsonify({
        "episode_id": str(episode.episode_id),
        "contents": [c.to_dict() for c in contents]
    }), 200


@lessons_bp.route("/episodes/<episode_id>/contents", methods=["POST"])
@roles_required("instructor", "admin")
def add_episode_content(episode_id):
    """
    เพิ่ม Content ใหม่เข้าสู่ Episode (UAT-029, UAT-034)
    - ใช้กลไก Dual-Pointer: กำหนด episode_id และดึง lesson_id จาก Parent มาเซ็ตคู่กันเสมอ
    - ใช้ Type-Specific Sanitizer: โค้ดไม่ตัดแท็ก, ยูทูปแปลงเป็น Safe No-Cookie URL, ข้อความกรองสคริปต์
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    try:
        ep_uuid = uuid.UUID(episode_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid episode ID format."}), 400

    episode = db.session.get(Episode, ep_uuid)
    if not episode:
        return jsonify({"error": "Not Found", "message": "Episode not found."}), 404

    if not can_manage_classroom(episode.lesson.classroom, user):
        return jsonify({
            "error": "Forbidden",
            "message": "Access denied: you are not the instructor owner of this classroom."
        }), 403

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Bad Request", "message": "JSON body is required."}), 400

    content_type = data.get("content_type")
    is_valid_type, type_err = validate_content_type(content_type)
    if not is_valid_type:
        return jsonify({"error": "Validation Error", "message": type_err}), 400

    raw_data = data.get("content_data", "")
    caption = data.get("caption")

    # Type-Specific Sanitization (UAT-034)
    valid_data, sanitized_data, sanitize_err = sanitize_content_by_type(content_type, raw_data)
    if not valid_data:
        return jsonify({"error": "Validation Error", "message": sanitize_err}), 400

    sequence_no = data.get("sequence_no")
    if sequence_no is None or not isinstance(sequence_no, int) or sequence_no < 1:
        last_cnt = Content.query.filter_by(episode_id=ep_uuid).order_by(Content.sequence_no.desc()).first()
        sequence_no = (last_cnt.sequence_no + 1) if last_cnt else 1

    # สร้าง Content ด้วย Dual-Pointer (episode_id + lesson_id)
    new_content = Content(
        episode_id=ep_uuid,
        lesson_id=episode.lesson_id,  # Dual-pointer synchronization
        content_type=content_type.strip().lower(),
        content_data=sanitized_data,
        caption=caption.strip() if caption else None,
        sequence_no=sequence_no
    )

    try:
        db.session.add(new_content)
        db.session.commit()
        return jsonify({
            "message": "Content added successfully.",
            "content": new_content.to_dict()
        }), 201
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": "Failed to add content."}), 500


# =====================================================================
# 4. Legacy Content Endpoints (รองรับ Backward Compatibility เดิม 100%)
# =====================================================================

@lessons_bp.route("/lessons/<lesson_id>/contents", methods=["GET"])
@jwt_required()
def list_contents(lesson_id):
    """List all contents of a lesson (Legacy endpoint สำหรับโค้ดและ Query เดิม)."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    try:
        l_uuid = uuid.UUID(lesson_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid lesson ID format."}), 400

    lesson = db.session.get(Lesson, l_uuid)
    if not lesson:
        return jsonify({"error": "Not Found", "message": "Lesson not found."}), 404

    if not can_view_classroom_content(lesson.classroom, user):
        return jsonify({
            "error": "Forbidden",
            "message": "Access denied: you must be an enrolled member of this classroom."
        }), 403

    contents = Content.query.filter_by(lesson_id=l_uuid).order_by(Content.sequence_no.asc()).all()
    return jsonify({
        "lesson_id": str(lesson.lesson_id),
        "contents": [c.to_dict() for c in contents]
    }), 200


@lessons_bp.route("/lessons/<lesson_id>/contents", methods=["POST"])
@roles_required("instructor", "admin")
def add_content(lesson_id):
    """Add a content item to a lesson (Legacy endpoint พร้อมกลไกสร้าง/ผูก Episode อัตโนมัติ)."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    try:
        l_uuid = uuid.UUID(lesson_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid lesson ID format."}), 400

    lesson = db.session.get(Lesson, l_uuid)
    if not lesson:
        return jsonify({"error": "Not Found", "message": "Lesson not found."}), 404

    if not can_manage_classroom(lesson.classroom, user):
        return jsonify({
            "error": "Forbidden",
            "message": "Access denied: you are not the instructor owner of this classroom."
        }), 403

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Bad Request", "message": "JSON body is required."}), 400

    content_type = data.get("content_type")
    is_valid_type, type_err = validate_content_type(content_type)
    if not is_valid_type:
        return jsonify({"error": "Validation Error", "message": type_err}), 400

    raw_data = data.get("content_data", "")
    caption = data.get("caption")

    valid_data, sanitized_data, sanitize_err = sanitize_content_by_type(content_type, raw_data)
    if not valid_data:
        return jsonify({"error": "Validation Error", "message": sanitize_err}), 400

    # หา Episode แรกของบทเรียน หรือสร้างให้อัตโนมัติถ้ายังไม่มี
    target_episode = Episode.query.filter_by(lesson_id=l_uuid).order_by(Episode.sequence_no.asc()).first()
    if not target_episode:
        target_episode = Episode(
            lesson_id=l_uuid,
            title=f"Episode 1: {lesson.title}",
            sequence_no=1,
            status="active"
        )
        db.session.add(target_episode)
        db.session.flush()

    new_content = Content(
        episode_id=target_episode.episode_id,
        lesson_id=l_uuid,
        content_type=content_type.strip().lower(),
        content_data=sanitized_data,
        caption=caption.strip() if caption else None,
        sequence_no=1
    )

    try:
        db.session.add(new_content)
        db.session.commit()
        return jsonify({
            "message": "Content added successfully.",
            "content": new_content.to_dict()
        }), 201
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": "Failed to add content."}), 500


@lessons_bp.route("/contents/<content_id>", methods=["GET"])
@jwt_required()
def get_content(content_id):
    """ดึงข้อมูล Content ชิ้นใดชิ้นหนึ่ง"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    try:
        cnt_uuid = uuid.UUID(content_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid content ID format."}), 400

    content = db.session.get(Content, cnt_uuid)
    if not content:
        return jsonify({"error": "Not Found", "message": "Content not found."}), 404

    classroom = content.lesson.classroom if content.lesson else (content.episode.lesson.classroom if content.episode else None)
    if classroom and not can_view_classroom_content(classroom, user):
        return jsonify({
            "error": "Forbidden",
            "message": "Access denied: you must be an enrolled member of this classroom."
        }), 403

    return jsonify({
        "content": content.to_dict()
    }), 200


@lessons_bp.route("/contents/<content_id>", methods=["PUT"])
@roles_required("instructor", "admin")
def update_content(content_id):
    """แก้ไขข้อมูล Content พร้อม Type-Specific Sanitizer (UAT-034)"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    try:
        cnt_uuid = uuid.UUID(content_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid content ID format."}), 400

    content = db.session.get(Content, cnt_uuid)
    if not content:
        return jsonify({"error": "Not Found", "message": "Content not found."}), 404

    classroom = content.lesson.classroom if content.lesson else (content.episode.lesson.classroom if content.episode else None)
    if classroom and not can_manage_classroom(classroom, user):
        return jsonify({
            "error": "Forbidden",
            "message": "Access denied: you are not the instructor owner of this classroom."
        }), 403

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Bad Request", "message": "JSON body is required."}), 400

    c_type = data.get("content_type", content.content_type)
    if "content_type" in data:
        is_valid_type, type_err = validate_content_type(c_type)
        if not is_valid_type:
            return jsonify({"error": "Validation Error", "message": type_err}), 400
        content.content_type = c_type.strip().lower()

    if "content_data" in data:
        raw_data = data.get("content_data")
        valid_data, sanitized_data, sanitize_err = sanitize_content_by_type(content.content_type, raw_data)
        if not valid_data:
            return jsonify({"error": "Validation Error", "message": sanitize_err}), 400
        content.content_data = sanitized_data

    if "caption" in data:
        content.caption = data.get("caption")

    if "sequence_no" in data:
        seq = data.get("sequence_no")
        if seq is not None and isinstance(seq, int) and seq >= 1:
            content.sequence_no = seq

    try:
        db.session.commit()
        return jsonify({
            "message": "Content updated successfully.",
            "content": content.to_dict()
        }), 200
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": "Failed to update content."}), 500


@lessons_bp.route("/contents/<content_id>", methods=["DELETE"])
@roles_required("instructor", "admin")
def delete_content(content_id):
    """ลบ Content"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    try:
        cnt_uuid = uuid.UUID(content_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid content ID format."}), 400

    content = db.session.get(Content, cnt_uuid)
    if not content:
        return jsonify({"error": "Not Found", "message": "Content not found."}), 404

    classroom = content.lesson.classroom if content.lesson else (content.episode.lesson.classroom if content.episode else None)
    if classroom and not can_manage_classroom(classroom, user):
        return jsonify({
            "error": "Forbidden",
            "message": "Access denied: you are not the instructor owner of this classroom."
        }), 403

    try:
        db.session.delete(content)
        db.session.commit()
        return jsonify({
            "message": "Content deleted successfully."
        }), 200
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": "Failed to delete content."}), 500
