import uuid
from flask import current_app
from app.extensions import db
from app.models.quiz import (
    Quiz,
    QuizCondition,
    Question,
    QuizQuestion,
    QuestionOption,
    QuizAttempt,
)
from app.models.user import User
from app.models.classroom import Classroom, ClassroomMember
from app.services.quiz.timing import compute_time_difference_seconds
from app.utils.validators import clean_optional_text, clean_required_text, parse_optional_number


# =====================================================================
# management.py: ฝั่งผู้สอน/แอดมินจัดการข้อสอบ
# - ดูรายการข้อสอบและประวัติการสอบ
# - สร้าง / แก้ไข / ลบ ชุดข้อสอบและคำถาม
# (แยกออกมาจาก quiz_service.py เดิม โดยไม่เปลี่ยนตรรกะ)
# =====================================================================


# =====================================================================
# Phase 5D: Quiz Management, Listing, and Authoring Service Methods
# Single Source of Truth for Quiz CRUD, Queries, and Attempt Histories
# =====================================================================

def get_quiz_manage_details_service(
    quiz_id: uuid.UUID,
    user: User,
) -> tuple[dict | None, str, int]:
    """
    ดึงข้อมูลข้อสอบและคำถามแบบครบถ้วนพร้อมเฉลยและตัวเลือก สำหรับ Instructor/Admin (?mode=manage)
    """
    quiz = db.session.get(Quiz, quiz_id)
    if not quiz:
        return None, "Quiz not found.", 404

    is_owner = quiz.course and str(quiz.course.instructor_id) == str(user.user_id)
    is_admin = user.has_role("admin") or user.has_role("super_admin")
    if not (is_owner or is_admin):
        return None, "Access denied: instructor or admin role required.", 403

    quiz_data = quiz.to_dict(include_condition=True)
    quiz_questions = QuizQuestion.query.filter_by(quiz_id=quiz_id).order_by(QuizQuestion.order_no.asc()).all()
    q_list = []
    for qq in quiz_questions:
        q_dict = qq.question.to_dict(include_options=True)
        q_dict["order_no"] = qq.order_no
        q_list.append(q_dict)
    quiz_data["questions"] = q_list
    return quiz_data, "Quiz details retrieved successfully.", 200


def list_quiz_attempts_service(
    quiz_id: uuid.UUID,
    user: User,
) -> tuple[list | None, str, int]:
    """
    ดึงรายการประวัติการทำแบบทดสอบ (Unified Attempt Listing)
    - นักเรียน: เห็นเฉพาะ attempts ของตนเอง พร้อม score, passing status, time_spent
    - ผู้สอน / Admin: เห็น attempts ของทุกคน พร้อมข้อมูลผู้เรียน (user_display_name, email)
    """
    quiz = db.session.get(Quiz, quiz_id)
    if not quiz:
        return None, "Quiz not found.", 404

    is_owner = quiz.course and str(quiz.course.instructor_id) == str(user.user_id)
    is_admin = user.has_role("admin") or user.has_role("super_admin")

    query = QuizAttempt.query.filter_by(quiz_id=quiz_id)
    if not (is_owner or is_admin):
        query = query.filter_by(user_id=user.user_id)

    attempts = query.order_by(QuizAttempt.started_at.desc()).all()
    results = []
    for att in attempts:
        ad = att.to_dict()
        time_spent = compute_time_difference_seconds(att.submitted_at, att.started_at) if (att.started_at and att.submitted_at) else 0
        ad["time_spent"] = time_spent
        ad["time_used"] = time_spent
        res = att.result
        if res:
            ad["score"] = float(res.score)
            ad["total_score"] = float(res.total_score)
            ad["percentage"] = float(res.percentage)
            ad["is_passed"] = bool(res.is_passed)
            ad["passed"] = bool(res.is_passed)
            ad["feedback"] = res.feedback or ""
            ad["result"] = res.to_dict()
        else:
            ad["score"] = 0.0
            ad["total_score"] = 0.0
            ad["percentage"] = 0.0
            ad["is_passed"] = False
            ad["passed"] = False
            ad["feedback"] = ""
            ad["result"] = None

        if (is_owner or is_admin) and att.user:
            d_name = getattr(att.user, "display_name", None)
            if not d_name and getattr(att.user, "profile", None):
                d_name = getattr(att.user.profile, "display_name", None)
            ad["user_display_name"] = d_name or att.user.email
            ad["user_email"] = att.user.email

        results.append(ad)

    return results, "Attempts retrieved successfully.", 200


