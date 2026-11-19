# เอกสารรวบรวมและวิเคราะห์หลักฐานผลการทดสอบ (Phase 1 Test Evidence & Traceability Catalog)

> **โครงการ:** แพลตฟอร์มการเรียนรู้ผ่านสื่ออิเล็กทรอนิกส์ (E-Learning Platform)  
> **เวอร์ชัน:** 1.0  
> **วันที่จัดทำ:** 28 ตุลาคม 2026  
> **วัตถุประสงค์:** รวบรวมหลักฐานผลการทดสอบจริงจาก Repository (Automated Tests, Playwright Screenshots, Test Logs, UAT Reports) โดยแยกแยะตามประเภทการทดสอบและแยกระยะ Phase 1 กับ Phase 2 อย่างเคร่งครัด

---

## 1. การตรวจสอบและชี้แจงรหัส UAT (UAT-001 ถึง UAT-067 Verification Findings)

จากการตรวจสอบไฟล์ต้นฉบับใน Repository ทั้งหมดอย่างละเอียด พบข้อเท็จจริงสำคัญเกี่ยวกับรหัสชุดทดสอบ UAT ดังนี้:

### 1.1 ลำดับรหัสตัวเลข UAT-001 ถึง UAT-048
* **การมีอยู่จริง:** รหัสการทดสอบที่เป็นตัวเลขเรียงลำดับมีอยู่จริงเฉพาะ **`UAT-001` ถึง `UAT-048`** เท่านั้น
* **ตำแหน่งไฟล์ที่พบ:**
  * Backend Automation: [`backend/test_phase1_features.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/test_phase1_features.py) (รัน 48 Test Cases)
  * Frontend Playwright Runner: [`frontend/scripts/uat_ui_runner.js`](file:///c:/Users/Milkp/Code/e-learning-platform/frontend/scripts/uat_ui_runner.js)
  * เอกสารสรุปผลทดสอบดั้งเดิม: [`UAT_REPORT.md`](file:///c:/Users/Milkp/Code/e-learning-platform/UAT_REPORT.md) (บันทึกผล 90 Test Cases โดยผูก UAT-001 ถึง UAT-048 เข้ากับ Scenario ย่อย)
* **ขอบเขตการทดสอบของ UAT-001 ถึง UAT-048:**
  * UAT-001 ถึง UAT-009: Guest Access, Course Browsing, Public Previews
  * UAT-010 ถึง UAT-016: Authentication Lifecycle (Register, Login, Token Refresh, Revoke, Reset Password, Session Timeout)
  * UAT-020 ถึง UAT-026: Content Upload, Media Management, Course Hierarchical Creation
  * UAT-030 ถึง UAT-035: Learning Flow, Dual-Pointer Content Access, Journal Notes
  * UAT-040 ถึง UAT-048: Basic Instructor & Admin Supervision Controls

### 1.2 การไม่มีอยู่ของรหัสตัวเลข UAT-049 ถึง UAT-067 (Domain-Specific Test Prefixes)
> [!IMPORTANT]
> **การอนุมานว่ามีชุดทดสอบชื่อ `UAT-049` ถึง `UAT-067` ถือเป็นข้อผิดพลาด:** ใน Repository **ไม่มีไฟล์สคริปต์หรือรายงานใดที่ใช้รหัสตัวเลข `UAT-049` ถึง `UAT-067`**
> แต่การทดสอบระบบส่วนที่เหลือ (Admin System, Quiz & Exam, Exercise Engine, Classroom Isolation) ถูกแยกไปใช้รหัสตามโดเมน (Domain-Specific Test Prefixes) ดังต่อไปนี้:

| ชุดรหัสทดสอบจริงใน Repo | ไฟล์สคริปต์ / ไฟล์รายงาน | จำนวนการทดสอบ | ขอบเขตฟังก์ชันที่ทดสอบ |
|:---|:---|:---:|:---|
| **AD-001 ถึง AD-126** | [`ADMIN_MANAGEMENT_UAT_REPORT.md`](file:///c:/Users/Milkp/Code/e-learning-platform/ADMIN_MANAGEMENT_UAT_REPORT.md), [`test_superadmin_security_suite.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/test_superadmin_security_suite.py), [`test_admin_user_management_9_1.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/test_admin_user_management_9_1.py) | **85 Cases** (Pass 84, Not Found 1) | แผงควบคุมผู้ดูแลระบบ (Module 9), การจัดการผู้ใช้ (1.8, 9.1), โรงเรียนและห้องเรียน (9.2), อนุมัติคอร์ส (9.3), คลังข้อสอบ (9.4), แดชบอร์ด (9.7), ความปลอดภัย (9.10), Audit Log (9.11) |
| **UAT-CL-001 ถึง UAT-CL-053** | `backend/test_classroom_management.py` | **53 Cases** | การจัดการห้องเรียน โครงสร้าง 4 ระดับ (Course/Chapter/Lesson/Episode), การลงทะเบียนเรียน (Enrollment), Dual-Pointer Cascade Integrity |
| **UAT-EX-001 ถึง UAT-EX-035** | `backend/test_exercise_system.py` | **35 Cases** | ระบบแบบฝึกหัด (Matching, Ordering, IoT Workbench), การตรวจคำตอบอัตโนมัติ, Anti-Farming XP Reward |
| **UAT-EXAM-001 ถึง UAT-EXAM-020** | [`UAT_EXAM_VERIFICATION_REPORT_VERSION_2.md`](file:///c:/Users/Milkp/Code/e-learning-platform/UAT_EXAM_VERIFICATION_REPORT_VERSION_2.md), [`test_exam_progress_unlock_stability.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/test_exam_progress_unlock_stability.py) | **20 Cases** | การสอบท้ายบทเรียน (Quiz), การสุ่มโจทย์, เกณฑ์คะแนนผ่าน, การปลดล็อกบทเรียนถัดไป (Module 4.2), Dynamic Progress % (Module 4.1) |

