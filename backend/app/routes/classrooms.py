import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.user import User
from app.models.classroom import Classroom, ClassroomMember
from app.utils.decorators import roles_required
from app.utils.validators import validate_title

# =====================================================================
# classrooms.py: API จัดการ Course / Classroom (คอร์สเรียน) และการลงทะเบียน
# รองรับ UAT-020, UAT-026, UAT-027, UAT-030 (Course CRUD, Catalog, Enrollment)
# =====================================================================

classrooms_bp = Blueprint("classrooms", __name__, url_prefix="/api/v1/classrooms")


def get_current_user() -> User | None:
    """ดึงข้อมูลผู้ใช้ปัจจุบันจาก JWT Identity หากไม่มีหรือ Token ผิดพลาดจะคืนค่า None"""
    user_id = get_jwt_identity()
    if not user_id:
        return None
    try:
        user_uuid = uuid.UUID(str(user_id))
        return db.session.get(User, user_uuid)
    except (ValueError, TypeError):
        return None


def can_manage_classroom(classroom: Classroom, user: User) -> bool:
    """ตรวจสอบสิทธิ์: Admin หรือ Instructor เจ้าของคอร์สเท่านั้นที่สามารถจัดการคอร์สได้"""
    if user.has_role("admin"):
        return True
    if user.has_role("instructor") and str(classroom.instructor_id) == str(user.user_id):
        return True
    return False


@classrooms_bp.route("", methods=["GET"])
@jwt_required(optional=True)
def list_classrooms():
    """
    แสดงรายการคอร์สเรียนทั้งหมดในระบบ (Course Catalog) (UAT-020, UAT-026)
    - รองรับทั้งผู้ใช้ที่ล็อกอินแล้ว และ Guest ที่ยังไม่ได้ล็อกอิน (jwt_required optional=True)
    - แสดงข้อมูลสรุปของแต่ละคอร์ส เช่น จำนวนบทเรียน, ผู้สอน, รูปปก
    """
    status_filter = request.args.get("status")
    query = Classroom.query

    # หากเป็น Guest หรือ Student ให้แสดงเฉพาะคอร์สที่ active
    current_user = get_current_user()
    if not current_user or current_user.has_role("student"):
        query = query.filter_by(status="active")
    elif status_filter:
        query = query.filter_by(status=status_filter)

    classrooms = query.order_by(Classroom.created_at.desc()).all()

    # ตรวจสอบว่าผู้ใช้ปัจจุบันลงทะเบียนคอร์สใดไปแล้วบ้าง
    enrolled_classroom_ids = set()
    if current_user:
        enrolled_classroom_ids = {
            str(m.classroom_id)
            for m in ClassroomMember.query.filter_by(user_id=current_user.user_id).all()
        }

    results = []
    for c in classrooms:
        c_dict = c.to_dict()
        c_dict["is_enrolled"] = str(c.classroom_id) in enrolled_classroom_ids
        c_dict["is_owner"] = current_user and str(c.instructor_id) == str(current_user.user_id)
        results.append(c_dict)

    return jsonify({
        "classrooms": results,
        "courses": results  # Alias
    }), 200


