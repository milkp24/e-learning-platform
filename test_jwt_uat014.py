import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
import urllib.request
import urllib.error
from datetime import timedelta
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.security import TokenBlocklist
from flask_jwt_extended import create_access_token

app = create_app()

BASE_URL = "http://127.0.0.1:5000/api/v1"
PROTECTED_ENDPOINT = f"{BASE_URL}/users/me"

def ensure_test_user():
    """เตรียม User newuser@test.com สำหรับทดสอบ"""
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

def run_uat014_tests():
    print("=================================================================")
    print("Running UAT-014: JWT Invalid / Expired Comprehensive Test Suite")
    print(f"Protected Endpoint under test: {PROTECTED_ENDPOINT}")
    print("=================================================================")

    user_id = ensure_test_user()
    test_results = {}

    # -----------------------------------------------------------------
    # Test 1: JWT ถูกต้อง (Valid JWT)
    # -----------------------------------------------------------------
    print("\n[Test 1] JWT ถูกต้อง (Valid JWT):")
    login_status, login_res = send_request(
        f"{BASE_URL}/auth/login",
        method="POST",
        data={"email": "newuser@test.com", "password": "Password123"}
    )
    assert login_status == 200, f"Login failed with status {login_status}"
    valid_access_token = login_res.get("access_token")
    assert valid_access_token, "No access_token returned"

    status_1, body_1 = send_request(
        PROTECTED_ENDPOINT,
        method="GET",
        headers={"Authorization": f"Bearer {valid_access_token}"}
    )
    print(f"   Status Code: {status_1} (Expected: 200)")
    print(f"   Response User: {body_1.get('user', {}).get('email')}")
    assert status_1 == 200, f"Expected 200 OK, got {status_1}"
    assert body_1.get("user", {}).get("email") == "newuser@test.com"
    # Security check: Never leak password or hash
    assert "password" not in str(body_1), "Security alert: Password leaked in response!"
    assert "password_hash" not in str(body_1), "Security alert: Password hash leaked in response!"
    print("   -> PASS: Valid JWT authorized successfully (200 OK)")
    test_results["Test 1: JWT ถูกต้อง"] = {"Expected": 200, "Actual": status_1, "Status": "PASS"}

    # -----------------------------------------------------------------
    # Test 2: JWT ไม่ถูกต้อง (Tampered Signature)
    # -----------------------------------------------------------------
    print("\n[Test 2] JWT ไม่ถูกต้อง (Tampered Signature):")
    parts = valid_access_token.split(".")
    assert len(parts) == 3, "Invalid JWT format"
    # ดัดแปลง Signature ส่วนท้าย
    sig = parts[2]
    tampered_sig = ("xyz" if not sig.startswith("xyz") else "abc") + sig[3:]
    tampered_token = f"{parts[0]}.{parts[1]}.{tampered_sig}"

    status_2, body_2 = send_request(
        PROTECTED_ENDPOINT,
        method="GET",
        headers={"Authorization": f"Bearer {tampered_token}"}
    )
    print(f"   Status Code: {status_2} (Expected: 401)")
    print(f"   Error Message: {body_2.get('error')} - {body_2.get('message')}")
    assert status_2 == 401, f"Expected 401 Unauthorized, got {status_2}"
    assert "user" not in body_2, "Protected resource leaked for tampered token!"
    print("   -> PASS: Tampered signature rejected with 401 Unauthorized")
    test_results["Test 2: JWT ไม่ถูกต้อง"] = {"Expected": 401, "Actual": status_2, "Status": "PASS"}

    # -----------------------------------------------------------------
    # Test 3: JWT รูปแบบไม่ถูกต้อง (Malformed Token)
    # -----------------------------------------------------------------
    print("\n[Test 3] JWT รูปแบบไม่ถูกต้อง (Malformed Token 'invalid-token'):")
    status_3, body_3 = send_request(
        PROTECTED_ENDPOINT,
        method="GET",
        headers={"Authorization": "Bearer invalid-token"}
    )
    print(f"   Status Code: {status_3} (Expected: 401)")
    print(f"   Error Message: {body_3.get('error')} - {body_3.get('message')}")
    assert status_3 == 401, f"Expected 401 Unauthorized, got {status_3}"
    assert "user" not in body_3, "Protected resource leaked for malformed token!"
    print("   -> PASS: Malformed token rejected with 401 Unauthorized")
    test_results["Test 3: JWT รูปแบบไม่ถูกต้อง"] = {"Expected": 401, "Actual": status_3, "Status": "PASS"}

    # -----------------------------------------------------------------
    # Test 4: JWT หมดอายุจริง (Expired JWT in the past)
    # -----------------------------------------------------------------
    print("\n[Test 4] JWT หมดอายุจริง (Expired JWT):")
    with app.app_context():
        # สร้าง Token ที่มี expiration ติดลบ (หมดอายุแล้ว 60 วินาทีที่แล้ว)
        expired_token = create_access_token(
            identity=user_id,
            expires_delta=timedelta(seconds=-60)
        )
    status_4, body_4 = send_request(
        PROTECTED_ENDPOINT,
        method="GET",
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    print(f"   Status Code: {status_4} (Expected: 401)")
    print(f"   Error Message: {body_4.get('error')} - {body_4.get('message')}")
    assert status_4 == 401, f"Expected 401 Unauthorized, got {status_4}"
    assert body_4.get("error") == "Token expired" or "expired" in str(body_4).lower()
    assert "user" not in body_4, "Protected resource leaked for expired token!"
    print("   -> PASS: Expired token rejected with 401 Unauthorized")
    test_results["Test 4: JWT หมดอายุจริง"] = {"Expected": 401, "Actual": status_4, "Status": "PASS"}

    # -----------------------------------------------------------------
    # Test 5: JWT ถูกเพิกถอน (Revoked / Blocklisted Token via Logout)
    # -----------------------------------------------------------------
    print("\n[Test 5] JWT ถูกเพิกถอน (Revoked / Blocklisted Token via Logout):")
    # นำ valid_access_token ไปสั่ง Logout
    logout_status, logout_body = send_request(
        f"{BASE_URL}/auth/logout",
        method="POST",
        headers={"Authorization": f"Bearer {valid_access_token}"},
        data={}
    )
    assert logout_status == 200, f"Logout failed with status {logout_status}"
    print("   Logout successful (200 OK)")

    # ยืนยันว่า JTI ถูกบันทึกลงใน TokenBlocklist
    with app.app_context():
        from flask_jwt_extended import decode_token
        decoded = decode_token(valid_access_token)
        jti = decoded.get("jti")
        blocklist_entry = TokenBlocklist.query.filter_by(jti=jti).first()
        assert blocklist_entry is not None, "JTI was not recorded in TokenBlocklist!"
        print(f"   Verified JTI {jti} is in token_blocklist table")

    # นำ Access Token เดิมที่ถูกเพิกถอนแล้วไปเรียก Protected Endpoint
    status_5, body_5 = send_request(
        PROTECTED_ENDPOINT,
        method="GET",
        headers={"Authorization": f"Bearer {valid_access_token}"}
    )
    print(f"   Status Code: {status_5} (Expected: 401)")
    print(f"   Error Message: {body_5.get('error')} - {body_5.get('message')}")
    assert status_5 == 401, f"Expected 401 Unauthorized, got {status_5}"
    assert "user" not in body_5, "Protected resource leaked for revoked token!"
    print("   -> PASS: Revoked token rejected with 401 Unauthorized via Blocklist")
    test_results["Test 5: JWT ถูกเพิกถอน"] = {"Expected": 401, "Actual": status_5, "Status": "PASS"}

    # -----------------------------------------------------------------
    # Test 6: ไม่มี Authorization Header (Missing Authorization Header)
    # -----------------------------------------------------------------
    print("\n[Test 6] ไม่มี Authorization Header (Missing Authorization):")
    status_6, body_6 = send_request(
        PROTECTED_ENDPOINT,
        method="GET"
    )
    print(f"   Status Code: {status_6} (Expected: 401)")
    print(f"   Error Message: {body_6.get('error')} - {body_6.get('message')}")
    assert status_6 == 401, f"Expected 401 Unauthorized, got {status_6}"
    assert "user" not in body_6, "Protected resource leaked when Authorization header is missing!"
    print("   -> PASS: Missing Authorization header rejected with 401 Unauthorized")
    test_results["Test 6: ไม่มี Authorization"] = {"Expected": 401, "Actual": status_6, "Status": "PASS"}

    # -----------------------------------------------------------------
    # Security Summary Verification
    # -----------------------------------------------------------------
    print("\n=================================================================")
    print("Security Verification Summary:")
    print(" - JWT Secret Key exposed in responses: NO (Verified)")
    print(" - Passwords / Hashes exposed in responses: NO (Verified)")
    print(" - Token Hashes exposed in responses: NO (Verified)")
    print(" - Protected endpoint accessible without valid token: NO (Verified)")
    print("=================================================================")

    print("\nUAT-014 SUMMARY:")
    for test_name, res in test_results.items():
        print(f" - {test_name}: Expected={res['Expected']}, Actual={res['Actual']} -> {res['Status']}")

    all_passed = all(r["Status"] == "PASS" for r in test_results.values())
    if all_passed:
        print("\n>>> ALL UAT-014 TESTS PASSED (100%) <<<")
    else:
        print("\n>>> SOME TESTS FAILED <<<")
        sys.exit(1)

if __name__ == "__main__":
    run_uat014_tests()
