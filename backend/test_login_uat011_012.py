import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
import urllib.request
import urllib.error
from app import create_app
from app.extensions import db
from app.models.user import User, UserProfile
from app.models.role import Role
from werkzeug.security import check_password_hash

app = create_app()

def ensure_test_user():
    """เตรียม User newuser@test.com ด้วย Password123 ผ่าน Register API เพื่อทดสอบ End-to-End"""
    with app.app_context():
        user = User.query.filter_by(email="newuser@test.com").first()
        if not user:
            print("Registering newuser@test.com for testing...")
            req = urllib.request.Request(
                "http://127.0.0.1:5000/api/v1/auth/register",
                data=json.dumps({
                    "email": "newuser@test.com",
                    "password": "Password123",
                    "display_name": "New User"
                }).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            res = urllib.request.urlopen(req)
            assert res.status == 201
            print("Registered newuser@test.com successfully.")
        else:
            # รีเซ็ตรหัสผ่านให้เป็น Password123 แน่นอน
            user.set_password("Password123")
            user.status = "active"
            db.session.commit()
            print("Reset newuser@test.com password to Password123.")

def run_tests():
    print("=======================================================")
    print("Running UAT-011 & UAT-012 Login Integration Test Suite")
    print("=======================================================")
    
    ensure_test_user()
    
    # -----------------------------------------------------------------
    # Test 1: UAT-011 Login สำเร็จ (200 OK)
    # -----------------------------------------------------------------
    print("\n[Test 1] UAT-011: Login สำเร็จด้วยข้อมูลถูกต้อง:")
    payload_success = {
        "email": "newuser@test.com",
        "password": "Password123"
    }
    req1 = urllib.request.Request(
        "http://127.0.0.1:5000/api/v1/auth/login",
        data=json.dumps(payload_success).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    res1 = urllib.request.urlopen(req1)
    assert res1.status == 200, f"Expected 200, got {res1.status}"
    body1 = json.loads(res1.read().decode("utf-8"))
    
    print("   HTTP Status:", res1.status)
    print("   Response Body:", json.dumps(body1, ensure_ascii=False, indent=2))
    
    assert body1.get("message") == "เข้าสู่ระบบสำเร็จ"
    assert "access_token" in body1 and body1["access_token"]
    assert "refresh_token" in body1 and body1["refresh_token"]
    
    user_info = body1.get("user", {})
    assert user_info.get("email") == "newuser@test.com"
    assert user_info.get("role") == "student"
    assert "student" in user_info.get("roles", [])
    assert user_info.get("display_name") == "New User"
    
    # Security check: ไม่มี password หรือ password_hash หลุดออกมา
    assert "password" not in body1 and "password" not in user_info, "Security issue: password in response!"
    assert "password_hash" not in body1 and "password_hash" not in user_info, "Security issue: password_hash in response!"
    
    print("   -> PASS: UAT-011 Login สำเร็จ ได้รับ access_token, refresh_token, และ Role student ครบถ้วน")

    # -----------------------------------------------------------------
    # Test 2: UAT-012 Password ผิด (401 Unauthorized)
    # -----------------------------------------------------------------
    print("\n[Test 2] UAT-012: Login ไม่สำเร็จด้วย Password ผิด:")
    payload_wrong_pwd = {
        "email": "newuser@test.com",
        "password": "WrongPassword123"
    }
    req2 = urllib.request.Request(
        "http://127.0.0.1:5000/api/v1/auth/login",
        data=json.dumps(payload_wrong_pwd).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        urllib.request.urlopen(req2)
        assert False, "Should have failed with 401 Unauthorized"
    except urllib.error.HTTPError as err:
        assert err.code == 401, f"Expected 401, got {err.code}"
        err_body = json.loads(err.read().decode("utf-8"))
        print(f"   HTTP Status: {err.code} Unauthorized")
        print("   Response Body:", json.dumps(err_body, ensure_ascii=False, indent=2))
        
        assert err_body.get("message") == "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
        assert "access_token" not in err_body
        assert "refresh_token" not in err_body
        assert "user" not in err_body
        print("   -> PASS: UAT-012 รหัสผ่านผิด ได้รับ 401 Unauthorized พร้อมข้อความกลาง และไม่มี Token")

    # -----------------------------------------------------------------
    # Test 3: Email ไม่มีในระบบ (401 Unauthorized)
    # -----------------------------------------------------------------
    print("\n[Test 3] Email ไม่มีในระบบ (Unknown Email):")
    payload_unknown = {
        "email": "notfound@test.com",
        "password": "Password123"
    }
    req3 = urllib.request.Request(
        "http://127.0.0.1:5000/api/v1/auth/login",
        data=json.dumps(payload_unknown).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        urllib.request.urlopen(req3)
        assert False, "Should have failed with 401 Unauthorized"
    except urllib.error.HTTPError as err:
        assert err.code == 401, f"Expected 401, got {err.code}"
        err_body = json.loads(err.read().decode("utf-8"))
        print(f"   HTTP Status: {err.code} Unauthorized")
        print("   Response Body:", json.dumps(err_body, ensure_ascii=False, indent=2))
        
        # ต้องใช้ข้อความกลางเดียวกัน เพื่อไม่เปิดเผยว่ามีอีเมลในระบบหรือไม่
        assert err_body.get("message") == "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
        print("   -> PASS: อีเมลไม่พบ ได้รับ 401 Unauthorized และใช้ข้อความกลางเดียวกัน")

    # -----------------------------------------------------------------
    # Test 4: ข้อมูลไม่ครบ (400 Bad Request)
    # -----------------------------------------------------------------
    print("\n[Test 4] ข้อมูลไม่ครบ (Missing Data):")
    req4 = urllib.request.Request(
        "http://127.0.0.1:5000/api/v1/auth/login",
        data=json.dumps({"email": "newuser@test.com"}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        urllib.request.urlopen(req4)
        assert False, "Should have failed with 400 Bad Request"
    except urllib.error.HTTPError as err:
        assert err.code == 400, f"Expected 400, got {err.code}"
        err_body = json.loads(err.read().decode("utf-8"))
        print(f"   HTTP Status: {err.code} Bad Request")
        print("   Response Body:", json.dumps(err_body, ensure_ascii=False, indent=2))
        print("   -> PASS: ข้อมูลไม่ครบ ได้รับ 400 Bad Request")

    # -----------------------------------------------------------------
    # Test 5: Password Hash Verification (werkzeug.security)
    # -----------------------------------------------------------------
    print("\n[Test 5] ตรวจสอบ Password Hashing และ Database State:")
    with app.app_context():
        u = User.query.filter_by(email="newuser@test.com").first()
        assert u is not None
        assert u.password_hash is not None
        assert "Password123" not in u.password_hash, "Plain text password found in DB!"
        assert check_password_hash(u.password_hash, "Password123") is True
        assert check_password_hash(u.password_hash, "WrongPassword123") is False
        print("   User Password Hash:", u.password_hash[:30], f"... (length: {len(u.password_hash)})")
        print("   u.check_password('Password123'):", u.check_password("Password123"))
        print("   u.check_password('WrongPassword123'):", u.check_password("WrongPassword123"))
        print("   -> PASS: Password Hash ตรวจสอบความถูกต้องสมบูรณ์")

    print("\n=======================================================")
    print("ALL UAT-011 & UAT-012 TESTS PASSED SUCCESSFULLY 100%!")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()
