from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.utils.decorators import roles_required, get_current_user
from app.services.classroom_service import ClassroomService, ClassroomServiceError

# =====================================================================
# classrooms.py: Route Controller สำหรับ Course / Classroom และ Enrollment
# รองรับ UAT-020, UAT-026, UAT-027, UAT-030 (Course CRUD, Catalog, Enrollment)
# สถาปัตยกรรม: Thin Route Controller มอบหมาย Business Logic ให้ ClassroomService
# =====================================================================

classrooms_bp = Blueprint("classrooms", __name__, url_prefix="/api/v1/classrooms")
instructor_bp = Blueprint("instructor", __name__, url_prefix="/api/v1/instructor")

# รักษา Helper reference เพื่อความเข้ากันได้แบบ Backward Compatible
can_manage_classroom = ClassroomService.can_manage_classroom


# =====================================================================
# 1. Course Catalog & Classroom CRUD Endpoints
# =====================================================================

@classrooms_bp.route("", methods=["GET"])
@jwt_required(optional=True)
def list_classrooms():
    """
    แสดงรายการคอร์สเรียนทั้งหมดในระบบ (Course Catalog) (UAT-020, UAT-026)
    - รองรับทั้งผู้ใช้ที่ล็อกอินแล้ว และ Guest ที่ยังไม่ได้ล็อกอิน (jwt_required optional=True)
    - แสดงข้อมูลสรุปของแต่ละคอร์ส เช่น จำนวนบทเรียน, ผู้สอน, รูปปก
    """
    current_user = get_current_user()
    status_filter = request.args.get("status")
    try:
        result = ClassroomService.list_classrooms(current_user, status_filter)
        return jsonify(result), 200
    except ClassroomServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500


@classrooms_bp.route("/my-enrollments", methods=["GET"])
@jwt_required()
def list_my_enrollments():
    """
    แสดงรายการคอร์สเรียนที่ผู้เรียนปัจจุบันลงทะเบียนไว้ (My Enrolled Courses) (UAT-030)
    """
    user = get_current_user()
    try:
        result = ClassroomService.list_my_enrollments(user)
        return jsonify(result), 200
    except ClassroomServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500


@classrooms_bp.route("", methods=["POST"])
@roles_required("instructor", "admin")
def create_classroom():
    """
    สร้างคอร์สเรียนใหม่ (UAT-027)
    - จำกัดสิทธิ์เฉพาะ Instructor และ Admin
    - รองรับชื่อคอร์ส (title), คำอธิบาย (description), รูปปก (thumbnail_url), และสถานะ (status)
    """
    user = get_current_user()
    data = request.get_json(silent=True)
    try:
        result, status_code = ClassroomService.create_classroom(user, data)
        return jsonify(result), status_code
    except ClassroomServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception:
        return jsonify({"error": "Internal Server Error", "message": "Failed to create classroom."}), 500


@classrooms_bp.route("/<classroom_id>", methods=["GET"])
@jwt_required(optional=True)
def get_classroom(classroom_id):
    """
    ดูรายละเอียดของคอร์สเรียน พร้อมโครงสร้าง Chapters และ Episodes (UAT-020, UAT-026)
    - รองรับ Guest Preview: ดูภาพรวมและรายชื่อบทเรียนได้
    - หากล็อกอินแล้ว จะระบุสถานะ is_enrolled เพื่อให้หน้าบ้านแสดงปุ่ม เข้าเรียน หรือ ลงทะเบียน
    """
    current_user = get_current_user()
    try:
        result = ClassroomService.get_classroom(classroom_id, current_user)
        return jsonify(result), 200
    except ClassroomServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500


@classrooms_bp.route("/<classroom_id>", methods=["PUT"])
@roles_required("instructor", "admin")
def update_classroom(classroom_id):
    """
    แก้ไขข้อมูลคอร์สเรียน (UAT-027)
    - จำกัดเฉพาะ Instructor เจ้าของคอร์ส หรือ Admin
    """
    user = get_current_user()
    data = request.get_json(silent=True)
    try:
        result = ClassroomService.update_classroom(classroom_id, user, data)
        return jsonify(result), 200
    except ClassroomServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception:
        return jsonify({"error": "Internal Server Error", "message": "Failed to update classroom."}), 500


@classrooms_bp.route("/<classroom_id>/status", methods=["POST"])
@roles_required("instructor", "admin")
def change_classroom_status(classroom_id):
    """
    เปลี่ยนสถานะคอร์ส: เผยแพร่ / ส่งตรวจ / ยกเลิกเผยแพร่ / เก็บถาวร / กู้คืน
    ผลลัพธ์ขึ้นกับสิทธิ์ใน Permission Matrix (courses.publish, courses.unpublish)
    """
    user = get_current_user()
    try:
        return jsonify(ClassroomService.change_status(classroom_id, user, request.get_json(silent=True))), 200
    except ClassroomServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code


