"""course status: normalize legacy values

คอร์สมี 4 สถานะ: draft (ฉบับร่าง), pending (รอตรวจสอบ), active (เผยแพร่แล้ว), archived (เก็บถาวร)
แปลงค่าเดิมที่ไม่ใช้แล้วให้เป็นค่ามาตรฐาน:
  published    -> active
  under_review -> pending
  inactive     -> archived
ค่าอื่นที่ไม่รู้จัก -> draft (ไม่ให้คอร์สที่สถานะไม่ชัดเจนโผล่ให้ Guest เห็น)

Revision ID: c3a1d5e7f902
Revises: 0daef6a9a091
Create Date: 2026-11-20 15:20:00

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = 'c3a1d5e7f902'
down_revision = '0daef6a9a091'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("UPDATE courses SET status = 'active' WHERE status = 'published'")
    op.execute("UPDATE courses SET status = 'pending' WHERE status = 'under_review'")
    op.execute("UPDATE courses SET status = 'archived' WHERE status = 'inactive'")
    op.execute(
        "UPDATE courses SET status = 'draft' "
        "WHERE status NOT IN ('draft', 'pending', 'active', 'archived')"
    )


def downgrade():
    # แปลงกลับไม่ได้ เพราะไม่รู้ว่าค่าเดิมเป็นอะไร (ค่าใหม่ทุกค่ายังใช้กับโค้ดเดิมได้)
    pass
