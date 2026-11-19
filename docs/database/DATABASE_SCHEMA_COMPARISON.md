# รายงานการตรวจสอบและเปรียบเทียบโครงสร้างฐานข้อมูล (DATABASE_SCHEMA_COMPARISON.md)

> **STATUS: SCHEMA IMPLEMENTED & SYNCHRONIZED — 10 MODULES**
> **SOURCE OF TRUTH: FEATURE LIST 10 MODULES**
> **SCHEMA VERSION: REVISION 4d8f1e29a35c**
> **TOTAL REGISTERED TABLES: 88 TABLES**
> เอกสารฉบับนี้เป็นรายงานเปรียบเทียบโครงสร้างฐานข้อมูลระหว่างสถานะเดิมและสถานะปัจจุบันหลังการปรับปรุงให้สอดคล้องกับ Feature List 10 Modules ล่าสุด

---

## 1. Executive Summary & Statistical Overview

| หมวดหมู่การเปรียบเทียบ | จำนวน | รายละเอียด |
| :--- | :---: | :--- |
| **ตารางทั้งหมดในระบบ (Total Database Tables)** | **88** | ตารางทั้งหมดที่ลงทะเบียนใน `db.metadata.tables` และพร้อมรัน Migration |
| **ตารางเดิมที่คงไว้ (KEEP)** | **14** | `users`, `user_profiles`, `roles`, `user_roles`, `refresh_tokens`, `password_reset_tokens`, `system_settings`, `courses`, `classroom_members`, `lessons`, `episodes`, `contents`, `journals`, `token_blocklist` |
| **ตารางใหม่ที่สร้างเพิ่ม (ADD)** | **74** | ครอบคลุม 10 Modules ตาม Source of Truth |
| **ตารางที่ถูกตัดออกโดยเด็ดขาด (PROHIBITED / ELIMINATED)** | **2** | `parents`, `parent_students` (ตัดฟีเจอร์ผู้ปกครองของเวอร์ชันเก่าออกทั้งหมด) |
| **โครงสร้างความปลอดภัยคงเดิม (Preserved Infrastructure)** | **1** | `token_blocklist` สำหรับ JWT Stateless Revocation |
| **ฟีเจอร์เสริมเดิมที่คงไว้ (Preserved Supporting Feature)** | **1** | `journals` สำหรับบันทึกการเรียนรู้ส่วนบุคคล (UAT-031 ถึง 033) |

---

## 2. ตารางแจกแจงเปรียบเทียบตาม 10 Modules (88 Tables)

### Module 1 — บัญชีผู้ใช้และการจัดการผู้ใช้ (20 ตาราง)
| Table Name | Model Name | Status | คำอธิบายและฟิลด์สำคัญ |
| :--- | :--- | :---: | :--- |
| `users` | `User` | **KEEP** | บัญชีผู้ใช้งานหลัก, อีเมล, รหัสผ่านแฮช, สถานะ |
| `user_profiles` | `UserProfile` | **KEEP** | ข้อมูลโปรไฟล์ 1-to-1 กับ User, รูปภาพประจำตัว |
| `user_access` | `UserAccess` | **ADD** | ประวัติการเข้าถึงและการกำหนดอายุสิทธิ์ |
| `sessions` | `Session` | **ADD** | Stateful Session ข้ามอุปกรณ์ พร้อม `ended_at`, `revoked_at` |
| `refresh_tokens` | `RefreshToken` | **KEEP** | สำหรับ Token Rotation และ Refresh Token |
| `password_reset_tokens`| `PasswordResetToken` | **KEEP / ADDED TO MIGRATION** | โทเค็นรีเซ็ตรหัสผ่านพร้อมสถานะ `used_at` |
| `password_histories` | `PasswordHistory` | **ADD** | ประวัติรหัสผ่านเก่าป้องกันการตั้งรหัสผ่านซ้ำ |
| `roles` | `Role` | **MODIFY** | บทบาทผู้ใช้ (เพิ่มคอลัมน์ `description`) |
| `permissions` | `Permission` | **ADD** | สิทธิ์ระดับฟังก์ชันการทำงาน (Granular RBAC) |
| `user_roles` | `UserRole` | **KEEP** | ความสัมพันธ์ Many-to-Many ระหว่าง User และ Role |
| `role_permissions` | `RolePermission` | **ADD** | ตารางเชื่อมโยงสิทธิ์ Many-to-Many ระหว่าง Role และ Permission |
| `token_blocklist` | `TokenBlocklist` | **LOCKED KEEP** | โครงสร้างความปลอดภัยจำเป็นสำหรับ JWT Logout |
| `schools` | `School` | **ADD** | สถาบันการศึกษาสำหรับระบบ Multi-Tenancy |
| `school_settings` | `SchoolSetting` | **ADD** | การตั้งค่าเฉพาะของแต่ละโรงเรียน |
| `school_users` | `SchoolUser` | **ADD** | ผู้ใช้งานที่สังกัดโรงเรียน |
| `students` | `Student` | **ADD** | ข้อมูลและโปรไฟล์เฉพาะของนักเรียน |
| `instructors` | `Instructor` | **ADD** | ข้อมูลและโปรไฟล์เฉพาะของผู้สอน |
| `instructor_schools` | `InstructorSchool` | **ADD** | สังกัดโรงเรียนของผู้สอน |
| `classrooms` | `SchoolClassroom` | **ADD** | ห้องเรียนในโรงเรียน (แยกขาดจาก Course) |
| `classroom_students` | `ClassroomStudent` | **ADD** | การจัดนักเรียนเข้าห้องเรียนในโรงเรียน |

