# แผนปฏิบัติการย้ายและปรับปรุงโครงสร้างฐานข้อมูล (DATABASE_MIGRATION_PLAN.md)

> **STATUS: MIGRATION PLAN LOCKED & SCRIPT GENERATED — REVISION 4d8f1e29a35c**
> **SOURCE OF TRUTH: FEATURE LIST 10 MODULES**
> **TOTAL REGISTERED TABLES: 88 (14 EXISTING + 74 NEWLY CREATED)**
> แผนงานฉบับปรับปรุงนี้ล็อกขั้นตอนการย้ายและสร้างโครงสร้างฐานข้อมูลครอบคลุมทั้ง 10 Modules ตาม Feature List ล่าสุดอย่างเป็นทางการ พร้อมไฟล์ Alembic Migration `4d8f1e29a35c_update_schema_to_10_modules.py` ที่ผ่านการทดสอบ Dry-run SQL 100%

---

## 1. กฎเหล็กและข้อกำหนดความปลอดภัย (Strict Migration Rules)

1. **Strict 10 Modules Source of Truth:**
   - ยึด Feature List 10 Modules เป็นข้อกำหนดเด็ดขาด
   - **ห้ามสร้างตาราง `Parent` หรือ `ParentStudent` โดยเด็ดขาด** (ตัดฟีเจอร์พอร์ทัลผู้ปกครองของเวอร์ชันเก่าออกทั้งหมด)
   - ไม่มีการสร้าง Module 11 หรือ 12 เพิ่มเติม
2. **No Destructive Operations:**
   - ห้าม Drop ตารางเดิมหรือลบคอลัมน์เดิมที่มีการใช้งานจริง
   - ตาราง `token_blocklist` ถูก **คงไว้ตลอดกระบวนการ** เพื่อรักษาความปลอดภัยของระบบ JWT Logout (`@jwt.token_in_blocklist_loader`)
   - ตาราง `journals` ถูก **คงไว้ตลอดกระบวนการ** เพื่อรองรับฟีเจอร์บันทึกการเรียนรู้ส่วนตัวของนักเรียน (UAT-031 ถึง UAT-033)
3. **Non-Breaking Curriculum Evolution:**
   - การคงชื่อ Physical Table `courses` และรักษา `Course = Classroom` alias ไว้เพื่อไม่ให้ API เดิมพัง
   - การแทรกตาราง `Chapter` คั่นระหว่าง Course และ Lesson โดยรองรับทั้ง `chapter_id` และ `classroom_id`
4. **Dual-Pointer Grace Period ใน `contents`:**
   - คงทั้ง `episode_id` และ `lesson_id` ในตาราง `contents` ไว้อย่างสมบูรณ์ เพื่อรองรับ API เก่าและใหม่คู่ขนาน

---

## 2. ลำดับขั้นตอนการ Migration (10 Modules Sequence)

### PHASE 0: Baseline Alignment & Migration Gap Closure
- **Dependencies:** ตารางเดิมในระบบ (`users`, `roles`, `courses`, `lessons`, `episodes`, `contents`, `journals`, `token_blocklist`, `system_settings` ฯลฯ)
- **การปฏิบัติการ:**
  1. บรรจุคำสั่งสร้างตาราง `password_reset_tokens` ลงใน Migration Script เพื่อปิด Migration Gap จากระบบเดิม
  2. เชื่อมโยง Migration Chain ต่อจาก Head เดิม `25785666d6bc` สู่ Revision ใหม่ `4d8f1e29a35c`

### PHASE 1: Module 1 — บัญชีผู้ใช้และการจัดการผู้ใช้ (User & School Infrastructure)
- **Dependencies:** `users`, `roles`
- **ตารางที่สร้าง/ปรับปรุง:**
  - `permissions` (สิทธิ์ระดับ Granular Functions)
  - `role_permissions` (Mapping Many-to-Many ระหว่าง Role และ Permission สำหรับ Enterprise RBAC)
  - `user_access` (ประวัติการเข้าถึงและการกำหนดอายุสิทธิ์)
  - `sessions` (Session ข้ามอุปกรณ์ พร้อม `ended_at`, `revoked_at`)
  - `password_histories` (ประวัติรหัสผ่านเก่าป้องกันการตั้งรหัสซ้ำ)
  - `schools`, `school_settings`, `school_users` (ระบบโรงเรียน Multi-Tenancy)
  - `students`, `instructors`, `instructor_schools` (โปรไฟล์เฉพาะบทบาทและสังกัดโรงเรียน)
  - `classrooms` (`SchoolClassroom`), `classroom_students` (ห้องเรียนในโรงเรียนและสมาชิกนักเรียน)
  - ปรับปรุง `roles`: เพิ่มคอลัมน์ `description`

