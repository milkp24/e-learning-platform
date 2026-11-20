import sys
sys.stdout.reconfigure(encoding='utf-8')
import json
from app import create_app
from app.extensions import db
from app.models.user import User, UserProfile
from app.models.role import Role
from werkzeug.security import check_password_hash

app = create_app()

def cleanup():
    with app.app_context():
        u = User.query.filter_by(email="newuser@test.com").first()
        if u:
            db.session.delete(u)
            db.session.commit()
            print("Cleaned up existing newuser@test.com")

REGISTER_URL = "/api/v1/auth/register"


def test_api_http():
    # ใช้ Flask test client แทนการยิงไปที่เซิร์ฟเวอร์ที่รันอยู่ (127.0.0.1:5000)
    # เพื่อให้เทสต์ใช้ฐานข้อมูลทดสอบ และรันได้โดยไม่ต้องเปิดเซิร์ฟเวอร์
    # ลบผู้ใช้จากการรันครั้งก่อนออกก่อน ไม่อย่างนั้นจะได้ 409 (อีเมลซ้ำ)
    cleanup()
    client = app.test_client()
    print("\n--- Running Tests via Flask test client (POST /api/v1/auth/register) ---")
    
    # Test 1: สมัครสำเร็จ
    print("\n[Test 1] สมัครสำเร็จ (Registration Success):")
    payload = {
        "email": "newuser@test.com",
        "password": "Password123",
        "display_name": "New User"
    }
    res = client.post(REGISTER_URL, json=payload)
    assert res.status_code == 201, f"Expected 201, got {res.status_code}"
    body = res.get_json()
    print("Response status: 201 Created")
    print("Response body:", json.dumps(body, ensure_ascii=False, indent=2))
    
    assert body.get("message") == "สมัครสมาชิกสำเร็จ", f"Message mismatch: {body.get('message')}"
    user = body.get("user", {})
    assert user.get("email") == "newuser@test.com"
    assert user.get("display_name") == "New User"
    assert user.get("role") == "student"
    assert "password" not in user, "Password leaked in response!"
    assert "password_hash" not in user, "password_hash leaked in response!"
    print("-> Test 1 PASSED: สมัครสำเร็จได้ status 201 พร้อม Response รูปแบบที่กำหนด")

    # Test 2: Email ซ้ำ
    print("\n[Test 2] Email ซ้ำ (Duplicate Email):")
    res2 = client.post(REGISTER_URL, json=payload)
    assert res2.status_code == 409, f"Expected 409, got {res2.status_code}"
    err_body = res2.get_json()
    print(f"Response status: {res2.status_code} Conflict")
    print("Response body:", json.dumps(err_body, ensure_ascii=False, indent=2))
    assert "มีผู้ใช้งาน" in err_body.get("message", "") or "Conflict" in err_body.get("error", "")
    print("-> Test 2 PASSED: Email ซ้ำได้ status 409 Conflict พร้อมข้อความแจ้งเตือน")

    # Test 3: ข้อมูลไม่ครบ (ไม่ส่ง password)
    print("\n[Test 3] ข้อมูลไม่ครบ (Missing Password):")
    res3 = client.post(REGISTER_URL, json={"email": "another@test.com", "display_name": "No Password"})
    assert res3.status_code == 400, f"Expected 400, got {res3.status_code}"
    err_body = res3.get_json()
    print(f"Response status: {res3.status_code} Bad Request")
    print("Response body:", json.dumps(err_body, ensure_ascii=False, indent=2))
    print("-> Test 3 PASSED: ข้อมูลไม่ครบได้ status 400 Bad Request")

    # Test 4: ตรวจ Password ใน Database
    print("\n[Test 4] ตรวจสอบ Database & Password Hashing:")
    with app.app_context():
        db_user = User.query.filter_by(email="newuser@test.com").first()
        assert db_user is not None, "User not found in database!"
        assert db_user.password_hash is not None
        assert "Password123" not in db_user.password_hash, "Plain text password found in database!"
        assert check_password_hash(db_user.password_hash, "Password123") is True, "Password hash verification failed!"
        print(f"User in DB: email={db_user.email}, status={db_user.status}")
        print(f"Password Hash in DB: {db_user.password_hash[:30]}... (Total length: {len(db_user.password_hash)})")
        print(f"Roles in DB: {[r.role_name for r in db_user.roles]}")
        assert db_user.has_role("student"), "User does not have 'student' role!"
        print("-> Test 4 PASSED: Password ถูกแฮชอย่างปลอดภัย และมี Role student ครบถ้วน")

if __name__ == "__main__":
    test_api_http()
    print("\n=======================================================")
    print("ALL UAT-010 TESTS PASSED SUCCESSFULLY!")
    print("=======================================================")
