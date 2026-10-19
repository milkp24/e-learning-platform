"""rename classrooms to courses

Revision ID: 25785666d6bc
Revises: e5b7218cf30a
Create Date: 2026-09-21 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '25785666d6bc'
down_revision = 'e5b7218cf30a'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Rename physical table classrooms -> courses
    op.rename_table('classrooms', 'courses')

    # 2. Rename index on instructor_id if on PostgreSQL
    bind = op.get_bind()
    if bind and bind.dialect.name == 'postgresql':
        op.execute("ALTER INDEX IF EXISTS ix_classrooms_instructor_id RENAME TO ix_courses_instructor_id")


def downgrade():
    # 1. Revert index name on instructor_id if on PostgreSQL
    bind = op.get_bind()
    if bind and bind.dialect.name == 'postgresql':
        op.execute("ALTER INDEX IF EXISTS ix_courses_instructor_id RENAME TO ix_classrooms_instructor_id")

    # 2. Revert physical table courses -> classrooms
    op.rename_table('courses', 'classrooms')
