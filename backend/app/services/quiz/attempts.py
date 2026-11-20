import uuid
import json
from datetime import datetime, timezone
from flask import current_app
from sqlalchemy.exc import IntegrityError
from app.extensions import db
from app.models.quiz import (
    Quiz,
    QuizQuestion,
    QuestionOption,
    QuizAttempt,
    QuizAnswer,
    QuizResult,
)
from app.models.user import User
from app.models.classroom import Lesson
from app.services.quiz.evaluation import (
    calculate_quiz_scores,
    evaluate_architecture_builder,
    evaluate_matching,
    evaluate_multiple_choice,
    evaluate_ordering,
    evaluate_scenario,
    evaluate_simulation,
    parse_matching_pair,
)
from app.services.quiz.timing import TIME_LIMIT_GRACE_SECONDS, check_quiz_attempt_time_limit, compute_time_difference_seconds


# =====================================================================
# attempts.py: ฝั่งผู้เรียนทำข้อสอบ
# - ตรวจสิทธิ์เข้าสอบ -> เริ่มสอบ -> ส่งคำตอบ (ตรวจ + บันทึกผล) -> ดูผลและเฉลย
# - ข้อมูลที่ส่งให้ผู้เรียนต้องไม่มีเฉลยก่อนส่งคำตอบ (get_quiz_details_for_student)
# (แยกออกมาจาก quiz_service.py เดิม โดยไม่เปลี่ยนตรรกะ)
# =====================================================================


def validate_user_quiz_access(quiz: Quiz, user: User) -> tuple[bool, str, int]:
    """
    ตรวจสอบสิทธิ์การเข้าถึงแบบทดสอบของผู้ใช้ (Phase 11: Security & Authorization)
    1. ผู้ใช้ต้องอยู่ในสถานะ Active
    2. Admin และ Super Admin มีสิทธิ์เสมอ
    3. Instructor เจ้าของคอร์สมีสิทธิ์
    4. นักเรียนต้องลงทะเบียนในคอร์ส (Enrolled Member) ที่ Quiz ผูกอยู่
    """
    if not user or user.status != "active":
        return False, "User account is inactive or not found.", 401

    if user.has_role("admin") or user.has_role("super_admin"):
        return True, "", 200

    course = quiz.course
    if not course and quiz.lesson:
        course = quiz.lesson.classroom

    # หาก Quiz ไม่ได้ผูกกับคอร์สใด ถือว่าเป็นแบบทดสอบสาธารณะสำหรับผู้ใช้ล็อกอิน
    if not course:
        return True, "", 200

    # ตรวจสอบ Instructor เจ้าของคอร์ส
    if str(course.instructor_id) == str(user.user_id):
        return True, "", 200

    # ตรวจสอบการลงทะเบียนของนักเรียน
    if course.has_member(user.user_id):
        return True, "", 200

    return False, "Access denied: you must be enrolled in this course to take the quiz.", 403


def start_quiz_attempt(quiz_id: uuid.UUID, user_id: uuid.UUID) -> tuple[dict | None, str, int]:
    """
    เริ่มทำข้อสอบ (Create QuizAttempt status='in_progress')
    - ตรวจสอบ max_attempts
    - หากมี attempt ที่ in_progress อยู่แล้ว จะ resume attempt เดิม (ไม่สร้างซ้ำโดยไม่จำเป็น)
    """
    quiz = db.session.get(Quiz, quiz_id)
    if not quiz:
        return None, "Quiz not found.", 404

    user = db.session.get(User, user_id)
    if not user:
        return None, "User not found.", 401

    has_access, err_msg, status_code = validate_user_quiz_access(quiz, user)
    if not has_access:
        return None, err_msg, status_code

    # PostgreSQL transaction-scoped advisory lock (Option B) for deterministic serialization per (quiz_id, user_id)
    if db.engine.dialect.name == "postgresql":
        lock_key = f"quiz_start:{quiz_id}:{user_id}"
        db.session.execute(
            db.text("SELECT pg_advisory_xact_lock(hashtext(:lock_key))"),
            {"lock_key": lock_key}
        )

    # ตรวจสอบ max_attempts จาก QuizCondition
    if quiz.condition and quiz.condition.max_attempts:
        completed_count = QuizAttempt.query.filter(
            QuizAttempt.quiz_id == quiz_id,
            QuizAttempt.user_id == user_id,
            QuizAttempt.status.in_(["completed", "submitted", "expired", "time_expired"]),
        ).count()

        if completed_count >= quiz.condition.max_attempts:
            return None, f"Maximum attempts reached ({quiz.condition.max_attempts} attempts allowed).", 400

    # หากมี Attempt ที่ค้างอยู่ (in_progress) ให้ส่งคืน attempt เดิมทันที (หากยังไม่หมดเวลา)
    existing_in_progress = QuizAttempt.query.filter_by(
        quiz_id=quiz_id,
        user_id=user_id,
        status="in_progress",
    ).order_by(QuizAttempt.started_at.desc()).first()

    if existing_in_progress:
        now_time = datetime.now(timezone.utc)
        time_limit_mins = quiz.condition.time_limit_minutes if quiz.condition else None
        is_expired, _, _ = check_quiz_attempt_time_limit(
            existing_in_progress.started_at,
            time_limit_mins,
            now_time=now_time,
            grace_seconds=TIME_LIMIT_GRACE_SECONDS,
        )
        if is_expired:
            existing_in_progress.status = "expired"
            existing_in_progress.submitted_at = now_time
            db.session.commit()

            # ตรวจสอบ max_attempts อีกครั้งหลังปิด attempt ที่หมดเวลา
            if quiz.condition and quiz.condition.max_attempts:
                completed_count = QuizAttempt.query.filter(
                    QuizAttempt.quiz_id == quiz_id,
                    QuizAttempt.user_id == user_id,
                    QuizAttempt.status.in_(["completed", "submitted", "expired", "time_expired"]),
                ).count()

                if completed_count >= quiz.condition.max_attempts:
                    return None, f"Maximum attempts reached ({quiz.condition.max_attempts} attempts allowed).", 400
        else:
            return existing_in_progress.to_dict(), "Resumed active quiz attempt.", 200

    # สร้าง Attempt ใหม่
    new_attempt = QuizAttempt(
        quiz_id=quiz_id,
        user_id=user_id,
        started_at=datetime.now(timezone.utc),
        status="in_progress",
    )

    try:
        db.session.add(new_attempt)
        db.session.commit()
        return new_attempt.to_dict(), "Quiz attempt started successfully.", 201
    except Exception:
        db.session.rollback()
        return None, "Failed to start quiz attempt.", 500