### Module 2 — ระบบจัดการการเรียนรู้ (LMS) (10 ตาราง)
| Table Name | Model Name | Status | คำอธิบายและฟิลด์สำคัญ |
| :--- | :--- | :---: | :--- |
| `courses` | `Course` / `Classroom` | **MODIFY** | คอร์สเรียนออนไลน์ (เพิ่ม `category_id`) |
| `course_categories` | `CourseCategory` | **ADD** | หมวดหมู่คอร์สเรียน |
| `classroom_members` | `Enrollment` / `ClassroomMember` | **KEEP** | การลงทะเบียนเรียนในคอร์ส |
| `chapters` | `Chapter` | **ADD** | โครงสร้างขั้น Chapter คั่นระหว่าง Course และ Lesson |
| `lessons` | `Lesson` | **MODIFY** | บทเรียน (เพิ่ม `chapter_id`, คง `classroom_id`) |
| `episodes` | `Episode` | **KEEP** | ตอนย่อยภายในบทเรียน |
| `contents` | `Content` | **KEEP** | เนื้อหาการเรียนรู้ (คง Dual-Pointer: `episode_id` และ `lesson_id`) |
| `media` | `Media` | **ADD** | ไฟล์สื่อ วิดีโอ เอกสารที่แนบกับเนื้อหา |
| `reviews` | `Review` | **ADD** | รีวิวและคะแนนคอร์สเรียน (Unique per user/course) |
| `journals` | `Journal` | **LOCKED KEEP** | ฟีเจอร์บันทึกการเรียนรู้ส่วนบุคคล (UAT-031 ถึง 033) |

### Module 3 — ระบบสตรีมมิ่ง (6 ตาราง)
| Table Name | Model Name | Status | คำอธิบายและฟิลด์สำคัญ |
| :--- | :--- | :---: | :--- |
| `online_rooms` | `OnlineRoom` | **ADD** | ห้องถ่ายทอดสด WebRTC / Streaming |
| `live_schedules` | `LiveSchedule` | **ADD** | ตารางเวลาเรียนถ่ายทอดสด |
| `live_sessions` | `LiveSession` | **ADD** | เซสชันการถ่ายทอดสดจริงที่กำลังรัน |
| `chat_messages` | `ChatMessage` | **ADD** | ข้อความแชทสดระหว่างการเรียน |
| `live_recordings` | `LiveRecording` | **ADD** | ไฟล์วิดีโอบันทึกการสอนย้อนหลัง |
| `live_participants` | `LiveParticipant` | **ADD** | ผู้เข้าร่วมสด พร้อมคอลัมน์ `mic_permission` |