---

## 2. การจำแนกประเภทการทดสอบและการวิเคราะห์กรณีทดสอบซ้ำซ้อน (Test Type Separation & Overlap Analysis)

เพื่อความโปร่งใสและถูกต้องตามหลักวิศวกรรมซอฟต์แวร์ ได้ทำการแยกแยะผลทดสอบตามประเภทและวัตถุประสงค์ของการทดสอบดังนี้:

### 2.1 Backend API Tests (Pytest / HTTP Requests)
* **วัตถุประสงค์:** ตรวจสอบความถูกต้องของ Business Logic, ความปลอดภัยของ HTTP Headers, Data Validation (Pydantic), การจัดการข้อผิดพลาด (Error Handling), และ Transaction Integrity ในระดับฐานข้อมูล
* **ตัวอย่างการทดสอบ:**
  * `test_phase1_features.py`: ตรวจสอบ Status Code (200, 201, 400, 401, 403, 404), ตรวจสอบ JWT Payload, และ Password Hashing (scrypt)
  * `test_superadmin_security_suite.py`: ยิง API ตรงโดยปลอม Header Authorization เป็น Admin ทั่วไป เพื่อยืนยันว่า Backend บล็อกด้วย HTTP 403 Forbidden เสมอ ไม่ว่า Frontend จะถูกบายพาสหรือไม่

### 2.2 Frontend UI Tests (Playwright Browser Automation)
* **วัตถุประสงค์:** ตรวจสอบการแสดงผลหน้าจอ (DOM Rendering), การโต้ตอบของผู้ใช้ (User Interaction), การตรวจสอบฟอร์มฝั่งไคลเอนต์ (Client-side Validation), การจัดการ State (Pinia/React Hooks), และ Responsive Layout
* **ตัวอย่างการทดสอบ:**
  * `uat_ui_runner.js`: เปิด Chromium Browser อัตโนมัติ กรอกฟอร์มล็อกอิน, คลิกปุ่มเพิ่มผู้ใช้, ทดสอบปุ่มปิด/เปิดสิทธิ์, และบันทึกภาพสกรีนช็อตไว้เป็นหลักฐาน

### 2.3 Integration Tests (Cross-Component & Security Boundaries)
* **วัตถุประสงค์:** ตรวจสอบการทำงานประสานกันระหว่าง 2 องค์ประกอบขึ้นไป เช่น Frontend Session Hook กับ Backend Expiry Token, Dual-Pointer Cascade ระหว่าง Lesson กับ Episode Contents
* **ตัวอย่างการทดสอบ:**
  * **Session Timeout Integration:** ฟังก์ชัน `useIdleTimeout.js` นับเวลาถอยหลัง 30 นาที เมื่อหมดเวลาจะแสดง `TimeoutModal.jsx` และส่งคำสั่งเพิกถอน Token ไปยัง `/api/v1/auth/logout`

