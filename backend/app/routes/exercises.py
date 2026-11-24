import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.user import User
from app.utils.decorators import roles_required, get_current_user
from app.services.exercise_service import ExerciseService, ExerciseServiceError
from app.utils.errors import internal_error

# =====================================================================
# exercises.py: REST API สำหรับระบบ Interactive Exercise (Module 8.1)
# รองรับ UAT-EX-001 ถึง UAT-EX-027
# แยกขาดจาก Quiz Engine อย่างชัดเจน
# =====================================================================

exercises_bp = Blueprint("exercises", __name__, url_prefix="/api/v1")


# =====================================================================
# 1. Exercise CRUD Endpoints
# =====================================================================

@exercises_bp.route("/exercises", methods=["GET"])
@jwt_required(optional=True)
def list_exercises():
    """
    ดึงรายการแบบฝึกหัด (กรองตาม lesson_id หรือ classroom_id ได้)
    - นักเรียนจะเห็นเฉพาะสถานะ published
    - ผู้สอน/แอดมินเห็นทั้งหมด
    """
    user = get_current_user()
    lesson_id = request.args.get("lesson_id")
    classroom_id = request.args.get("classroom_id")

    exercises = ExerciseService.list_exercises(
        lesson_id=lesson_id,
        classroom_id=classroom_id,
        user=user
    )
    return jsonify({
        "total": len(exercises),
        "exercises": exercises
    }), 200


@exercises_bp.route("/exercises", methods=["POST"])
@roles_required("instructor", "admin", "super_admin")
def create_exercise():
    """
    สร้างแบบฝึกหัดใหม่ (UAT-EX-001, UAT-EX-004, UAT-EX-005, UAT-EX-006, UAT-EX-007)
    - กำหนด title, instructions, total_score, xp_reward, time_limit, max_attempts
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "ไม่พบข้อมูลผู้ใช้"}), 401

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Bad Request", "message": "กรุณาระบุข้อมูล JSON body"}), 400

    try:
        new_exercise = ExerciseService.create_exercise(data, user)
        return jsonify({
            "message": "สร้างแบบฝึกหัดเรียบร้อยแล้ว",
            "exercise": new_exercise
        }), 201
    except ExerciseServiceError as e:
        return jsonify({"error": "Validation Error", "message": e.message}), e.status_code
    except Exception as e:
        db.session.rollback()
        return internal_error(e)


@exercises_bp.route("/exercises/<exercise_id>", methods=["GET"])
@jwt_required(optional=True)
def get_exercise(exercise_id):
    """
    ดึงรายละเอียดแบบฝึกหัด
    - สำหรับนักเรียน จะซ่อนเฉลย (correct_answer, correct_code)
    - แสดงข้อมูล attempts_count, remaining_attempts, can_attempt
    """
    user = get_current_user()
    mode = request.args.get("mode")
    sanitize = (mode != "manage")

    try:
        exercise_data = ExerciseService.get_exercise_by_id(
            exercise_id=exercise_id,
            user=user,
            sanitize_for_student=sanitize
        )
        return jsonify({
            "exercise": exercise_data
        }), 200
    except ExerciseServiceError as e:
        return jsonify({"error": "Error", "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


@exercises_bp.route("/exercises/<exercise_id>", methods=["PUT"])
@roles_required("instructor", "admin", "super_admin")
def update_exercise(exercise_id):
    """
    แก้ไขข้อมูลแบบฝึกหัด (UAT-EX-002, UAT-EX-004, UAT-EX-005, UAT-EX-006, UAT-EX-007)
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "ไม่พบข้อมูลผู้ใช้"}), 401

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Bad Request", "message": "กรุณาระบุข้อมูล JSON body"}), 400

    try:
        updated = ExerciseService.update_exercise(exercise_id, data, user)
        return jsonify({
            "message": "บันทึกการแก้ไขแบบฝึกหัดเรียบร้อยแล้ว",
            "exercise": updated
        }), 200
    except ExerciseServiceError as e:
        return jsonify({"error": "Validation Error", "message": e.message}), e.status_code
    except Exception as e:
        db.session.rollback()
        return internal_error(e)