### Module 4 — ระบบความก้าวหน้า (7 ตาราง)
| Table Name | Model Name | Status | คำอธิบายและฟิลด์สำคัญ |
| :--- | :--- | :---: | :--- |
| `learning_progress` | `LearningProgress` | **ADD** | ความคืบหน้าการเรียนระดับคอร์ส |
| `lesson_progress` | `LessonProgress` | **ADD** | ความคืบหน้ารายบทเรียน |
| `episode_progress` | `EpisodeProgress` | **ADD** | ความคืบหน้ารายตอน |
| `learning_activities` | `LearningActivity` | **ADD** | บันทึกประวัติกิจกรรมการเรียนรู้แบบละเอียด |
| `skills` | `Skill` | **ADD** | คลังทักษะความรู้ |
| `user_skills` | `UserSkill` | **ADD** | ระดับทักษะความเชี่ยวชาญของผู้เรียน |
| `learning_summaries` | `LearningSummary` | **ADD** | สรุปภาพรวมชั่วโมงเรียนและคอร์สที่จบ |

### Module 5 — ระบบสร้างแรงจูงใจ (11 ตาราง)
| Table Name | Model Name | Status | คำอธิบายและฟิลด์สำคัญ |
| :--- | :--- | :---: | :--- |
| `user_xps` | `UserXP` | **ADD** | บันทึกแต้มประสบการณ์ XP |
| `levels` | `Level` | **ADD** | เกณฑ์ระดับขั้นเลเวล |
| `user_levels` | `UserLevel` | **ADD** | เลเวลปัจจุบันของผู้เรียน |
| `badges` | `Badge` | **ADD** | ตราสัญลักษณ์และเหรียญรางวัล |
| `user_badges` | `UserBadge` | **ADD** | เหรียญรางวัลที่ผู้เรียนได้รับ |
| `user_streaks` | `UserStreak` | **ADD** | สถิติการเรียนต่อเนื่อง (`longest_streak`, `last_activity_date`) |
| `leaderboards` | `Leaderboard` | **ADD** | กระดานผู้นำการแข่งขัน (`period_type`, `period_start`, `period_end`) |
| `missions` | `Mission` | **ADD** | ภารกิจท้าทาย (`mission_type`, `reward_xp`, `reward_data`) |
| `mission_progress` | `MissionProgress` | **ADD** | ความคืบหน้าการทำภารกิจ |
| `rewards` | `Reward` | **ADD** | รายการของรางวัลและสิทธิพิเศษ |
| `user_rewards` | `UserReward` | **ADD** | ของรางวัลที่ผู้เรียนแลกรับ |

### Module 6 — ระบบดำเนินเนื้อเรื่องและภารกิจ (3 ตาราง)
| Table Name | Model Name | Status | คำอธิบายและฟิลด์สำคัญ |
| :--- | :--- | :---: | :--- |
| `stories` | `Story` | **ADD** | เนื้อเรื่องหลักของคอร์สเรียน |
| `story_scenes` | `StoryScene` | **ADD** | ฉากและบทสนทนาตามลำดับ (`sequence_no`, `title`, `content`) |
| `story_progress` | `StoryProgress` | **ADD** | สถานะความคืบหน้าการเล่นเนื้อเรื่องของผู้เรียน |

### Module 7 — เครื่องมือจำลองและห้องทดลองเสมือน (5 ตาราง)
| Table Name | Model Name | Status | คำอธิบายและฟิลด์สำคัญ |
| :--- | :--- | :---: | :--- |
| `virtual_labs` | `VirtualLab` | **ADD** | ห้องทดลองเสมือน วงจรจำลอง (Simulator) |
| `lab_projects` | `LabProject` | **ADD** | โปรเจกต์งานทดลองของผู้เรียน |
| `lab_devices` | `LabDevice` | **ADD** | อุปกรณ์และเซนเซอร์จำลองในโปรเจกต์ |
| `simulations` | `Simulation` | **ADD** | สถานะและผลลัพธ์การจำลองการทำงาน |
| `lab_assignments` | `LabAssignment` | **ADD** | การมอบหมายงานแล็บในคอร์สเรียน |