def list_quizzes_service(
    user: User,
    course_id: uuid.UUID | None = None,
) -> list:
    """
    แสดงรายการแบบทดสอบทั้งหมด กรองตาม course_id หรือสิทธิ์ของผู้ใช้งาน
    """
    query = Quiz.query
    if course_id:
        # ข้อ 14: ระบุคอร์สมาเอง ต้องเป็นคอร์สที่ผู้ใช้มองเห็นได้ ไม่อย่างนั้นได้รายการว่าง
        from app.services.classroom_service import ClassroomService
        classroom = db.session.get(Classroom, course_id)
        if not classroom or not ClassroomService.can_view_classroom(classroom, user):
            return []
        query = query.filter_by(course_id=course_id)
    elif not (user.has_role("admin") or user.has_role("super_admin")):
        if user.has_role("instructor"):
            taught_courses = Classroom.query.filter_by(instructor_id=user.user_id).all()
            taught_ids = [c.classroom_id for c in taught_courses]
            query = query.filter(Quiz.course_id.in_(taught_ids))
        else:
            enrolled = ClassroomMember.query.filter_by(user_id=user.user_id).all()
            enrolled_ids = [cm.classroom_id for cm in enrolled]
            query = query.filter(Quiz.course_id.in_(enrolled_ids))

    quizzes = query.order_by(Quiz.created_at.desc()).all()
    results = []
    for q in quizzes:
        d = q.to_dict(include_condition=True)
        d["questions_count"] = q.quiz_questions.count()
        d["course_title"] = q.course.title if q.course else "คอร์สเรียนทั่วไป"
        results.append(d)
    return results


def list_classroom_quizzes_service(
    classroom_id: uuid.UUID,
    user: User,
) -> tuple[dict | None, str, int]:
    """
    แสดงรายการแบบทดสอบทั้งหมดในคอร์สเรียนที่ระบุ
    """
    classroom = db.session.get(Classroom, classroom_id)
    # ข้อ 14: คอร์สที่ผู้ใช้มองไม่เห็น (เช่นฉบับร่างของผู้สอนคนอื่น) ตอบ 404 เหมือนไม่มีคอร์สนี้
    from app.services.classroom_service import ClassroomService
    if not classroom or not ClassroomService.can_view_classroom(classroom, user):
        return None, "ไม่พบคอร์สเรียน", 404

    quizzes = Quiz.query.filter_by(course_id=classroom_id).order_by(Quiz.created_at.desc()).all()
    results = []
    for q in quizzes:
        d = q.to_dict(include_condition=True)
        d["questions_count"] = q.quiz_questions.count()
        d["course_title"] = classroom.title
        results.append(d)

    return {
        "course_id": str(classroom_id),
        "quizzes": results,
        "exams": results,
    }, "Classroom quizzes retrieved successfully.", 200


def create_quiz_service(
    classroom_id: uuid.UUID,
    user: User,
    data: dict,
    lesson_id: uuid.UUID | None = None,
) -> tuple[dict | None, str, int]:
    """
    สร้างแบบทดสอบใหม่พร้อมเงื่อนไข QuizCondition
    """
    classroom = db.session.get(Classroom, classroom_id)
    if not classroom:
        return None, "Classroom not found.", 404

    is_owner = str(classroom.instructor_id) == str(user.user_id)
    is_admin = user.has_role("admin") or user.has_role("super_admin")
    if not (is_owner or is_admin):
        return None, "Access denied: you are not the instructor of this course.", 403

    ok, title, message = clean_required_text(data.get("title"), "ชื่อแบบทดสอบ", 255)
    if not ok:
        return None, message, 400
    ok, description, message = clean_optional_text(data.get("description"), "คำอธิบาย", 5000)
    if not ok:
        return None, message, 400
    conditions, message = _parse_quiz_conditions(data)
    if message:
        return None, message, 400

    new_quiz = Quiz(
        course_id=classroom_id,
        lesson_id=lesson_id,
        title=title,
        description=description,
    )

    try:
        db.session.add(new_quiz)
        db.session.flush()

        condition = QuizCondition(
            quiz_id=new_quiz.quiz_id,
            max_attempts=conditions.get("max_attempts"),
            time_limit_minutes=conditions.get("time_limit_minutes"),
            passing_score=conditions.get("passing_score", 70.0),
        )
        db.session.add(condition)
        db.session.commit()

        quiz_dict = new_quiz.to_dict(include_condition=True)
        return quiz_dict, "Quiz created successfully.", 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error("Failed to create quiz: %s", e, exc_info=True)
        return None, _internal_error_message(e), 500


