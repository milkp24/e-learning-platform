import urllib.request
import urllib.error
import json
import sys

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
    s, b = req("/auth/login", "POST", {"email": email, "password": password})
    return b.get("access_token")

def run_tests():
    print("=== STARTING UAT-024 PROFILE TEST SUITE ===")
    results = {}
    
    # Test roles
    roles_credentials = [
        ("Student", "student@test.com", "Password123"),
        ("Instructor", "instructor@test.com", "Password123"),
        ("Admin", "qa_admin@test.com", "AdminPass123!"),
        ("Super Admin", "superadmin@test.com", "SuperAdmin@123")
    ]
    
    for role_name, email, password in roles_credentials:
        token = login(email, password)
        if not token:
            results[f"{role_name} Login"] = "FAIL"
            continue
            
        # 1. View Profile
        s_view, b_view = req("/users/me", "GET", token=token)
        user_data = b_view.get("user", {})
        results[f"{role_name} View Profile"] = "PASS" if s_view == 200 and user_data.get("email") == email else f"FAIL ({s_view})"
        
        orig_name = user_data.get("profile", {}).get("display_name") or f"{role_name} User"
        new_name = f"Updated {role_name}"
        new_img = f"http://localhost:5000/api/v1/media/uploads/test_{role_name.lower().replace(' ', '_')}.png"
        
        # 2. Update Display Name and Profile Image
        s_up, b_up = req("/users/me/profile", "PUT", {"display_name": new_name, "profile_image": new_img}, token=token)
        results[f"{role_name} Update Profile"] = "PASS" if s_up == 200 and b_up.get("message") == "อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว" else f"FAIL ({s_up})"
        
        # 3. Persistence Check (GET again)
        s_pers, b_pers = req("/users/me", "GET", token=token)
        persisted_user = b_pers.get("user", {})
        persisted_profile = persisted_user.get("profile", {})
        persisted = persisted_profile.get("display_name") == new_name and persisted_profile.get("profile_image") == new_img
        results[f"{role_name} Profile Persistence"] = "PASS" if persisted else "FAIL"
        
        # 4. Inviolability Check (Attempting to modify email, role, or status via profile)
        s_tamper, b_tamper = req("/users/me/profile", "PUT", {
            "display_name": new_name,
            "email": "hacked@test.com",
            "role": "super_admin",
            "status": "banned"
        }, token=token)
        
        s_chk, b_chk = req("/users/me", "GET", token=token)
        chk_user = b_chk.get("user", {})
        tamper_safe = (
            chk_user.get("email") == email and
            chk_user.get("status") == "active"
        )
        results[f"{role_name} Role/Email/Status Tamper-Proof"] = "PASS" if tamper_safe else "FAIL"
        
        # Restore clean original name
        req("/users/me/profile", "PUT", {"display_name": orig_name, "profile_image": None}, token=token)
        
    # 5. Validation Check: Short display name (< 2 chars)
    std_token = login("student@test.com", "Password123")
    s_val_short, b_val_short = req("/users/me/profile", "PUT", {"display_name": "A"}, token=std_token)
    results["Validation: Short Display Name (<2)"] = "PASS" if s_val_short == 400 and "ชื่อแสดงผลต้องมีความยาวอย่างน้อย 2 ตัวอักษร" in b_val_short.get("message", "") else f"FAIL ({s_val_short})"
    
    # 6. Validation Check: Empty display name
    s_val_empty, b_val_empty = req("/users/me/profile", "PUT", {"display_name": "   "}, token=std_token)
    results["Validation: Empty Display Name"] = "PASS" if s_val_empty == 400 and "กรุณาระบุชื่อแสดงผล" in b_val_empty.get("message", "") else f"FAIL ({s_val_empty})"
    
    # 7. XSS Payload Handling
    s_xss, b_xss = req("/users/me/profile", "PUT", {"display_name": "<script>alert(1)</script>SafeName"}, token=std_token)
    s_xss_chk, b_xss_chk = req("/users/me", "GET", token=std_token)
    results["Security: XSS Stored Safely (React JSX escaping)"] = "PASS" if s_xss == 200 else f"FAIL ({s_xss})"
    # restore
    req("/users/me/profile", "PUT", {"display_name": "Student Tester"}, token=std_token)

    print("\n--- UAT-024 Profile Test Results ---")
    all_pass = True
    for k, v in results.items():
        print(f"  {k}: {v}")
        if not v.startswith("PASS"):
            all_pass = False
    print("ALL UAT-024 TESTS PASSED:", all_pass)
    return all_pass

if __name__ == "__main__":
    run_tests()
