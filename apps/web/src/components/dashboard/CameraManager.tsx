import React, { useState } from 'react'
import { Camera, Plus, RefreshCw, X } from 'lucide-react'
import { useStreamStore } from '../../stores/streamStore'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ModerationState, CameraStatus, Camera as CameraType } from '../../types'

export function CameraManager({ onSimulateCut, onRestore }: { onSimulateCut?: (camera: CameraType) => void; onRestore?: (cameraId: string) => void }) {
  const { currentStream, cameras, emergencyLocked, addCamera, updateCameraState, handleCameraRestored } = useStreamStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [label, setLabel] = useState('')
  const [sourceId, setSourceId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const maxCameras = currentStream?.maxCameras ?? 6

  const handleTestCut = (id: string) => {
    if (emergencyLocked) return
    updateCameraState(id, {
      status: CameraStatus.BLOCKED,
      moderationState: ModerationState.UNSAFE,
    })
    const camera = cameras.find((item) => item.id === id)
    if (camera) onSimulateCut?.(camera)
  }

  const handleApproveRestore = (id: string) => {
    if (emergencyLocked) return
    handleCameraRestored(id)
    onRestore?.(id)
  }

  const handleAddCamera = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (emergencyLocked) {
      setError('Release the emergency broadcast lock before adding a camera.')
      return
    }
    const nextLabel = label.trim()
    const nextSourceId = sourceId.trim()
    if (cameras.length >= maxCameras) {
      setError(`This stream is limited to ${maxCameras} camera feeds.`)
      return
    }
    if (!nextLabel || !nextSourceId) {
      setError('Enter a feed label and source ID.')
      return
    }
    if (cameras.some((camera) => camera.sourceId.toLowerCase() === nextSourceId.toLowerCase())) {
      setError('That source ID is already in use.')
      return
    }

    const id = `cam_${Math.random().toString(36).slice(2, 10)}`
    const camera: CameraType = {
      id,
      streamId: currentStream?.id || 'stageside_stream_001',
      name: nextSourceId.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      label: nextLabel,
      sourceId: nextSourceId,
      status: CameraStatus.ONLINE,
      moderationState: ModerationState.SAFE,
      isPrimary: cameras.length === 0,
      sortOrder: cameras.length,
      activeViewers: 0,
    }
    addCamera(camera)
    setLabel('')
    setSourceId('')
    setError(null)
    setShowAddForm(false)
  }

  return (
    <div className="p-5 rounded-2xl bg-[#11111a] border border-[#222230] space-y-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-[#20202e]">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-indigo-400" />
          <h3 className="font-extrabold text-sm text-white">Camera Sources & Ingest Keys</h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs"
          onClick={() => { setError(null); setShowAddForm(true) }}
          disabled={emergencyLocked || cameras.length >= maxCameras}
        >
          <Plus className="w-3.5 h-3.5" />
          {cameras.length >= maxCameras ? 'Camera limit reached' : 'Add POV Feed'}
        </Button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddCamera} className="rounded-xl border border-indigo-500/30 bg-[#151522] p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-white">Add a camera POV</h4>
              <p className="mt-1 text-xs text-[#9292a8]">Adds a simulated online feed to this studio demo. Real OBS ingest needs the media gateway.</p>
            </div>
            <button
              type="button"
              aria-label="Close add feed form"
              onClick={() => setShowAddForm(false)}
              className="rounded-lg p-1 text-[#9292a8] hover:bg-[#222230] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs text-[#a4a5be]">
              Feed label
              <input
                autoFocus
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="Guest POV (C-Cam)"
                className="w-full rounded-lg border border-[#303046] bg-[#0c0c14] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
            </label>
            <label className="space-y-1 text-xs text-[#a4a5be]">
              Source ID
              <input
                value={sourceId}
                onChange={(event) => setSourceId(event.target.value)}
                placeholder="obs_guest_2"
                className="w-full rounded-lg border border-[#303046] bg-[#0c0c14] px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
              />
            </label>
          </div>
          {error && <p role="alert" className="text-xs text-amber-300">{error}</p>}
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={emergencyLocked} className="bg-indigo-600 hover:bg-indigo-500">Add simulated feed</Button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {cameras.map((cam) => {
          const isSafe = cam.moderationState === ModerationState.SAFE
          return (
            <div
              key={cam.id}
              className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                isSafe ? 'bg-[#151522] border-[#252538]' : 'bg-red-950/30 border-red-500/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isSafe ? 'bg-indigo-600/20 text-indigo-400' : 'bg-red-600/20 text-red-400'
                }`}>
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-white">{cam.label}</span>
                    <Badge variant={isSafe ? 'safe' : 'unsafe'} className="py-0 text-[10px]">
                      {isSafe ? 'Screened Safe' : 'Isolated By Sentinel'}
                    </Badge>
                    {cam.isPrimary && (
                      <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase">Primary Broadcast</span>
                    )}
                  </div>
                  <span className="text-xs text-[#7d7e95] font-mono mt-0.5 block">
                    Source: {cam.sourceId} • Ingest RTMP Key: cam_key_{cam.id.slice(0, 8)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                {isSafe ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestCut(cam.id)}
                    disabled={emergencyLocked}
                    className="text-xs text-red-300 hover:bg-red-950/40 hover:border-red-500/50"
                  >
                    Simulate AI Cut
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="safe"
                    onClick={() => handleApproveRestore(cam.id)}
                    disabled={emergencyLocked}
                    className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Approve & Restore Feed
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
