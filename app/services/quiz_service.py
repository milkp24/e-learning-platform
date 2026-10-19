import uuid
import json
from datetime import datetime, timezone
from decimal import Decimal
from flask import jsonify, current_app
from sqlalchemy.exc import IntegrityError
from app.extensions import db
from app.models.quiz import (
    Quiz,
    QuizCondition,
    Question,
    QuizQuestion,
    QuestionOption,
    QuizAttempt,
    QuizAnswer,
    QuizResult,
)
from app.models.user import User
from app.models.classroom import Classroom, Lesson, ClassroomMember


# =====================================================================
# quiz_service.py: บริการประมวลผลข้อสอบ คำนวณคะแนน และบันทึกผลการทำข้อสอบ
# สถาปัตยกรรม: Single Source of Truth ฝั่ง Backend สำหรับผลสอบทั้งหมด
# รองรับคำถาม 3 ประเภท: Multiple Choice, Matching (Partial Credit), Ordering (Partial Credit)
# การป้องกันความปลอดภัย: IDOR Protection, Anti-Tampering, Zero Information Leakage
# =====================================================================

TIME_LIMIT_GRACE_SECONDS = 30  # Grace period (seconds) for network latency buffer


def compute_time_difference_seconds(end_time, start_time) -> int:
    """คำนวณส่วนต่างเวลาเป็นวินาทีอย่างปลอดภัย รองรับทั้ง timezone-aware และ naive datetimes"""
    if not end_time or not start_time:
        return 0
    e = end_time
    s = start_time
    if getattr(e, "tzinfo", None) is not None and getattr(s, "tzinfo", None) is None:
        s = s.replace(tzinfo=timezone.utc)
    elif getattr(e, "tzinfo", None) is None and getattr(s, "tzinfo", None) is not None:
        e = e.replace(tzinfo=timezone.utc)
    return max(0, int((e - s).total_seconds()))


def check_quiz_attempt_time_limit(
    started_at: datetime | None,
    time_limit_minutes: int | None,
    now_time: datetime | None = None,
    grace_seconds: int = TIME_LIMIT_GRACE_SECONDS,
) -> tuple[bool, int, int]:
    """
    ตรวจสอบว่าการทำแบบทดสอบเกินกำหนดเวลา (Time Limit + Grace Period) หรือไม่
    Single Source of Truth ฝั่ง Backend (Server-Side Enforcement)

    :param started_at: วันเวลาที่เริ่มทำแบบทดสอบ (attempt.started_at)
    :param time_limit_minutes: เวลาจำกัดในหน่วยนาที (quiz.condition.time_limit_minutes)
    :param now_time: เวลาปัจจุบันของ Server (Default: datetime.now(timezone.utc))
    :param grace_seconds: ค่าเผื่อเวลาสำหรับ Network Latency (Default: TIME_LIMIT_GRACE_SECONDS)
    :return: (is_expired, time_spent_seconds, allowed_total_seconds)
    """
    if not started_at or not time_limit_minutes or time_limit_minutes <= 0:
        if now_time is None:
            now_time = datetime.now(timezone.utc)
        spent = compute_time_difference_seconds(now_time, started_at) if started_at else 0
        return False, spent, 0

    if now_time is None:
        now_time = datetime.now(timezone.utc)

    time_spent_seconds = compute_time_difference_seconds(now_time, started_at)
    allowed_seconds = int(time_limit_minutes) * 60
    allowed_total_seconds = allowed_seconds + grace_seconds

    is_expired = time_spent_seconds > allowed_total_seconds
    return is_expired, time_spent_seconds, allowed_total_seconds


