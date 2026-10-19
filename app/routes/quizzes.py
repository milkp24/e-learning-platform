import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.utils.decorators import roles_required, get_current_user
from app.services.quiz_service import (
    start_quiz_attempt,
    submit_quiz_attempt,
    get_quiz_result_for_user,
    get_quiz_answer_review,
    get_quiz_details_for_student,
    get_quiz_manage_details_service,
    list_quiz_attempts_service,
    list_quizzes_service,
    list_classroom_quizzes_service,
    create_quiz_service,
    update_quiz_service,
    delete_quiz_service,
    add_question_to_quiz_service,
    update_question_service,
    delete_question_service,
)

# =====================================================================
# quizzes.py: HTTP Presentation Layer สำหรับระบบแบบทดสอบและข้อสอบ (Module 8.2 & 8.4)
# สถาปัตยกรรม RESTful API พร้อม Alias (/quizzes, /quiz, /exams, /exam)
# ตามมาตรฐาน Route -> Service -> Model -> PostgreSQL (Phase 5D)
# =====================================================================

quizzes_bp = Blueprint("quizzes", __name__, url_prefix="/api/v1")


def parse_uuid(id_str: str, entity_name: str = "ID") -> tuple[uuid.UUID | None, tuple | None]:
    """แปลงและตรวจสอบ UUID อย่างปลอดภัย"""
    try:
        return uuid.UUID(str(id_str)), None
    except (ValueError, TypeError):
        return None, (jsonify({"error": "Bad Request", "message": f"Invalid {entity_name} format."}), 400)


# =====================================================================
# 1. Student Examination Endpoints (การทำแบบทดสอบ)
# =====================================================================

@quizzes_bp.route("/quizzes/<quiz_id>", methods=["GET"])
@quizzes_bp.route("/quiz/<quiz_id>", methods=["GET"])
@quizzes_bp.route("/exams/<quiz_id>", methods=["GET"])
@quizzes_bp.route("/exam/<quiz_id>", methods=["GET"])
@jwt_required()
def get_quiz_for_taking(quiz_id):
    """
    ดึงข้อมูลข้อสอบและคำถาม:
    - กรณี student: Sanitized Questions (ซ่อน is_correct และ explanation)
    - กรณี instructor/admin และระบุ ?mode=manage: ส่งคืนคำถามแบบครบถ้วนพร้อมเฉลยและคะแนน
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    q_uuid, err_resp = parse_uuid(quiz_id, "quiz ID")
    if err_resp:
        return err_resp

    mode = request.args.get("mode", "").lower().strip()
    if mode == "manage":
        data, msg, status_code = get_quiz_manage_details_service(q_uuid, user)
        if not data:
            error_type = "Forbidden" if status_code == 403 else ("Not Found" if status_code == 404 else "Error")
            return jsonify({"error": error_type, "message": msg}), status_code
        return jsonify(data), 200

    data, msg, status_code = get_quiz_details_for_student(q_uuid, user.user_id)
    if not data:
        return jsonify({"error": "Error" if status_code >= 500 else "Validation Error", "message": msg}), status_code

    return jsonify(data), status_code


@quizzes_bp.route("/quizzes/<quiz_id>/attempts", methods=["GET"])
@quizzes_bp.route("/quiz/<quiz_id>/attempts", methods=["GET"])
@quizzes_bp.route("/exams/<quiz_id>/attempts", methods=["GET"])
@quizzes_bp.route("/exam/<quiz_id>/attempts", methods=["GET"])
@jwt_required()
def list_quiz_attempts_endpoint(quiz_id):
    """
    ดึงรายการประวัติการทำแบบทดสอบ (Unified Attempt Listing)
    - นักเรียน: เห็นเฉพาะ attempts ของตนเอง
    - ผู้สอน / Admin: เห็น attempts ของทุกคน
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    q_uuid, err_resp = parse_uuid(quiz_id, "quiz ID")
    if err_resp:
        return err_resp

    data, msg, status_code = list_quiz_attempts_service(q_uuid, user)
    if data is None:
        return jsonify({"error": "Not Found" if status_code == 404 else "Error", "message": msg}), status_code

    return jsonify({"attempts": data}), 200


