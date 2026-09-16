"""add_episodes_journals_security_and_system_settings

Revision ID: 1408b90b1124
Revises: 3a822ce4713b
Create Date: 2026-09-14 16:23:07.682123

"""
import uuid
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1408b90b1124'
down_revision = '3a822ce4713b'
branch_labels = None
depends_on = None


def upgrade():
    # 1. สร้างตาราง system_settings
    op.create_table(
        'system_settings',
        sa.Column('key', sa.String(length=100), nullable=False),
        sa.Column('value', sa.String(length=255), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('key')
    )

    # 2. สร้างตาราง token_blocklist
    op.create_table(
        'token_blocklist',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('jti', sa.String(length=36), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('token_blocklist', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_token_blocklist_jti'), ['jti'], unique=True)

    # 3. สร้างตาราง refresh_tokens
    op.create_table(
        'refresh_tokens',
        sa.Column('token_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('token_id')
    )
    with op.batch_alter_table('refresh_tokens', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_refresh_tokens_token_hash'), ['token_hash'], unique=False)
        batch_op.create_index(batch_op.f('ix_refresh_tokens_user_id'), ['user_id'], unique=False)

    # 4. สร้างตาราง episodes
    op.create_table(
        'episodes',
        sa.Column('episode_id', sa.UUID(), nullable=False),
        sa.Column('lesson_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('sequence_no', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('duration_seconds', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.lesson_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('episode_id')
    )
    with op.batch_alter_table('episodes', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_episodes_lesson_id'), ['lesson_id'], unique=False)

    # 5. สร้างตาราง journals
    op.create_table(
        'journals',
        sa.Column('journal_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('classroom_id', sa.UUID(), nullable=True),
        sa.Column('episode_id', sa.UUID(), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['classroom_id'], ['classrooms.classroom_id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['episode_id'], ['episodes.episode_id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('journal_id')
    )
    with op.batch_alter_table('journals', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_journals_classroom_id'), ['classroom_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_journals_episode_id'), ['episode_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_journals_user_id'), ['user_id'], unique=False)

    # 6. เพิ่มคอลัมน์ใน classroom_members
    with op.batch_alter_table('classroom_members', schema=None) as batch_op:
        batch_op.add_column(sa.Column('status', sa.String(length=30), nullable=False, server_default='enrolled'))

    # 7. เพิ่มคอลัมน์ใน classrooms
    with op.batch_alter_table('classrooms', schema=None) as batch_op:
        batch_op.add_column(sa.Column('thumbnail_url', sa.String(length=512), nullable=True))

    # 8. เพิ่มคอลัมน์และปรับปรุง contents
    with op.batch_alter_table('contents', schema=None) as batch_op:
        batch_op.add_column(sa.Column('episode_id', sa.UUID(), nullable=True))
        batch_op.add_column(sa.Column('caption', sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column('sequence_no', sa.Integer(), nullable=False, server_default='1'))
        batch_op.add_column(sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()))
        batch_op.add_column(sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()))
        batch_op.alter_column('lesson_id', existing_type=sa.UUID(), nullable=True)
        batch_op.create_index(batch_op.f('ix_contents_episode_id'), ['episode_id'], unique=False)
        batch_op.create_foreign_key('fk_contents_episode_id', 'episodes', ['episode_id'], ['episode_id'], ondelete='CASCADE')

    # 9. เพิ่มคอลัมน์ใน lessons
    with op.batch_alter_table('lessons', schema=None) as batch_op:
        batch_op.add_column(sa.Column('description', sa.Text(), nullable=True))

    # 10. Data Backfill: ตรวจสอบและสร้าง Episode เริ่มต้นให้บทเรียนเดิมที่มีอยู่ และ Map ข้อมูล Content
    bind = op.get_bind()
    lessons_res = bind.execute(sa.text("SELECT lesson_id, title FROM lessons")).fetchall()
    for row in lessons_res:
        ep_id = str(uuid.uuid4())
        lesson_id_str = str(row[0])
        lesson_title = str(row[1])
        bind.execute(
            sa.text(
                "INSERT INTO episodes (episode_id, lesson_id, title, sequence_no, status, created_at, updated_at) "
                "VALUES (:ep_id, :lesson_id, :title, 1, 'active', NOW(), NOW())"
            ),
            {"ep_id": ep_id, "lesson_id": lesson_id_str, "title": f"Episode 1: {lesson_title}"}
        )
        bind.execute(
            sa.text(
                "UPDATE contents SET episode_id = :ep_id WHERE lesson_id = :lesson_id AND episode_id IS NULL"
            ),
            {"ep_id": ep_id, "lesson_id": lesson_id_str}
        )

    # 11. Seed ค่าเริ่มต้นสำหรับ system_settings
    bind.execute(
        sa.text(
            "INSERT INTO system_settings (key, value, description, updated_at) VALUES "
            "('session_timeout_minutes', '15', 'Idle session timeout in minutes (UAT-015)', NOW()), "
            "('guest_timeout_minutes', '10', 'Guest preview timeout in minutes (UAT-020)', NOW()), "
            "('warning_countdown_seconds', '120', 'Idle warning dialog countdown in seconds (UAT-015)', NOW()) "
            "ON CONFLICT (key) DO NOTHING"
        )
    )


def downgrade():
    with op.batch_alter_table('lessons', schema=None) as batch_op:
        batch_op.drop_column('description')

    with op.batch_alter_table('contents', schema=None) as batch_op:
        batch_op.drop_constraint('fk_contents_episode_id', type_='foreignkey')
        batch_op.drop_index(batch_op.f('ix_contents_episode_id'))
        batch_op.alter_column('lesson_id', existing_type=sa.UUID(), nullable=False)
        batch_op.drop_column('updated_at')
        batch_op.drop_column('created_at')
        batch_op.drop_column('sequence_no')
        batch_op.drop_column('caption')
        batch_op.drop_column('episode_id')

    with op.batch_alter_table('classrooms', schema=None) as batch_op:
        batch_op.drop_column('thumbnail_url')

    with op.batch_alter_table('classroom_members', schema=None) as batch_op:
        batch_op.drop_column('status')

    with op.batch_alter_table('journals', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_journals_user_id'))
        batch_op.drop_index(batch_op.f('ix_journals_episode_id'))
        batch_op.drop_index(batch_op.f('ix_journals_classroom_id'))

    op.drop_table('journals')
    with op.batch_alter_table('episodes', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_episodes_lesson_id'))

    op.drop_table('episodes')
    with op.batch_alter_table('refresh_tokens', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_refresh_tokens_user_id'))
        batch_op.drop_index(batch_op.f('ix_refresh_tokens_token_hash'))

    op.drop_table('refresh_tokens')
    with op.batch_alter_table('token_blocklist', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_token_blocklist_jti'))

    op.drop_table('token_blocklist')
    op.drop_table('system_settings')
