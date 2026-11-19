# ตารางที่ 5 Full Traceability Matrix — Phase 1

> **โครงการ:** แพลตฟอร์มการเรียนรู้ผ่านสื่ออิเล็กทรอนิกส์ (E-Learning Platform)  
> **ขอบเขตการตรวจสอบ:** ตรวจสอบความเชื่อมโยงครบวงจร 4 ระดับ (Feature List → Requirement → UAT → Test Case) พร้อมระบุหลักฐานซอร์สโค้ด (Code Evidence) และหลักฐานผลการทดสอบ (Test Evidence) สำหรับทั้ง 61 รายการของ Feature Baseline

---

| Feature ID | คุณสมบัติ | Requirement ID | UAT ID | Test Case ID | Code Evidence | Test Evidence | Overall Status |
|:---:|:---|:---:|:---:|:---:|:---|:---|:---:|
| **1.1** | สมัครสมาชิก | REQ-AUTH-01 | `UAT-010`, `UAT-022` | `GUEST-006`, `GUEST-010` ถึง `012` | `Register.jsx`, `auth.py:63`, `users` table | `test_register_uat010.py`, `GUEST-AUTH-003-register-form.png` | **PASS** |
| **1.2** | เข้าสู่ระบบ | REQ-AUTH-02 | `UAT-011`, `UAT-012`, `UAT-023` | `GUEST-004`, `GUEST-005`, `GUEST-009` | `Login.jsx`, `auth.py:269`, `refresh_tokens` | `test_login_uat011_012.py`, `GUEST-AUTH-001-login-form.png` | **PASS** |
| **1.3** | ออกจากระบบ | REQ-AUTH-03 | `UAT-013` | `STUDENT-DASH-001`, `SUPERADMIN-DASH-001` | `Navbar.jsx`, `auth.py:487`, `token_blocklist` | `test_logout_uat013.py`, `test_phase1_features.py` | **PASS** |
| **1.4** | ลืม/รีเซ็ตรหัสผ่าน | REQ-AUTH-04 | `UAT-014`, `UAT-016` | `GUEST-007`, `GUEST-008` | `ForgotPassword.jsx`, `ResetPassword.jsx`, `auth.py:579` | `test_forgot_reset_password.py`, `GUEST-AUTH-004-forgot-password-form.png` | **PASS** |
| **1.5** | จัดการโปรไฟล์ | REQ-USER-01 | `UAT-024` | `STUDENT-PROFILE-001` | `Profile.jsx`, `users.py:10`, `user_profiles` | `test_uat024_profile.py`, `STUDENT-PROFILE-001-profile-view.png` | **PASS** |
| **1.6** | เปลี่ยนรหัสผ่าน | REQ-USER-02 | `UAT-016-PWD` | `STUDENT-PROFILE-001` | `ChangePasswordSection.jsx`, `auth.py` | `test_change_password.py`, Test Suite PASS | **PASS** |
| **1.7** | กำหนดอายุสิทธิ์การใช้งาน | REQ-AUTH-05 | `UAT-015`, `UAT-035`, `UAT-037` | `SUPERADMIN-SETT-001`, `SUPERADMIN-VAL-001` | `useIdleTimeout.js`, `TimeoutModal.jsx`, `user_access` | `test_session_timeout_uat015.py`, ขาด Account Validity Cron | **PARTIAL** |
| **1.8** | จัดการบัญชีผู้ใช้ | REQ-ADM-01 | `AD-010` ถึง `AD-026` | `ADMIN-USER-001`, `SUPERADMIN-ADMIN-010` ถึง `020` | `Users.jsx`, `admin.py:users`, `users` table | `test_admin_user_management_9_1.py`, `ADMIN-USER-001-users-table.png` | **PASS** |
| **1.9** | การจัดการสิทธิ์และการเข้าถึง | REQ-RBAC-01 | `AD-030` ถึง `AD-037` | `SUPERADMIN-ROLE-001`, `ADMIN-SEC-002` | `Roles.jsx`, `roles.py:matrix`, `role_permissions` | `test_dynamic_permission_matrix.py`, `SUPERADMIN-ROLE-001-role-matrix.png` | **PASS** |
| **2.1** | บริหารจัดการหลักสูตรและโครงสร้าง | REQ-LMS-01 | `UAT-026`, `UAT-CL-031` ถึง `036` | `INST-CLASS-001`, `ADMIN-CLASS-001` | `CourseContentManager.jsx`, `classrooms.py`, `courses` | `test_classroom_management.py`, `INSTRUCTOR-CLASS-002-curriculum-editor.png` | **PASS** |
| **2.2** | การลงทะเบียนเข้าเรียน | REQ-LMS-02 | `UAT-CL-005`, `UAT-CL-006` | `STUDENT-CLASS-001`, `STUDENT-CLASS-002` | `Classrooms.jsx`, `classrooms.py:join`, `classroom_members` | `test_classroom_management.py`, `STUDENT-CLASS-001-enrolled-courses.png` | **PASS** |
| **2.3** | จัดการคลังสื่อและเนื้อหาบทเรียน | REQ-LMS-03 | `UAT-034`, `UAT-CL-015` ถึง `019` | `STUDENT-LESSON-002`, `GUEST-CLASS-002` | `LessonDetail.jsx`, `lessons.py:contents`, `contents` | `test_phase1_features.py`, `STUDENT-LESSON-002-content-view.png` | **PASS** |
| **2.3.1** | อัปโหลดไฟล์สื่อ | REQ-MED-01 | `UAT-021`, `UAT-028`, `UAT-029` | `INST-CLASS-001` (Media Modal) | `media.py:upload`, `media_service.py`, `media` table | `test_media_service_4h.py`, `test_uat021_upload.py` | **PASS** |
| **2.3.2** | จัดการไฟล์ | REQ-MED-02 | ไม่ระบุรหัส UAT ตัวเลข | Media CRUD Test Cases | `MediaManagerModal.jsx`, `media.py`, `media` table | `test_media_service_4h.py` PASS | **PASS** |
| **2.3.3** | เพิ่มเนื้อหา Text / Code | REQ-LMS-04 | `UAT-034` | `STUDENT-EX-003`, `STUDENT-LESSON-002` | `CodeBlock.jsx`, `lessons.py`, `contents.content_data` | `test_phase1_features.py`, `STUDENT-EXERCISE-003-content-code-example.png` | **PASS** |
| **2.4** | ติดตามผลและดูสรุปคะแนนผู้เรียน | REQ-PROG-01 | `UAT-031` ถึง `033` (เฉพาะ Journal) | `STUDENT-JOURNAL-001` ถึง `003` | `journals.py`, `JournalView.jsx`, ขาด Gradebook UI | `STUDENT-JOURNAL-001-journal-list.png`, ขาด Gradebook Evidence | **PARTIAL** |
| **2.5** | บันทึกการเข้าเรียน | REQ-DATA-01 | ไม่พบ UAT | ไม่พบ Test Case เฉพาะ | `progress.py:LearningActivity`, `learning_activities` | ไม่พบหลักฐานการทดสอบเช็คชื่อเข้าเรียน | **NOT TESTED** |
| **2.6** | รายงานสถิติภาพรวมหลักสูตร | REQ-ADM-04 (Course Analytics) | `AD-100` ถึง `AD-104` | `ADMIN-REPORT-001`, `SUPERADMIN-ADMIN-100` ถึง `104` | `Reports.jsx`, `analytics_service.py`, `reports` | `SUPERADMIN-ADMIN-101-REPORTS-LIMITATION-BANNER.png` | **PARTIAL** |
| **2.7** | ประเมินและให้คะแนนบทเรียน | ไม่พบ Requirement ID | ไม่พบ UAT | ไม่พบ Test Case | ไม่พบโค้ดหรือฐานข้อมูลใน Repository | ไม่พบหลักฐานการทดสอบ | **MISSING** |
| **2.8** | บริหารจัดการผลประเมินและรีวิว | ไม่พบ Requirement ID | ไม่พบ UAT | ไม่พบ Test Case | ไม่พบโค้ดหรือฐานข้อมูลใน Repository | ไม่พบหลักฐานการทดสอบ | **MISSING** |
| **3.1** | ถ่ายทอดสดภายในเว็บ | REQ-STR-01 | ไม่พบ UAT | Card Preview Mock | `streaming.py:LiveSession`, `LiveRoom.jsx` | ขาด WebRTC Media Server จริง | **OUT OF SCOPE** |
| **3.2** | สร้างตาราง Live | REQ-STR-02 | ไม่พบ UAT | ไม่พบ Test Case | `streaming.py:LiveSchedule` | ขาด Calendar UI Picker | **OUT OF SCOPE** |
| **3.3** | แชตระหว่าง Live | REQ-STR-03 | ไม่พบ UAT | Chat Mock UI | `streaming.py:/ws/chat`, `LiveChatMessage` | ขาด WebSocket Stress Test Evidence | **OUT OF SCOPE** |
| **3.4** | บันทึกการถ่ายทอดสดอัตโนมัติ | REQ-STR-04 | ไม่พบ UAT | ไม่พบ Test Case | `streaming.py:LiveRecording` | ขาด Transcoder Pipeline | **OUT OF SCOPE** |
| **3.5** | การมีส่วนร่วมระหว่าง Live | REQ-STR-05 | ไม่พบ UAT | ปุ่ม Reaction Mock | `streaming.py:LiveParticipant`, `LiveRoom.jsx` | ขาด Interaction WebSocket Integration | **OUT OF SCOPE** |
| **3.6** | แจ้งเตือน Live | REQ-STR-06 | ไม่พบ UAT | ไม่พบ Test Case | ไม่พบโค้ดใน Repository | ไม่พบหลักฐานการทดสอบ | **OUT OF SCOPE** |
| **4.1** | รายการความก้าวหน้า | REQ-E2E-01 | `UAT-CL-024` | `STUDENT-CLASS-001`, `TC-01` ถึง `12` | `CourseCard.jsx`, `quiz_service.py`, `learning_progress` | `test_exam_progress_unlock_stability.py`, `STUDENT-CLASS-001.png` | **PASS (Phase 2)** |
| **4.2** | ปลดล็อกทักษะ | REQ-E2E-02 | ไม่ระบุรหัส UAT ตัวเลข | `STUDENT-IOT-002`, `TC-08`, `TC-10` | `IoTChapterAccordion.jsx`, `quiz_service.py`, `user_skills` | `test_exam_progress_unlock_stability.py`, `STUDENT-EXAM-005-PASS-UNLOCK.png` | **PASS (Phase 2)** |
| **4.3** | สรุปผลการเรียน | ไม่พบ Requirement ID | ไม่พบ UAT | ไม่พบ Test Case | `progress.py:LearningSummary`, `learning_summaries` | ไม่พบหน้าจอแสดง Transcript | **NOT TESTED** |
| **5.1** | ระบบคะแนน XP | REQ-GAM-01 | `UAT-EX-009`, `UAT-EX-011` | `STUDENT-EX-009`, `STUDENT-EX-011` | `ExerciseResultCard.jsx`, `exercise_service.py`, `user_xps` | `STUDENT-EXERCISE-009-passed-attempt-result.png`, `011-zero-xp.png` | **PASS (Phase 2)** |
| **5.2** | ระบบ Level | REQ-GAM-02 | ไม่พบ UAT | Profile Level Badge | `gamification_service.py`, `user_levels` | ขาด Level-up Event Automation Test | **NOT TESTED** |
| **5.3** | ระบบ Badge / Achievement | REQ-GAM-03 | ไม่พบ UAT | Profile Badge Grid | `gamification.py:Badge`, `user_badges` | ขาด Trigger มอบ Badge อัตโนมัติ | **NOT TESTED** |
| **5.4** | ระบบ Streak | REQ-GAM-04 | ไม่พบ UAT | Navbar Streak Icon | `gamification.py:UserStreak`, `user_streaks` | ขาด Daily Cron Job ตัดรอบ | **NOT TESTED** |
| **5.5** | Leaderboard | REQ-GAM-05 | ไม่พบ UAT | `Leaderboard.jsx` (Mock UI) | `gamification.py:leaderboard`, `leaderboards` | ขาด Load Testing กับข้อมูลขนาดใหญ่ | **NOT TESTED** |
| **5.6** | ระบบภารกิจ (Mission) | REQ-GAM-06 | ไม่พบ UAT | `StudentHome.jsx` (Mission Card) | `missions.py`, `missions` table | ขาด Event ผูกการเคลียร์ข้อสอบ | **NOT TESTED** |
| **5.7** | ระบบรางวัล | REQ-GAM-07 | ไม่พบ UAT | Shop Modal Mock | `gamification.py:Reward`, `rewards` table | ขาด Transaction ตัดแต้มแลกรางวัล | **NOT TESTED** |
| **6.1** | ตัวจัดการฉากและไดอะล็อก (Story Framework) | REQ-STY-01 | `UAT-CL-SUPP-003` | `STUDENT-IOT-001`, `STUDENT-IOT-002` | `IoT101Section.jsx`, `story.py`, `stories` | `STUDENT-IOT-002-chapter-accordion.png` (Seed Data) | **PARTIAL** |
| **6.2** | ระบบรับ-ส่งภารกิจ (Mission Trigger) | REQ-STY-02 | `UAT-EX-004` | `STUDENT-EX-004` | `MissionActivity.jsx`, `exercise_service.py` | `STUDENT-EXERCISE-004-activity-fill-code.png` | **PARTIAL** |
| **6.3** | Story Progress | ไม่พบ Requirement ID | ไม่พบ UAT | ไม่พบ Test Case | `story.py:StoryProgress`, `story_progress` | ขาด REST API ดึงประวัติแยก | **NOT TESTED** |
| **7.1** | พื้นที่สร้างและเชื่อมต่อวงจร | REQ-VLB-01 | ไม่พบ UAT | ไม่พบ Test Case | `virtuallab.py:VirtualLab` | ขาด Circuit Canvas ในระบบหลัก | **OUT OF SCOPE** |
| **7.2** | ระบบจำลองการทำงานของอุปกรณ์ | REQ-VLB-02 | ไม่พบ UAT | ไม่พบ Test Case | `virtuallab.py:LabDevice` | ขาด Firmware Simulator Engine | **OUT OF SCOPE** |
| **7.3** | การจำลองแบบ Real-time | REQ-VLB-03 | ไม่พบ UAT | ไม่พบ Test Case | ไม่พบโค้ดใน Repository | ไม่พบหลักฐานการทดสอบ | **OUT OF SCOPE** |
| **7.4** | บันทึกและจัดการโครงงานการทดลอง | REQ-VLB-04 | ไม่พบ UAT | ไม่พบ Test Case | `virtuallab.py:LabProject`, `/labs/projects` | ขาดชุดทดสอบ Automation บันทึก State | **OUT OF SCOPE** |
| **8.1** | แบบฝึกหัด | REQ-EX-01 | `UAT-EX-001` ถึง `035` | `STUDENT-EX-001` ถึง `011`, `INST-EX-001` ถึง `006` | `Exercise.jsx`, `exercises.py`, `exercise_attempts` | `test_uat_exercise_suite.py`, `STUDENT-EXERCISE-001` ถึง `011` | **PASS (Phase 2)** |
| **8.2** | แบบทดสอบท้ายบท | REQ-QZ-01 | `UAT-EXAM-001` ถึง `020` | `STUDENT-QUIZ-001` ถึง `010`, `ADMIN-QUIZ-001` | `TakeExam.jsx`, `quizzes.py`, `quiz_attempts` | `test_uat_exam_suite.py`, `STUDENT-QUIZ-001` ถึง `010` | **PASS (Phase 2)** |
| **8.3** | การกำหนดเงื่อนไขแบบทดสอบ | REQ-QZ-02 | `UAT-EXAM-015`, `016` | `INST-QUIZ-002`, `ADMIN-QUIZ-002` | `CreateQuizModal.jsx`, `quiz_service.py`, `quiz_conditions` | `test_quiz_evaluation.py`, `INSTRUCTOR-QUIZ-002-create-quiz-modal.png` | **PASS (Phase 2)** |
| **8.4** | ผลการทดสอบและ Feedback | REQ-QZ-03 | `UAT-EXAM-007`, `010`, `011` | `STUDENT-QUIZ-008`, `STUDENT-QUIZ-010`, `SECURITY-008` | `ExamResultCard.jsx`, `ExamReviewSection.jsx`, `quiz_results` | `SECURITY-008-quiz-payload-sanitized.png`, `STUDENT-QUIZ-010-answer-review.png` | **PASS (Phase 2)** |
| **9.1** | จัดการบัญชีผู้ใช้และสิทธิ์ | REQ-ADM-01 | `AD-010` ถึง `AD-026`, `AD-040` ถึง `045` | `ADMIN-USER-001`, `SUPERADMIN-STAFF-001`, `SUPERADMIN-SEC-002` | `Users.jsx`, `Staff.jsx`, `admin.py`, `user_roles` | `test_superadmin_security_suite.py`, `SUPERADMIN-STAFF-001-staff-table.png` | **PASS** |
| **9.2** | การจัดการโรงเรียน ห้องเรียน และสมาชิก | REQ-ADM-02 | `AD-050` ถึง `AD-057` | `ADMIN-SCHOOL-001`, `SUPERADMIN-ADMIN-050` ถึง `057` | `Schools.jsx`, `schools.py`, `schools`, `school_members` | `test_admin_school_management_9_2.py`, `SUPERADMIN-ADMIN-050-SCHOOLS-LIST-VIEW.png` | **PASS** |
| **9.3** | จัดการและกำกับดูแลบทเรียน | REQ-ADM-03 | `AD-001` ถึง `AD-005`, `UAT-CL-034` | `ADMIN-CLASS-001` | `Courses.jsx`, `classrooms.py`, `courses.status` | `test_classroom_management.py`, `ADMIN-CLASS-001-courses-table.png` | **PASS** |
| **9.4** | จัดการคลังข้อสอบภาพรวม | REQ-QZ-04 | `AD-113` ถึง `AD-115` | `ADMIN-QUIZ-001`, `SUPERADMIN-ADMIN-113` ถึง `115` | `Quizzes.jsx`, `quizzes.py`, `quizzes`, `questions` | `ADMIN-QUIZ-001-quiz-bank.png`, `SUPERADMIN-ADMIN-113-QUIZZES-LIST.png` | **PASS (Phase 2)** |
| **9.5** | จัดการภารกิจภาพรวม | ไม่พบ Requirement ID | `AD-110`, `AD-111` | `ADMIN-MISSION-001` | `Missions.jsx` (Mock UI) | `ADMIN-MISSION-001-missions-mock.png` (Limitation Alert) | **PARTIAL** |
| **9.6** | จัดการคลังองค์ประกอบ Interactive | REQ-LMS-05 | ไม่พบ UAT | ไม่พบ Test Case | `admin.py:InteractiveComponent`, `interactive_components` | มีเฉพาะตาราง DB ยังไม่มีหน้าจอจัดการคลังชิ้นส่วน | **NOT TESTED** |
| **9.7** | แดชบอร์ดสถิติภาพรวมระบบ | REQ-ADM-04 | `AD-001` ถึง `AD-007` | `ADMIN-DASH-001`, `SUPERADMIN-DASH-001` | `Dashboard.jsx`, `admin.py:stats`, PostgreSQL aggregates | `test_superadmin_security_suite.py`, `SUPERADMIN-DASH-001-dashboard.png` | **PASS** |
| **9.8** | จัดการระบบแจ้งเตือนและประกาศ | ไม่พบ Requirement ID | ไม่พบ UAT | ไม่พบ Test Case | `admin.py:Announcement`, `announcements`, `notifications` | มีเฉพาะตาราง DB ยังไม่มี UI และระบบกระจายข่าว | **NOT TESTED** |
| **9.9** | ตั้งค่าระบบ | REQ-ADM-05 | `AD-060` ถึง `AD-064` | `SUPERADMIN-SETT-001`, `ADMIN-SEC-004` | `Settings.jsx`, `admin.py:settings`, `system_settings` | `SUPERADMIN-SETT-001-settings-form.png`, `ADMIN-ADMIN-064-SETTINGS-BLOCKED.png` | **PARTIAL** |
| **9.10** | Security | REQ-SEC-01 | `AD-070` ถึง `AD-073` | `SUPERADMIN-SEC-001`, `ADMIN-SEC-003` | `Security.jsx`, `admin.py:security`, `security_logs` | `test_superadmin_security_suite.py`, `SUPERADMIN-ADMIN-070-SECURITY-OVERVIEW.png` | **PASS** |
| **9.11** | Audit Log | REQ-SEC-02 | `AD-080` ถึง `AD-085` | `SUPERADMIN-SEC-001`, `SUPERADMIN-ADMIN-005` | `AuditLogModal.jsx`, `admin.py:audit-logs`, `audit_logs` | `SUPERADMIN-ADMIN-080-AUDIT-LOG-MODAL.png`, `084-VERIFIED.png` | **PASS** |
| **9.12** | Backup / Recovery | REQ-SEC-03 | `AD-090` | `SUPERADMIN-ADMIN-090` | `admin.py:Backup`, `backups` table | `SUPERADMIN-ADMIN-090-BACKUP-UI-NOT-FOUND.png` (NOT FOUND) | **MISSING** |
| **9.13** | Maintenance | REQ-SYS-01 | ไม่พบ UAT | ไม่พบ Test Case | `system_settings` Key `maintenance_mode` | มีค่าใน DB แต่ไม่มี Middleware ตรวจจับ | **PARTIAL** |
| **10.1** | AI Assistant | ไม่พบ Requirement ID | ไม่พบ UAT | Student Home Mock Card | `ai.py:AIConversation`, `ai_conversations` | ไม่พบการเชื่อมต่อ External LLM จริง | **OUT OF SCOPE** |
| **10.2** | การตั้งค่าระบบผู้ช่วย AI | ไม่พบ Requirement ID | ไม่พบ UAT | ไม่พบ Test Case | `ai.py:AIConfiguration`, `ai_configurations` | มีเฉพาะตาราง DB ขาด Admin UI | **OUT OF SCOPE** |
