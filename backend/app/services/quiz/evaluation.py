import uuid
import json
from app.models.quiz import QuizCondition, Question, QuestionOption


# =====================================================================
# evaluation.py: การตรวจคำตอบและคิดคะแนน แยกตามชนิดคำถาม
# - ฟังก์ชันในไฟล์นี้ไม่แตะฐานข้อมูล รับคำตอบเข้าไปแล้วคืนผลการตรวจ จึงเทสต์แยกได้ง่าย
# - calculate_quiz_scores รวมคะแนนทุกข้อเป็นคะแนนสุดท้าย
# (แยกออกมาจาก quiz_service.py เดิม โดยไม่เปลี่ยนตรรกะ)
# =====================================================================


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
