"""add interactive exercise fields to exercises and exercise_attempts

Revision ID: b0aa408519ab
Revises: 5f7b7fb34e1f
Create Date: 2026-10-05 13:24:41.393357

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b0aa408519ab'
down_revision = '5f7b7fb34e1f'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('exercise_attempts', schema=None) as batch_op:
        batch_op.add_column(sa.Column('time_spent', sa.Integer(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('xp_earned', sa.Integer(), nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('answers_data', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('feedback_data', sa.JSON(), nullable=True))

    with op.batch_alter_table('exercises', schema=None) as batch_op:
        batch_op.add_column(sa.Column('total_score', sa.Numeric(precision=5, scale=2), nullable=False, server_default='100.00'))
        batch_op.add_column(sa.Column('xp_reward', sa.Integer(), nullable=False, server_default='50'))
        batch_op.add_column(sa.Column('time_limit', sa.Integer(), nullable=True, server_default='0'))
        batch_op.add_column(sa.Column('max_attempts', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('status', sa.String(length=30), nullable=False, server_default='published'))
        batch_op.add_column(sa.Column('contents_data', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('activities_data', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('checklists_data', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))


def downgrade():
    with op.batch_alter_table('exercises', schema=None) as batch_op:
        batch_op.drop_column('updated_at')
        batch_op.drop_column('checklists_data')
        batch_op.drop_column('activities_data')
        batch_op.drop_column('contents_data')
        batch_op.drop_column('status')
        batch_op.drop_column('max_attempts')
        batch_op.drop_column('time_limit')
        batch_op.drop_column('xp_reward')
        batch_op.drop_column('total_score')

    with op.batch_alter_table('exercise_attempts', schema=None) as batch_op:
        batch_op.drop_column('feedback_data')
        batch_op.drop_column('answers_data')
        batch_op.drop_column('xp_earned')
        batch_op.drop_column('time_spent')
