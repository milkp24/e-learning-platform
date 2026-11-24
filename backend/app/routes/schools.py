from flask import Blueprint, request, jsonify
from app.utils.decorators import roles_required, get_current_user
from app.services.school_service import SchoolService, SchoolServiceError
from app.utils.errors import internal_error

# =====================================================================
# schools.py: REST API สำหรับระบบ School Management (Module 9.2)
# รองรับ UAT-SCH-001 ถึง UAT-SCH-017
# URL Prefix: /api/v1 (รักษา Endpoint URL: /api/v1/admin/schools/...)
# =====================================================================

schools_bp = Blueprint("schools", __name__, url_prefix="/api/v1")


# =====================================================================
# 1. School Management Endpoints
# =====================================================================

@schools_bp.route("/admin/schools", methods=["GET"])
@roles_required("admin")
def list_schools():
    """
    แสดงรายการโรงเรียนและสถานศึกษาทั้งหมด พร้อมการค้นหา กรองสถานะ และ Pagination
    - ตรวจสอบสิทธิ์ schools.view ผ่าน Dynamic Permission Matrix
    - ดึงข้อมูลจาก PostgreSQL จริง พร้อมนับจำนวน classrooms และ members จริง
    """
    caller = get_current_user()
    search = request.args.get("search", "").strip()
    status_filter = request.args.get("status", "").strip().lower()

    try:
        page = max(1, int(request.args.get("page", 1)))
        per_page = min(100, max(1, int(request.args.get("per_page", 10))))
    except ValueError:
        page = 1
        per_page = 10

    try:
        result = SchoolService.list_schools(
            caller=caller,
            search=search,
            status_filter=status_filter,
            page=page,
            per_page=per_page
        )
        return jsonify(result), 200
    except SchoolServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


@schools_bp.route("/admin/schools/<school_id>", methods=["GET"])
@roles_required("admin")
def get_school_detail(school_id):
    """
    ดึงข้อมูลรายละเอียดของโรงเรียน พร้อมรายการห้องเรียน สมาชิก และการตั้งค่า
    - ตรวจสอบสิทธิ์ schools.view ผ่าน Dynamic Permission Matrix
    """
    caller = get_current_user()
    try:
        result = SchoolService.get_school_detail(caller=caller, school_id_raw=school_id)
        return jsonify(result), 200
    except SchoolServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


@schools_bp.route("/admin/schools", methods=["POST"])
@roles_required("admin")
def create_school():
    """
    สร้างโรงเรียนใหม่
    - ตรวจสอบสิทธิ์ schools.create ผ่าน Dynamic Permission Matrix
    - Validation: name (required, min 2 chars), code (optional, unique if provided), email validation
    - บันทึก Audit Log (SCHOOL_CREATED)
    """
    caller = get_current_user()
    data = request.get_json(silent=True)
    ip_addr = request.remote_addr or "127.0.0.1"

    try:
        result, status_code = SchoolService.create_school(caller=caller, data=data, ip_address=ip_addr)
        return jsonify(result), status_code
    except SchoolServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


@schools_bp.route("/admin/schools/<school_id>", methods=["PATCH"])
@roles_required("admin")
def update_school(school_id):
    """
    แก้ไขข้อมูลโรงเรียน
    - ตรวจสอบสิทธิ์ schools.edit ผ่าน Dynamic Permission Matrix
    - Validation: name, code uniqueness, email format, status
    - บันทึก Audit Log (SCHOOL_UPDATED)
    """
    caller = get_current_user()
    data = request.get_json(silent=True)
    ip_addr = request.remote_addr or "127.0.0.1"

    try:
        result, status_code = SchoolService.update_school(
            caller=caller,
            school_id_raw=school_id,
            data=data,
            ip_address=ip_addr
        )
        return jsonify(result), status_code
    except SchoolServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


@schools_bp.route("/admin/schools/<school_id>", methods=["DELETE"])
@roles_required("admin")
def delete_school(school_id):
    """
    ลบโรงเรียน
    - ตรวจสอบสิทธิ์ schools.delete ผ่าน Dynamic Permission Matrix (Super Admin)
    - Safety guard: ป้องกันการลบโรงเรียนที่มีห้องเรียนหรือสมาชิกอยู่
    - บันทึก Audit Log (SCHOOL_DELETED_PERMANENT)
    """
    caller = get_current_user()
    ip_addr = request.remote_addr or "127.0.0.1"

    try:
        result, status_code = SchoolService.delete_school(
            caller=caller,
            school_id_raw=school_id,
            ip_address=ip_addr
        )
        return jsonify(result), status_code
    except SchoolServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