def submit_quiz_attempt(
    quiz_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: dict,
) -> tuple[dict | None, str, int]:
    """
    ส่งคำตอบและประมวลผลข้อสอบทั้งหมด (Phase 2 - Phase 7, Phase 9)
    คุณสมบัติสำคัญ:
    1. Validation ครบทุกรูปแบบ (Invalid Question, Choice, Duplicate Answer)
    2. Backend Source of Truth 100% (ไม่รับ score/is_correct จาก client)
    3. Duplicate Submission Guard (ส่งซ้ำคืน 409 Conflict)
    4. Database Transaction Atomicity: บันทึก Attempt, Answers, Result พร้อมกัน หรือ Rollback ทั้งหมด
    """
    quiz = db.session.get(Quiz, quiz_id)
    if not quiz:
        return None, "Quiz not found.", 404

    user = db.session.get(User, user_id)
    if not user:
        return None, "User not found.", 401

    has_access, err_msg, status_code = validate_user_quiz_access(quiz, user)
    if not has_access:
        return None, err_msg, status_code

    if not isinstance(payload, dict):
        return None, "Invalid payload format. Must be a JSON object.", 400

    # ตรวจสอบ Attempt ID (Mandatory: ป้องกัน Race Condition และ Implicit Attempt Creation)
    raw_attempt_id = payload.get("attempt_id")
    if not raw_attempt_id:
        return None, "Missing attempt_id. An active quiz attempt ID is required to submit.", 400

    try:
        att_uuid = uuid.UUID(str(raw_attempt_id))
    except (ValueError, TypeError):
        return None, f"Invalid attempt ID format '{raw_attempt_id}'.", 400

    # PostgreSQL Row-Level Locking (Fix A): Lock QuizAttempt record BEFORE checking status
    attempt_query = db.session.query(QuizAttempt).filter_by(attempt_id=att_uuid)
    if db.engine.dialect.name == "postgresql":
        attempt_query = attempt_query.with_for_update()
    attempt = attempt_query.first()

    if not attempt:
        return None, "Quiz attempt not found.", 404

    # ตรวจสอบ Ownership ของ Attempt
    if str(attempt.user_id) != str(user_id):
        return None, "Access denied: you do not own this quiz attempt.", 403

    if str(attempt.quiz_id) != str(quiz_id):
        return None, "Attempt does not belong to this quiz.", 400

    # ป้องกัน Duplicate Submission (UAT-QUIZ-016 & Fix A) ตรวจสอบหลังได้รับ Row Lock
    if attempt.status in ["completed", "submitted"]:
        return None, "This attempt has already been submitted.", 409

    # ป้องกันการส่งคำตอบของเซสชันที่หมดเวลา (Expired Attempt)
    if attempt.status in ["expired", "time_expired"]:
        return None, "This quiz attempt has expired and cannot be submitted.", 400

    # =================================================================
    # Server-Side Time Limit Enforcement (Single Source of Truth)
    # =================================================================
    now_time = datetime.now(timezone.utc)
    time_limit_mins = quiz.condition.time_limit_minutes if quiz.condition else None
    is_expired, time_spent_secs, allowed_total_secs = check_quiz_attempt_time_limit(
        attempt.started_at,
        time_limit_mins,
        now_time=now_time,
        grace_seconds=TIME_LIMIT_GRACE_SECONDS,
    )

    if is_expired:
        try:
            attempt.submitted_at = now_time
            attempt.status = "expired"
            db.session.commit()
        except Exception:
            db.session.rollback()
        return None, "Time limit exceeded for this quiz attempt.", 400

    # ดึงรายการคำถามทั้งหมดของ Quiz เรียงตาม order_no
    quiz_questions = (
        QuizQuestion.query.filter_by(quiz_id=quiz_id)
        .order_by(QuizQuestion.order_no.asc())
        .all()
    )

    if not quiz_questions:
        return None, "This quiz currently has no questions.", 400

    quiz_question_ids = {str(qq.question_id): qq.question for qq in quiz_questions}

    # แปลงคำตอบที่ส่งมาเป็น Dictionary ตาม question_id
    raw_answers = payload.get("answers")
    user_answers_map = {}

    if isinstance(raw_answers, list):
        for ans_item in raw_answers:
            if not isinstance(ans_item, dict):
                return None, "Invalid item format in answers list.", 400
            q_id = ans_item.get("question_id") or ans_item.get("id")
            if not q_id:
                return None, "Missing question_id in one of the submitted answers.", 400
            q_id_str = str(q_id).strip()

            # ตรวจจับข้อคำถามซ้ำใน Payload (Duplicate Answer)
            if q_id_str in user_answers_map:
                return None, f"Duplicate answer provided for question '{q_id_str}'.", 400

            user_answers_map[q_id_str] = ans_item

    elif isinstance(raw_answers, dict):
        for q_id, ans_val in raw_answers.items():
            if isinstance(ans_val, dict):
                user_answers_map[str(q_id).strip()] = ans_val
            else:
                user_answers_map[str(q_id).strip()] = {"option_id": ans_val}
    elif raw_answers is None:
        user_answers_map = {}
    else:
        return None, "Invalid 'answers' format. Must be an array or object.", 400

    # ตรวจสอบว่าคำถามที่ส่งมา เป็นคำถามของ Quiz นี้ทั้งหมดหรือไม่
    for submitted_qid in user_answers_map.keys():
        try:
            uuid.UUID(submitted_qid)
        except (ValueError, TypeError):
            return None, f"Invalid question ID format '{submitted_qid}'.", 400

        if submitted_qid not in quiz_question_ids:
            return None, f"Question '{submitted_qid}' does not belong to this quiz.", 400

    # =================================================================
    # ประมวลผลคำตอบทีละข้อ (Evaluation Engine)
    # =================================================================
    question_evaluations = []
    answers_to_save = []

    for qq in quiz_questions:
        q_obj = qq.question
        q_id_str = str(q_obj.question_id)
        user_ans = user_answers_map.get(q_id_str)
        q_weight = float(q_obj.points) if getattr(q_obj, "points", None) is not None else 1.0

        is_correct = False
        earned_score = 0.0
        saved_text = None
        saved_option_id = None
        eval_err = None

        q_type = (q_obj.question_type or "multiple_choice").lower().strip()

        if q_type in ["multiple_choice", "true_false", "image_choice"]:
            is_correct, earned_score, saved_text, saved_option_id, eval_err = (
                evaluate_multiple_choice(q_obj, user_ans, q_weight)
            )
        elif q_type == "scenario":
            is_correct, earned_score, saved_text, saved_option_id, eval_err = (
                evaluate_scenario(q_obj, user_ans, q_weight)
            )
        elif q_type == "simulation":
            is_correct, earned_score, saved_text, saved_option_id, eval_err = (
                evaluate_simulation(q_obj, user_ans, q_weight)
            )
        elif q_type == "architecture_builder":
            is_correct, earned_score, saved_text, saved_option_id, eval_err = (
                evaluate_architecture_builder(q_obj, user_ans, q_weight)
            )
        elif q_type == "matching":
            is_correct, earned_score, saved_text, saved_option_id, eval_err = (
                evaluate_matching(q_obj, user_ans, q_weight)
            )
        elif q_type == "ordering":
            is_correct, earned_score, saved_text, saved_option_id, eval_err = (
                evaluate_ordering(q_obj, user_ans, q_weight)
            )
        else:
            is_correct, earned_score, saved_text, saved_option_id, eval_err = (
                evaluate_multiple_choice(q_obj, user_ans, q_weight)
            )

        if eval_err:
            return None, eval_err, 400

        quiz_answer_record = QuizAnswer(
            attempt_id=attempt.attempt_id,
            question_id=q_obj.question_id,
            option_id=saved_option_id,
            answer_text=saved_text,
            is_correct=is_correct,
        )
        answers_to_save.append(quiz_answer_record)

        question_evaluations.append({
            "question_id": q_id_str,
            "question_text": q_obj.question_text,
            "question_type": q_type,
            "score": earned_score,
            "max_score": q_weight,
            "is_correct": is_correct,
            "user_answer": saved_text,
            "explanation": q_obj.explanation,
        })

    # คำนวณคะแนนรวมและสถานะ Pass/Fail
    score_summary = calculate_quiz_scores(question_evaluations, quiz.condition)

    # =================================================================
    # บันทึกข้อมูลลงฐานข้อมูล (Database Transaction Atomicity)
    # =================================================================
    try:
        now_time = datetime.now(timezone.utc)
        attempt.submitted_at = now_time
        attempt.status = "completed"

        # ลบคำตอบเดิมหากมี และบันทึกคำตอบใหม่
        QuizAnswer.query.filter_by(attempt_id=attempt.attempt_id).delete()
        for ans in answers_to_save:
            db.session.add(ans)

        # บันทึกหรืออัปเดต QuizResult
        result = QuizResult.query.filter_by(attempt_id=attempt.attempt_id).first()
        if not result:
            result = QuizResult(
                attempt_id=attempt.attempt_id,
                user_id=user_id,
                score=score_summary["score"],
                total_score=score_summary["total_score"],
                percentage=score_summary["percentage"],
                is_passed=score_summary["is_passed"],
                feedback=score_summary["feedback"],
                created_at=now_time,
            )
            db.session.add(result)
        else:
            result.score = score_summary["score"]
            result.total_score = score_summary["total_score"]
            result.percentage = score_summary["percentage"]
            result.is_passed = score_summary["is_passed"]
            result.feedback = score_summary["feedback"]
            result.created_at = now_time

        # Update Progress Tracking (Module 4) & Skill Tree Integration (Phase 8)
        unlocked_skill_names = []
        passed_skill_names = []
        skills_to_review = []
        concepts_to_review = []

        try:
            from app.models.progress import Skill, UserSkill, LessonProgress, LearningProgress

            all_quiz_skills = set()
            for q_eval in question_evaluations:
                q_id = q_eval["question_id"]
                q_obj = quiz_question_ids[q_id]
                s_name = getattr(q_obj, "skill", None)
                if s_name:
                    for sk in s_name.split(","):
                        sk_strip = sk.strip().upper()
                        if sk_strip:
                            all_quiz_skills.add(sk_strip)
                            if q_eval["is_correct"]:
                                passed_skill_names.append(sk_strip)
                            else:
                                skills_to_review.append(sk_strip)
                if not q_eval["is_correct"] and getattr(q_obj, "concept", None):
                    concepts_to_review.append(q_obj.concept)

            passed_skill_names = list(set(passed_skill_names))
            skills_to_review = list(set(skills_to_review))
            concepts_to_review = list(set(concepts_to_review))

            if score_summary["is_passed"]:
                for sk_name in all_quiz_skills:
                    skill_rec = Skill.query.filter_by(name=sk_name).first()
                    if not skill_rec:
                        skill_rec = Skill(
                            name=sk_name,
                            category="IoT",
                            description=f"IoT Skill: {sk_name}"
                        )
                        db.session.add(skill_rec)
                        db.session.flush()

                    user_sk = UserSkill.query.filter_by(
                        user_id=user_id,
                        skill_id=skill_rec.skill_id
                    ).first()
                    if not user_sk:
                        user_sk = UserSkill(
                            user_id=user_id,
                            skill_id=skill_rec.skill_id,
                            level=1,
                            is_unlocked=True,
                            unlocked_at=now_time
                        )
                        db.session.add(user_sk)
                        unlocked_skill_names.append(sk_name)
                    elif not user_sk.is_unlocked:
                        user_sk.is_unlocked = True
                        user_sk.unlocked_at = now_time
                        unlocked_skill_names.append(sk_name)
                    else:
                        unlocked_skill_names.append(sk_name)

                if quiz.lesson_id:
                    l_prog = LessonProgress.query.filter_by(
                        user_id=user_id,
                        lesson_id=quiz.lesson_id
                    ).first()
                    if not l_prog:
                        l_prog = LessonProgress(
                            user_id=user_id,
                            lesson_id=quiz.lesson_id,
                            status="completed",
                            completed_at=now_time
                        )
                        db.session.add(l_prog)
                    else:
                        l_prog.status = "completed"
                        l_prog.completed_at = now_time
                    db.session.flush()

                # Dynamic Course Progress Calculation (Dual-Pointer: direct course_id or via lesson -> chapter -> course)
                target_course_id = quiz.course_id
                if not target_course_id and quiz.lesson:
                    target_course_id = (
                        quiz.lesson.classroom_id
                        or (quiz.lesson.chapter.course_id if quiz.lesson.chapter else None)
                    )

                if target_course_id:
                    from app.models.classroom import Chapter
                    course_lessons = Lesson.query.filter(
                        (Lesson.classroom_id == target_course_id) |
                        (Lesson.chapter_id.in_(
                            db.session.query(Chapter.chapter_id).filter_by(course_id=target_course_id)
                        ))
                    ).all()

                    total_lessons = len(course_lessons)
                    if total_lessons > 0:
                        lesson_ids = [l.lesson_id for l in course_lessons]
                        completed_count = LessonProgress.query.filter(
                            LessonProgress.user_id == user_id,
                            LessonProgress.lesson_id.in_(lesson_ids),
                            LessonProgress.status == "completed"
                        ).count()
                        progress_pct = round((completed_count / total_lessons) * 100, 1)
                    else:
                        progress_pct = 0.0

                    c_prog = LearningProgress.query.filter_by(
                        user_id=user_id,
                        course_id=target_course_id
                    ).first()

                    is_fully_completed = (progress_pct >= 100.0)
                    new_status = "completed" if is_fully_completed else "in_progress"

                    if not c_prog:
                        c_prog = LearningProgress(
                            user_id=user_id,
                            course_id=target_course_id,
                            status=new_status,
                            progress_percent=progress_pct,
                            completed_at=now_time if is_fully_completed else None
                        )
                        db.session.add(c_prog)
                    else:
                        c_prog.progress_percent = progress_pct
                        c_prog.status = new_status
                        if is_fully_completed and not c_prog.completed_at:
                            c_prog.completed_at = now_time
        except Exception as exc:
            current_app.logger.warning(
                "Quiz secondary side effect (skills/progress) failed for attempt %s, user %s: %s",
                attempt.attempt_id,
                user_id,
                exc,
                exc_info=True,
            )

        # บันทึก LearningActivity ใน Module 4 (ถ้ามี)
        try:
            from app.models.progress import LearningActivity
            activity = LearningActivity(
                user_id=user_id,
                activity_type="quiz_completed",
                activity_data={
                    "quiz_id": str(quiz.quiz_id),
                    "attempt_id": str(attempt.attempt_id),
                    "score": score_summary["score"],
                    "percentage": score_summary["percentage"],
                    "is_passed": score_summary["is_passed"],
                    "unlocked_skills": unlocked_skill_names,
                },
                created_at=now_time,
            )
            db.session.add(activity)
        except Exception as exc:
            current_app.logger.warning(
                "Quiz secondary side effect (learning_activity) failed for attempt %s, user %s: %s",
                attempt.attempt_id,
                user_id,
                exc,
                exc_info=True,
            )

        db.session.commit()

        # Build reviews list for frontend immediate answer feedback
        reviews = []
        for q_eval in question_evaluations:
            q_id = q_eval["question_id"]
            q_obj = quiz_question_ids[q_id]
            q_type = (q_obj.question_type or "multiple_choice").lower()
            options = QuestionOption.query.filter_by(question_id=q_obj.question_id).order_by(QuestionOption.order_no.asc()).all()
            correct_display = None
            if q_type in ["multiple_choice", "true_false", "image_choice", "scenario"]:
                opts = [opt.option_text or opt.image_url for opt in options if opt.is_correct]
                correct_display = ", ".join(opts) if opts else None
            elif q_type == "simulation":
                corr_opts = [opt.option_text for opt in options if opt.is_correct]
                if corr_opts:
                    try:
                        p = json.loads(corr_opts[0])
                        if "rule" in p:
                            correct_display = p["rule"]
                        elif "expected_output" in p:
                            correct_display = ", ".join(f"{k} -> {v}" for k, v in p["expected_output"].items())
                        else:
                            correct_display = corr_opts[0]
                    except Exception:
                        correct_display = corr_opts[0]
            elif q_type == "architecture_builder":
                corr_opts = [opt.option_text for opt in options if opt.is_correct]
                if corr_opts:
                    try:
                        p = json.loads(corr_opts[0])
                        conns = p.get("required_connections") or []
                        arrows = [f"{c[0]} -> {c[1]}" for c in conns]
                        correct_display = arrows if arrows else str(corr_opts[0])
                    except Exception:
                        correct_display = corr_opts[0]
            elif q_type == "matching":
                pairs = []
                for opt in options:
                    p = parse_matching_pair(opt.option_text, opt.image_url)
                    if p:
                        pairs.append(f"{p[0]} -> {p[1]}")
                correct_display = pairs
            elif q_type == "ordering":
                correct_display = [opt.option_text for opt in options]

            reviews.append({
                "question_id": q_id,
                "question_text": q_obj.question_text,
                "question_type": q_type,
                "scenario": getattr(q_obj, "scenario", None),
                "image_url": q_obj.image_url,
                "user_answer": q_eval["user_answer"],
                "correct_answer": correct_display,
                "is_correct": q_eval["is_correct"],
                "score": q_eval["score"],
                "max_score": q_eval["max_score"],
                "explanation": q_obj.explanation,
            })

        completed_count = QuizAttempt.query.filter(
            QuizAttempt.quiz_id == quiz.quiz_id,
            QuizAttempt.user_id == user_id,
            QuizAttempt.status.in_(["completed", "submitted", "expired", "time_expired"]),
        ).count()
        max_att = quiz.condition.max_attempts if quiz.condition else None
        remaining_att = max(0, max_att - completed_count) if max_att is not None else None

        correct_count = sum(1 for q in question_evaluations if q["is_correct"])
        wrong_count = sum(1 for q in question_evaluations if not q["is_correct"])
        time_spent_secs = compute_time_difference_seconds(now_time, attempt.started_at)

        recommendation = (
            "ยินดีด้วย! คุณผ่านเกณฑ์การประเมิน สามารถปลดล็อกและไปเรียนรู้บทเรียนหรือทำภารกิจถัดไปได้ทันที"
            if score_summary["is_passed"]
            else "แนะนำให้ทบทวนบทเรียนและทำความเข้าใจแนวคิดที่ยังไม่ผ่าน ก่อนเริ่มทำแบบทดสอบใหม่อีกครั้ง"
        )

        response_data = {
            "message": "ส่งแบบทดสอบและประมวลผลสำเร็จ",
            "attempt_id": str(attempt.attempt_id),
            "quiz_id": str(quiz.quiz_id),
            "user_id": str(user_id),
            "score": score_summary["score"],
            "total_score": score_summary["total_score"],
            "percentage": score_summary["percentage"],
            "passing_score": score_summary["passing_score"],
            "is_passed": score_summary["is_passed"],
            "passed": score_summary["is_passed"],
            "feedback": score_summary["feedback"],
            "submitted_at": now_time.isoformat(),
            "questions_evaluated": len(question_evaluations),
            "total_questions": len(question_evaluations),
            "correct_count": correct_count,
            "wrong_count": wrong_count,
            "time_spent": time_spent_secs,
            "time_used": time_spent_secs,
            "attempt_number": completed_count,
            "attempts_count": completed_count,
            "max_attempts": max_att,
            "remaining_attempts": remaining_att,
            "reviews": reviews,
            "correct_answers": [r["correct_answer"] for r in reviews],
            "user_answers": [r["user_answer"] for r in reviews],
            "unlocked_skills": unlocked_skill_names,
            "passed_skills": passed_skill_names,
            "skills_to_review": skills_to_review,
            "concepts_to_review": concepts_to_review,
            "next_recommendation": recommendation,
        }
        return response_data, "Submission processed successfully.", 200

    except IntegrityError:
        db.session.rollback()
        return None, "This attempt has already been submitted.", 409
    except Exception as e:
        db.session.rollback()
        return None, f"Database transaction failed: {str(e)}", 500


