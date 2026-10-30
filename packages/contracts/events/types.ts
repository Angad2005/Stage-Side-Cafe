/**
 * WebSocket and EventSub event contracts across StageSide Cafe.
 */

export type ModerationState = 'safe' | 'suspicious' | 'unsafe' | 'error';
export type CameraStatus = 'offline' | 'online' | 'blocked' | 'error';
export type StreamStatus = 'created' | 'configuring' | 'live' | 'ended';

export interface BaseEvent {
  event: string;
  stream_id: string;
  timestamp: string;
}

// Camera Lifecycle & Moderation Events
export interface CameraOnlineEvent extends BaseEvent {
  event: 'camera.online';
  camera_id: string;
  source_id: string;
  label: string;
  fps: number;
}

export interface CameraOfflineEvent extends BaseEvent {
  event: 'camera.offline';
  camera_id: string;
  reason?: string;
}

export interface CameraSafeEvent extends BaseEvent {
  event: 'camera.safe';
  camera_id: string;
  verified_until: number;
}

export interface CameraBlockedEvent extends BaseEvent {
  event: 'camera.blocked';
  camera_id: string;
  reason: string;
  action: 'automatic_cut' | 'manual_isolation' | 'fail_closed';
  category: string;
  confidence: number;
  fallback_active: boolean;
}

export interface CameraRestoredEvent extends BaseEvent {
  event: 'camera.restored';
  camera_id: string;
  restored_by: string;
}

// Stream Lifecycle Events
export interface StreamStartedEvent extends BaseEvent {
  event: 'stream.started';
  broadcaster_id: string;
  title: string;
  livekit_room: string;
}

export interface StreamEndedEvent extends BaseEvent {
  event: 'stream.ended';
  duration_seconds: number;
}

// Viewer & POV Events
export interface ViewerPovChangedEvent extends BaseEvent {
  event: 'viewer.pov_changed';
  user_id: string;
  previous_camera_id: string;
  new_camera_id: string;
}

// Cafe Community Events
export interface CommunityViewerJoinedEvent extends BaseEvent {
  event: 'community.viewer_joined';
  community_id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  current_size: number;
}

export interface CommunityViewerLeftEvent extends BaseEvent {
  event: 'community.viewer_left';
  community_id: string;
  user_id: string;
  current_size: number;
}

export interface CommunityMessageEvent extends BaseEvent {
  event: 'community.message';
  community_id: string;
  message_id: string;
  user_id: string;
  username: string;
  message: string;
  message_type: 'text' | 'reaction' | 'system';
}

// Sentinel & Emergency Events
export interface SentinelStatusChangedEvent extends BaseEvent {
  event: 'sentinel.status_changed';
  status: 'nominal' | 'degraded' | 'alert';
  average_inference_ms: number;
  active_modules: string[];
}

export interface EmergencyBroadcastLockedEvent extends BaseEvent {
  event: 'emergency.broadcast_locked';
  locked_by: string;
  reason: string;
}

export type StageSideEvent =
  | CameraOnlineEvent
  | CameraOfflineEvent
  | CameraSafeEvent
  | CameraBlockedEvent
  | CameraRestoredEvent
  | StreamStartedEvent
  | StreamEndedEvent
  | ViewerPovChangedEvent
  | CommunityViewerJoinedEvent
  | CommunityViewerLeftEvent
  | CommunityMessageEvent
  | SentinelStatusChangedEvent
  | EmergencyBroadcastLockedEvent;
