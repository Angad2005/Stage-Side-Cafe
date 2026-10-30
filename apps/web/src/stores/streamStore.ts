import { create } from 'zustand'
import { Camera, CameraStatus, ModerationState, Stream, StreamStatus } from '../types'

interface StreamState {
  currentStream: Stream | null
  cameras: Camera[]
  selectedCameraId: string | null
  emergencyLocked: boolean
  sentinelStatus: 'nominal' | 'alert' | 'error'

  setStream: (stream: Stream) => void
  setCameras: (cameras: Camera[]) => void
  selectCamera: (cameraId: string) => void
  updateCameraState: (cameraId: string, updates: Partial<Camera>) => void
  handleCameraBlocked: (cameraId: string, reason?: string) => void
  handleCameraRestored: (cameraId: string) => void
  setEmergencyLock: (locked: boolean) => void
}

const DEFAULT_CAMERAS: Camera[] = [
  {
    id: 'cam_host',
    streamId: 'stageside_stream_001',
    name: 'camera_host',
    label: 'Host POV (A-Cam)',
    sourceId: 'obs_host',
    status: CameraStatus.ONLINE,
    moderationState: ModerationState.SAFE,
    isPrimary: true,
    sortOrder: 0,
    activeViewers: 820,
  },
  {
    id: 'cam_guest',
    streamId: 'stageside_stream_001',
    name: 'camera_guest',
    label: 'Guest POV (B-Cam)',
    sourceId: 'obs_guest',
    status: CameraStatus.ONLINE,
    moderationState: ModerationState.SAFE,
    isPrimary: false,
    sortOrder: 1,
    activeViewers: 390,
  },
  {
    id: 'cam_gameplay',
    streamId: 'stageside_stream_001',
    name: 'camera_gameplay',
    label: 'Direct Gameplay 4K',
    sourceId: 'obs_gameplay',
    status: CameraStatus.ONLINE,
    moderationState: ModerationState.SAFE,
    isPrimary: false,
    sortOrder: 2,
    activeViewers: 210,
  },
]

export const useStreamStore = create<StreamState>((set, get) => ({
  currentStream: {
    id: 'stageside_stream_001',
    broadcasterId: 'usr_demo_streamer',
    title: 'VALORANT Champions Tour Finals — Watch Party & Multi-POV Lounge',
    description: 'Switch between Host commentary, Guest analysis, and raw gameplay in high-FPS.',
    status: StreamStatus.LIVE,
    streamKey: 'live_valorant_2026',
    livekitRoomName: 'stageside_stream_001',
    twitchChannel: 'stageside_broadcaster',
    maxCameras: 6,
    createdAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
  },
  cameras: DEFAULT_CAMERAS,
  selectedCameraId: 'cam_host',
  emergencyLocked: false,
  sentinelStatus: 'nominal',

  setStream: (stream) => set({ currentStream: stream }),
  setCameras: (cameras) => set({ cameras }),
  selectCamera: (cameraId) => set({ selectedCameraId: cameraId }),

  updateCameraState: (cameraId, updates) => {
    set((state) => ({
      cameras: state.cameras.map((c) => (c.id === cameraId ? { ...c, ...updates } : c)),
    }))
  },

  handleCameraBlocked: (cameraId, reason) => {
    set((state) => {
      const updated = state.cameras.map((c) =>
        c.id === cameraId
          ? { ...c, status: CameraStatus.BLOCKED, moderationState: ModerationState.UNSAFE }
          : c
      )
      // If currently selected camera is blocked, automatically switch to first safe camera!
      let nextSelected = state.selectedCameraId
      if (state.selectedCameraId === cameraId) {
        const safeCam = updated.find((c) => c.moderationState === ModerationState.SAFE)
        if (safeCam) nextSelected = safeCam.id
      }
      return {
        cameras: updated,
        selectedCameraId: nextSelected,
      }
    })
  },

  handleCameraRestored: (cameraId) => {
    set((state) => ({
      cameras: state.cameras.map((c) =>
        c.id === cameraId
          ? { ...c, status: CameraStatus.ONLINE, moderationState: ModerationState.SAFE }
          : c
      ),
    }))
  },

  setEmergencyLock: (locked) => {
    set((state) => ({
      emergencyLocked: locked,
      cameras: locked
        ? state.cameras.map((c) => ({
            ...c,
            status: CameraStatus.BLOCKED,
            moderationState: ModerationState.UNSAFE,
          }))
        : state.cameras,
    }))
  },
}))
