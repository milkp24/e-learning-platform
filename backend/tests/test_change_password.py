import json
import time
import urllib.request
import urllib.error
import sys
from datetime import datetime, timezone, timedelta

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:5000/api/v1"

def req(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data is not None else None
    r = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body_text = e.read().decode("utf-8")
        try:
            parsed = json.loads(body_text)
        except Exception:
            parsed = {"raw": body_text}
        return e.code, parsed

def login(email, password):
    status, body = req("/auth/login", "POST", {"email": email, "password": password})
    if status == 200:
        return body.get("access_token")
    return None

def run_all_tests():
    print("======================================================================")
    print("      CHANGE PASSWORD COMPREHENSIVE AUTOMATED TEST SUITE             ")
    print("======================================================================")
    results = {}

    test_user_email = f"chgpw_{int(time.time())}@test.com"
    initial_password = "InitialPassword123"
    new_password = "NewSecurePassword456"

    # Step 0: Create dedicated test user
    print("\n[Step 0] Creating test user...")
    s_reg, b_reg = req("/auth/register", "POST", {
        "email": test_user_email,
        "password": initial_password,
        "first_name": "ChangePw",
        "last_name": "Tester",
        "title": "นาย",
        "occupation": "นักศึกษา",
        "institution_name": "Test University",
        "institution_email": f"std_{int(time.time())}@test.ac.th"
    })
    assert s_reg == 201, f"Failed to register test user: {b_reg}"
    print(f"  -> Test user created: {test_user_email}")

    token = login(test_user_email, initial_password)
    assert token is not None, "Failed to login with initial password"

    # Case 2: รหัสผ่านเดิมผิด
    print("\n[Case 2] รหัสผ่านเดิมผิด (Wrong current password)")
    s_c2, b_c2 = req("/auth/change-password", "POST", {
        "current_password": "WrongPassword999",
        "new_password": new_password,
        "confirm_password": new_password
    }, token=token)
    c2_pass = (s_c2 == 400 and b_c2.get("message") == "รหัสผ่านปัจจุบันไม่ถูกต้อง")
    results["Case 2: รหัสผ่านเดิมผิด"] = "PASS" if c2_pass else f"FAIL ({s_c2}, {b_c2})"
    print(f"  Status: {s_c2}, Body: {b_c2} -> {results['Case 2: รหัสผ่านเดิมผิด']}")

    # Case 3: รหัสใหม่กับยืนยันไม่ตรงกัน
    print("\n[Case 3] รหัสใหม่กับยืนยันไม่ตรงกัน (New and confirm password mismatch)")
    s_c3, b_c3 = req("/auth/change-password", "POST", {
        "current_password": initial_password,
        "new_password": new_password,
        "confirm_password": "DifferentPassword789"
    }, token=token)
    c3_pass = (s_c3 == 400 and b_c3.get("message") == "รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน")
    results["Case 3: รหัสใหม่กับยืนยันไม่ตรงกัน"] = "PASS" if c3_pass else f"FAIL ({s_c3}, {b_c3})"
    print(f"  Status: {s_c3}, Body: {b_c3} -> {results['Case 3: รหัสใหม่กับยืนยันไม่ตรงกัน']}")

    # Case 4: รหัสใหม่เหมือนเดิม
    print("\n[Case 4] รหัสใหม่เหมือนเดิม (New password same as current password)")
    s_c4, b_c4 = req("/auth/change-password", "POST", {
        "current_password": initial_password,
        "new_password": initial_password,
        "confirm_password": initial_password
    }, token=token)
    c4_pass = (s_c4 == 400 and b_c4.get("message") == "รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านเดิม")
    results["Case 4: รหัสใหม่เหมือนเดิม"] = "PASS" if c4_pass else f"FAIL ({s_c4}, {b_c4})"
    print(f"  Status: {s_c4}, Body: {b_c4} -> {results['Case 4: รหัสใหม่เหมือนเดิม']}")

    # Case 4b: Password policy validation (short password < 6 chars)
    print("\n[Case 4b] Password Policy Check (< 6 chars)")
    s_c4b, b_c4b = req("/auth/change-password", "POST", {
        "current_password": initial_password,
        "new_password": "123",
        "confirm_password": "123"
    }, token=token)
    c4b_pass = (s_c4b == 400 and "at least 6 characters" in b_c4b.get("message", ""))
    results["Case 4b: Password Policy (<6 chars)"] = "PASS" if c4b_pass else f"FAIL ({s_c4b}, {b_c4b})"
    print(f"  Status: {s_c4b}, Body: {b_c4b} -> {results['Case 4b: Password Policy (<6 chars)']}")

    # Case 5: ไม่ได้ Login (No token)
    print("\n[Case 5] ไม่ได้ Login (Unauthenticated request)")
    s_c5, b_c5 = req("/auth/change-password", "POST", {
        "current_password": initial_password,
        "new_password": new_password,
        "confirm_password": new_password
    }, token=None)
    c5_pass = (s_c5 == 401)
    results["Case 5: ไม่ได้ Login"] = "PASS" if c5_pass else f"FAIL ({s_c5}, {b_c5})"
    print(f"  Status: {s_c5}, Body: {b_c5} -> {results['Case 5: ไม่ได้ Login']}")

    # Case 6: Token หมดอายุ / ไม่ถูกต้อง (Expired/Invalid Token)
    print("\n[Case 6] Token หมดอายุ/ไม่ถูกต้อง (Invalid/Expired Token)")
    fake_expired_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTYwMDAwMDAwMCwianRpIjoiZmFrZS1qdGkiLCJ0eXBlIjoiYWNjZXNzIiwic3ViIjoiZmFrZS11c2VyLWlkIiwibmJmIjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDB9.invalid_signature"
    s_c6, b_c6 = req("/auth/change-password", "POST", {
        "current_password": initial_password,
        "new_password": new_password,
        "confirm_password": new_password
    }, token=fake_expired_token)
    c6_pass = (s_c6 == 401)
    results["Case 6: Token หมดอายุ"] = "PASS" if c6_pass else f"FAIL ({s_c6}, {b_c6})"
    print(f"  Status: {s_c6}, Body: {b_c6} -> {results['Case 6: Token หมดอายุ']}")

    # Case 1: รหัสผ่านเดิมถูกต้อง + รหัสใหม่ถูกต้อง
    print("\n[Case 1] รหัสผ่านเดิมถูกต้อง + รหัสใหม่ถูกต้อง (Valid change password)")
    s_c1, b_c1 = req("/auth/change-password", "POST", {
        "current_password": initial_password,
        "new_password": new_password,
        "confirm_password": new_password
    }, token=token)
    c1_pass = (s_c1 == 200 and b_c1.get("message") == "เปลี่ยนรหัสผ่านสำเร็จ")
    results["Case 1: เปลี่ยนรหัสผ่านสำเร็จ"] = "PASS" if c1_pass else f"FAIL ({s_c1}, {b_c1})"
    print(f"  Status: {s_c1}, Body: {b_c1} -> {results['Case 1: เปลี่ยนรหัสผ่านสำเร็จ']}")

    # Security check: response does not contain password or sensitive info
    has_sensitive = any(k in b_c1 for k in ["password", "password_hash", "new_password", "current_password"])
    results["Security: No sensitive info in response"] = "PASS" if not has_sensitive else "FAIL"

    # Current session remains active check (no unexpected logout)
    s_me, b_me = req("/auth/me", "GET", token=token)
    results["Security: Current session remains active"] = "PASS" if s_me == 200 and b_me.get("user", {}).get("email") == test_user_email else f"FAIL ({s_me})"

    # Case 8: เปลี่ยนสำเร็จแล้ว Login ด้วยรหัสใหม่
    print("\n[Case 8] Login ด้วยรหัสผ่านใหม่ (Login with new password)")
    new_token = login(test_user_email, new_password)
    c8_pass = (new_token is not None)
    results["Case 8: Login ด้วยรหัสใหม่สำเร็จ"] = "PASS" if c8_pass else "FAIL"
    print(f"  New token received: {bool(new_token)} -> {results['Case 8: Login ด้วยรหัสใหม่สำเร็จ']}")

    # Case 9: Login ด้วยรหัสเก่า
    print("\n[Case 9] Login ด้วยรหัสเก่า (Login with old password must fail)")
    old_token = login(test_user_email, initial_password)
    c9_pass = (old_token is None)
    results["Case 9: Login ด้วยรหัสเก่าไม่สำเร็จ"] = "PASS" if c9_pass else "FAIL"
    print(f"  Old login rejected: {c9_pass} -> {results['Case 9: Login ด้วยรหัสเก่าไม่สำเร็จ']}")

    # Case 7: กดปุ่มเปลี่ยนรหัสผ่านหลายครั้ง (Duplicate request test)
    # ใช้ dedicated test user เพื่อไม่ให้ปะปนกับ Rate Limit bucket ของผู้ใช้อื่น
    print("\n[Case 7] กดปุ่มเปลี่ยนรหัสผ่านหลายครั้ง (Consecutive/Duplicate requests)")
    dup_email = f"dup_{int(time.time())}@test.com"
    req("/auth/register", "POST", {
        "email": dup_email,
        "password": "InitialPass123",
        "first_name": "Dup",
        "last_name": "Tester",
        "title": "นาย",
        "occupation": "นักศึกษา",
        "institution_name": "Test Univ",
        "institution_email": f"dup_{int(time.time())}@test.ac.th"
    })
    dup_tok = login(dup_email, "InitialPass123")
    s_dup1, b_dup1 = req("/auth/change-password", "POST", {
        "current_password": "InitialPass123",
        "new_password": "ThirdPassword789!",
        "confirm_password": "ThirdPassword789!"
    }, token=dup_tok)
    s_dup2, b_dup2 = req("/auth/change-password", "POST", {
        "current_password": "InitialPass123",
        "new_password": "ThirdPassword789!",
        "confirm_password": "ThirdPassword789!"
    }, token=dup_tok)
    dup_pass = (s_dup1 == 200 and s_dup2 == 400 and b_dup2.get("message") == "รหัสผ่านปัจจุบันไม่ถูกต้อง")
    results["Case 7: ป้องกัน Duplicate Request"] = "PASS" if dup_pass else f"FAIL ({s_dup1}, {s_dup2})"
    print(f"  Req 1: {s_dup1}, Req 2: {s_dup2} -> {results['Case 7: ป้องกัน Duplicate Request']}")

    # ======================================================================
    # FINDING #1 TESTS: Transaction Atomicity & Rollback Verification
    # ======================================================================
    print("\n[Finding #1 - Test A] Transaction Atomicity: Normal Case (History Persistence)")
    from app import create_app
    from app.extensions import db
    from app.models.user import User, PasswordHistory
    from unittest.mock import patch

    app = create_app()
    with app.app_context():
        # Verify history entry created for test_user_email
        u_record = User.query.filter_by(email=test_user_email).first()
        histories = PasswordHistory.query.filter_by(user_id=u_record.user_id).all()
        has_history = len(histories) >= 1
        results["Finding #1: Normal History Record Created"] = "PASS" if has_history else "FAIL"
        print(f"  PasswordHistory records count: {len(histories)} -> {results['Finding #1: Normal History Record Created']}")

    print("\n[Finding #1 - Test B] Transaction Atomicity: Rollback on Failure")
    # Simulate database failure during PasswordHistory creation via test_client
    atomic_email = f"atomic_{int(time.time())}@test.com"
    req("/auth/register", "POST", {
        "email": atomic_email,
        "password": "OriginalPass123!",
        "first_name": "Atomic",
        "last_name": "Tester",
        "title": "นาย",
        "occupation": "นักศึกษา",
        "institution_name": "Test Univ",
        "institution_email": f"atomic_{int(time.time())}@test.ac.th"
    })
    atomic_token = login(atomic_email, "OriginalPass123!")

    with app.app_context():
        u_atomic = User.query.filter_by(email=atomic_email).first()
        original_hash = u_atomic.password_hash
        histories_before = PasswordHistory.query.filter_by(user_id=u_atomic.user_id).count()

        client = app.test_client()
        with patch("app.routes.auth.PasswordHistory", side_effect=Exception("Simulated Database Error")):
            resp_sim = client.post("/api/v1/auth/change-password", headers={"Authorization": f"Bearer {atomic_token}"}, json={
                "current_password": "OriginalPass123!",
                "new_password": "FailedNewPass456!",
                "confirm_password": "FailedNewPass456!"
            })
            status_sim = resp_sim.status_code
            body_sim = resp_sim.get_json()

        db.session.refresh(u_atomic)
        histories_after = PasswordHistory.query.filter_by(user_id=u_atomic.user_id).count()
        hash_unchanged = (u_atomic.password_hash == original_hash)
        old_pw_works = u_atomic.check_password("OriginalPass123!")
        new_pw_fails = not u_atomic.check_password("FailedNewPass456!")
        no_corrupt_history = (histories_before == histories_after)
        is_500 = (status_sim == 500)

        atomicity_passed = is_500 and hash_unchanged and old_pw_works and new_pw_fails and no_corrupt_history
        results["Finding #1: Atomic Rollback on Failure"] = "PASS" if atomicity_passed else f"FAIL (HTTP={status_sim}, HashSame={hash_unchanged}, OldPwWorks={old_pw_works})"
        print(f"  Simulated Failure: HTTP {status_sim}, HashUnchanged={hash_unchanged}, OldPwWorks={old_pw_works} -> {results['Finding #1: Atomic Rollback on Failure']}")

    # ======================================================================
    # FINDING #2 TESTS: Rate Limiting Verification
    # ======================================================================
    print("\n[Finding #2 - Test 1 & 2] Rate Limiting: Within Limit & Exceeding Limit (HTTP 429)")
    rl_email = f"rl_{int(time.time())}@test.com"
    req("/auth/register", "POST", {
        "email": rl_email,
        "password": "RateLimitPass123!",
        "first_name": "RateLimit",
        "last_name": "Tester",
        "title": "นาย",
        "occupation": "นักศึกษา",
        "institution_name": "Test Univ",
        "institution_email": f"rl_{int(time.time())}@test.ac.th"
    })
    rl_token = login(rl_email, "RateLimitPass123!")

    rl_statuses = []
    last_rl_body = None
    for i in range(6):
        s_rl, b_rl = req("/auth/change-password", "POST", {
            "current_password": "WrongPassword999",
            "new_password": "NewSecurePass123!",
            "confirm_password": "NewSecurePass123!"
        }, token=rl_token)
        rl_statuses.append(s_rl)
        if i == 5:
            last_rl_body = b_rl

    # Requests 1-5 must be within limit (400 for bad password, NOT 429)
    within_limit_pass = all(s != 429 for s in rl_statuses[:5])
    results["Finding #2: Rate Limit - Requests Within Limit PASS"] = "PASS" if within_limit_pass else f"FAIL ({rl_statuses[:5]})"
    print(f"  Requests 1-5 statuses: {rl_statuses[:5]} -> {results['Finding #2: Rate Limit - Requests Within Limit PASS']}")

    # Request 6 must be 429 Too Many Requests
    exceed_limit_pass = (rl_statuses[5] == 429)
    results["Finding #2: Rate Limit - Exceeding Limit Returns 429"] = "PASS" if exceed_limit_pass else f"FAIL ({rl_statuses[5]})"
    print(f"  Request 6 status: {rl_statuses[5]} -> {results['Finding #2: Rate Limit - Exceeding Limit Returns 429']}")

    # Test 3: Rate limit window expiry
    print("\n[Finding #2 - Test 3] Rate Limiting: Window Expiration")
    with app.app_context():
        # Test short window with test_client using custom 1 per second limit
        test_app = create_app()
        test_app.config["RATELIMIT_CHANGE_PASSWORD"] = "1 per second"
        tc = test_app.test_client()
        r_w1 = tc.post("/api/v1/auth/change-password", headers={"Authorization": f"Bearer {rl_token}"}, json={
            "current_password": "RateLimitPass123!",
            "new_password": "WindowPass123!",
            "confirm_password": "WindowPass123!"
        })
        # Immediate 2nd request within 1s should be 429
        r_w2 = tc.post("/api/v1/auth/change-password", headers={"Authorization": f"Bearer {rl_token}"}, json={
            "current_password": "RateLimitPass123!",
            "new_password": "WindowPass123!",
            "confirm_password": "WindowPass123!"
        })
        # Wait for window to expire (1.2 seconds)
        time.sleep(1.2)
        r_w3 = tc.post("/api/v1/auth/change-password", headers={"Authorization": f"Bearer {rl_token}"}, json={
            "current_password": "RateLimitPass123!",
            "new_password": "WindowPass123!",
            "confirm_password": "WindowPass123!"
        })
        window_pass = (r_w2.status_code == 429 and r_w3.status_code != 429)
        results["Finding #2: Rate Limit - Window Expiry Allows Requests"] = "PASS" if window_pass else f"FAIL (Req2={r_w2.status_code}, Req3={r_w3.status_code})"
        print(f"  Window test: Req1={r_w1.status_code}, Req2={r_w2.status_code}, After 1.2s Req3={r_w3.status_code} -> {results['Finding #2: Rate Limit - Window Expiry Allows Requests']}")

    # Test 4: Verify 429 response contains NO sensitive data
    print("\n[Finding #2 - Test 4] Rate Limiting: No Sensitive Data in 429 Response")
    sensitive_keys = ["password", "password_hash", "jwt", "secret", "traceback", "sql"]
    body_str = json.dumps(last_rl_body).lower() if last_rl_body else ""
    leaks_sensitive = any(sk in body_str for sk in sensitive_keys)
    is_safe_429 = (not leaks_sensitive) and ("too many requests" in body_str or "ถี่เกินไป" in body_str or "error" in last_rl_body)
    results["Finding #2: Rate Limit - No Sensitive Data in 429"] = "PASS" if is_safe_429 else f"FAIL ({last_rl_body})"
    print(f"  429 Body: {last_rl_body} -> {results['Finding #2: Rate Limit - No Sensitive Data in 429']}")
    # Role-Based Verification: Every role can change their own password
    print("\n[Role Check] Testing All Roles (Student, Instructor, Admin, Super Admin)...")
    roles_test = [
        ("Student", "student@test.com", "Password123", "StdNewPass123!"),
        ("Instructor", "instructor@test.com", "Password123", "InstNewPass123!"),
        ("Admin", "qa_admin@test.com", "AdminPass123!", "AdminNewPass123!"),
        ("Super Admin", "superadmin@test.com", "SuperAdmin@123", "SuperAdminNewPass123!")
    ]

    for role_name, email, current_pw, next_pw in roles_test:
        r_token = login(email, current_pw)
        if not r_token:
            results[f"Role {role_name}: Change Password"] = "FAIL (Login failed)"
            continue

        s_r, b_r = req("/auth/change-password", "POST", {
            "current_password": current_pw,
            "new_password": next_pw,
            "confirm_password": next_pw
        }, token=r_token)

        success = (s_r == 200 and b_r.get("message") == "เปลี่ยนรหัสผ่านสำเร็จ")
        
        # Verify login with new password
        test_new_tok = login(email, next_pw)
        login_new_ok = (test_new_tok is not None)

        # Restore original password for test repeatability
        if login_new_ok:
            req("/auth/change-password", "POST", {
                "current_password": next_pw,
                "new_password": current_pw,
                "confirm_password": current_pw
            }, token=test_new_tok)

        role_pass = success and login_new_ok
        results[f"Role {role_name}: Change Password"] = "PASS" if role_pass else f"FAIL ({s_r})"
        print(f"  {role_name}: Change={s_r}, LoginNew={login_new_ok} -> {results[f'Role {role_name}: Change Password']}")

    # Clean up test users
    with app.app_context():
        for clean_email in [test_user_email, dup_email, atomic_email, rl_email]:
            u_clean = User.query.filter_by(email=clean_email).first()
            if u_clean:
                db.session.delete(u_clean)
        db.session.commit()
    print("\n  -> Cleaned up all test users.")

    print("\n======================================================================")
    print("                     TEST RESULTS SUMMARY                             ")
    print("======================================================================")
    all_passed = True
    for test_name, status in results.items():
        print(f"  [{status}] {test_name}")
        if not status.startswith("PASS"):
            all_passed = False

    print("======================================================================")
    print("ALL TESTS PASSED:", all_passed)
    print("======================================================================")
    return all_passed

if __name__ == "__main__":
    success = run_all_tests()
    if not success:
        sys.exit(1)
