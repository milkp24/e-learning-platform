# เอกสารประเด็นข้อตัดสินใจเชิงสถาปัตยกรรม (DATABASE_MAPPING_DECISIONS.md)

> **STATUS: ARCHITECTURAL DECISIONS LOCKED — 10-MODULE IMPLEMENTATION**
> **SOURCE OF TRUTH: FEATURE LIST 10 MODULES**
> **TOTAL REGISTERED TABLES: 88 TABLES**
> เอกสารฉบับนี้บันทึกข้อสรุปและข้อตัดสินใจเชิงสถาปัตยกรรม (Locked Decisions) ทั้ง 11 ประเด็น สำหรับการพัฒนาและปรับปรุงโครงสร้างฐานข้อมูลของระบบ E-learning Platform ให้สอดคล้องกับ Feature List 10 Modules ล่าสุด 100%

---

## สรุปการจัดหมวดหมู่และจำนวน Entities (Target Entity Count Breakdown)

| หมวดหมู่ Entity | จำนวน | รายการ Entities | วัตถุประสงค์และสถานะ |
| :--- | :---: | :--- | :--- |
| **1. Core 10 Modules Entities** | **85** | ครอบคลุมทั้ง 10 Modules ตาม Source of Truth | โครงสร้างหลักของระบบตาม Feature List |
| **2. Supporting Infrastructure** | **1** | `token_blocklist` | โครงสร้างความปลอดภัยจำเป็นสำหรับ JWT Stateless Logout (UAT-013, 014) |
| **3. Legacy / Supporting Features** | **1** | `journals` | ฟีเจอร์บันทึกการเรียนรู้ส่วนตัวของนักเรียน (UAT-031 ถึง 033) |
| **4. RBAC Mapping Table** | **1** | `RolePermission` | ตาราง Mapping Many-to-Many เชื่อม Role และ Permission |
| **รวมตารางทั้งหมดในระบบ** | **88** | 14 ตารางเดิม + 74 ตารางใหม่ | ครบถ้วนตามสถาปัตยกรรม 10 Modules |

---

## DECISION 1: classrooms → Course
**STATUS:** `LOCKED & IMPLEMENTED`

- **คำตัดสิน:** ให้ถือว่าตาราง `classrooms` เดิมทำหน้าที่เป็น **Online Course** 100% (ตารางจริงคือ `courses`)
- **แนวทางปฏิบัติ (Action Items):**
  - คงชื่อตาราง physical table `courses` ไว้
  - ในโค้ดโมเดล `app/models/classroom.py`: กำหนด `Classroom` ให้แมปกับตาราง `courses` และมี `Course = Classroom` เพื่อรองรับ Backward Compatibility สำหรับ API และ Unit Tests เดิม
  - สร้างตาราง `classrooms` ใหม่สำหรับ Module 1.10 (ห้องเรียนโรงเรียน) โดยมีคอลัมน์ `classroom_id (UUID PK)`, `school_id (UUID FK → schools.school_id)`, `classroom_name (VARCHAR 100)`
  - **ข้อกำหนดเด็ดขาด:** แยกการทำงานระหว่าง Course (หลักสูตรออนไลน์) และ Classroom (ห้องเรียนในโรงเรียน) ออกจากกันอย่างชัดเจน

---

## DECISION 2: Chapter insertion (Curriculum Hierarchy)
**STATUS:** `LOCKED & IMPLEMENTED`

- **คำตัดสิน:** ปรับลำดับชั้นบทเรียนให้ตรงตาม Target Schema: `Course → Chapter → Lesson → Episode → Content → Media`
- **แนวทางปฏิบัติ (Action Items):**
  - สร้างตาราง `Chapter` (`chapters`) คั่นระหว่าง Course และ Lesson โดยมี `course_id FK → courses.classroom_id`
  - ตาราง `Lesson` เพิ่มคอลัมน์ `chapter_id (FK → chapters.chapter_id, nullable=True)` โดยคงคอลัมน์ `classroom_id` เดิมไว้
  - ไม่มีการลบข้อมูลบทเรียนเดิม โดยระบบรองรับการเข้าถึงทั้งผ่าน `chapter_id` และ `classroom_id`

---

## DECISION 3: Content Dual-Pointer
**STATUS:** `LOCKED & IMPLEMENTED`

- **คำตัดสิน:** ตาราง `contents` รองรับสถาปัตยกรรม Dual-Pointer โดยคงทั้ง `episode_id` และ `lesson_id` ชี้ไปยัง Parent ทั้งสองระดับ
- **แนวทางปฏิบัติ (Action Items):**
  - คงทั้งสอง Foreign Key ไว้ในตาราง `contents`:
    - `episode_id`: ชี้ไปยัง `episodes.episode_id` (สำหรับเนื้อหาที่เป็นตอน)
    - `lesson_id`: ชี้ไปยัง `lessons.lesson_id` (สำหรับเนื้อหาระดับบทเรียนเดิม)
  - ห้าม Drop คอลัมน์ `lesson_id` ออกในขั้นตอนนี้ เพื่อป้องกันผลกระทบต่อ API เดิมใน `app/routes/lessons.py`

---

## DECISION 4: journals
**STATUS:** `LOCKED — KEEP`

- **คำตัดสิน:** ให้คงตาราง `journals` ไว้ในระบบต่อไปในฐานะ Supporting Feature นอก Core 10 Modules
- **แนวทางปฏิบัติ (Action Items):**
  - **ห้าม Drop และห้ามลบตาราง `journals` เด็ดขาด**
  - เหตุผล: มี API Blueprint ใช้งานจริง (`app/routes/journals.py`), มี Frontend รองรับ (`JournalView.jsx`), และมี UAT Test Coverage (UAT-031 ถึง UAT-033)
  - จัดหมวดหมู่ให้อยู่ในกลุ่ม `Legacy / Supporting Features`