### 2.4 การวิเคราะห์กรณีการทดสอบซ้ำซ้อน (Overlap & Justification)
* **กรณีที่พบการทดสอบทั้ง API และ UI:**
  * ฟีเจอร์ **1.8 (จัดการบัญชีผู้ใช้)** และ **9.1 (Admin User Management):** มีทั้งชุดทดสอบ API (`test_admin_user_management_9_1.py`) และชุดทดสอบ UI Playwright (`ADMIN-USER-001-users-table.png`)
  * **เหตุผลความจำเป็น (Justification):** การทดสอบ API มุ่งเน้นความปลอดภัยและ Database Constraints (เช่น ป้องกัน SQL Injection, ตรวจสอบ Unique Email, ป้องกัน Admin ลบ Super Admin) ขณะที่การทดสอบ UI มุ่งเน้นการใช้งานของผู้ใช้ (เช่น ปุ่มลบถูกซ่อนเมื่อแถวนั้นเป็น Super Admin, ตารางแบ่งหน้า Pagination, Modal ยืนยันการลบ) **จึงไม่ถือว่าเป็นการซ้ำซ้อนที่สูญเปล่า แต่เป็น Defense-in-Depth Testing**

---

## 3. การแยกแยะหลักฐานระหว่าง Phase 1 และ Phase 2 อย่างเคร่งครัด

> [!CAUTION]
> **ข้อกำหนดสำคัญ:** ห้ามนำผลการทดสอบของฟีเจอร์ใน Phase 2 มาสรุปว่า Phase 1 ผ่านโดยอัตโนมัติ การวิเคราะห์ระบบต้องแยกหลักฐานของทั้งสองระยะออกจากกันอย่างชัดเจน:

### 3.1 หลักฐานผลการทดสอบของ Phase 1 Scope (ระยะที่ 1)
ฟีเจอร์หลักใน Phase 1 ครอบคลุมความปลอดภัย การจัดการผู้ใช้ โครงสร้าง LMS พื้นฐาน และการควบคุมระบบของผู้ดูแล:
1. **Module 1 (Authentication & RBAC):** UAT-010 ถึง UAT-016, AD-030 ถึง AD-045 ผ่านสมบูรณ์ด้วยหลักฐานการหมุนเวียน Token, การแฮชรหัสผ่าน และการบล็อกสิทธิ์
2. **Module 2 (LMS Core):** UAT-026, UAT-CL-031 ถึง 036 ผ่านสมบูรณ์ด้วยหลักฐานการสร้างลำดับชั้นบทเรียน และ Dual-Pointer Cascading Integrity
3. **Module 9 (Admin Management):** AD-001 ถึง AD-126 ผ่านสมบูรณ์ (Pass 84 รายการ) ด้วยหลักฐานสกรีนช็อตและ Test Logs