@classrooms_bp.route("/my-enrollments", methods=["GET"])
@jwt_required()
def list_my_enrollments():
    """
    แสดงรายการคอร์สเรียนที่ผู้เรียนปัจจุบันลงทะเบียนไว้ (My Enrolled Courses) (UAT-030)
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    memberships = ClassroomMember.query.filter_by(user_id=user.user_id).order_by(ClassroomMember.joined_at.desc()).all()

    enrolled_courses = []
    for m in memberships:
        c = m.classroom
        if c:
            c_dict = c.to_dict(include_lessons=True)
            c_dict["enrollment_status"] = m.status
            c_dict["joined_at"] = m.joined_at.isoformat() if m.joined_at else None
            enrolled_courses.append(c_dict)

    return jsonify({
        "enrollments": enrolled_courses,
        "classrooms": enrolled_courses
    }), 200


@classrooms_bp.route("", methods=["POST"])
@roles_required("instructor", "admin")
def create_classroom():
    """
    สร้างคอร์สเรียนใหม่ (UAT-027)
    - จำกัดสิทธิ์เฉพาะ Instructor และ Admin
    - รองรับชื่อคอร์ส (title), คำอธิบาย (description), รูปปก (thumbnail_url), และสถานะ (status)
    """
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Bad Request", "message": "JSON body is required."}), 400

    title = data.get("title")
    is_valid_title, title_err = validate_title(title, field_name="Course/Classroom title")
    if not is_valid_title:
        return jsonify({"error": "Validation Error", "message": title_err}), 400

    description = data.get("description")
    thumbnail_url = data.get("thumbnail_url")
    status = data.get("status", "active")

    instructor_id = user.user_id
    if user.has_role("admin") and data.get("instructor_id"):
        try:
            target_inst_uuid = uuid.UUID(data.get("instructor_id"))
            target_inst = db.session.get(User, target_inst_uuid)
            if target_inst and (target_inst.has_role("instructor") or target_inst.has_role("admin")):
                instructor_id = target_inst.user_id
        except (ValueError, TypeError):
            return jsonify({"error": "Bad Request", "message": "Invalid instructor_id format."}), 400

    new_classroom = Classroom(
        instructor_id=instructor_id,
        title=title.strip(),
        description=description.strip() if description else None,
        thumbnail_url=thumbnail_url.strip() if thumbnail_url else None,
        status=status
    )

    try:
        db.session.add(new_classroom)
        db.session.commit()
        return jsonify({
            "message": "Classroom created successfully.",
            "classroom": new_classroom.to_dict(include_lessons=True),
            "course": new_classroom.to_dict(include_lessons=True)
        }), 201
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": "Failed to create classroom."}), 500


@classrooms_bp.route("/<classroom_id>", methods=["GET"])
@jwt_required(optional=True)
def get_classroom(classroom_id):
    """
    ดูรายละเอียดของคอร์สเรียน พร้อมโครงสร้าง Chapters และ Episodes (UAT-020, UAT-026)
    - รองรับ Guest Preview: ดูภาพรวมและรายชื่อบทเรียนได้
    - หากล็อกอินแล้ว จะระบุสถานะ is_enrolled เพื่อให้หน้าบ้านแสดงปุ่ม เข้าเรียน หรือ ลงทะเบียน
    """
    try:
        c_uuid = uuid.UUID(classroom_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid classroom ID format."}), 400

    classroom = db.session.get(Classroom, c_uuid)
    if not classroom:
        return jsonify({"error": "Not Found", "message": "Classroom not found."}), 404

    current_user = get_current_user()
    is_enrolled = False
    is_owner = False

    if current_user:
        is_enrolled = classroom.has_member(current_user.user_id)
        is_owner = (str(classroom.instructor_id) == str(current_user.user_id)) or current_user.has_role("admin")

    c_dict = classroom.to_dict(include_members=is_owner, include_lessons=True)
    c_dict["is_enrolled"] = is_enrolled
    c_dict["is_owner"] = is_owner

    return jsonify({
        "classroom": c_dict,
        "course": c_dict
    }), 200


@classrooms_bp.route("/<classroom_id>", methods=["PUT"])
@roles_required("instructor", "admin")
def update_classroom(classroom_id):
    """
    แก้ไขข้อมูลคอร์สเรียน (UAT-027)
    - จำกัดเฉพาะ Instructor เจ้าของคอร์ส หรือ Admin
    """
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

    if "title" in data:
        is_valid_title, title_err = validate_title(data.get("title"), field_name="Course title")
        if not is_valid_title:
            return jsonify({"error": "Validation Error", "message": title_err}), 400
        classroom.title = data.get("title").strip()

    if "description" in data:
        classroom.description = data.get("description")

    if "thumbnail_url" in data:
        classroom.thumbnail_url = data.get("thumbnail_url")

    if "status" in data:
        classroom.status = data.get("status")

    try:
        db.session.commit()
        return jsonify({
            "message": "Classroom updated successfully.",
            "classroom": classroom.to_dict(),
            "course": classroom.to_dict()
        }), 200
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": "Failed to update classroom."}), 500


@classrooms_bp.route("/<classroom_id>", methods=["DELETE"])
@roles_required("instructor", "admin")
def delete_classroom(classroom_id):
    """
    ลบคอร์สเรียน (UAT-027)
    - จำกัดเฉพาะ Instructor เจ้าของคอร์ส หรือ Admin
    - บทเรียน ตอนย่อย และเนื้อหา จะถูกลบตามแบบ CASCADE
    """
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

    try:
        db.session.delete(classroom)
        db.session.commit()
        return jsonify({
            "message": "Classroom deleted successfully."
        }), 200
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": "Failed to delete classroom."}), 500


# =====================================================================
# Enrollment Endpoints (การลงทะเบียนเรียน)
# =====================================================================

@classrooms_bp.route("/<classroom_id>/members", methods=["GET"])
@jwt_required()
def list_classroom_members(classroom_id):
    """แสดงรายชื่อสมาชิกที่ลงทะเบียนในคอร์สเรียน"""
    try:
        c_uuid = uuid.UUID(classroom_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid classroom ID format."}), 400

    classroom = db.session.get(Classroom, c_uuid)
    if not classroom:
        return jsonify({"error": "Not Found", "message": "Classroom not found."}), 404

    return jsonify({
        "classroom_id": str(classroom.classroom_id),
        "members": [m.to_dict() for m in classroom.members]
    }), 200


@classrooms_bp.route("/<classroom_id>/join", methods=["POST"])
@jwt_required()
def join_classroom(classroom_id):
    """
    ผู้เรียนลงทะเบียนเข้าสู่คอร์สเรียน (UAT-030)
    - ป้องกันการลงทะเบียนซ้ำ (คืนค่า 409 Conflict)
    """
    user = get_current_user()
    if not user or user.status != "active":
        return jsonify({"error": "Unauthorized", "message": "Account is inactive or not found."}), 401

    try:
        c_uuid = uuid.UUID(classroom_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid classroom ID format."}), 400

    classroom = db.session.get(Classroom, c_uuid)
    if not classroom:
        return jsonify({"error": "Not Found", "message": "Classroom not found."}), 404

    if classroom.status != "active":
        return jsonify({"error": "Forbidden", "message": "This course is not currently active for enrollment."}), 403

    if user.has_role("instructor") or user.has_role("admin") or not user.has_role("student"):
        return jsonify({
            "error": "Forbidden",
            "message": "Access denied: only students can join classrooms. Instructors and Admins already have direct access."
        }), 403

    # ป้องกันการลงทะเบียนซ้ำ
    if classroom.has_member(user.user_id):
        return jsonify({
            "error": "Conflict",
            "message": "You are already enrolled in this classroom."
        }), 409

    member = ClassroomMember(classroom=classroom, user=user, status="enrolled")
    try:
        db.session.add(member)
        db.session.commit()
        return jsonify({
            "message": "Successfully enrolled in classroom.",
            "member": member.to_dict(),
            "enrollment": member.to_dict()
        }), 201
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": "Failed to join classroom."}), 500


@classrooms_bp.route("/<classroom_id>/members", methods=["POST"])
@roles_required("instructor", "admin")
def add_classroom_member(classroom_id):
    """เพิ่มผู้เรียนเข้าคอร์สโดย Instructor หรือ Admin"""
    caller = get_current_user()
    if not caller:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    try:
        c_uuid = uuid.UUID(classroom_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid classroom ID format."}), 400

    classroom = db.session.get(Classroom, c_uuid)
    if not classroom:
        return jsonify({"error": "Not Found", "message": "Classroom not found."}), 404

    if not can_manage_classroom(classroom, caller):
        return jsonify({
            "error": "Forbidden",
            "message": "Access denied: you are not the instructor owner of this classroom."
        }), 403

    data = request.get_json(silent=True)
    if not data or not data.get("user_id"):
        return jsonify({"error": "Bad Request", "message": "user_id is required."}), 400

    try:
        target_user_uuid = uuid.UUID(data.get("user_id"))
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid target user_id format."}), 400

    target_user = db.session.get(User, target_user_uuid)
    if not target_user:
        return jsonify({"error": "Not Found", "message": "Target user not found."}), 404

    if classroom.has_member(target_user.user_id):
        return jsonify({
            "error": "Conflict",
            "message": "User is already a member of this classroom."
        }), 409

    member = ClassroomMember(classroom=classroom, user=target_user, status="enrolled")
    try:
        db.session.add(member)
        db.session.commit()
        return jsonify({
            "message": "Member added successfully.",
            "member": member.to_dict()
        }), 201
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": "Failed to add member."}), 500


@classrooms_bp.route("/<classroom_id>/members/<user_id>", methods=["DELETE"])
@jwt_required()
def remove_classroom_member(classroom_id, user_id):
    """ยกเลิกการลงทะเบียนเรียน (ผู้เรียนยกเลิกเอง หรือ Instructor/Admin นำออก)"""
    caller = get_current_user()
    if not caller:
        return jsonify({"error": "Unauthorized", "message": "User not found."}), 401

    try:
        c_uuid = uuid.UUID(classroom_id)
        target_uuid = uuid.UUID(user_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid ID format."}), 400

    classroom = db.session.get(Classroom, c_uuid)
    if not classroom:
        return jsonify({"error": "Not Found", "message": "Classroom not found."}), 404

    is_self = caller.user_id == target_uuid
    is_owner_or_admin = can_manage_classroom(classroom, caller)

    if not is_self and not is_owner_or_admin:
        return jsonify({
            "error": "Forbidden",
            "message": "Access denied: you cannot remove this member."
        }), 403

    member = ClassroomMember.query.filter_by(classroom_id=c_uuid, user_id=target_uuid).first()
    if not member:
        return jsonify({"error": "Not Found", "message": "Classroom membership not found."}), 404

    try:
        db.session.delete(member)
        db.session.commit()
        return jsonify({
            "message": "Member removed successfully."
        }), 200
    except Exception:
        db.session.rollback()
        return jsonify({"error": "Internal Server Error", "message": "Failed to remove member."}), 500