@quizzes_bp.route("/quizzes/<quiz_id>/attempts", methods=["POST"])
@quizzes_bp.route("/quiz/<quiz_id>/start", methods=["POST"])
@quizzes_bp.route("/exams/<quiz_id>/attempts", methods=["POST"])
@quizzes_bp.route("/exam/<quiz_id>/start", methods=["POST"])
@jwt_required()
def start_attempt_endpoint(quiz_id):
    """
    เริ่มทำแบบทดสอบ (สร้าง QuizAttempt สถานะ in_progress หรือ resume attempt เดิม)
    ตรวจสอบสิทธิ์การเข้าถึง และโควตา max_attempts
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    q_uuid, err_resp = parse_uuid(quiz_id, "quiz ID")
    if err_resp:
        return err_resp

    data, msg, status_code = start_quiz_attempt(q_uuid, user.user_id)
    if not data:
        return jsonify({"error": "Error" if status_code >= 500 else "Validation Error", "message": msg}), status_code

    return jsonify({"message": msg, "attempt": data}), status_code


@quizzes_bp.route("/quizzes/<quiz_id>/submit", methods=["POST"])
@quizzes_bp.route("/quiz/<quiz_id>/submit", methods=["POST"])
@quizzes_bp.route("/exams/<quiz_id>/submit", methods=["POST"])
@quizzes_bp.route("/exam/<quiz_id>/submit", methods=["POST"])
@jwt_required()
def submit_quiz_endpoint(quiz_id):
    """
    ส่งคำตอบแบบทดสอบและประมวลผลคะแนนอัตโนมัติ (Phase 2 - Phase 7, Phase 9)
    - ตรวจคำตอบ (Multiple Choice, Matching, Ordering, Scenario, Simulation, Architecture)
    - คำนวณคะแนน เปอร์เซ็นต์ เกณฑ์ผ่าน
    - คืนผลลัพธ์พร้อมเฉลย คำอธิบาย และจำนวนครั้งที่เหลือ
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    q_uuid, err_resp = parse_uuid(quiz_id, "quiz ID")
    if err_resp:
        return err_resp

    payload = request.get_json(silent=True)
    if payload is None:
        payload = {}

    data, msg, status_code = submit_quiz_attempt(q_uuid, user.user_id, payload)
    if not data:
        error_type = "Conflict" if status_code == 409 else ("Validation Error" if status_code == 400 else "Error")
        return jsonify({"error": error_type, "message": msg}), status_code

    return jsonify(data), status_code


@quizzes_bp.route("/quizzes/<quiz_id>/result", methods=["GET"])
@quizzes_bp.route("/quiz/<quiz_id>/result", methods=["GET"])
@quizzes_bp.route("/exams/<quiz_id>/result", methods=["GET"])
@quizzes_bp.route("/exam/<quiz_id>/result", methods=["GET"])
@jwt_required()
def get_latest_quiz_result_endpoint(quiz_id):
    """
    ดึงผลคะแนนการทำแบบทดสอบ (รองรับ Query Param `?attempt_id=<uuid>` หรือดึงผลล่าสุด)
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    q_uuid, err_resp = parse_uuid(quiz_id, "quiz ID")
    if err_resp:
        return err_resp

    raw_att_id = request.args.get("attempt_id")
    att_uuid = None
    if raw_att_id:
        att_uuid, err_resp = parse_uuid(raw_att_id, "attempt ID")
        if err_resp:
            return err_resp

    data, msg, status_code = get_quiz_result_for_user(q_uuid, user.user_id, att_uuid)
    if not data:
        return jsonify({"error": "Not Found" if status_code == 404 else "Error", "message": msg}), status_code

    return jsonify(data), status_code


@quizzes_bp.route("/quizzes/<quiz_id>/attempts/<attempt_id>", methods=["GET"])
@quizzes_bp.route("/quiz/<quiz_id>/attempt/<attempt_id>", methods=["GET"])
@quizzes_bp.route("/exams/<quiz_id>/attempts/<attempt_id>", methods=["GET"])
@quizzes_bp.route("/exam/<quiz_id>/attempt/<attempt_id>", methods=["GET"])
@jwt_required()
def get_attempt_result_endpoint(quiz_id, attempt_id):
    """
    ดึงผลคะแนนของ Attempt ที่ระบุทาง Path (ตรวจสอบ Ownership ป้องกัน IDOR)
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    q_uuid, err_resp = parse_uuid(quiz_id, "quiz ID")
    if err_resp:
        return err_resp

    att_uuid, err_resp = parse_uuid(attempt_id, "attempt ID")
    if err_resp:
        return err_resp

    data, msg, status_code = get_quiz_result_for_user(q_uuid, user.user_id, att_uuid)
    if not data:
        return jsonify({"error": "Forbidden" if status_code == 403 else ("Not Found" if status_code == 404 else "Error"), "message": msg}), status_code

    return jsonify(data), status_code


