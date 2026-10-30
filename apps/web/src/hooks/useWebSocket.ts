import { useEffect } from 'react'
import { wsService } from '../services/websocket'
import { useStreamStore } from '../stores/streamStore'
import { useCommunityStore } from '../stores/communityStore'
import type { WSEvent } from '../types'

export function useWebSocket(streamId: string, token?: string | null) {
  const { handleCameraBlocked, handleCameraRestored, setEmergencyLock } = useStreamStore()
  const { addMessage } = useCommunityStore()

  useEffect(() => {
    if (!streamId) return

    wsService.connect(streamId, token)

    // Listen to camera blocked events
    const unsubBlocked = wsService.on('camera.blocked', (event: WSEvent) => {
      console.warn('[WS Event] Camera blocked:', event)
      handleCameraBlocked(event.camera_id, event.reason)
    })

    // Listen to camera restored events
    const unsubRestored = wsService.on('camera.restored', (event: WSEvent) => {
      console.log('[WS Event] Camera restored:', event)
      handleCameraRestored(event.camera_id)
    })

    // Listen to emergency lock
    const unsubEmergency = wsService.on('emergency.broadcast_locked', () => {
      console.error('[WS Event] Emergency broadcast locked!')
      setEmergencyLock(true)
    })

    // Listen to community chat messages
    const unsubChat = wsService.on('community.message', (event: WSEvent) => {
      addMessage({
        id: event.message_id || `msg_${Date.now()}`,
        communityId: event.community_id,
        userId: event.user_id,
        username: event.username,
        avatarUrl: event.avatar_url,
        message: event.message,
        messageType: event.message_type || 'text',
        createdAt: event.timestamp || new Date().toISOString(),
      })
    })

    return () => {
      unsubBlocked()
      unsubRestored()
      unsubEmergency()
      unsubChat()
    }
  }, [streamId, token, handleCameraBlocked, handleCameraRestored, setEmergencyLock, addMessage])
}
