import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    Column, String, Boolean, Integer, Float, DateTime, ForeignKey, Text, JSON, Table, Index
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship
from .session import Base

try:
    from pgvector.sqlalchemy import Vector
    HAS_PGVECTOR = True
except ImportError:
    HAS_PGVECTOR = False
    Vector = None

def get_uuid_column():
    return Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(100), unique=True, nullable=False, index=True)
    display_name = Column(String(100), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    role = Column(String(20), default="viewer", nullable=False)  # viewer, streamer, admin
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    twitch_account = relationship("TwitchAccount", back_populates="user", uselist=False, cascade="all, delete-orphan")
    streams = relationship("Stream", back_populates="broadcaster")
    community_memberships = relationship("CommunityMember", back_populates="user")
    preference = relationship("ViewerPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="user")

class TwitchAccount(Base):
    __tablename__ = "twitch_accounts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    twitch_user_id = Column(String(100), unique=True, nullable=False, index=True)
    twitch_username = Column(String(100), nullable=False)
    encrypted_access_token = Column(Text, nullable=False)
    encrypted_refresh_token = Column(Text, nullable=False)
    token_expires_at = Column(DateTime, nullable=True)
    scopes = Column(String(500), default="", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="twitch_account")

class Stream(Base):
    __tablename__ = "streams"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    broadcaster_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="created", nullable=False)  # created, configuring, live, ended
    stream_key = Column(String(100), unique=True, nullable=False, default=lambda: f"live_{uuid.uuid4().hex[:16]}")
    livekit_room_name = Column(String(100), unique=True, nullable=False, default=lambda: f"stageside_{uuid.uuid4().hex[:12]}")
    twitch_channel = Column(String(100), nullable=True)
    max_cameras = Column(Integer, default=6, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    started_at = Column(DateTime, nullable=True)
    ended_at = Column(DateTime, nullable=True)

    broadcaster = relationship("User", back_populates="streams")
    cameras = relationship("Camera", back_populates="stream", cascade="all, delete-orphan")
    moderation_events = relationship("ModerationEvent", back_populates="stream", cascade="all, delete-orphan")
    moderation_policies = relationship("ModerationPolicy", back_populates="stream", cascade="all, delete-orphan")
    communities = relationship("Community", back_populates="stream", cascade="all, delete-orphan")
    analytics = relationship("StreamAnalytic", back_populates="stream", cascade="all, delete-orphan")

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    stream_id = Column(String(36), ForeignKey("streams.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    label = Column(String(100), nullable=False)  # e.g., Host POV, Guest POV, Gameplay
    source_id = Column(String(100), nullable=False)  # unique identifier in OBS / Ingest
    rtmp_key = Column(String(100), unique=True, nullable=False, default=lambda: f"cam_{uuid.uuid4().hex[:12]}")
    status = Column(String(30), default="offline", nullable=False)  # offline, online, blocked, error
    moderation_state = Column(String(30), default="safe", nullable=False)  # safe, suspicious, unsafe, error
    is_primary = Column(Boolean, default=False, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    fallback_image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    stream = relationship("Stream", back_populates="cameras")
    moderation_events = relationship("ModerationEvent", back_populates="camera", cascade="all, delete-orphan")

class ModerationEvent(Base):
    __tablename__ = "moderation_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    camera_id = Column(String(36), ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False)
    stream_id = Column(String(36), ForeignKey("streams.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(100), nullable=False)  # visual_safety, violence, privacy, etc.
    subcategory = Column(String(100), nullable=True)
    confidence = Column(Float, nullable=False)
    action = Column(String(30), nullable=False)  # allowed, held, blocked
    model_id = Column(String(100), nullable=False)
    model_version = Column(String(50), default="1.0", nullable=False)
    details = Column(JSON, default=dict, nullable=False)
    frame_timestamp = Column(Float, default=0.0, nullable=False)
    resolved = Column(Boolean, default=False, nullable=False)
    resolved_by = Column(String(36), nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    camera = relationship("Camera", back_populates="moderation_events")
    stream = relationship("Stream", back_populates="moderation_events")

class ModerationPolicy(Base):
    __tablename__ = "moderation_policies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    stream_id = Column(String(36), ForeignKey("streams.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(100), nullable=False)
    enabled = Column(Boolean, default=True, nullable=False)
    hold_threshold = Column(Float, default=0.5, nullable=False)
    block_threshold = Column(Float, default=0.8, nullable=False)
    auto_restore = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    stream = relationship("Stream", back_populates="moderation_policies")

class Community(Base):
    __tablename__ = "communities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    stream_id = Column(String(36), ForeignKey("streams.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    capacity = Column(Integer, default=6, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    stream = relationship("Stream", back_populates="communities")
    members = relationship("CommunityMember", back_populates="community", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="community", cascade="all, delete-orphan")

class CommunityMember(Base):
    __tablename__ = "community_members"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    community_id = Column(String(36), ForeignKey("communities.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    left_at = Column(DateTime, nullable=True)

    community = relationship("Community", back_populates="members")
    user = relationship("User", back_populates="community_memberships")

class ViewerPreference(Base):
    __tablename__ = "viewer_preferences"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    interests = Column(JSON, default=list, nullable=False)
    embedding = Column(Vector(1536) if (HAS_PGVECTOR and Vector is not None) else JSON, nullable=True)
    preferred_community_size = Column(Integer, default=4, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="preference")

class ViewerCameraPreference(Base):
    __tablename__ = "viewer_camera_preferences"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    stream_id = Column(String(36), ForeignKey("streams.id", ondelete="CASCADE"), nullable=False)
    camera_id = Column(String(36), ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False)
    selected_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    community_id = Column(String(36), ForeignKey("communities.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message = Column(Text, nullable=False)
    message_type = Column(String(20), default="text", nullable=False)  # text, reaction, system
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    community = relationship("Community", back_populates="chat_messages")
    user = relationship("User", back_populates="chat_messages")

class StreamAnalytic(Base):
    __tablename__ = "stream_analytics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    stream_id = Column(String(36), ForeignKey("streams.id", ondelete="CASCADE"), nullable=False)
    camera_id = Column(String(36), ForeignKey("cameras.id", ondelete="SET NULL"), nullable=True)
    viewer_count = Column(Integer, default=0, nullable=False)
    peak_viewers = Column(Integer, default=0, nullable=False)
    pov_switches = Column(Integer, default=0, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    stream = relationship("Stream", back_populates="analytics")