def parse_matching_pair(raw_text: str | None, image_url: str | None = None) -> tuple[str, str] | None:
    """
    แปลงข้อความของ Option ให้เป็นคู่ (Left, Right)
    รองรับทั้ง JSON string `{"left": "...", "right": "..."}`
    และ Delimiter string เช่น `"Left -> Right"`, `"Left::Right"`, หรือ `"Left: Right"`
    รวมถึงกรณีที่ระบุ image_url เป็นฝั่งขวา
    """
    if raw_text and isinstance(raw_text, str):
        cleaned = raw_text.strip()

        # ลองแปลงแบบ JSON
        if cleaned.startswith("{") and cleaned.endswith("}"):
            try:
                data = json.loads(cleaned)
                if isinstance(data, dict):
                    left = (
                        data.get("left")
                        or data.get("source")
                        or data.get("item")
                        or data.get("key")
                    )
                    right = (
                        data.get("right")
                        or data.get("target")
                        or data.get("match")
                        or data.get("value")
                    )
                    if left is not None and right is not None:
                        return str(left).strip(), str(right).strip()
            except Exception:
                pass

        # ลองแปลงด้วย Delimiter: ->, ::
        for delim in ["->", "::"]:
            if delim in cleaned:
                parts = cleaned.split(delim, 1)
                left = parts[0].strip()
                right = parts[1].strip()
                if left and right:
                    return left, right

        # Delimiter : (เฉพาะกรณีไม่ใช่ URL)
        if ":" in cleaned and not cleaned.startswith("http://") and not cleaned.startswith("https://") and "://" not in cleaned:
            parts = cleaned.split(":", 1)
            left = parts[0].strip()
            right = parts[1].strip()
            if left and right:
                return left, right

    if raw_text and image_url:
        return raw_text.strip(), image_url.strip()

    return None


def evaluate_multiple_choice(
    question: Question,
    user_answer: dict | None,
    question_weight: float = 1.0,
) -> tuple[bool, float, str | None, uuid.UUID | None, str | None]:
    """
    ตรวจคำตอบประเภท Multiple Choice (Module 8.2 & Phase 3)
    กฎทางธุรกิจ (Business Rules):
    1. ตรวจสอบจาก QuestionOption.is_correct ใน Database เท่านั้น
    2. ไม่รับฟิลด์ is_correct, score, correct_answer จาก client
    3. ตัวเลือกต้องมีอยู่จริงและผูกกับ question_id ข้อนี้
    คืนค่า: (is_correct, score, answer_text, option_id, error_message)
    """
    if not user_answer:
        # ไม่ตอบคำถาม (Unanswered) -> 0 คะแนน
        return False, 0.0, None, None, None

    # ดึง option_id ที่ผู้เรียนเลือก
    raw_option_id = (
        user_answer.get("option_id")
        or user_answer.get("selected_option_id")
        or user_answer.get("choice_id")
    )

    if not raw_option_id:
        # ไม่ระบุตัวเลือก -> 0 คะแนน
        return False, 0.0, None, None, None

    try:
        opt_uuid = uuid.UUID(str(raw_option_id))
    except (ValueError, TypeError):
        return False, 0.0, None, None, f"Invalid choice ID format '{raw_option_id}'"

    # ค้นหาตัวเลือกในฐานข้อมูลที่ผูกกับคำถามนี้ (ป้องกัน Choice ของข้ออื่น)
    selected_option = QuestionOption.query.filter_by(
        option_id=opt_uuid,
        question_id=question.question_id,
    ).first()

    if not selected_option:
        # Choice ID ไม่มีอยู่จริง หรือไม่ได้อยู่ในข้อนี้
        return False, 0.0, None, None, f"Choice '{raw_option_id}' does not belong to question '{question.question_id}'"

    # ตรวจสอบความถูกต้องจาก Database เท่านั้น (Backend Source of Truth)
    is_correct = bool(selected_option.is_correct)
    score = float(question_weight) if is_correct else 0.0
    answer_text = selected_option.option_text

    return is_correct, score, answer_text, selected_option.option_id, None