@quizzes_bp.route("/quizzes/<quiz_id>/attempts/<attempt_id>/review", methods=["GET"])
@quizzes_bp.route("/quiz/<quiz_id>/attempt/<attempt_id>/review", methods=["GET"])
@quizzes_bp.route("/exams/<quiz_id>/attempts/<attempt_id>/review", methods=["GET"])
@quizzes_bp.route("/exam/<quiz_id>/attempt/<attempt_id>/review", methods=["GET"])
@jwt_required()
def get_attempt_answer_review_endpoint(quiz_id, attempt_id):
    """
    [Primary REST Endpoint] ดึงข้อมูลเฉลยคำตอบพร้อมคำอธิบายสำหรับ Attempt ที่ระบุ
    - ต้องส่งข้อสอบเสร็จสิ้นแล้วเท่านั้นถึงจะดูเฉลยได้
    - ตรวจสอบสิทธิ์ Ownership ป้องกัน IDOR
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    q_uuid, err_resp = parse_uuid(quiz_id, "quiz ID")
    if err_resp:
        return err_resp

    att_uuid, err_resp = parse_uuid(attempt_id, "attempt ID")
    if err_resp:
        return err_resp

    data, msg, status_code = get_quiz_answer_review(q_uuid, user.user_id, att_uuid)
    if not data:
        error_type = "Forbidden" if status_code == 403 else ("Not Found" if status_code == 404 else "Validation Error")
        return jsonify({"error": error_type, "message": msg}), status_code

    return jsonify(data), status_code


@quizzes_bp.route("/quizzes/<quiz_id>/answer-review", methods=["GET"])
@quizzes_bp.route("/quiz/<quiz_id>/answer-review", methods=["GET"])
@quizzes_bp.route("/exams/<quiz_id>/answer-review", methods=["GET"])
@quizzes_bp.route("/exam/<quiz_id>/answer-review", methods=["GET"])
@jwt_required()
def get_answer_review_convenience_endpoint(quiz_id):
    """
    [Convenience Endpoint] ดึงเฉลยคำตอบ
    - รองรับ ?attempt_id=<uuid>
    - หากไม่ระบุ attempt_id จะดึงเฉลยของ latest completed attempt ของผู้เรียนคนนั้น
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    q_uuid, err_resp = parse_uuid(quiz_id, "quiz ID")
    if err_resp:
        return err_resp

    raw_att_id = request.args.get("attempt_id")
    att_uuid = None
    if raw_att_id:
        att_uuid, err_resp = parse_uuid(raw_att_id, "attempt ID")
        if err_resp:
            return err_resp

    data, msg, status_code = get_quiz_answer_review(q_uuid, user.user_id, att_uuid)
    if not data:
        error_type = "Forbidden" if status_code == 403 else ("Not Found" if status_code == 404 else "Validation Error")
        return jsonify({"error": error_type, "message": msg}), status_code

    return jsonify(data), status_code


# =====================================================================
# 2. Instructor / Admin Management Endpoints (การจัดการแบบทดสอบ)
# =====================================================================

