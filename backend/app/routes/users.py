import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.user import User
from app.utils.validators import validate_display_name

users_bp = Blueprint("users", __name__, url_prefix="/api/v1/users")


@users_bp.route("/me", methods=["GET"])
@jwt_required()
def get_my_profile():
    """Retrieve profile and account details for the authenticated user."""
    identity = get_jwt_identity()

    try:
        user_uuid = uuid.UUID(identity)
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid user identity."}), 400

    user = db.session.get(User, user_uuid)
    if not user:
        return jsonify({"error": "Not Found", "message": "User not found."}), 404

    return jsonify({
        "user": user.to_dict()
    }), 200


@users_bp.route("/me/profile", methods=["PUT"])
@jwt_required()
def update_my_profile():
    """Update profile information (display_name, profile_image) for authenticated user."""
    identity = get_jwt_identity()

    try:
        user_uuid = uuid.UUID(identity)
    except (ValueError, TypeError):
        return jsonify({"error": "Bad Request", "message": "Invalid user identity."}), 400

    user = db.session.get(User, user_uuid)
    if not user:
        return jsonify({"error": "Not Found", "message": "User not found."}), 404

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Bad Request", "message": "JSON body is required."}), 400

    if not user.profile:
        return jsonify({"error": "Not Found", "message": "User profile not found."}), 404

    # Update display_name if present
    if "display_name" in data:
        new_name = data.get("display_name")
        is_valid, err_msg = validate_display_name(new_name)
        if not is_valid:
            return jsonify({"error": "Validation Error", "message": err_msg}), 400
        user.profile.display_name = new_name.strip()

    # Update profile_image if present (can be string URL or null)
    if "profile_image" in data:
        new_image = data.get("profile_image")
        if new_image is not None and not isinstance(new_image, str):
            return jsonify({
                "error": "Validation Error",
                "message": "profile_image must be a string or null."
            }), 400
        user.profile.profile_image = new_image

    try:
        db.session.commit()
        return jsonify({
            "message": "Profile updated successfully.",
            "user": user.to_dict()
        }), 200
    except Exception:
        db.session.rollback()
        return jsonify({
            "error": "Internal Server Error",
            "message": "Failed to update profile."
        }), 500
