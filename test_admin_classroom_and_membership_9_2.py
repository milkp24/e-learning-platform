import uuid
from app import create_app
from app.extensions import db
from app.models.user import User, UserProfile
from app.models.role import Role, Permission, RolePermission
from app.models.school import School, SchoolClassroom, SchoolUser, Student, ClassroomStudent
from app.models.admin import AuditLog
from flask_jwt_extended import create_access_token


def run_tests():
    app = create_app()
    client = app.test_client()

    with app.app_context():
        print("======================================================================")
        print("    9.2 CLASSROOM & MEMBERSHIP MANAGEMENT TEST SUITE                  ")
        print("======================================================================")

        # 0. Setup test users and schools
        super_admin = User.query.filter_by(email="superadmin@test.com").first()
        admin_user = User.query.filter_by(email="admin@test.com").first()
        student_user = User.query.filter_by(email="student@test.com").first()
        instructor_user = User.query.filter_by(email="instructor@test.com").first()

        assert super_admin is not None, "superadmin@test.com must exist"
        assert admin_user is not None, "admin@test.com must exist"
        assert student_user is not None, "student@test.com must exist"
        assert instructor_user is not None, "instructor@test.com must exist"

        # Create two test schools: School A and School B
        school_a = School.query.filter_by(code="TEST-SCH-A").first()
        if not school_a:
            school_a = School(
                name="Test School Alpha",
                code="TEST-SCH-A",
                contact_email="alpha@school.ac.th",
                status="active"
            )
            db.session.add(school_a)

        school_b = School.query.filter_by(code="TEST-SCH-B").first()
        if not school_b:
            school_b = School(
                name="Test School Beta",
                code="TEST-SCH-B",
                contact_email="beta@school.ac.th",
                status="active"
            )
            db.session.add(school_b)

        db.session.commit()

        sa_token = create_access_token(identity=str(super_admin.user_id))
        admin_token = create_access_token(identity=str(admin_user.user_id))
        student_token = create_access_token(identity=str(student_user.user_id))

        sa_headers = {"Authorization": f"Bearer {sa_token}", "Content-Type": "application/json"}
        admin_headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
        student_headers = {"Authorization": f"Bearer {student_token}", "Content-Type": "application/json"}

        # -------------------------------------------------------------
        # CLASSROOM MANAGEMENT TESTS
        # -------------------------------------------------------------
        print("\n--- Test 1: Create Classroom (POST /api/v1/admin/schools/<id>/classrooms) ---")
        cr_payload = {
            "classroom_name": "Math Grade 10-A",
            "grade_level": "Grade 10",
            "academic_year": "2567",
            "status": "active"
        }
        res_create = client.post(f"/api/v1/admin/schools/{school_a.school_id}/classrooms", headers=sa_headers, json=cr_payload)
        assert res_create.status_code == 201, f"Expected 201, got {res_create.status_code}: {res_create.get_json()}"
        cr_data = res_create.get_json()["classroom"]
        cr_id = cr_data["classroom_id"]
        assert cr_data["classroom_name"] == "Math Grade 10-A"
        assert cr_data["grade_level"] == "Grade 10"
        print(f"Test 1 Passed: Classroom created with id={cr_id}")

        print("\n--- Test 2: Duplicate Classroom Validation (409 Conflict) ---")
        res_dup = client.post(f"/api/v1/admin/schools/{school_a.school_id}/classrooms", headers=sa_headers, json=cr_payload)
        assert res_dup.status_code == 409, f"Expected 409 for duplicate classroom, got {res_dup.status_code}"
        print("Test 2 Passed: Duplicate classroom rejected with 409.")

        print("\n--- Test 3: List Classrooms (GET /api/v1/admin/schools/<id>/classrooms) ---")
        res_list = client.get(f"/api/v1/admin/schools/{school_a.school_id}/classrooms", headers=sa_headers)
        assert res_list.status_code == 200
        list_data = res_list.get_json()
        assert list_data["total"] >= 1
        assert any(c["classroom_id"] == cr_id for c in list_data["classrooms"])
        print(f"Test 3 Passed: Listed {list_data['total']} classrooms in School A.")

        print("\n--- Test 4: Update Classroom (PATCH /api/v1/admin/schools/<id>/classrooms/<id>) ---")
        patch_payload = {
            "classroom_name": "Advanced Math Grade 10-A",
            "grade_level": "Grade 10 Special"
        }
        res_patch = client.patch(f"/api/v1/admin/schools/{school_a.school_id}/classrooms/{cr_id}", headers=sa_headers, json=patch_payload)
        assert res_patch.status_code == 200
        updated_cr = res_patch.get_json()["classroom"]
        assert updated_cr["classroom_name"] == "Advanced Math Grade 10-A"
        assert updated_cr["grade_level"] == "Grade 10 Special"
        print("Test 4 Passed: Classroom updated successfully.")

        print("\n--- Test 5: IDOR Protection on Classroom URL Mismatch ---")
        # Attempt to access School A's classroom through School B's URL
        res_idor = client.patch(f"/api/v1/admin/schools/{school_b.school_id}/classrooms/{cr_id}", headers=sa_headers, json={"grade_level": "Hacked"})
        assert res_idor.status_code == 400, f"Expected 400 for cross-school classroom IDOR, got {res_idor.status_code}"
        print("Test 5 Passed: IDOR attack blocked with 400 Bad Request.")

        print("\n--- Test 6: Safety Rule on Delete (409 Conflict if students attached) ---")
        # Create a student profile and link to this classroom
        student_profile = Student.query.filter_by(user_id=student_user.user_id).first()
        if not student_profile:
            student_profile = Student(user_id=student_user.user_id, student_code="STD001")
            db.session.add(student_profile)
            db.session.flush()

        cs_link = ClassroomStudent.query.filter_by(classroom_id=uuid.UUID(cr_id), student_id=student_profile.student_id).first()
        if not cs_link:
            cs_link = ClassroomStudent(classroom_id=uuid.UUID(cr_id), student_id=student_profile.student_id)
            db.session.add(cs_link)
            db.session.commit()

        # Attempt to delete classroom with student attached
        res_del_conflict = client.delete(f"/api/v1/admin/schools/{school_a.school_id}/classrooms/{cr_id}", headers=sa_headers)
        assert res_del_conflict.status_code == 409, f"Expected 409 Conflict when students attached, got {res_del_conflict.status_code}"
        print("Test 6 Passed: Safety guard prevented deletion of classroom with students.")

        print("\n--- Test 7: Clean Delete Classroom (DELETE /api/v1/admin/schools/<id>/classrooms/<id>) ---")
        # Create a throwaway clean classroom in School A
        clean_cr = SchoolClassroom(school_id=school_a.school_id, classroom_name="Temporary Clean Room", status="active")
        db.session.add(clean_cr)
        db.session.commit()
        clean_id = str(clean_cr.classroom_id)

        res_del = client.delete(f"/api/v1/admin/schools/{school_a.school_id}/classrooms/{clean_id}", headers=sa_headers)
        assert res_del.status_code == 200
        # Verify gone from DB
        assert db.session.get(SchoolClassroom, uuid.UUID(clean_id)) is None
        print("Test 7 Passed: Clean classroom deleted from database.")

        # -------------------------------------------------------------
        # MEMBERSHIP MANAGEMENT TESTS
        # -------------------------------------------------------------
        print("\n--- Test 8: Available Users for School (GET /api/v1/admin/schools/available-users) ---")
        res_avail = client.get(f"/api/v1/admin/schools/available-users?school_id={school_a.school_id}", headers=sa_headers)
        assert res_avail.status_code == 200
        avail_users = res_avail.get_json()["users"]
        assert len(avail_users) >= 1
        print(f"Test 8 Passed: Available users queried successfully ({len(avail_users)} users found).")

        print("\n--- Test 9: Add Member to School (POST /api/v1/admin/schools/<id>/members) ---")
        # Ensure student is not already member of school_a
        SchoolUser.query.filter_by(school_id=school_a.school_id, user_id=student_user.user_id).delete()
        db.session.commit()

        # Check student's global role before adding
        student_global_roles_before = [r.role_name for r in student_user.roles]

        add_payload = {
            "user_id": str(student_user.user_id),
            "role": "student"
        }
        res_add = client.post(f"/api/v1/admin/schools/{school_a.school_id}/members", headers=sa_headers, json=add_payload)
        assert res_add.status_code == 201, f"Expected 201, got {res_add.status_code}: {res_add.get_json()}"
        mem_data = res_add.get_json()["member"]
        mem_id = mem_data["school_user_id"]
        assert mem_data["school_role"] == "student"
        print(f"Test 9 Passed: Member added to school with id={mem_id}")

        print("\n--- Test 10: Global Role Immutability Check ---")
        db.session.expire_all()
        student_global_roles_after = [r.role_name for r in student_user.roles]
        assert student_global_roles_before == student_global_roles_after, "Adding member to school MUST NOT alter global roles!"
        print(f"Test 10 Passed: Global roles preserved: {student_global_roles_after}")

        print("\n--- Test 11: Duplicate Member Validation (409 Conflict) ---")
        res_dup_mem = client.post(f"/api/v1/admin/schools/{school_a.school_id}/members", headers=sa_headers, json=add_payload)
        assert res_dup_mem.status_code == 409, f"Expected 409 for duplicate member, got {res_dup_mem.status_code}"
        print("Test 11 Passed: Duplicate membership rejected with 409.")

        print("\n--- Test 12: List School Members (GET /api/v1/admin/schools/<id>/members) ---")
        res_list_mem = client.get(f"/api/v1/admin/schools/{school_a.school_id}/members", headers=sa_headers)
        assert res_list_mem.status_code == 200
        mem_list = res_list_mem.get_json()["members"]
        assert any(m["school_user_id"] == mem_id for m in mem_list)
        print(f"Test 12 Passed: Listed {len(mem_list)} members in School A.")

        print("\n--- Test 13: Update School Member Role (PATCH /api/v1/admin/schools/<id>/members/<id>) ---")
        role_patch = {"role": "teacher"}
        res_role_patch = client.patch(f"/api/v1/admin/schools/{school_a.school_id}/members/{mem_id}", headers=sa_headers, json=role_patch)
        assert res_role_patch.status_code == 200
        assert res_role_patch.get_json()["member"]["school_role"] == "teacher"

        # Verify global role STILL untouched
        db.session.expire_all()
        student_user_refreshed = db.session.get(User, student_user.user_id)
        assert [r.role_name for r in student_user_refreshed.roles] == student_global_roles_before
        print("Test 13 Passed: School role changed to 'teacher' without altering global student role.")

        print("\n--- Test 14: IDOR Protection on School Member URL Mismatch ---")
        res_mem_idor = client.patch(f"/api/v1/admin/schools/{school_b.school_id}/members/{mem_id}", headers=sa_headers, json={"role": "admin"})
        assert res_mem_idor.status_code == 400, f"Expected 400 for cross-school member IDOR, got {res_mem_idor.status_code}"
        print("Test 14 Passed: IDOR cross-school member patch blocked with 400.")

        # -------------------------------------------------------------
        # SCOPED ADMIN & AUTHORIZATION TESTS
        # -------------------------------------------------------------
        print("\n--- Test 15: Scoped Admin Isolation (Admin of School A cannot access School B) ---")
        # Create a dedicated scoped admin user for School A
        scoped_admin_email = "scoped.admin.a@test.com"
        scoped_admin = User.query.filter_by(email=scoped_admin_email).first()
        if not scoped_admin:
            admin_role = Role.query.filter_by(role_name="admin").first()
            scoped_admin = User(
                email=scoped_admin_email,
                status="active"
            )
            scoped_admin.set_password("AdminPass1234!")
            scoped_admin.roles.append(admin_role)
            db.session.add(scoped_admin)
            db.session.flush()

        # Link scoped_admin exclusively to School A as admin
        SchoolUser.query.filter_by(user_id=scoped_admin.user_id).delete()
        sc_membership = SchoolUser(
            school_id=school_a.school_id,
            user_id=scoped_admin.user_id,
            role="admin"
        )
        db.session.add(sc_membership)
        db.session.commit()

        scoped_token = create_access_token(identity=str(scoped_admin.user_id))
        scoped_headers = {"Authorization": f"Bearer {scoped_token}", "Content-Type": "application/json"}

        # Scoped admin CAN access School A
        res_scoped_a = client.get(f"/api/v1/admin/schools/{school_a.school_id}/classrooms", headers=scoped_headers)
        assert res_scoped_a.status_code == 200, f"Scoped admin should access School A, got {res_scoped_a.status_code}"

        # Scoped admin CANNOT access School B (403 Forbidden)
        res_scoped_b_view = client.get(f"/api/v1/admin/schools/{school_b.school_id}/classrooms", headers=scoped_headers)
        assert res_scoped_b_view.status_code == 403, f"Scoped admin must be blocked from School B, got {res_scoped_b_view.status_code}"

        res_scoped_b_mem = client.post(f"/api/v1/admin/schools/{school_b.school_id}/members", headers=scoped_headers, json={"user_id": str(instructor_user.user_id), "role": "teacher"})
        assert res_scoped_b_mem.status_code == 403, f"Scoped admin must not add member to School B, got {res_scoped_b_mem.status_code}"

        print("Test 15 Passed: Scoped Admin strictly isolated to School A; School B access forbidden (403).")

        print("\n--- Test 16: Remove Member from School (DELETE /api/v1/admin/schools/<id>/members/<id>) ---")
        res_rem_mem = client.delete(f"/api/v1/admin/schools/{school_a.school_id}/members/{mem_id}", headers=sa_headers)
        assert res_rem_mem.status_code == 200
        # Verify SchoolUser is removed
        assert db.session.get(SchoolUser, uuid.UUID(mem_id)) is None
        # Verify User account is NOT deleted
        assert db.session.get(User, student_user.user_id) is not None
        print("Test 16 Passed: Member removed from school; User account preserved in database.")

        print("\n--- Test 17: Audit Log Verification ---")
        actions_to_check = [
            "CLASSROOM_CREATED",
            "CLASSROOM_UPDATED",
            "CLASSROOM_DELETED",
            "SCHOOL_MEMBER_ADDED",
            "SCHOOL_MEMBER_UPDATED",
            "SCHOOL_MEMBER_REMOVED"
        ]
        for act in actions_to_check:
            log = AuditLog.query.filter_by(action=act).first()
            assert log is not None, f"AuditLog for '{act}' must be present in database!"
            print(f"Verified AuditLog recorded for: {act}")

        print("Test 17 Passed: All required AuditLog actions successfully recorded in PostgreSQL.")

        # Cleanup student classroom link
        ClassroomStudent.query.filter_by(classroom_id=uuid.UUID(cr_id)).delete()
        SchoolClassroom.query.filter_by(classroom_id=uuid.UUID(cr_id)).delete()
        db.session.commit()

        print("\n======================================================================")
        print("       ALL 17 TESTS PASSED SUCCESSFULLY!                             ")
        print("======================================================================")


if __name__ == "__main__":
    run_tests()
