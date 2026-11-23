# =====================================================================
# models/__init__.py: รวม import ของทุก Model ไว้ที่เดียว
# เพื่อให้ Flask-Migrate มองเห็นทุกตาราง และให้ที่อื่น import ได้จาก app.models
# =====================================================================

# Module 1: User & Access
from app.models.user import (
    User,
    UserProfile,
    UserAccess,
    Session,
    PasswordHistory,
)
from app.models.role import (
    Role,
    UserRole,
    Permission,
    RolePermission,
    seed_default_roles,
)
from app.models.security import (
    RefreshToken,
    TokenBlocklist,
    SystemSetting,
    PasswordResetToken,
)

# Module 1.10: School, Classroom & Member Management
from app.models.school import (
    School,
    SchoolSetting,
    SchoolUser,
    Student,
    Instructor,
    InstructorSchool,
    Classroom as SchoolClassroom,
    ClassroomStudent,
)

# Module 2: LMS (Courses, Curriculum, Media, Reviews)
from app.models.classroom import (
    Classroom,
    ClassroomMember,
    CourseCategory,
    Course,
    Chapter,
    Lesson,
    Episode,
    Content,
    Media,
    Journal,
    Review,
    Enrollment,
)

# Module 3: Streaming & Live Classes
from app.models.streaming import (
    OnlineRoom,
    LiveSchedule,
    LiveSession,
    ChatMessage,
    LiveRecording,
    LiveParticipant,
)

# Module 4: Learning Progress
from app.models.progress import (
    LearningProgress,
    LessonProgress,
    EpisodeProgress,
    ContentProgress,
    LearningActivity,
    Skill,
    UserSkill,
    LearningSummary,
)

# Module 5: Motivation & Gamification
from app.models.gamification import (
    UserXP,
    Level,
    UserLevel,
    Badge,
    UserBadge,
    UserStreak,
    Leaderboard,
    Mission,
    MissionProgress,
    Reward,
    UserReward,
)

# Module 6: Story Framework & Missions
from app.models.story import (
    Story,
    StoryScene,
    StoryProgress,
)

# Module 7: Virtual Lab & Simulation
from app.models.virtuallab import (
    VirtualLab,
    LabProject,
    LabDevice,
    Simulation,
    LabAssignment,
)

# Module 8: Exercises & Quizzes
from app.models.exercise import (
    CodingExercise,
    TestCase,
    CodeSubmission,
    CodeExecution,
    Exercise,
    ExerciseAttempt,
)
from app.models.quiz import (
    Quiz,
    QuizCondition,
    Question,
    QuizQuestion,
    QuestionOption,
    QuizAttempt,
    QuizAnswer,
    QuizResult,
)

# Module 9: System Administration & Governance
from app.models.admin import (
    InteractiveComponent,
    Announcement,
    Notification,
    Report,
    AuditLog,
    SecurityLog,
    Backup,
)

# Module 10: AI Assistant
from app.models.ai import (
    AIConversation,
    AIMessage,
    AICodeRequest,
    AIHint,
)

__all__ = [
    # Module 1
    "User",
    "UserProfile",
    "UserAccess",
    "Session",
    "PasswordHistory",
    "Role",
    "UserRole",
    "Permission",
    "RolePermission",
    "seed_default_roles",
    "RefreshToken",
    "TokenBlocklist",
    "SystemSetting",
    "PasswordResetToken",
    "School",
    "SchoolSetting",
    "SchoolUser",
    "Student",
    "Instructor",
    "InstructorSchool",
    "SchoolClassroom",
    "ClassroomStudent",
    # Module 2
    "Classroom",
    "ClassroomMember",
    "CourseCategory",
    "Course",
    "Chapter",
    "Lesson",
    "Episode",
    "Content",
    "Media",
    "Journal",
    "Review",
    "Enrollment",
    # Module 3
    "OnlineRoom",
    "LiveSchedule",
    "LiveSession",
    "ChatMessage",
    "LiveRecording",
    "LiveParticipant",
    # Module 4
    "LearningProgress",
    "LessonProgress",
    "EpisodeProgress",
    "ContentProgress",
    "LearningActivity",
    "Skill",
    "UserSkill",
    "LearningSummary",
    # Module 5
    "UserXP",
    "Level",
    "UserLevel",
    "Badge",
    "UserBadge",
    "UserStreak",
    "Leaderboard",
    "Mission",
    "MissionProgress",
    "Reward",
    "UserReward",
    # Module 6
    "Story",
    "StoryScene",
    "StoryProgress",
    # Module 7
    "VirtualLab",
    "LabProject",
    "LabDevice",
    "Simulation",
    "LabAssignment",
    # Module 8
    "CodingExercise",
    "TestCase",
    "CodeSubmission",
    "CodeExecution",
    "Exercise",
    "ExerciseAttempt",
    "Quiz",
    "QuizCondition",
    "Question",
    "QuizQuestion",
    "QuestionOption",
    "QuizAttempt",
    "QuizAnswer",
    "QuizResult",
    # Module 9
    "InteractiveComponent",
    "Announcement",
    "Notification",
    "Report",
    "AuditLog",
    "SecurityLog",
    "Backup",
    # Module 10
    "AIConversation",
    "AIMessage",
    "AICodeRequest",
    "AIHint",
]