def get_quiz_result_for_user(
    quiz_id: uuid.UUID,
    user_id: uuid.UUID,
    attempt_id: uuid.UUID | None = None,
) -> tuple[dict | None, str, int]:
    """
    ดึงผลคะแนนการทำแบบทดสอบ (Phase 8 & Phase 10)
    - รองรับทั้งระบุ attempt_id เจาะจง และดึง latest completed attempt
    - ตรวจสอบสิทธิ์ Ownership และ Role อย่างเคร่งครัด
    """
    quiz = db.session.get(Quiz, quiz_id)
    if not quiz:
        return None, "Quiz not found.", 404

    user = db.session.get(User, user_id)
    if not user:
        return None, "User not found.", 401

    if attempt_id:
        attempt = db.session.get(QuizAttempt, attempt_id)
        if not attempt:
            return None, "Quiz attempt not found.", 404

        is_owner = str(attempt.user_id) == str(user_id)
        is_admin = user.has_role("admin") or user.has_role("super_admin")
        is_instructor = (
            user.has_role("instructor")
            and quiz.course
            and str(quiz.course.instructor_id) == str(user_id)
        )

        if not (is_owner or is_admin or is_instructor):
            return None, "Access denied: you do not have permission to view this attempt.", 403

        if str(attempt.quiz_id) != str(quiz_id):
            return None, "Attempt does not match specified quiz.", 400

        result = attempt.result
        if not result:
            return None, "Result not found for this attempt.", 404

        passing_score = 70.0
        if quiz.condition and quiz.condition.passing_score is not None:
            passing_score = float(quiz.condition.passing_score)

        return {
            "result_id": str(result.result_id),
            "attempt_id": str(attempt.attempt_id),
            "quiz_id": str(quiz.quiz_id),
            "user_id": str(attempt.user_id),
            "score": float(result.score),
            "total_score": float(result.total_score),
            "percentage": float(result.percentage),
            "passing_score": passing_score,
            "is_passed": result.is_passed,
            "feedback": result.feedback,
            "started_at": attempt.started_at.isoformat() if attempt.started_at else None,
            "submitted_at": attempt.submitted_at.isoformat() if attempt.submitted_at else None,
            "status": attempt.status,
        }, "Result retrieved successfully.", 200

    else:
        latest_attempt = (
            QuizAttempt.query.filter_by(quiz_id=quiz_id, user_id=user_id)
            .filter(QuizAttempt.status.in_(["completed", "submitted"]))
            .order_by(QuizAttempt.submitted_at.desc())
            .first()
        )

        if not latest_attempt:
            return None, "No completed quiz attempt found for this user.", 404

        result = latest_attempt.result
        if not result:
            return None, "Result not found for this attempt.", 404

        passing_score = 70.0
        if quiz.condition and quiz.condition.passing_score is not None:
            passing_score = float(quiz.condition.passing_score)

        ans_list = QuizAnswer.query.filter_by(attempt_id=latest_attempt.attempt_id).all()
        corr_cnt = sum(1 for a in ans_list if a.is_correct)
        wrng_cnt = sum(1 for a in ans_list if not a.is_correct)
        total_q = len(ans_list)
        time_used_secs = compute_time_difference_seconds(latest_attempt.submitted_at, latest_attempt.started_at)

        return {
            "result_id": str(result.result_id),
            "attempt_id": str(latest_attempt.attempt_id),
            "quiz_id": str(quiz.quiz_id),
            "user_id": str(user_id),
            "score": float(result.score),
            "total_score": float(result.total_score),
            "percentage": float(result.percentage),
            "passing_score": passing_score,
            "is_passed": result.is_passed,
            "passed": result.is_passed,
            "feedback": result.feedback,
            "started_at": latest_attempt.started_at.isoformat() if latest_attempt.started_at else None,
            "submitted_at": latest_attempt.submitted_at.isoformat() if latest_attempt.submitted_at else None,
            "status": latest_attempt.status,
            "correct_count": corr_cnt,
            "wrong_count": wrng_cnt,
            "total_questions": total_q,
            "time_spent": time_used_secs,
            "time_used": time_used_secs,
        }, "Latest result retrieved successfully.", 200


