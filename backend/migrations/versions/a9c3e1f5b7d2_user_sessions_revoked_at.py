"""users.sessions_revoked_at (ข้อ 8: Super Admin ตั้งรหัสผ่านใหม่ให้ผู้อื่น แล้วบังคับ Login ใหม่)

Revision ID: a9c3e1f5b7d2
Revises: f2b8c4d1a937
Create Date: 2026-11-24 11:00:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a9c3e1f5b7d2'
down_revision = 'f2b8c4d1a937'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('sessions_revoked_at', sa.DateTime(timezone=True), nullable=True))


def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('sessions_revoked_at')
