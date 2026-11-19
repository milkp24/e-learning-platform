"""
test_role_service_4e.py: Phase 4E Dedicated Role & Permission Verification Suite
Validates:
1. RoleService business logic methods & RoleServiceError
2. Privilege Escalation Protection:
   - Admin CANNOT assign super_admin (403)
   - Admin CANNOT modify super_admin (403)
   - Admin CANNOT elevate themselves or others to super_admin (403)
   - Users cannot modify their own roles (403)
3. Super Admin operations allowed (201 / 200)
4. Dynamic Permission Matrix listing and updates with Audit Logging
5. HTTP Route Controller delegation via Flask test client
"""
import uuid
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.role import Role, Permission
from app.models.admin import AuditLog
from app.services.role_service import RoleService, RoleServiceError
from flask_jwt_extended import create_access_token


def run_phase_4e_tests():
    app = create_app()
    client = app.test_client()

    with app.app_context():
        print("======================================================================")
        print("       TEST SUITE 4E: ROLE & PERMISSION DOMAIN EXTRACTION             ")
        print("======================================================================")

        # 0. Setup Test Users
        super_admin = User.query.filter(User.roles.any(Role.role_name == "super_admin")).first()
        admin_user = User.query.filter(User.roles.any(Role.role_name == "admin")).first()
        student_user = User.query.filter(User.roles.any(Role.role_name == "student")).first()

        assert super_admin is not None, "Super admin user required"
        assert admin_user is not None, "Admin user required"
        assert student_user is not None, "Student user required"

        # Create a dedicated target user for role manipulation tests
        test_target = User.query.filter_by(email="target_4e@test.com").first()
        if not test_target:
            from app.models import UserProfile
            test_target = User(email="target_4e@test.com", status="active")
            test_target.set_password("pass123")
            st_role = Role.query.filter_by(role_name="student").first()
            test_target.roles.append(st_role)
            db.session.add(test_target)
            db.session.add(UserProfile(user=test_target, display_name="Target 4E"))
            db.session.commit()
        else:
            st_role = Role.query.filter_by(role_name="student").first()
            test_target.roles = [st_role]
            db.session.commit()

        target_id = str(test_target.user_id)

        # Tokens & Headers
        sa_token = create_access_token(identity=str(super_admin.user_id))
        admin_token = create_access_token(identity=str(admin_user.user_id))
        st_token = create_access_token(identity=str(student_user.user_id))
        target_token = create_access_token(identity=str(test_target.user_id))

        sa_headers = {"Authorization": f"Bearer {sa_token}", "Content-Type": "application/json"}
        admin_headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        st_headers = {"Authorization": f"Bearer {st_token}", "Content-Type": "application/json"}
        target_headers = {"Authorization": f"Bearer {target_token}", "Content-Type": "application/json"}

        # -----------------------------------------------------------------
        # TEST 1: RoleService.list_all_roles & HTTP GET /roles
        # -----------------------------------------------------------------
        print("\n[TEST 1] Testing Role Listing & Access Control:")
        # Service direct
        roles_dict = RoleService.list_all_roles()
        assert "roles" in roles_dict
        assert len(roles_dict["roles"]) >= 4
        print(f"   -> PASS: RoleService.list_all_roles retrieved {len(roles_dict['roles'])} roles")

        # Student blocked from GET /roles (403)
        resp_st = client.get("/api/v1/roles", headers=st_headers)
        assert resp_st.status_code == 403
        print("   -> PASS: Student blocked from GET /roles (403)")

        # Admin allowed to GET /roles (200)
        resp_adm = client.get("/api/v1/roles", headers=admin_headers)
        assert resp_adm.status_code == 200
        assert len(resp_adm.get_json()["roles"]) >= 4
        print("   -> PASS: Admin allowed to GET /roles (200)")

        # -----------------------------------------------------------------
        # TEST 2: User Roles Query & IDOR Protection
        # -----------------------------------------------------------------
        print("\n[TEST 2] Testing User Roles Query & IDOR Protection:")
        # Student viewing own roles -> 200
        resp_own = client.get(f"/api/v1/users/{target_id}/roles", headers=target_headers)
        assert resp_own.status_code == 200
        assert resp_own.get_json()["user_id"] == target_id
        print("   -> PASS: User viewing own roles succeeded (200)")

        # Other student viewing target's roles -> 403
        resp_cross = client.get(f"/api/v1/users/{target_id}/roles", headers=st_headers)
        assert resp_cross.status_code == 403
        print("   -> PASS: Cross-student viewing roles blocked (403 IDOR protection)")

        # Admin viewing target's roles -> 200
        resp_adm_view = client.get(f"/api/v1/users/{target_id}/roles", headers=admin_headers)
        assert resp_adm_view.status_code == 200
        print("   -> PASS: Admin viewing user's roles allowed (200)")

        # -----------------------------------------------------------------
        # TEST 3: Self-Modification Protection
        # -----------------------------------------------------------------
        print("\n[TEST 3] Testing Self-Modification Protection:")
        # Admin trying to assign role to self -> 403
        resp_self_add = client.post(f"/api/v1/users/{admin_user.user_id}/roles", headers=admin_headers, json={
            "role_name": "instructor"
        })
        assert resp_self_add.status_code == 403
        assert "cannot modify their own roles" in resp_self_add.get_json()["message"]
        print("   -> PASS: Admin assigning role to self blocked with 403")

        # Admin trying to remove role from self -> 403
        resp_self_rem = client.delete(f"/api/v1/users/{admin_user.user_id}/roles/admin", headers=admin_headers)
        assert resp_self_rem.status_code == 403
        assert "cannot modify their own roles" in resp_self_rem.get_json()["message"]
        print("   -> PASS: Admin removing role from self blocked with 403")

        # -----------------------------------------------------------------
        # TEST 4: CRITICAL SUPER ADMIN PROTECTION (Admin CANNOT touch super_admin)
        # -----------------------------------------------------------------
        print("\n[TEST 4] Testing Super Admin Privilege Escalation Protection:")
        # Normal Admin tries to assign super_admin -> MUST BE 403
        resp_adm_sa = client.post(f"/api/v1/users/{target_id}/roles", headers=admin_headers, json={
            "role_name": "super_admin"
        })
        assert resp_adm_sa.status_code == 403
        assert "Only a Super Admin can assign the super_admin role" in resp_adm_sa.get_json()["message"]
        print("   -> PASS: Normal Admin assigning super_admin role BLOCKED (403)")

        # Super Admin assigns super_admin role -> 201
        resp_sa_assign = client.post(f"/api/v1/users/{target_id}/roles", headers=sa_headers, json={
            "role_name": "super_admin"
        })
        assert resp_sa_assign.status_code == 201
        print("   -> PASS: Super Admin successfully assigned super_admin role (201)")

        # Normal Admin tries to remove super_admin from user -> MUST BE 403
        resp_adm_rem_sa = client.delete(f"/api/v1/users/{target_id}/roles/super_admin", headers=admin_headers)
        assert resp_adm_rem_sa.status_code == 403
        assert "Only a Super Admin can modify the super_admin role" in resp_adm_rem_sa.get_json()["message"]
        print("   -> PASS: Normal Admin removing super_admin role BLOCKED (403)")

        # Super Admin removes super_admin from user -> 200
        resp_sa_rem = client.delete(f"/api/v1/users/{target_id}/roles/super_admin", headers=sa_headers)
        assert resp_sa_rem.status_code == 200
        print("   -> PASS: Super Admin successfully removed super_admin role (200)")

        # -----------------------------------------------------------------
        # TEST 5: Duplicate Role & Minimum Role Constraint
        # -----------------------------------------------------------------
        print("\n[TEST 5] Testing Duplicate Role & Minimum Role Constraint:")
        # Target already has 'student' -> duplicate assign 409
        resp_dup = client.post(f"/api/v1/users/{target_id}/roles", headers=admin_headers, json={
            "role_name": "student"
        })
        assert resp_dup.status_code == 409
        print("   -> PASS: Duplicate role assignment rejected with 409 Conflict")

        # Target currently only has 'student' -> cannot remove only role (400)
        resp_rem_only = client.delete(f"/api/v1/users/{target_id}/roles/student", headers=admin_headers)
        assert resp_rem_only.status_code == 400
        assert "Cannot remove user's only role" in resp_rem_only.get_json()["message"]
        print("   -> PASS: Removing only role prevented with 400 Bad Request")

        # -----------------------------------------------------------------
        # TEST 6: Dynamic Permission Matrix & Audit Logging
        # -----------------------------------------------------------------
        print("\n[TEST 6] Testing Dynamic Permission Matrix & Super Admin Matrix Protection:")
        # GET Matrix
        resp_matrix = client.get("/api/v1/roles/matrix", headers=admin_headers)
        assert resp_matrix.status_code == 200
        assert "matrix" in resp_matrix.get_json()
        assert "admin" in resp_matrix.get_json()["matrix"]
        print("   -> PASS: GET /roles/matrix returned full dynamic matrix (200)")

        # Normal Admin tries to modify super_admin permissions -> 403
        resp_adm_mod_sa_perms = client.put("/api/v1/roles/super_admin/permissions", headers=admin_headers, json={
            "permissions": ["users.view"]
        })
        assert resp_adm_mod_sa_perms.status_code == 403
        assert "Only a Super Admin can modify super_admin permissions" in resp_adm_mod_sa_perms.get_json()["message"]
        print("   -> PASS: Normal Admin modifying super_admin permissions BLOCKED (403)")

        # Verify Audit Log was recorded
        audit = AuditLog.query.filter_by(action="SUPER_ADMIN_ROLE_ASSIGNED", entity_id=test_target.user_id).first()
        assert audit is not None, "AuditLog for SUPER_ADMIN_ROLE_ASSIGNED must exist"
        print(f"   -> PASS: AuditLog verified for SUPER_ADMIN_ROLE_ASSIGNED (Log ID: {audit.log_id})")

        print("\n======================================================================")
        print("          ALL 6 TESTS IN PHASE 4E SUITE PASSED SUCCESSFULLY!          ")
        print("======================================================================")


if __name__ == "__main__":
    run_phase_4e_tests()