@exercises_bp.route("/exercises/<exercise_id>", methods=["DELETE"])
@roles_required("instructor", "admin", "super_admin")
def delete_exercise(exercise_id):
    """
    ลบแบบฝึกหัด (UAT-EX-003)
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "ไม่พบข้อมูลผู้ใช้"}), 401

    try:
        ExerciseService.delete_exercise(exercise_id, user)
        return jsonify({
            "message": "ลบแบบฝึกหัดเรียบร้อยแล้ว"
        }), 200
    except ExerciseServiceError as e:
        return jsonify({"error": "Error", "message": e.message}), e.status_code
    except Exception as e:
        db.session.rollback()
        return internal_error(e)


# =====================================================================
# 2. Content Sub-resource Endpoints
# =====================================================================

@exercises_bp.route("/exercises/<exercise_id>/contents", methods=["POST"])
@roles_required("instructor", "admin", "super_admin")
def add_exercise_content(exercise_id):
    """
    เพิ่มเนื้อหาในแบบฝึกหัด (Text, Image, Video, Code Example) (UAT-EX-008 ถึง UAT-EX-011)
    """
    user = get_current_user()
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Bad Request", "message": "กรุณาระบุข้อมูลเนื้อหา"}), 400

    try:
        content = ExerciseService.add_content(exercise_id, data, user)
        return jsonify({
            "message": "เพิ่มเนื้อหาเรียบร้อยแล้ว",
            "content": content
        }), 201
    except ExerciseServiceError as e:
        return jsonify({"error": "Validation Error", "message": e.message}), e.status_code
    except Exception as e:
        db.session.rollback()
        return internal_error(e)


@exercises_bp.route("/exercises/<exercise_id>/contents/<content_id>", methods=["PUT"])
@roles_required("instructor", "admin", "super_admin")
def update_exercise_content(exercise_id, content_id):
    """แก้ไขเนื้อหาในแบบฝึกหัด"""
    user = get_current_user()
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Bad Request", "message": "กรุณาระบุข้อมูลเนื้อหา"}), 400

    try:
        updated = ExerciseService.update_content(exercise_id, content_id, data, user)
        return jsonify({
            "message": "แก้ไขเนื้อหาเรียบร้อยแล้ว",
            "content": updated
        }), 200
    except ExerciseServiceError as e:
        return jsonify({"error": "Validation Error", "message": e.message}), e.status_code
    except Exception as e:
        db.session.rollback()
        return internal_error(e)


@exercises_bp.route("/exercises/<exercise_id>/contents/<content_id>", methods=["DELETE"])
@roles_required("instructor", "admin", "super_admin")
def delete_exercise_content(exercise_id, content_id):
    """ลบเนื้อหาออกจากแบบฝึกหัด"""
    user = get_current_user()
    try:
        ExerciseService.delete_content(exercise_id, content_id, user)
        return jsonify({
            "message": "ลบเนื้อหาเรียบร้อยแล้ว"
        }), 200
    except ExerciseServiceError as e:
        return jsonify({"error": "Error", "message": e.message}), e.status_code
    except Exception as e:
        db.session.rollback()
        return internal_error(e)


# =====================================================================
# 3. Activity Sub-resource Endpoints
# =====================================================================

@exercises_bp.route("/exercises/<exercise_id>/activities", methods=["POST"])
@roles_required("instructor", "admin", "super_admin")
def add_exercise_activity(exercise_id):
    """
    เพิ่มกิจกรรมในแบบฝึกหัด (Fill in Code, Debug Code, Mission) (UAT-EX-012 ถึง UAT-EX-014)
    """
    user = get_current_user()
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Bad Request", "message": "กรุณาระบุข้อมูลกิจกรรม"}), 400

    try:
        activity = ExerciseService.add_activity(exercise_id, data, user)
        return jsonify({
            "message": "เพิ่มกิจกรรมเรียบร้อยแล้ว",
            "activity": activity
        }), 201
    except ExerciseServiceError as e:
        return jsonify({"error": "Validation Error", "message": e.message}), e.status_code
    except Exception as e:
        db.session.rollback()
        return internal_error(e)


@exercises_bp.route("/exercises/<exercise_id>/activities/<activity_id>", methods=["PUT"])
@roles_required("instructor", "admin", "super_admin")
def update_exercise_activity(exercise_id, activity_id):
    """แก้ไขกิจกรรมในแบบฝึกหัด"""
    user = get_current_user()
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Bad Request", "message": "กรุณาระบุข้อมูลกิจกรรม"}), 400

    try:
        updated = ExerciseService.update_activity(exercise_id, activity_id, data, user)
        return jsonify({
            "message": "แก้ไขกิจกรรมเรียบร้อยแล้ว",
            "activity": updated
        }), 200
    except ExerciseServiceError as e:
        return jsonify({"error": "Validation Error", "message": e.message}), e.status_code
    except Exception as e:
        db.session.rollback()
        return internal_error(e)


@exercises_bp.route("/exercises/<exercise_id>/activities/<activity_id>", methods=["DELETE"])
@roles_required("instructor", "admin", "super_admin")
def delete_exercise_activity(exercise_id, activity_id):
    """ลบกิจกรรมออกจากแบบฝึกหัด"""
    user = get_current_user()
    try:
        ExerciseService.delete_activity(exercise_id, activity_id, user)
        return jsonify({
            "message": "ลบกิจกรรมเรียบร้อยแล้ว"
        }), 200
    except ExerciseServiceError as e:
        return jsonify({"error": "Error", "message": e.message}), e.status_code
    except Exception as e:
        db.session.rollback()
        return internal_error(e)


# =====================================================================
# 4. Checklist Sub-resource Endpoints
# =====================================================================

@exercises_bp.route("/exercises/<exercise_id>/checklists", methods=["POST"])
@roles_required("instructor", "admin", "super_admin")
def add_exercise_checklist(exercise_id):
    """
    เพิ่มรายการ Checklist (UAT-EX-015)
    """
    user = get_current_user()
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Bad Request", "message": "กรุณาระบุข้อมูล Checklist"}), 400

    try:
        checklist = ExerciseService.add_checklist(exercise_id, data, user)
        return jsonify({
            "message": "เพิ่มรายการ Checklist เรียบร้อยแล้ว",
            "checklist": checklist
        }), 201
    except ExerciseServiceError as e:
        return jsonify({"error": "Validation Error", "message": e.message}), e.status_code
    except Exception as e:
        db.session.rollback()
        return internal_error(e)


@exercises_bp.route("/exercises/<exercise_id>/checklists/<checklist_id>", methods=["PUT"])
@roles_required("instructor", "admin", "super_admin")
def update_exercise_checklist(exercise_id, checklist_id):
    """แก้ไขรายการ Checklist"""
    user = get_current_user()
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Bad Request", "message": "กรุณาระบุข้อมูล Checklist"}), 400

    try:
        updated = ExerciseService.update_checklist(exercise_id, checklist_id, data, user)
        return jsonify({
            "message": "แก้ไขรายการ Checklist เรียบร้อยแล้ว",
            "checklist": updated
        }), 200
    except ExerciseServiceError as e:
        return jsonify({"error": "Validation Error", "message": e.message}), e.status_code
    except Exception as e:
        db.session.rollback()
        return internal_error(e)


@exercises_bp.route("/exercises/<exercise_id>/checklists/<checklist_id>", methods=["DELETE"])
@roles_required("instructor", "admin", "super_admin")
def delete_exercise_checklist(exercise_id, checklist_id):
    """ลบรายการ Checklist"""
    user = get_current_user()
    try:
        ExerciseService.delete_checklist(exercise_id, checklist_id, user)
        return jsonify({
            "message": "ลบรายการ Checklist เรียบร้อยแล้ว"
        }), 200
    except ExerciseServiceError as e:
        return jsonify({"error": "Error", "message": e.message}), e.status_code
    except Exception as e:
        db.session.rollback()
        return internal_error(e)


# =====================================================================
# 5. Student Attempt & Evaluation Endpoints
# =====================================================================

@exercises_bp.route("/exercises/<exercise_id>/start", methods=["POST"])
@jwt_required()
def start_exercise_attempt(exercise_id):
    """
    เริ่มทำแบบฝึกหัด (UAT-EX-016, UAT-EX-017, UAT-EX-021)
    - ตรวจสอบสิทธิ์การเข้าถึงและการลงทะเบียน (UAT-EX-025, UAT-EX-027)
    - ตรวจสอบโควตาจำนวนครั้ง (max_attempts)
    - สร้าง ExerciseAttempt เริ่มจับเวลา (started_at)
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "กรุณาเข้าสู่ระบบก่อนทำแบบฝึกหัด"}), 401

    try:
        attempt = ExerciseService.start_attempt(exercise_id, user)
        return jsonify({
            "message": "เริ่มทำแบบฝึกหัดแล้ว",
            "attempt": attempt
        }), 201
    except ExerciseServiceError as e:
        return jsonify({"error": "Access Denied" if e.status_code == 403 else "Error", "message": e.message}), e.status_code
    except Exception as e:
        db.session.rollback()
        return internal_error(e)


