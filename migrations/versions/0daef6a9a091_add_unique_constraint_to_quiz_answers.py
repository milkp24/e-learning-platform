"""add unique constraint to quiz answers

Revision ID: 0daef6a9a091
Revises: b0aa408519ab
Create Date: 2026-10-07 16:20:27.942454

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0daef6a9a091'
down_revision = 'b0aa408519ab'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('quiz_answers', schema=None) as batch_op:
        batch_op.create_unique_constraint('uq_quiz_answers_attempt_question', ['attempt_id', 'question_id'])


def downgrade():
    with op.batch_alter_table('quiz_answers', schema=None) as batch_op:
        batch_op.drop_constraint('uq_quiz_answers_attempt_question', type_='unique')

