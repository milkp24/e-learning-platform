"""course visibility (ข้อ 1), journals.lesson_id (ข้อ 27), content_progress (ข้อ 24, 25)

Revision ID: f2b8c4d1a937
Revises: e7f4a2b9c615
Create Date: 2026-11-23 10:30:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'f2b8c4d1a937'
down_revision = 'e7f4a2b9c615'
branch_labels = None
depends_on = None


def upgrade():
    # ข้อ 1: การมองเห็นคอร์ส คอร์สเดิมทั้งหมดเป็นสาธารณะ (เหมือนพฤติกรรมเดิม)
    with op.batch_alter_table('courses', schema=None) as batch_op:
        batch_op.add_column(sa.Column('visibility', sa.String(length=20), nullable=False, server_default='public'))

    # ข้อ 27: บันทึกการเรียนรู้ผูกกับบทเรียน
    with op.batch_alter_table('journals', schema=None) as batch_op:
        batch_op.add_column(sa.Column('lesson_id', postgresql.UUID(as_uuid=True), nullable=True))
        batch_op.create_index(batch_op.f('ix_journals_lesson_id'), ['lesson_id'], unique=False)
        batch_op.create_foreign_key('fk_journals_lesson_id_lessons', 'lessons', ['lesson_id'], ['lesson_id'], ondelete='SET NULL')

    # ข้อ 24, 25: ความคืบหน้าการดูวิดีโอรายคลิป
    op.create_table(
        'content_progress',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('content_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('position_seconds', sa.Float(), nullable=False, server_default='0'),
        sa.Column('duration_seconds', sa.Float(), nullable=True),
        sa.Column('max_percent', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['content_id'], ['contents.content_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'content_id', name='uq_user_content_progress'),
    )
    op.create_index(op.f('ix_content_progress_user_id'), 'content_progress', ['user_id'], unique=False)
    op.create_index(op.f('ix_content_progress_content_id'), 'content_progress', ['content_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_content_progress_content_id'), table_name='content_progress')
    op.drop_index(op.f('ix_content_progress_user_id'), table_name='content_progress')
    op.drop_table('content_progress')

    with op.batch_alter_table('journals', schema=None) as batch_op:
        batch_op.drop_constraint('fk_journals_lesson_id_lessons', type_='foreignkey')
        batch_op.drop_index(batch_op.f('ix_journals_lesson_id'))
        batch_op.drop_column('lesson_id')

    with op.batch_alter_table('courses', schema=None) as batch_op:
        batch_op.drop_column('visibility')
