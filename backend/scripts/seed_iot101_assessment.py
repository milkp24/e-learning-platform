# -*- coding: utf-8 -*-
"""
seed_iot101_assessment.py
Seeding script for IoT 101 Interactive Assessment Suite
Creates 63 questions across Chapter 0 to 7 in PostgreSQL database.
Question Distribution:
- Understanding: 40% (25 questions)
- Analysis: 40% (25 questions)
- Design: 20% (13 questions)
Difficulty:
- Easy: 40% (25 questions)
- Medium: 40% (25 questions)
- Hard: 20% (13 questions)
Question Types:
- multiple_choice
- true_false
- image_choice
- matching
- ordering
- scenario
- simulation
- architecture_builder
"""
import json
import uuid
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.role import Role
from app.models.classroom import Classroom, Chapter, Lesson, Episode
from app.models.progress import Skill
from app.models.quiz import Quiz, QuizCondition, Question, QuizQuestion, QuestionOption


def seed_iot101():
    app = create_app()
    with app.app_context():
        print("Starting IoT 101 Assessment Database Seeding...")

        # 1. Ensure Instructor
        inst_role = Role.query.filter_by(role_name="instructor").first()
        instructor = User.query.filter_by(email="iot101_instructor@elearning.internal").first()
        if not instructor:
            instructor = User(
                email="iot101_instructor@elearning.internal",
                status="active"
            )
            instructor.set_password("SecurePass123!")
            if inst_role:
                instructor.roles.append(inst_role)
            db.session.add(instructor)
            db.session.flush()

        # 2. Ensure Skills
        canonical_skills = [
            ("SENSE", "ตรวจจับและแปลงสัญญาณกายภาพสู่ดิจิทัล"),
            ("PROCESS", "ประมวลผลข้อมูลและตัดสินใจด้วยไมโครคอนโทรลเลอร์"),
            ("ACT", "ควบคุมและขับเคลื่อนอุปกรณ์ Actuator ในโลกจริง"),
            ("CONNECT", "ส่งผ่านข้อมูลผ่านโครงข่ายและโปรโตคอล IoT"),
            ("COLLECT", "จัดเก็บข้อมูลอุปกรณ์และบันทึกอนุกรมเวลา"),
            ("VISUALIZE", "แสดงผลข้อมูลและสถานะผ่านแดชบอร์ด"),
            ("AUTOMATE", "กำหนดเงื่อนไขและการทำงานอัตโนมัติ"),
            ("ANALYZE", "วิเคราะห์ข้อมูลย้อนหลังและตรวจจับความผิดปกติ"),
            ("CREATE", "ออกแบบและบูรณาการสถาปัตยกรรม IoT แบบองค์รวม"),
        ]
        skill_objs = {}
        for sk_name, sk_desc in canonical_skills:
            sk = Skill.query.filter_by(name=sk_name).first()
            if not sk:
                sk = Skill(name=sk_name, description=sk_desc, category="IoT")
                db.session.add(sk)
                db.session.flush()
            skill_objs[sk_name] = sk

        # 3. Ensure IoT 101 Classroom / Course
        course = Classroom.query.filter(
            (Classroom.title.ilike("%IoT 101%")) | (Classroom.title.ilike("%ภารกิจปลุกเมืองให้ฉลาด%"))
        ).first()

        if not course:
            course = Classroom(
                title="IoT 101 — ภารกิจปลุกเมืองให้ฉลาด",
                description="ผู้เรียนจะเรียนรู้พื้นฐาน IoT ตั้งแต่ Sensor, Controller, Network, MQTT, Platform, Database, Dashboard, Automation และ AI ผ่านเรื่องราวของ สวนเรียนรู้แห่งเมืองนาวา",
                instructor_id=instructor.user_id,
                status="published"
            )
            db.session.add(course)
            db.session.flush()

        # 4. Define Chapters
        chapters_meta = [
            (0, "Chapter 0: ปัญหาของเมืองนาวา", "จุดเริ่มต้นของภารกิจ ปัญหาสิ่งแวดล้อมและคุณภาพชีวิตในเมืองนาวา"),
            (1, "Chapter 1: Sensors", "อุปกรณ์ตรวจจับและแปลงสัญญาณทางกายภาพสู่ข้อมูลดิจิทัล"),
            (2, "Chapter 2: Controller และ Actuator", "สมองกลไมโครคอนโทรลเลอร์และการสั่งการอุปกรณ์ขับเคลื่อน"),
            (3, "Chapter 3: Network และ Messaging", "โครงข่ายไร้สายและโปรโตคอลรับส่งข้อความสำหรับ IoT"),
            (4, "Chapter 4: IoT Platform และ Data", "ระบบคลาวด์แพลตฟอร์ม ฐานข้อมูล และกระดานสรุปผลแสดงสถานะ"),
            (5, "Chapter 5: Automation และ Notification", "การตั้งกฎอัตโนมัติ ตารางเวลา และระบบแจ้งเตือนเมื่อเกิดเหตุผิดปกติ"),
            (6, "Chapter 6: Analytics และ AI", "การวิเคราะห์แนวโน้มข้อมูล การตรวจจับความผิดปกติ และปัญญาประดิษฐ์"),
            (7, "Chapter 7: Build Everything (Final Mission)", "ภารกิจเปิดสวนอัจฉริยะ ออกแบบระบบ IoT ครบวงจร"),
        ]

        chapter_objs = {}
        lesson_objs = {}
        for seq, ch_title, ch_desc in chapters_meta:
            ch = Chapter.query.filter_by(course_id=course.classroom_id, sequence_no=seq).first()
            if not ch:
                ch = Chapter(
                    course_id=course.classroom_id,
                    sequence_no=seq,
                    title=ch_title,
                    description=ch_desc
                )
                db.session.add(ch)
                db.session.flush()
            chapter_objs[seq] = ch

            # Ensure lesson per chapter
            les = Lesson.query.filter_by(classroom_id=course.classroom_id, sequence_no=seq).first()
            if not les:
                les = Lesson(
                    classroom_id=course.classroom_id,
                    chapter_id=ch.chapter_id,
                    sequence_no=seq,
                    title=ch_title,
                    description=ch_desc,
                    status="published"
                )
                db.session.add(les)
                db.session.flush()
            lesson_objs[seq] = les

        # 5. Define Question Bank (63 Questions total)
        # Ch 0: 5, Ch 1: 8, Ch 2: 8, Ch 3: 8, Ch 4: 8, Ch 5: 8, Ch 6: 8, Ch 7: 10
        raw_question_bank = [
            # =========================================================
            # CHAPTER 0 (5 questions) - Skills: SENSE, CREATE
            # =========================================================
            {
                "chapter_seq": 0,
                "question_text": "สถาปัตยกรรม IoT พื้นฐานประกอบด้วยลำดับขั้นการทำงานอย่างไร เพื่อให้เกิดวงจรอัจฉริยะที่สมบูรณ์?",
                "question_type": "ordering",
                "difficulty": "Easy",
                "category": "Understanding",
                "skill": "SENSE, CREATE",
                "concept": "IoT Architecture",
                "learning_objective": "เข้าใจลำดับการทำงานพื้นฐานของวงจร IoT",
                "points": 5.0,
                "explanation": "วงจร IoT เริ่มจากโลกกายภาพ -> Sensor ตรวจวัด -> Controller ประมวลผล -> Network ส่งต่อ -> Cloud จัดเก็บ -> Actuator ตอบสนอง",
                "options": [
                    {"text": "1. โลกกายภาพ (Physical World) มีการเปลี่ยนแปลง", "order": 1, "is_correct": True},
                    {"text": "2. เซนเซอร์ (Sensor) ตรวจวัดและแปลงสัญญาณ", "order": 2, "is_correct": True},
                    {"text": "3. ไมโครคอนโทรลเลอร์ (Controller) อ่านค่าและตัดสินใจ", "order": 3, "is_correct": True},
                    {"text": "4. โครงข่ายสื่อสาร (Network) นำส่งข้อมูล", "order": 4, "is_correct": True},
                    {"text": "5. แพลตฟอร์มคลาวด์และแดชบอร์ด (Platform & Dashboard)", "order": 5, "is_correct": True},
                ]
            },
            {
                "chapter_seq": 0,
                "question_text": "ในการจำแนกองค์ประกอบของระบบ IoT อุปกรณ์ใดทำหน้าที่เป็นตัวตรวจจับ (Sensor) และอุปกรณ์ใดทำหน้าที่เป็นตัวกระทำ (Actuator)?",
                "question_type": "matching",
                "difficulty": "Easy",
                "category": "Understanding",
                "skill": "SENSE",
                "concept": "Sensor vs Actuator",
                "learning_objective": "แยกแยะความแตกต่างระหว่าง Sensor และ Actuator",
                "points": 5.0,
                "explanation": "PIR และ Soil Moisture ทำหน้าที่ Sensor ส่วน Relay และ Water Pump ทำหน้าที่ Actuator",
                "options": [
                    {"text": "PIR Sensor -> อุปกรณ์ตรวจจับ (Sensor)", "order": 1, "is_correct": True},
                    {"text": "Soil Moisture -> อุปกรณ์ตรวจจับ (Sensor)", "order": 2, "is_correct": True},
                    {"text": "Relay Switch -> อุปกรณ์ขับเคลื่อน (Actuator)", "order": 3, "is_correct": True},
                    {"text": "Water Pump -> อุปกรณ์ขับเคลื่อน (Actuator)", "order": 4, "is_correct": True},
                ]
            },
            {
                "chapter_seq": 0,
                "question_text": "ข้อใดอธิบายบทบาทของ Physical World ต่อระบบ IoT ได้ถูกต้องที่สุด?",
                "question_type": "multiple_choice",
                "difficulty": "Easy",
                "category": "Understanding",
                "skill": "SENSE",
                "concept": "Physical World",
                "learning_objective": "เข้าใจความสัมพันธ์ระหว่างโลกกายภาพและระบบดิจิทัล",
                "points": 5.0,
                "explanation": "โลกกายภาพคือสภาพแวดล้อมจริงที่มีปรากฏการณ์ เช่น อุณหภูมิ ความชื้น แสง ซึ่งเซนเซอร์นำมาแปลงเป็นค่าดิจิทัล",
                "options": [
                    {"text": "เป็นแหล่งกำเนิดสถานะและปรากฏการณ์ทางกายภาพที่เซนเซอร์ต้องตรวจวัด", "order": 1, "is_correct": True},
                    {"text": "เป็นระบบปฏิบัติการที่ทำงานอยู่บนคลาวด์เซิร์ฟเวอร์", "order": 2, "is_correct": False},
                    {"text": "เป็นฐานข้อมูลที่เก็บประวัติย้อนหลังของอุปกรณ์", "order": 3, "is_correct": False},
                    {"text": "เป็นโปรโตคอลเครือข่ายสำหรับส่งข้อความ MQTT", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 0,
                "question_text": "หากระบบสวนอัจฉริยะตรวจวัดความชื้นได้ แต่ปั๊มน้ำไม่ทำงานตามคำสั่ง ปัญหาอยู่ในส่วนใดของวงจร?",
                "question_type": "scenario",
                "scenario": "ผู้ดูแลสวนเรียนรู้เมืองนาวาพบว่า แดชบอร์ดแสดงค่าความชื้น 15% (ต่ำกว่าเกณฑ์ 30%) แต่ปั๊มน้ำไม่ยอมเปิดทำงานเลยตลอดทั้งวัน",
                "difficulty": "Medium",
                "category": "Analysis",
                "skill": "CREATE",
                "concept": "Feedback Loop & Troubleshooting",
                "learning_objective": "วิเคราะห์ปัญหาจุดบกพร่องใน Feedback Loop ของ IoT",
                "points": 5.0,
                "explanation": "เซนเซอร์อ่านค่าได้ปกติและส่งถึงแดชบอร์ด แสดงว่าฝั่ง Input และ Network ทำงานได้ แต่ส่วนควบคุม Actuator (คำสั่ง Relay หรือปั๊มน้ำ) เกิดความล้มเหลว",
                "options": [
                    {"text": "ความล้มเหลวที่ส่วนคำสั่งควบคุมหรืออุปกรณ์ขับเคลื่อน (Controller to Actuator Failure)", "order": 1, "is_correct": True},
                    {"text": "เซนเซอร์ความชื้นในดินเสียหายจนไม่สามารถอ่านค่าได้", "order": 2, "is_correct": False},
                    {"text": "โครงข่าย Wi-Fi หลุดจนข้อมูลส่งไม่ถึงแพลตฟอร์ม", "order": 3, "is_correct": False},
                    {"text": "แดชบอร์ดล่มจนไม่สามารถแสดงผลกราฟได้", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 0,
                "question_text": "ในการออกแบบระบบ IoT สำหรับเมืองนาวา สิ่งใดคือหัวใจสำคัญของการตัดสินใจแบบอัตโนมัติ (Decision Making)?",
                "question_type": "true_false",
                "difficulty": "Medium",
                "category": "Design",
                "skill": "CREATE",
                "concept": "Automated Decision",
                "learning_objective": "เข้าใจหลักการตัดสินใจบนพื้นฐานข้อมูลจริงของระบบ IoT",
                "points": 5.0,
                "explanation": "การตัดสินใจใน IoT อาศัยข้อมูลจากเซนเซอร์และการประมวลผลตามเงื่อนไข (Rule Engine/Logic) ไม่ใช่การสุ่ม",
                "options": [
                    {"text": "จริง: การตัดสินใจต้องอาศัยข้อมูลเชิงประจักษ์จากเซนเซอร์ผสานกับตรรกะเงื่อนไขที่กำหนดไว้ล่วงหน้า", "order": 1, "is_correct": True},
                    {"text": "เท็จ: การตัดสินใจใน IoT ต้องรอคำสั่งกดด้วยมือจากผู้ใช้เท่านั้น", "order": 2, "is_correct": False},
                ]
            },

            # =========================================================
            # CHAPTER 1 (8 questions) - Skill: SENSE
            # =========================================================
            {
                "chapter_seq": 1,
                "question_text": "จงจับคู่ชนิดของเซนเซอร์ให้ตรงกับตัวแปรทางกายภาพที่ตรวจวัดในสวนเรียนรู้เมืองนาวา",
                "question_type": "matching",
                "difficulty": "Easy",
                "category": "Understanding",
                "skill": "SENSE",
                "concept": "Sensor Selection",
                "learning_objective": "เลือกเซนเซอร์ให้เหมาะสมกับค่าตัวแปรที่ต้องการวัด",
                "points": 5.0,
                "explanation": "Capacitive วัด Soil Moisture, DHT22 วัด Temp/Humidity, Ultrasonic วัด Water Level, PIR วัด Motion/Presence",
                "options": [
                    {"text": "Soil Moisture Sensor -> ความชื้นในดิน (%)", "order": 1, "is_correct": True},
                    {"text": "DHT22 Sensor -> อุณหภูมิและความชื้นสัมพัทธ์ในอากาศ", "order": 2, "is_correct": True},
                    {"text": "Ultrasonic Sensor -> ระดับน้ำในถังเก็บ (Water Level)", "order": 3, "is_correct": True},
                    {"text": "PIR Sensor -> การเคลื่อนไหวของมนุษย์ (Presence)", "order": 4, "is_correct": True},
                ]
            },
            {
                "chapter_seq": 1,
                "question_text": "เซนเซอร์วัดความชื้นในดินแบบ Capacitive มีข้อดีเหนือกว่าแบบ Resistive อย่างไรในการใช้งานระยะยาว?",
                "question_type": "multiple_choice",
                "difficulty": "Medium",
                "category": "Analysis",
                "skill": "SENSE",
                "concept": "Sensor Durability",
                "learning_objective": "เปรียบเทียบข้อดีข้อเสียของเซนเซอร์แต่ละประเภท",
                "points": 5.0,
                "explanation": "Capacitive ไม่มีขั้วโลหะสัมผัสน้ำโดยตรง จึงไม่เกิดการกัดกร่อนจากกระแสไฟฟ้า (Corrosion Resistance)",
                "options": [
                    {"text": "ทนทานต่อการสึกกร่อนและการกัดกร่อนของสารเคมีในดินได้ดีกว่ามาก", "order": 1, "is_correct": True},
                    {"text": "ใช้แรงดันไฟฟ้า 220V AC โดยตรงโดยไม่ต้องแปลงไฟ", "order": 2, "is_correct": False},
                    {"text": "สามารถปล่อยสัญญาณ Wi-Fi ได้ในตัวเอง", "order": 3, "is_correct": False},
                    {"text": "สามารถวัดค่าได้เฉพาะดินที่แห้งสนิทเท่านั้น", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 1,
                "question_text": "ภาพใดคือเซนเซอร์วัดระดับน้ำและระยะห่างด้วยคลื่นเสียงความถี่สูง (Ultrasonic Sensor)?",
                "question_type": "image_choice",
                "difficulty": "Easy",
                "category": "Understanding",
                "skill": "SENSE",
                "concept": "Ultrasonic Sensor",
                "learning_objective": "ระบุหน้าตาทางกายภาพของ Ultrasonic Sensor",
                "points": 5.0,
                "explanation": "Ultrasonic Sensor (เช่น HC-SR04) มีกระบอกส่งและรับคลื่นเสียง 2 กระบอกคล้ายดวงตา",
                "options": [
                    {"text": "Ultrasonic Sensor (HC-SR04)", "image_url": "/api/v1/media/uploads/ultrasonic_sensor.png", "order": 1, "is_correct": True},
                    {"text": "PIR Motion Sensor", "image_url": "/api/v1/media/uploads/pir_sensor.png", "order": 2, "is_correct": False},
                    {"text": "DHT22 Sensor", "image_url": "/api/v1/media/uploads/dht22_sensor.png", "order": 3, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 1,
                "question_text": "กรณีต้องการตรวจจับคนเดินเข้าศาลาเพื่อเปิดไฟอัตโนมัติ ควรเลือกใช้เซนเซอร์ชนิดใด?",
                "question_type": "scenario",
                "scenario": "ศาลาพักผ่อนในสวนนาวามีผู้สูงอายุและเด็กเข้ามาใช้งานช่วงพลบค่ำ ต้องการให้หลอดไฟเปิดทันทีที่มีคนเดินเข้ามาในระยะ 5 เมตร",
                "difficulty": "Easy",
                "category": "Design",
                "skill": "SENSE",
                "concept": "Motion & Presence Sensing",
                "learning_objective": "เลือกเซนเซอร์สำหรับระบบไฟส่องสว่างอัตโนมัติ",
                "points": 5.0,
                "explanation": "PIR (Passive Infrared) Sensor ตรวจจับการเปลี่ยนแปลงของรังสีอินฟราเรดจากความร้อนในร่างกายมนุษย์ได้แม่นยำและประหยัดพลังงาน",
                "options": [
                    {"text": "PIR Motion Sensor", "order": 1, "is_correct": True},
                    {"text": "Soil Moisture Sensor", "order": 2, "is_correct": False},
                    {"text": "Water Flow Meter", "order": 3, "is_correct": False},
                    {"text": "Pressure Sensor", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 1,
                "question_text": "Ultrasonic Sensor คำนวณระยะห่างของระดับน้ำในถังได้อย่างไร?",
                "question_type": "multiple_choice",
                "difficulty": "Medium",
                "category": "Understanding",
                "skill": "SENSE",
                "concept": "Ultrasonic Calculation",
                "learning_objective": "เข้าใจหลักการทำงาน Time of Flight ของคลื่นเสียง",
                "points": 5.0,
                "explanation": "คำนวณจากความเร็วเสียงในอากาศคูณด้วยเวลาไปกลับแล้วหารด้วยสอง (Distance = Speed * Time / 2)",
                "options": [
                    {"text": "จับเวลาการเดินทางของคลื่นเสียงสะท้อนผิวน้ำ แล้วคำนวณจากความเร็วเสียงในอากาศ", "order": 1, "is_correct": True},
                    {"text": "วัดน้ำหนักแรงกดทับของน้ำที่ก้นถัง", "order": 2, "is_correct": False},
                    {"text": "วัดการนำกระแสไฟฟ้าผ่านโมเลกุลของน้ำ", "order": 3, "is_correct": False},
                    {"text": "ตรวจจับรังสีแกมมาที่แผ่ออกมาจากน้ำในถัง", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 1,
                "question_text": "เซนเซอร์แบบแอนะล็อก (Analog) แตกต่างจากเซนเซอร์แบบดิจิทัล (Digital) อย่างไร?",
                "question_type": "multiple_choice",
                "difficulty": "Medium",
                "category": "Analysis",
                "skill": "SENSE",
                "concept": "Analog vs Digital Signal",
                "learning_objective": "วิเคราะห์ความแตกต่างของสัญญาณแอนะล็อกและดิจิทัล",
                "points": 5.0,
                "explanation": "สัญญาณแอนะล็อกให้ค่าความต่างศักย์ไฟฟ้าที่ต่อเนื่อง ส่วนดิจิทัลให้ข้อมูลเป็นบิต 0 และ 1 หรือโปรโตคอลข้อมูล",
                "options": [
                    {"text": "แอนะล็อกให้สัญญาณแรงดันไฟฟ้าต่อเนื่อง ส่วนดิจิทัลส่งค่าเป็นข้อมูลบิตหรือรหัสตัวเลข", "order": 1, "is_correct": True},
                    {"text": "แอนะล็อกไม่ต้องใช้ไฟฟ้าในการทำงานเลยแม้แต่น้อย", "order": 2, "is_correct": False},
                    {"text": "ดิจิทัลไม่สามารถเชื่อมต่อกับ ESP32 ได้", "order": 3, "is_correct": False},
                    {"text": "แอนะล็อกมีความแม่นยำสูงกว่าดิจิทัลในทุกกรณี", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 1,
                "question_text": "หากเซนเซอร์อุณหภูมิส่งค่า 85°C ซ้ำกันตลอดเวลาในห้องที่มีสภาพอากาศปกติ น่าจะเกิดจากสาเหตุใด?",
                "question_type": "scenario",
                "scenario": "สถานีตรวจวัดสภาพอากาศสวนนาวารายงานค่าอุณหภูมิคงที่ที่ 85.0°C ต่อเนื่อง 3 ชั่วโมง ทั้งที่อุณหภูมิจริงภายนอกอยู่ที่ 31°C",
                "difficulty": "Hard",
                "category": "Analysis",
                "skill": "SENSE",
                "concept": "Sensor Fault & Default Value",
                "learning_objective": "วิเคราะห์อาการ Sensor Fault จากค่า Default Error",
                "points": 5.0,
                "explanation": "ค่า 85°C คือค่า Default Error ของเซนเซอร์วัดอุณหภูมิตระกูล Dallas/DS18B20 เมื่อเริ่มระบบหรือสัญญาณสาย Data ขาด/หลวม",
                "options": [
                    {"text": "สายส่งสัญญาณขาดหรือหลวม ทำให้ไมโครคอนโทรลเลอร์อ่านได้ค่าเริ่มต้นผิดพลาด (Power-on Reset Error)", "order": 1, "is_correct": True},
                    {"text": "แดดส่องโดนเซนเซอร์จนร้อนถึง 85°C จริง", "order": 2, "is_correct": False},
                    {"text": "แบตเตอรี่ของ ESP32 หมดประจุ", "order": 3, "is_correct": False},
                    {"text": "ความชื้นในดินสูงเกินไปทำให้เซนเซอร์วัดอากาศรวน", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 1,
                "question_text": "จงเรียงลำดับขั้นตอนการติดตั้งและทดสอบเซนเซอร์ใหม่ในแปลงปลูกอย่างถูกต้อง",
                "question_type": "ordering",
                "difficulty": "Hard",
                "category": "Design",
                "skill": "SENSE",
                "concept": "Sensor Commissioning",
                "learning_objective": "วางลำดับขั้นตอนการ Commissioning เซนเซอร์",
                "points": 5.0,
                "explanation": "ต้องเริ่มจากทดสอบวงจรในโต๊ะทดลอง -> คาลิเบรตค่าศูนย์/สูงสุด -> ติดตั้งจริงในแปลง -> ตรวจสอบสัญญาณบนแดชบอร์ด",
                "options": [
                    {"text": "1. ทดสอบต่อสายไฟและอ่านค่าเบื้องต้นบนโต๊ะทดลอง (Bench Testing)", "order": 1, "is_correct": True},
                    {"text": "2. คาลิเบรตค่าต่ำสุดและสูงสุดในสภาวะแห้งและชุ่มน้ำ (Calibration)", "order": 2, "is_correct": True},
                    {"text": "3. ติดตั้งเซนเซอร์ลงในดินแปลงปลูกจริงในระดับความลึกที่กำหนด", "order": 3, "is_correct": True},
                    {"text": "4. ตรวจสอบการส่งข้อมูลแบบสดขึ้นสู่แดชบอร์ดเพื่อยืนยันความถูกต้อง", "order": 4, "is_correct": True},
                ]
            },

            # =========================================================
            # CHAPTER 2 (8 questions) - Skills: PROCESS, ACT
            # =========================================================
            {
                "chapter_seq": 2,
                "question_text": "ทำไมไมโครคอนโทรลเลอร์ ESP32 ไม่สามารถต่อขับปั๊มน้ำขนาด 12V 2A ได้โดยตรงจากขา GPIO?",
                "question_type": "multiple_choice",
                "difficulty": "Easy",
                "category": "Understanding",
                "skill": "PROCESS, ACT",
                "concept": "GPIO Current Limits",
                "learning_objective": "เข้าใจข้อจำกัดทางไฟฟ้าของขา GPIO บน ESP32",
                "points": 5.0,
                "explanation": "ขา GPIO ของ ESP32 จ่ายไฟได้ 3.3V และกระแสสูงสุดเพียงประมาณ 12-40mA เท่านั้น การต่อโหลดมอเตอร์โดยตรงจะทำให้ชิปไหม้ จึงต้องใช้ Relay หรือ MOSFET ขับแทน",
                "options": [
                    {"text": "ขา GPIO จ่ายไฟได้เพียง 3.3V และกระแสน้อยมาก ไม่เพียงพอและอาจทำให้ชิปเสียหาย", "order": 1, "is_correct": True},
                    {"text": "ESP32 ไม่มีฟังก์ชันเขียนคำสั่ง IF/THEN", "order": 2, "is_correct": False},
                    {"text": "ปั๊มน้ำต้องสั่งการผ่านบลูทูธเท่านั้น", "order": 3, "is_correct": False},
                    {"text": "ESP32 รองรับเฉพาะกระแสไฟฟ้าสลับ 220V", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 2,
                "question_text": "การทดลองจำลองระบบรดน้ำอัตโนมัติ: จงตั้งค่ากฎเงื่อนไขเพื่อให้ปั๊มน้ำทำงานเมื่อดินแห้ง",
                "question_type": "simulation",
                "difficulty": "Medium",
                "category": "Design",
                "skill": "PROCESS, ACT",
                "concept": "Threshold & Actuator Control",
                "learning_objective": "สร้างเงื่อนไขควบคุมปั๊มน้ำในระบบจำลอง",
                "points": 5.0,
                "explanation": "เงื่อนไขที่ถูกต้อง: IF soil_moisture < 30 THEN pump = ON",
                "options": [
                    {
                        "text": json.dumps({
                            "rule": "IF soil_moisture < 30 THEN pump = ON",
                            "sensor": "soil_moisture",
                            "operator": "<",
                            "threshold": 30,
                            "action": "ON",
                            "expected_output": {"pump": "ON"},
                            "test_cases": [
                                {"inputs": {"soil_moisture": 18}, "expected": {"pump": "ON"}},
                                {"inputs": {"soil_moisture": 35}, "expected": {"pump": "OFF"}}
                            ]
                        }),
                        "order": 1,
                        "is_correct": True
                    }
                ]
            },
            {
                "chapter_seq": 2,
                "question_text": "รีเลย์ (Relay) ทำหน้าที่อะไรในระบบควบคุมอัตโนมัติของสวนนาวา?",
                "question_type": "multiple_choice",
                "difficulty": "Easy",
                "category": "Understanding",
                "skill": "ACT",
                "concept": "Relay Operation",
                "learning_objective": "เข้าใจหลักการทำงานของสวิตช์รีเลย์",
                "points": 5.0,
                "explanation": "รีเลย์คือสวิตช์ไฟฟ้าที่ใช้สัญญาณควบคุมแรงดันต่ำ (3.3V/5V) ไปสับเปิด-ปิดวงจรไฟฟ้ากำลังสูง (12V/220V)",
                "options": [
                    {"text": "เป็นสวิตช์ควบคุมที่ใช้สัญญาณไฟฟ้าแรงดันต่ำไปตัดต่อวงจรไฟฟ้ากำลังสูง", "order": 1, "is_correct": True},
                    {"text": "เป็นเซนเซอร์วัดค่าความเร็วลม", "order": 2, "is_correct": False},
                    {"text": "เป็นตัวแปลงสัญญาณ Wi-Fi เป็นคลื่นวิทยุ 4G", "order": 3, "is_correct": False},
                    {"text": "เป็นแบตเตอรี่สำรองไฟฉุกเฉิน", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 2,
                "question_text": "ภาพใดคือบอร์ดไมโครคอนโทรลเลอร์ ESP32 ที่ทำหน้าที่เป็นสมองกลของสถานีตรวจวัด?",
                "question_type": "image_choice",
                "difficulty": "Easy",
                "category": "Understanding",
                "skill": "PROCESS",
                "concept": "ESP32 Controller",
                "learning_objective": "ระบุหน้าตาของบอร์ด ESP32 พัฒนาการ",
                "points": 5.0,
                "explanation": "บอร์ด ESP32 มีชิป SoC พร้อมเสาอากาศ PCB ในตัวและพอร์ต Micro-USB/Type-C",
                "options": [
                    {"text": "ESP32 Development Board", "image_url": "/api/v1/media/uploads/esp32_board.png", "order": 1, "is_correct": True},
                    {"text": "Solid State Relay Module", "image_url": "/api/v1/media/uploads/relay_module.png", "order": 2, "is_correct": False},
                    {"text": "Solar Charge Controller", "image_url": "/api/v1/media/uploads/solar_controller.png", "order": 3, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 2,
                "question_text": "สถานการณ์: ความชื้นในดินอยู่ที่ 18% และเกณฑ์ตัดต่อ (Threshold) คือ 30% ระบบควรกระทำสิ่งใด?",
                "question_type": "scenario",
                "scenario": "สวนเรียนรู้มีปัญหาดินแห้งในช่วงกลางวัน ค่า Soil Moisture อ่านได้ 18% ขณะที่เกณฑ์ตั้งไว้ว่าต้องไม่ต่ำกว่า 30%",
                "difficulty": "Medium",
                "category": "Analysis",
                "skill": "PROCESS, ACT",
                "concept": "Threshold Condition",
                "learning_objective": "ตัดสินใจควบคุมตามเงื่อนไข Threshold",
                "points": 5.0,
                "explanation": "18% ต่ำกว่า Threshold 30% จึงเข้าเงื่อนไขให้เปิด Pump เพื่อส่งน้ำเข้าแปลง",
                "options": [
                    {"text": "เปิด Pump เพื่อให้น้ำไหลเข้าสู่แปลงปลูก", "order": 1, "is_correct": True},
                    {"text": "ปิด Pump และหยุดการรดน้ำทั้งหมด", "order": 2, "is_correct": False},
                    {"text": "ปิด Sensor และตัดการเชื่อมต่อ", "order": 3, "is_correct": False},
                    {"text": "ตัด Wi-Fi ออกจากเครือข่าย", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 2,
                "question_text": "ปรากฏการณ์ Hysteresis (ผลต่างเกณฑ์เปิด-ปิด) ในการควบคุมปั๊มน้ำมีประโยชน์อย่างไร?",
                "question_type": "multiple_choice",
                "difficulty": "Hard",
                "category": "Analysis",
                "skill": "PROCESS",
                "concept": "Hysteresis Control",
                "learning_objective": "เข้าใจการป้องกัน Chattering ในการตัดต่อสวิตช์",
                "points": 5.0,
                "explanation": "Hysteresis ป้องกันไม่ให้ปั๊มเปิดๆ ปิดๆ ถี่เกินไป (Chattering) เมื่อค่าความชื้นแกว่งอยู่รอบๆ จุด Threshold ตัวเดียว",
                "options": [
                    {"text": "ป้องกันปั๊มเปิด-ปิดสลับไปมาถี่เกินไปเมื่อค่าแกว่งรอบเกณฑ์ ช่วยยืดอายุการใช้งานอุปกรณ์", "order": 1, "is_correct": True},
                    {"text": "ช่วยเร่งให้ปั๊มน้ำหมุนด้วยความเร็วรอบเป็นสองเท่า", "order": 2, "is_correct": False},
                    {"text": "ทำให้เซนเซอร์วัดค่าได้ละเอียดขึ้นเป็นระดับไมโคร", "order": 3, "is_correct": False},
                    {"text": "ช่วยลดการใช้แบนด์วิธของสัญญาณเครือข่าย", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 2,
                "question_text": "จงเรียงลำดับการไหลของสัญญาณและพลังงานในการสั่งงานปั๊มน้ำ (Control Flow)",
                "question_type": "ordering",
                "difficulty": "Medium",
                "category": "Understanding",
                "skill": "PROCESS, ACT",
                "concept": "Actuation Signal Flow",
                "learning_objective": "ลำดับทิศทางการควบคุมจากคำสั่งสู่แรงขับเคลื่อน",
                "points": 5.0,
                "explanation": "คำสั่ง logic จาก ESP32 ส่งกระแสผ่าน GPIO -> ขดลวด Relay ดูดสวิตช์ -> หน้าสัมผัสปล่อยไฟ 12V -> มอเตอร์ปั๊มน้ำหมุน",
                "options": [
                    {"text": "1. ESP32 คำนวณพบเงื่อนไขเป็นจริงและสั่งจ่ายลอจิก HIGH ที่ขา GPIO", "order": 1, "is_correct": True},
                    {"text": "2. โมดูลรีเลย์ได้รับสัญญาณกระตุ้นและสับหน้าสัมผัสสวิตช์แม่เหล็ก", "order": 2, "is_correct": True},
                    {"text": "3. กระแสไฟฟ้า 12V DC จากแหล่งจ่ายไฟไหลผ่านหน้าสัมผัสรีเลย์", "order": 3, "is_correct": True},
                    {"text": "4. มอเตอร์ของปั๊มน้ำเริ่มหมุนและสูบน้ำเข้าสู่ท่อสปริงเกลอร์", "order": 4, "is_correct": True},
                ]
            },
            {
                "chapter_seq": 2,
                "question_text": "Feedback Loop ที่สมบูรณ์ในระบบรดน้ำอัตโนมัติ ต้องประกอบด้วยการตรวจสอบค่าหลังการรดน้ำเสมอ",
                "question_type": "true_false",
                "difficulty": "Easy",
                "category": "Understanding",
                "skill": "PROCESS",
                "concept": "Closed-loop Control",
                "learning_objective": "เข้าใจหลักการควบคุมแบบวงปิด (Closed-loop)",
                "points": 5.0,
                "explanation": "ระบบควบคุมแบบวงปิด (Closed Loop) ต้องวัดค่าผลลัพธ์ (ความชื้นที่เพิ่มขึ้น) กลับมาเปรียบเทียบเสมอ เพื่อสั่งปิดปั๊มเมื่อถึงเกณฑ์",
                "options": [
                    {"text": "จริง: วงจรปิดต้องอาศัยผลตอบรับจากเซนเซอร์เพื่อหยุดการทำงานเมื่อค่าถึงระดับเป้าหมาย", "order": 1, "is_correct": True},
                    {"text": "เท็จ: ไม่จำเป็นต้องวัดค่าซ้ำหลังจากสั่งเปิดปั๊มน้ำไปแล้ว", "order": 2, "is_correct": False},
                ]
            },

            # =========================================================
            # CHAPTER 3 (8 questions) - Skill: CONNECT
            # =========================================================
            {
                "chapter_seq": 3,
                "question_text": "จงจับคู่เทคโนโลยีเครือข่ายไร้สายให้เหมาะสมกับระยะทางและการใช้พลังงานในเมืองนาวา",
                "question_type": "matching",
                "difficulty": "Easy",
                "category": "Understanding",
                "skill": "CONNECT",
                "concept": "Wireless Technologies",
                "learning_objective": "เลือกเทคโนโลยีเครือข่ายตามระยะทางและพลังงาน",
                "points": 5.0,
                "explanation": "BLE ระยะสั้นประหยัดพลังงานมาก, Wi-Fi แบนด์วิธสูงระยะกลาง, LoRaWAN ระยะไกลหลายกิโลเมตรแบนด์วิธต่ำ, 4G/5G ส่งได้ทุกที่แต่กินพลังงานสูง",
                "options": [
                    {"text": "BLE (Bluetooth Low Energy) -> ระยะสั้น (10-30 ม.) ประหยัดไฟสูงสุด", "order": 1, "is_correct": True},
                    {"text": "Wi-Fi -> ระยะกลาง (50-100 ม.) ความเร็วสูง ใช้ไฟปานกลาง", "order": 2, "is_correct": True},
                    {"text": "LoRaWAN -> ระยะไกลมาก (2-15 กม.) แบนด์วิธต่ำ กินไฟต่ำ", "order": 3, "is_correct": True},
                    {"text": "4G/5G Cellular -> ระยะไกล ครอบคลุมทั่วประเทศ ใช้พลังงานสูง", "order": 4, "is_correct": True},
                ]
            },
            {
                "chapter_seq": 3,
                "question_text": "ทำไมโปรโตคอล MQTT จึงได้รับความนิยมสูงสุดสำหรับอุปกรณ์ IoT เมื่อเทียบกับ HTTP?",
                "question_type": "multiple_choice",
                "difficulty": "Medium",
                "category": "Analysis",
                "skill": "CONNECT",
                "concept": "MQTT vs HTTP",
                "learning_objective": "วิเคราะห์ข้อได้เปรียบของ MQTT บนอุปกรณ์จำกัดทรัพยากร",
                "points": 5.0,
                "explanation": "MQTT ใช้ Header ขนาดเล็กมาก (เริ่มต้น 2 bytes), ใช้รูปแบบ Publish/Subscribe, รองรับการคงสถานะ Keep-Alive ประหยัดทั้งแบนด์วิธและพลังงาน",
                "options": [
                    {"text": "โครงสร้างแพ็กเก็ตเล็กมาก (Lightweight) และเป็นระบบ Pub/Sub ที่ไม่จำเป็นต้อง Request ตลอดเวลา", "order": 1, "is_correct": True},
                    {"text": "MQTT สามารถส่งวิดีโอ 4K ได้เร็วกว่า HTTP 10 เท่า", "order": 2, "is_correct": False},
                    {"text": "MQTT ไม่ต้องใช้เครือข่ายอินเทอร์เน็ตในการรับส่งข้อมูล", "order": 3, "is_correct": False},
                    {"text": "MQTT ใช้ได้เฉพาะกับฮาร์ดแวร์ของ Apple เท่านั้น", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 3,
                "question_text": "ในระบบ MQTT โครงสร้าง Topic ใดออกแบบตามหลักการจัดหมวดหมู่อุปกรณ์ที่ถูกต้องและขยายขนาดได้ดีที่สุด?",
                "question_type": "multiple_choice",
                "difficulty": "Medium",
                "category": "Design",
                "skill": "CONNECT",
                "concept": "MQTT Topic Design",
                "learning_objective": "ออกแบบโครงสร้าง MQTT Topic ตามมาตรฐานสากล",
                "points": 5.0,
                "explanation": "โครงสร้างที่ดีควรเรียงลำดับจาก: โครงการ / สถานที่ / อุปกรณ์ / ประเภทข้อมูล เช่น nava/garden1/esp32_01/sensor/soil",
                "options": [
                    {"text": "nava/garden/zone-a/esp32-01/telemetry/soil_moisture", "order": 1, "is_correct": True},
                    {"text": "send-all-data-to-the-server-now", "order": 2, "is_correct": False},
                    {"text": "192.168.1.1:1883/data/everything", "order": 3, "is_correct": False},
                    {"text": "sensor=soil&moisture=18&zone=a", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 3,
                "question_text": "สถานการณ์: เซนเซอร์วัดระดับน้ำบึงน้ำห่างจากศูนย์ควบคุม 5 กิโลเมตร ไม่มีเสาไฟฟ้า ใช้พลังงานโซลาร์เซลล์ ควรเลือกเครือข่ายใด?",
                "question_type": "scenario",
                "scenario": "ต้องการส่งค่าระดับน้ำทุกๆ 15 นาทีจากบึงน้ำชานเมืองนาวาซึ่งอยู่ห่างจากตัวเมือง 5 กิโลเมตร ไม่มีสัญญาณ Wi-Fi และไม่มีสายส่งไฟฟ้าแรงสูง",
                "difficulty": "Medium",
                "category": "Design",
                "skill": "CONNECT",
                "concept": "Low Power Wide Area Network",
                "learning_objective": "เลือกเครือข่ายสำหรับจุดติดตั้งระยะไกลและใช้พลังงานแสงอาทิตย์",
                "points": 5.0,
                "explanation": "LoRaWAN ออกแบบมาเพื่อส่งข้อมูลขนาดเล็กเป็นระยะทางไกลหลายกิโลเมตรโดยใช้พลังงานต่ำมาก สามารถใช้งานกับแบตเตอรี่และโซลาร์เซลล์ได้ยาวนาน",
                "options": [
                    {"text": "LoRaWAN เชื่อมต่อไปยัง Gateway ของเมืองนาวา", "order": 1, "is_correct": True},
                    {"text": "Wi-Fi Router 2.4GHz กำลังส่งปกติ", "order": 2, "is_correct": False},
                    {"text": "Bluetooth Classic เพื่อส่งข้อมูลเสียง", "order": 3, "is_correct": False},
                    {"text": "สายเคเบิล USB ลากยาว 5 กิโลเมตร", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 3,
                "question_text": "จงเรียงลำดับบทบาทหน้าที่และการไหลของข้อความในสถาปัตยกรรม MQTT",
                "question_type": "ordering",
                "difficulty": "Medium",
                "category": "Understanding",
                "skill": "CONNECT",
                "concept": "MQTT Architecture",
                "learning_objective": "ลำดับกระบวนการรับส่งข้อความผ่าน MQTT Broker",
                "points": 5.0,
                "explanation": "Publisher ส่งข้อมูลไปยัง Broker -> Broker ตรวจสอบ Topic -> Broker กระจายข้อความไปยัง Subscriber ที่ลงทะเบียนไว้",
                "options": [
                    {"text": "1. แดชบอร์ด (Subscriber) ทำการ Subscribe ใน Topic 'nava/garden/#' ต่อ MQTT Broker", "order": 1, "is_correct": True},
                    {"text": "2. ESP32 (Publisher) อ่านค่าเซนเซอร์และ Publish ข้อความ JSON ไปยัง Topic ที่กำหนด", "order": 2, "is_correct": True},
                    {"text": "3. MQTT Broker รับแพ็กเก็ตข้อความและจับคู่ Topic ตาม Subscription Table", "order": 3, "is_correct": True},
                    {"text": "4. MQTT Broker ส่งต่อข้อความไปยังแดชบอร์ดของผู้ใช้งานที่เชื่อมต่ออยู่ทันที", "order": 4, "is_correct": True},
                ]
            },
            {
                "chapter_seq": 3,
                "question_text": "ระดับ Quality of Service (QoS) แบบ QoS 1 ใน MQTT มีพฤติกรรมอย่างไร?",
                "question_type": "multiple_choice",
                "difficulty": "Hard",
                "category": "Understanding",
                "skill": "CONNECT",
                "concept": "MQTT QoS Levels",
                "learning_objective": "เข้าใจการการันตีการส่งข้อความด้วยระดับ QoS",
                "points": 5.0,
                "explanation": "QoS 1 รับประกันว่าข้อความจะส่งถึงอย่างน้อยหนึ่งครั้ง (At least once) โดยมีการส่ง PUBACK ยืนยัน",
                "options": [
                    {"text": "รับประกันการส่งถึงอย่างน้อยหนึ่งครั้ง (At least once) โดยมีการส่งสัญญาณยืนยัน PUBACK", "order": 1, "is_correct": True},
                    {"text": "ส่งเพียงครั้งเดียวแบบไม่สนใจว่าผู้รับจะได้หรือไม่ (At most once / Fire and forget)", "order": 2, "is_correct": False},
                    {"text": "รับประกันการส่งถึงเพียงครั้งเดียวเท่านั้นแบบไม่มีซ้ำเด็ดขาด (Exactly once)", "order": 3, "is_correct": False},
                    {"text": "ส่งเฉพาะเมื่อสัญญาณอินเทอร์เน็ตมีความเร็วเกิน 100 Mbps", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 3,
                "question_text": "หากอุปกรณ์ฝั่งรับต้องการรับข้อมูลจากทุกอุปกรณ์ในโซน garden ของเมืองนาวา ควรใช้ Wildcard Topic ใด?",
                "question_type": "multiple_choice",
                "difficulty": "Easy",
                "category": "Understanding",
                "skill": "CONNECT",
                "concept": "MQTT Wildcards",
                "learning_objective": "ใช้ MQTT Multi-level Wildcard (#) และ Single-level (+)",
                "points": 5.0,
                "explanation": "เครื่องหมาย '#' คือ multi-level wildcard สามารถรับทุกชั้นหัวข้อที่อยู่ภายใต้ 'nava/garden/' ได้ทั้งหมด",
                "options": [
                    {"text": "nava/garden/#", "order": 1, "is_correct": True},
                    {"text": "nava/garden/*", "order": 2, "is_correct": False},
                    {"text": "nava/garden/all", "order": 3, "is_correct": False},
                    {"text": "nava/garden/??", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 3,
                "question_text": "MQTT Broker ทำหน้าที่เก็บข้อมูลย้อนหลัง 1 ปีลงในฮาร์ดดิสก์โดยตรงโดยไม่ต้องมีฐานข้อมูล",
                "question_type": "true_false",
                "difficulty": "Easy",
                "category": "Understanding",
                "skill": "CONNECT",
                "concept": "Broker vs Database",
                "learning_objective": "แยกหน้าที่ระหว่าง Message Broker และ Database",
                "points": 5.0,
                "explanation": "เท็จ: MQTT Broker ทำหน้าที่เป็นเพียงตัวกลางกระจายข้อความ (Message Dispatcher) ไม่ใช่ระบบฐานข้อมูลบันทึกประวัติย้อนหลัง",
                "options": [
                    {"text": "เท็จ: Broker ทำหน้าที่เป็นตัวกลางส่งต่อข้อความเท่านั้น การเก็บประวัติต้องใช้ Database แยกต่างหาก", "order": 1, "is_correct": True},
                    {"text": "จริง: Broker ทำหน้าที่เป็นฐานข้อมูลหลักและคำนวณกราฟประวัติศาสตร์ในตัว", "order": 2, "is_correct": False},
                ]
            },

            # =========================================================
            # CHAPTER 4 (8 questions) - Skills: COLLECT, VISUALIZE
            # =========================================================
            {
                "chapter_seq": 4,
                "question_text": "ทำไมฐานข้อมูลประเภท Time-Series Database จึงเหมาะสมสำหรับการจัดเก็บข้อมูลอุปกรณ์ IoT มากกว่า Relational DB ทั่วไป?",
                "question_type": "multiple_choice",
                "difficulty": "Medium",
                "category": "Analysis",
                "skill": "COLLECT",
                "concept": "Time Series Database",
                "learning_objective": "วิเคราะห์ข้อได้เปรียบของ Time-Series Database ในงาน IoT",
                "points": 5.0,
                "explanation": "Time-Series Database ถูกปรับแต่งมาเพื่อการเขียนข้อมูลต่อเนื่องที่มี Timestamp ในอัตราเร็วสูง พร้อมการบีบอัดและการคิวรี่ช่วงเวลาอย่างมีประสิทธิภาพสูงสุด",
                "options": [
                    {"text": "รองรับการบันทึกข้อมูลแบบมีเวลาประทับ (Timestamp) ด้วยความเร็วสูงมาก และคิวรี่ช่วงเวลาย้อนหลังได้รวดเร็ว", "order": 1, "is_correct": True},
                    {"text": "สามารถจัดเก็บรูปถ่ายและไฟล์วิดีโอ 8K ได้อย่างไม่จำกัด", "order": 2, "is_correct": False},
                    {"text": "ไม่จำเป็นต้องมีพื้นที่ฮาร์ดดิสก์ในการจัดเก็บข้อมูล", "order": 3, "is_correct": False},
                    {"text": "ใช้งานได้โดยไม่ต้องมีระบบเชื่อมต่อไฟฟ้า", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 4,
                "question_text": "ฟิลด์ใดถือเป็นข้อมูลสำคัญที่สุด (Primary Anchor) ที่ต้องมีในทุก Record ของข้อมูล Telemetry จาก IoT?",
                "question_type": "multiple_choice",
                "difficulty": "Easy",
                "category": "Understanding",
                "skill": "COLLECT",
                "concept": "Telemetry Data Schema",
                "learning_objective": "ระบุองค์ประกอบจำเป็นของข้อมูล Telemetry",
                "points": 5.0,
                "explanation": "Timestamp และ Device ID คือสองฟิลด์สำคัญที่สุดที่ทำให้ระบุได้ว่าใครส่งและส่ง ณ เวลาใด",
                "options": [
                    {"text": "Timestamp (วัน-เวลาที่ตรวจวัด) และ Device ID (รหัสประจำอุปกรณ์)", "order": 1, "is_correct": True},
                    {"text": "ชื่อและนามสกุลจริงของผู้ผลิตอุปกรณ์", "order": 2, "is_correct": False},
                    {"text": "รหัสผ่าน Wi-Fi ของบ้านผู้ใช้งาน", "order": 3, "is_correct": False},
                    {"text": "ราคาทุนของฮาร์ดแวร์เซนเซอร์", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 4,
                "question_text": "ระบบ IoT Platform ตรวจสอบสถานะการเชื่อมต่อ (Online/Offline) ของอุปกรณ์ด้วยกลไกใด?",
                "question_type": "multiple_choice",
                "difficulty": "Medium",
                "category": "Understanding",
                "skill": "COLLECT",
                "concept": "Device Heartbeat & Last Seen",
                "learning_objective": "เข้าใจการทำงานของ Heartbeat และ Last Seen Timestamp",
                "points": 5.0,
                "explanation": "อาศัยสัญญาณ Heartbeat/Ping สม่ำเสมอร่วมกับการตรวจสอบ Last Seen Timestamp หากขาดการติดต่อไปเกินระยะ Timeout จะถือว่า Offline",
                "options": [
                    {"text": "การส่งสัญญาณ Heartbeat (ชีพจร) เป็นระยะ และตรวจสอบเวลาที่ติดต่อเข้ามาล่าสุด (Last Seen)", "order": 1, "is_correct": True},
                    {"text": "การให้ผู้ดูแลระบบเดินไปมองดูไฟ LED ที่ตัวอุปกรณ์", "order": 2, "is_correct": False},
                    {"text": "การส่งข้อความ SMS ถามอุปกรณ์ทุก 1 นาที", "order": 3, "is_correct": False},
                    {"text": "การตรวจสอบตำแหน่งดาวเทียม GPS", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 4,
                "question_text": "ในการออกแบบหน้าจอ Dashboard สำหรับคนดูแลสวน ข้อมูลใดควรแสดงผลเป็น Gauge/Value Card เด่นชัดที่สุด?",
                "question_type": "scenario",
                "scenario": "ทีมเกษตรกรผู้ดูแลสวนนาวาต้องการเหลือบมองหน้าจอแท็บเล็ตแล้วรู้สถานะความพร้อมรดน้ำทันทีใน 3 วินาทีแรกที่เปิดจอ",
                "difficulty": "Easy",
                "category": "Design",
                "skill": "VISUALIZE",
                "concept": "Dashboard Ergonomics",
                "learning_objective": "ออกแบบแดชบอร์ดตามหลัก User-Centric Design",
                "points": 5.0,
                "explanation": "ค่าความชื้นในดินปัจจุบันเทียบกับเกณฑ์ (Soil Moisture Gauge) และสถานะปั๊มน้ำ (Pump Status) คือสิ่งสำคัญต่อการตัดสินใจเร่งด่วน",
                "options": [
                    {"text": "เกจวัดค่าความชื้นในดินปัจจุบันเทียบกับเกณฑ์ และสถานะเปิด/ปิดของปั๊มน้ำแบบ Real-time", "order": 1, "is_correct": True},
                    {"text": "รายการโค้ดภาษา C++ ที่คอมไพล์ลงไมโครคอนโทรลเลอร์", "order": 2, "is_correct": False},
                    {"text": "ที่อยู่ MAC Address ของเราเตอร์ Wi-Fi ทุกตัวในเมือง", "order": 3, "is_correct": False},
                    {"text": "ประวัติการชำระบิลค่าไฟฟ้าของเทศบาล", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 4,
                "question_text": "จงจับคู่วิดเจ็ตการแสดงผลบนแดชบอร์ดให้เหมาะสมกับประเภทข้อมูล",
                "question_type": "matching",
                "difficulty": "Easy",
                "category": "Understanding",
                "skill": "VISUALIZE",
                "concept": "Dashboard Widgets",
                "learning_objective": "จับคู่วิดเจ็ตแสดงผลกับลักษณะข้อมูลที่ต้องการสื่อสาร",
                "points": 5.0,
                "explanation": "Gauge แสดงค่าปัจจุบันเทียบขอบเขต, Time-series Chart แสดงแนวโน้มย้อนหลัง, Status Indicator แสดงสถานะเปิดปิด, Event Table แสดงบันทึกเหตุการณ์",
                "options": [
                    {"text": "Gauge Widget -> ความชื้นปัจจุบันเทียบกับเกณฑ์ 0-100%", "order": 1, "is_correct": True},
                    {"text": "Line Chart -> แนวโน้มอุณหภูมิย้อนหลัง 24 ชั่วโมง", "order": 2, "is_correct": True},
                    {"text": "Status Toggle / Indicator -> สถานะเปิด/ปิดของปั๊มน้ำ (ON/OFF)", "order": 3, "is_correct": True},
                    {"text": "Event Table -> บันทึกประวัติการแจ้งเตือนระดับน้ำต่ำ", "order": 4, "is_correct": True},
                ]
            },
            {
                "chapter_seq": 4,
                "question_text": "ภาพใดคือแดชบอร์ดศูนย์ควบคุม IoT (Command Center Dashboard) ที่แสดงผลข้อมูลระบบอย่างถูกต้อง?",
                "question_type": "image_choice",
                "difficulty": "Easy",
                "category": "Understanding",
                "skill": "VISUALIZE",
                "concept": "Command Center Layout",
                "learning_objective": "ระบุองค์ประกอบของ Dashboard ที่สมบูรณ์",
                "points": 5.0,
                "explanation": "Dashboard ศูนย์ควบคุมรวมเกจวัด กราฟแนวโน้ม สถานะอุปกรณ์ และแผนผังระบบ",
                "options": [
                    {"text": "IoT Command Center Dashboard", "image_url": "/api/v1/media/uploads/iot_dashboard_mockup.png", "order": 1, "is_correct": True},
                    {"text": "Code IDE Window", "image_url": "/api/v1/media/uploads/ide_screenshot.png", "order": 2, "is_correct": False},
                    {"text": "Command Prompt CLI", "image_url": "/api/v1/media/uploads/terminal_cli.png", "order": 3, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 4,
                "question_text": "จงเรียงลำดับเส้นทางข้อมูล (Data Pipeline) จากเซนเซอร์จนปรากฏเป็นจุดบนกราฟแดชบอร์ด",
                "question_type": "ordering",
                "difficulty": "Hard",
                "category": "Design",
                "skill": "COLLECT, VISUALIZE",
                "concept": "Data Pipeline",
                "learning_objective": "ทำความเข้าใจ Data Pipeline ทั้งระบบตั้งแต่ต้นน้ำถึงปลายน้ำ",
                "points": 5.0,
                "explanation": "Sensor อ่านค่า -> ESP32 ส่ง MQTT -> Broker รับ -> Backend บันทึกลง Time-Series DB -> Frontend แดชบอร์ดดึงมาวาดกราฟ",
                "options": [
                    {"text": "1. เซนเซอร์อ่านค่าแรงดันไฟฟ้าและ ESP32 แปลงเป็นค่าความชื้น 18%", "order": 1, "is_correct": True},
                    {"text": "2. ESP32 แพ็กเกจข้อมูลเป็น JSON และ Publish ไปยัง MQTT Broker", "order": 2, "is_correct": True},
                    {"text": "3. IoT Backend บริโภคข้อความและประทับเวลาบันทึกลง Time-Series DB", "order": 3, "is_correct": True},
                    {"text": "4. Web Dashboard ส่ง Query ดึงข้อมูลล่าสุดผ่าน API และเรนเดอร์กราฟ", "order": 4, "is_correct": True},
                ]
            },
            {
                "chapter_seq": 4,
                "question_text": "การเก็บบันทึกข้อมูลความถี่สูงเกินจำเป็น (เช่น ทุกๆ 100 มิลลิวินาที สำหรับอุณหภูมิห้อง) ส่งผลเสียอย่างไร?",
                "question_type": "multiple_choice",
                "difficulty": "Medium",
                "category": "Analysis",
                "skill": "COLLECT",
                "concept": "Sampling Rate Optimization",
                "learning_objective": "ปรับความถี่การสุ่มตัวอย่างให้เหมาะสมกับลักษณะการเปลี่ยนแปลงของตัวแปร",
                "points": 5.0,
                "explanation": "อุณหภูมิเปลี่ยนช้า การส่งทุก 100ms ทำให้สิ้นเปลืองแบนด์วิธ เปลืองพื้นที่ฐานข้อมูล และเปลืองพลังงานแบตเตอรี่โดยไม่ได้ข้อมูลเชิงลึกเพิ่มขึ้น",
                "options": [
                    {"text": "สิ้นเปลืองแบนด์วิธเครือข่าย เปลืองพื้นที่จัดเก็บ และเปลืองพลังงานแบตเตอรี่อุปกรณ์โดยไม่เกิดประโยชน์", "order": 1, "is_correct": True},
                    {"text": "ทำให้เซนเซอร์วัดค่าได้เย็นลงกว่าความเป็นจริง", "order": 2, "is_correct": False},
                    {"text": "ทำให้หน้าจอคอมพิวเตอร์เกิดภาพเบลอ", "order": 3, "is_correct": False},
                    {"text": "ทำให้ความดันน้ำในท่อลดลง", "order": 4, "is_correct": False},
                ]
            },

            # =========================================================
            # CHAPTER 5 (8 questions) - Skill: AUTOMATE
            # =========================================================
            {
                "chapter_seq": 5,
                "question_text": "การทดลองจำลองระบบประหยัดพลังงาน: จงตั้งค่ากฎเงื่อนไขเพื่อปิดไฟเมื่อไม่มีคนอยู่ในศาลา",
                "question_type": "simulation",
                "difficulty": "Medium",
                "category": "Design",
                "skill": "AUTOMATE",
                "concept": "Rule Engine Logic",
                "learning_objective": "ตั้งกฎอัตโนมัติด้วยเงื่อนไข Presence",
                "points": 5.0,
                "explanation": "เงื่อนไขที่ถูกต้อง: IF presence == false THEN light = OFF",
                "options": [
                    {
                        "text": json.dumps({
                            "rule": "IF presence == false THEN light = OFF",
                            "sensor": "presence",
                            "operator": "==",
                            "threshold": False,
                            "action": "OFF",
                            "expected_output": {"light": "OFF"},
                            "test_cases": [
                                {"inputs": {"presence": False}, "expected": {"light": "OFF"}},
                                {"inputs": {"presence": True}, "expected": {"light": "ON"}}
                            ]
                        }),
                        "order": 1,
                        "is_correct": True
                    }
                ]
            },
            {
                "chapter_seq": 5,
                "question_text": "สถานการณ์: ระดับน้ำในถังเก็บเหลือ 8% และความชื้นในดินอยู่ที่ 15% ระบบควรกระทำสิ่งใด?",
                "question_type": "scenario",
                "scenario": "แปลงผักต้องการน้ำเพราะความชื้นดิน 15% (< 30%) แต่ระบบตรวจพบว่าระดับน้ำในถังเก็บ (Water Level) เหลือเพียง 8% ซึ่งต่ำกว่าเกณฑ์ความปลอดภัยขั้นต่ำ 10%",
                "difficulty": "Hard",
                "category": "Analysis",
                "skill": "AUTOMATE",
                "concept": "Multi-Condition Safety Interlock",
                "learning_objective": "จัดการเงื่อนไขความปลอดภัยขัดแย้ง (Safety Interlock)",
                "points": 5.0,
                "explanation": "เงื่อนไขความปลอดภัยต้องมาก่อน (Safety First): แม้ดินจะต้องการน้ำ แต่ถ้าน้ำในถังแห้ง ต้องห้ามเปิดปั๊มเพื่อกันปั๊มไหม้ (Dry Run) และส่งแจ้งเตือนระดับน้ำต่ำทันที",
                "options": [
                    {"text": "ห้ามเปิด Pump เพื่อป้องกันปั๊มน้ำไหม้ และส่งการแจ้งเตือนระดับน้ำต่ำ (Alert & Cutoff)", "order": 1, "is_correct": True},
                    {"text": "เปิด Pump เต็มกำลังเพื่อให้ดินชุ่มชื้นโดยไม่สนระดับน้ำ", "order": 2, "is_correct": False},
                    {"text": "สั่งเปิดไฟส่องสว่างในศาลาเพื่อไล่นก", "order": 3, "is_correct": False},
                    {"text": "ปิดระบบไฟฟ้าทั้งหมดของเมืองนาวา", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 5,
                "question_text": "ความแตกต่างสำคัญระหว่างการประมวลผลกฎที่ Edge (บน ESP32) กับที่ Cloud คืออะไร?",
                "question_type": "multiple_choice",
                "difficulty": "Medium",
                "category": "Analysis",
                "skill": "AUTOMATE",
                "concept": "Edge vs Cloud Automation",
                "learning_objective": "เปรียบเทียบข้อดีและข้อจำกัดของการประมวลผลที่ Edge และ Cloud",
                "points": 5.0,
                "explanation": "Edge ทำงานได้รวดเร็วและไม่ล่มแม้เน็ตจะตัดขาด แต่ความสามารถในการคำนวณจำกัด ส่วน Cloud รวมข้อมูลได้ทั้งระบบแต่ต้องพึ่งพาการเชื่อมต่ออินเทอร์เน็ต",
                "options": [
                    {"text": "Edge ตอบสนองได้ทันทีและทำงานต่อได้แม้อินเทอร์เน็ตขาดหาย ส่วน Cloud รวมข้อมูลได้ทั้งระบบแต่ต้องต่อเน็ต", "order": 1, "is_correct": True},
                    {"text": "Edge ใช้ได้เฉพาะเวลากลางคืน ส่วน Cloud ใช้ได้เฉพาะเวลากลางวัน", "order": 2, "is_correct": False},
                    {"text": "Cloud ไม่สามารถส่งการแจ้งเตือนไปยังสมาร์ตโฟนได้", "order": 3, "is_correct": False},
                    {"text": "Edge ปล่อยความร้อนออกมามากกว่าคลาวด์ดาต้าเซ็นเตอร์", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 5,
                "question_text": "ระบบ Rule Engine ที่ดีต้องรองรับตรรกะแบบผสมผสาน (Compound Conditions) เช่น AND และ OR",
                "question_type": "true_false",
                "difficulty": "Easy",
                "category": "Understanding",
                "skill": "AUTOMATE",
                "concept": "Compound Rule Logic",
                "learning_objective": "เข้าใจการสร้างตรรกะแบบผสมผสาน",
                "points": 5.0,
                "explanation": "จริง: สภาพแวดล้อมจริงต้องการเงื่อนไขซับซ้อน เช่น 'IF soil < 30 AND water_level > 10 THEN pump = ON'",
                "options": [
                    {"text": "จริง: การตัดสินใจในโลกจริงจำเป็นต้องตรวจเงื่อนไขหลายตัวแปรร่วมกันเพื่อความปลอดภัยและประสิทธิภาพ", "order": 1, "is_correct": True},
                    {"text": "เท็จ: กฎอัตโนมัติตรวจสอบได้เพียงตัวแปรเดียวตลอดไป", "order": 2, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 5,
                "question_text": "แนวคิด 'Human-in-the-loop' ในระบบอัตโนมัติของ IoT หมายถึงอะไร?",
                "question_type": "multiple_choice",
                "difficulty": "Medium",
                "category": "Understanding",
                "skill": "AUTOMATE",
                "concept": "Human-in-the-loop",
                "learning_objective": "เข้าใจบทบาทของมนุษย์ในการกำกับดูแลระบบอัตโนมัติ",
                "points": 5.0,
                "explanation": "Human-in-the-loop คือการให้ระบบทำงานอัตโนมัติได้ แต่ยังเปิดโอกาสให้มนุษย์สามารถตรวจสอบ อนุมัติคำสั่งวิกฤต หรือสั่งการแทนที่ (Manual Override) ได้เสมอ",
                "options": [
                    {"text": "ระบบเปิดโอกาสให้มนุษย์เข้ามาตรวจสอบ อนุมัติในจังหวะวิกฤต หรือกดสั่งการแทนที่ (Override) ได้ตลอดเวลา", "order": 1, "is_correct": True},
                    {"text": "การบังคับให้มนุษย์ต้องคอยเฝ้าหน้าจอทุกๆ วินาที", "order": 2, "is_correct": False},
                    {"text": "การให้มนุษย์ทำหน้าที่แทนไมโครคอนโทรลเลอร์", "order": 3, "is_correct": False},
                    {"text": "การตัดการทำงานของเครื่องจักรทั้งหมดเมื่อมนุษย์เดินเข้าใกล้", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 5,
                "question_text": "จงเรียงลำดับการประมวลผลเหตุการณ์แจ้งเตือนเมื่อระดับน้ำในถังต่ำกว่าเกณฑ์วิกฤต",
                "question_type": "ordering",
                "difficulty": "Medium",
                "category": "Design",
                "skill": "AUTOMATE",
                "concept": "Notification Pipeline",
                "learning_objective": "ลำดับกระบวนการตรวจจับเหตุการณ์และส่งต่อการแจ้งเตือน",
                "points": 5.0,
                "explanation": "อ่านค่า -> ตรวจพบต่ำกว่าเกณฑ์ -> บันทึก Log -> สั่งหยุดปั๊ม -> ส่งข้อความ Push Notification",
                "options": [
                    {"text": "1. เซนเซอร์ Ultrasonic อ่านระยะห่างและคำนวณพบระดับน้ำต่ำกว่า 10%", "order": 1, "is_correct": True},
                    {"text": "2. Rule Engine บนระบบตรวจสอบเงื่อนไขความปลอดภัยและระบุเป็นสภาวะวิกฤต (Critical Event)", "order": 2, "is_correct": True},
                    {"text": "3. ส่งคำสั่งตัดสวิตช์รีเลย์ของปั๊มน้ำทันทีเพื่อป้องกันความเสียหายของมอเตอร์", "order": 3, "is_correct": True},
                    {"text": "4. ส่งข้อความแจ้งเตือนด่วนผ่านแอปพลิเคชันหรือ LINE Notify ถึงผู้ดูแลสวน", "order": 4, "is_correct": True},
                ]
            },
            {
                "chapter_seq": 5,
                "question_text": "ในการป้องกัน 'การแจ้งเตือนซ้ำซ้อนรบกวน' (Alert Fatigue) วิธีการใดมีประสิทธิผลสูงสุด?",
                "question_type": "multiple_choice",
                "difficulty": "Hard",
                "category": "Design",
                "skill": "AUTOMATE",
                "concept": "Alert Throttling & Debounce",
                "learning_objective": "ออกแบบระบบ Alert Throttling และ Debounce",
                "points": 5.0,
                "explanation": "การทำ Alert Throttling (จำกัดความถี่ เช่น แจ้งซ้ำไม่เกิน 1 ครั้งใน 30 นาที) และการตั้ง Debounce Time ช่วยลดความรำคาญและไม่ทำให้ผู้ดูแลเพิกเฉยต่อการแจ้งเตือน",
                "options": [
                    {"text": "กำหนดระยะเวลาหน่วงการแจ้งเตือนซ้ำ (Alert Throttling / Cooldown Period เช่น ไม่เกิน 1 ครั้งต่อ 30 นาที)", "order": 1, "is_correct": True},
                    {"text": "ปิดเสียงลำโพงแจ้งเตือนทั้งหมดอย่างถาวร", "order": 2, "is_correct": False},
                    {"text": "ส่งการแจ้งเตือนรัวๆ ทุก 100 มิลลิวินาทีจนกว่าคนจะตื่น", "order": 3, "is_correct": False},
                    {"text": "ถอดเซนเซอร์ออกจากระบบเพื่อไม่ให้เกิดการเตือน", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 5,
                "question_text": "จงจับคู่ชนิดของเงื่อนไขการทำงานอัตโนมัติให้ตรงกับตัวอย่างการใช้งานจริงในสวนนาวา",
                "question_type": "matching",
                "difficulty": "Easy",
                "category": "Understanding",
                "skill": "AUTOMATE",
                "concept": "Automation Triggers",
                "learning_objective": "แยกแยะประเภทของ Trigger ในระบบอัตโนมัติ",
                "points": 5.0,
                "explanation": "Threshold Trigger ทำงานตามค่า, Schedule Trigger ทำงานตามเวลา, Event Trigger ทำงานตามเหตุการณ์, Geofence ทำงานตามตำแหน่ง",
                "options": [
                    {"text": "Threshold Trigger -> เมื่อความชื้นในดินลดต่ำกว่า 30%", "order": 1, "is_correct": True},
                    {"text": "Schedule Trigger -> รดน้ำทุกวันเวลา 06:00 น. และ 17:00 น.", "order": 2, "is_correct": True},
                    {"text": "Event Trigger -> เมื่อมีการกดปุ่มสวิตช์ฉุกเฉิน (Emergency Stop)", "order": 3, "is_correct": True},
                    {"text": "State Change Trigger -> เมื่อเซนเซอร์ตรวจจับคนเปลี่ยนสถานะจาก ไม่มีคน เป็น มีคน", "order": 4, "is_correct": True},
                ]
            },

            # =========================================================
            # CHAPTER 6 (8 questions) - Skill: ANALYZE
            # =========================================================
            {
                "chapter_seq": 6,
                "question_text": "กราฟประวัติศาสตร์แสดงความชื้นในดินลดลงอย่างต่อเนื่อง แม้ระบบจะบันทึกว่าเปิดปั๊มน้ำทุกวัน วิเคราะห์ได้ว่าอย่างไร?",
                "question_type": "scenario",
                "scenario": "จากกราฟไทม์ไลน์ 7 วันย้อนหลัง ปั๊มน้ำทำงานวันละ 2 รอบตามเวลาปกติ แต่ค่า Soil Moisture กลับลดลงจาก 40% -> 25% -> 12% โดยไม่เคยพุ่งสูงขึ้นเลยหลังรดน้ำ",
                "difficulty": "Hard",
                "category": "Analysis",
                "skill": "ANALYZE",
                "concept": "Physical Fault Isolation",
                "learning_objective": "วิเคราะห์ความผิดปกติทางกายภาพจากแนวโน้มข้อมูลย้อนหลัง",
                "points": 5.0,
                "explanation": "มอเตอร์ไฟฟ้าทำงานแต่ดินไม่เปียก บ่งชี้ว่าเกิดปัญหาทางกายภาพของระบบส่งน้ำ เช่น ท่อประปาแตก ท่อตัน หรือน้ำในถังแห้ง",
                "options": [
                    {"text": "เกิดความเสียหายทางกายภาพของระบบจ่ายน้ำ เช่น ท่อส่งน้ำแตก หัก หรือหัวจ่ายสปริงเกลอร์อุดตัน", "order": 1, "is_correct": True},
                    {"text": "เซนเซอร์วัดค่าแม่นยำเกินไปจนทำให้ดินแห้ง", "order": 2, "is_correct": False},
                    {"text": "ระบบ Wi-Fi มีความเร็วสูงเกินไป", "order": 3, "is_correct": False},
                    {"text": "เป็นพฤติกรรมปกติของดินในทุกสภาพอากาศ", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 6,
                "question_text": "อาการค่าความชื้นกระโดดสลับไปมาระหว่าง 0% และ 100% ภายใน 1 วินาทีซ้ำๆ บ่งบอกถึงสิ่งใด?",
                "question_type": "multiple_choice",
                "difficulty": "Medium",
                "category": "Analysis",
                "skill": "ANALYZE",
                "concept": "Sensor Noise & Electrical Fault",
                "learning_objective": "แยกแยะสัญญาณรบกวนและความผิดปกติทางไฟฟ้า",
                "points": 5.0,
                "explanation": "การแกว่งสุดขั้วในเวลาอันสั้นคือลักษณะเฉพาะของปัญหาทางไฟฟ้า เช่น สายสัญญาณหลวม ขั้วต่อช็อต หรือสายดิน (Ground) หลุด",
                "options": [
                    {"text": "ความผิดปกติของสัญญาณไฟฟ้า (Electrical Fault) เช่น ขั้วต่อหลวมหรือสายดินหลุด ไม่ใช่การเปลี่ยนแปลงทางกายภาพจริง", "order": 1, "is_correct": True},
                    {"text": "ดินในแปลงเปลี่ยนจากแห้งแล้งกลายเป็นน้ำท่วมฉับพลันใน 1 วินาที", "order": 2, "is_correct": False},
                    {"text": "ปั๊มน้ำกำลังสูบน้ำด้วยความเร็วแสง", "order": 3, "is_correct": False},
                    {"text": "แดชบอร์ดกำลังแสดงผลในโหมดประหยัดพลังงาน", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 6,
                "question_text": "โมเดล Anomaly Detection (ตรวจจับความผิดปกติ) ที่สร้างด้วย Machine Learning มีบทบาทอย่างไรใน AIoT?",
                "question_type": "multiple_choice",
                "difficulty": "Medium",
                "category": "Understanding",
                "skill": "ANALYZE",
                "concept": "AIoT Anomaly Detection",
                "learning_objective": "เข้าใจการนำ AI มาตรวจจับความผิดปกติในระบบ IoT",
                "points": 5.0,
                "explanation": "โมเดลเรียนรู้แพทเทิร์นปกติ และสามารถตรวจจับความผิดปกติที่ไม่เคยนิยามไว้ใน IF/THEN มาก่อนได้ล่วงหน้า",
                "options": [
                    {"text": "เรียนรู้รูปแบบพฤติกรรมปกติของระบบ และส่งสัญญาณเตือนเมื่อพบรูปแบบผิดปกติก่อนที่อุปกรณ์จะเสียหายอย่างสิ้นเชิง", "order": 1, "is_correct": True},
                    {"text": "ทำหน้าที่แทนเสาอากาศส่งสัญญาณ Wi-Fi", "order": 2, "is_correct": False},
                    {"text": "ช่วยเพิ่มแรงดันไฟฟ้าให้กับหม้อแปลง", "order": 3, "is_correct": False},
                    {"text": "ช่วยกำจัดวัชพืชในแปลงปลูกโดยตรง", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 6,
                "question_text": "Event Log (บันทึกประวัติเหตุการณ์) มีความสำคัญอย่างไรในการสืบสวนหาสาเหตุของปัญหา (Root Cause Analysis)?",
                "question_type": "multiple_choice",
                "difficulty": "Easy",
                "category": "Understanding",
                "skill": "ANALYZE",
                "concept": "Event Logging & Audit Trail",
                "learning_objective": "ใช้ Event Log ในการวิเคราะห์หาสาเหตุรากเหง้าของปัญหา",
                "points": 5.0,
                "explanation": "Log บันทึกเวลาและการกระทำที่เกิดขึ้นอย่างเป็นลำดับ ช่วยให้รู้ว่าอุปกรณ์ใดทำงานผิดพลาดก่อนหรือหลังเหตุการณ์",
                "options": [
                    {"text": "ช่วยสร้างเส้นเวลา (Timeline) ที่ชัดเจน เพื่อติดตามลำดับการเกิดเหตุการณ์ว่าสิ่งใดเกิดขึ้นก่อน-หลัง", "order": 1, "is_correct": True},
                    {"text": "ช่วยลดการจ่ายค่าลิขสิทธิ์ซอฟต์แวร์", "order": 2, "is_correct": False},
                    {"text": "ช่วยทำให้ไมโครคอนโทรลเลอร์กินไฟน้อยลง", "order": 3, "is_correct": False},
                    {"text": "ทำให้ปั๊มน้ำไม่ต้องใช้น้ำมันหล่อลื่น", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 6,
                "question_text": "ภาพใดแสดงกราฟข้อมูลที่มี Anomaly (ความผิดปกติแบบ Spike หรือ Drop) ที่ระบบ AIoT ควรตรวจจับได้?",
                "question_type": "image_choice",
                "difficulty": "Easy",
                "category": "Analysis",
                "skill": "ANALYZE",
                "concept": "Visualizing Anomalies",
                "learning_objective": "ระบุรูปร่างของ Anomaly บนกราฟข้อมูลอนุกรมเวลา",
                "points": 5.0,
                "explanation": "กราฟที่มี Spike พุ่งกระทันหันผิดรูปไปจากวงจรปกติของวัน คือภาพของ Anomaly ที่ชัดเจน",
                "options": [
                    {"text": "Sensor Anomaly Spike Pattern", "image_url": "/api/v1/media/uploads/anomaly_spike_chart.png", "order": 1, "is_correct": True},
                    {"text": "Normal Smooth Sine Wave", "image_url": "/api/v1/media/uploads/normal_sine_wave.png", "order": 2, "is_correct": False},
                    {"text": "Flat Zero Line", "image_url": "/api/v1/media/uploads/flat_zero_line.png", "order": 3, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 6,
                "question_text": "การวิเคราะห์เชิงพยากรณ์ (Predictive Analytics) แตกต่างจากการวิเคราะห์เชิงบรรยาย (Descriptive Analytics) อย่างไร?",
                "question_type": "multiple_choice",
                "difficulty": "Hard",
                "category": "Analysis",
                "skill": "ANALYZE",
                "concept": "Predictive vs Descriptive",
                "learning_objective": "เปรียบเทียบระดับความลึกของการวิเคราะห์ข้อมูล IoT",
                "points": 5.0,
                "explanation": "Descriptive บอกว่า 'เกิดอะไรขึ้นในอดีต' ส่วน Predictive ใช้โมเดลพยากรณ์ว่า 'น่าจะเกิดอะไรขึ้นต่อไปในอนาคต'",
                "options": [
                    {"text": "Descriptive อธิบายสิ่งที่เกิดขึ้นแล้วในอดีต ส่วน Predictive คาดการณ์สิ่งที่มีแนวโน้มจะเกิดขึ้นในอนาคต", "order": 1, "is_correct": True},
                    {"text": "Descriptive ใช้เฉพาะกับภาษา Python ส่วน Predictive ใช้เฉพาะกับภาษา HTML", "order": 2, "is_correct": False},
                    {"text": "Predictive ไม่ต้องใช้ข้อมูลในอดีตในการฝึกสอนโมเดล", "order": 3, "is_correct": False},
                    {"text": "Descriptive ให้ผลการทำนายที่แม่นยำกว่าการพยากรณ์เสมอ", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 6,
                "question_text": "จงจับคู่ประเภทของความผิดปกติ (Fault Type) กับอาการที่ตรวจพบบนข้อมูล",
                "question_type": "matching",
                "difficulty": "Medium",
                "category": "Analysis",
                "skill": "ANALYZE",
                "concept": "Fault Types",
                "learning_objective": "จำแนกประเภทความผิดปกติของระบบ IoT",
                "points": 5.0,
                "explanation": "Stuck-at คือค้างที่ค่าเดิม, Drift คือค่อยๆ เลื่อนผิดไปทีละน้อย, Noise คือสัญญาณกระโดดไปมา, Out-of-bounds คือค่าหลุดช่วงสเกลที่เป็นไปได้",
                "options": [
                    {"text": "Stuck-at Fault -> ค่าคงที่นิ่งสนิทไม่เปลี่ยนเลยเป็นเวลานาน", "order": 1, "is_correct": True},
                    {"text": "Drift Fault -> ค่าค่อยๆ เบี่ยงเบนออกห่างจากความจริงทีละน้อย", "order": 2, "is_correct": True},
                    {"text": "Spike / Noise Fault -> ค่ากระโดดสูงหรือต่ำผิดธรรมชาติในเสี้ยววินาที", "order": 3, "is_correct": True},
                    {"text": "Out-of-bounds Fault -> ค่าหลุดกรอบสเกล เช่น ความชื้นติดลบ หรือ อุณหภูมิ 200°C", "order": 4, "is_correct": True},
                ]
            },
            {
                "chapter_seq": 6,
                "question_text": "ระบบ AIoT ที่แนะนำปริมาณการรดน้ำล่วงหน้าโดยนำข้อมูลพยากรณ์อากาศกรมอุตุนิยมวิทยามาคำนวณ จัดเป็น Prescriptive Analytics",
                "question_type": "true_false",
                "difficulty": "Easy",
                "category": "Understanding",
                "skill": "ANALYZE",
                "concept": "Prescriptive Analytics",
                "learning_objective": "เข้าใจการวิเคราะห์เชิงให้คำแนะนำ (Prescriptive Analytics)",
                "points": 5.0,
                "explanation": "จริง: Prescriptive Analytics ไม่เพียงพยากรณ์ว่าจะเกิดอะไร แต่ยังให้คำแนะนำเฉพาะเจาะจงว่าควรลงมือทำอย่างไร (เช่น ปรับลดน้ำลง 30% เพราะฝนจะตก)",
                "options": [
                    {"text": "จริง: เป็นการวิเคราะห์ระดับสูงที่ให้ข้อเสนอแนะการกระทำที่ดีที่สุดแก่ผู้ใช้งาน", "order": 1, "is_correct": True},
                    {"text": "เท็จ: การนำพยากรณ์อากาศมารวมถือเป็นความผิดพลาดของระบบ", "order": 2, "is_correct": False},
                ]
            },

            # =========================================================
            # CHAPTER 7 (10 questions) - Skill: CREATE (Final Mission: "ภารกิจเปิดสวนอัจฉริยะ")
            # 10 sections * 10 points = 100 points
            # =========================================================
            {
                "chapter_seq": 7,
                "question_text": "ส่วนที่ 1: การวิเคราะห์ความต้องการ (Problem Analysis) — สวนเรียนรู้เมืองนาวามีความต้องการสำคัญใดบ้างที่ระบบต้องตอบสนอง?",
                "question_type": "multiple_choice",
                "difficulty": "Easy",
                "category": "Design",
                "skill": "CREATE",
                "concept": "Requirement Analysis",
                "learning_objective": "วิเคราะห์ความต้องการระบบ Smart Garden แบบองค์รวม",
                "points": 10.0,
                "explanation": "ความต้องการครอบคลุม: ตรวจวัดความชื้นดิน, รดน้ำอัตโนมัติ, ตรวจระดับน้ำถัง, แจ้งเตือนน้ำต่ำ, ตรวจจับคนเปิดไฟ, เก็บข้อมูลย้อนหลัง และตรวจจับความผิดปกติ",
                "options": [
                    {"text": "ตรวจวัดความชื้นดิน รดน้ำอัตโนมัติ เฝ้าระวังน้ำในถัง ตรวจคนเปิดไฟ เก็บข้อมูลแดชบอร์ด และตรวจจับความผิดปกติ", "order": 1, "is_correct": True},
                    {"text": "ติดตั้งกล้องวงจรปิดถ่ายทอดสดคอนเสิร์ตเพียงอย่างเดียว", "order": 2, "is_correct": False},
                    {"text": "สร้างระบบชำระเงินดิจิทัลสำหรับจำหน่ายผักในตลาด", "order": 3, "is_correct": False},
                    {"text": "ควบคุมดาวเทียมสื่อสารเพื่อกระจายสัญญาณวิทยุ", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 7,
                "question_text": "ส่วนที่ 2: ความต้องการด้านข้อมูล (Information Need) — ตัวแปรข้อมูลสำคัญใดบ้างที่ระบบต้องจัดเก็บเพื่อการตัดสินใจ?",
                "question_type": "multiple_choice",
                "difficulty": "Easy",
                "category": "Design",
                "skill": "CREATE",
                "concept": "Information Architecture",
                "learning_objective": "ระบุตัวแปรข้อมูลที่จำเป็นในระบบ Smart Garden",
                "points": 10.0,
                "explanation": "ตัวแปรจำเป็น: Soil Moisture, Water Level, Ambient Temp/Humidity, Human Presence, Pump State, Light State พร้อม Timestamp",
                "options": [
                    {"text": "Soil Moisture (%), Water Level (%), Ambient Temp/Humidity, Human Presence, Actuator States และ Timestamp", "order": 1, "is_correct": True},
                    {"text": "ข้อมูลบัญชีธนาคารและประวัติเครดิตบูโรของเกษตรกร", "order": 2, "is_correct": False},
                    {"text": "รหัสผ่าน Wi-Fi และหมายเลขบัตรประชาชนของประชาชนทุกคน", "order": 3, "is_correct": False},
                    {"text": "ข้อมูลเที่ยวบินขาเข้าของสนามบินนานาชาติ", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 7,
                "question_text": "ส่วนที่ 3: การเลือกเซนเซอร์ (Sensor Selection) — จงเลือกชุดเซนเซอร์ที่ถูกต้องเหมาะสมกับทั้ง 4 ภารกิจในสวนนาวา",
                "question_type": "matching",
                "difficulty": "Medium",
                "category": "Design",
                "skill": "CREATE",
                "concept": "Sensor Suite Design",
                "learning_objective": "จัดชุดเซนเซอร์ตามโจทย์ภารกิจ Smart Garden",
                "points": 10.0,
                "explanation": "Soil Moisture -> Capacitive, Water Level -> Ultrasonic, Presence -> PIR, Environment -> DHT22",
                "options": [
                    {"text": "ตรวจความชื้นดินเพื่อรดน้ำ -> Capacitive Soil Moisture Sensor", "order": 1, "is_correct": True},
                    {"text": "ตรวจระดับน้ำถังกันน้ำหมด -> Ultrasonic Distance Sensor", "order": 2, "is_correct": True},
                    {"text": "ตรวจคนเดินเข้าศาลาเพื่อเปิดไฟ -> PIR Motion Sensor", "order": 3, "is_correct": True},
                    {"text": "ตรวจสภาพอากาศภาพรวม -> DHT22 Temperature & Humidity Sensor", "order": 4, "is_correct": True},
                ]
            },
            {
                "chapter_seq": 7,
                "question_text": "ส่วนที่ 4: การเลือกคอนโทรลเลอร์ (Controller Selection) — ทำไมบอร์ด ESP32 จึงเหมาะสมเป็นสมองกลหลักในสวนนาวา?",
                "question_type": "multiple_choice",
                "difficulty": "Easy",
                "category": "Design",
                "skill": "CREATE",
                "concept": "Controller Capabilities",
                "learning_objective": "เลือกไมโครคอนโทรลเลอร์ที่รองรับความต้องการฮาร์ดแวร์และการเชื่อมต่อ",
                "points": 10.0,
                "explanation": "ESP32 มี dual-core, มีขา ADC สำหรับเซนเซอร์แอนะล็อก, มี GPIO ควบคุมรีเลย์, และมีทั้ง Wi-Fi และ Bluetooth ในชิปเดียว",
                "options": [
                    {"text": "มี Wi-Fi และ Bluetooth ในตัว มีขา ADC อ่านเซนเซอร์ มี GPIO ควบคุมรีเลย์ และราคาคุ้มค่า", "order": 1, "is_correct": True},
                    {"text": "เป็นคอมพิวเตอร์เมนเฟรมที่ต้องแช่ด้วยไนโตรเจนเหลว", "order": 2, "is_correct": False},
                    {"text": "ไม่ต้องใช้กระแสไฟฟ้าในการประมวลผลเลย", "order": 3, "is_correct": False},
                    {"text": "สามารถต่อตรงกับสายส่งไฟฟ้าแรงสูง 22,000 โวลต์ได้ทันที", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 7,
                "question_text": "ส่วนที่ 5: การเลือกการเชื่อมต่อ (Connectivity Selection) — เครือข่ายไร้สายใดเหมาะสำหรับแปลงปลูกในรัศมี 100 เมตรที่มีเราเตอร์สวน?",
                "question_type": "multiple_choice",
                "difficulty": "Medium",
                "category": "Design",
                "skill": "CREATE",
                "concept": "Network Architecture Selection",
                "learning_objective": "เลือกโครงสร้างเครือข่ายไร้สายที่เหมาะสมกับขอบเขตพื้นที่",
                "points": 10.0,
                "explanation": "ภายในรัศมี 100 เมตรของสวนเรียนรู้ที่มี Access Point อยู่แล้ว Wi-Fi 2.4GHz เหมาะสมที่สุดในแง่ความคุ้มค่าและความเร็ว",
                "options": [
                    {"text": "Wi-Fi 2.4GHz ครอบคลุมพื้นที่สวนเรียนรู้ เชื่อมต่อ Access Point ที่มีอยู่เดิมได้ทันที", "order": 1, "is_correct": True},
                    {"text": "สายไฟเบอร์ออปติกต่อตรงเข้าเซนเซอร์ทุกต้นไม้", "order": 2, "is_correct": False},
                    {"text": "สัญญาณวิทยุคลื่นสั้น AM", "order": 3, "is_correct": False},
                    {"text": "การส่งสัญญาณควันไฟ", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 7,
                "question_text": "ส่วนที่ 6: การออกแบบการสื่อสาร (Messaging & MQTT) — จงออกแบบ Topic Structure และทิศทางการส่งข้อมูล Telemetry และ Command",
                "question_type": "multiple_choice",
                "difficulty": "Medium",
                "category": "Design",
                "skill": "CREATE",
                "concept": "Telemetry & Command Topics",
                "learning_objective": "ออกแบบคู่หัวข้อ Telemetry สำหรับส่งข้อมูล และ Command สำหรับสั่งการ",
                "points": 10.0,
                "explanation": "แยก Topic ชัดเจน: Telemetry จากอุปกรณ์สู่คลาวด์ เช่น 'nava/garden/telemetry' และ Command จากคลาวด์สู่อุปกรณ์ เช่น 'nava/garden/cmd/pump'",
                "options": [
                    {"text": "แยก Telemetry 'nava/garden/telemetry' สำหรับส่งค่า และ 'nava/garden/cmd/pump' สำหรับรับคำสั่งควบคุม", "order": 1, "is_correct": True},
                    {"text": "ส่งทุกอย่างรวมกันใน Topic เดียวชื่อ 'test' โดยไม่มีโครงสร้าง", "order": 2, "is_correct": False},
                    {"text": "ใช้การส่งไฟล์ Excel แนบไปทางอีเมลทุก 1 วินาที", "order": 3, "is_correct": False},
                    {"text": "ห้ามใช้โปรโตคอล MQTT ในการส่งคำสั่งใดๆ ทั้งสิ้น", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 7,
                "question_text": "ส่วนที่ 7: แพลตฟอร์มและฐานข้อมูล (Platform & Database) — สถาปัตยกรรมคลาวด์ควรประกอบด้วยส่วนประกอบใด?",
                "question_type": "multiple_choice",
                "difficulty": "Medium",
                "category": "Design",
                "skill": "CREATE",
                "concept": "Cloud & Storage Architecture",
                "learning_objective": "ออกแบบชั้นเก็บข้อมูลและแพลตฟอร์มคลาวด์",
                "points": 10.0,
                "explanation": "สถาปัตยกรรมคลาวด์ประกอบด้วย: MQTT Broker รับส่งข้อมูล, Time-Series Database เก็บอนุกรมเวลา, และ API Gateway บริการแดชบอร์ด",
                "options": [
                    {"text": "MQTT Broker เป็นตัวรับส่งข้อความ, Time-Series DB เก็บข้อมูลอนุกรมเวลา, และ API Gateway ให้บริการแดชบอร์ด", "order": 1, "is_correct": True},
                    {"text": "เครื่องคอมพิวเตอร์ตั้งโต๊ะเครื่องเดียวที่ไม่มีระบบสำรองข้อมูล", "order": 2, "is_correct": False},
                    {"text": "การเขียนข้อมูลลงแฟลชไดรฟ์แล้วให้คนเดินไปคัดลอกทุกเย็น", "order": 3, "is_correct": False},
                    {"text": "การพิมพ์ข้อมูลออกมาเป็นกระดาษแล้วเก็บใส่แฟ้ม", "order": 4, "is_correct": False},
                ]
            },
            {
                "chapter_seq": 7,
                "question_text": "ส่วนที่ 8: กระดานสรุปผล (Dashboard Design) — จงจัดลำดับความสำคัญของข้อมูลบนแดชบอร์ดสำหรับผู้ดูแลสวน",
                "question_type": "ordering",
                "difficulty": "Medium",
                "category": "Design",
                "skill": "CREATE",
                "concept": "Dashboard Hierarchy",
                "learning_objective": "จัดลำดับ Visual Hierarchy บนแดชบอร์ดการควบคุม",
                "points": 10.0,
                "explanation": "แถบสถานะเร่งด่วน/การเตือน -> ตัวชี้วัดสำคัญปัจจุบัน (Gauge/KPI) -> กราฟแนวโน้มย้อนหลัง -> บันทึกประวัติและปุ่มควบคุม Manual",
                "options": [
                    {"text": "1. แถบแจ้งเตือนสถานะความปลอดภัยและเหตุการณ์วิกฤต (Alert Banner)", "order": 1, "is_correct": True},
                    {"text": "2. การ์ดแสดงค่าปัจจุบันและเกจความชื้น/ระดับน้ำ (Current Metrics & Gauges)", "order": 2, "is_correct": True},
                    {"text": "3. กราฟเส้นแนวโน้มการเปลี่ยนแปลงย้อนหลัง 24 ชั่วโมง (Historical Trends)", "order": 3, "is_correct": True},
                    {"text": "4. แผงสวิตช์ควบคุมแบบแมนนวลและการตั้งค่าพารามิเตอร์ (Control Panel)", "order": 4, "is_correct": True},
                ]
            },
            {
                "chapter_seq": 7,
                "question_text": "ส่วนที่ 9: ระบบอัตโนมัติและความปลอดภัย (Automation & Interlock) — สถานการณ์จำลองรดน้ำอัตโนมัติพร้อม Safety Interlock",
                "question_type": "simulation",
                "difficulty": "Hard",
                "category": "Design",
                "skill": "CREATE",
                "concept": "Multi-condition Automation Engine",
                "learning_objective": "สร้างและตรวจสอบกฎความปลอดภัยรดน้ำอัตโนมัติหลายเงื่อนไข",
                "points": 10.0,
                "explanation": "เงื่อนไข: IF soil_moisture < 30 AND water_level > 10 THEN pump = ON ELSE pump = OFF",
                "options": [
                    {
                        "text": json.dumps({
                            "rule": "IF soil_moisture < 30 AND water_level > 10 THEN pump = ON ELSE pump = OFF",
                            "sensor": "soil_moisture",
                            "operator": "<",
                            "threshold": 30,
                            "safety_sensor": "water_level",
                            "safety_threshold": 10,
                            "action": "ON",
                            "expected_output": {"pump": "ON"},
                            "test_cases": [
                                {"inputs": {"soil_moisture": 18, "water_level": 70}, "expected": {"pump": "ON"}},
                                {"inputs": {"soil_moisture": 18, "water_level": 5}, "expected": {"pump": "OFF"}},
                                {"inputs": {"soil_moisture": 35, "water_level": 70}, "expected": {"pump": "OFF"}}
                            ]
                        }),
                        "order": 1,
                        "is_correct": True
                    }
                ]
            },
            {
                "chapter_seq": 7,
                "question_text": "ส่วนที่ 10: สถาปัตยกรรมระบบองค์รวม (Interactive Architecture Builder) — จงสร้างการเชื่อมต่อสถาปัตยกรรม IoT แบบสมบูรณ์",
                "question_type": "architecture_builder",
                "difficulty": "Hard",
                "category": "Design",
                "skill": "CREATE",
                "concept": "End-to-End System Architecture",
                "learning_objective": "สร้างและเชื่อมต่อสถาปัตยกรรม IoT จากโลกกายภาพสู่แดชบอร์ด",
                "points": 10.0,
                "explanation": "สถาปัตยกรรมที่ถูกต้อง: Physical World -> Sensor -> ESP32 -> Wi-Fi -> MQTT -> IoT Platform -> Database -> Dashboard",
                "options": [
                    {
                        "text": json.dumps({
                            "required_nodes": [
                                "physical_world", "sensor", "esp32", "wifi",
                                "mqtt", "iot_platform", "database", "dashboard"
                            ],
                            "required_connections": [
                                ["physical_world", "sensor"],
                                ["sensor", "esp32"],
                                ["esp32", "wifi"],
                                ["wifi", "mqtt"],
                                ["mqtt", "iot_platform"],
                                ["iot_platform", "database"],
                                ["database", "dashboard"]
                            ],
                            "invalid_connections": [
                                ["sensor", "dashboard"],
                                ["database", "sensor"],
                                ["dashboard", "sensor"],
                                ["physical_world", "dashboard"]
                            ]
                        }),
                        "order": 1,
                        "is_correct": True
                    }
                ]
            },
        ]

        print(f"Total question templates ready: {len(raw_question_bank)}")

        # 6. Create Quizzes for Chapters 0 to 7
        quiz_titles = {
            0: ("แบบทดสอบบทที่ 0: ปฐมบท IoT เมืองนาวา", "ประเมินความเข้าใจพื้นฐาน สถาปัตยกรรม และองค์ประกอบของวงจร IoT", 70.0, 15, None),
            1: ("แบบทดสอบบทที่ 1: การตรวจวัดและเซนเซอร์", "ประเมินความรู้การเลือกเซนเซอร์ สัญญาณแอนะล็อก/ดิจิทัล และการคาลิเบรต", 70.0, 20, None),
            2: ("แบบทดสอบบทที่ 2: คอนโทรลเลอร์และการสั่งการ", "ประเมินทักษะไมโครคอนโทรลเลอร์ ESP32 รีเลย์ และการจำลองระบบรดน้ำ", 70.0, 20, None),
            3: ("แบบทดสอบบทที่ 3: เครือข่ายไร้สายและ MQTT", "ประเมินความรู้ด้าน Wi-Fi, LoRa, โปรโตคอล MQTT, Topic และ QoS", 70.0, 20, None),
            4: ("แบบทดสอบบทที่ 4: แพลตฟอร์มคลาวด์และแดชบอร์ด", "ประเมินความรู้ฐานข้อมูล Time-Series, Telemetry และการออกแบบ Dashboard", 70.0, 20, None),
            5: ("แบบทดสอบบทที่ 5: ระบบอัตโนมัติและกฎอัจฉริยะ", "ประเมินทักษะ Rule Engine, การจำลองควบคุมแสงสว่าง และ Safety Interlock", 70.0, 20, None),
            6: ("แบบทดสอบบทที่ 6: การวิเคราะห์ข้อมูลและ AIoT", "ประเมินทักษะการวิเคราะห์กราฟประวัติศาสตร์ ตรวจจับ Anomaly และ Root Cause", 70.0, 20, None),
            7: ("ภารกิจเปิดสวนอัจฉริยะ (Final Mission: Smart Garden)", "ภารกิจออกแบบระบบ Smart Garden ครบวงจร 10 มิติ คะแนนเต็ม 100 คะแนน", 70.0, 30, None),
        }

        quizzes_by_ch = {}
        for ch_seq, (q_title, q_desc, passing_score, time_limit, _) in quiz_titles.items():
            ch_obj = chapter_objs[ch_seq]
            les_obj = lesson_objs[ch_seq]

            quiz = Quiz.query.filter_by(course_id=course.classroom_id, title=q_title).first()
            if not quiz:
                quiz = Quiz(
                    course_id=course.classroom_id,
                    lesson_id=les_obj.lesson_id,
                    title=q_title,
                    description=q_desc
                )
                db.session.add(quiz)
                db.session.flush()

                qc = QuizCondition(
                    quiz_id=quiz.quiz_id,
                    passing_score=passing_score,
                    time_limit_minutes=time_limit,
                    max_attempts=5
                )
                db.session.add(qc)
                db.session.flush()

            quizzes_by_ch[ch_seq] = quiz

        # 7. Insert Questions & QuestionOptions into PostgreSQL
        total_seeded = 0
        ch_q_counters = {i: 1 for i in range(8)}

        for q_data in raw_question_bank:
            ch_seq = q_data["chapter_seq"]
            quiz = quizzes_by_ch[ch_seq]
            order_no = ch_q_counters[ch_seq]
            ch_q_counters[ch_seq] += 1

            # Check if existing question matches text
            q_rec = Question.query.filter_by(question_text=q_data["question_text"]).first()
            if not q_rec:
                q_rec = Question(
                    question_text=q_data["question_text"],
                    question_type=q_data["question_type"],
                    explanation=q_data.get("explanation"),
                    points=q_data.get("points", 1.0),
                    scenario=q_data.get("scenario"),
                    difficulty=q_data.get("difficulty"),
                    skill=q_data.get("skill"),
                    concept=q_data.get("concept"),
                    learning_objective=q_data.get("learning_objective"),
                    chapter=f"Chapter {ch_seq}",
                    episode=f"EP {ch_seq}.1",
                )
                db.session.add(q_rec)
                db.session.flush()

                # Add Options
                for opt in q_data.get("options", []):
                    q_opt = QuestionOption(
                        question_id=q_rec.question_id,
                        option_text=opt.get("text", ""),
                        image_url=opt.get("image_url"),
                        is_correct=opt.get("is_correct", False),
                        order_no=opt.get("order", 1)
                    )
                    db.session.add(q_opt)

            # Ensure QuizQuestion mapping
            qq = QuizQuestion.query.filter_by(quiz_id=quiz.quiz_id, question_id=q_rec.question_id).first()
            if not qq:
                qq = QuizQuestion(
                    quiz_id=quiz.quiz_id,
                    question_id=q_rec.question_id,
                    order_no=order_no
                )
                db.session.add(qq)
            else:
                qq.order_no = order_no

            total_seeded += 1

        db.session.commit()
        print(f"Successfully verified & seeded {total_seeded} questions across 8 chapters in PostgreSQL!")

        # Verify summary
        for ch_seq in range(8):
            q_count = QuizQuestion.query.filter_by(quiz_id=quizzes_by_ch[ch_seq].quiz_id).count()
            print(f"Chapter {ch_seq} ({quiz_titles[ch_seq][0]}): {q_count} questions")


if __name__ == "__main__":
    seed_iot101()
