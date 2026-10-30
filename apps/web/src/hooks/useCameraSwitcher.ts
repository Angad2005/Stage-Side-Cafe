import { useEffect, useCallback } from 'react'
import { useStreamStore } from '../stores/streamStore'
import { api } from '../services/api'
import { ModerationState, Camera } from '../types'

export function useCameraSwitcher(streamId: string) {
  const {
    cameras,
    selectedCameraId,
    selectCamera: setStoreSelectedCamera,
    handleCameraBlocked,
    handleCameraRestored,
  } = useStreamStore()

  const selectedCamera = cameras.find((c) => c.id === selectedCameraId) || cameras[0]
  const isSelectedBlocked = selectedCamera?.moderationState !== ModerationState.SAFE
  const availableCameras = cameras.filter((c) => c.moderationState === ModerationState.SAFE)

  // Switch to camera
  const switchCamera = useCallback(
    async (cameraId: string) => {
      const target = cameras.find((c) => c.id === cameraId)
      if (!target) return

      // Invariant: Do not allow viewers to subscribe to raw or blocked sources
      if (target.moderationState !== ModerationState.SAFE) {
        console.warn(`[CameraSwitcher] Blocked camera ${cameraId} cannot be selected.`)
        return
      }

      setStoreSelectedCamera(cameraId)
      try {
        await api.selectCamera(streamId, cameraId)
      } catch (e) {
        // Optimistic switch is fine for local UI
      }
    },
    [cameras, setStoreSelectedCamera, streamId]
  )

  // Fallback to first safe camera if selected becomes unsafe
  useEffect(() => {
    if (isSelectedBlocked && availableCameras.length > 0) {
      console.warn(`[CameraSwitcher] Current camera ${selectedCamera?.label} is isolated. Auto-redirecting viewer to safe feed.`)
      const fallback = availableCameras.find((c) => c.isPrimary) || availableCameras[0]
      switchCamera(fallback.id)
    }
  }, [isSelectedBlocked, availableCameras, switchCamera, selectedCamera])

  return {
    cameras,
    selectedCamera,
    selectedCameraId,
    isSelectedBlocked,
    availableCameras,
    switchCamera,
    handleCameraBlocked,
    handleCameraRestored,
  }
}