### PHASE 2: Module 2 — ระบบจัดการการเรียนรู้ (LMS)
- **Dependencies:** `users`, `courses`
- **ตารางที่สร้าง/ปรับปรุง:**
  - `course_categories` (หมวดหมู่คอร์สเรียน)
  - ปรับปรุง `courses`: เพิ่มคอลัมน์ `category_id` (FK → `course_categories.category_id`)
  - `chapters` (ลำดับชั้นโครงสร้างหลักสูตรระหว่าง Course และ Lesson)
  - ปรับปรุง `lessons`: เพิ่มคอลัมน์ `chapter_id` (FK → `chapters.chapter_id`) โดยคง `classroom_id` ไว้
  - `media` (ไฟล์สื่อการเรียนรู้ วิดีโอ เอกสาร)
  - `reviews` (รีวิวและคะแนนคอร์สเรียน พร้อม Unique Constraint `user_id` + `course_id`)
  - คงตาราง `journals` และ Dual-Pointer ใน `contents` (`episode_id` และ `lesson_id`)

### PHASE 3: Module 3 — ระบบสตรีมมิ่ง (Live Class & Streaming)
- **Dependencies:** `users`, `courses`
- **ตารางที่สร้าง:**
  - `online_rooms` (ห้องถ่ายทอดสด WebRTC / Streaming)
  - `live_schedules` (ตารางนัดหมายเวลาเรียนสด)
  - `live_sessions` (เซสชันการถ่ายทอดสดจริง)
  - `chat_messages` (ข้อความแชทสดระหว่างเรียน)
  - `live_recordings` (ไฟล์บันทึกย้อนหลังของเซสชันสด)
  - `live_participants` (รายชื่อและสถานะผู้เข้าร่วมสด พร้อม `mic_permission`)

### PHASE 4: Module 4 — ระบบความก้าวหน้า (Learning Progress & Analytics)
- **Dependencies:** `users`, `courses`, `lessons`, `episodes`
- **ตารางที่สร้าง:**
  - `learning_progress` (ความคืบหน้ารายคอร์ส)
  - `lesson_progress` (ความคืบหน้ารายบทเรียน)
  - `episode_progress` (ความคืบหน้ารายตอน)
  - `learning_activities` (บันทึกกิจกรรมการเรียนรู้แบบละเอียด)
  - `skills` (คลังทักษะความรู้)
  - `user_skills` (ระดับทักษะความชำนาญของผู้เรียน)
  - `learning_summaries` (สรุปภาพรวมเวลาเรียนและคอร์สที่จบ)

### PHASE 5: Module 5 — ระบบสร้างแรงจูงใจ (Gamification)
- **Dependencies:** `users`
- **ตารางที่สร้าง:**
  - `user_xps` (บันทึกการได้รับแต้มประสบการณ์ XP)
  - `levels` (เกณฑ์ระดับขั้นและเลเวล)
  - `user_levels` (เลเวลปัจจุบันของผู้เรียน)
  - `badges` (ตราสัญลักษณ์รางวัล)
  - `user_badges` (เหรียญรางวัลที่ผู้เรียนปลดล็อก)
  - `user_streaks` (สถิติการเรียนต่อเนื่อง พร้อม `longest_streak`, `last_activity_date`)
  - `leaderboards` (กระดานผู้นำรายสัปดาห์/เดือน/ทั้งหมด)
  - `missions` (ภารกิจรายวัน/รายสัปดาห์ พร้อมแต้มและของรางวัล)
  - `mission_progress` (ความคืบหน้าการทำภารกิจ)
  - `rewards` (แคตตาล็อกของรางวัลและสิทธิพิเศษ)
  - `user_rewards` (ของรางวัลที่ผู้เรียนแลกรับ)

### PHASE 6: Module 6 — ระบบดำเนินเนื้อเรื่องและภารกิจ (Story Mode)
- **Dependencies:** `users`, `courses`
- **ตารางที่สร้าง:**
  - `stories` (เนื้อเรื่องหลักประจำคอร์ส)
  - `story_scenes` (ฉากและบทบรรยายตามลำดับ `sequence_no`)
  - `story_progress` (จุดเซฟและสถานะความคืบหน้าของนักเรียน)

### PHASE 7: Module 7 — เครื่องมือจำลองและห้องทดลองเสมือน (Virtual Lab)
- **Dependencies:** `users`, `courses`
- **ตารางที่สร้าง:**
  - `virtual_labs` (ห้องทดลองเสมือน วงจรจำลอง หรือ Simulator)
  - `lab_projects` (โปรเจกต์งานทดลองของผู้เรียน)
  - `lab_devices` (อุปกรณ์และเซนเซอร์ที่ใช้งานในโปรเจกต์)
  - `simulations` (สถานะและผลการรัน Simulation)
  - `lab_assignments` (โจทย์การทดลองที่มอบหมายในคอร์ส)

