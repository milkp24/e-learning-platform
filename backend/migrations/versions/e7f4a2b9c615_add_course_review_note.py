"""add courses.review_note (เหตุผลที่ไม่อนุมัติการเผยแพร่)

Revision ID: e7f4a2b9c615
Revises: c3a1d5e7f902
Create Date: 2026-11-20 15:40:00

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e7f4a2b9c615'
down_revision = 'c3a1d5e7f902'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('courses', schema=None) as batch_op:
        batch_op.add_column(sa.Column('review_note', sa.Text(), nullable=True))


def downgrade():
    with op.batch_alter_table('courses', schema=None) as batch_op:
        batch_op.drop_column('review_note')
