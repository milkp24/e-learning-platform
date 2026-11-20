# =====================================================================
# app/services/quiz: บริการระบบแบบทดสอบ (เดิมคือไฟล์ quiz_service.py ไฟล์เดียว)
#
# timing.py      - จับเวลาสอบ
# evaluation.py  - ตรวจคำตอบและคิดคะแนนแยกตามชนิดคำถาม (ไม่แตะฐานข้อมูล)
# attempts.py    - ผู้เรียนเริ่มสอบ / ส่งคำตอบ / ดูผล
# management.py  - ผู้สอน/แอดมินสร้าง แก้ไข ลบ ข้อสอบและคำถาม
# =====================================================================

from app.services.quiz.timing import (
    TIME_LIMIT_GRACE_SECONDS,
    compute_time_difference_seconds,
    check_quiz_attempt_time_limit,
)
from app.services.quiz.evaluation import (
    parse_matching_pair,
    evaluate_multiple_choice,
    evaluate_matching,
    evaluate_ordering,
    normalize_node_name,
    evaluate_scenario,
    evaluate_simulation,
    evaluate_architecture_builder,
    calculate_quiz_scores,
)
from app.services.quiz.attempts import (
    validate_user_quiz_access,
    start_quiz_attempt,
    submit_quiz_attempt,
    get_quiz_result_for_user,
    get_quiz_answer_review,
    get_quiz_details_for_student,
)
from app.services.quiz.management import (
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

__all__ = [
    "TIME_LIMIT_GRACE_SECONDS",
    "compute_time_difference_seconds",
    "check_quiz_attempt_time_limit",
    "parse_matching_pair",
    "evaluate_multiple_choice",
    "evaluate_matching",
    "evaluate_ordering",
    "normalize_node_name",
    "evaluate_scenario",
    "evaluate_simulation",
    "evaluate_architecture_builder",
    "calculate_quiz_scores",
    "validate_user_quiz_access",
    "start_quiz_attempt",
    "submit_quiz_attempt",
    "get_quiz_result_for_user",
    "get_quiz_answer_review",
    "get_quiz_details_for_student",
    "get_quiz_manage_details_service",
    "list_quiz_attempts_service",
    "list_quizzes_service",
    "list_classroom_quizzes_service",
    "create_quiz_service",
    "update_quiz_service",
    "delete_quiz_service",
    "add_question_to_quiz_service",
    "update_question_service",
    "delete_question_service",
]