def update_quiz_service(
    quiz_id: uuid.UUID,
    user: User,
    data: dict,
) -> tuple[dict | None, str, int]:
    """
    แก้ไขข้อมูลแบบทดสอบ เกณฑ์คะแนน และจำนวนครั้งที่ทำได้
    """
    quiz = db.session.get(Quiz, quiz_id)
    if not quiz:
        return None, "Quiz not found.", 404

    is_owner = quiz.course and str(quiz.course.instructor_id) == str(user.user_id)
    is_admin = user.has_role("admin") or user.has_role("super_admin")
    if not (is_owner or is_admin):
        return None, "Access denied.", 403

    if "title" in data:
        ok, title, message = clean_required_text(data.get("title"), "ชื่อแบบทดสอบ", 255)
        if not ok:
            return None, message, 400
        quiz.title = title

    if "description" in data:
        ok, description, message = clean_optional_text(data.get("description"), "คำอธิบาย", 5000)
        if not ok:
            return None, message, 400
        quiz.description = description

    conditions, message = _parse_quiz_conditions(data)
    if message:
        return None, message, 400

    if not quiz.condition:
        quiz.condition = QuizCondition(quiz_id=quiz.quiz_id)
        db.session.add(quiz.condition)

    if "passing_score" in conditions:
        quiz.condition.passing_score = conditions["passing_score"]
    if "max_attempts" in conditions:
        quiz.condition.max_attempts = conditions["max_attempts"]
    if "time_limit_minutes" in conditions:
        quiz.condition.time_limit_minutes = conditions["time_limit_minutes"]

    try:
        db.session.commit()
        quiz_dict = quiz.to_dict(include_condition=True)
        return quiz_dict, "Quiz updated successfully.", 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error("Failed to update quiz: %s", e, exc_info=True)
        return None, _internal_error_message(e), 500


def delete_quiz_service(
    quiz_id: uuid.UUID,
    user: User,
) -> tuple[bool, str, int]:
    """
    ลบแบบทดสอบออกจากระบบ
    """
    quiz = db.session.get(Quiz, quiz_id)
    if not quiz:
        return False, "Quiz not found.", 404

    is_owner = quiz.course and str(quiz.course.instructor_id) == str(user.user_id)
    is_admin = user.has_role("admin") or user.has_role("super_admin")
    if not (is_owner or is_admin):
        return False, "Access denied.", 403

    try:
        db.session.delete(quiz)
        db.session.commit()
        return True, "Quiz deleted successfully.", 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error("Failed to delete quiz: %s", e, exc_info=True)
        return False, _internal_error_message(e), 500