### Module 8 — ระบบแบบฝึกหัดและแบบทดสอบ (14 ตาราง)
| Table Name | Model Name | Status | คำอธิบายและฟิลด์สำคัญ |
| :--- | :--- | :---: | :--- |
| `coding_exercises` | `CodingExercise` | **ADD** | โจทย์เขียนโค้ดและสภาพแวดล้อมภาษา |
| `test_cases` | `TestCase` | **ADD** | Test Cases ตรวจโค้ดทั้งแบบเปิดและซ่อน |
| `code_submissions` | `CodeSubmission` | **ADD** | โค้ดที่ผู้เรียนส่งประเมินผล |
| `code_executions` | `CodeExecution` | **ADD** | ผลการรันโค้ด (stdout, stderr, runtime, memory) |
| `exercises` | `Exercise` | **ADD** | แบบฝึกหัดเสริมทักษะทั่วไป |
| `exercise_attempts` | `ExerciseAttempt` | **ADD** | ประวัติการทำแบบฝึกหัดและคะแนน (`submitted_at`, `score`) |
| `questions` | `Question` | **ADD** | คลังข้อสอบกลาง |
| `question_options` | `QuestionOption` | **ADD** | ตัวเลือกคำตอบและเฉลย |
| `quizzes` | `Quiz` | **ADD** | ชุดแบบทดสอบ |
| `quiz_conditions` | `QuizCondition` | **ADD** | เกณฑ์การสอบ (`max_attempts`, `time_limit_minutes`, `passing_score`) |
| `quiz_questions` | `QuizQuestion` | **ADD** | ข้อสอบที่อยู่ในชุดแบบทดสอบ |
| `quiz_attempts` | `QuizAttempt` | **ADD** | การเข้าทำแบบทดสอบของผู้เรียน |
| `quiz_answers` | `QuizAnswer` | **ADD** | คำตอบที่ผู้เรียนส่ง |
| `quiz_results` | `QuizResult` | **ADD** | ผลการสอบ คะแนน เปอร์เซ็นต์ สถานะผ่าน/ไม่ผ่าน |

### Module 9 — การบริหารจัดการและกำกับดูแลระบบ (8 ตาราง)
| Table Name | Model Name | Status | คำอธิบายและฟิลด์สำคัญ |
| :--- | :--- | :---: | :--- |
| `interactive_components` | `InteractiveComponent` | **ADD** | วิดเจ็ตเชิงโต้ตอบ |
| `announcements` | `Announcement` | **ADD** | ประกาศข่าวสาร |
| `notifications` | `Notification` | **ADD** | การแจ้งเตือนผู้ใช้งาน (`notification_type`, `read_at`, `link_url`) |
| `reports` | `Report` | **ADD** | รายงานสถิติและภาพรวมระบบ |
| `system_settings` | `SystemSetting` | **KEEP** | การตั้งค่าระบบ Global Configs และควบคุมพารามิเตอร์ AI |
| `audit_logs` | `AuditLog` | **ADD** | บันทึกประวัติการกระทำของแอดมินและผู้ใช้ (`created_at`) |
| `security_logs` | `SecurityLog` | **ADD** | บันทึกเหตุการณ์ความปลอดภัย (`ip_address`, `user_agent`) |
| `backups` | `Backup` | **ADD** | ข้อมูลการสำรองและกู้คืนฐานข้อมูล (`file_size`, `checksum`) |

### Module 10 — ระบบผู้ช่วย AI (4 ตาราง)
| Table Name | Model Name | Status | คำอธิบายและฟิลด์สำคัญ |
| :--- | :--- | :---: | :--- |
| `ai_conversations` | `AIConversation` | **ADD** | ประวัติห้องสนทนากับ AI |
| `ai_messages` | `AIMessage` | **ADD** | ข้อความสนทนา ถาม-ตอบ กับ AI |
| `ai_code_requests` | `AICodeRequest` | **ADD** | ประวัติการขอคำแนะนำหรือวิเคราะห์โค้ด |
| `ai_hints` | `AIHint` | **ADD** | คำใบ้และตัวช่วยเขียนโค้ดตามบริบท |