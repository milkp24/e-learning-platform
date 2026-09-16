from app.routes.auth import auth_bp
from app.routes.users import users_bp
from app.routes.roles import roles_bp
from app.routes.classrooms import classrooms_bp
from app.routes.lessons import lessons_bp
from app.routes.journals import journals_bp
from app.routes.admin import admin_bp

__all__ = [
    "auth_bp",
    "users_bp",
    "roles_bp",
    "classrooms_bp",
    "lessons_bp",
    "journals_bp",
    "admin_bp"
]