def add_question_to_quiz_service(
    quiz_id: uuid.UUID,
    user: User,
    data: dict,
) -> tuple[dict | None, str, int]:
    """
    เพิ่มข้อคำถามและตัวเลือกลงในแบบทดสอบ คำนวณ order_no ถัดไปโดยอัตโนมัติ
    """
    quiz = db.session.get(Quiz, quiz_id)
    if not quiz:
        return None, "Quiz not found.", 404

    if quiz.course:
        is_owner = str(quiz.course.instructor_id) == str(user.user_id)
        is_admin = user.has_role("admin") or user.has_role("super_admin")
        if not (is_owner or is_admin):
            return None, "Access denied.", 403

    ok, question_text, message = clean_required_text(data.get("question_text"), "คำถาม", 5000)
    if not ok:
        return None, message, 400

    raw_type = data.get("question_type") or "multiple_choice"
    if not isinstance(raw_type, str):
        return None, "ประเภทคำถามไม่ถูกต้อง", 400
    q_type = raw_type.lower().strip()
    if q_type not in ["multiple_choice", "true_false", "matching", "ordering", "image_choice"]:
        return None, f"Invalid question_type '{q_type}'.", 400

    ok, explanation, message = clean_optional_text(data.get("explanation"), "คำอธิบายเฉลย", 5000)
    if not ok:
        return None, message, 400
    ok, image_url, message = clean_optional_text(data.get("image_url"), "ลิงก์รูปภาพ", 500)
    if not ok:
        return None, message, 400
    ok, points_val, message = parse_optional_number(data.get("points"), "คะแนน", min_value=0, max_value=1000, default=1.0)
    if not ok:
        return None, message, 400
    raw_options = data.get("options") or []
    if not isinstance(raw_options, list) or len(raw_options) > 20:
        return None, "ตัวเลือกคำตอบต้องเป็นรายการ และมีได้ไม่เกิน 20 ข้อ", 400

    order_no = data.get("order_no")
    if order_no is None:
        last_qq = QuizQuestion.query.filter_by(quiz_id=quiz_id).order_by(QuizQuestion.order_no.desc()).first()
        order_no = (last_qq.order_no + 1) if last_qq else 1

    try:
        new_question = Question(
            question_text=question_text.strip(),
            question_type=q_type,
            image_url=image_url,
            points=points_val,
            explanation=explanation,
        )
        db.session.add(new_question)
        db.session.flush()

        qq_map = QuizQuestion(
            quiz_id=quiz_id,
            question_id=new_question.question_id,
            order_no=order_no,
        )
        db.session.add(qq_map)

        for idx, opt_item in enumerate(raw_options):
            opt_img = None
            if isinstance(opt_item, dict):
                opt_text = opt_item.get("option_text") or opt_item.get("text") or ""
                opt_img = opt_item.get("image_url")
                is_correct = bool(opt_item.get("is_correct", False))
                opt_order = opt_item.get("order_no", idx + 1)
            elif isinstance(opt_item, str):
                opt_text = opt_item
                is_correct = False
                opt_order = idx + 1
            else:
                continue

            q_opt = QuestionOption(
                question_id=new_question.question_id,
                option_text=str(opt_text).strip(),
                image_url=str(opt_img).strip() if (opt_img and isinstance(opt_img, str) and str(opt_img).strip()) else None,
                is_correct=is_correct,
                order_no=opt_order,
            )
            db.session.add(q_opt)

        db.session.commit()

        res_data = {
            "question": new_question.to_dict(include_options=True),
            "order_no": order_no,
        }
        return res_data, "Question added to quiz successfully.", 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error("Failed to add question: %s", e, exc_info=True)
        return None, _internal_error_message(e), 500


