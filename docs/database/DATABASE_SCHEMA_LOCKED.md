# เอกสารโครงสร้างฐานข้อมูลและแผนงานที่ได้รับการอนุมัติล็อกสถานะ (DATABASE_SCHEMA_LOCKED.md)

> **STATUS: 10-MODULE SCHEMA IMPLEMENTED & MIGRATION READY**
> **SOURCE OF TRUTH: FEATURE LIST 10 MODULES**
> **SCHEMA VERSION: REVISION 4d8f1e29a35c**
> เอกสารฉบับนี้เป็นข้อตกลงอย่างเป็นทางการ (Single Source of Truth) ที่ระบุโครงสร้างฐานข้อมูลทั้งหมดของระบบ E-learning Platform ตาม Feature List 10 Modules ล่าสุด

---

## 1. สรุปโครงสร้างการจำแนก Entities ทั้งหมด (Target Entity Count Breakdown)

| หมวดหมู่ Entity | จำนวน | รายละเอียดและนิยามทางสถาปัตยกรรม |
| :--- | :---: | :--- |
| **1. Core 10 Modules Entities** | **85** | ครอบคลุมทั้ง 10 Modules ตาม Feature List ล่าสุด |
| **2. Supporting Infrastructure** | **1** | `token_blocklist` — โครงสร้างความปลอดภัยจำเป็นสำหรับ JWT Logout (UAT-013, 014) |
| **3. Legacy / Supporting Features** | **1** | `journals` — ฟีเจอร์บันทึกการเรียนรู้ส่วนตัวของนักเรียน (UAT-031 ถึง 033) |
| **4. RBAC Mapping Table** | **1** | `RolePermission` — ตารางเชื่อมโยงสิทธิ์ Many-to-Many ระหว่าง Role และ Permission |
| **รวมตารางทั้งหมดในระบบ** | **88** | 14 ตารางเดิมที่คงไว้ + 74 ตารางใหม่ที่สร้างผ่าน Migration |

---

## 2. Locked Core Schema (10 Modules)

### Module 1 — บัญชีผู้ใช้และการจัดการผู้ใช้ (18 Entities + 1 Supporting + 1 RBAC)
- **Feature 1.1 - 1.9 (User & Access):**
  - `User` (`users` - PK `user_id`)
  - `UserProfile` (`user_profiles` - PK `profile_id`, FK `user_id` 1-to-1)
  - `UserAccess` (`user_access` - PK `access_id`, FK `user_id`, ประวัติการเข้าถึงและการกำหนดอายุสิทธิ์)
  - `Session` (`sessions` - PK `session_id`, FK `user_id`, จัดการ Stateful Session พร้อม `ended_at`, `revoked_at`)
  - `RefreshToken` (`refresh_tokens` - PK `token_id`, FK `user_id`)
  - `PasswordResetToken` (`password_reset_tokens` - PK `token_id`, FK `user_id`, พร้อม `used_at`)
  - `PasswordHistory` (`password_histories` - PK `history_id`, FK `user_id`)
  - `Role` (`roles` - PK `role_id`)
  - `Permission` (`permissions` - PK `permission_id`)
  - `UserRole` (`user_roles` - PK `user_role_id`, FK `user_id`, `role_id`)
  - `RolePermission` (`role_permissions` - PK `role_permission_id`, FK `role_id`, `permission_id`)
  - `TokenBlocklist` (`token_blocklist` - Supporting Infrastructure สำหรับ JWT Logout)
- **Feature 1.10 (School, Classroom & Member Management):**
  - `School` (`schools` - PK `school_id`)
  - `SchoolSetting` (`school_settings` - PK `setting_id`, FK `school_id`)
  - `SchoolUser` (`school_users` - PK `school_user_id`, FK `school_id`, `user_id`)
  - `Student` (`students` - PK `student_id`, FK `user_id`)
  - `Instructor` (`instructors` - PK `instructor_id`, FK `user_id`)
  - `InstructorSchool` (`instructor_schools` - PK `id`, FK `instructor_id`, `school_id`)
  - `Classroom` (`classrooms` - PK `classroom_id`, FK `school_id`, ห้องเรียนโรงเรียน)
  - `ClassroomStudent` (`classroom_students` - PK `id`, FK `classroom_id`, `student_id`)