---

## DECISION 5: token_blocklist
**STATUS:** `LOCKED — SECURITY INFRASTRUCTURE`

- **คำตัดสิน:** คงตาราง `token_blocklist` ไว้ในฐานข้อมูลต่อไปในฐานะโครงสร้างความปลอดภัยระดับ Infrastructure
- **แนวทางปฏิบัติ (Action Items):**
  - เหตุผล: ทำหน้าที่เก็บ `jti` สำหรับการเพิกถอน JWT Token เมื่อผู้ใช้ Logout (UAT-013, UAT-014) และขับเคลื่อน `@jwt.token_in_blocklist_loader` ใน `app/extensions.py`
  - **ห้าม Drop และห้ามลบเด็ดขาด** เพื่อรักษาความปลอดภัยของระบบยืนยันตัวตน

---

## DECISION 6: QuizResult vs AssessmentResult
**STATUS:** `LOCKED & IMPLEMENTED`

- **คำตัดสิน:** ให้ใช้ `QuizResult` (`quiz_results`) ใน Module 8 เป็นตารางหลักสำหรับบันทึกผลคะแนนแบบทดสอบ และ **ไม่มีการสร้างตาราง `AssessmentResult`**
- **แนวทางปฏิบัติ (Action Items):**
  - ตาราง `QuizResult` เก็บข้อมูล: `result_id (PK)`, `attempt_id (FK)`, `user_id (FK)`, `score`, `total_score`, `percentage`, `is_passed`, `feedback`
  - ตัดตาราง `AssessmentResult` ออกจากสารบบฐานข้อมูล เพื่อให้สอดคล้องกับข้อกำหนด 10 Modules

---

## DECISION 7: RolePermission
**STATUS:** `LOCKED & IMPLEMENTED`

- **คำตัดสิน:** เพิ่มตาราง `RolePermission` (`role_permissions`) เป็น Supporting RBAC Table เพื่อเชื่อมโยงสิทธิ์แบบ Many-to-Many ตามมาตรฐาน Enterprise RBAC
- **แนวทางปฏิบัติ (Action Items):**
  - โครงสร้าง: `role_permission_id (UUID PK)`, `role_id (UUID FK → roles.role_id)`, `permission_id (UUID FK → permissions.permission_id)`
  - Constraint: Unique Constraint บนคู่ `(role_id, permission_id)`

---

## DECISION 8: PasswordResetToken Migration Gap
**STATUS:** `LOCKED & RESOLVED`

- **คำตัดสิน:** ปิด Migration Gap ของตาราง `password_reset_tokens` โดยรวมคำสั่งสร้างตารางลงใน Migration `4d8f1e29a35c`
- **แนวทางปฏิบัติ (Action Items):**
  - ตาราง `password_reset_tokens` มีครบทั้ง SQLAlchemy Model, Alembic Migration Script, และ Unit Tests สอดคล้องกัน 100%

---

## DECISION 9: Parent & ParentStudent Elimination
**STATUS:** `STRICTLY ELIMINATED & PROHIBITED`

- **คำตัดสิน:** ตัดตาราง `Parent` และ `ParentStudent` ออกจากระบบอย่างเด็ดขาด เนื่องจากไม่อยู่ใน Source of Truth 10 Modules
- **แนวทางปฏิบัติ (Action Items):**
  - **ห้ามสร้างตาราง `parents` หรือ `parent_students`** ในไฟล์ Model และ Migration ใดๆ
  - ยืนยันการตัดออกผ่าน Automated Test Suite `test_schema_10_modules.py` (Assert strictly absent)

---

## DECISION 10: AI Configuration via SystemSetting
**STATUS:** `LOCKED & IMPLEMENTED`

- **คำตัดสิน:** การตั้งค่าโมเดล AI, Token Limit, และ Usage Limits ให้จัดเก็บและควบคุมผ่านตาราง `SystemSetting` (`system_settings`) ใน Module 9 โดย **ไม่มีการสร้างตาราง `AISetting` ซ้ำซ้อน**
- **แนวทางปฏิบัติ (Action Items):**
  - ใช้ Key-Value คอนฟิกใน `system_settings` เช่น `ai.default_model`, `ai.max_tokens`, `ai.rate_limit_per_minute`
  - โมเดล AI ใน Module 10 คงไว้เฉพาะ `AIConversation`, `AIMessage`, `AICodeRequest`, `AIHint`

---

## DECISION 11: Declarative Base Conflict Resolution for Classroom
**STATUS:** `LOCKED & IMPLEMENTED`

- **คำตัดสิน:** แก้ปัญหาความขัดแย้งของ Declarative Base Mapper Registry ระหว่าง `Course/Classroom` และ `School Classroom`
- **แนวทางปฏิบัติ (Action Items):**
  - ใน `backend/app/models/classroom.py`: คลาสชื่อ `Classroom` (แมปกับตาราง `courses`) มี Alias `Course = Classroom`
  - ใน `backend/app/models/school.py`: คลาสห้องเรียนโรงเรียนตั้งชื่อว่า `SchoolClassroom` (แมปกับตาราง `classrooms`) และทำ Alias `Classroom = SchoolClassroom`
  - ทำให้ SQLAlchemy Mapper Registry ไม่เกิดชื่อคลาสซ้ำซ้อน และความสัมพันธ์ `School.classrooms` เชื่อมโยงได้ถูกต้อง 100%
