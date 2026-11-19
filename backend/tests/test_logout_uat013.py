import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
import urllib.request
import urllib.error
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.security import RefreshToken, TokenBlocklist
from app.routes.auth import hash_token

app = create_app()

def ensure_test_user():
    """เตรียม User newuser@test.com สำหรับทดสอบ Logout"""
    with app.app_context():
        user = User.query.filter_by(email="newuser@test.com").first()
        if not user:
            user = User(email="newuser@test.com", status="active")
            user.set_password("Password123")
            db.session.add(user)
            db.session.commit()
        else:
            user.set_password("Password123")
            user.status = "active"
            db.session.commit()

def run_uat013_tests():
    print("=======================================================")
    print("Running UAT-013 Logout Comprehensive Test Suite")
    print("=======================================================")
    
    ensure_test_user()

    # -----------------------------------------------------------------
    # Step 1 & 2: Login successfully and confirm authenticated state
    # -----------------------------------------------------------------
    print("\n[Step 1 & 2] Login successfully & Confirm authenticated state:")
    login_req = urllib.request.Request(
        "http://127.0.0.1:5000/api/v1/auth/login",
        data=json.dumps({
            "email": "newuser@test.com",
            "password": "Password123"
        }).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    login_res = urllib.request.urlopen(login_req)
    assert login_res.status == 200, f"Login failed: {login_res.status}"
    
    login_body = json.loads(login_res.read().decode("utf-8"))
    access_token = login_body.get("access_token")
    refresh_token = login_body.get("refresh_token")
    
    assert access_token is not None, "Missing access_token!"
    assert refresh_token is not None, "Missing refresh_token!"
    print("   -> PASS: Login succeeded (HTTP 200), received access_token and refresh_token.")

    # -----------------------------------------------------------------
    # Step 3 & 4: Call Logout API and confirm HTTP 200 OK
    # -----------------------------------------------------------------
    print("\n[Step 3 & 4] Call Logout API & Confirm HTTP 200 OK:")
    logout_req = urllib.request.Request(
        "http://127.0.0.1:5000/api/v1/auth/logout",
        data=json.dumps({
            "refresh_token": refresh_token
        }).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {access_token}"
        }
    )
    logout_res = urllib.request.urlopen(logout_req)
    assert logout_res.status == 200, f"Expected 200, got {logout_res.status}"
    logout_body = json.loads(logout_res.read().decode("utf-8"))
    print("   Logout status:", logout_res.status)
    print("   Logout response:", json.dumps(logout_body, ensure_ascii=False))
    assert "ออกจากระบบสำเร็จ" in logout_body.get("message", "") or "Successfully" in logout_body.get("message", "")
    print("   -> PASS: Logout API returned success (HTTP 200).")

    # -----------------------------------------------------------------
    # Step 5: Confirm refresh token is revoked in Database (revoked_at is set, row preserved)
    # -----------------------------------------------------------------
    print("\n[Step 5] Confirm Refresh Token is revoked in Database:")
    token_hash = hash_token(refresh_token)
    with app.app_context():
        db_token = RefreshToken.query.filter_by(token_hash=token_hash).first()
        assert db_token is not None, "Refresh token record was deleted! Should preserve history."
        assert db_token.revoked_at is not None, "revoked_at was not set!"
        assert db_token.is_active() is False, "db_token.is_active() must be False!"
        print(f"   Refresh Token ID: {db_token.token_id}")
        print(f"   Created At: {db_token.created_at}")
        print(f"   Revoked At: {db_token.revoked_at}")
        print(f"   Is Active: {db_token.is_active()}")
        print("   -> PASS: Refresh token record preserved in DB and revoked_at timestamp set.")

    # -----------------------------------------------------------------
    # Step 6: Confirm HttpOnly refresh-token cookie is cleared
    # -----------------------------------------------------------------
    print("\n[Step 6] Confirm HttpOnly refresh-token cookie is cleared in response headers:")
    set_cookie_headers = logout_res.headers.get_all("Set-Cookie")
    print("   Set-Cookie headers:", set_cookie_headers)
    cookie_cleared = any(
        "refresh_token=" in h and ("Max-Age=0" in h or "expires=" in h.lower())
        for h in (set_cookie_headers or [])
    )
    assert cookie_cleared, "HttpOnly refresh_token cookie was not cleared in Set-Cookie!"
    print("   -> PASS: refresh_token cookie cleared via Set-Cookie header.")

    # -----------------------------------------------------------------
    # Step 7 & 8: Confirm access token is blocked in TokenBlocklist
    # -----------------------------------------------------------------
    print("\n[Step 7 & 8] Confirm Access Token is blocked from protected routes:")
    protected_req = urllib.request.Request(
        "http://127.0.0.1:5000/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    try:
        urllib.request.urlopen(protected_req)
        assert False, "Access token should have been revoked!"
    except urllib.error.HTTPError as err:
        assert err.code == 401, f"Expected 401, got {err.code}"
        print(f"   Protected route with revoked access token status: {err.code} Unauthorized")
        print("   -> PASS: Revoked Access Token is rejected immediately.")

    # -----------------------------------------------------------------
    # Step 9: Attempt to reuse the revoked refresh token -> Must be rejected (401)
    # -----------------------------------------------------------------
    print("\n[Step 9] Attempt to reuse revoked Refresh Token at /api/v1/auth/refresh:")
    refresh_req = urllib.request.Request(
        "http://127.0.0.1:5000/api/v1/auth/refresh",
        data=json.dumps({"refresh_token": refresh_token}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        urllib.request.urlopen(refresh_req)
        assert False, "Revoked refresh token should not be accepted!"
    except urllib.error.HTTPError as err:
        assert err.code == 401, f"Expected 401, got {err.code}"
        err_data = json.loads(err.read().decode("utf-8"))
        print(f"   Refresh with revoked token status: {err.code} Unauthorized")
        print("   Refresh response:", err_data)
        print("   -> PASS: Revoked Refresh Token reuse rejected with 401 Unauthorized.")

    # -----------------------------------------------------------------
    # Step 10: Confirm normal Login still works after Logout
    # -----------------------------------------------------------------
    print("\n[Step 10] Confirm normal Login still works after Logout:")
    relogin_req = urllib.request.Request(
        "http://127.0.0.1:5000/api/v1/auth/login",
        data=json.dumps({
            "email": "newuser@test.com",
            "password": "Password123"
        }).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    relogin_res = urllib.request.urlopen(relogin_req)
    assert relogin_res.status == 200
    relogin_body = json.loads(relogin_res.read().decode("utf-8"))
    assert relogin_body.get("access_token") is not None
    assert relogin_body.get("refresh_token") is not None
    print("   Relogin status:", relogin_res.status)
    print("   New access_token issued successfully.")
    print("   -> PASS: Normal Login functions properly after previous session Logout.")

    print("\n=======================================================")
    print("ALL 10 UAT-013 TEST CASES PASSED SUCCESSFULLY 100%!")
    print("=======================================================")

if __name__ == "__main__":
    run_uat013_tests()
