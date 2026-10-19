from app.routes.auth import auth_bp
from app.routes.users import users_bp, student_bp
from app.routes.roles import roles_bp
from app.routes.classrooms import classrooms_bp, instructor_bp
from app.routes.lessons import lessons_bp
from app.routes.journals import journals_bp
from app.routes.admin import admin_bp
from app.routes.media import media_bp
from app.routes.quizzes import quizzes_bp
from app.routes.exercises import exercises_bp
from app.routes.schools import schools_bp

__all__ = [
    "auth_bp",
    "users_bp",
    "student_bp",
    "roles_bp",
    "classrooms_bp",
    "instructor_bp",
    "lessons_bp",
    "journals_bp",
    "admin_bp",
    "schools_bp",
    "media_bp",
    "quizzes_bp",
    "exercises_bp"
]
