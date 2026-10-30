"""001_initial_schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-30 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Enable pgvector extension if postgres
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    op.create_table(
        'users',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('username', sa.String(100), unique=True, nullable=False),
        sa.Column('display_name', sa.String(100), nullable=False),
        sa.Column('avatar_url', sa.String(500), nullable=True),
        sa.Column('role', sa.String(20), default='viewer', nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False)
    )

    op.create_table(
        'twitch_accounts',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('twitch_user_id', sa.String(100), unique=True, nullable=False),
        sa.Column('twitch_username', sa.String(100), nullable=False),
        sa.Column('encrypted_access_token', sa.Text(), nullable=False),
        sa.Column('encrypted_refresh_token', sa.Text(), nullable=False),
        sa.Column('token_expires_at', sa.DateTime(), nullable=True),
        sa.Column('scopes', sa.String(500), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False)
    )

    op.create_table(
        'streams',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('broadcaster_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(50), default='created', nullable=False),
        sa.Column('stream_key', sa.String(100), unique=True, nullable=False),
        sa.Column('livekit_room_name', sa.String(100), unique=True, nullable=False),
        sa.Column('twitch_channel', sa.String(100), nullable=True),
        sa.Column('max_cameras', sa.Integer(), default=6, nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('ended_at', sa.DateTime(), nullable=True)
    )

    op.create_table(
        'cameras',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('stream_id', sa.String(36), sa.ForeignKey('streams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('label', sa.String(100), nullable=False),
        sa.Column('source_id', sa.String(100), nullable=False),
        sa.Column('rtmp_key', sa.String(100), unique=True, nullable=False),
        sa.Column('status', sa.String(30), default='offline', nullable=False),
        sa.Column('moderation_state', sa.String(30), default='safe', nullable=False),
        sa.Column('is_primary', sa.Boolean(), default=False, nullable=False),
        sa.Column('sort_order', sa.Integer(), default=0, nullable=False),
        sa.Column('fallback_image_url', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False)
    )

    op.create_table(
        'moderation_events',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('camera_id', sa.String(36), sa.ForeignKey('cameras.id', ondelete='CASCADE'), nullable=False),
        sa.Column('stream_id', sa.String(36), sa.ForeignKey('streams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('category', sa.String(100), nullable=False),
        sa.Column('subcategory', sa.String(100), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('action', sa.String(30), nullable=False),
        sa.Column('model_id', sa.String(100), nullable=False),
        sa.Column('model_version', sa.String(50), nullable=False),
        sa.Column('details', sa.JSON(), nullable=False),
        sa.Column('frame_timestamp', sa.Float(), nullable=False),
        sa.Column('resolved', sa.Boolean(), default=False, nullable=False),
        sa.Column('resolved_by', sa.String(36), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False)
    )

    op.create_table(
        'moderation_policies',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('stream_id', sa.String(36), sa.ForeignKey('streams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('category', sa.String(100), nullable=False),
        sa.Column('enabled', sa.Boolean(), default=True, nullable=False),
        sa.Column('hold_threshold', sa.Float(), default=0.5, nullable=False),
        sa.Column('block_threshold', sa.Float(), default=0.8, nullable=False),
        sa.Column('auto_restore', sa.Boolean(), default=False, nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False)
    )

    op.create_table(
        'communities',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('stream_id', sa.String(36), sa.ForeignKey('streams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.String(255), nullable=True),
        sa.Column('capacity', sa.Integer(), default=6, nullable=False),
        sa.Column('is_active', sa.Boolean(), default=True, nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False)
    )

    op.create_table(
        'community_members',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('community_id', sa.String(36), sa.ForeignKey('communities.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('joined_at', sa.DateTime(), nullable=False),
        sa.Column('left_at', sa.DateTime(), nullable=True)
    )

    op.create_table(
        'chat_messages',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('community_id', sa.String(36), sa.ForeignKey('communities.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('message_type', sa.String(20), default='text', nullable=False),
        sa.Column('is_deleted', sa.Boolean(), default=False, nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False)
    )

    op.create_table(
        'stream_analytics',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('stream_id', sa.String(36), sa.ForeignKey('streams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('camera_id', sa.String(36), sa.ForeignKey('cameras.id', ondelete='SET NULL'), nullable=True),
        sa.Column('viewer_count', sa.Integer(), default=0, nullable=False),
        sa.Column('peak_viewers', sa.Integer(), default=0, nullable=False),
        sa.Column('pov_switches', sa.Integer(), default=0, nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False)
    )

def downgrade() -> None:
    op.drop_table('stream_analytics')
    op.drop_table('chat_messages')
    op.drop_table('community_members')
    op.drop_table('communities')
    op.drop_table('moderation_policies')
    op.drop_table('moderation_events')
    op.drop_table('cameras')
    op.drop_table('streams')
    op.drop_table('twitch_accounts')
    op.drop_table('users')
