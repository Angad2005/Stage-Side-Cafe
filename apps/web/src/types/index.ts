export enum CameraStatus {
  OFFLINE = 'offline',
  ONLINE = 'online',
  BLOCKED = 'blocked',
  ERROR = 'error',
}

export enum ModerationState {
  SAFE = 'safe',
  SUSPICIOUS = 'suspicious',
  UNSAFE = 'unsafe',
  ERROR = 'error',
}

export enum StreamStatus {
  CREATED = 'created',
  CONFIGURING = 'configuring',
  LIVE = 'live',
  ENDED = 'ended',
}

export interface User {
  id: string
  username: string
  displayName: string
  avatarUrl?: string
  role: 'viewer' | 'streamer' | 'admin'
}

export interface Stream {
  id: string
  broadcasterId: string
  title: string
  description?: string
  status: StreamStatus
  streamKey: string
  livekitRoomName: string
  twitchChannel?: string
  maxCameras: number
  createdAt: string
  startedAt?: string
  endedAt?: string
}

export interface Camera {
  id: string
  streamId: string
  name: string
  label: string
  sourceId: string
  status: CameraStatus
  moderationState: ModerationState
  isPrimary: boolean
  sortOrder: number
  fallbackImageUrl?: string
  activeViewers?: number
}

export interface ModerationEvent {
  id: string
  cameraId: string
  cameraLabel?: string
  streamId: string
  category: string
  subcategory?: string
  confidence: number
  action: 'allowed' | 'held' | 'blocked'
  modelId: string
  details: Record<string, any>
  frameTimestamp: number
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: string
  createdAt: string
}

export interface ModerationPolicy {
  category: string
  enabled: boolean
  holdThreshold: number
  blockThreshold: number
  autoRestore?: boolean
}

export interface Community {
  id: string
  streamId: string
  name: string
  description?: string
  capacity: number
  memberCount: number
  members: CommunityMember[]
  isActive: boolean
}

export interface CommunityMember {
  userId: string
  username: string
  avatarUrl?: string
  joinedAt: string
}

export interface ChatMessage {
  id: string
  communityId: string
  userId: string
  username: string
  avatarUrl?: string
  message: string
  messageType: 'text' | 'reaction' | 'system'
  createdAt: string
}

export interface ViewerPreferences {
  interests: string[]
  preferredCommunitySize: number
}

export interface StreamAnalytics {
  streamId: string
  viewerCount: number
  peakViewers: number
  povSwitches: number
  cameraPopularity: Array<{
    cameraId: string
    label: string
    viewerCount: number
    percentage: number
  }>
}

export interface WSEvent {
  event: string
  stream_id: string
  timestamp: string
  [key: string]: any
}