def evaluate_matching(
    question: Question,
    user_answer: dict | None,
    question_weight: float = 1.0,
) -> tuple[bool, float, str, uuid.UUID | None, str | None]:
    """
    ตรวจคำตอบประเภท Matching (Module 8.2 & Phase 4)
    กฎทางธุรกิจ (Business Rules):
    1. คู่เฉลยที่ถูกต้องดึงมาจาก QuestionOption ของคำถามในฐานข้อมูล
    2. รองรับ Partial Credit: (จำนวนคู่ที่ถูกต้อง / จำนวนคู่ทั้งหมด) * question_weight
    3. ป้องกันการส่งซ้ำ: left item เดิมซ้ำ จะถูก deduplicate
    4. Invalid Item ที่ไม่มีในโจทย์ จะไม่ได้คะแนน
    คืนค่า: (is_correct, score, answer_text, option_id, error_message)
    """
    options = QuestionOption.query.filter_by(question_id=question.question_id).all()
    correct_pairs = {}
    for opt in options:
        pair = parse_matching_pair(opt.option_text, opt.image_url)
        if pair:
            left, right = pair
            correct_pairs[left.lower()] = right.lower()

    total_pairs = len(correct_pairs)
    if total_pairs == 0:
        return False, 0.0, "{}", None, None

    if not user_answer:
        return False, 0.0, "{}", None, None

    # ดึงคู่ที่ผู้เรียนส่งมา รองรับหลากหลายรูปแบบ
    raw_pairs = (
        user_answer.get("matches")
        or user_answer.get("pairs")
        or user_answer.get("selected_pairs")
        or user_answer.get("answers")
    )

    pairs_dict = {}
    if isinstance(raw_pairs, list):
        for item in raw_pairs:
            if isinstance(item, dict):
                l = item.get("left") or item.get("item") or item.get("source") or item.get("key")
                r = item.get("right") or item.get("match") or item.get("target") or item.get("value")
                if l is not None and r is not None:
                    k = str(l).strip().lower()
                    # ถ้าส่ง key ซ้ำ ให้คงค่าเดิมไว้ (Deduplicate)
                    if k not in pairs_dict:
                        pairs_dict[k] = str(r).strip().lower()
    elif isinstance(raw_pairs, dict):
        for k, v in raw_pairs.items():
            pairs_dict[str(k).strip().lower()] = str(v).strip().lower()
    elif isinstance(user_answer.get("answer_text"), str):
        try:
            parsed = json.loads(user_answer["answer_text"])
            if isinstance(parsed, dict):
                for k, v in parsed.items():
                    pairs_dict[str(k).strip().lower()] = str(v).strip().lower()
            elif isinstance(parsed, list):
                for item in parsed:
                    if isinstance(item, dict):
                        l = item.get("left") or item.get("item")
                        r = item.get("right") or item.get("match")
                        if l and r:
                            k = str(l).strip().lower()
                            if k not in pairs_dict:
                                pairs_dict[k] = str(r).strip().lower()
        except Exception:
            pass

    # ตรวจคู่ที่ถูกต้อง
    correct_count = 0
    for left_submitted, right_submitted in pairs_dict.items():
        if left_submitted in correct_pairs:
            if correct_pairs[left_submitted] == right_submitted:
                correct_count += 1

    # คำนวณ Partial Credit พร้อม Clamp [0.0, question_weight]
    earned_ratio = correct_count / total_pairs
    score = round(earned_ratio * question_weight, 2)
    score = max(0.0, min(float(question_weight), float(score)))
    is_all_correct = (correct_count == total_pairs)

    answer_record = json.dumps(pairs_dict, ensure_ascii=False)
    return is_all_correct, score, answer_record, None, None


