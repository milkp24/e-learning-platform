import uuid
from app import create_app
from app.extensions import db
from app.models.user import User, UserProfile
from sqlalchemy import text


def run_tests():
    app = create_app()
    client = app.test_client()

    print("========================================")
    print("Running Member Management Test Suite...")
    print("========================================")

    with app.app_context():
        # 1. Verify Tables
        tables = db.session.execute(text(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
        )).fetchall()
        table_names = [t[0] for t in tables]
        print("1. Tables in database:", table_names)
        assert "users" in table_names, "users table missing"
        assert "user_profiles" in table_names, "user_profiles table missing"
        assert "alembic_version" in table_names, "alembic_version table missing"
        print("   -> PASS: Tables verified.")

        # Clean test records if any
        test_email = "test.member@example.com"
        existing = User.query.filter_by(email=test_email).first()
        if existing:
            db.session.delete(existing)
            db.session.commit()

    # 2. Register API
    reg_payload = {
        "email": test_email,
        "password": "Password123!",
        "display_name": "Test User"
    }
    res = client.post("/api/v1/auth/register", json=reg_payload)
    print("\n2. Testing Register API:")
    print("   Status:", res.status_code)
    reg_data = res.get_json()
    print("   Response:", reg_data)
    assert res.status_code == 201, f"Expected 201, got {res.status_code}"
    assert "user" in reg_data
    assert reg_data["user"]["email"] == test_email
    assert reg_data["user"]["profile"]["display_name"] == "Test User"
    assert "password" not in reg_data["user"]
    assert "password_hash" not in reg_data["user"]
    user_id = reg_data["user"]["user_id"]

    # Verify in DB that password is NOT plain text
    with app.app_context():
        db_user = db.session.get(User, uuid.UUID(user_id))
        assert db_user.password_hash != "Password123!", "Password stored as plain text!"
        assert db_user.password_hash.startswith("scrypt:") or db_user.password_hash.startswith("pbkdf2:"), "Hash format invalid"
        assert db_user.check_password("Password123!") is True
        print("   -> PASS: Registration succeeded and password is securely hashed.")

    # Duplicate Register
    res_dup = client.post("/api/v1/auth/register", json=reg_payload)
    print("   Duplicate email status:", res_dup.status_code)
    assert res_dup.status_code == 409, f"Expected 409, got {res_dup.status_code}"
    print("   -> PASS: Duplicate email rejected.")

    # Validation Error (short password)
    res_short = client.post("/api/v1/auth/register", json={
        "email": "short@example.com",
        "password": "123",
        "display_name": "Short Pwd"
    })
    assert res_short.status_code == 400
    print("   -> PASS: Short password rejected.")

    # 3. Login API
    print("\n3. Testing Login API:")
    # Wrong password
    res_wrong = client.post("/api/v1/auth/login", json={
        "email": test_email,
        "password": "WrongPassword!"
    })
    assert res_wrong.status_code == 401
    print("   -> PASS: Wrong password rejected (401).")

    # Correct credentials
    res_login = client.post("/api/v1/auth/login", json={
        "email": test_email,
        "password": "Password123!"
    })
    assert res_login.status_code == 200
    login_data = res_login.get_json()
    assert "access_token" in login_data
    token = login_data["access_token"]
    print("   -> PASS: Successful login returned JWT token.")

    # Test Inactive User Login
    with app.app_context():
        db_user = db.session.get(User, uuid.UUID(user_id))
        db_user.status = "inactive"
        db.session.commit()

    res_inactive = client.post("/api/v1/auth/login", json={
        "email": test_email,
        "password": "Password123!"
    })
    assert res_inactive.status_code == 403, f"Expected 403 for inactive user, got {res_inactive.status_code}"
    print("   -> PASS: Inactive user login blocked (403).")

    # Restore active status
    with app.app_context():
        db_user = db.session.get(User, uuid.UUID(user_id))
        db_user.status = "active"
        db.session.commit()

    # Re-login to get fresh token
    res_login = client.post("/api/v1/auth/login", json={
        "email": test_email,
        "password": "Password123!"
    })
    token = res_login.get_json()["access_token"]
    auth_header = {"Authorization": f"Bearer {token}"}

    # 4. User Profile API
    print("\n4. Testing User Profile API:")
    # GET /api/v1/users/me (unauthenticated)
    res_no_auth = client.get("/api/v1/users/me")
    assert res_no_auth.status_code == 401
    print("   -> PASS: Unauthenticated GET /me blocked (401).")

    # GET /api/v1/users/me (authenticated)
    res_me = client.get("/api/v1/users/me", headers=auth_header)
    assert res_me.status_code == 200
    me_data = res_me.get_json()
    assert me_data["user"]["email"] == test_email
    assert me_data["user"]["profile"]["display_name"] == "Test User"
    print("   -> PASS: Authenticated GET /me retrieved profile.")

    # PUT /api/v1/users/me/profile
    res_update = client.put(
        "/api/v1/users/me/profile",
        headers=auth_header,
        json={
            "display_name": "Updated Name",
            "profile_image": "https://example.com/avatar.png"
        }
    )
    assert res_update.status_code == 200
    updated_data = res_update.get_json()
    assert updated_data["user"]["profile"]["display_name"] == "Updated Name"
    assert updated_data["user"]["profile"]["profile_image"] == "https://example.com/avatar.png"
    print("   -> PASS: Profile update PUT /me/profile succeeded.")

    # 5. Logout API
    print("\n5. Testing Logout API:")
    res_logout = client.post("/api/v1/auth/logout", headers=auth_header)
    assert res_logout.status_code == 200
    print("   -> PASS: POST /logout succeeded (200).")

    # Attempt to access protected route with revoked token
    res_revoked = client.get("/api/v1/users/me", headers=auth_header)
    assert res_revoked.status_code == 401
    revoked_body = res_revoked.get_json()
    assert revoked_body.get("error") == "Token revoked"
    print("   -> PASS: Revoked token blocked from protected route.")

    # Clean up test user
    with app.app_context():
        db_user = db.session.get(User, uuid.UUID(user_id))
        if db_user:
            db.session.delete(db_user)
            db.session.commit()
    print("\nCleaned up test data.")
    print("========================================")
    print("ALL TESTS PASSED SUCCESSFULLY!")
    print("========================================")


if __name__ == "__main__":
    run_tests()
