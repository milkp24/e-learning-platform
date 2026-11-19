# ดัชนีหลักฐานและตำแหน่งอ้างอิงการตรวจสอบ (Evidence Index — Phase 1 Complete Audit)

> **โครงการ:** แพลตฟอร์มการเรียนรู้ผ่านสื่ออิเล็กทรอนิกส์ (E-Learning Platform)  
> **วัตถุประสงค์:** รวบรวมรายชื่อไฟล์ เส้นทางพาธ (File Paths) และตำแหน่งหลักฐานทั้งหมดที่ใช้ในการสอบทานและยืนยันผลการทำงานจริงของระบบ E-Learning Platform

---

## 1. เอกสารโครงการและข้อกำหนดต้นฉบับ (Project Baseline & Specifications)

| ลำดับ | รายชื่อเอกสาร | ตำแหน่งไฟล์ (Absolute Path) | วัตถุประสงค์ในการตรวจสอบ |
|:---:|:---|:---|:---|
| 1 | **Feature Baseline 10 Modules** | [`phase1_feature_baseline.md`](file:///c:/Users/Milkp/Code/e-learning-platform/phase1_feature_baseline.md) | เอกสาร Single Source of Truth สำหรับ Feature ID ทั้ง 61 รายการ |
| 2 | **SRS vs Feature List Matrix** | [`feature_list_vs_srs.md`](file:///c:/Users/Milkp/Code/e-learning-platform/feature_list_vs_srs.md) | การเปรียบเทียบข้อกำหนด SRS v2.4 กับ Feature List และการจัดสรร Scope |
| 3 | **REST API Documentation** | [`API.md`](file:///c:/Users/Milkp/Code/e-learning-platform/API.md) | เอกสารสัญญา API (API Contract), Endpoints, Payloads, และรหัสสถานะ HTTP |
| 4 | **Database Locked Schema** | [`DATABASE_SCHEMA_LOCKED.md`](file:///c:/Users/Milkp/Code/e-learning-platform/DATABASE_SCHEMA_LOCKED.md) | โครงสร้างตารางฐานข้อมูลที่ผ่านการล็อกสถานะ 88 ตาราง |
| 5 | **Database Mapping Decisions** | [`DATABASE_MAPPING_DECISIONS.md`](file:///c:/Users/Milkp/Code/e-learning-platform/DATABASE_MAPPING_DECISIONS.md) | ข้อตกลงทางสถาปัตยกรรม (เช่น รองรับ Journal และ Dual-Pointer) |
| 6 | **Handover Documentation** | [`README.md`](file:///c:/Users/Milkp/Code/e-learning-platform/README.md) | คู่มือการติดตั้ง สถาปัตยกรรมระบบ พอร์ตเชื่อมต่อ และ RBAC Matrix |

---

## 2. ซอร์สโค้ดฝั่งเซิร์ฟเวอร์ (Backend Source Code, Routes & Models)

| ลำดับ | โมดูล / บริการ | ตำแหน่งไฟล์ (Path) | องค์ประกอบสำคัญที่ตรวจสอบ |
|:---:|:---|:---|:---|
| 1 | **Application Factory** | [`backend/app/__init__.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/app/__init__.py) | การลงทะเบียน Flask Blueprints, CORS, JWT Extensions |
| 2 | **Authentication Routes** | [`backend/app/routes/auth.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/app/routes/auth.py) | Register (L63), Login (L269), Refresh (L407), Logout (L487), Reset Password (L579) |
| 3 | **Admin Routes** | [`backend/app/routes/admin.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/app/routes/admin.py) | Users CRUD, Settings, Security Overview, Audit Logs, Dashboard Stats |
| 4 | **Classrooms Routes** | [`backend/app/routes/classrooms.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/app/routes/classrooms.py) | Courses CRUD, Lessons, Join Course, Course Status Management |
| 5 | **Lessons & Contents Routes**| [`backend/app/routes/lessons.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/app/routes/lessons.py) | Episodes CRUD, Multi-format Contents, Type-specific Sanitizer |
| 6 | **Media Routes** | [`backend/app/routes/media.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/app/routes/media.py) | File Upload, MIME Validation, HTTP 206 Video Streaming |
| 7 | **Roles Routes** | [`backend/app/routes/roles.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/app/routes/roles.py) | Dynamic Permission Matrix (37 perms), Role Assignment |
| 8 | **Schools Routes** | [`backend/app/routes/schools.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/app/routes/schools.py) | Schools CRUD, School Classrooms, School Members |
| 9 | **Exercises Routes** | [`backend/app/routes/exercises.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/app/routes/exercises.py) | Exercise Submissions, Auto-grading, Hints, Checklists |
| 10 | **Quizzes Routes** | [`backend/app/routes/quizzes.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/app/routes/quizzes.py) | Take Quiz, Timer, Payload Sanitization, Review Feedback |
| 11 | **User Service & Security** | [`backend/app/services/user_service.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/app/services/user_service.py) | Super Admin Self-Protection (L332, L451, L516, L664, L789), scrypt Hashing |
| 12 | **Quiz Service Engine** | [`backend/app/services/quiz_service.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/app/services/quiz_service.py) | Server-side Timer, Attempt Limit, Dynamic Progress, Answer Sanitization |
| 13 | **Exercise Service** | [`backend/app/services/exercise_service.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/app/services/exercise_service.py) | +50 XP Reward Engine, Anti-Farming Rule (0 XP for Retake) |
| 14 | **User & Access Models** | [`backend/app/models/user.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/app/models/user.py) | `User`, `UserProfile`, `UserAccess` (ฟิลด์ `expires_at` L199) |
| 15 | **Security Models** | [`backend/app/models/security.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/app/models/security.py) | `RefreshToken`, `TokenBlocklist`, `PasswordResetToken`, `SystemSetting` |
| 16 | **Role & Permission Models**| [`backend/app/models/role.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/app/models/role.py) | `Role`, `Permission`, `RolePermission`, `UserRole` |
| 17 | **Classroom & Course Models**| [`backend/app/models/classroom.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/app/models/classroom.py) | `Course`, `Chapter`, `Lesson`, `Episode`, `Content` (Dual-Pointer) |

---

## 3. ซอร์สโค้ดฝั่งเว็บแอปพลิเคชัน (Frontend Source Code & Components)

| ลำดับ | โมดูล / ส่วนติดต่อผู้ใช้ | ตำแหน่งไฟล์ (Path) | องค์ประกอบสำคัญที่ตรวจสอบ |
|:---:|:---|:---|:---|
| 1 | **Routing Table & RBAC** | [`frontend/src/app/router/AppRoutes.jsx`](file:///c:/Users/Milkp/Code/e-learning-platform/frontend/src/app/router/AppRoutes.jsx) | เส้นทางการเข้าถึง Public, Student, Instructor, Admin, Super Admin |
| 2 | **Role Protected Route** | [`frontend/src/components/ProtectedRoute.jsx`](file:///c:/Users/Milkp/Code/e-learning-platform/frontend/src/components/ProtectedRoute.jsx) | การสกัดกั้นผู้ใช้ที่ไม่ได้รับอนุญาต และแสดงหน้า Access Denied |
| 3 | **Authentication State** | [`frontend/src/store/useAuthStore.js`](file:///c:/Users/Milkp/Code/e-learning-platform/frontend/src/store/useAuthStore.js) | Zustand Store จัดการ State ผู้ใช้, Token, และการซิงค์ Session |
| 4 | **Inactivity Timeout Hook** | [`frontend/src/hooks/useIdleTimeout.js`](file:///c:/Users/Milkp/Code/e-learning-platform/frontend/src/hooks/useIdleTimeout.js) | ตัวจับเวลากิจกรรมผู้ใช้ (30 นาที) แจ้งเตือนล่วงหน้า 120 วินาที |
| 5 | **Timeout Modal** | [`frontend/src/components/TimeoutModal.jsx`](file:///c:/Users/Milkp/Code/e-learning-platform/frontend/src/components/TimeoutModal.jsx) | หน้าต่างป็อปอัปนับถอยหลังเตือนก่อนออกจากระบบอัตโนมัติ |
| 6 | **Cross-Tab Session Sync** | [`frontend/src/services/sessionSync.js`](file:///c:/Users/Milkp/Code/e-learning-platform/frontend/src/services/sessionSync.js) | การซิงค์การออกจากระบบข้ามแท็บผ่าน BroadcastChannel |
| 7 | **Admin Dashboard Page** | [`frontend/src/pages/admin/Dashboard/Dashboard.jsx`](file:///c:/Users/Milkp/Code/e-learning-platform/frontend/src/pages/admin/Dashboard/Dashboard.jsx) | แสดง 8 การ์ดตัวชี้วัด กราฟสถิติจริง และปุ่มเปิด Audit Log |
| 8 | **Users Management Page** | [`frontend/src/pages/admin/Users/Users.jsx`](file:///c:/Users/Milkp/Code/e-learning-platform/frontend/src/pages/admin/Users/Users.jsx) | ตารางผู้ใช้ การค้นหา กรองสถานะ และบล็อกการแตะต้อง Super Admin |
| 9 | **Roles & Matrix Page** | [`frontend/src/pages/admin/Roles/Roles.jsx`](file:///c:/Users/Milkp/Code/e-learning-platform/frontend/src/pages/admin/Roles/Roles.jsx) | Dynamic Permission Matrix 37 สิทธิ์ พร้อม Checkbox ควบคุม |
| 10 | **Security Console Page** | [`frontend/src/pages/admin/Security/Security.jsx`](file:///c:/Users/Milkp/Code/e-learning-platform/frontend/src/pages/admin/Security/Security.jsx) | แผงควบคุมความปลอดภัย เซสชัน และนโยบายรหัสผ่าน |
| 11 | **Audit Log Modal** | [`frontend/src/features/permissions/components/AuditLogModal/AuditLogModal.jsx`](file:///c:/Users/Milkp/Code/e-learning-platform/frontend/src/features/permissions/components/AuditLogModal/AuditLogModal.jsx) | โมดอลค้นหา กรอง Action Type และดู JSON Metadata ของบันทึก |
| 12 | **Course Content Manager** | [`frontend/src/pages/shared/CourseContentManager/CourseContentManager.jsx`](file:///c:/Users/Milkp/Code/e-learning-platform/frontend/src/pages/shared/CourseContentManager/CourseContentManager.jsx) | หน้าจอจัดโครงสร้างบทเรียน 4 ระดับ และอัปโหลดไฟล์สื่อ |
| 13 | **Take Exam Workspace** | [`frontend/src/pages/student/Exam/TakeExam.jsx`](file:///c:/Users/Milkp/Code/e-learning-platform/frontend/src/pages/student/Exam/TakeExam.jsx) | หน้าทำข้อสอบ 5 รูปแบบ พร้อมตัวนับเวลา Server-synced Timer |
| 14 | **Exercise Workspace** | [`frontend/src/pages/student/Exercise/Exercise.jsx`](file:///c:/Users/Milkp/Code/e-learning-platform/frontend/src/pages/student/Exercise/Exercise.jsx) | แบบฝึกหัด Interactive รองรับคำใบ้ Checklist และ Anti-farming XP |
| 15 | **Learning Journal View** | [`frontend/src/pages/student/Journal/JournalView.jsx`](file:///c:/Users/Milkp/Code/e-learning-platform/frontend/src/pages/student/Journal/JournalView.jsx) | หน้ารายการบันทึกการเรียนรู้ส่วนบุคคลของผู้เรียน |

---

## 4. ชุดทดสอบระบบอัตโนมัติ (Automated Test Suites & Scripts)

| ลำดับ | ไฟล์ชุดทดสอบ | ตำแหน่งไฟล์ (Path) | จำนวนเคส | ผลการทดสอบ |
|:---:|:---|:---|:---:|:---:|
| 1 | **Phase 1 Integration Suite** | [`backend/test_phase1_features.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/test_phase1_features.py) | 48 Cases | **PASS 100%** |
| 2 | **Super Admin Security Suite** | [`backend/test_superadmin_security_suite.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/test_superadmin_security_suite.py) | 14 Cases | **PASS 100%** |
| 3 | **Admin User Management** | [`backend/test_admin_user_management_9_1.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/test_admin_user_management_9_1.py) | 12 Cases | **PASS 100%** |
| 4 | **School Management Test** | [`backend/test_admin_school_management_9_2.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/test_admin_school_management_9_2.py) | 10 Cases | **PASS 100%** |
| 5 | **Dynamic Permission Matrix** | [`backend/test_dynamic_permission_matrix.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/test_dynamic_permission_matrix.py) | 8 Cases | **PASS 100%** |
| 6 | **Password Change & Hash** | [`backend/test_change_password.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/test_change_password.py) | 11 Cases | **PASS 100%** |
| 7 | **Media Upload & Stream** | [`backend/test_uat021_upload.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/test_uat021_upload.py) | 6 Cases | **PASS 100%** |
| 8 | **Exam Evaluation Suite** | [`backend/test_quiz_evaluation.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/test_quiz_evaluation.py) | 36 Cases | **PASS 100%** |
| 9 | **Exam Stability & Unlock** | [`backend/test_exam_progress_unlock_stability.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/test_exam_progress_unlock_stability.py) | 16 Cases | **PASS 100%** |
| 10 | **Exercise Lifecycle Suite** | [`backend/test_uat_exercise_suite.py`](file:///c:/Users/Milkp/Code/e-learning-platform/backend/test_uat_exercise_suite.py) | 15 Cases | **PASS 100%** |
| 11 | **Multi-Tab Session Sync** | [`frontend/scripts/test_uat037_multitab.js`](file:///c:/Users/Milkp/Code/e-learning-platform/frontend/scripts/test_uat037_multitab.js) | 5 Cases | **PASS 100%** |
| 12 | **Full E2E Playwright Runner**| [`frontend/scripts/execute_full_uat.js`](file:///c:/Users/Milkp/Code/e-learning-platform/frontend/scripts/execute_full_uat.js) | 90 Cases | **PASS 100%** |

---

## 5. รายงานผลการทดสอบเชิงสังเคราะห์ (Test Execution Reports)

| ลำดับ | รายชื่อรายงาน | ตำแหน่งไฟล์ (Path) | สรุปผลการทดสอบ |
|:---:|:---|:---|:---|
| 1 | **Full System UAT Report** | [`UAT_REPORT.md`](file:///c:/Users/Milkp/Code/e-learning-platform/UAT_REPORT.md) | 90 Cases ทดสอบบน Chromium จริง (Pass 90/90, 100%) |
| 2 | **Admin Management UAT** | [`ADMIN_MANAGEMENT_UAT_REPORT.md`](file:///c:/Users/Milkp/Code/e-learning-platform/ADMIN_MANAGEMENT_UAT_REPORT.md) | 85 Cases (Pass 80, NOT FOUND 5 สำหรับ Backup และ Report Export) |
| 3 | **Exam Verification Report v2**| [`UAT_EXAM_VERIFICATION_REPORT_VERSION_2.md`](file:///c:/Users/Milkp/Code/e-learning-platform/UAT_EXAM_VERIFICATION_REPORT_VERSION_2.md) | 30 Cases (Pass 30/30, 100% พร้อม 71 Automated Unit Tests) |
| 4 | **Functional Verification** | [`phase1_functional_verification.md`](file:///c:/Users/Milkp/Code/e-learning-platform/phase1_functional_verification.md) | การตรวจสอบเชิงลึก 61 รายการแยก Frontend/Backend/DB |
| 5 | **Test Evidence Catalog** | [`phase1_test_evidence.md`](file:///c:/Users/Milkp/Code/e-learning-platform/phase1_test_evidence.md) | การแจกแจงชุดรหัสทดสอบ UAT และการจัดหมวดหมู่สกรีนช็อต |
| 6 | **Unverified Features Report**| [`phase1_unverified.md`](file:///c:/Users/Milkp/Code/e-learning-platform/phase1_unverified.md) | รายงานเจาะลึก 34 รายการที่ยังไม่สมบูรณ์พร้อมแผน Remediation |

---

## 6. หลักฐานภาพถ่ายหน้าจอการทดสอบ (Playwright Screenshot Evidence)

ไดเรกทอรีจัดเก็บ: `C:\Users\Milkp\Code\e-learning-platform\screenshots\`

### 6.1 ด้านการยืนยันตัวตนและความปลอดภัย (Authentication & RBAC)
- `GUEST-HOME-001-landing-page.png`: หน้าแรกของระบบสำหรับผู้เยี่ยมชม
- `GUEST-AUTH-001-login-form.png`: หน้าเข้าสู่ระบบและฟอร์มกรอกข้อมูล
- `GUEST-AUTH-003-register-form.png`: ฟอร์มสมัครสมาชิกพร้อมการตรวจสอบความถูกต้อง
- `GUEST-VAL-004-register-duplicate-email.png`: ปฏิเสธการสมัครด้วยอีเมลซ้ำ
- `GUEST-SEC-001-student-redirect.png`: การดักจับ Redirect เมื่อผู้เยี่ยมชมพยายามเข้าหน้าสำหรับผู้เรียน
- `ADMIN-ADMIN-021-PREVENT-SUPERADMIN-CREATION.png`: บล็อก Admin ไม่ให้สร้างบทบาท Super Admin
- `ADMIN-ADMIN-022-PREVENT-SUPERADMIN-PROMOTION.png`: บล็อก Admin ไม่ให้เลื่อนขั้นตนเอง
- `ADMIN-ADMIN-023-PREVENT-SUPERADMIN-UPDATE.png`: ปุ่มแก้ไขข้อมูลแถว Super Admin ถูกปิดการทำงาน
- `ADMIN-ADMIN-024-PREVENT-SUPERADMIN-DELETE.png`: ปุ่มลบแถว Super Admin ถูกซ่อน/บล็อก
- `ADMIN-ADMIN-025-ROLES-ROUTE-BLOCKED.png`: เส้นทาง `/admin/roles` แสดงหน้า Access Denied
- `SUPERADMIN-ROLE-001-role-matrix.png`: เมทริกซ์สิทธิ์ 37 รายการแสดงผลสมบูรณ์
- `SUPERADMIN-ADMIN-070-SECURITY-OVERVIEW.png`: ภาพรวมนโยบายความปลอดภัยและ Active Sessions

### 6.2 ด้านการจัดการหลักสูตรและบทเรียน (LMS Core & Media)
- `INSTRUCTOR-CLASS-002-curriculum-editor.png`: หน้าจัดการลำดับชั้นบทเรียน 4 ระดับของผู้สอน
- `STUDENT-CLASS-001-enrolled-courses.png`: รายการวิชาที่ลงทะเบียนเรียนพร้อมแถบความก้าวหน้า
- `STUDENT-LESSON-002-content-view.png`: แสดงเนื้อหาบทเรียน Multi-format (Text, Video, Code)
- `STUDENT-JOURNAL-001-journal-list.png`: สมุดบันทึกการเรียนรู้ส่วนบุคคลของผู้เรียน
- `STUDENT-JOURNAL-003-saved-journal.png`: บันทึก Journal สำเร็จและแสดงผลทันที

### 6.3 ด้านแบบฝึกหัด ข้อสอบ และรางวัล (Exercise, Quiz & XP)
- `STUDENT-EXERCISE-002-started-workspace.png`: หน้าทำแบบฝึกหัดเชิงโต้ตอบ
- `STUDENT-EXERCISE-009-passed-attempt-result.png`: ทำแบบฝึกหัดผ่าน 100% ครั้งแรก ได้รับ +50 XP
- `STUDENT-EXERCISE-011-retake-result-zero-xp.png`: ทำแบบฝึกหัดซ้ำ ได้รับ 0 XP (Anti-farming ทำงานแม่นยำ)
- `STUDENT-QUIZ-001-start-screen.png`: หน้าเริ่มต้นทำแบบทดสอบท้ายบท
- `STUDENT-QUIZ-002-timer-countdown.png`: ตัวจับเวลานับถอยหลังซิงค์กับเซิร์ฟเวอร์
- `STUDENT-QUIZ-008-exam-result.png`: การ์ดแสดงผลสอบ คะแนน และสถานะผ่าน/ไม่ผ่าน
- `STUDENT-QUIZ-010-answer-review.png`: แสดงเฉลยละเอียดและคำอธิบาย
- `SECURITY-008-quiz-payload-sanitized.png`: ยืนยันการซ่อนเฉลยใน JSON Payload ขณะทำข้อสอบ
- `STUDENT-EXAM-005-PASS-UNLOCK.png`: สอบผ่านเกณฑ์ ปลดล็อกบทเรียนถัดไปโดยอัตโนมัติ

### 6.4 ด้านการบริหารจัดการของผู้ดูแลระบบ (Admin Governance)
- `ADMIN-DASH-001-dashboard.png`: แดชบอร์ดภาพรวมของผู้ดูแลระบบ
- `ADMIN-USER-001-users-table.png`: ตารางรายชื่อผู้ใช้ทั้งหมดพร้อม Pagination และตัวกรอง
- `ADMIN-SCHOOL-001-schools-table.png`: ตารางจัดการโรงเรียนและสถานศึกษา
- `ADMIN-CLASS-001-courses-table.png`: ตารางกำกับดูแลและอนุมัติการเผยแพร่หลักสูตร
- `SUPERADMIN-ADMIN-080-AUDIT-LOG-MODAL.png`: หน้าต่างค้นหาและตรวจสอบ Security Audit Logs
- `SUPERADMIN-ADMIN-090-BACKUP-UI-NOT-FOUND.png`: หลักฐานความโปร่งใส ยืนยันว่าไม่มีหน้าจอ Backup UI ในระบบจริง (NOT FOUND)
- `SUPERADMIN-ADMIN-101-REPORTS-LIMITATION-BANNER.png`: แบนเนอร์สีส้มแจ้งเตือนข้อจำกัดระบบในหน้ารายงาน
- `SUPERADMIN-ADMIN-104-EXPORT-LIMITATION-ALERT.png`: Browser Alert แจ้งเตือนข้อจำกัดเมื่อกดปุ่ม Export
