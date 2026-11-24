from flask import Flask, jsonify
from app.config import Config
from app.extensions import db, migrate, jwt, cors, limiter
import app.models  # Ensure models are registered for migrations
from app.models.role import seed_default_roles
from app.utils.errors import register_error_handlers
from app.routes import (
    auth_bp,
    users_bp,
    student_bp,
    roles_bp,
    classrooms_bp,
    instructor_bp,
    lessons_bp,
    journals_bp,
    admin_bp,
    schools_bp,
    media_bp,
    quizzes_bp,
    exercises_bp
)


def create_app(config_class=Config):
    """Application factory for the Flask app."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize Flask extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)
    cors.init_app(
        app,
        resources={r"/*": {"origins": app.config.get("CORS_ORIGINS", "*")}},
        supports_credentials=True
    )

    # ข้อ 39: ทุก Error ตอบเป็น JSON ภาษาไทย ไม่ส่งรายละเอียดทางเทคนิคให้ผู้ใช้
    register_error_handlers(app)

    # 429 Too Many Requests Error Handler (Rate Limiting)
    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({
            "error": "Too Many Requests",
            "message": "คำขอถี่เกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง"
        }), 429

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(roles_bp)
    app.register_blueprint(classrooms_bp)
    app.register_blueprint(instructor_bp)
    app.register_blueprint(lessons_bp)
    app.register_blueprint(journals_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(schools_bp)
    app.register_blueprint(media_bp)
    app.register_blueprint(quizzes_bp)
    app.register_blueprint(exercises_bp)

    # Ensure default roles (student, instructor, admin) are seeded
    with app.app_context():
        try:
            seed_default_roles()
        except Exception:
            pass

    # Base Health Check Route
    @app.route("/")
    def home():
        return {
            "message": "E-Learning API is running",
            "status": "healthy"
        }

    # Register Flask CLI Commands
    @app.cli.command("create-super-admin")
    def create_super_admin_command():
        """Secure CLI command to provision the first Super Admin."""
        from create_superadmin import provision_first_super_admin
        success = provision_first_super_admin()
        if not success:
            raise SystemExit(1)

    return app