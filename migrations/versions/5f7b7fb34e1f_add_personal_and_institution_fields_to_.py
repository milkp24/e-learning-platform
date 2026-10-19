"""add personal and institution fields to user_profiles

Revision ID: 5f7b7fb34e1f
Revises: 4d8f1e29a35c
Create Date: 2026-09-21 21:39:15.402012

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '5f7b7fb34e1f'
down_revision = '4d8f1e29a35c'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('user_profiles', schema=None) as batch_op:
        batch_op.add_column(sa.Column('title', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('first_name', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('last_name', sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column('occupation', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('institution_name', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('institution_email', sa.String(length=255), nullable=True))


def downgrade():
    with op.batch_alter_table('user_profiles', schema=None) as batch_op:
        batch_op.drop_column('institution_email')
        batch_op.drop_column('institution_name')
        batch_op.drop_column('occupation')
        batch_op.drop_column('last_name')
        batch_op.drop_column('first_name')
        batch_op.drop_column('title')
