import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
import os
import urllib.request
import urllib.error
from datetime import timedelta
from app import create_app
from app.extensions import db
from app.models.user import User
from flask_jwt_extended import create_access_token

app = create_app()

BASE_URL = "http://127.0.0.1:5000/api/v1"
PROTECTED_ENDPOINT = f"{BASE_URL}/users/me"

def ensure_test_user():
    """เตรียม User newuser@test.com สำหรับทดสอบ Session Timeout"""
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
        return str(user.user_id)

def send_request(url, method="GET", headers=None, data=None):
    """ฟังก์ชันช่วยส่ง HTTP Request และดึง Status Code พร้อม Body"""
    req_headers = headers or {}
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode("utf-8")
        req_headers["Content-Type"] = "application/json"
    
    req = urllib.request.Request(url, data=req_data, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            status = resp.status
            body = resp.read().decode("utf-8")
            try:
                parsed = json.loads(body)
            except Exception:
                parsed = body
            return status, parsed
    except urllib.error.HTTPError as e:
        status = e.code
        body = e.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = body
        return status, parsed

def run_uat015_tests():
    print("=================================================================")
    print("Running UAT-015: Session Timeout Comprehensive Test Suite")
    print("=================================================================")

    user_id = ensure_test_user()
    test_results = {}

    # -----------------------------------------------------------------
    # Test 1: Login
    # -----------------------------------------------------------------
    print("\n[Test 1] Login (POST /api/v1/auth/login):")
    status_1, body_1 = send_request(
        f"{BASE_URL}/auth/login",
        method="POST",
        data={"email": "newuser@test.com", "password": "Password123"}
    )
    print(f"   Status Code: {status_1} (Expected: 200)")
    assert status_1 == 200, f"Expected 200, got {status_1}"
    access_token = body_1.get("access_token")
    assert access_token, "Missing access_token in login response"
    print("   -> PASS: Login succeeded (200 OK), Access Token received.")
    test_results["Test 1: Login"] = {"Expected": "200", "Actual": str(status_1), "Status": "PASS"}

    # -----------------------------------------------------------------
    # Test 2: Valid Access Token
    # -----------------------------------------------------------------
    print("\n[Test 2] Valid Access Token -> Protected API (GET /api/v1/users/me):")
    status_2, body_2 = send_request(
        PROTECTED_ENDPOINT,
        method="GET",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    print(f"   Status Code: {status_2} (Expected: 200)")
    assert status_2 == 200, f"Expected 200, got {status_2}"
    assert body_2.get("user", {}).get("email") == "newuser@test.com"
    print("   -> PASS: Valid Access Token accessed protected endpoint successfully (200 OK).")
    test_results["Test 2: Valid Access Token"] = {"Expected": "200", "Actual": str(status_2), "Status": "PASS"}

    # -----------------------------------------------------------------
    # Test 3: Expired Access Token
    # -----------------------------------------------------------------
    print("\n[Test 3] Expired Access Token -> Protected API (GET /api/v1/users/me):")
    with app.app_context():
        # สร้าง Access Token ที่หมดอายุในอดีต (หมดอายุจริง 60 วินาทีก่อน)
        expired_token = create_access_token(
            identity=user_id,
            expires_delta=timedelta(seconds=-60)
        )
    status_3, body_3 = send_request(
        PROTECTED_ENDPOINT,
        method="GET",
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    print(f"   Status Code: {status_3} (Expected: 401)")
    print(f"   Response Body: {body_3}")
    assert status_3 == 401, f"Expected 401 Unauthorized, got {status_3}"
    assert "user" not in body_3, "Protected data leaked for expired token!"
    print("   -> PASS: Expired token rejected with 401 Unauthorized.")
    test_results["Test 3: Expired Access Token"] = {"Expected": "401", "Actual": str(status_3), "Status": "PASS"}

    # -----------------------------------------------------------------
    # Test 4: Frontend Timeout Handling Verification
    # -----------------------------------------------------------------
    print("\n[Test 4] Frontend Timeout Handling:")
    # ตรวจสอบการทำงานของ Frontend Code ใน 3 ส่วน:
    # 1. api.js response interceptor handles 401 -> clears storage & redirects to /login?expired=true
    # 2. useAuthStore.js clearAuth() resets state & storage
    # 3. Login.jsx detects ?expired=true -> displays exact Thai error message
    frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
    api_js_path = os.path.join(frontend_dir, "src", "services", "api.js")
    store_js_path = os.path.join(frontend_dir, "src", "store", "useAuthStore.js")
    login_jsx_path = os.path.join(frontend_dir, "src", "pages", "Login.jsx")

    with open(api_js_path, "r", encoding="utf-8") as f:
        api_code = f.read()
    with open(store_js_path, "r", encoding="utf-8") as f:
        store_code = f.read()
    with open(login_jsx_path, "r", encoding="utf-8") as f:
        login_code = f.read()

    # ตรวจสอบว่า api.js จัดการ redirect ไป /login?expired=true และล้าง token
    assert "window.location.href = \"/login?expired=true\"" in api_code or "location.href = \"/login?expired=true\"" in api_code, "api.js must redirect to /login?expired=true on session timeout"
    assert "localStorage.removeItem(\"token\")" in api_code, "api.js must remove token from localStorage"
    assert "localStorage.removeItem(\"user\")" in api_code, "api.js must remove user from localStorage"
    print("   ✓ Verified api.js clears token & redirects to /login?expired=true on timeout")

    # ตรวจสอบว่า useAuthStore.js มีฟังก์ชัน clearAuth() ล้างข้อมูลครบถ้วน
    assert "clearAuth:" in store_code, "useAuthStore must provide clearAuth action"
    assert "isAuthenticated: false" in store_code, "clearAuth must reset isAuthenticated to false"
    print("   ✓ Verified useAuthStore.js has clearAuth resetting isAuthenticated to false")

    # ตรวจสอบว่า Login.jsx ตรวจจับ ?expired=true และแสดงข้อความที่กำหนด
    expected_msg = "เซสชันหมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่อีกครั้ง"
    assert expected_msg in login_code, f"Login.jsx must show exact message: '{expected_msg}'"
    print(f"   ✓ Verified Login.jsx displays message: '{expected_msg}'")

    print("   -> PASS: Frontend Timeout Handling verified completely.")
    test_results["Test 4: Frontend Timeout Handling"] = {"Expected": "Redirect Login + Msg", "Actual": "Verified", "Status": "PASS"}

    # -----------------------------------------------------------------
    # Test 5: Login ใหม่หลัง Session Timeout
    # -----------------------------------------------------------------
    print("\n[Test 5] Re-Login after Session Timeout:")
    status_5, body_5 = send_request(
        f"{BASE_URL}/auth/login",
        method="POST",
        data={"email": "newuser@test.com", "password": "Password123"}
    )
    print(f"   Status Code: {status_5} (Expected: 200)")
    assert status_5 == 200, f"Expected 200, got {status_5}"
    new_access_token = body_5.get("access_token")
    assert new_access_token, "Missing new access_token"

    # นำ Token ใหม่เข้าถึง Protected Endpoint
    status_5_protected, body_5_protected = send_request(
        PROTECTED_ENDPOINT,
        method="GET",
        headers={"Authorization": f"Bearer {new_access_token}"}
    )
    print(f"   Protected Access with New Token: {status_5_protected} (Expected: 200)")
    assert status_5_protected == 200, f"Expected 200, got {status_5_protected}"
    assert body_5_protected.get("user", {}).get("email") == "newuser@test.com"
    print("   -> PASS: Re-login succeeded (200 OK) and successfully accessed protected page again.")
    test_results["Test 5: Login ใหม่"] = {"Expected": "200", "Actual": str(status_5), "Status": "PASS"}

    # -----------------------------------------------------------------
    # Summary
    # -----------------------------------------------------------------
    print("\n=================================================================")
    print("UAT-015 TEST SUMMARY:")
    for test_name, res in test_results.items():
        print(f" - {test_name}: Expected={res['Expected']}, Actual={res['Actual']} -> {res['Status']}")

    all_passed = all(r["Status"] == "PASS" for r in test_results.values())
    if all_passed:
        print("\n>>> ALL UAT-015 TESTS PASSED (100%) <<<")
    else:
        print("\n>>> SOME TESTS FAILED <<<")
        sys.exit(1)

if __name__ == "__main__":
    run_uat015_tests()