@classrooms_bp.route("/<classroom_id>/review", methods=["POST"])
@roles_required("admin")
def review_classroom(classroom_id):
    """อนุมัติ / ไม่อนุมัติการเผยแพร่คอร์สที่รอตรวจสอบ (หน้าตรวจคอร์สก่อนเผยแพร่)"""
    user = get_current_user()
    try:
        return jsonify(ClassroomService.review_classroom(classroom_id, user, request.get_json(silent=True))), 200
    except ClassroomServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code


@classrooms_bp.route("/<classroom_id>", methods=["DELETE"])
@roles_required("instructor", "admin")
def delete_classroom(classroom_id):
    """
    ลบคอร์สเรียน (UAT-027)
    - จำกัดเฉพาะ Instructor เจ้าของคอร์ส หรือ Admin
    - บทเรียน ตอนย่อย และเนื้อหา จะถูกลบตามแบบ CASCADE
    """
    user = get_current_user()
    try:
        result = ClassroomService.delete_classroom(classroom_id, user)
        return jsonify(result), 200
    except ClassroomServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception:
        return jsonify({"error": "Internal Server Error", "message": "Failed to delete classroom."}), 500


# =====================================================================
# 2. Enrollment Endpoints (การลงทะเบียนเรียน)
# =====================================================================

@classrooms_bp.route("/<classroom_id>/members", methods=["GET"])
@jwt_required()
def list_classroom_members(classroom_id):
    """แสดงรายชื่อสมาชิกที่ลงทะเบียนในคอร์สเรียน"""
    try:
        result = ClassroomService.list_classroom_members(classroom_id, get_current_user())
        return jsonify(result), 200
    except ClassroomServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500


@classrooms_bp.route("/<classroom_id>/join", methods=["POST"])
@jwt_required()
def join_classroom(classroom_id):
    """
    ผู้เรียนลงทะเบียนเข้าสู่คอร์สเรียน (UAT-030)
    - ป้องกันการลงทะเบียนซ้ำ (คืนค่า 409 Conflict)
    """
    user = get_current_user()
    try:
        result, status_code = ClassroomService.join_classroom(classroom_id, user)
        return jsonify(result), status_code
    except ClassroomServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception:
        return jsonify({"error": "Internal Server Error", "message": "Failed to join classroom."}), 500


@classrooms_bp.route("/<classroom_id>/members", methods=["POST"])
@roles_required("instructor", "admin")
def add_classroom_member(classroom_id):
    """เพิ่มผู้เรียนเข้าคอร์สโดย Instructor หรือ Admin"""
    caller = get_current_user()
    data = request.get_json(silent=True)
    try:
        result, status_code = ClassroomService.add_classroom_member(classroom_id, caller, data)
        return jsonify(result), status_code
    except ClassroomServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception:
        return jsonify({"error": "Internal Server Error", "message": "Failed to add member."}), 500


@classrooms_bp.route("/<classroom_id>/members/<user_id>", methods=["DELETE"])
@jwt_required()
def remove_classroom_member(classroom_id, user_id):
    """ยกเลิกการลงทะเบียนเรียน (ผู้เรียนยกเลิกเอง หรือ Instructor/Admin นำออก)"""
    caller = get_current_user()
    try:
        result = ClassroomService.remove_classroom_member(classroom_id, user_id, caller)
        return jsonify(result), 200
    except ClassroomServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception:
        return jsonify({"error": "Internal Server Error", "message": "Failed to remove member."}), 500


# =====================================================================
# 3. Instructor Dashboard & Real Platform Stats APIs
# =====================================================================

def get_instructor_dashboard_data():
    """
    ดึงข้อมูล Dashboard สำหรับผู้สอน (Instructor Dashboard) จากฐานข้อมูลจริง
    - ตรวจสอบสิทธิ์ผู้สอน: เฉพาะ Instructor, Admin, Super Admin
    - ตรวจสอบ Object Ownership: Instructor เข้าถึงได้เฉพาะคอร์สของตนเอง
    """
    current_user = get_current_user()
    try:
        result = ClassroomService.get_instructor_dashboard(current_user)
        return jsonify(result), 200
    except ClassroomServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500


@instructor_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def instructor_dashboard():
    return get_instructor_dashboard_data()


@classrooms_bp.route("/instructor/dashboard", methods=["GET"])
@classrooms_bp.route("/instructor-dashboard", methods=["GET"])
@jwt_required()
def classrooms_instructor_dashboard():
    return get_instructor_dashboard_data()


@classrooms_bp.route("/public/stats", methods=["GET"])
@classrooms_bp.route("/platform-stats", methods=["GET"])
def get_platform_stats():
    """
    ข้อมูลสถิติภาพรวมแพลตฟอร์มสำหรับ Public / Guest Home (ดึงจริงจาก Database 100%)
    """
    try:
        result = ClassroomService.get_platform_stats()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": "Internal Server Error", "message": str(e)}), 500
