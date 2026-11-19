"""
test_schema_10_modules.py
Comprehensive Verification Suite for the 10-Module Database Schema
Verifies all 88 tables, relationships, constraints, and prohibited entities.
"""
import sys
import unittest
from datetime import datetime, timezone
from flask import Flask

class TestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = "test-secret-key-10-modules"


class TestSchema10Modules(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create app with in-memory SQLite to avoid requiring external Postgres in CI/local
        from app import create_app
        cls.app = create_app(TestConfig)
        cls.ctx = cls.app.app_context()
        cls.ctx.push()

        from app.extensions import db
        cls.db = db
        # Create all tables in SQLite memory
        db.create_all()

    @classmethod
    def tearDownClass(cls):
        cls.db.session.remove()
        cls.db.drop_all()
        cls.ctx.pop()

    def tearDown(self):
        self.db.session.rollback()

    def test_01_total_table_count_and_no_parents(self):
        """Verify exactly 88 tables are registered, and Parent/ParentStudent are strictly absent."""
        tables = set(self.db.metadata.tables.keys())
        print(f"\n[INFO] Total registered tables in metadata: {len(tables)}")
        
        # Verify 88 tables
        self.assertEqual(len(tables), 88, f"Expected 88 tables, found {len(tables)}: {sorted(tables)}")

        # Strict prohibition: Parent and ParentStudent must NOT exist
        self.assertNotIn("parents", tables, "Prohibited table 'parents' found in metadata!")
        self.assertNotIn("parent_students", tables, "Prohibited table 'parent_students' found in metadata!")
        self.assertNotIn("parent", tables, "Prohibited table 'parent' found in metadata!")

    def test_02_module_1_user_and_school_tables(self):
        """Verify Module 1 entities (18 entities + 1 supporting + 1 RBAC = 20 tables)."""
        tables = set(self.db.metadata.tables.keys())
        expected_module_1 = {
            "users", "user_profiles", "user_access", "sessions", "refresh_tokens",
            "password_reset_tokens", "password_histories", "roles", "permissions",
            "user_roles", "role_permissions", "token_blocklist",
            "schools", "school_settings", "school_users", "students",
            "instructors", "instructor_schools", "classrooms", "classroom_students"
        }
        missing = expected_module_1 - tables
        self.assertEqual(missing, set(), f"Missing Module 1 tables: {missing}")

    def test_03_module_2_course_and_content_tables(self):
        """Verify Module 2 entities (9 entities + 1 supporting = 10 tables)."""
        tables = set(self.db.metadata.tables.keys())
        expected_module_2 = {
            "courses", "course_categories", "classroom_members", "chapters",
            "lessons", "episodes", "contents", "media", "reviews", "journals"
        }
        missing = expected_module_2 - tables
        self.assertEqual(missing, set(), f"Missing Module 2 tables: {missing}")

    def test_04_module_3_streaming_tables(self):
        """Verify Module 3 entities (6 tables)."""
        tables = set(self.db.metadata.tables.keys())
        expected_module_3 = {
            "online_rooms", "live_schedules", "live_sessions",
            "chat_messages", "live_recordings", "live_participants"
        }
        missing = expected_module_3 - tables
        self.assertEqual(missing, set(), f"Missing Module 3 tables: {missing}")

    def test_05_module_4_progress_tables(self):
        """Verify Module 4 entities (7 tables)."""
        tables = set(self.db.metadata.tables.keys())
        expected_module_4 = {
            "learning_progress", "lesson_progress", "episode_progress",
            "learning_activities", "skills", "user_skills", "learning_summaries"
        }
        missing = expected_module_4 - tables
        self.assertEqual(missing, set(), f"Missing Module 4 tables: {missing}")

    def test_06_module_5_gamification_tables(self):
        """Verify Module 5 entities (11 tables)."""
        tables = set(self.db.metadata.tables.keys())
        expected_module_5 = {
            "user_xps", "levels", "user_levels", "badges", "user_badges",
            "user_streaks", "leaderboards", "missions", "mission_progress",
            "rewards", "user_rewards"
        }
        missing = expected_module_5 - tables
        self.assertEqual(missing, set(), f"Missing Module 5 tables: {missing}")

    def test_07_module_6_story_tables(self):
        """Verify Module 6 entities (3 tables)."""
        tables = set(self.db.metadata.tables.keys())
        expected_module_6 = {
            "stories", "story_scenes", "story_progress"
        }
        missing = expected_module_6 - tables
        self.assertEqual(missing, set(), f"Missing Module 6 tables: {missing}")

    def test_08_module_7_virtual_lab_tables(self):
        """Verify Module 7 entities (5 tables)."""
        tables = set(self.db.metadata.tables.keys())
        expected_module_7 = {
            "virtual_labs", "lab_projects", "lab_devices",
            "simulations", "lab_assignments"
        }
        missing = expected_module_7 - tables
        self.assertEqual(missing, set(), f"Missing Module 7 tables: {missing}")

    def test_09_module_8_exercise_and_quiz_tables(self):
        """Verify Module 8 entities (14 tables: coding, exercise, quiz)."""
        tables = set(self.db.metadata.tables.keys())
        expected_module_8 = {
            "coding_exercises", "test_cases", "code_submissions", "code_executions",
            "exercises", "exercise_attempts",
            "quizzes", "quiz_conditions", "questions", "quiz_questions",
            "question_options", "quiz_attempts", "quiz_answers", "quiz_results"
        }
        missing = expected_module_8 - tables
        self.assertEqual(missing, set(), f"Missing Module 8 tables: {missing}")

    def test_10_module_9_admin_and_governance_tables(self):
        """Verify Module 9 entities (8 tables)."""
        tables = set(self.db.metadata.tables.keys())
        expected_module_9 = {
            "interactive_components", "announcements", "notifications",
            "reports", "system_settings", "audit_logs", "security_logs", "backups"
        }
        missing = expected_module_9 - tables
        self.assertEqual(missing, set(), f"Missing Module 9 tables: {missing}")

    def test_11_module_10_ai_tables(self):
        """Verify Module 10 entities (4 tables)."""
        tables = set(self.db.metadata.tables.keys())
        expected_module_10 = {
            "ai_conversations", "ai_messages", "ai_code_requests", "ai_hints"
        }
        missing = expected_module_10 - tables
        self.assertEqual(missing, set(), f"Missing Module 10 tables: {missing}")

    def test_12_dual_pointer_in_contents(self):
        """Verify dual-pointer architecture: contents has both lesson_id and episode_id."""
        contents_cols = {c.name for c in self.db.metadata.tables["contents"].columns}
        self.assertIn("episode_id", contents_cols, "contents missing episode_id")
        self.assertIn("lesson_id", contents_cols, "contents missing lesson_id")

    def test_13_curriculum_hierarchy_chapter_inserted(self):
        """Verify Chapter table exists and lessons table has chapter_id."""
        lessons_cols = {c.name for c in self.db.metadata.tables["lessons"].columns}
        self.assertIn("chapter_id", lessons_cols, "lessons missing chapter_id")
        self.assertIn("classroom_id", lessons_cols, "lessons missing classroom_id (backward compat)")

    def test_14_crud_roundtrip_new_models(self):
        """Test basic creation and query of newly introduced models."""
        from app.models import (
            User, School, SchoolClassroom, Chapter, Course,
            Story, VirtualLab, CodingExercise, Quiz, AIConversation
        )
        # Create user
        user = User(email="test_schema@example.com", status="active")
        user.set_password("SecurePass123!")
        self.db.session.add(user)
        self.db.session.commit()

        # School & School Classroom
        school = School(name="Demo Academy", code="DA001")
        self.db.session.add(school)
        self.db.session.flush()

        school_room = SchoolClassroom(school_id=school.school_id, classroom_name="Room 101")
        self.db.session.add(school_room)

        # Course & Chapter
        course = Course(title="Full Stack Python", instructor_id=user.user_id)
        self.db.session.add(course)
        self.db.session.flush()

        chapter = Chapter(course_id=course.classroom_id, title="Chapter 1: Intro", sequence_no=1)
        self.db.session.add(chapter)

        # Story
        story = Story(course_id=course.classroom_id, title="Code Odyssey")
        self.db.session.add(story)

        # Virtual Lab
        lab = VirtualLab(name="IoT Simulator", lab_type="iot")
        self.db.session.add(lab)

        # AI Conversation
        ai_conv = AIConversation(user_id=user.user_id, title="Python Help")
        self.db.session.add(ai_conv)

        self.db.session.commit()

        # Assert query
        self.assertIsNotNone(School.query.filter_by(code="DA001").first())
        self.assertIsNotNone(Chapter.query.filter_by(title="Chapter 1: Intro").first())
        self.assertIsNotNone(Story.query.filter_by(title="Code Odyssey").first())
        self.assertIsNotNone(VirtualLab.query.filter_by(name="IoT Simulator").first())
        self.assertIsNotNone(AIConversation.query.filter_by(title="Python Help").first())

        # Cleanup
        self.db.session.delete(ai_conv)
        self.db.session.delete(lab)
        self.db.session.delete(story)
        self.db.session.delete(chapter)
        self.db.session.delete(course)
        self.db.session.delete(school_room)
        self.db.session.delete(school)
        self.db.session.delete(user)
        self.db.session.commit()

    def test_15_module_8_coding_and_quiz_crud(self):
        """Test CRUD operations on Module 8 Coding and Quiz entities."""
        from app.models import (
            User, Course, Lesson, CodingExercise, TestCase, CodeSubmission, CodeExecution,
            Quiz, QuizCondition, Question, QuestionOption, QuizAttempt, QuizAnswer, QuizResult
        )
        user = User(email="coder@example.com", status="active")
        user.set_password("pass123")
        self.db.session.add(user)
        self.db.session.flush()

        course = Course(title="Algorithms", instructor_id=user.user_id)
        self.db.session.add(course)
        self.db.session.flush()

        lesson = Lesson(classroom_id=course.classroom_id, title="Sorting", sequence_no=1)
        self.db.session.add(lesson)
        self.db.session.flush()

        # Coding
        coding = CodingExercise(lesson_id=lesson.lesson_id, title="QuickSort", programming_language="python")
        self.db.session.add(coding)
        self.db.session.flush()

        tc = TestCase(coding_exercise_id=coding.coding_exercise_id, input_data="[3, 1, 2]", expected_output="[1, 2, 3]")
        self.db.session.add(tc)

        sub = CodeSubmission(coding_exercise_id=coding.coding_exercise_id, user_id=user.user_id, submitted_code="def sort(): pass", language="python")
        self.db.session.add(sub)
        self.db.session.flush()

        exec_res = CodeExecution(submission_id=sub.submission_id, status="passed", execution_time_ms=45.2)
        self.db.session.add(exec_res)

        # Quiz
        quiz = Quiz(title="Sort Quiz", lesson_id=lesson.lesson_id, course_id=course.classroom_id)
        self.db.session.add(quiz)
        self.db.session.flush()

        cond = QuizCondition(quiz_id=quiz.quiz_id, max_attempts=3, time_limit_minutes=30, passing_score=70.0)
        self.db.session.add(cond)

        q = Question(question_text="Time complexity of QuickSort?", question_type="multiple_choice")
        self.db.session.add(q)
        self.db.session.flush()

        opt = QuestionOption(question_id=q.question_id, option_text="O(n log n)", is_correct=True)
        self.db.session.add(opt)

        attempt = QuizAttempt(quiz_id=quiz.quiz_id, user_id=user.user_id, status="completed")
        self.db.session.add(attempt)
        self.db.session.flush()

        ans = QuizAnswer(attempt_id=attempt.attempt_id, question_id=q.question_id, option_id=opt.option_id, is_correct=True)
        self.db.session.add(ans)

        res = QuizResult(attempt_id=attempt.attempt_id, user_id=user.user_id, score=100.0, total_score=100.0, percentage=100.0, is_passed=True)
        self.db.session.add(res)
        self.db.session.commit()

        # Assertions
        self.assertEqual(CodingExercise.query.count(), 1)
        self.assertEqual(TestCase.query.count(), 1)
        self.assertEqual(CodeSubmission.query.count(), 1)
        self.assertEqual(CodeExecution.query.count(), 1)
        self.assertEqual(QuizResult.query.filter_by(is_passed=True).count(), 1)
        self.assertIn("QuickSort", coding.to_dict()["title"])
        self.assertIn("score", res.to_dict())

    def test_16_module_5_gamification_crud(self):
        """Test CRUD operations on Module 5 Gamification entities."""
        from app.models import User, UserXP, Level, Badge, UserBadge, UserStreak, Leaderboard, Mission, Reward
        user = User(email="gamer@example.com", status="active")
        user.set_password("pass123")
        self.db.session.add(user)
        self.db.session.flush()

        xp = UserXP(user_id=user.user_id, amount=500, source_type="exercise")
        lvl = Level(level_number=2, min_xp=1000, title="Novice Coder")
        badge = Badge(name="First Code", badge_type="achievement")
        streak = UserStreak(user_id=user.user_id, current_streak=5, longest_streak=10)
        lb = Leaderboard(user_id=user.user_id, period_type="weekly", rank=1, score=500)
        mission = Mission(title="Solve 3 Exercises", mission_type="daily", reward_xp=100)
        reward = Reward(name="Gold Avatar", reward_type="avatar", reward_value={"cost_xp": 300})

        self.db.session.add_all([xp, lvl, badge, streak, lb, mission, reward])
        self.db.session.commit()

        self.assertEqual(UserStreak.query.filter_by(user_id=user.user_id).first().longest_streak, 10)
        self.assertEqual(Leaderboard.query.filter_by(period_type="weekly").first().rank, 1)
        self.assertEqual(Mission.query.first().mission_type, "daily")

    def test_17_module_9_admin_logs_and_backup_crud(self):
        """Test CRUD operations on Module 9 Audit, Security, and Backup entities."""
        from app.models import User, AuditLog, SecurityLog, Backup, SystemSetting
        user = User(email="admin_audit@example.com", status="active")
        user.set_password("pass123")
        self.db.session.add(user)
        self.db.session.flush()

        audit = AuditLog(user_id=user.user_id, action="CREATE_COURSE", entity_type="Course")
        sec = SecurityLog(user_id=user.user_id, event_type="LOGIN_SUCCESS", ip_address="127.0.0.1", user_agent="Mozilla/5.0")
        backup = Backup(created_by=user.user_id, filename="backup_2026.sql.gz", status="completed", file_size=1048576, checksum="sha256:abc")
        setting = SystemSetting(key="ai.max_tokens", value="4096")

        self.db.session.add_all([audit, sec, backup, setting])
        self.db.session.commit()

        self.assertIsNotNone(AuditLog.query.filter_by(action="CREATE_COURSE").first())
        self.assertEqual(SecurityLog.query.filter_by(user_agent="Mozilla/5.0").first().event_type, "LOGIN_SUCCESS")
        self.assertEqual(Backup.query.first().status, "completed")
        self.assertEqual(SystemSetting.query.filter_by(key="ai.max_tokens").first().value, "4096")

    def test_18_module_3_streaming_crud(self):
        """Test CRUD operations on Module 3 Streaming entities."""
        from app.models import User, Course, OnlineRoom, LiveSchedule, LiveSession, LiveParticipant, ChatMessage
        user = User(email="streamer@example.com", status="active")
        user.set_password("pass123")
        self.db.session.add(user)
        self.db.session.flush()

        course = Course(title="Live Web Dev", instructor_id=user.user_id)
        room = OnlineRoom(room_name="WebRTC Room 1", room_type="webrtc")
        self.db.session.add_all([course, room])
        self.db.session.flush()

        sched = LiveSchedule(
            course_id=course.classroom_id,
            instructor_id=user.user_id,
            title="Session 1",
            scheduled_start=datetime.now(timezone.utc),
            scheduled_end=datetime.now(timezone.utc)
        )
        self.db.session.add(sched)
        self.db.session.flush()

        sess = LiveSession(schedule_id=sched.schedule_id, room_id=room.room_id, instructor_id=user.user_id, title="Active Stream")
        self.db.session.add(sess)
        self.db.session.flush()

        participant = LiveParticipant(live_session_id=sess.live_session_id, user_id=user.user_id, mic_permission=True)
        msg = ChatMessage(live_session_id=sess.live_session_id, user_id=user.user_id, message="Hello class!")
        self.db.session.add_all([participant, msg])
        self.db.session.commit()

        self.assertEqual(LiveSession.query.count(), 1)
        self.assertTrue(LiveParticipant.query.first().mic_permission)
        self.assertEqual(ChatMessage.query.first().message, "Hello class!")

    def test_19_module_4_progress_and_skills_crud(self):
        """Test CRUD operations on Module 4 Progress and Skill entities."""
        from app.models import User, Course, LearningProgress, Skill, UserSkill, LearningSummary
        user = User(email="learner@example.com", status="active")
        user.set_password("pass123")
        self.db.session.add(user)
        self.db.session.flush()

        course = Course(title="Python Pro", instructor_id=user.user_id)
        self.db.session.add(course)
        self.db.session.flush()

        prog = LearningProgress(user_id=user.user_id, course_id=course.classroom_id, progress_percent=75.5, status="in_progress")
        skill = Skill(name="Python OOP", category="backend")
        self.db.session.add_all([prog, skill])
        self.db.session.flush()

        uskill = UserSkill(user_id=user.user_id, skill_id=skill.skill_id, level=3)
        summary = LearningSummary(user_id=user.user_id, total_learning_time_minutes=60, total_courses_completed=1)
        self.db.session.add_all([uskill, summary])
        self.db.session.commit()

        self.assertEqual(float(LearningProgress.query.first().progress_percent), 75.5)
        self.assertEqual(UserSkill.query.first().level, 3)
        self.assertEqual(LearningSummary.query.first().total_learning_time_minutes, 60)

    def test_20_module_7_virtual_lab_crud(self):
        """Test CRUD operations on Module 7 Virtual Lab entities."""
        from app.models import User, Course, VirtualLab, LabProject, LabDevice, Simulation, LabAssignment
        user = User(email="scientist@example.com", status="active")
        user.set_password("pass123")
        self.db.session.add(user)
        self.db.session.flush()

        course = Course(title="Robotics", instructor_id=user.user_id)
        lab = VirtualLab(name="Microcontroller Lab", lab_type="hardware")
        self.db.session.add_all([course, lab])
        self.db.session.flush()

        proj = LabProject(lab_id=lab.lab_id, user_id=user.user_id, name="Arduino LED Blink")
        self.db.session.add(proj)
        self.db.session.flush()

        dev = LabDevice(project_id=proj.project_id, device_type="LED", device_name="Red LED")
        sim = Simulation(project_id=proj.project_id, status="running")
        assign = LabAssignment(lab_id=lab.lab_id, course_id=course.classroom_id, title="Lab 1 Assignment")
        self.db.session.add_all([dev, sim, assign])
        self.db.session.commit()

        self.assertEqual(LabDevice.query.first().device_name, "Red LED")
        self.assertEqual(Simulation.query.first().status, "running")
        self.assertEqual(LabAssignment.query.first().title, "Lab 1 Assignment")


if __name__ == "__main__":
    unittest.main(verbosity=2)
