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

def cleanup():
    with app.app_context():
        u = User.query.filter_by(email="newuser@test.com").first()
        if u:
            db.session.delete(u)
            db.session.commit()
            print("Cleaned up existing newuser@test.com")

def test_api_http():
    print("\n--- Running Tests via HTTP Endpoint (http://127.0.0.1:5000/api/v1/auth/register) ---")
    
    # Test 1: สมัครสำเร็จ
    print("\n[Test 1] สมัครสำเร็จ (Registration Success):")
    payload = {
        "email": "newuser@test.com",
        "password": "Password123",
        "display_name": "New User"
    }
    req = urllib.request.Request(
        "http://127.0.0.1:5000/api/v1/auth/register",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    res = urllib.request.urlopen(req)
    assert res.status == 201, f"Expected 201, got {res.status}"
    body = json.loads(res.read().decode("utf-8"))
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
    req2 = urllib.request.Request(
        "http://127.0.0.1:5000/api/v1/auth/register",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        urllib.request.urlopen(req2)
        assert False, "Should have failed with 409 Conflict"
    except urllib.error.HTTPError as err:
        assert err.code == 409, f"Expected 409, got {err.code}"
        err_body = json.loads(err.read().decode("utf-8"))
        print(f"Response status: {err.code} Conflict")
        print("Response body:", json.dumps(err_body, ensure_ascii=False, indent=2))
        assert "มีผู้ใช้งาน" in err_body.get("message", "") or "Conflict" in err_body.get("error", "")
        print("-> Test 2 PASSED: Email ซ้ำได้ status 409 Conflict พร้อมข้อความแจ้งเตือน")

    # Test 3: ข้อมูลไม่ครบ (ไม่ส่ง password)
    print("\n[Test 3] ข้อมูลไม่ครบ (Missing Password):")
    req3 = urllib.request.Request(
        "http://127.0.0.1:5000/api/v1/auth/register",
        data=json.dumps({"email": "another@test.com", "display_name": "No Password"}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        urllib.request.urlopen(req3)
        assert False, "Should have failed with 400 Bad Request"
    except urllib.error.HTTPError as err:
        assert err.code == 400, f"Expected 400, got {err.code}"
        err_body = json.loads(err.read().decode("utf-8"))
        print(f"Response status: {err.code} Bad Request")
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
    cleanup()
    test_api_http()
    print("\n=======================================================")
    print("ALL UAT-010 TESTS PASSED SUCCESSFULLY!")
    print("=======================================================")
