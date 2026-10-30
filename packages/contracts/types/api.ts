/**
 * StageSide Cafe REST API request & response types.
 */

import type { CameraStatus, ModerationState, StreamStatus } from '../events/types';

// Auth
export interface TwitchLoginResponse {
  login_url: string;
}

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  role: 'viewer' | 'streamer' | 'admin';
  created_at: string;
}

// Stream
export interface CreateStreamRequest {
  title: string;
  description?: string;
  twitch_channel?: string;
  max_cameras?: number;
}

export interface StreamResponse {
  id: string;
  broadcaster_id: string;
  title: string;
  description?: string;
  status: StreamStatus;
  stream_key: string;
  livekit_room_name: string;
  twitch_channel?: string;
  max_cameras: number;
  created_at: string;
  started_at?: string;
  ended_at?: string;
}

export interface StreamStatusResponse {
  stream: StreamResponse;
  active_viewers: number;
  cameras: CameraResponse[];
  sentinel_state: 'nominal' | 'alert' | 'error';
}

// Cameras
export interface RegisterCameraRequest {
  name: string;
  label: string;
  source_id: string;
  is_primary?: boolean;
  sort_order?: number;
  fallback_image_url?: string;
}

export interface CameraResponse {
  id: string;
  stream_id: string;
  name: string;
  label: string;
  source_id: string;
  rtmp_key: string;
  status: CameraStatus;
  moderation_state: ModerationState;
  is_primary: boolean;
  sort_order: number;
  fallback_image_url?: string;
  active_viewers?: number;
}

// Sentinel & Incidents
export interface IncidentResponse {
  id: string;
  camera_id: string;
  camera_label?: string;
  stream_id: string;
  category: string;
  subcategory?: string;
  confidence: number;
  action: 'allowed' | 'held' | 'blocked';
  model_id: string;
  details: Record<string, any>;
  frame_timestamp: number;
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface ModerationPolicyConfig {
  category: string;
  enabled: boolean;
  hold_threshold: number;
  block_threshold: number;
  auto_restore: boolean;
}

// Cafe Community
export interface JoinCommunityRequest {
  stream_id: string;
  interests?: string[];
  preferred_size?: number;
}

export interface CommunityResponse {
  id: string;
  stream_id: string;
  name: string;
  capacity: number;
  member_count: number;
  interests?: string[];
  members: Array<{
    user_id: string;
    username: string;
    avatar_url?: string;
    joined_at: string;
  }>;
}

export interface SendMessageRequest {
  community_id: string;
  message: string;
  message_type?: 'text' | 'reaction' | 'system';
}

// POV Selection
export interface SelectCameraRequest {
  stream_id: string;
  camera_id: string;
}

// LiveKit Access Token
export interface LiveKitTokenResponse {
  token: string;
  room_name: string;
  participant_identity: string;
  ws_url: string;
}