@exercises_bp.route("/exercises/<exercise_id>/submit", methods=["POST"])
@jwt_required()
def submit_exercise_attempt(exercise_id):
    """
    ส่งคำตอบและตรวจประเมินผล (UAT-EX-018 ถึง UAT-EX-020, UAT-EX-022, UAT-EX-023)
    - ตรวจคำตอบ Activities (Fill Code, Debug Code, Mission)
    - ตรวจ Checklist Items
    - ตรวจสอบเวลาที่ใช้บน Server-side ป้องกันการแก้ Client-side
    - คำนวณคะแนนรวม เปอร์เซ็นต์ ผลผ่าน/ไม่ผ่าน
    - ให้สิทธิ์รับ XP สะสมแบบ Single-time ป้องกันแต้มซ้ำ
    - อัปเดต LessonProgress, LearningActivity, และ MissionProgress
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "กรุณาเข้าสู่ระบบก่อนส่งคำตอบ"}), 401

    data = request.get_json(silent=True) or {}

    try:
        result = ExerciseService.submit_attempt(exercise_id, data, user)
        return jsonify({
            "message": "ส่งแบบฝึกหัดและประเมินผลเรียบร้อยแล้ว",
            "result": result
        }), 200
    except ExerciseServiceError as e:
        return jsonify({"error": "Error", "message": e.message}), e.status_code
    except Exception as e:
        db.session.rollback()
        return internal_error(e)


@exercises_bp.route("/exercises/<exercise_id>/result", methods=["GET"])
@jwt_required()
def get_exercise_result(exercise_id):
    """
    ดึงผลคะแนนการทำแบบฝึกหัดครั้งล่าสุดของผู้เรียน (UAT-EX-023)
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "กรุณาเข้าสู่ระบบ"}), 401

    try:
        latest = ExerciseService.get_latest_result(exercise_id, user)
        return jsonify({
            "result": latest
        }), 200
    except ExerciseServiceError as e:
        return jsonify({"error": "Not Found" if e.status_code == 404 else "Error", "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


@exercises_bp.route("/exercises/<exercise_id>/attempts", methods=["GET"])
@jwt_required()
def get_exercise_attempts(exercise_id):
    """
    ดึงประวัติการทำแบบฝึกหัดทั้งหมดของผู้เรียน (UAT-EX-024)
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "กรุณาเข้าสู่ระบบ"}), 401

    try:
        attempts = ExerciseService.get_user_attempts(exercise_id, user)
        return jsonify({
            "total": len(attempts),
            "attempts": attempts
        }), 200
    except ExerciseServiceError as e:
        return jsonify({"error": "Error", "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)