def evaluate_ordering(
    question: Question,
    user_answer: dict | None,
    question_weight: float = 1.0,
) -> tuple[bool, float, str, uuid.UUID | None, str | None]:
    """
    ตรวจคำตอบประเภท Ordering (Module 8.2 & Phase 5)
    กฎทางธุรกิจ (Business Rules):
    1. Correct Order มาจาก QuestionOption.order_no ใน Database
    2. รองรับ Partial Credit ตามตำแหน่งที่ถูกต้อง: (จำนวนตำแหน่งที่ถูก / จำนวนทั้งหมด) * question_weight
    3. ป้องกัน Duplicate Item: แต่ละ item ที่ถูกต้องสามารถให้คะแนนได้เพียงครั้งเดียวเท่านั้น
    4. Invalid Item ไม่ได้รับคะแนน
    คืนค่า: (is_correct, score, answer_text, option_id, error_message)
    """
    options = (
        QuestionOption.query.filter_by(question_id=question.question_id)
        .order_by(QuestionOption.order_no.asc())
        .all()
    )

    total_items = len(options)
    if total_items == 0:
        return False, 0.0, "[]", None, None

    # Correct sequence จาก Database
    correct_order_ids = [str(opt.option_id) for opt in options]
    correct_order_texts = [opt.option_text.strip().lower() for opt in options]
    valid_option_ids = set(correct_order_ids)

    if not user_answer:
        return False, 0.0, "[]", None, None

    # ดึงลำดับที่ผู้เรียนส่งมา
    raw_order = (
        user_answer.get("ordered_option_ids")
        or user_answer.get("order")
        or user_answer.get("ordering")
        or user_answer.get("items")
        or user_answer.get("answer_text")
    )

    submitted_ids = []
    if isinstance(raw_order, list):
        for item in raw_order:
            if isinstance(item, dict):
                opt_id = item.get("option_id") or item.get("id")
                if opt_id:
                    submitted_ids.append(str(opt_id).strip())
            elif isinstance(item, str):
                submitted_ids.append(item.strip())
    elif isinstance(raw_order, str):
        try:
            parsed = json.loads(raw_order)
            if isinstance(parsed, list):
                for item in parsed:
                    if isinstance(item, dict):
                        opt_id = item.get("option_id") or item.get("id")
                        if opt_id:
                            submitted_ids.append(str(opt_id).strip())
                    elif isinstance(item, str):
                        submitted_ids.append(item.strip())
        except Exception:
            pass

    # ตรวจสอบตำแหน่งที่ถูกต้อง และป้องกันการนำ Item ซ้ำมานับคะแนนเบิ้ล
    correct_positions = 0
    matched_items = set()

    for idx, sub_item in enumerate(submitted_ids):
        if idx >= total_items:
            break

        is_match = False
        if sub_item in valid_option_ids:
            if sub_item == correct_order_ids[idx]:
                is_match = True
        elif sub_item.lower() in correct_order_texts:
            if sub_item.lower() == correct_order_texts[idx]:
                is_match = True

        if is_match:
            item_key = sub_item.lower()
            if item_key not in matched_items:
                correct_positions += 1
                matched_items.add(item_key)

    # คำนวณ Partial Credit พร้อม Clamp [0.0, question_weight]
    earned_ratio = correct_positions / total_items
    score = round(earned_ratio * question_weight, 2)
    score = max(0.0, min(float(question_weight), float(score)))
    is_all_correct = (correct_positions == total_items)

    answer_record = json.dumps(submitted_ids, ensure_ascii=False)
    return is_all_correct, score, answer_record, None, None


def normalize_node_name(name: str) -> str:
    """แปลงชื่อ component/node ให้อยู่ในรูปแบบ canonical lowercase identifier"""
    if not name:
        return ""
    s = str(name).strip().lower()
    for char in ["-", " ", "/", "\\"]:
        s = s.replace(char, "_")
    while "__" in s:
        s = s.replace("__", "_")
    return s.strip("_")


def evaluate_scenario(
    question: Question,
    user_answer: dict | None,
    question_weight: float = 1.0,
) -> tuple[bool, float, str | None, uuid.UUID | None, str | None]:
    """
    ตรวจคำตอบประเภท Scenario Question (Phase 3)
    รองรับการตอบด้วย option_id หรือตอบด้วยข้อความตัวเลือก (answer_text / answer)
    Backend Source of Truth 100% ตรวจสอบจาก QuestionOption.is_correct ในฐานข้อมูล
    """
    if not user_answer:
        return False, 0.0, None, None, None

    raw_option_id = (
        user_answer.get("option_id")
        or user_answer.get("selected_option_id")
        or user_answer.get("choice_id")
    )

    selected_option = None

    if raw_option_id:
        try:
            opt_uuid = uuid.UUID(str(raw_option_id))
            selected_option = QuestionOption.query.filter_by(
                option_id=opt_uuid,
                question_id=question.question_id,
            ).first()
            if not selected_option:
                return False, 0.0, None, None, f"Choice '{raw_option_id}' does not belong to question '{question.question_id}'"
        except (ValueError, TypeError):
            return False, 0.0, None, None, f"Invalid choice ID format '{raw_option_id}'"
    else:
        text_ans = user_answer.get("answer") or user_answer.get("answer_text") or user_answer.get("selected_answer")
        if text_ans:
            text_str = str(text_ans).strip().lower()
            options = QuestionOption.query.filter_by(question_id=question.question_id).all()
            for opt in options:
                if (opt.option_text or "").strip().lower() == text_str:
                    selected_option = opt
                    break

    if not selected_option:
        return False, 0.0, None, None, None

    is_correct = bool(selected_option.is_correct)
    score = float(question_weight) if is_correct else 0.0
    answer_text = selected_option.option_text

    return is_correct, score, answer_text, selected_option.option_id, None