@quizzes_bp.route("/quizzes", methods=["GET"])
@quizzes_bp.route("/exams", methods=["GET"])
@jwt_required()
def list_quizzes():
    """
    แสดงรายการแบบทดสอบทั้งหมด
    - สามารถกรองตาม course_id หรือ classroom_id ได้
    - Instructor เห็นเฉพาะคอร์สของตนเอง (Admin เห็นทั้งหมด)
    - Student เห็นคอร์สที่ตนลงทะเบียน
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    course_id_raw = request.args.get("course_id") or request.args.get("classroom_id")
    c_uuid = None
    if course_id_raw:
        c_uuid, err_resp = parse_uuid(course_id_raw, "course ID")
        if err_resp:
            return err_resp

    results = list_quizzes_service(user, c_uuid)
    return jsonify({"quizzes": results, "exams": results}), 200


@quizzes_bp.route("/classrooms/<classroom_id>/quizzes", methods=["GET"])
@jwt_required()
def list_classroom_quizzes(classroom_id):
    """แสดงรายการแบบทดสอบทั้งหมดในคอร์สเรียนที่ระบุ"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    c_uuid, err_resp = parse_uuid(classroom_id, "classroom/course ID")
    if err_resp:
        return err_resp

    data, msg, status_code = list_classroom_quizzes_service(c_uuid, user)
    if not data:
        return jsonify({"error": "Not Found" if status_code == 404 else "Error", "message": msg}), status_code

    return jsonify(data), 200


@quizzes_bp.route("/quizzes", methods=["POST"])
@quizzes_bp.route("/exams", methods=["POST"])
@quizzes_bp.route("/classrooms/<classroom_id>/quizzes", methods=["POST"])
@roles_required("instructor", "admin", "super_admin")
def create_quiz(classroom_id=None):
    """
    สร้างแบบทดสอบใหม่
    - กำหนด title, description, time_limit_minutes, passing_score, max_attempts
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    data = request.get_json(silent=True) or {}
    c_raw = classroom_id or data.get("course_id") or data.get("classroom_id")
    if not c_raw:
        return jsonify({"error": "Validation Error", "message": "course_id is required."}), 400

    c_uuid, err_resp = parse_uuid(c_raw, "classroom/course ID")
    if err_resp:
        return err_resp

    lesson_id_raw = data.get("lesson_id")
    lesson_uuid = None
    if lesson_id_raw:
        try:
            lesson_uuid = uuid.UUID(str(lesson_id_raw))
        except (ValueError, TypeError):
            return jsonify({"error": "Validation Error", "message": "Invalid lesson_id format."}), 400

    quiz_dict, msg, status_code = create_quiz_service(c_uuid, user, data, lesson_uuid)
    if not quiz_dict:
        error_type = "Forbidden" if status_code == 403 else ("Not Found" if status_code == 404 else ("Validation Error" if status_code == 400 else "Internal Server Error"))
        return jsonify({"error": error_type, "message": msg}), status_code

    return jsonify({
        "message": msg,
        "quiz": quiz_dict,
        "exam": quiz_dict,
    }), 201


@quizzes_bp.route("/quizzes/<quiz_id>", methods=["PUT"])
@quizzes_bp.route("/exams/<quiz_id>", methods=["PUT"])
@quizzes_bp.route("/quiz/<quiz_id>", methods=["PUT"])
@roles_required("instructor", "admin", "super_admin")
def update_quiz_endpoint(quiz_id):
    """แก้ไขข้อมูลแบบทดสอบ เกณฑ์คะแนนผ่าน และจำนวนครั้งที่ทำได้"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    q_uuid, err_resp = parse_uuid(quiz_id, "quiz ID")
    if err_resp:
        return err_resp

    data = request.get_json(silent=True) or {}
    quiz_dict, msg, status_code = update_quiz_service(q_uuid, user, data)
    if not quiz_dict:
        error_type = "Forbidden" if status_code == 403 else ("Not Found" if status_code == 404 else ("Validation Error" if status_code == 400 else "Internal Server Error"))
        return jsonify({"error": error_type, "message": msg}), status_code

    return jsonify({
        "message": msg,
        "quiz": quiz_dict,
        "exam": quiz_dict,
    }), 200


