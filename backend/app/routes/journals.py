import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.user import User
from app.models.classroom import Classroom, Episode, Journal
from app.utils.validators import validate_title

# =====================================================================
# journals.py: API จัดการบันทึกการเรียนรู้ส่วนตัว (Learning Journal)
# รองรับ UAT-031, UAT-032, UAT-033
# =====================================================================

journals_bp = Blueprint("journals", __name__, url_prefix="/api/v1/journals")


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


@journals_bp.route("", methods=["GET"])
@jwt_required()
def list_journals():
    """
    แสดงรายการบันทึกการเรียนรู้ทั้งหมดของผู้ใช้ปัจจุบัน (UAT-031, UAT-032)
    - สามารถระบุ Query Parameter: ?classroom_id=... หรือ ?episode_id=... เพื่อกรองตามคอร์สหรือตอนเรียนได้
    - บันทึกเป็นข้อมูลส่วนตัวของผู้เรียนแต่ละคน
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    query = Journal.query.filter_by(user_id=user.user_id)

    classroom_id = request.args.get("classroom_id") or request.args.get("course_id")
    if classroom_id:
        try:
            c_uuid = uuid.UUID(classroom_id)
            query = query.filter_by(classroom_id=c_uuid)
        except (ValueError, TypeError):
            pass

    episode_id = request.args.get("episode_id")
    if episode_id:
        try:
            ep_uuid = uuid.UUID(episode_id)
            query = query.filter_by(episode_id=ep_uuid)
        except (ValueError, TypeError):
            pass

    journals = query.order_by(Journal.created_at.desc()).all()
    return jsonify({
        "journals": [j.to_dict() for j in journals]
    }), 200


@journals_bp.route("", methods=["POST"])
@jwt_required()
def create_journal():
    """
    สร้างบันทึกการเรียนรู้ใหม่ (UAT-031)
    - กำหนด title และ content เป็นฟิลด์บังคับ
    - สามารถเชื่อมโยงกับ classroom_id (คอร์ส) หรือ episode_id (ตอนย่อย) ได้
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Bad Request", "message": "JSON body is required."}), 400

    title = data.get("title")
    is_valid_title, title_err = validate_title(title, field_name="Journal title")
    if not is_valid_title:
        return jsonify({"error": "Validation Error", "message": title_err}), 400

    content = data.get("content")
    if not content or not str(content).strip():
        return jsonify({"error": "Validation Error", "message": "Journal content is required."}), 400

    # จัดการ Foreign Key classroom_id ถ้ามีส่งมา
    c_uuid = None
    classroom_id = data.get("classroom_id") or data.get("course_id")
    if classroom_id:
        try:
            c_uuid = uuid.UUID(classroom_id)
            if not db.session.get(Classroom, c_uuid):
                c_uuid = None
        except (ValueError, TypeError):
            c_uuid = None

    # จัดการ Foreign Key episode_id ถ้ามีส่งมา
    ep_uuid = None
    episode_id = data.get("episode_id")
    if episode_id:
        try:
            ep_uuid = uuid.UUID(episode_id)
            if not db.session.get(Episode, ep_uuid):
                ep_uuid = None
        except (ValueError, TypeError):
            ep_uuid = None

    new_journal = Journal(
        user_id=user.user_id,
        classroom_id=c_uuid,
        episode_id=ep_uuid,
        title=title.strip(),
        content=str(content).strip()
    )

    try:
        db.session.add(new_journal)
        db.session.commit()
        return jsonify({
            "message": "Journal created successfully.",
            "journal": new_journal.to_dict()
        }), 201
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": "Failed to create journal."}), 500


@journals_bp.route("/<journal_id>", methods=["GET"])
@jwt_required()
def get_journal(journal_id):
    """ดึงรายละเอียดบันทึกการเรียนรู้ (ต้องเป็นเจ้าของบันทึก หรือ Admin) (UAT-031, UAT-032)"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    try:
        j_uuid = uuid.UUID(journal_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid journal ID format."}), 400

    journal = db.session.get(Journal, j_uuid)
    if not journal:
        return jsonify({"error": "Not Found", "message": "Journal not found."}), 404

    # ตรวจสอบความเป็นเจ้าของ
    if str(journal.user_id) != str(user.user_id) and not user.has_role("admin"):
        return jsonify({
            "error": "Forbidden",
            "message": "Access denied: this journal belongs to another user."
        }), 403

    return jsonify({
        "journal": journal.to_dict()
    }), 200


@journals_bp.route("/<journal_id>", methods=["PUT"])
@jwt_required()
def update_journal(journal_id):
    """แก้ไขบันทึกการเรียนรู้ (UAT-031)"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    try:
        j_uuid = uuid.UUID(journal_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid journal ID format."}), 400

    journal = db.session.get(Journal, j_uuid)
    if not journal:
        return jsonify({"error": "Not Found", "message": "Journal not found."}), 404

    if str(journal.user_id) != str(user.user_id) and not user.has_role("admin"):
        return jsonify({
            "error": "Forbidden",
            "message": "Access denied: this journal belongs to another user."
        }), 403

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Bad Request", "message": "JSON body is required."}), 400

    if "title" in data:
        is_valid_title, title_err = validate_title(data.get("title"), field_name="Journal title")
        if not is_valid_title:
            return jsonify({"error": "Validation Error", "message": title_err}), 400
        journal.title = data.get("title").strip()

    if "content" in data:
        content = data.get("content")
        if not content or not str(content).strip():
            return jsonify({"error": "Validation Error", "message": "Journal content cannot be empty."}), 400
        journal.content = str(content).strip()

    if "classroom_id" in data or "course_id" in data:
        cid = data.get("classroom_id") or data.get("course_id")
        if cid:
            try:
                journal.classroom_id = uuid.UUID(cid)
            except (ValueError, TypeError):
                pass
        else:
            journal.classroom_id = None

    if "episode_id" in data:
        epid = data.get("episode_id")
        if epid:
            try:
                journal.episode_id = uuid.UUID(epid)
            except (ValueError, TypeError):
                pass
        else:
            journal.episode_id = None

    try:
        db.session.commit()
        return jsonify({
            "message": "Journal updated successfully.",
            "journal": journal.to_dict()
        }), 200
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": "Failed to update journal."}), 500


@journals_bp.route("/<journal_id>", methods=["DELETE"])
@jwt_required()
def delete_journal(journal_id):
    """ลบบันทึกการเรียนรู้ (UAT-031)"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    try:
        j_uuid = uuid.UUID(journal_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid journal ID format."}), 400

    journal = db.session.get(Journal, j_uuid)
    if not journal:
        return jsonify({"error": "Not Found", "message": "Journal not found."}), 404

    if str(journal.user_id) != str(user.user_id) and not user.has_role("admin"):
        return jsonify({
            "error": "Forbidden",
            "message": "Access denied: this journal belongs to another user."
        }), 403

    try:
        db.session.delete(journal)
        db.session.commit()
        return jsonify({
            "message": "Journal deleted successfully."
        }), 200
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": "Failed to delete journal."}), 500