# =====================================================================
# 2. School Classroom Management Endpoints
# =====================================================================

@schools_bp.route("/admin/schools/<school_id>/classrooms", methods=["GET"])
@roles_required("admin")
def list_school_classrooms(school_id):
    """
    แสดงรายการห้องเรียนทั้งหมดภายใต้โรงเรียนที่ระบุ
    - ตรวจสอบสิทธิ์ schools.view
    """
    caller = get_current_user()
    search = request.args.get("search", "").strip()
    status_filter = request.args.get("status", "").strip().lower()

    try:
        result = SchoolService.list_school_classrooms(
            caller=caller,
            school_id_raw=school_id,
            search=search,
            status_filter=status_filter
        )
        return jsonify(result), 200
    except SchoolServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


@schools_bp.route("/admin/schools/<school_id>/classrooms", methods=["POST"])
@roles_required("admin")
def create_school_classroom(school_id):
    """
    สร้างห้องเรียนใหม่ภายใต้โรงเรียน
    - ตรวจสอบสิทธิ์ schools.edit
    - ตรวจสอบความถูกต้องของข้อมูล (ชื่อห้องเรียน, ปีการศึกษา)
    - ป้องกันชื่อห้องเรียนซ้ำในปีการศึกษาเดียวกัน
    - บันทึก Audit Log (CLASSROOM_CREATED)
    """
    caller = get_current_user()
    data = request.get_json(silent=True)
    ip_addr = request.remote_addr or "127.0.0.1"

    try:
        result, status_code = SchoolService.create_school_classroom(
            caller=caller,
            school_id_raw=school_id,
            data=data,
            ip_address=ip_addr
        )
        return jsonify(result), status_code
    except SchoolServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


@schools_bp.route("/admin/schools/<school_id>/classrooms/<classroom_id>", methods=["PATCH"])
@roles_required("admin")
def update_school_classroom(school_id, classroom_id):
    """
    แก้ไขข้อมูลห้องเรียน
    - ตรวจสอบสิทธิ์ schools.edit
    - IDOR Protection: ตรวจสอบว่าห้องเรียนสังกัด school_id ที่ระบุจริง
    - บันทึก Audit Log (CLASSROOM_UPDATED)
    """
    caller = get_current_user()
    data = request.get_json(silent=True)
    ip_addr = request.remote_addr or "127.0.0.1"

    try:
        result, status_code = SchoolService.update_school_classroom(
            caller=caller,
            school_id_raw=school_id,
            classroom_id_raw=classroom_id,
            data=data,
            ip_address=ip_addr
        )
        return jsonify(result), status_code
    except SchoolServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


@schools_bp.route("/admin/schools/<school_id>/classrooms/<classroom_id>", methods=["DELETE"])
@roles_required("admin")
def delete_school_classroom(school_id, classroom_id):
    """
    ลบห้องเรียน
    - ตรวจสอบสิทธิ์ schools.edit
    - IDOR Protection: ตรวจสอบว่าห้องเรียนสังกัด school_id ที่ระบุ
    - Business Rule Safety Check: ป้องกันการลบหากมีนักเรียนผูกอยู่ (409 Conflict)
    - บันทึก Audit Log (CLASSROOM_DELETED)
    """
    caller = get_current_user()
    ip_addr = request.remote_addr or "127.0.0.1"

    try:
        result, status_code = SchoolService.delete_school_classroom(
            caller=caller,
            school_id_raw=school_id,
            classroom_id_raw=classroom_id,
            ip_address=ip_addr
        )
        return jsonify(result), status_code
    except SchoolServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


# =====================================================================
# 3. School Membership Management Endpoints
# =====================================================================

@schools_bp.route("/admin/schools/<school_id>/members", methods=["GET"])
@roles_required("admin")
def list_school_members(school_id):
    """
    แสดงรายชื่อสมาชิกทั้งหมดของโรงเรียน (SchoolUser + User + Profile)
    - ตรวจสอบสิทธิ์ schools.view
    - รองรับการค้นหาตามชื่อ/อีเมล และการกรองตามบทบาทในโรงเรียน
    """
    caller = get_current_user()
    search = request.args.get("search", "").strip().lower()
    role_filter = request.args.get("role", "").strip().lower()

    try:
        result = SchoolService.list_school_members(
            caller=caller,
            school_id_raw=school_id,
            search=search,
            role_filter=role_filter
        )
        return jsonify(result), 200
    except SchoolServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


