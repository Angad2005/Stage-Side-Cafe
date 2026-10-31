import React, { useCallback, useEffect, useState } from 'react'
import type {
  TwitchAuth,
  TwitchContext,
  StageSideMessage,
  CameraStatusMessage,
  CamerasUpdateMessage,
} from './types'
import {
  Camera,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  Users,
  ExternalLink,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CameraInfo {
  id: string
  label: string
  status: 'safe' | 'suspicious' | 'unsafe' | 'error'
  isPrimary: boolean
}

/* ------------------------------------------------------------------ */
/*  Status helpers                                                     */
/* ------------------------------------------------------------------ */

const STATUS_COLORS: Record<string, string> = {
  safe: 'bg-safe',
  suspicious: 'bg-suspicious',
  unsafe: 'bg-unsafe',
  error: 'bg-unsafe',
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  safe: <ShieldCheck className="w-3 h-3" />,
  suspicious: <AlertTriangle className="w-3 h-3" />,
  unsafe: <ShieldX className="w-3 h-3" />,
  error: <ShieldAlert className="w-3 h-3" />,
}

function StatusDot({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold text-white ${STATUS_COLORS[status] ?? 'bg-muted'}`}
    >
      {STATUS_ICONS[status]}
      {status.toUpperCase()}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/*  Camera button                                                      */
/* ------------------------------------------------------------------ */

function CameraButton({
  camera,
  isSelected,
  onSelect,
}: {
  camera: CameraInfo
  isSelected: boolean
  onSelect: () => void
}) {
  const isAvailable = camera.status === 'safe'

  return (
    <button
      onClick={isAvailable ? onSelect : undefined}
      disabled={!isAvailable}
      className={`
        w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
        transition-all duration-200 border
        ${
          isSelected
            ? 'border-primary bg-primary/20 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]'
            : isAvailable
              ? 'border-border bg-card hover:bg-card/80 hover:border-primary/50 text-foreground cursor-pointer'
              : 'border-border/50 bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60'
        }
      `}
    >
      <Camera className="w-4 h-4 shrink-0" />
      <span className="truncate flex-1 text-left">{camera.label}</span>
      <StatusDot status={camera.status} />
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Extension Panel                                               */
/* ------------------------------------------------------------------ */

function getConfiguredCameras(): Array<{
  id: string
  label: string
  sourceId: string
  isPrimary: boolean
}> {
  try {
    const content = window.Twitch?.ext.configuration.broadcaster?.content
    if (!content) return []
    const data = JSON.parse(content)
    return Array.isArray(data.cameras) ? data.cameras : []
  } catch {
    return []
  }
}

export default function ViewerPanel() {
  const [auth, setAuth] = useState<TwitchAuth | null>(null)
  const [_context, setContext] = useState<TwitchContext | null>(null)
  const [cameras, setCameras] = useState<CameraInfo[]>([
    { id: 'cam_host', label: 'Host POV (A-Cam)', status: 'safe', isPrimary: true },
    { id: 'cam_guest', label: 'Guest POV (B-Cam)', status: 'safe', isPrimary: false },
    { id: 'cam_gameplay', label: 'Gameplay POV', status: 'safe', isPrimary: false },
  ])
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>('cam_host')
  const [sentinelActive, setSentinelActive] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [isStandaloneDemo, setIsStandaloneDemo] = useState(false)

  // ── Twitch Extension lifecycle ──────────────────────────────────
  useEffect(() => {
    if (!window.Twitch?.ext) {
      // Standalone browser preview mode for demos
      setIsStandaloneDemo(true)
      return
    }

    window.Twitch.ext.onAuthorized((authData) => {
      setAuth(authData)
      // Fetch initial camera list from the StageSide backend
      fetchCameras(authData)
    })

    window.Twitch.ext.onContext((ctx) => {
      setContext(ctx)
    })

    window.Twitch.ext.onError((err) => {
      console.error('[StageSide Extension] Error:', err)
      setError(err)
    })
  }, [])

  // ── PubSub listener for real-time updates ───────────────────────
  useEffect(() => {
    if (!window.Twitch?.ext) return

    const handler = (_target: string, _contentType: string, message: string) => {
      try {
        const parsed: StageSideMessage = JSON.parse(message)

        switch (parsed.type) {
          case 'camera_status': {
            const msg = parsed as CameraStatusMessage
            setCameras((prev) =>
              prev.map((c) =>
                c.id === msg.data.camera_id
                  ? { ...c, status: msg.data.status }
                  : c
              )
            )

            // If the selected camera becomes unsafe, auto-switch
            if (
              msg.data.status === 'unsafe' &&
              msg.data.camera_id === selectedCameraId
            ) {
              setNotification(
                `${msg.data.label} was blocked by AI Sentinel. Switching to a safe camera.`
              )
              autoSwitchToSafe()
              setTimeout(() => setNotification(null), 5000)
            }
            break
          }

          case 'cameras_update': {
            const msg = parsed as CamerasUpdateMessage
            setCameras(
              msg.data.cameras.map((c) => ({
                id: c.id,
                label: c.label,
                status: c.status,
                isPrimary: c.is_primary,
              }))
            )
            break
          }

          case 'incident_notification': {
            setNotification(
              `AI Sentinel detected a ${parsed.data.category} issue on ${parsed.data.camera_label}`
            )
            setTimeout(() => setNotification(null), 5000)
            break
          }
        }
      } catch (e) {
        console.error('[StageSide Extension] Failed to parse PubSub message', e)
      }
    }

    window.Twitch.ext.listen('broadcast', handler)
    return () => {
      window.Twitch.ext.unlisten('broadcast', handler)
    }
  }, [selectedCameraId])

  // ── Fetch cameras from StageSide backend ────────────────────────
  const fetchCameras = useCallback(async (authData: TwitchAuth) => {
    try {
      const backendUrl =
        import.meta.env.VITE_STAGESIDE_API_URL || 'https://api.stageside.cafe'

      const res = await fetch(
        `${backendUrl}/api/v1/streams/by-channel/${authData.channelId}/cameras`,
        {
          headers: {
            Authorization: `Bearer ${authData.token}`,
            'X-Extension-Client-Id': authData.clientId,
          },
        }
      )

      if (!res.ok) {
        // Stream may not be active yet
        if (res.status === 404) {
          setCameras(getConfiguredCameras().map((camera) => ({
            id: camera.id,
            label: camera.label,
            status: 'error',
            isPrimary: camera.isPrimary,
          })))
          return
        }
        throw new Error(`Failed to fetch cameras: ${res.status}`)
      }

      const data = await res.json()
      setCameras(
        data.cameras.map(
        (camera: { id: string; label: string; source_id: string; moderation_state: string; is_primary: boolean }) => {
          const configured = getConfiguredCameras().find(
            (item) => item.sourceId?.toLowerCase() === camera.source_id?.toLowerCase()
          )
          return {
            id: camera.id,
            label: configured?.label || camera.label,
            status: camera.moderation_state as CameraInfo['status'],
            isPrimary: configured?.isPrimary ?? camera.is_primary,
          }
        }
      )
      )

      // Select primary camera by default
      const primary = data.cameras.find((c: { is_primary: boolean }) => c.is_primary)
      if (primary) setSelectedCameraId(primary.id)
    } catch (err) {
      console.error('[StageSide Extension] Failed to fetch cameras:', err)
    }
  }, [])

  // ── Select camera via StageSide backend ─────────────────────────
  const selectCamera = useCallback(
    async (cameraId: string) => {
      setSelectedCameraId(cameraId)
      if (!auth) return

      try {
        const backendUrl =
          import.meta.env.VITE_STAGESIDE_API_URL || 'https://api.stageside.cafe'

        await fetch(`${backendUrl}/api/v1/viewers/select-camera`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,
          },
          body: JSON.stringify({
            stream_id: auth.channelId,
            camera_id: cameraId,
          }),
        })
      } catch (err) {
        console.error('[StageSide Extension] Failed to select camera:', err)
      }
    },
    [auth]
  )

  // ── Auto-switch to nearest safe camera ──────────────────────────
  const autoSwitchToSafe = useCallback(() => {
    const safeCameras = cameras.filter((c) => c.status === 'safe')
    if (safeCameras.length > 0) {
      const primary = safeCameras.find((c) => c.isPrimary)
      selectCamera((primary ?? safeCameras[0]).id)
    }
  }, [cameras, selectCamera])

  // ── Open full StageSide viewer ──────────────────────────────────
  const openStageSideViewer = () => {
    const channelId = auth?.channelId || 'stageside_stream_001'
    const viewerUrl =
      import.meta.env.VITE_STAGESIDE_VIEWER_URL || 'https://stageside.cafe'
    window.open(
      `${viewerUrl}/watch/${encodeURIComponent(channelId)}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  // ── Render ──────────────────────────────────────────────────────
  const safeCameraCount = cameras.filter((c) => c.status === 'safe').length

  return (
    <div className="w-full h-full bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="font-bold text-sm">StageSide</span>
          {isStandaloneDemo && (
            <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded border border-primary/30">
              Demo Preview
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${sentinelActive ? 'bg-safe animate-pulse' : 'bg-muted'}`}
          />
          <span className="text-[10px] text-muted-foreground">
            {sentinelActive ? 'Sentinel Active' : 'Sentinel Inactive'}
          </span>
        </div>
      </div>

      {/* Notification banner */}
      {notification && (
        <div className="px-3 py-2 bg-destructive/20 border-b border-destructive/30 text-xs text-destructive flex items-center gap-2">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Camera list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            POV Switchboard
          </h3>
          <span className="text-[10px] text-muted-foreground">
            {safeCameraCount}/{cameras.length} safe
          </span>
        </div>

        {cameras.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-xs">
            <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No active cameras</p>
            <p className="mt-1">Waiting for stream to start...</p>
          </div>
        ) : (
          cameras.map((camera) => (
            <CameraButton
              key={camera.id}
              camera={camera}
              isSelected={camera.id === selectedCameraId}
              onSelect={() => selectCamera(camera.id)}
            />
          ))
        )}
      </div>

      {/* Footer actions */}
      <div className="px-3 py-2 border-t border-border space-y-2">
        {/* Open full viewer */}
        <button
          onClick={openStageSideViewer}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
            bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors"
        >
          <Users className="w-3 h-3" />
          Open StageSide Cafe
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 bg-background/90 flex items-center justify-center p-4">
          <div className="text-center">
            <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-destructive" />
            <p className="text-sm font-medium">Extension Error</p>
            <p className="text-xs text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  )
}