def get_quiz_answer_review(
    quiz_id: uuid.UUID,
    user_id: uuid.UUID,
    attempt_id: uuid.UUID | None = None,
) -> tuple[dict | None, str, int]:
    """
    ดึงข้อมูลเฉลยและทบทวนคำตอบ (Phase 8: Answer Review / เฉลย)
    - ต้องส่งข้อสอบแล้วเท่านั้น (`status: completed`)
    - ไม่อนุญาตให้เปิดเฉลยขณะทำข้อสอบ
    - ตรวจสอบสิทธิ์ Ownership ป้องกัน IDOR
    """
    quiz = db.session.get(Quiz, quiz_id)
    if not quiz:
        return None, "Quiz not found.", 404

    user = db.session.get(User, user_id)
    if not user:
        return None, "User not found.", 401

    if attempt_id:
        attempt = db.session.get(QuizAttempt, attempt_id)
    else:
        attempt = (
            QuizAttempt.query.filter_by(quiz_id=quiz_id, user_id=user_id)
            .filter(QuizAttempt.status.in_(["completed", "submitted"]))
            .order_by(QuizAttempt.submitted_at.desc())
            .first()
        )

    if not attempt:
        return None, "No completed quiz attempt found for this user. Please submit the quiz before requesting answer review.", 404

    # ตรวจสอบสิทธิ์ Ownership
    is_owner = str(attempt.user_id) == str(user_id)
    is_admin = user.has_role("admin") or user.has_role("super_admin")
    is_instructor = (
        user.has_role("instructor")
        and quiz.course
        and str(quiz.course.instructor_id) == str(user_id)
    )

    if not (is_owner or is_admin or is_instructor):
        return None, "Access denied: you do not have permission to view this review.", 403

    if str(attempt.quiz_id) != str(quiz_id):
        return None, "Attempt does not belong to specified quiz.", 400

    # ป้องกันการเปิดเฉลยก่อนส่งข้อสอบ
    if attempt.status not in ["completed", "submitted"]:
        return None, "Answer review is only available after submitting the quiz.", 400

    answers = QuizAnswer.query.filter_by(attempt_id=attempt.attempt_id).all()
    answers_by_qid = {str(ans.question_id): ans for ans in answers}

    quiz_questions = (
        QuizQuestion.query.filter_by(quiz_id=quiz_id)
        .order_by(QuizQuestion.order_no.asc())
        .all()
    )

    reviews = []
    for qq in quiz_questions:
        q_obj = qq.question
        q_id_str = str(q_obj.question_id)
        ans_obj = answers_by_qid.get(q_id_str)

        user_answer_text = ans_obj.answer_text if ans_obj else None
        is_correct = bool(ans_obj.is_correct) if ans_obj else False

        correct_answer_display = None
        q_type = (q_obj.question_type or "multiple_choice").lower()

        options = (
            QuestionOption.query.filter_by(question_id=q_obj.question_id)
            .order_by(QuestionOption.order_no.asc())
            .all()
        )

        if q_type in ["multiple_choice", "true_false", "image_choice", "scenario"]:
            correct_opts = [opt.option_text or opt.image_url for opt in options if opt.is_correct]
            correct_answer_display = ", ".join(correct_opts) if correct_opts else None
        elif q_type == "simulation":
            corr_opts = [opt.option_text for opt in options if opt.is_correct]
            if corr_opts:
                try:
                    p = json.loads(corr_opts[0])
                    if "rule" in p:
                        correct_answer_display = p["rule"]
                    elif "expected_output" in p:
                        correct_answer_display = ", ".join(f"{k} -> {v}" for k, v in p["expected_output"].items())
                    else:
                        correct_answer_display = corr_opts[0]
                except Exception:
                    correct_answer_display = corr_opts[0]
        elif q_type == "architecture_builder":
            corr_opts = [opt.option_text for opt in options if opt.is_correct]
            if corr_opts:
                try:
                    p = json.loads(corr_opts[0])
                    conns = p.get("required_connections") or []
                    arrows = [f"{c[0]} -> {c[1]}" for c in conns]
                    correct_answer_display = arrows if arrows else str(corr_opts[0])
                except Exception:
                    correct_answer_display = corr_opts[0]
        elif q_type == "matching":
            pairs = []
            for opt in options:
                p = parse_matching_pair(opt.option_text, opt.image_url)
                if p:
                    pairs.append(f"{p[0]} -> {p[1]}")
            correct_answer_display = pairs
        elif q_type == "ordering":
            correct_answer_display = [opt.option_text for opt in options]

        reviews.append({
            "question_id": q_id_str,
            "order_no": qq.order_no,
            "question_text": q_obj.question_text,
            "question_type": q_type,
            "scenario": getattr(q_obj, "scenario", None),
            "image_url": q_obj.image_url,
            "user_answer": user_answer_text,
            "correct_answer": correct_answer_display,
            "is_correct": is_correct,
            "score": float(q_obj.points) if is_correct else 0.0,
            "max_score": float(q_obj.points) if q_obj.points else 1.0,
            "explanation": q_obj.explanation,
        })

    result = attempt.result
    corr_cnt = sum(1 for r in reviews if r["is_correct"])
    wrng_cnt = sum(1 for r in reviews if not r["is_correct"])
    time_used_secs = compute_time_difference_seconds(attempt.submitted_at, attempt.started_at)

    return {
        "quiz_id": str(quiz.quiz_id),
        "quiz_title": quiz.title,
        "attempt_id": str(attempt.attempt_id),
        "score": float(result.score) if result else 0.0,
        "total_score": float(result.total_score) if result else 0.0,
        "percentage": float(result.percentage) if result else 0.0,
        "is_passed": result.is_passed if result else False,
        "passed": result.is_passed if result else False,
        "submitted_at": attempt.submitted_at.isoformat() if attempt.submitted_at else None,
        "correct_count": corr_cnt,
        "wrong_count": wrng_cnt,
        "total_questions": len(reviews),
        "time_spent": time_used_secs,
        "time_used": time_used_secs,
        "reviews": reviews,
    }, "Answer review retrieved successfully.", 200