@schools_bp.route("/admin/schools/<school_id>/members", methods=["POST"])
@roles_required("admin")
def add_school_member(school_id):
    """
    เพิ่มสมาชิกเข้าโรงเรียนจากบัญชี User ที่มีอยู่จริงในระบบ
    - ตรวจสอบสิทธิ์ schools.edit
    - เลือก User จากระบบจริง
    - ตรวจสอบว่ายังไม่ได้เป็นสมาชิกในโรงเรียนนี้
    - ไม่กระทบ Global System Role ของ User
    - บันทึก Audit Log (SCHOOL_MEMBER_ADDED)
    """
    caller = get_current_user()
    data = request.get_json(silent=True)
    ip_addr = request.remote_addr or "127.0.0.1"

    try:
        result, status_code = SchoolService.add_school_member(
            caller=caller,
            school_id_raw=school_id,
            data=data,
            ip_address=ip_addr
        )
        return jsonify(result), status_code
    except SchoolServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


@schools_bp.route("/admin/schools/<school_id>/members/<membership_id>", methods=["PATCH"])
@roles_required("admin")
def update_school_member_role(school_id, membership_id):
    """
    เปลี่ยนบทบาทสมาชิกในโรงเรียน (SchoolUser.role)
    - ตรวจสอบสิทธิ์ schools.edit
    - IDOR Protection: ตรวจสอบว่าสมาชิกสังกัด school_id ที่ระบุ
    - สำคัญ: เปลี่ยนเฉพาะ School Role เท่านั้น ไม่เปลี่ยน Global System Role ของ User
    - บันทึก Audit Log (SCHOOL_MEMBER_UPDATED)
    """
    caller = get_current_user()
    data = request.get_json(silent=True)
    ip_addr = request.remote_addr or "127.0.0.1"

    try:
        result, status_code = SchoolService.update_school_member_role(
            caller=caller,
            school_id_raw=school_id,
            membership_id_raw=membership_id,
            data=data,
            ip_address=ip_addr
        )
        return jsonify(result), status_code
    except SchoolServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


@schools_bp.route("/admin/schools/<school_id>/members/<membership_id>", methods=["DELETE"])
@roles_required("admin")
def remove_school_member(school_id, membership_id):
    """
    นำสมาชิกออกจากโรงเรียน
    - ตรวจสอบสิทธิ์ schools.edit
    - IDOR Protection: ตรวจสอบว่าสมาชิกสังกัด school_id ที่ระบุ
    - ลบเฉพาะเรคคอร์ดใน SchoolUser เท่านั้น (ไม่ลบ User Account)
    - บันทึก Audit Log (SCHOOL_MEMBER_REMOVED)
    """
    caller = get_current_user()
    ip_addr = request.remote_addr or "127.0.0.1"

    try:
        result, status_code = SchoolService.remove_school_member(
            caller=caller,
            school_id_raw=school_id,
            membership_id_raw=membership_id,
            ip_address=ip_addr
        )
        return jsonify(result), status_code
    except SchoolServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)


# =====================================================================
# 4. Available Users Endpoint
# =====================================================================

@schools_bp.route("/admin/schools/available-users", methods=["GET"])
@roles_required("admin")
def get_available_users_for_school():
    """
    ค้นหารายชื่อผู้ใช้ในระบบเพื่อเลือกเพิ่มเข้าเป็นสมาชิกโรงเรียน
    - ตรวจสอบสิทธิ์ schools.edit
    - ค้นหาด้วย email, display_name หรือ first_name/last_name
    - กรองผู้ใช้ที่สังกัด school_id ออก หากมีการส่ง school_id มา
    """
    caller = get_current_user()
    search = request.args.get("search", "").strip()
    school_id_param = request.args.get("school_id")

    try:
        result = SchoolService.get_available_users_for_school(
            caller=caller,
            search=search,
            school_id_param=school_id_param
        )
        return jsonify(result), 200
    except SchoolServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code
    except Exception as e:
        return internal_error(e)
