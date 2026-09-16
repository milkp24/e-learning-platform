import uuid
from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.extensions import db
from app.models.user import User


def roles_required(*required_roles):
    """
    Decorator to enforce that the authenticated user possesses at least one
    of the specified roles. Roles are queried in real-time from the database
    to avoid stale permissions from tokens.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()

            try:
                user_uuid = uuid.UUID(user_id)
            except (ValueError, TypeError):
                return jsonify({
                    "error": "Unauthorized",
                    "message": "Invalid user token identity."
                }), 401

            user = db.session.get(User, user_uuid)
            if not user or user.status != "active":
                return jsonify({
                    "error": "Forbidden",
                    "message": "Account is inactive or does not exist."
                }), 403

            user_role_names = {r.role_name.lower() for r in user.roles}
            has_permission = any(req.lower() in user_role_names for req in required_roles)

            if not has_permission:
                return jsonify({
                    "error": "Forbidden",
                    "message": f"Access denied. Requires role: {', '.join(required_roles)}."
                }), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator
