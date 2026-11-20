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
    if not classroom:
        return None, "Classroom not found.", 404

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

    title = data.get("title")
    if not title or not isinstance(title, str) or not title.strip():
        return None, "Quiz title is required.", 400

    description = data.get("description")
    new_quiz = Quiz(
        course_id=classroom_id,
        lesson_id=lesson_id,
        title=title.strip(),
        description=description.strip() if description else None,
    )

    try:
        db.session.add(new_quiz)
        db.session.flush()

        condition = QuizCondition(
            quiz_id=new_quiz.quiz_id,
            max_attempts=int(data.get("max_attempts")) if data.get("max_attempts") is not None and str(data.get("max_attempts")).strip() != "" else None,
            time_limit_minutes=int(data.get("time_limit_minutes")) if data.get("time_limit_minutes") is not None and str(data.get("time_limit_minutes")).strip() != "" else None,
            passing_score=float(data.get("passing_score")) if data.get("passing_score") is not None and str(data.get("passing_score")).strip() != "" else 70.0,
        )
        db.session.add(condition)
        db.session.commit()

        quiz_dict = new_quiz.to_dict(include_condition=True)
        return quiz_dict, "Quiz created successfully.", 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error("Failed to create quiz: %s", e, exc_info=True)
        return None, f"Failed to create quiz: {str(e)}", 500


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
        title = data.get("title")
        if not title or not isinstance(title, str) or not title.strip():
            return None, "Quiz title cannot be empty.", 400
        quiz.title = title.strip()

    if "description" in data:
        quiz.description = data.get("description")

    if not quiz.condition:
        quiz.condition = QuizCondition(quiz_id=quiz.quiz_id)
        db.session.add(quiz.condition)

    if "passing_score" in data:
        ps = data.get("passing_score")
        quiz.condition.passing_score = float(ps) if ps is not None and str(ps).strip() != "" else 70.0
    if "max_attempts" in data:
        ma = data.get("max_attempts")
        quiz.condition.max_attempts = int(ma) if ma is not None and str(ma).strip() != "" else None
    if "time_limit_minutes" in data:
        tl = data.get("time_limit_minutes")
        quiz.condition.time_limit_minutes = int(tl) if tl is not None and str(tl).strip() != "" else None

    try:
        db.session.commit()
        quiz_dict = quiz.to_dict(include_condition=True)
        return quiz_dict, "Quiz updated successfully.", 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error("Failed to update quiz: %s", e, exc_info=True)
        return None, f"Failed to update quiz: {str(e)}", 500


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
        return False, f"Failed to delete quiz: {str(e)}", 500


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

    question_text = data.get("question_text")
    if not question_text or not isinstance(question_text, str) or not question_text.strip():
        return None, "question_text is required.", 400

    q_type = data.get("question_type", "multiple_choice").lower().strip()
    if q_type not in ["multiple_choice", "true_false", "matching", "ordering", "image_choice"]:
        return None, f"Invalid question_type '{q_type}'.", 400

    explanation = data.get("explanation")
    image_url = data.get("image_url")
    pts_raw = data.get("points")
    points_val = float(pts_raw) if pts_raw is not None and str(pts_raw).strip() != "" else 1.0

    order_no = data.get("order_no")
    if order_no is None:
        last_qq = QuizQuestion.query.filter_by(quiz_id=quiz_id).order_by(QuizQuestion.order_no.desc()).first()
        order_no = (last_qq.order_no + 1) if last_qq else 1

    try:
        new_question = Question(
            question_text=question_text.strip(),
            question_type=q_type,
            image_url=str(image_url).strip() if (image_url and isinstance(image_url, str) and str(image_url).strip()) else None,
            points=points_val,
            explanation=explanation.strip() if explanation else None,
        )
        db.session.add(new_question)
        db.session.flush()

        qq_map = QuizQuestion(
            quiz_id=quiz_id,
            question_id=new_question.question_id,
            order_no=order_no,
        )
        db.session.add(qq_map)

        raw_options = data.get("options", [])
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
        return None, f"Failed to add question: {str(e)}", 500


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
        qt = data.get("question_text")
        if not qt or not isinstance(qt, str) or not qt.strip():
            return None, "question_text cannot be empty.", 400
        question.question_text = qt.strip()

    if "question_type" in data:
        q_type = data.get("question_type", "multiple_choice").lower().strip()
        if q_type not in ["multiple_choice", "true_false", "matching", "ordering", "image_choice"]:
            return None, f"Invalid question_type '{q_type}'.", 400
        question.question_type = q_type

    if "image_url" in data:
        img = data.get("image_url")
        question.image_url = str(img).strip() if (img and isinstance(img, str) and str(img).strip()) else None

    if "points" in data:
        pts = data.get("points")
        question.points = float(pts) if pts is not None and str(pts).strip() != "" else 1.0

    if "explanation" in data:
        question.explanation = data.get("explanation")

    if "options" in data:
        QuestionOption.query.filter_by(question_id=question_id).delete()
        raw_options = data.get("options", [])
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
        return None, f"Failed to update question: {str(e)}", 500


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
        return False, f"Failed to delete question: {str(e)}", 500
