import sys
import getpass
from app import create_app
from app.extensions import db
from app.models.user import User, UserProfile
from app.models.role import Role, seed_default_roles
from app.models.admin import AuditLog
from app.utils.validators import validate_email, validate_password


def provision_first_super_admin(email=None, password=None, display_name="Super Admin") -> bool:
    """
    Secure Provisioning Flow for the First Super Admin:
    1. Executed in a controlled administrative environment.
    2. Prompt for Email.
    3. Prompt for Password via hidden input (getpass).
    4. Confirm Password via hidden input (getpass).
    5. Validate Email and Password policy.
    6. Check if any Super Admin already exists in DB.
    7. If exists, ABORT and do not create duplicate.
    8. Create or update user.
    9. Assign role = super_admin.
    10. Assign full_admin (37 permissions).
    11. Record Audit Log (action: SUPER_ADMIN_CREATED).
    12. Strictly never log or expose password.
    """
    app = create_app()
    with app.app_context():
        # Ensure canonical roles and 37 permissions exist in database
        seed_default_roles()

        super_admin_role = Role.query.filter_by(role_name="super_admin").first()
        if not super_admin_role:
            print("Error: 'super_admin' role not found in database.")
            return False

        # Step 6: Check if a Super Admin already exists
        existing_super_admin = User.query.filter(User.roles.any(Role.role_name == "super_admin")).first()
        if existing_super_admin:
            print(f"Error: A Super Admin account already exists ({existing_super_admin.email}).")
            print("Secure provisioning permits only the first Super Admin to be created via CLI.")
            print("Additional Super Admins must be provisioned by an existing Super Admin.")
            return False

        # Step 2: Receive Email
        if not email:
            print("=== Secure Super Admin Provisioning ===")
            email = input("Enter Super Admin Email: ").strip()

        is_valid_email, email_err = validate_email(email)
        if not is_valid_email:
            print(f"Validation Error: {email_err}")
            return False

        # Step 3 & 4: Hidden Input Password & Confirm
        if not password:
            try:
                pwd1 = getpass.getpass("Enter Super Admin Password: ")
                pwd2 = getpass.getpass("Confirm Super Admin Password: ")
            except (EOFError, KeyboardInterrupt):
                print("\nOperation cancelled.")
                return False

            if pwd1 != pwd2:
                print("Error: Passwords do not match.")
                return False
            password = pwd1

        # Step 5: Validate Password
        is_valid_pwd, pwd_err = validate_password(password)
        if not is_valid_pwd:
            print(f"Validation Error: {pwd_err}")
            return False

        # Step 8: Create or update User
        user = User.query.filter_by(email=email.strip().lower()).first()
        if user:
            user.set_password(password)
            user.status = "active"
            if not user.has_role("super_admin"):
                user.roles.append(super_admin_role)
            if user.profile:
                user.profile.display_name = display_name or user.profile.display_name
            else:
                profile = UserProfile(user=user, display_name=display_name or "Super Admin")
                db.session.add(profile)
        else:
            user = User(email=email.strip().lower(), status="active")
            user.set_password(password)
            user.roles.append(super_admin_role)
            profile = UserProfile(user=user, display_name=display_name or "Super Admin")
            db.session.add(user)
            db.session.add(profile)

        db.session.flush()

        # Step 11: Record Audit Log
        audit = AuditLog(
            user_id=user.user_id,
            action="FIRST_SUPER_ADMIN_CREATED",
            entity_type="user",
            entity_id=user.user_id,
            details={
                "actor": "CLI_SECURE_PROVISIONING",
                "action": "FIRST_SUPER_ADMIN_CREATED",
                "target_email": user.email,
                "role": "super_admin",
                "permissions": "full_admin",
                "result": "SUCCESS"
            },
            ip_address="127.0.0.1"
        )
        db.session.add(audit)
        db.session.commit()

        print("========================================")
        print("First Super Admin Provisioned Successfully:")
        print(f"  User ID: {user.user_id}")
        print(f"  Email: {user.email}")
        print(f"  Role: super_admin (full_admin)")
        print(f"  Audit Log: Recorded (SUPER_ADMIN_CREATED)")
        print("========================================")
        return True


if __name__ == "__main__":
    success = provision_first_super_admin()
    sys.exit(0 if success else 1)