@quizzes_bp.route("/quizzes/<quiz_id>", methods=["DELETE"])
@quizzes_bp.route("/exams/<quiz_id>", methods=["DELETE"])
@quizzes_bp.route("/quiz/<quiz_id>", methods=["DELETE"])
@roles_required("instructor", "admin", "super_admin")
def delete_quiz_endpoint(quiz_id):
    """ลบแบบทดสอบ"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    q_uuid, err_resp = parse_uuid(quiz_id, "quiz ID")
    if err_resp:
        return err_resp

    success, msg, status_code = delete_quiz_service(q_uuid, user)
    if not success:
        error_type = "Forbidden" if status_code == 403 else ("Not Found" if status_code == 404 else "Internal Server Error")
        return jsonify({"error": error_type, "message": msg}), status_code

    return jsonify({"message": msg}), 200


@quizzes_bp.route("/quizzes/<quiz_id>/questions", methods=["POST"])
@quizzes_bp.route("/exams/<quiz_id>/questions", methods=["POST"])
@roles_required("instructor", "admin", "super_admin")
def add_question_to_quiz(quiz_id):
    """
    เพิ่มคำถามและตัวเลือกเข้าสู่ Quiz (Module 8.2)
    รองรับ question_type: 'multiple_choice', 'matching', 'ordering' และ points
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    q_uuid, err_resp = parse_uuid(quiz_id, "quiz ID")
    if err_resp:
        return err_resp

    data = request.get_json(silent=True) or {}
    res_data, msg, status_code = add_question_to_quiz_service(q_uuid, user, data)
    if not res_data:
        error_type = "Forbidden" if status_code == 403 else ("Not Found" if status_code == 404 else ("Validation Error" if status_code == 400 else "Internal Server Error"))
        return jsonify({"error": error_type, "message": msg}), status_code

    return jsonify({
        "message": msg,
        "question": res_data["question"],
        "order_no": res_data["order_no"],
    }), 201


@quizzes_bp.route("/quizzes/<quiz_id>/questions/<question_id>", methods=["PUT"])
@quizzes_bp.route("/exams/<quiz_id>/questions/<question_id>", methods=["PUT"])
@roles_required("instructor", "admin", "super_admin")
def update_question_endpoint(quiz_id, question_id):
    """แก้ไขคำถาม ตัวเลือก เฉลย และคะแนนของข้อคำถาม"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    q_uuid, err_resp = parse_uuid(quiz_id, "quiz ID")
    if err_resp:
        return err_resp

    quest_uuid, err_resp = parse_uuid(question_id, "question ID")
    if err_resp:
        return err_resp

    data = request.get_json(silent=True) or {}
    question_dict, msg, status_code = update_question_service(q_uuid, quest_uuid, user, data)
    if not question_dict:
        error_type = "Forbidden" if status_code == 403 else ("Not Found" if status_code == 404 else ("Validation Error" if status_code == 400 else "Internal Server Error"))
        return jsonify({"error": error_type, "message": msg}), status_code

    return jsonify({
        "message": msg,
        "question": question_dict,
    }), 200


@quizzes_bp.route("/quizzes/<quiz_id>/questions/<question_id>", methods=["DELETE"])
@quizzes_bp.route("/exams/<quiz_id>/questions/<question_id>", methods=["DELETE"])
@roles_required("instructor", "admin", "super_admin")
def delete_question_endpoint(quiz_id, question_id):
    """ลบข้อคำถามออกจากแบบทดสอบ"""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    q_uuid, err_resp = parse_uuid(quiz_id, "quiz ID")
    if err_resp:
        return err_resp

    quest_uuid, err_resp = parse_uuid(question_id, "question ID")
    if err_resp:
        return err_resp

    success, msg, status_code = delete_question_service(q_uuid, quest_uuid, user)
    if not success:
        error_type = "Forbidden" if status_code == 403 else ("Not Found" if status_code == 404 else "Internal Server Error")
        return jsonify({"error": error_type, "message": msg}), status_code

    return jsonify({"message": msg}), 200
