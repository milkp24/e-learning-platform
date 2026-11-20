# =====================================================================
# conftest.py: ตั้งค่ากลางของ pytest (โหลดอัตโนมัติก่อนเทสต์ทุกไฟล์)
#
# 1. เพิ่มโฟลเดอร์ backend เข้า sys.path เพื่อให้พิมพ์ `pytest` เฉย ๆ ได้
#    (ไม่ต้องใช้ `python -m pytest`)
# 2. บังคับให้ create_app() ที่ไม่ได้ส่ง config ใช้ฐานข้อมูลทดสอบ (elearning_test_db)
#    แทนฐานข้อมูลที่ใช้พัฒนา (elearning_db) เพื่อไม่ให้เทสต์ไปแก้ข้อมูลจริง
#    - แก้ที่ class Config โดยตรง เพราะ app/config.py โหลด .env แบบ override=True
#      การตั้ง environment variable จึงถูกค่าใน .env ทับ
#    - verify_test_database_safety จะหยุดทันทีถ้าชื่อฐานข้อมูลไม่มีคำว่า test
#    - เทสต์ที่ส่ง config ของตัวเอง (เช่น SQLite in-memory) ไม่ได้รับผลกระทบ
# 3. สร้างบัญชีพื้นฐานใน test DB ให้ครบ 4 บทบาท (super_admin, admin, instructor,
#    student) พร้อมโปรไฟล์ เพราะเทสต์หลายไฟล์ค้นหาบัญชีตามบทบาทแล้ว assert ว่าต้องมี
# =====================================================================
import os
import sys
import warnings

import pytest

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.config import Config, TestingPostgresConfig, verify_test_database_safety  # noqa: E402

_TEST_DB_URI = TestingPostgresConfig.SQLALCHEMY_DATABASE_URI
verify_test_database_safety(_TEST_DB_URI)
Config.SQLALCHEMY_DATABASE_URI = _TEST_DB_URI

# (บทบาท, อีเมล, ชื่อที่แสดง) ของบัญชีที่ต้องมีใน test DB
SEED_ACCOUNTS = [
    ("super_admin", "seed_superadmin@test.com", "Seed Super Admin"),
    ("admin", "seed_admin@test.com", "Seed Admin"),
    ("instructor", "seed_instructor@test.com", "Seed Instructor"),
    ("student", "seed_student@test.com", "Seed Student"),
]
SEED_PASSWORD = "SeedPass123!"


@pytest.fixture(scope="session", autouse=True)
def seed_test_database():
    """สร้างตาราง บทบาท และบัญชีพื้นฐานใน test DB (ทำครั้งเดียวต่อการรัน pytest)

    ถ้าต่อ PostgreSQL ไม่ได้ (เช่นไม่ได้เปิด Docker) จะแค่เตือนแล้วข้ามไป
    เทสต์ที่ใช้ SQLite in-memory จึงยังรันได้ตามปกติ
    """
    from sqlalchemy.exc import OperationalError
    from app import create_app
    from app.extensions import db
    from app.models.user import User, UserProfile
    from app.models.role import Role, seed_default_roles

    app = create_app(TestingPostgresConfig)
    try:
        with app.app_context():
            db.create_all()
            seed_default_roles()
            for role_name, email, display_name in SEED_ACCOUNTS:
                role = Role.query.filter_by(role_name=role_name).first()
                user = User.query.filter_by(email=email).first()
                if not user:
                    user = User(email=email, status="active")
                    user.set_password(SEED_PASSWORD)
                    db.session.add(user)
                user.status = "active"
                user.roles = [role]
                if not user.profile:
                    db.session.add(UserProfile(user=user, display_name=display_name))
            db.session.commit()
    except OperationalError as exc:
        warnings.warn(f"ต่อฐานข้อมูลทดสอบไม่ได้ ข้ามการเตรียมข้อมูล: {exc.orig}")
    yield