def get_quiz_details_for_student(quiz_id: uuid.UUID, user_id: uuid.UUID) -> tuple[dict | None, str, int]:
    """
    ดึงข้อมูลข้อสอบสำหรับผู้เรียน (Zero Information Leakage)
    มาตรการความปลอดภัย:
    1. Multiple Choice: ซ่อน `is_correct` 100%
    2. Ordering: ซ่อน `order_no` และสลับลำดับตัวเลือก (เรียงตามชื่อหรือ ID) เพื่อไม่ให้ตำแหน่งลำดับรั่วไหล
    3. Matching: สลับ/เรียงลำดับฝั่งขวา (alphabetical) เพื่อไม่ให้ตำแหน่งตรงกับฝั่งซ้าย
    4. ห้ามส่ง `explanation` ให้ผู้เรียนก่อนส่งข้อสอบ
    """
    quiz = db.session.get(Quiz, quiz_id)
    if not quiz:
        return None, "Quiz not found.", 404

    user = db.session.get(User, user_id)
    if not user:
        return None, "User not found.", 401

    has_access, err_msg, status_code = validate_user_quiz_access(quiz, user)
    if not has_access:
        return None, err_msg, status_code

    quiz_data = quiz.to_dict(include_condition=True)

    completed_count = QuizAttempt.query.filter(
        QuizAttempt.quiz_id == quiz_id,
        QuizAttempt.user_id == user_id,
        QuizAttempt.status.in_(["completed", "submitted", "expired", "time_expired"]),
    ).count()
    max_att = quiz.condition.max_attempts if quiz.condition else None
    remaining_attempts = max(0, max_att - completed_count) if max_att is not None else None
    can_attempt = (max_att is None or completed_count < max_att)

    quiz_data["attempts_count"] = completed_count
    quiz_data["max_attempts"] = max_att
    quiz_data["remaining_attempts"] = remaining_attempts
    quiz_data["can_attempt"] = can_attempt

    quiz_questions = (
        QuizQuestion.query.filter_by(quiz_id=quiz_id)
        .order_by(QuizQuestion.order_no.asc())
        .all()
    )

    questions_data = []
    for qq in quiz_questions:
        q_obj = qq.question
        q_type = (q_obj.question_type or "multiple_choice").lower()

        raw_options = QuestionOption.query.filter_by(question_id=q_obj.question_id).all()

        sanitized_options = []
        matching_left_items = []
        matching_right_items = []

        if q_type == "matching":
            for opt in raw_options:
                pair = parse_matching_pair(opt.option_text, opt.image_url)
                if pair:
                    matching_left_items.append(pair[0])
                    matching_right_items.append(pair[1])
            # ป้องกัน Information Leakage: เรียง right_items ตามตัวอักษรเพื่อไม่ให้ตรงกับ left_items
            matching_right_items = sorted(list(set(matching_right_items)))

        elif q_type == "ordering":
            # ป้องกัน Information Leakage ใน Ordering:
            # 1. ห้ามใส่ `order_no` ใน Option เด็ดขาด
            # 2. นำ Option มาเรียงตามตัวอักษรของข้อความ เพื่อไม่ให้ส่งเฉลยในลำดับที่ถูกต้องไปให้ผู้เรียน
            sorted_opts = sorted(raw_options, key=lambda o: (o.option_text or "").lower())
            for opt in sorted_opts:
                sanitized_options.append({
                    "option_id": str(opt.option_id),
                    "option_text": opt.option_text,
                    "image_url": opt.image_url,
                    # จงใจไม่ส่ง order_no และ is_correct เพื่อป้องกันข้อสอบรั่วไหล
                })
        elif q_type in ["simulation", "architecture_builder"]:
            # กรองตัวเลือกไม่ส่ง rule/answer spec ภายในที่เป็นเฉลยข้อสอบออกไป
            for opt in raw_options:
                opt_str = (opt.option_text or "").strip()
                if opt_str.startswith('{"required_') or opt_str.startswith('{"test_cases') or opt_str.startswith('{"expected_') or opt_str.startswith('{"rule"'):
                    continue
                sanitized_options.append({
                    "option_id": str(opt.option_id),
                    "option_text": opt.option_text,
                    "image_url": opt.image_url,
                })
        else:
            # Multiple Choice / Image Choice / Scenario: ส่ง order_no สำหรับ UI layout ได้ แต่ห้ามส่ง is_correct
            sorted_opts = sorted(raw_options, key=lambda o: o.order_no)
            for opt in sorted_opts:
                sanitized_options.append({
                    "option_id": str(opt.option_id),
                    "option_text": opt.option_text,
                    "order_no": opt.order_no,
                    "image_url": opt.image_url,
                    # จงใจไม่ส่ง is_correct
                })

        q_item = {
            "question_id": str(q_obj.question_id),
            "order_no": qq.order_no,
            "question_text": q_obj.question_text,
            "question_type": q_type,
            "image_url": q_obj.image_url,
            "points": float(q_obj.points) if getattr(q_obj, "points", None) is not None else 1.0,
            "scenario": getattr(q_obj, "scenario", None),
            "difficulty": getattr(q_obj, "difficulty", None),
            "skill": getattr(q_obj, "skill", None),
            "concept": getattr(q_obj, "concept", None),
            "learning_objective": getattr(q_obj, "learning_objective", None),
            "chapter": getattr(q_obj, "chapter", None),
            "episode": getattr(q_obj, "episode", None),
            # ไม่ส่ง explanation ก่อนส่งข้อสอบ (Zero Information Leakage)
        }

        if q_type == "matching":
            q_item["left_items"] = matching_left_items
            q_item["right_items"] = matching_right_items
        elif q_type == "simulation":
            q_item["options"] = sanitized_options
            q_item["simulation_spec"] = {
                "inputs": [
                    {"name": "soil_moisture", "label": "Soil Moisture", "unit": "%", "min": 0, "max": 100, "default": 18},
                    {"name": "temperature", "label": "Temperature", "unit": "°C", "min": 0, "max": 60, "default": 32},
                    {"name": "humidity", "label": "Humidity", "unit": "%", "min": 0, "max": 100, "default": 65},
                    {"name": "water_level", "label": "Water Level", "unit": "%", "min": 0, "max": 100, "default": 70},
                    {"name": "presence", "label": "Presence", "type": "boolean", "default": True},
                    {"name": "light_status", "label": "Light Status", "states": ["ON", "OFF"], "default": "ON"},
                    {"name": "pump_status", "label": "Pump Status", "states": ["ON", "OFF"], "default": "OFF"}
                ],
                "operators": ["<", ">", "<=", ">=", "==", "AND", "OR", "IF", "THEN"],
                "outputs": ["Pump ON", "Pump OFF", "Light ON", "Light OFF", "Alert", "Notification", "System Status"]
            }
        elif q_type == "architecture_builder":
            q_item["options"] = sanitized_options
            q_item["palette"] = [
                "Physical World", "Sensor", "ESP32", "Wi-Fi", "BLE", "LoRaWAN",
                "4G/5G", "MQTT", "IoT Platform", "Database", "Dashboard",
                "Rule Engine", "Actuator", "Analytics", "AI", "Alert", "Human"
            ]
        else:
            q_item["options"] = sanitized_options

        questions_data.append(q_item)

    quiz_data["questions"] = questions_data
    return quiz_data, "Quiz details retrieved successfully.", 200