### Module 2 — ระบบจัดการการเรียนรู้ (LMS) (9 Entities + 1 Supporting)
- **Entities:**
  - `Course` (`courses` - PK `classroom_id` / `course_id`, FK `instructor_id`, `category_id`)
  - `CourseCategory` (`course_categories` - PK `category_id`)
  - `Enrollment` / `ClassroomMember` (`classroom_members` - PK `classroom_member_id`, FK `course_id`, `user_id`)
  - `Chapter` (`chapters` - PK `chapter_id`, FK `course_id`)
  - `Lesson` (`lessons` - PK `lesson_id`, FK `chapter_id`, FK `classroom_id` Dual-Pointer)
  - `Episode` (`episodes` - PK `episode_id`, FK `lesson_id`)
  - `Content` (`contents` - PK `content_id`, FK `episode_id`, FK `lesson_id` Dual-Pointer)
  - `Media` (`media` - PK `media_id`, FK `content_id`, FK `user_id`)
  - `Review` (`reviews` - PK `review_id`, FK `user_id`, FK `course_id`, Unique per user/course)
  - `Journal` (`journals` - Supporting Feature บันทึกการเรียนรู้)

### Module 3 — ระบบสตรีมมิ่ง (6 Entities)
- **Entities:**
  - `OnlineRoom` (`online_rooms` - PK `room_id`, WebRTC / Streaming)
  - `LiveSchedule` (`live_schedules` - PK `schedule_id`, FK `course_id`, `instructor_id`)
  - `LiveSession` (`live_sessions` - PK `live_session_id`, FK `schedule_id`, `room_id`, `instructor_id`)
  - `ChatMessage` (`chat_messages` - PK `message_id`, FK `live_session_id`, `user_id`)
  - `LiveRecording` (`live_recordings` - PK `recording_id`, FK `live_session_id`)
  - `LiveParticipant` (`live_participants` - PK `participant_id`, FK `live_session_id`, `user_id`, พร้อม `mic_permission`)

### Module 4 — ระบบความก้าวหน้า (7 Entities)
- **Entities:**
  - `LearningProgress` (`learning_progress` - PK `progress_id`, FK `user_id`, `course_id`)
  - `LessonProgress` (`lesson_progress` - PK `id`, FK `user_id`, `lesson_id`)
  - `EpisodeProgress` (`episode_progress` - PK `id`, FK `user_id`, `episode_id`)
  - `LearningActivity` (`learning_activities` - PK `activity_id`, FK `user_id`)
  - `Skill` (`skills` - PK `skill_id`)
  - `UserSkill` (`user_skills` - PK `id`, FK `user_id`, `skill_id`)
  - `LearningSummary` (`learning_summaries` - PK `summary_id`, FK `user_id`)

### Module 5 — ระบบสร้างแรงจูงใจ (11 Entities)
- **Entities:**
  - `UserXP` (`user_xps` - PK `xp_id`, FK `user_id`)
  - `Level` (`levels` - PK `level_id`, `level_number`)
  - `UserLevel` (`user_levels` - PK `id`, FK `user_id`, `level_id`)
  - `Badge` (`badges` - PK `badge_id`)
  - `UserBadge` (`user_badges` - PK `id`, FK `user_id`, `badge_id`)
  - `UserStreak` (`user_streaks` - PK `streak_id`, FK `user_id`, พร้อม `longest_streak`, `last_activity_date`)
  - `Leaderboard` (`leaderboards` - PK `leaderboard_id`, FK `user_id`, พร้อม `period_type`, `period_start`, `period_end`)
  - `Mission` (`missions` - PK `mission_id`, พร้อม `mission_type`, `reward_xp`, `reward_data`)
  - `MissionProgress` (`mission_progress` - PK `id`, FK `user_id`, `mission_id`)
  - `Reward` (`rewards` - PK `reward_id`, `reward_type`, `reward_value`)
  - `UserReward` (`user_rewards` - PK `user_reward_id`, FK `user_id`, `reward_id`)

### Module 6 — ระบบดำเนินเนื้อเรื่องและภารกิจ (3 Entities)
- **Entities:**
  - `Story` (`stories` - PK `story_id`, FK `course_id`)
  - `StoryScene` (`story_scenes` - PK `scene_id`, FK `story_id`, พร้อม `sequence_no`, `title`, `content`, `scene_data`)
  - `StoryProgress` (`story_progress` - PK `story_progress_id`, FK `user_id`, `story_id`, `scene_id`)