def evaluate_simulation(
    question: Question,
    user_answer: dict | None,
    question_weight: float = 1.0,
) -> tuple[bool, float, str, uuid.UUID | None, str | None]:
    """
    ตรวจคำตอบประเภท Interactive Simulation สำหรับ IoT (Phase 4)
    รองรับ:
    - Input: soil_moisture, temperature, humidity, water_level, presence, light_status, pump_status
    - Logic: <, >, <=, >=, ==, AND, OR, IF, THEN
    - Output: Pump ON/OFF, Light ON/OFF, Alert, Notification, System Status
    - ตรวจสอบจาก QuestionOption ที่ is_correct=True ใน PostgreSQL
    - รองรับ Partial Credit ตามเงื่อนไขและผลลัพธ์
    """
    options = QuestionOption.query.filter_by(question_id=question.question_id).all()
    correct_options = [opt for opt in options if opt.is_correct]

    if not correct_options:
        return False, 0.0, "{}", None, None

    if not user_answer:
        return False, 0.0, "{}", None, None

    raw_ans = (
        user_answer.get("answer")
        or user_answer.get("simulation")
        or user_answer.get("rule")
        or user_answer.get("answer_text")
    )

    ans_dict = {}
    if isinstance(raw_ans, dict):
        ans_dict = raw_ans
    elif isinstance(raw_ans, str):
        try:
            parsed = json.loads(raw_ans)
            if isinstance(parsed, dict):
                ans_dict = parsed
            else:
                ans_dict = {"rule": raw_ans}
        except Exception:
            ans_dict = {"rule": raw_ans}

    raw_opt_id = user_answer.get("option_id") or user_answer.get("selected_option_id")
    if raw_opt_id:
        try:
            opt_uuid = uuid.UUID(str(raw_opt_id))
            chosen_opt = QuestionOption.query.filter_by(
                option_id=opt_uuid,
                question_id=question.question_id,
            ).first()
            if chosen_opt:
                is_correct = bool(chosen_opt.is_correct)
                score = float(question_weight) if is_correct else 0.0
                return is_correct, score, chosen_opt.option_text, chosen_opt.option_id, None
        except Exception:
            pass

    best_score = 0.0
    is_fully_correct = False
    saved_opt_id = None

    for corr_opt in correct_options:
        corr_text = corr_opt.option_text or ""
        corr_data = None
        if corr_text.startswith("{") and corr_text.endswith("}"):
            try:
                corr_data = json.loads(corr_text)
            except Exception:
                pass

        if corr_data and isinstance(corr_data, dict):
            rule_in_corr = corr_data.get("rule")
            if rule_in_corr and isinstance(rule_in_corr, str):
                clean_corr_rule = " ".join(rule_in_corr.strip().lower().split())
                user_rule_str = str(ans_dict.get("rule") or raw_ans or "").strip().lower()
                clean_user = " ".join(user_rule_str.split())
                if clean_corr_rule and clean_user and clean_corr_rule == clean_user:
                    is_fully_correct = True
                    best_score = float(question_weight)
                    saved_opt_id = corr_opt.option_id
                    break

            test_cases = corr_data.get("test_cases")
            if test_cases and isinstance(test_cases, list) and len(test_cases) > 0:
                passed_cases = 0
                for tc in test_cases:
                    expected_outputs = tc.get("expected", {})
                    user_matched = True
                    for exp_k, exp_v in expected_outputs.items():
                        submitted_v = ans_dict.get(exp_k)
                        if submitted_v is None or str(submitted_v).strip().upper() != str(exp_v).strip().upper():
                            user_matched = False
                            break
                    if user_matched:
                        passed_cases += 1

                ratio = passed_cases / len(test_cases)
                current_score = round(ratio * question_weight, 2)
                if current_score > best_score:
                    best_score = current_score
                    saved_opt_id = corr_opt.option_id
                if passed_cases == len(test_cases):
                    is_fully_correct = True
                    best_score = float(question_weight)
                    break

            expected_keys = {
                k.lower(): str(v).strip().lower()
                for k, v in corr_data.items()
                if k not in ["test_cases", "description", "label"]
            }
            if expected_keys:
                matches_count = 0
                for exp_k, exp_v in expected_keys.items():
                    val = None
                    for uk, uv in ans_dict.items():
                        if uk.lower() == exp_k:
                            val = str(uv).strip().lower()
                            break
                    if val == exp_v:
                        matches_count += 1
                ratio = matches_count / len(expected_keys)
                current_score = round(ratio * question_weight, 2)
                if current_score > best_score:
                    best_score = current_score
                    saved_opt_id = corr_opt.option_id
                if matches_count == len(expected_keys):
                    is_fully_correct = True
                    best_score = float(question_weight)
                    break
        else:
            user_rule_str = str(ans_dict.get("rule") or raw_ans or "").strip().lower()
            clean_corr = " ".join(corr_text.strip().lower().split())
            clean_user = " ".join(user_rule_str.split())
            if clean_corr and clean_user and clean_corr == clean_user:
                is_fully_correct = True
                best_score = float(question_weight)
                saved_opt_id = corr_opt.option_id
                break

    best_score = max(0.0, min(float(question_weight), float(best_score)))
    answer_record = json.dumps(ans_dict if ans_dict else raw_ans, ensure_ascii=False)
    return is_fully_correct, best_score, answer_record, saved_opt_id, None


