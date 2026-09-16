from flask import Flask
from app.config import Config
from app.extensions import db, migrate, jwt, cors
import app.models  # Ensure models are registered for migrations
from app.models.role import seed_default_roles
from app.routes import (
    auth_bp,
    users_bp,
    roles_bp,
    classrooms_bp,
    lessons_bp,
    journals_bp,
    admin_bp
)


def create_app(config_class=Config):
    """Application factory for the Flask app."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize Flask extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(
        app,
        resources={r"/*": {"origins": app.config.get("CORS_ORIGINS", "*")}},
        supports_credentials=True
    )

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(roles_bp)
    app.register_blueprint(classrooms_bp)
    app.register_blueprint(lessons_bp)
    app.register_blueprint(journals_bp)
    app.register_blueprint(admin_bp)

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

    return app