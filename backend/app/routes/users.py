from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.utils.decorators import get_current_user
from app.services.user_service import UserService, UserServiceError

users_bp = Blueprint("users", __name__, url_prefix="/api/v1/users")
student_bp = Blueprint("student", __name__, url_prefix="/api/v1/student")


@users_bp.route("/me", methods=["GET"])
@jwt_required()
def get_my_profile():
    """Retrieve profile and account details for the authenticated user."""
    user = get_current_user()
    try:
        res = UserService.get_my_profile(user)
        return jsonify(res), 200
    except UserServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code


@users_bp.route("/me/profile", methods=["PUT"])
@jwt_required()
def update_my_profile():
    """Update profile information (display_name, profile_image) for authenticated user."""
    user = get_current_user()
    data = request.get_json(silent=True)
    try:
        res = UserService.update_my_profile(user, data)
        return jsonify(res), 200
    except UserServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code


# =====================================================================
# Student Dashboard API (Real Database Data 100%)
# =====================================================================

def get_student_dashboard_data():
    """ดึงข้อมูล Dashboard สำหรับผู้เรียน (Student Dashboard) จากฐานข้อมูลจริง 100%"""
    user = get_current_user()
    try:
        res = UserService.get_student_dashboard(user)
        return jsonify(res), 200
    except UserServiceError as e:
        return jsonify({"error": e.error, "message": e.message}), e.status_code


@student_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def student_dashboard():
    return get_student_dashboard_data()


@users_bp.route("/me/dashboard", methods=["GET"])
@jwt_required()
def user_me_dashboard():
    return get_student_dashboard_data()