def evaluate_architecture_builder(
    question: Question,
    user_answer: dict | None,
    question_weight: float = 1.0,
) -> tuple[bool, float, str, uuid.UUID | None, str | None]:
    """
    ตรวจคำตอบประเภท Interactive Architecture Builder (Phase 5)
    ตรวจสอบ:
    1. Component Selection (เลือก components ครบ)
    2. Connection (เชื่อม components)
    3. Direction (ตรวจสอบทิศทางลูกศร Data Flow)
    4. Missing Component (เช่น Sensor -> Dashboard โดยไม่มี ESP32/Network/Platform)
    5. Invalid Connection (เช่น Database -> Sensor)
    6. Partial Credit (จำนวนจุดที่ถูกต้อง / จำนวนจุดทั้งหมด) * question_weight
    """
    options = QuestionOption.query.filter_by(question_id=question.question_id).all()
    correct_options = [opt for opt in options if opt.is_correct]

    if not correct_options:
        return False, 0.0, "{}", None, None

    if not user_answer:
        return False, 0.0, "{}", None, None

    raw_arch = (
        user_answer.get("answer")
        or user_answer.get("architecture")
        or user_answer.get("data")
        or user_answer.get("answer_text")
    )

    arch_dict = {}
    if isinstance(raw_arch, dict):
        arch_dict = raw_arch
    elif isinstance(raw_arch, str):
        try:
            parsed = json.loads(raw_arch)
            if isinstance(parsed, dict):
                arch_dict = parsed
        except Exception:
            pass

    submitted_nodes = set(
        normalize_node_name(n)
        for n in (arch_dict.get("nodes") or user_answer.get("nodes") or [])
    )

    raw_conns = arch_dict.get("connections") or user_answer.get("connections") or []
    submitted_connections = []
    if isinstance(raw_conns, list):
        for c in raw_conns:
            if isinstance(c, (list, tuple)) and len(c) >= 2:
                src = normalize_node_name(c[0])
                tgt = normalize_node_name(c[1])
                if src and tgt:
                    submitted_connections.append((src, tgt))
            elif isinstance(c, dict):
                src = normalize_node_name(c.get("from") or c.get("source") or c.get("src"))
                tgt = normalize_node_name(c.get("to") or c.get("target") or c.get("dst"))
                if src and tgt:
                    submitted_connections.append((src, tgt))

    submitted_conn_set = set(submitted_connections)

    best_score = 0.0
    is_fully_correct = False
    saved_opt_id = None

    for corr_opt in correct_options:
        corr_text = corr_opt.option_text or ""
        corr_spec = {}
        try:
            corr_spec = json.loads(corr_text) if corr_text.startswith("{") else {}
        except Exception:
            pass

        req_conns_raw = corr_spec.get("required_connections") or corr_spec.get("connections") or []
        req_connections = []
        for rc in req_conns_raw:
            if isinstance(rc, (list, tuple)) and len(rc) >= 2:
                req_connections.append((normalize_node_name(rc[0]), normalize_node_name(rc[1])))
            elif isinstance(rc, dict):
                req_connections.append((normalize_node_name(rc.get("from") or rc.get("source")), normalize_node_name(rc.get("to") or rc.get("target"))))

        invalid_conns_raw = corr_spec.get("invalid_connections") or []
        invalid_connections = set(
            (normalize_node_name(ic[0]), normalize_node_name(ic[1]))
            for ic in invalid_conns_raw
            if isinstance(ic, (list, tuple)) and len(ic) >= 2
        )

        req_nodes = set(normalize_node_name(n) for n in corr_spec.get("required_nodes", []))

        total_points_items = len(req_connections)
        if total_points_items == 0:
            total_points_items = 1

        has_invalid_connection = False
        for sub_c in submitted_conn_set:
            if sub_c in invalid_connections:
                has_invalid_connection = True
                break

        matched_conns = 0
        for rc in req_connections:
            if rc in submitted_conn_set:
                matched_conns += 1

        missing_nodes = [rn for rn in req_nodes if rn not in submitted_nodes]

        ratio = matched_conns / total_points_items
        if has_invalid_connection:
            ratio = max(0.0, ratio - 0.25)

        cur_score = round(ratio * question_weight, 2)
        if cur_score > best_score:
            best_score = cur_score
            saved_opt_id = corr_opt.option_id

        if matched_conns == len(req_connections) and len(missing_nodes) == 0 and not has_invalid_connection:
            is_fully_correct = True
            best_score = float(question_weight)
            saved_opt_id = corr_opt.option_id
            break

    best_score = max(0.0, min(float(question_weight), float(best_score)))
    answer_record = json.dumps({
        "nodes": list(submitted_nodes),
        "connections": [[c[0], c[1]] for c in submitted_connections]
    }, ensure_ascii=False)

    return is_fully_correct, best_score, answer_record, saved_opt_id, None


