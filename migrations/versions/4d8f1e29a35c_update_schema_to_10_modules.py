"""update_schema_to_10_modules

Revision ID: 4d8f1e29a35c
Revises: 25785666d6bc
Create Date: 2026-09-21 17:40:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '4d8f1e29a35c'
down_revision = '25785666d6bc'
branch_labels = None
depends_on = None


def upgrade():
    # ---------------------------------------------------------
    # 1. Base / Independent Lookup Tables (Group 1)
    # ---------------------------------------------------------
    op.create_table(
        'course_categories',
        sa.Column('category_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('icon_url', sa.String(length=512), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('category_id')
    )

    op.create_table(
        'schools',
        sa.Column('school_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('contact_email', sa.String(length=255), nullable=True),
        sa.Column('contact_phone', sa.String(length=50), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('school_id')
    )
    op.create_index('ix_schools_code', 'schools', ['code'], unique=True)

    op.create_table(
        'permissions',
        sa.Column('permission_id', sa.UUID(), nullable=False),
        sa.Column('permission_name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('module', sa.String(length=50), nullable=True),
        sa.PrimaryKeyConstraint('permission_id')
    )
    op.create_index('ix_permissions_permission_name', 'permissions', ['permission_name'], unique=True)

    op.create_table(
        'levels',
        sa.Column('level_id', sa.UUID(), nullable=False),
        sa.Column('level_number', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=100), nullable=False),
        sa.Column('min_xp', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('level_id')
    )
    op.create_index('ix_levels_level_number', 'levels', ['level_number'], unique=True)

    op.create_table(
        'badges',
        sa.Column('badge_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('icon_url', sa.String(length=512), nullable=True),
        sa.Column('badge_type', sa.String(length=50), nullable=True),
        sa.Column('criteria_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('badge_id')
    )
    op.create_index('ix_badges_name', 'badges', ['name'], unique=True)

    op.create_table(
        'skills',
        sa.Column('skill_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('skill_id')
    )
    op.create_index('ix_skills_name', 'skills', ['name'], unique=True)

    op.create_table(
        'virtual_labs',
        sa.Column('lab_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('lab_type', sa.String(length=50), nullable=False, server_default='circuit'),
        sa.Column('config_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('lab_id')
    )

    op.create_table(
        'questions',
        sa.Column('question_id', sa.UUID(), nullable=False),
        sa.Column('question_text', sa.Text(), nullable=False),
        sa.Column('question_type', sa.String(length=50), nullable=False, server_default='multiple_choice'),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('question_id')
    )

    op.create_table(
        'rewards',
        sa.Column('reward_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('reward_type', sa.String(length=50), nullable=False),
        sa.Column('reward_value', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('reward_id')
    )

    op.create_table(
        'online_rooms',
        sa.Column('room_id', sa.UUID(), nullable=False),
        sa.Column('room_name', sa.String(length=255), nullable=False),
        sa.Column('room_type', sa.String(length=50), nullable=False, server_default='webrtc'),
        sa.Column('config_data', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='inactive'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('room_id')
    )

    op.create_table(
        'missions',
        sa.Column('mission_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('mission_type', sa.String(length=50), nullable=True),
        sa.Column('reward_xp', sa.Integer(), nullable=True),
        sa.Column('reward_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('mission_id')
    )

    # ---------------------------------------------------------
    # 2. Alter Existing Tables (Add Columns & Foreign Keys)
    # ---------------------------------------------------------
    op.add_column('roles', sa.Column('description', sa.String(length=255), nullable=True))

    op.add_column('courses', sa.Column('category_id', sa.UUID(), nullable=True))
    op.create_foreign_key('fk_courses_category_id', 'courses', 'course_categories', ['category_id'], ['category_id'], ondelete='SET NULL')
    op.create_index('ix_courses_category_id', 'courses', ['category_id'])

    # ---------------------------------------------------------
    # 3. Direct Dependent Tables (Group 2)
    # ---------------------------------------------------------
    op.create_table(
        'role_permissions',
        sa.Column('role_permission_id', sa.UUID(), nullable=False),
        sa.Column('role_id', sa.UUID(), nullable=False),
        sa.Column('permission_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['role_id'], ['roles.role_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['permission_id'], ['permissions.permission_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('role_permission_id'),
        sa.UniqueConstraint('role_id', 'permission_id', name='uq_role_permission')
    )
    op.create_index('ix_role_permissions_role_id', 'role_permissions', ['role_id'])
    op.create_index('ix_role_permissions_permission_id', 'role_permissions', ['permission_id'])

    op.create_table(
        'school_settings',
        sa.Column('setting_id', sa.UUID(), nullable=False),
        sa.Column('school_id', sa.UUID(), nullable=False),
        sa.Column('key', sa.String(length=100), nullable=False),
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['school_id'], ['schools.school_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('setting_id')
    )
    op.create_index('ix_school_settings_school_id', 'school_settings', ['school_id'])

    op.create_table(
        'school_users',
        sa.Column('school_user_id', sa.UUID(), nullable=False),
        sa.Column('school_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False, server_default='member'),
        sa.Column('joined_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['school_id'], ['schools.school_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('school_user_id'),
        sa.UniqueConstraint('school_id', 'user_id', name='uq_school_user')
    )
    op.create_index('ix_school_users_school_id', 'school_users', ['school_id'])
    op.create_index('ix_school_users_user_id', 'school_users', ['user_id'])

    op.create_table(
        'students',
        sa.Column('student_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('student_code', sa.String(length=50), nullable=True),
        sa.Column('grade_level', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('student_id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index('ix_students_student_code', 'students', ['student_code'])

    op.create_table(
        'instructors',
        sa.Column('instructor_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=100), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('instructor_id'),
        sa.UniqueConstraint('user_id')
    )

    op.create_table(
        'classrooms',
        sa.Column('classroom_id', sa.UUID(), nullable=False),
        sa.Column('school_id', sa.UUID(), nullable=False),
        sa.Column('classroom_name', sa.String(length=100), nullable=False),
        sa.Column('grade_level', sa.String(length=50), nullable=True),
        sa.Column('academic_year', sa.String(length=20), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='active'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['school_id'], ['schools.school_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('classroom_id')
    )
    op.create_index('ix_classrooms_school_id', 'classrooms', ['school_id'])

    op.create_table(
        'chapters',
        sa.Column('chapter_id', sa.UUID(), nullable=False),
        sa.Column('course_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('sequence_no', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['course_id'], ['courses.classroom_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('chapter_id')
    )
    op.create_index('ix_chapters_course_id', 'chapters', ['course_id'])

    # Add chapter_id to lessons
    op.add_column('lessons', sa.Column('chapter_id', sa.UUID(), nullable=True))
    op.create_foreign_key('fk_lessons_chapter_id', 'lessons', 'chapters', ['chapter_id'], ['chapter_id'], ondelete='CASCADE')
    op.create_index('ix_lessons_chapter_id', 'lessons', ['chapter_id'])

    op.create_table(
        'user_access',
        sa.Column('access_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('access_type', sa.String(length=50), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('access_id')
    )
    op.create_index('ix_user_access_user_id', 'user_access', ['user_id'])

    op.create_table(
        'sessions',
        sa.Column('session_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('token', sa.String(length=255), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('last_activity', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('session_id')
    )
    op.create_index('ix_sessions_user_id', 'sessions', ['user_id'])

    op.create_table(
        'password_histories',
        sa.Column('history_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('history_id')
    )
    op.create_index('ix_password_histories_user_id', 'password_histories', ['user_id'])

    op.create_table(
        'user_xps',
        sa.Column('xp_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('source_type', sa.String(length=50), nullable=False),
        sa.Column('source_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('xp_id')
    )
    op.create_index('ix_user_xps_user_id', 'user_xps', ['user_id'])

    op.create_table(
        'user_levels',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('level_id', sa.UUID(), nullable=False),
        sa.Column('current_xp', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['level_id'], ['levels.level_id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index('ix_user_levels_level_id', 'user_levels', ['level_id'])

    op.create_table(
        'user_badges',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('badge_id', sa.UUID(), nullable=False),
        sa.Column('earned_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['badge_id'], ['badges.badge_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'badge_id', name='uq_user_badge')
    )
    op.create_index('ix_user_badges_badge_id', 'user_badges', ['badge_id'])
    op.create_index('ix_user_badges_user_id', 'user_badges', ['user_id'])

    op.create_table(
        'user_streaks',
        sa.Column('streak_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('current_streak', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('longest_streak', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_activity_date', sa.Date(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('streak_id'),
        sa.UniqueConstraint('user_id')
    )

    op.create_table(
        'leaderboards',
        sa.Column('leaderboard_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('rank', sa.Integer(), nullable=False),
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('period_type', sa.String(length=30), nullable=True),
        sa.Column('period_start', sa.Date(), nullable=True),
        sa.Column('period_end', sa.Date(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('leaderboard_id')
    )
    op.create_index('ix_leaderboards_user_id', 'leaderboards', ['user_id'])

    op.create_table(
        'user_rewards',
        sa.Column('user_reward_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('reward_id', sa.UUID(), nullable=False),
        sa.Column('awarded_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['reward_id'], ['rewards.reward_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_reward_id')
    )
    op.create_index('ix_user_rewards_reward_id', 'user_rewards', ['reward_id'])
    op.create_index('ix_user_rewards_user_id', 'user_rewards', ['user_id'])

    op.create_table(
        'learning_progress',
        sa.Column('progress_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('course_id', sa.UUID(), nullable=False),
        sa.Column('progress_percent', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0.00'),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='in_progress'),
        sa.Column('last_accessed_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['course_id'], ['courses.classroom_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('progress_id'),
        sa.UniqueConstraint('user_id', 'course_id', name='uq_user_course_progress')
    )
    op.create_index('ix_learning_progress_course_id', 'learning_progress', ['course_id'])
    op.create_index('ix_learning_progress_user_id', 'learning_progress', ['user_id'])

    op.create_table(
        'learning_activities',
        sa.Column('activity_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('activity_type', sa.String(length=50), nullable=False),
        sa.Column('activity_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('activity_id')
    )
    op.create_index('ix_learning_activities_user_id', 'learning_activities', ['user_id'])

    op.create_table(
        'user_skills',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('skill_id', sa.UUID(), nullable=False),
        sa.Column('level', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('is_unlocked', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('unlocked_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['skill_id'], ['skills.skill_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'skill_id', name='uq_user_skill')
    )
    op.create_index('ix_user_skills_skill_id', 'user_skills', ['skill_id'])
    op.create_index('ix_user_skills_user_id', 'user_skills', ['user_id'])

    op.create_table(
        'learning_summaries',
        sa.Column('summary_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('total_courses_enrolled', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_courses_completed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_learning_time_minutes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_xp_earned', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('summary_data', sa.JSON(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('summary_id'),
        sa.UniqueConstraint('user_id')
    )

    op.create_table(
        'live_schedules',
        sa.Column('schedule_id', sa.UUID(), nullable=False),
        sa.Column('course_id', sa.UUID(), nullable=True),
        sa.Column('instructor_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('scheduled_start', sa.DateTime(timezone=True), nullable=False),
        sa.Column('scheduled_end', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='scheduled'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['course_id'], ['courses.classroom_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['instructor_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('schedule_id')
    )
    op.create_index('ix_live_schedules_course_id', 'live_schedules', ['course_id'])
    op.create_index('ix_live_schedules_instructor_id', 'live_schedules', ['instructor_id'])

    op.create_table(
        'stories',
        sa.Column('story_id', sa.UUID(), nullable=False),
        sa.Column('course_id', sa.UUID(), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['course_id'], ['courses.classroom_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('story_id')
    )
    op.create_index('ix_stories_course_id', 'stories', ['course_id'])

    op.create_table(
        'lab_projects',
        sa.Column('project_id', sa.UUID(), nullable=False),
        sa.Column('lab_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('project_data', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='draft'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['lab_id'], ['virtual_labs.lab_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('project_id')
    )
    op.create_index('ix_lab_projects_lab_id', 'lab_projects', ['lab_id'])
    op.create_index('ix_lab_projects_user_id', 'lab_projects', ['user_id'])

    op.create_table(
        'lab_assignments',
        sa.Column('assignment_id', sa.UUID(), nullable=False),
        sa.Column('lab_id', sa.UUID(), nullable=False),
        sa.Column('course_id', sa.UUID(), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('instructions', sa.Text(), nullable=True),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['course_id'], ['courses.classroom_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['lab_id'], ['virtual_labs.lab_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('assignment_id')
    )
    op.create_index('ix_lab_assignments_course_id', 'lab_assignments', ['course_id'])
    op.create_index('ix_lab_assignments_lab_id', 'lab_assignments', ['lab_id'])

    op.create_table(
        'interactive_components',
        sa.Column('component_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('component_type', sa.String(length=50), nullable=False),
        sa.Column('config_data', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='active'),
        sa.Column('created_by', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['created_by'], ['users.user_id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('component_id')
    )
    op.create_index('ix_interactive_components_created_by', 'interactive_components', ['created_by'])

    op.create_table(
        'announcements',
        sa.Column('announcement_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('target_role', sa.String(length=50), nullable=True),
        sa.Column('school_id', sa.UUID(), nullable=True),
        sa.Column('created_by', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['created_by'], ['users.user_id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['school_id'], ['schools.school_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('announcement_id')
    )
    op.create_index('ix_announcements_created_by', 'announcements', ['created_by'])
    op.create_index('ix_announcements_school_id', 'announcements', ['school_id'])

    op.create_table(
        'notifications',
        sa.Column('notification_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('notification_type', sa.String(length=50), nullable=False, server_default='general'),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('link_url', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('notification_id')
    )
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])

    op.create_table(
        'reports',
        sa.Column('report_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('report_type', sa.String(length=50), nullable=False),
        sa.Column('report_data', sa.JSON(), nullable=True),
        sa.Column('generated_by', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['generated_by'], ['users.user_id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('report_id')
    )
    op.create_index('ix_reports_generated_by', 'reports', ['generated_by'])

    op.create_table(
        'audit_logs',
        sa.Column('log_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=True),
        sa.Column('entity_id', sa.UUID(), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('log_id')
    )
    op.create_index('ix_audit_logs_user_id', 'audit_logs', ['user_id'])

    op.create_table(
        'security_logs',
        sa.Column('log_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('event_type', sa.String(length=100), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False, server_default='info'),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('log_id')
    )
    op.create_index('ix_security_logs_user_id', 'security_logs', ['user_id'])

    op.create_table(
        'backups',
        sa.Column('backup_id', sa.UUID(), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('backup_type', sa.String(length=50), nullable=False, server_default='full'),
        sa.Column('file_size', sa.BigInteger(), nullable=True),
        sa.Column('checksum', sa.String(length=255), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='completed'),
        sa.Column('created_by', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['created_by'], ['users.user_id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('backup_id')
    )
    op.create_index('ix_backups_created_by', 'backups', ['created_by'])

    op.create_table(
        'ai_conversations',
        sa.Column('conversation_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('conversation_id')
    )
    op.create_index('ix_ai_conversations_user_id', 'ai_conversations', ['user_id'])

    op.create_table(
        'ai_hints',
        sa.Column('hint_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('exercise_id', sa.UUID(), nullable=True),
        sa.Column('hint_text', sa.Text(), nullable=False),
        sa.Column('level', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('hint_id')
    )
    op.create_index('ix_ai_hints_user_id', 'ai_hints', ['user_id'])

    op.create_table(
        'exercises',
        sa.Column('exercise_id', sa.UUID(), nullable=False),
        sa.Column('lesson_id', sa.UUID(), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('instructions', sa.Text(), nullable=True),
        sa.Column('exercise_type', sa.String(length=50), nullable=False, server_default='practice'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.lesson_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('exercise_id')
    )
    op.create_index('ix_exercises_lesson_id', 'exercises', ['lesson_id'])

    op.create_table(
        'coding_exercises',
        sa.Column('coding_exercise_id', sa.UUID(), nullable=False),
        sa.Column('lesson_id', sa.UUID(), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('programming_language', sa.String(length=50), nullable=False),
        sa.Column('starter_code', sa.Text(), nullable=True),
        sa.Column('solution_code', sa.Text(), nullable=True),
        sa.Column('time_limit_ms', sa.Integer(), nullable=False, server_default='5000'),
        sa.Column('memory_limit_mb', sa.Integer(), nullable=False, server_default='128'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.lesson_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('coding_exercise_id')
    )
    op.create_index('ix_coding_exercises_lesson_id', 'coding_exercises', ['lesson_id'])

    op.create_table(
        'quizzes',
        sa.Column('quiz_id', sa.UUID(), nullable=False),
        sa.Column('lesson_id', sa.UUID(), nullable=True),
        sa.Column('course_id', sa.UUID(), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['course_id'], ['courses.classroom_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.lesson_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('quiz_id')
    )
    op.create_index('ix_quizzes_course_id', 'quizzes', ['course_id'])
    op.create_index('ix_quizzes_lesson_id', 'quizzes', ['lesson_id'])

    op.create_table(
        'question_options',
        sa.Column('option_id', sa.UUID(), nullable=False),
        sa.Column('question_id', sa.UUID(), nullable=False),
        sa.Column('option_text', sa.Text(), nullable=False),
        sa.Column('is_correct', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('order_no', sa.Integer(), nullable=False, server_default='1'),
        sa.ForeignKeyConstraint(['question_id'], ['questions.question_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('option_id')
    )
    op.create_index('ix_question_options_question_id', 'question_options', ['question_id'])

    op.create_table(
        'media',
        sa.Column('media_id', sa.UUID(), nullable=False),
        sa.Column('content_id', sa.UUID(), nullable=True),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_url', sa.String(length=512), nullable=False),
        sa.Column('file_type', sa.String(length=50), nullable=False),
        sa.Column('file_size', sa.BigInteger(), nullable=True),
        sa.Column('duration', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['content_id'], ['contents.content_id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('media_id')
    )
    op.create_index('ix_media_content_id', 'media', ['content_id'])
    op.create_index('ix_media_user_id', 'media', ['user_id'])

    op.create_table(
        'reviews',
        sa.Column('review_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('course_id', sa.UUID(), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='published'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['course_id'], ['courses.classroom_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('review_id'),
        sa.UniqueConstraint('user_id', 'course_id', name='uq_user_course_review')
    )
    op.create_index('ix_reviews_course_id', 'reviews', ['course_id'])
    op.create_index('ix_reviews_user_id', 'reviews', ['user_id'])

    # ---------------------------------------------------------
    # 4. Secondary Dependent Tables (Group 3)
    # ---------------------------------------------------------
    op.create_table(
        'instructor_schools',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('instructor_id', sa.UUID(), nullable=False),
        sa.Column('school_id', sa.UUID(), nullable=False),
        sa.Column('department', sa.String(length=100), nullable=True),
        sa.Column('assigned_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['instructor_id'], ['instructors.instructor_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['school_id'], ['schools.school_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('instructor_id', 'school_id', name='uq_instructor_school')
    )
    op.create_index('ix_instructor_schools_instructor_id', 'instructor_schools', ['instructor_id'])
    op.create_index('ix_instructor_schools_school_id', 'instructor_schools', ['school_id'])

    op.create_table(
        'classroom_students',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('classroom_id', sa.UUID(), nullable=False),
        sa.Column('student_id', sa.UUID(), nullable=False),
        sa.Column('joined_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['classroom_id'], ['classrooms.classroom_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['student_id'], ['students.student_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('classroom_id', 'student_id', name='uq_classroom_student')
    )
    op.create_index('ix_classroom_students_classroom_id', 'classroom_students', ['classroom_id'])
    op.create_index('ix_classroom_students_student_id', 'classroom_students', ['student_id'])

    op.create_table(
        'lesson_progress',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('lesson_id', sa.UUID(), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='in_progress'),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['lesson_id'], ['lessons.lesson_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'lesson_id', name='uq_user_lesson_progress')
    )
    op.create_index('ix_lesson_progress_lesson_id', 'lesson_progress', ['lesson_id'])
    op.create_index('ix_lesson_progress_user_id', 'lesson_progress', ['user_id'])

    op.create_table(
        'episode_progress',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('episode_id', sa.UUID(), nullable=False),
        sa.Column('watched_seconds', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_completed', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['episode_id'], ['episodes.episode_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'episode_id', name='uq_user_episode_progress')
    )
    op.create_index('ix_episode_progress_episode_id', 'episode_progress', ['episode_id'])
    op.create_index('ix_episode_progress_user_id', 'episode_progress', ['user_id'])

    op.create_table(
        'live_sessions',
        sa.Column('live_session_id', sa.UUID(), nullable=False),
        sa.Column('schedule_id', sa.UUID(), nullable=True),
        sa.Column('room_id', sa.UUID(), nullable=True),
        sa.Column('instructor_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='live'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['instructor_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['room_id'], ['online_rooms.room_id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['schedule_id'], ['live_schedules.schedule_id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('live_session_id')
    )
    op.create_index('ix_live_sessions_instructor_id', 'live_sessions', ['instructor_id'])
    op.create_index('ix_live_sessions_room_id', 'live_sessions', ['room_id'])
    op.create_index('ix_live_sessions_schedule_id', 'live_sessions', ['schedule_id'])

    op.create_table(
        'story_scenes',
        sa.Column('scene_id', sa.UUID(), nullable=False),
        sa.Column('story_id', sa.UUID(), nullable=False),
        sa.Column('sequence_no', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('title', sa.String(length=255), nullable=True),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('scene_data', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['story_id'], ['stories.story_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('scene_id')
    )
    op.create_index('ix_story_scenes_story_id', 'story_scenes', ['story_id'])

    op.create_table(
        'lab_devices',
        sa.Column('device_id', sa.UUID(), nullable=False),
        sa.Column('project_id', sa.UUID(), nullable=False),
        sa.Column('device_name', sa.String(length=100), nullable=False),
        sa.Column('device_type', sa.String(length=50), nullable=False),
        sa.Column('device_config', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['project_id'], ['lab_projects.project_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('device_id')
    )
    op.create_index('ix_lab_devices_project_id', 'lab_devices', ['project_id'])

    op.create_table(
        'simulations',
        sa.Column('simulation_id', sa.UUID(), nullable=False),
        sa.Column('project_id', sa.UUID(), nullable=False),
        sa.Column('state_data', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='idle'),
        sa.Column('last_run_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['lab_projects.project_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('simulation_id')
    )
    op.create_index('ix_simulations_project_id', 'simulations', ['project_id'])

    op.create_table(
        'test_cases',
        sa.Column('test_case_id', sa.UUID(), nullable=False),
        sa.Column('coding_exercise_id', sa.UUID(), nullable=False),
        sa.Column('input_data', sa.Text(), nullable=False),
        sa.Column('expected_output', sa.Text(), nullable=False),
        sa.Column('is_hidden', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('order_no', sa.Integer(), nullable=False, server_default='1'),
        sa.ForeignKeyConstraint(['coding_exercise_id'], ['coding_exercises.coding_exercise_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('test_case_id')
    )
    op.create_index('ix_test_cases_coding_exercise_id', 'test_cases', ['coding_exercise_id'])

    op.create_table(
        'code_submissions',
        sa.Column('submission_id', sa.UUID(), nullable=False),
        sa.Column('coding_exercise_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('submitted_code', sa.Text(), nullable=False),
        sa.Column('language', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='pending'),
        sa.Column('score', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['coding_exercise_id'], ['coding_exercises.coding_exercise_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('submission_id')
    )
    op.create_index('ix_code_submissions_coding_exercise_id', 'code_submissions', ['coding_exercise_id'])
    op.create_index('ix_code_submissions_user_id', 'code_submissions', ['user_id'])

    op.create_table(
        'exercise_attempts',
        sa.Column('attempt_id', sa.UUID(), nullable=False),
        sa.Column('exercise_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('score', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='in_progress'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['exercise_id'], ['exercises.exercise_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('attempt_id')
    )
    op.create_index('ix_exercise_attempts_exercise_id', 'exercise_attempts', ['exercise_id'])
    op.create_index('ix_exercise_attempts_user_id', 'exercise_attempts', ['user_id'])

    op.create_table(
        'quiz_conditions',
        sa.Column('condition_id', sa.UUID(), nullable=False),
        sa.Column('quiz_id', sa.UUID(), nullable=False),
        sa.Column('max_attempts', sa.Integer(), nullable=True),
        sa.Column('time_limit_minutes', sa.Integer(), nullable=True),
        sa.Column('passing_score', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.ForeignKeyConstraint(['quiz_id'], ['quizzes.quiz_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('condition_id'),
        sa.UniqueConstraint('quiz_id')
    )

    op.create_table(
        'quiz_questions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('quiz_id', sa.UUID(), nullable=False),
        sa.Column('question_id', sa.UUID(), nullable=False),
        sa.Column('order_no', sa.Integer(), nullable=False, server_default='1'),
        sa.ForeignKeyConstraint(['question_id'], ['questions.question_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['quiz_id'], ['quizzes.quiz_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('quiz_id', 'question_id', name='uq_quiz_question')
    )
    op.create_index('ix_quiz_questions_question_id', 'quiz_questions', ['question_id'])
    op.create_index('ix_quiz_questions_quiz_id', 'quiz_questions', ['quiz_id'])

    op.create_table(
        'quiz_attempts',
        sa.Column('attempt_id', sa.UUID(), nullable=False),
        sa.Column('quiz_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='in_progress'),
        sa.ForeignKeyConstraint(['quiz_id'], ['quizzes.quiz_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('attempt_id')
    )
    op.create_index('ix_quiz_attempts_quiz_id', 'quiz_attempts', ['quiz_id'])
    op.create_index('ix_quiz_attempts_user_id', 'quiz_attempts', ['user_id'])

    op.create_table(
        'mission_progress',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('mission_id', sa.UUID(), nullable=False),
        sa.Column('progress_percent', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0.00'),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='in_progress'),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['mission_id'], ['missions.mission_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'mission_id', name='uq_user_mission_progress')
    )
    op.create_index('ix_mission_progress_mission_id', 'mission_progress', ['mission_id'])
    op.create_index('ix_mission_progress_user_id', 'mission_progress', ['user_id'])

    op.create_table(
        'ai_messages',
        sa.Column('message_id', sa.UUID(), nullable=False),
        sa.Column('conversation_id', sa.UUID(), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('tokens_used', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['conversation_id'], ['ai_conversations.conversation_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('message_id')
    )
    op.create_index('ix_ai_messages_conversation_id', 'ai_messages', ['conversation_id'])

    op.create_table(
        'ai_code_requests',
        sa.Column('request_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('coding_exercise_id', sa.UUID(), nullable=True),
        sa.Column('prompt', sa.Text(), nullable=False),
        sa.Column('code_snippet', sa.Text(), nullable=True),
        sa.Column('response', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['coding_exercise_id'], ['coding_exercises.coding_exercise_id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('request_id')
    )
    op.create_index('ix_ai_code_requests_coding_exercise_id', 'ai_code_requests', ['coding_exercise_id'])
    op.create_index('ix_ai_code_requests_user_id', 'ai_code_requests', ['user_id'])

    # ---------------------------------------------------------
    # 5. Tertiary Dependent Tables (Group 4)
    # ---------------------------------------------------------
    op.create_table(
        'story_progress',
        sa.Column('story_progress_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('story_id', sa.UUID(), nullable=False),
        sa.Column('scene_id', sa.UUID(), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='in_progress'),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['scene_id'], ['story_scenes.scene_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['story_id'], ['stories.story_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('story_progress_id'),
        sa.UniqueConstraint('user_id', 'story_id', name='uq_user_story_progress')
    )
    op.create_index('ix_story_progress_scene_id', 'story_progress', ['scene_id'])
    op.create_index('ix_story_progress_story_id', 'story_progress', ['story_id'])
    op.create_index('ix_story_progress_user_id', 'story_progress', ['user_id'])

    op.create_table(
        'live_recordings',
        sa.Column('recording_id', sa.UUID(), nullable=False),
        sa.Column('live_session_id', sa.UUID(), nullable=False),
        sa.Column('file_url', sa.String(length=512), nullable=False),
        sa.Column('duration_seconds', sa.Integer(), nullable=True),
        sa.Column('file_size', sa.BigInteger(), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='ready'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['live_session_id'], ['live_sessions.live_session_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('recording_id')
    )
    op.create_index('ix_live_recordings_live_session_id', 'live_recordings', ['live_session_id'])

    op.create_table(
        'live_participants',
        sa.Column('participant_id', sa.UUID(), nullable=False),
        sa.Column('live_session_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('mic_permission', sa.String(length=30), nullable=False, server_default='muted'),
        sa.Column('joined_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('left_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['live_session_id'], ['live_sessions.live_session_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('participant_id')
    )
    op.create_index('ix_live_participants_live_session_id', 'live_participants', ['live_session_id'])
    op.create_index('ix_live_participants_user_id', 'live_participants', ['user_id'])

    op.create_table(
        'chat_messages',
        sa.Column('message_id', sa.UUID(), nullable=False),
        sa.Column('live_session_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['live_session_id'], ['live_sessions.live_session_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('message_id')
    )
    op.create_index('ix_chat_messages_live_session_id', 'chat_messages', ['live_session_id'])
    op.create_index('ix_chat_messages_user_id', 'chat_messages', ['user_id'])

    op.create_table(
        'code_executions',
        sa.Column('execution_id', sa.UUID(), nullable=False),
        sa.Column('submission_id', sa.UUID(), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False),
        sa.Column('stdout', sa.Text(), nullable=True),
        sa.Column('stderr', sa.Text(), nullable=True),
        sa.Column('execution_time_ms', sa.Integer(), nullable=True),
        sa.Column('memory_used_kb', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['submission_id'], ['code_submissions.submission_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('execution_id')
    )
    op.create_index('ix_code_executions_submission_id', 'code_executions', ['submission_id'])

    op.create_table(
        'quiz_answers',
        sa.Column('answer_id', sa.UUID(), nullable=False),
        sa.Column('attempt_id', sa.UUID(), nullable=False),
        sa.Column('question_id', sa.UUID(), nullable=False),
        sa.Column('option_id', sa.UUID(), nullable=True),
        sa.Column('answer_text', sa.Text(), nullable=True),
        sa.Column('is_correct', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['attempt_id'], ['quiz_attempts.attempt_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['option_id'], ['question_options.option_id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['question_id'], ['questions.question_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('answer_id')
    )
    op.create_index('ix_quiz_answers_attempt_id', 'quiz_answers', ['attempt_id'])
    op.create_index('ix_quiz_answers_option_id', 'quiz_answers', ['option_id'])
    op.create_index('ix_quiz_answers_question_id', 'quiz_answers', ['question_id'])

    op.create_table(
        'quiz_results',
        sa.Column('result_id', sa.UUID(), nullable=False),
        sa.Column('attempt_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('score', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('total_score', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('percentage', sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column('is_passed', sa.Boolean(), nullable=False),
        sa.Column('feedback', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['attempt_id'], ['quiz_attempts.attempt_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('result_id'),
        sa.UniqueConstraint('attempt_id')
    )
    op.create_index('ix_quiz_results_user_id', 'quiz_results', ['user_id'])


def downgrade():
    # Drop Group 4
    op.drop_table('quiz_results')
    op.drop_table('quiz_answers')
    op.drop_table('code_executions')
    op.drop_table('chat_messages')
    op.drop_table('live_participants')
    op.drop_table('live_recordings')
    op.drop_table('story_progress')

    # Drop Group 3
    op.drop_table('ai_code_requests')
    op.drop_table('ai_messages')
    op.drop_table('mission_progress')
    op.drop_table('quiz_attempts')
    op.drop_table('quiz_questions')
    op.drop_table('quiz_conditions')
    op.drop_table('exercise_attempts')
    op.drop_table('code_submissions')
    op.drop_table('test_cases')
    op.drop_table('simulations')
    op.drop_table('lab_devices')
    op.drop_table('story_scenes')
    op.drop_table('live_sessions')
    op.drop_table('episode_progress')
    op.drop_table('lesson_progress')
    op.drop_table('classroom_students')
    op.drop_table('instructor_schools')

    # Drop Group 2
    op.drop_table('reviews')
    op.drop_table('media')
    op.drop_table('question_options')
    op.drop_table('quizzes')
    op.drop_table('coding_exercises')
    op.drop_table('exercises')
    op.drop_table('ai_hints')
    op.drop_table('ai_conversations')
    op.drop_table('backups')
    op.drop_table('security_logs')
    op.drop_table('audit_logs')
    op.drop_table('reports')
    op.drop_table('notifications')
    op.drop_table('announcements')
    op.drop_table('interactive_components')
    op.drop_table('lab_assignments')
    op.drop_table('lab_projects')
    op.drop_table('stories')
    op.drop_table('live_schedules')
    op.drop_table('learning_summaries')
    op.drop_table('user_skills')
    op.drop_table('learning_activities')
    op.drop_table('learning_progress')
    op.drop_table('user_rewards')
    op.drop_table('leaderboards')
    op.drop_table('user_streaks')
    op.drop_table('user_badges')
    op.drop_table('user_levels')
    op.drop_table('user_xps')
    op.drop_table('password_histories')
    op.drop_table('sessions')
    op.drop_table('user_access')

    # Remove altered columns
    op.drop_constraint('fk_lessons_chapter_id', 'lessons', type_='foreignkey')
    op.drop_index('ix_lessons_chapter_id', 'lessons')
    op.drop_column('lessons', 'chapter_id')

    op.drop_table('chapters')
    op.drop_table('classrooms')
    op.drop_table('instructors')
    op.drop_table('students')
    op.drop_table('school_users')
    op.drop_table('school_settings')
    op.drop_table('role_permissions')

    op.drop_constraint('fk_courses_category_id', 'courses', type_='foreignkey')
    op.drop_index('ix_courses_category_id', 'courses')
    op.drop_column('courses', 'category_id')

    op.drop_column('roles', 'description')

    # Drop Group 1
    op.drop_table('missions')
    op.drop_table('online_rooms')
    op.drop_table('rewards')
    op.drop_table('questions')
    op.drop_table('virtual_labs')
    op.drop_table('skills')
    op.drop_table('badges')
    op.drop_table('levels')
    op.drop_table('permissions')
    op.drop_table('schools')
    op.drop_table('course_categories')