### PHASE 8: Module 8 — ระบบแบบฝึกหัดและแบบทดสอบ (Exercises & Quizzes)
- **Dependencies:** `users`, `courses`, `lessons`
- **ตารางที่สร้าง:**
  - **Coding Engine:**
    - `coding_exercises` (โจทย์เขียนโค้ดและสภาพแวดล้อมภาษา)
    - `test_cases` (กรณีทดสอบ ตรวจสอบ input/output ทั้งแบบเปิดและแบบซ่อน)
    - `code_submissions` (โค้ดที่ผู้เรียนส่งตรวจ)
    - `code_executions` (ผลการประเมินโค้ด, stdout, stderr, runtime)
  - **General Exercise:**
    - `exercises` (แบบฝึกหัดเสริมทักษะทั่วไป)
    - `exercise_attempts` (ประวัติการทำแบบฝึกหัดและคะแนน)
  - **Quiz & Examination Engine:**
    - `questions` (คลังข้อสอบกลาง)
    - `question_options` (ตัวเลือกคำตอบและเฉลย)
    - `quizzes` (ชุดแบบทดสอบ)
    - `quiz_conditions` (เกณฑ์การสอบ เช่น จำนวนครั้งสูงสุด, เวลาสอบ, คะแนนผ่าน)
    - `quiz_questions` (การจัดชุดข้อสอบ)
    - `quiz_attempts` (การเข้าสอบของผู้เรียน)
    - `quiz_answers` (คำตอบที่ผู้เรียนเลือก)
    - `quiz_results` (ผลสอบ คะแนนรวม เปอร์เซ็นต์ และสถานะผ่าน/ไม่ผ่าน)

### PHASE 9: Module 9 — การบริหารจัดการและกำกับดูแลระบบ (Admin & Governance)
- **Dependencies:** `users`, `schools`
- **ตารางที่สร้าง:**
  - `interactive_components` (วิดเจ็ตและองค์ประกอบเชิงโต้ตอบ)
  - `announcements` (ประกาศข่าวสารระดับโรงเรียนและระบบ)
  - `notifications` (การแจ้งเตือนผู้ใช้)
  - `reports` (รายงานสถิติระดับบริหาร)
  - `audit_logs` (ประวัติการดำเนินการของแอดมินและผู้ใช้)
  - `security_logs` (บันทึกเหตุการณ์ความปลอดภัย พร้อม IP และ User-Agent)
  - `backups` (ประวัติการสำรองข้อมูล ขนาดไฟล์ และ Checksum)
  - `system_settings` (คงไว้และใช้ควบคุม Global Configs และค่าตัวแปร AI)

### PHASE 10: Module 10 — ระบบผู้ช่วย AI (AI Assistant)
- **Dependencies:** `users`, `coding_exercises`
- **ตารางที่สร้าง:**
  - `ai_conversations` (ประวัติห้องสนทนากับ AI)
  - `ai_messages` (ข้อความโต้ตอบ คำถาม และคำตอบจาก AI)
  - `ai_code_requests` (คำขอคำแนะนำหรือวิเคราะห์โค้ด)
  - `ai_hints` (คำใบ้และตัวช่วยเขียนโค้ดตามบริบท)
  - *(การตั้งค่าโมเดลและ Token Limit ควบคุมผ่าน `system_settings` ใน Module 9)*

---

## 3. กลยุทธ์การจัดการ Dual-Pointer ในตาราง `contents`

```text
Phase A: Preserve existing data (คง episode_id และ lesson_id ไว้ในตาราง contents ทั้งคู่)
   ↓
Phase B: Create target relationship (สร้างตาราง Media และเชื่อมโยง Episode → Content → Media)
   ↓
Phase C: Backfill data (ตรวจสอบและเติมเต็ม episode_id ให้กับทุกแถวใน contents อย่างครบถ้วน)
   ↓
Phase D: Update APIs (ปรับปรุง API ใน app/routes/lessons.py ให้อ่าน/เขียนผ่าน episode_id เป็นหลัก)
   ↓
Phase E: Run tests / validate data (รัน Integration Test Suite ยืนยันความเข้ากันได้)
   ↓
Phase F: Deprecate legacy pointer (พิจารณาถอด foreign key lesson_id ออกเฉพาะเมื่อผ่านการอนุมัติหลังขึ้น Production)
```

---

## 4. ข้อมูลและสถานะของ Alembic Migration Script

- **ไฟล์ Migration:** `backend/migrations/versions/4d8f1e29a35c_update_schema_to_10_modules.py`
- **Revision ID:** `4d8f1e29a35c`
- **Revises (Down Revision):** `25785666d6bc`
- **คำสั่งรัน Migration จริง:**
  ```bash
  flask db upgrade
  ```
- **คำสั่งสร้าง DDL Preview (Dry-run):**
  ```bash
  flask db upgrade --sql 25785666d6bc:4d8f1e29a35c
  ```