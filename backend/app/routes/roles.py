import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from app.extensions import db
from app.models.user import User
from app.models.role import Role
from app.utils.decorators import roles_required

roles_bp = Blueprint("roles", __name__, url_prefix="/api/v1")


@roles_bp.route("/roles", methods=["GET"])
@roles_required("admin")
def list_all_roles():
    """List all available roles in the system. Restricted to Admins only."""
    roles = Role.query.order_by(Role.role_name).all()
    return jsonify({
        "roles": [r.to_dict() for r in roles]
    }), 200


@roles_bp.route("/users/<user_id>/roles", methods=["GET"])
@jwt_required()
def get_user_roles(user_id):
    """
    Get roles assigned to a user.
    Accessible only by the user themselves or by an Admin.
    """
    current_caller_id = get_jwt_identity()

    try:
        caller_uuid = uuid.UUID(current_caller_id)
        target_uuid = uuid.UUID(user_id)
    except (ValueError, TypeError):
        return jsonify({
            "error": "Bad Request",
            "message": "Invalid user ID format."
        }), 400

    caller = db.session.get(User, caller_uuid)
    if not caller or caller.status != "active":
        return jsonify({
            "error": "Forbidden",
            "message": "Caller account is inactive or not found."
        }), 403

    # Check permission: caller must be self or have admin role
    is_self = caller.user_id == target_uuid
    is_admin = caller.has_role("admin")

    if not is_self and not is_admin:
        return jsonify({
            "error": "Forbidden",
            "message": "Access denied: cannot view another user's roles."
        }), 403

    target_user = db.session.get(User, target_uuid)
    if not target_user:
        return jsonify({
            "error": "Not Found",
            "message": "User not found."
        }), 404

    return jsonify({
        "user_id": str(target_user.user_id),
        "roles": [r.to_dict() for r in target_user.roles]
    }), 200


@roles_bp.route("/users/<user_id>/roles", methods=["POST"])
@roles_required("admin")
def assign_role_to_user(user_id):
    """Assign an additional role to a user. Restricted to Admins only."""
    try:
        target_uuid = uuid.UUID(user_id)
    except (ValueError, TypeError):
        return jsonify({
            "error": "Bad Request",
            "message": "Invalid user ID format."
        }), 400

    target_user = db.session.get(User, target_uuid)
    if not target_user:
        return jsonify({
            "error": "Not Found",
            "message": "User not found."
        }), 404

    data = request.get_json(silent=True)
    if not data or not data.get("role_name"):
        return jsonify({
            "error": "Bad Request",
            "message": "role_name is required."
        }), 400

    role_name = str(data.get("role_name")).strip().lower()
    role = Role.query.filter(func.lower(Role.role_name) == role_name).first()

    if not role:
        return jsonify({
            "error": "Not Found",
            "message": f"Role '{role_name}' does not exist."
        }), 404

    # Prevent duplicate role assignment
    if target_user.has_role(role.role_name):
        return jsonify({
            "error": "Conflict",
            "message": f"User already has role '{role.role_name}'."
        }), 409

    target_user.roles.append(role)
    try:
        db.session.commit()
        return jsonify({
            "message": f"Role '{role.role_name}' assigned successfully.",
            "user_id": str(target_user.user_id),
            "roles": [r.to_dict() for r in target_user.roles]
        }), 201
    except Exception:
        db.session.rollback()
        return jsonify({
            "error": "Internal Server Error",
            "message": "Failed to assign role."
        }), 500


@roles_bp.route("/users/<user_id>/roles/<role_name>", methods=["DELETE"])
@roles_required("admin")
def remove_role_from_user(user_id, role_name):
    """Remove a role from a user. Restricted to Admins only."""
    try:
        target_uuid = uuid.UUID(user_id)
    except (ValueError, TypeError):
        return jsonify({
            "error": "Bad Request",
            "message": "Invalid user ID format."
        }), 400

    target_user = db.session.get(User, target_uuid)
    if not target_user:
        return jsonify({
            "error": "Not Found",
            "message": "User not found."
        }), 404

    clean_role_name = str(role_name).strip().lower()
    role = Role.query.filter(func.lower(Role.role_name) == clean_role_name).first()

    if not role or not target_user.has_role(clean_role_name):
        return jsonify({
            "error": "Not Found",
            "message": f"User does not have role '{clean_role_name}'."
        }), 404

    # User must retain at least one role
    if len(target_user.roles) <= 1:
        return jsonify({
            "error": "Bad Request",
            "message": "Cannot remove user's only role. A user must have at least one role."
        }), 400

    target_user.roles.remove(role)
    try:
        db.session.commit()
        return jsonify({
            "message": f"Role '{role.role_name}' removed successfully.",
            "user_id": str(target_user.user_id),
            "roles": [r.to_dict() for r in target_user.roles]
        }), 200
    except Exception:
        db.session.rollback()
        return jsonify({
            "error": "Internal Server Error",
            "message": "Failed to remove role."
        }), 500
