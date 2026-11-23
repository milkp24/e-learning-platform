from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.utils.decorators import get_current_user
from app.services.journal_service import JournalService, JournalServiceError

# =====================================================================
# journals.py: API จัดการบันทึกการเรียนรู้ส่วนตัว (Learning Journal)
# รองรับ UAT-031, UAT-032, UAT-033 (Delegated to JournalService)
# =====================================================================

journals_bp = Blueprint("journals", __name__, url_prefix="/api/v1/journals")


@journals_bp.route("", methods=["GET"])
@jwt_required()
def list_journals():
    """
    แสดงรายการบันทึกการเรียนรู้ทั้งหมดของผู้ใช้ปัจจุบัน (UAT-031, UAT-032)
    - สามารถระบุ Query Parameter: ?classroom_id=... หรือ ?episode_id=... เพื่อกรองตามคอร์สหรือตอนเรียนได้
    """
    user = get_current_user()
    classroom_id = request.args.get("classroom_id") or request.args.get("course_id")
    episode_id = request.args.get("episode_id")
    try:
        res = JournalService.list_journals(
            user,
            classroom_id=classroom_id,
            episode_id=episode_id,
            lesson_id=request.args.get("lesson_id"),
            q=request.args.get("q"),
        )
        return jsonify(res), 200
    except JournalServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code


@journals_bp.route("", methods=["POST"])
@jwt_required()
def create_journal():
    """
    สร้างบันทึกการเรียนรู้ใหม่ (UAT-031)
    - กำหนด title และ content เป็นฟิลด์บังคับ
    - สามารถเชื่อมโยงกับ classroom_id (คอร์ส) หรือ episode_id (ตอนย่อย) ได้
    """
    user = get_current_user()
    data = request.get_json(silent=True)
    try:
        res, status_code = JournalService.create_journal(user, data)
        return jsonify(res), status_code
    except JournalServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code


@journals_bp.route("/<journal_id>", methods=["GET"])
@jwt_required()
def get_journal(journal_id):
    """ดึงรายละเอียดบันทึกการเรียนรู้ (ต้องเป็นเจ้าของบันทึก หรือ Admin / Super Admin) (UAT-031, UAT-032)"""
    user = get_current_user()
    try:
        res = JournalService.get_journal(journal_id, user)
        return jsonify(res), 200
    except JournalServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code


@journals_bp.route("/<journal_id>", methods=["PUT"])
@jwt_required()
def update_journal(journal_id):
    """แก้ไขบันทึกการเรียนรู้ (UAT-031)"""
    user = get_current_user()
    data = request.get_json(silent=True)
    try:
        res = JournalService.update_journal(journal_id, user, data)
        return jsonify(res), 200
    except JournalServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code


@journals_bp.route("/<journal_id>", methods=["DELETE"])
@jwt_required()
def delete_journal(journal_id):
    """ลบบันทึกการเรียนรู้ (UAT-031)"""
    user = get_current_user()
    try:
        res = JournalService.delete_journal(journal_id, user)
        return jsonify(res), 200
    except JournalServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code

