import uuid
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.role import Role, Permission, RolePermission
from app.models.school import School, SchoolClassroom, SchoolUser
from app.models.admin import AuditLog
from flask_jwt_extended import create_access_token

def run_tests():
    app = create_app()
    client = app.test_client()

    with app.app_context():
        print("======================================================================")
        print("          TEST SUITE 9.2: ADMIN SCHOOL MANAGEMENT                    ")
        print("======================================================================")

        # 0. Setup Users & Roles
        super_admin = User.query.filter_by(email="superadmin@test.com").first()
        admin_user = User.query.filter_by(email="admin@test.com").first()
        student_user = User.query.filter_by(email="student@test.com").first()
        instructor_user = User.query.filter_by(email="instructor@test.com").first()

        assert super_admin is not None, "superadmin@test.com must exist"
        assert admin_user is not None, "admin@test.com must exist"
        assert student_user is not None, "student@test.com must exist"
        assert instructor_user is not None, "instructor@test.com must exist"

        admin_role = Role.query.filter_by(role_name="admin").first()
        sa_role = Role.query.filter_by(role_name="super_admin").first()

        # Ensure permissions exist
        perm_view = Permission.query.filter_by(permission_name="schools.view").first()
        perm_create = Permission.query.filter_by(permission_name="schools.create").first()
        perm_edit = Permission.query.filter_by(permission_name="schools.edit").first()
        perm_delete = Permission.query.filter_by(permission_name="schools.delete").first()

        assert perm_view is not None, "schools.view must exist"
        assert perm_create is not None, "schools.create must exist"
        assert perm_edit is not None, "schools.edit must exist"
        assert perm_delete is not None, "schools.delete must exist"

        # Ensure admin has view, create, edit
        for p in [perm_view, perm_create, perm_edit]:
            has_p = RolePermission.query.filter_by(role_id=admin_role.role_id, permission_id=p.permission_id).first()
            if not has_p:
                db.session.add(RolePermission(role_id=admin_role.role_id, permission_id=p.permission_id))
        # Ensure admin does NOT have schools.delete
        RolePermission.query.filter_by(role_id=admin_role.role_id, permission_id=perm_delete.permission_id).delete()
        db.session.commit()

        sa_token = create_access_token(identity=str(super_admin.user_id))
        admin_token = create_access_token(identity=str(admin_user.user_id))
        student_token = create_access_token(identity=str(student_user.user_id))
        instructor_token = create_access_token(identity=str(instructor_user.user_id))

        sa_headers = {"Authorization": f"Bearer {sa_token}", "Content-Type": "application/json"}
        admin_headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        student_headers = {"Authorization": f"Bearer {student_token}", "Content-Type": "application/json"}
        instructor_headers = {"Authorization": f"Bearer {instructor_token}", "Content-Type": "application/json"}

        # Clean up any leftover test schools
        test_codes = ["SCH-TEST-01", "SCH-TEST-02", "SCH-DUP", "SCH-CLEAN"]
        for c in test_codes:
            old_s = School.query.filter_by(code=c).first()
            if old_s:
                SchoolClassroom.query.filter_by(school_id=old_s.school_id).delete()
                SchoolUser.query.filter_by(school_id=old_s.school_id).delete()
                db.session.delete(old_s)
        db.session.commit()

        # ====================================================================
        # Test 1: Super Admin lists schools
        # ====================================================================
        print("\n=== Test 1: Super Admin lists schools ===")
        res1 = client.get("/api/v1/admin/schools", headers=sa_headers)
        assert res1.status_code == 200, f"Expected 200, got {res1.status_code}: {res1.get_json()}"
        data1 = res1.get_json()
        assert "schools" in data1 and "total" in data1
        print(f"Test 1 Passed: Super Admin retrieved {data1['total']} schools.")

        # ====================================================================
        # Test 2: Admin with schools.view lists schools
        # ====================================================================
        print("\n=== Test 2: Admin with schools.view lists schools ===")
        res2 = client.get("/api/v1/admin/schools", headers=admin_headers)
        assert res2.status_code == 200, f"Expected 200, got {res2.status_code}"
        print("Test 2 Passed: Admin with schools.view retrieved schools.")

        # ====================================================================
        # Test 3: Admin WITHOUT schools.view is rejected with 403
        # ====================================================================
        print("\n=== Test 3: Admin WITHOUT schools.view is rejected with 403 ===")
        RolePermission.query.filter_by(role_id=admin_role.role_id, permission_id=perm_view.permission_id).delete()
        db.session.commit()
        db.session.expire_all()

        res3 = client.get("/api/v1/admin/schools", headers=admin_headers)
        assert res3.status_code == 403, f"Expected 403, got {res3.status_code}: {res3.get_json()}"
        print("Test 3 Passed: Admin without schools.view blocked with 403.")

        # Restore schools.view for admin
        db.session.add(RolePermission(role_id=admin_role.role_id, permission_id=perm_view.permission_id))
        db.session.commit()
        db.session.expire_all()

        # ====================================================================
        # Test 4: Student and Instructor rejected from school management
        # ====================================================================
        print("\n=== Test 4: Non-admin rejected (403 for student/instructor, 401 for guest) ===")
        res_stu = client.get("/api/v1/admin/schools", headers=student_headers)
        assert res_stu.status_code == 403, f"Expected 403 for student, got {res_stu.status_code}"

        res_inst = client.get("/api/v1/admin/schools", headers=instructor_headers)
        assert res_inst.status_code == 403, f"Expected 403 for instructor, got {res_inst.status_code}"

        res_guest = client.get("/api/v1/admin/schools")
        assert res_guest.status_code == 401, f"Expected 401 for guest, got {res_guest.status_code}"
        print("Test 4 Passed: Non-admins blocked.")

        # ====================================================================
        # Test 5: Create School successfully by Super Admin
        # ====================================================================
        print("\n=== Test 5: Super Admin creates school successfully ===")
        payload_s1 = {
            "name": "Satit Wittayakhom School",
            "code": "SCH-TEST-01",
            "address": "123 Phaholyothin Rd, Bangkok 10400",
            "contact_email": "contact@satit.ac.th",
            "contact_phone": "02-123-4567",
            "status": "active"
        }
        res5 = client.post("/api/v1/admin/schools", headers=sa_headers, json=payload_s1)
        assert res5.status_code == 201, f"Expected 201, got {res5.status_code}: {res5.get_json()}"
        created_school = res5.get_json()["school"]
        assert created_school["name"] == payload_s1["name"]
        assert created_school["code"] == payload_s1["code"]
        assert created_school["status"] == "active"
        school_id_1 = created_school["school_id"]
        print(f"Test 5 Passed: Created school id={school_id_1}.")

        # ====================================================================
        # Test 6: Validation - Short name (< 2 chars) rejected with 400
        # ====================================================================
        print("\n=== Test 6: Short name rejected with 400 ===")
        res6 = client.post("/api/v1/admin/schools", headers=sa_headers, json={"name": "A"})
        assert res6.status_code == 400, f"Expected 400, got {res6.status_code}"
        print("Test 6 Passed: Short name rejected with 400.")

        # ====================================================================
        # Test 7: Validation - Duplicate school code rejected with 409
        # ====================================================================
        print("\n=== Test 7: Duplicate school code rejected with 409 ===")
        dup_payload = {
            "name": "Another School Name",
            "code": "SCH-TEST-01"  # same code as Test 5
        }
        res7 = client.post("/api/v1/admin/schools", headers=sa_headers, json=dup_payload)
        assert res7.status_code == 409, f"Expected 409, got {res7.status_code}: {res7.get_json()}"
        print("Test 7 Passed: Duplicate code rejected with 409.")

        # ====================================================================
        # Test 8: Validation - Invalid email rejected with 400
        # ====================================================================
        print("\n=== Test 8: Invalid email rejected with 400 ===")
        bad_email_payload = {
            "name": "School Bad Email",
            "code": "SCH-TEST-02",
            "contact_email": "not-an-email"
        }
        res8 = client.post("/api/v1/admin/schools", headers=sa_headers, json=bad_email_payload)
        assert res8.status_code == 400, f"Expected 400, got {res8.status_code}"
        print("Test 8 Passed: Invalid email rejected with 400.")

        # ====================================================================
        # Test 9: Get School Detail with classrooms list
        # ====================================================================
        print("\n=== Test 9: Get school detail with classrooms list ===")
        # Link a SchoolClassroom to test relationship
        with app.app_context():
            s_obj = db.session.get(School, uuid.UUID(school_id_1))
            cr = SchoolClassroom(
                school_id=s_obj.school_id,
                classroom_name="Math M.1/1",
                grade_level="M.1",
                academic_year="2026",
                status="active"
            )
            db.session.add(cr)
            # Also link an instructor/member
            su = SchoolUser(
                school_id=s_obj.school_id,
                user_id=instructor_user.user_id,
                role="instructor"
            )
            db.session.add(su)
            db.session.commit()

        res9 = client.get(f"/api/v1/admin/schools/{school_id_1}", headers=admin_headers)
        assert res9.status_code == 200, f"Expected 200, got {res9.status_code}"
        s_detail = res9.get_json()["school"]
        assert s_detail["classroom_count"] >= 1
        assert s_detail["member_count"] >= 1
        assert len(s_detail["classrooms"]) >= 1
        assert s_detail["classrooms"][0]["classroom_name"] == "Math M.1/1"
        print(f"Test 9 Passed: Detail includes {s_detail['classroom_count']} classrooms and {s_detail['member_count']} members.")

        # ====================================================================
        # Test 10: Edit School by Admin
        # ====================================================================
        print("\n=== Test 10: Admin edits school successfully ===")
        edit_payload = {
            "name": "Satit Wittayakhom Academy",
            "contact_phone": "02-999-8888",
            "status": "active"
        }
        res10 = client.patch(f"/api/v1/admin/schools/{school_id_1}", headers=admin_headers, json=edit_payload)
        assert res10.status_code == 200, f"Expected 200, got {res10.status_code}: {res10.get_json()}"
        updated_s = res10.get_json()["school"]
        assert updated_s["name"] == "Satit Wittayakhom Academy"
        assert updated_s["contact_phone"] == "02-999-8888"
        print("Test 10 Passed: School updated successfully.")

        # ====================================================================
        # Test 11: Safety Rule - School with classrooms CANNOT be deleted (409 Conflict)
        # ====================================================================
        print("\n=== Test 11: Safety rule blocks delete when classrooms exist (409) ===")
        res11 = client.delete(f"/api/v1/admin/schools/{school_id_1}", headers=sa_headers)
        assert res11.status_code == 409, f"Expected 409 Conflict, got {res11.status_code}: {res11.get_json()}"
        print("Test 11 Passed: Protected deletion blocked with 409.")

        # ====================================================================
        # Test 12: Admin WITHOUT schools.delete receives 403
        # ====================================================================
        print("\n=== Test 12: Admin without schools.delete permission receives 403 ===")
        res12 = client.delete(f"/api/v1/admin/schools/{school_id_1}", headers=admin_headers)
        assert res12.status_code == 403, f"Expected 403, got {res12.status_code}"
        print("Test 12 Passed: Admin without schools.delete blocked with 403.")

        # ====================================================================
        # Test 13: Clean School deletion succeeds for Super Admin
        # ====================================================================
        print("\n=== Test 13: Clean school deletion succeeds ===")
        # Create an empty school
        res_clean = client.post("/api/v1/admin/schools", headers=sa_headers, json={"name": "Clean School", "code": "SCH-CLEAN"})
        clean_id = res_clean.get_json()["school"]["school_id"]

        res13 = client.delete(f"/api/v1/admin/schools/{clean_id}", headers=sa_headers)
        assert res13.status_code == 200, f"Expected 200, got {res13.status_code}: {res13.get_json()}"

        # Verify not found in DB
        assert db.session.get(School, uuid.UUID(clean_id)) is None
        print("Test 13 Passed: Clean school deleted successfully.")

        # ====================================================================
        # Test 14: Non-existent school returns 404
        # ====================================================================
        print("\n=== Test 14: Non-existent school returns 404 ===")
        fake_id = str(uuid.uuid4())
        res14 = client.get(f"/api/v1/admin/schools/{fake_id}", headers=sa_headers)
        assert res14.status_code == 404
        print("Test 14 Passed: Non-existent school returned 404.")

        # ====================================================================
        # Test 15: Audit Log recorded for actions
        # ====================================================================
        print("\n=== Test 15: Audit Log verification ===")
        created_audits = AuditLog.query.filter_by(action="SCHOOL_CREATED", entity_type="school").order_by(AuditLog.created_at.desc()).all()
        assert len(created_audits) > 0, "SCHOOL_CREATED audit log must exist"

        updated_audits = AuditLog.query.filter_by(action="SCHOOL_UPDATED", entity_type="school").order_by(AuditLog.created_at.desc()).all()
        assert len(updated_audits) > 0, "SCHOOL_UPDATED audit log must exist"

        deleted_audits = AuditLog.query.filter_by(action="SCHOOL_DELETED_PERMANENT", entity_type="school").order_by(AuditLog.created_at.desc()).all()
        assert len(deleted_audits) > 0, "SCHOOL_DELETED_PERMANENT audit log must exist"

        # Verify no sensitive data
        for a in created_audits + updated_audits + deleted_audits:
            details_str = str(a.details)
            assert "password" not in details_str
            assert "token" not in details_str

        print("Test 15 Passed: Audit Logs verified for SCHOOL_CREATED, SCHOOL_UPDATED, SCHOOL_DELETED_PERMANENT.")

        # Clean up test school 1
        with app.app_context():
            s_obj = db.session.get(School, uuid.UUID(school_id_1))
            if s_obj:
                SchoolClassroom.query.filter_by(school_id=s_obj.school_id).delete()
                SchoolUser.query.filter_by(school_id=s_obj.school_id).delete()
                db.session.delete(s_obj)
                db.session.commit()

        print("\n======================================================================")
        print("       ALL 15 TESTS IN 9.2 SCHOOL SUITE PASSED SUCCESSFULLY!          ")
        print("======================================================================")

if __name__ == "__main__":
    run_tests()