def calculate_quiz_scores(
    question_results: list[dict],
    quiz_condition: QuizCondition | None,
) -> dict:
    """
    คำนวณคะแนนรวม เปอร์เซ็นต์ เกณฑ์ผ่าน และสถานะ Pass/Fail (Phase 6 & 8)
    ป้องกันข้อผิดพลาดทางคณิตศาสตร์: Division by Zero, Negative Score, Score Overflow
    """
    if not question_results:
        return {
            "score": 0.0,
            "total_score": 0.0,
            "percentage": 0.0,
            "passing_score": 70.0,
            "is_passed": False,
            "feedback": "ไม่มีคำถามในแบบทดสอบนี้",
        }

    total_score = sum(q["score"] for q in question_results)
    max_score = sum(q["max_score"] for q in question_results)

    total_score = max(0.0, round(total_score, 2))
    max_score = max(0.0, round(max_score, 2))

    if max_score > 0:
        percentage = round((total_score / max_score) * 100, 2)
        percentage = max(0.0, min(100.0, percentage))
    else:
        percentage = 0.0

    # เกณฑ์คะแนนผ่าน (Default 70.0% หากไม่ได้ระบุใน QuizCondition)
    passing_score = 70.0
    if quiz_condition and quiz_condition.passing_score is not None:
        try:
            ps_val = float(quiz_condition.passing_score)
            if 0.0 <= ps_val <= 100.0:
                passing_score = ps_val
        except (ValueError, TypeError):
            pass

    is_passed = percentage >= passing_score

    feedback = (
        f"ยินดีด้วย! คุณผ่านแบบทดสอบด้วยคะแนน {percentage:.2f}% (เกณฑ์ผ่าน {passing_score:.2f}%)"
        if is_passed
        else f"คุณยังไม่ผ่านแบบทดสอบ ได้คะแนน {percentage:.2f}% (เกณฑ์ผ่าน {passing_score:.2f}%) กรุณาลองใหม่อีกครั้ง"
    )

    return {
        "score": total_score,
        "total_score": max_score,
        "percentage": percentage,
        "passing_score": passing_score,
        "is_passed": is_passed,
        "feedback": feedback,
    }


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