### Module 7 — เครื่องมือจำลองและห้องทดลองเสมือน (5 Entities)
- **Entities:**
  - `VirtualLab` (`virtual_labs` - PK `lab_id`, `lab_type`, `config_data`)
  - `LabProject` (`lab_projects` - PK `project_id`, FK `lab_id`, `user_id`)
  - `LabDevice` (`lab_devices` - PK `device_id`, FK `project_id`)
  - `Simulation` (`simulations` - PK `simulation_id`, FK `project_id`)
  - `LabAssignment` (`lab_assignments` - PK `assignment_id`, FK `lab_id`, `course_id`)

### Module 8 — ระบบแบบฝึกหัดและแบบทดสอบ (14 Entities)
- **Coding Engine:**
  - `CodingExercise` (`coding_exercises` - PK `coding_exercise_id`, FK `lesson_id`)
  - `TestCase` (`test_cases` - PK `test_case_id`, FK `coding_exercise_id`)
  - `CodeSubmission` (`code_submissions` - PK `submission_id`, FK `coding_exercise_id`, `user_id`)
  - `CodeExecution` (`code_executions` - PK `execution_id`, FK `submission_id`)
- **General Exercise:**
  - `Exercise` (`exercises` - PK `exercise_id`, FK `lesson_id`)
  - `ExerciseAttempt` (`exercise_attempts` - PK `attempt_id`, FK `exercise_id`, `user_id`, พร้อม `score`, `status`, `submitted_at`)
- **Quiz & Examination Engine:**
  - `Quiz` (`quizzes` - PK `quiz_id`, FK `lesson_id`, `course_id`)
  - `QuizCondition` (`quiz_conditions` - PK `condition_id`, FK `quiz_id`, พร้อม `max_attempts`, `time_limit_minutes`, `passing_score`)
  - `Question` (`questions` - PK `question_id`)
  - `QuizQuestion` (`quiz_questions` - PK `id`, FK `quiz_id`, `question_id`)
  - `QuestionOption` (`question_options` - PK `option_id`, FK `question_id`)
  - `QuizAttempt` (`quiz_attempts` - PK `attempt_id`, FK `quiz_id`, `user_id`, พร้อม `started_at`, `submitted_at`, `status`)
  - `QuizAnswer` (`quiz_answers` - PK `answer_id`, FK `attempt_id`, `question_id`, `option_id`, `answer_text`)
  - `QuizResult` (`quiz_results` - PK `result_id`, FK `attempt_id`, `user_id`, `score`, `percentage`, `is_passed`, `feedback`)

### Module 9 — การบริหารจัดการและกำกับดูแลระบบ (8 Entities)
- **Entities:**
  - `InteractiveComponent` (`interactive_components` - PK `component_id`, FK `created_by`)
  - `Announcement` (`announcements` - PK `announcement_id`, FK `school_id`, `created_by`)
  - `Notification` (`notifications` - PK `notification_id`, FK `user_id`, พร้อม `notification_type`, `read_at`, `link_url`)
  - `Report` (`reports` - PK `report_id`, FK `generated_by`)
  - `SystemSetting` (`system_settings` - PK `key`, จัดเก็บ Global Configs, Maintenance Mode, AI Settings)
  - `AuditLog` (`audit_logs` - PK `log_id`, FK `user_id`, พร้อม `created_at`)
  - `SecurityLog` (`security_logs` - PK `log_id`, FK `user_id`, พร้อม `user_agent`, `created_at`)
  - `Backup` (`backups` - PK `backup_id`, FK `created_by`, พร้อม `status`, `file_size`, `checksum`, `created_at`)

### Module 10 — ระบบผู้ช่วย AI (4 Entities)
- **Entities:**
  - `AIConversation` (`ai_conversations` - PK `conversation_id`, FK `user_id`)
  - `AIMessage` (`ai_messages` - PK `message_id`, FK `conversation_id`)
  - `AICodeRequest` (`ai_code_requests` - PK `request_id`, FK `user_id`, `coding_exercise_id`)
  - `AIHint` (`ai_hints` - PK `hint_id`, FK `user_id`)
  - *(การตั้งค่า Model, Token Limit, Usage Limit ควบคุมผ่าน `SystemSetting` ใน Module 9 ตามข้อกำหนด)*

---

## 3. ตารางโครงสร้างความปลอดภัยและฟีเจอร์เดิม (Infrastructure & Legacy Features)
- `token_blocklist`: ตารางสำหรับ JWT Blocklist ขับเคลื่อน `@jwt.token_in_blocklist_loader` ใน `app/extensions.py` (ห้ามดรอป)
- `journals`: ตารางบันทึกการเรียนรู้ส่วนบุคคลสำหรับ UAT-031 ถึง UAT-033 (ห้ามดรอป)