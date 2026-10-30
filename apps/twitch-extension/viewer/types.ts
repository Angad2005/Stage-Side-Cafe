/**
 * Twitch Extension Helper type definitions.
 *
 * The Twitch Extensions Helper is loaded via a <script> tag and provides
 * the global `Twitch.ext` object for interacting with the Twitch platform.
 *
 * @see https://dev.twitch.tv/docs/extensions/reference/#helper-extensions
 */

declare global {
  interface Window {
    Twitch: {
      ext: TwitchExt
    }
  }
}

export interface TwitchExt {
  /** Called when the extension is authorized */
  onAuthorized: (callback: (auth: TwitchAuth) => void) => void

  /** Called when the extension context changes */
  onContext: (callback: (context: TwitchContext) => void) => void

  /** Called when there's an error */
  onError: (callback: (error: string) => void) => void

  /** Called when visibility changes */
  onVisibilityChanged: (
    callback: (isVisible: boolean, context: TwitchContext) => void
  ) => void

  /** Send a PubSub message to the extension */
  send: (target: string, contentType: string, message: string) => void

  /** Listen for PubSub messages */
  listen: (
    target: string,
    callback: (target: string, contentType: string, message: string) => void
  ) => void

  /** Unlisten from PubSub messages */
  unlisten: (
    target: string,
    callback: (target: string, contentType: string, message: string) => void
  ) => void

  /** Extension viewer features */
  viewer: {
    /** The opaque viewer ID */
    opaqueId: string
    /** The viewer's Twitch ID (if shared) */
    id?: string
    /** The viewer's role */
    role: string
    /** Whether the viewer has shared their identity */
    isLinked: boolean
  }

  /** Extension actions */
  actions: {
    /** Request identity sharing */
    requestIdShare: () => void
    /** Minimize the extension */
    minimize: () => void
    /** Follow the channel */
    followChannel: (channelName: string) => void
  }

  /** Extension feature flags */
  features: {
    /** Whether bits are enabled */
    isBitsEnabled: boolean
    /** Called when feature flags change */
    onChanged: (callback: (changes: string[]) => void) => void
  }
}

export interface TwitchAuth {
  /** The extension's client ID */
  clientId: string
  /** The JWT token for backend authentication */
  token: string
  /** The channel ID where the extension is active */
  channelId: string
  /** The user's ID (if authorized) */
  userId: string
  /** The Helix token for making API calls */
  helixToken: string
}

export interface TwitchContext {
  /** The mode of the extension (viewer, dashboard, config) */
  mode: 'viewer' | 'dashboard' | 'config'
  /** The extension's language */
  language: string
  /** The current theme */
  theme: 'light' | 'dark'
  /** Whether the stream is playing */
  isFullScreen: boolean
  /** Whether the player is muted */
  isMuted: boolean
  /** Whether the player is in theater mode */
  isTheatreMode: boolean
  /** The player's volume (0-1) */
  hlsLatencyBroadcaster: number
  /** Video resolution */
  displayResolution: string
  /** Bitrate */
  bitrate: number
  /** Buffer size */
  bufferSize: number
  /** Game being played */
  game: string
  /** Whether the user is a subscriber */
  arePlayerControlsVisible: boolean
}

export interface ExtensionPubSubMessage {
  type: string
  data: unknown
}

/** Camera status update message from the backend */
export interface CameraStatusMessage {
  type: 'camera_status'
  data: {
    camera_id: string
    status: 'safe' | 'suspicious' | 'unsafe' | 'error'
    label: string
  }
}

/** Available cameras update */
export interface CamerasUpdateMessage {
  type: 'cameras_update'
  data: {
    cameras: Array<{
      id: string
      label: string
      status: 'safe' | 'suspicious' | 'unsafe' | 'error'
      is_primary: boolean
    }>
  }
}

/** Incident notification */
export interface IncidentNotificationMessage {
  type: 'incident_notification'
  data: {
    camera_id: string
    camera_label: string
    category: string
    action: string
    timestamp: string
  }
}

export type StageSideMessage =
  | CameraStatusMessage
  | CamerasUpdateMessage
  | IncidentNotificationMessage