def update_question_service(
    quiz_id: uuid.UUID,
    question_id: uuid.UUID,
    user: User,
    data: dict,
) -> tuple[dict | None, str, int]:
    """
    แก้ไขข้อคำถาม ตัวเลือก เฉลย และคะแนน
    """
    quiz = db.session.get(Quiz, quiz_id)
    if not quiz:
        return None, "Quiz not found.", 404

    is_owner = quiz.course and str(quiz.course.instructor_id) == str(user.user_id)
    is_admin = user.has_role("admin") or user.has_role("super_admin")
    if not (is_owner or is_admin):
        return None, "Access denied.", 403

    question = db.session.get(Question, question_id)
    if not question:
        return None, "Question not found.", 404

    if "question_text" in data:
        ok, qt, message = clean_required_text(data.get("question_text"), "คำถาม", 5000)
        if not ok:
            return None, message, 400
        question.question_text = qt

    if "question_type" in data:
        raw_type = data.get("question_type") or "multiple_choice"
        if not isinstance(raw_type, str):
            return None, "ประเภทคำถามไม่ถูกต้อง", 400
        q_type = raw_type.lower().strip()
        if q_type not in ["multiple_choice", "true_false", "matching", "ordering", "image_choice"]:
            return None, f"Invalid question_type '{q_type}'.", 400
        question.question_type = q_type

    if "image_url" in data:
        ok, img, message = clean_optional_text(data.get("image_url"), "ลิงก์รูปภาพ", 500)
        if not ok:
            return None, message, 400
        question.image_url = img

    if "points" in data:
        ok, pts, message = parse_optional_number(data.get("points"), "คะแนน", min_value=0, max_value=1000, default=1.0)
        if not ok:
            return None, message, 400
        question.points = pts

    if "explanation" in data:
        ok, explanation, message = clean_optional_text(data.get("explanation"), "คำอธิบายเฉลย", 5000)
        if not ok:
            return None, message, 400
        question.explanation = explanation

    if "options" in data:
        raw_options = data.get("options") or []
        if not isinstance(raw_options, list) or len(raw_options) > 20:
            return None, "ตัวเลือกคำตอบต้องเป็นรายการ และมีได้ไม่เกิน 20 ข้อ", 400
        QuestionOption.query.filter_by(question_id=question_id).delete()
        for idx, opt_item in enumerate(raw_options):
            opt_img = None
            if isinstance(opt_item, dict):
                opt_text = opt_item.get("option_text") or opt_item.get("text") or ""
                opt_img = opt_item.get("image_url")
                is_correct = bool(opt_item.get("is_correct", False))
                opt_order = opt_item.get("order_no", idx + 1)
            elif isinstance(opt_item, str):
                opt_text = opt_item
                is_correct = False
                opt_order = idx + 1
            else:
                continue

            q_opt = QuestionOption(
                question_id=question_id,
                option_text=str(opt_text).strip(),
                image_url=str(opt_img).strip() if (opt_img and isinstance(opt_img, str) and str(opt_img).strip()) else None,
                is_correct=is_correct,
                order_no=opt_order,
            )
            db.session.add(q_opt)

    try:
        db.session.commit()
        return question.to_dict(include_options=True), "Question updated successfully.", 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error("Failed to update question: %s", e, exc_info=True)
        return None, _internal_error_message(e), 500


def delete_question_service(
    quiz_id: uuid.UUID,
    question_id: uuid.UUID,
    user: User,
) -> tuple[bool, str, int]:
    """
    ลบข้อคำถามออกจากแบบทดสอบ
    """
    quiz = db.session.get(Quiz, quiz_id)
    if not quiz:
        return False, "Quiz not found.", 404

    is_owner = quiz.course and str(quiz.course.instructor_id) == str(user.user_id)
    is_admin = user.has_role("admin") or user.has_role("super_admin")
    if not (is_owner or is_admin):
        return False, "Access denied.", 403

    qq = QuizQuestion.query.filter_by(quiz_id=quiz_id, question_id=question_id).first()
    if not qq:
        return False, "Question not linked to this quiz.", 404

    try:
        db.session.delete(qq)
        question = db.session.get(Question, question_id)
        if question:
            db.session.delete(question)
        db.session.commit()
        return True, "Question deleted successfully.", 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error("Failed to delete question: %s", e, exc_info=True)
        return False, _internal_error_message(e), 500


def _internal_error_message(exc):
    """ข้อ 39: บันทึกรายละเอียดลง Log แต่ส่งข้อความที่ปลอดภัยให้ผู้ใช้"""
    from flask import current_app
    from app.utils.errors import INTERNAL_ERROR_MESSAGE
    current_app.logger.exception("Quiz service error: %s", exc)
    return INTERNAL_ERROR_MESSAGE


def _parse_quiz_conditions(data: dict):
    """ข้อ 37: ตรวจเงื่อนไขแบบทดสอบ คืน (ค่าที่ผ่านการตรวจ, ข้อความ Error)"""
    values = {}
    for key, label, kwargs in (
        ("max_attempts", "จำนวนครั้งที่ทำได้", {"integer": True, "min_value": 1, "max_value": 100}),
        ("time_limit_minutes", "เวลาทำแบบทดสอบ (นาที)", {"integer": True, "min_value": 1, "max_value": 600}),
        ("passing_score", "คะแนนผ่านขั้นต่ำ (%)", {"min_value": 0, "max_value": 100, "default": 70.0}),
    ):
        if key not in data:
            continue
        ok, value, message = parse_optional_number(data.get(key), label, **kwargs)
        if not ok:
            return None, message
        values[key] = value
    return values, None