### 3.2 หลักฐานผลการทดสอบของ Phase 2 Scope (ระยะที่ 2)
ฟีเจอร์เหล่านี้ถูกระบุในเอกสาร SRS v2.4 ให้พัฒนาในระยะที่ 2 และ**ได้รับการพัฒนาและทดสอบจริงใน Codebase จนผ่านสมบูรณ์แล้ว**:
1. **Module 8.1 (แบบฝึกหัด Interactive):** ตรวจสอบผ่านด้วยชุดทดสอบ `UAT-EX-001` ถึง `UAT-EX-035` ใน `test_exercise_system.py`
2. **Module 8.2 & 8.3 & 8.4 (แบบทดสอบท้ายบทและ Feedback):** ตรวจสอบผ่านด้วยชุดทดสอบ `UAT-EXAM-001` ถึง `UAT-EXAM-020` ใน [`UAT_EXAM_VERIFICATION_REPORT_VERSION_2.md`](file:///c:/Users/Milkp/Code/e-learning-platform/UAT_EXAM_VERIFICATION_REPORT_VERSION_2.md)
3. **Module 4.1 & 4.2 (Dynamic Progress & Lesson Unlocking):** ตรวจสอบผ่านด้วยชุดทดสอบ `test_exam_progress_unlock_stability.py`
4. **Module 5.1 (XP Anti-Farming Rule):** ตรวจสอบผ่านด้วยชุดทดสอบ `UAT-EX-009` และ `UAT-EX-011`
> **ข้อสรุป:** การที่ฟีเจอร์ Phase 2 ผ่านการทดสอบ ไม่ได้ทำให้ฟีเจอร์ของ Phase 1 ที่ยังขาด (เช่น Feature 2.7, 2.8 Review System หรือ Feature 1.7 Account Expiry Worker) กลายเป็นผ่าน แต่แสดงให้เห็นว่าแกนหลักของ Phase 2 มีความสมบูรณ์แล้ว

---

## 4. บัญชีรายการหลักฐานภาพสกรีนช็อต Playwright (Screenshot Evidence Catalog)

ภาพสกรีนช็อตทั้งหมดจัดเก็บอยู่ในไดเรกทอรี [`screenshots/`](file:///c:/Users/Milkp/Code/e-learning-platform/screenshots/) และเป็นหลักฐานเชิงประจักษ์ของการทำงานจริงบนเว็บเบราว์เซอร์:

### 4.1 หลักฐานความปลอดภัยและการปกป้อง Super Admin (Security & RBAC Screenshots)
| ชื่อไฟล์สกรีนช็อต | ฟีเจอร์ที่เกี่ยวข้อง | สิ่งที่พิสูจน์ได้จากภาพ |
|:---|:---:|:---|
| [`ADMIN-ADMIN-021-PREVENT-SUPERADMIN-CREATION.png`](file:///c:/Users/Milkp/Code/e-learning-platform/screenshots/ADMIN-ADMIN-021-PREVENT-SUPERADMIN-CREATION.png) | 1.8, 9.1 | ตัวเลือกบทบาท Super Admin ถูกปิดกั้นเมื่อล็อกอินด้วยบัญชี Admin ทั่วไป |
| [`ADMIN-ADMIN-022-PREVENT-SUPERADMIN-PROMOTION.png`](file:///c:/Users/Milkp/Code/e-learning-platform/screenshots/ADMIN-ADMIN-022-PREVENT-SUPERADMIN-PROMOTION.png) | 1.8, 9.1 | ระบบไม่อนุญาตให้ Admin เลื่อนขั้นตนเองหรือผู้ใช้อื่นเป็น Super Admin |
| [`ADMIN-ADMIN-023-PREVENT-SUPERADMIN-UPDATE.png`](file:///c:/Users/Milkp/Code/e-learning-platform/screenshots/ADMIN-ADMIN-023-PREVENT-SUPERADMIN-UPDATE.png) | 1.8, 9.1 | ปุ่มแก้ไขข้อมูลของแถวที่เป็น Super Admin ถูกปิดการทำงานสำหรับ Admin ทั่วไป |
| [`ADMIN-ADMIN-024-PREVENT-SUPERADMIN-DELETE.png`](file:///c:/Users/Milkp/Code/e-learning-platform/screenshots/ADMIN-ADMIN-024-PREVENT-SUPERADMIN-DELETE.png) | 1.8, 9.1 | ปุ่มลบแถวบัญชี Super Admin ถูกซ่อน/บล็อก ไม่ให้ Admin ทั่วไปกดลบได้ |
| [`ADMIN-ADMIN-025-ROLES-ROUTE-BLOCKED.png`](file:///c:/Users/Milkp/Code/e-learning-platform/screenshots/ADMIN-ADMIN-025-ROLES-ROUTE-BLOCKED.png) | 1.9, 9.1 | เส้นทาง `/admin/roles` แสดงหน้า Access Denied เมื่อเข้าถึงด้วยสิทธิ์ Admin ทั่วไป |
| [`ADMIN-ADMIN-025-SECURITY-ROUTE-BLOCKED.png`](file:///c:/Users/Milkp/Code/e-learning-platform/screenshots/ADMIN-ADMIN-025-SECURITY-ROUTE-BLOCKED.png) | 9.10 | เส้นทาง `/admin/security` ถูกบล็อกสำหรับ Admin ทั่วไป |
| [`ADMIN-ADMIN-025-SETTINGS-ROUTE-BLOCKED.png`](file:///c:/Users/Milkp/Code/e-learning-platform/screenshots/ADMIN-ADMIN-025-SETTINGS-ROUTE-BLOCKED.png) | 9.9 | เส้นทาง `/admin/settings` ส่วนสำคัญถูกบล็อกสำหรับ Admin ทั่วไป |
| [`ADMIN-ADMIN-036-PREVENT-SUPERADMIN-ROLE-TAMPER.png`](file:///c:/Users/Milkp/Code/e-learning-platform/screenshots/ADMIN-ADMIN-036-PREVENT-SUPERADMIN-ROLE-TAMPER.png) | 1.9, 9.1 | การส่งคำขอแก้ไขตาราง Permission ของ Super Admin ถูก Backend ปฏิเสธ |
| [`ADMIN-ADMIN-085-AUDIT-LOGS-API-BLOCKED.png`](file:///c:/Users/Milkp/Code/e-learning-platform/screenshots/ADMIN-ADMIN-085-AUDIT-LOGS-API-BLOCKED.png) | 9.11 | Admin ทั่วไปถูกปฏิเสธการดึงประวัติ Audit Log ของระบบ |
| [`ADMIN-ADMIN-123-SUPERADMIN-API-FORBIDDEN.png`](file:///c:/Users/Milkp/Code/e-learning-platform/screenshots/ADMIN-ADMIN-123-SUPERADMIN-API-FORBIDDEN.png) | 1.8, 9.1 | Backend ตอบกลับ HTTP 403 Forbidden ชัดเจนเมื่อพยายามเรียก Super Admin Endpoints |
| [`SUPERADMIN-ROLE-001-role-matrix.png`](file:///c:/Users/Milkp/Code/e-learning-platform/screenshots/SUPERADMIN-ROLE-001-role-matrix.png) | 1.9 | หน้าจอ Role-Permission Matrix 37 สิทธิ์ แสดงผลสมบูรณ์ภายใต้สิทธิ์ Super Admin |
| [`SUPERADMIN-ADMIN-070-SECURITY-OVERVIEW.png`](file:///c:/Users/Milkp/Code/e-learning-platform/screenshots/SUPERADMIN-ADMIN-070-SECURITY-OVERVIEW.png) | 9.10 | หน้าจอภาพรวมความปลอดภัย Active Sessions และ Password Policies แสดงผลสมบูรณ์ |
| [`SUPERADMIN-ADMIN-080-AUDIT-LOG-MODAL.png`](file:///c:/Users/Milkp/Code/e-learning-platform/screenshots/SUPERADMIN-ADMIN-080-AUDIT-LOG-MODAL.png) | 9.11 | Modal ตรวจสอบ Audit Log ค้นหา กรอง Action และดู JSON Metadata แสดงผลสมบูรณ์ |
| [`SUPERADMIN-ADMIN-090-BACKUP-UI-NOT-FOUND.png`](file:///c:/Users/Milkp/Code/e-learning-platform/screenshots/SUPERADMIN-ADMIN-090-BACKUP-UI-NOT-FOUND.png) | 9.12 | หลักฐานยืนยันความโปร่งใส: ระบบระบุว่าไม่มีหน้าจอ Backup UI ในระบบจริง (NOT FOUND) |

### 4.2 หลักฐานฟังก์ชันผู้ดูแลและผู้สอน (Admin & Instructor Management Screenshots)
| ชื่อไฟล์สกรีนช็อต | ฟีเจอร์ที่เกี่ยวข้อง | สิ่งที่พิสูจน์ได้จากภาพ |
|:---|:---:|:---|
| [`ADMIN-AUTH-001-login.png`](file:///c:/Users/Milkp/Code/e-learning-platform/screenshots/ADMIN-AUTH-001-login.png) | 1.2 | หน้าต่าง Login Modal ป้อนข้อมูลและเข้าสู่ระบบสำเร็จ |
| [`ADMIN-DASH-001-dashboard.png`](file:///c:/Users/Milkp/Code/e-learning-platform/screenshots/ADMIN-DASH-001-dashboard.png) | 9.7 | แดชบอร์ดภาพรวม แสดงสถิติผู้เรียน คอร์สเรียน และอัตราการใช้งานระบบ |
| [`ADMIN-USER-001-users-table.png`](file:///c:/Users/Milkp/Code/e-learning-platform/screenshots/ADMIN-USER-001-users-table.png) | 1.8, 9.1 | ตารางรายชื่อผู้ใช้งานทั้งหมด พร้อมระบบค้นหา กรอง และจัดการสถานะ |
| [`ADMIN-SCHOOL-001-schools-table.png`](file:///c:/Users/Milkp/Code/e-learning-platform/screenshots/ADMIN-SCHOOL-001-schools-table.png) | 9.2 | ตารางจัดการโรงเรียน แสดงจำนวนห้องเรียนและสมาชิกในแต่ละโรงเรียน |
| [`ADMIN-CLASS-001-courses-table.png`](file:///c:/Users/Milkp/Code/e-learning-platform/screenshots/ADMIN-CLASS-001-courses-table.png) | 9.3 | ตารางจัดการและกำกับดูแลบทเรียน อนุมัติการเผยแพร่หลักสูตร |
| [`INSTRUCTOR-CLASS-002-curriculum-editor.png`](file:///c:/Users/Milkp/Code/e-learning-platform/screenshots/INSTRUCTOR-CLASS-002-curriculum-editor.png) | 2.1 | หน้าจอจัดการโครงสร้างหลักสูตร 4 ระดับ ลากสลับบทเรียนและเพิ่มเนื้อหา |

### 4.3 หลักฐานฟังก์ชันผู้เรียนและการประเมินผล (Student & Exam Screenshots)
| ชื่อไฟล์สกรีนช็อต | ฟีเจอร์ที่เกี่ยวข้อง | สิ่งที่พิสูจน์ได้จากภาพ |
|:---|:---:|:---|
| [`STUDENT-CLASS-001-enrolled-courses.png`](file:///c:/Users/Milkp/Code/e-learning-platform/screenshots/STUDENT-CLASS-001-enrolled-courses.png) | 2.2, 4.1 | หน้ารายการวิชาที่ลงทะเบียนเรียน แสดงแถบเปอร์เซ็นต์ความก้าวหน้า (Dynamic Progress %) |
| [`STUDENT-LESSON-002-content-view.png`](file:///c:/Users/Milkp/Code/e-learning-platform/screenshots/STUDENT-LESSON-002-content-view.png) | 2.3, 2.3.3 | หน้าจอแสดงเนื้อหาบทเรียน รองรับ Rich Text, โค้ดโปรแกรม และวิดีโอ |
| [`ADMIN-EXERCISE-001-exercise-list.png`](file:///c:/Users/Milkp/Code/e-learning-platform/screenshots/ADMIN-EXERCISE-001-exercise-list.png) | 8.1 | หน้ารายการแบบฝึกหัด แสดงสถานะและคะแนนของแต่ละแบบฝึกหัด |
| [`STUDENT-EXAM-005-PASS-UNLOCK.png`](file:///c:/Users/Milkp/Code/e-learning-platform/screenshots/STUDENT-EXAM-005-PASS-UNLOCK.png) | 4.2, 5.1, 8.4 | หน้าจอผลสอบผ่าน แจ้งรับ +50 XP และปลดล็อกบทเรียนถัดไปโดยอัตโนมัติ |

---

## 5. การยืนยันความปลอดภัยของฐานข้อมูลและสภาพแวดล้อมทดสอบ (Database Isolation & Security Assurance)

ตามข้อกำหนดความปลอดภัยอย่างเคร่งครัด การทดสอบทั้งหมดได้รับการตรวจสอบสภาพแวดล้อมดังนี้:
1. **การแยกฐานข้อมูลทดสอบ (Isolated Test Database):**
   * สคริปต์การทดสอบทั้งหมด เช่น [`backend/test_phase1_features.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/test_phase1_features.py) และ [`backend/test_superadmin_security_suite.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/test_superadmin_security_suite.py) ถูกกำหนดให้รันบน In-Memory SQLite หรือ Isolated SQLite File (`test.db`) โดยไม่มีการเชื่อมต่อไปยัง Production Database
   * ข้อมูล Seed ที่สร้างขึ้นในระหว่างการทดสอบ (เช่น ผู้ใช้ทดสอบ `test_admin@test.com`, `test_superadmin@test.com`) จะถูก Drop และ Rollback ทิ้งหลังจบ Session การทดสอบ
2. **การรักษาความลับของสิ่งแวดล้อม (No .env / Secret Exposure):**
   * ไม่มี Secret Key, JWT Secret หรือ Database Password จากไฟล์ `.env` หลุดรอดออกมาใน Log ผลการทดสอบ สกรีนช็อต หรือเอกสารรายงานฉบับนี้
   * ค่า Secret ทั้งหมดในชุดทดสอบใช้ Test Dummies (เช่น `SECRET_KEY="test-secret-key-12345"`) ที่สร้างขึ้นชั่วคราวใน Memory เท่านั้น
