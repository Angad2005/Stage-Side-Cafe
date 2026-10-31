import React, { useEffect, useRef, useState } from 'react'
import type { TwitchAuth, CameraStatusMessage } from '../viewer/types'
import { Shield, Camera, AlertTriangle, Activity, Lock, RefreshCw, Eye } from 'lucide-react'

interface StreamStatus {
  isLive: boolean
  viewerCount: number
  activePov: string
  sentinelStatus: 'nominal' | 'alert' | 'error'
  cameras: Array<{
    id: string
    label: string
    status: 'safe' | 'suspicious' | 'unsafe' | 'error'
    currentFps: number
  }>
}

export default function DashboardView() {
  const [auth, setAuth] = useState<TwitchAuth | null>(null)
  const [status, setStatus] = useState<StreamStatus>({
    isLive: true,
    viewerCount: 1420,
    activePov: 'cam_host',
    sentinelStatus: 'nominal',
    cameras: [
      { id: 'cam_host', label: 'Host POV (A-Cam)', status: 'safe', currentFps: 60 },
      { id: 'cam_guest', label: 'Guest POV (B-Cam)', status: 'safe', currentFps: 60 },
      { id: 'cam_gameplay', label: 'Gameplay Feed', status: 'safe', currentFps: 60 },
    ],
  })
  const [emergencyLocked, setEmergencyLocked] = useState(false)
  const cameraStatesBeforeEmergency = useRef<StreamStatus['cameras'] | null>(null)

  useEffect(() => {
    if (window.Twitch?.ext) {
      window.Twitch.ext.onAuthorized((authData) => {
        setAuth(authData)
      })
    }
  }, [])

  const handleRestore = (camId: string) => {
    setStatus((prev) => ({
      ...prev,
      cameras: prev.cameras.map((c) =>
        c.id === camId ? { ...c, status: 'safe' } : c
      ),
    }))
  }

  const handleSimulateCut = (camId: string) => {
    setStatus((prev) => ({
      ...prev,
      cameras: prev.cameras.map((c) =>
        c.id === camId ? { ...c, status: 'unsafe' } : c
      ),
    }))
  }

  const toggleEmergencyLock = () => {
    if (!emergencyLocked) {
      cameraStatesBeforeEmergency.current = status.cameras.map((camera) => ({ ...camera }))
      setStatus((current) => ({
        ...current,
        cameras: current.cameras.map((camera) => ({ ...camera, status: 'unsafe' })),
      }))
      setEmergencyLocked(true)
      return
    }

    const previousCameras = cameraStatesBeforeEmergency.current
    if (previousCameras) {
      setStatus((current) => ({
        ...current,
        cameras: current.cameras.map((camera) => {
          const previous = previousCameras.find((item) => item.id === camera.id)
          return previous ? { ...camera, status: previous.status } : camera
        }),
      }))
    }
    cameraStatesBeforeEmergency.current = null
    setEmergencyLocked(false)
  }

  return (
    <div className="w-full min-h-screen bg-[#0a0a0f] text-[#ededed] p-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#27272a] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-500" />
          <h1 className="font-bold text-sm tracking-wide uppercase">StageSide Live Studio</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${status.isLive ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
          <span className="text-xs font-semibold uppercase">{status.isLive ? 'LIVE' : 'OFFLINE'}</span>
          <span className="text-xs text-zinc-400 ml-2">👁️ {status.viewerCount.toLocaleString()} viewers</span>
        </div>
      </div>

      {/* Emergency Lock Alert */}
      {emergencyLocked && (
        <div className="mb-4 p-3 bg-red-950/80 border border-red-500/50 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
            <Lock className="w-4 h-4" />
            <span>EMERGENCY BROADCAST LOCK ACTIVE: All external feeds are isolated with slate.</span>
          </div>
          <button
            onClick={toggleEmergencyLock}
            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded"
          >
            Release Lock
          </button>
        </div>
      )}

      {/* Camera Live Monitor Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {status.cameras.map((cam) => {
          const isSafe = cam.status === 'safe'
          return (
            <div
              key={cam.id}
              className={`p-3 rounded-lg border transition-all ${
                isSafe
                  ? 'bg-[#111118] border-[#27272a]'
                  : 'bg-red-950/30 border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-zinc-400" />
                  <span className="text-xs font-semibold">{cam.label}</span>
                </div>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    isSafe ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {cam.status}
                </span>
              </div>

              {/* Video placeholder slate */}
              <div className="h-28 bg-[#18181b] rounded flex flex-col items-center justify-center border border-zinc-800 text-zinc-400 text-xs relative overflow-hidden">
                {isSafe ? (
                  <>
                    <Activity className="w-5 h-5 text-emerald-400 mb-1" />
                    <span className="text-[11px] text-zinc-300">Sanitized Stream Active</span>
                    <span className="text-[10px] text-zinc-500">{cam.currentFps} FPS | Buffer: 2.8s</span>
                  </>
                ) : (
                  <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center text-red-300 p-2 text-center">
                    <AlertTriangle className="w-6 h-6 text-red-400 mb-1 animate-bounce" />
                    <span className="text-xs font-bold">ISOLATED BY SENTINEL</span>
                    <span className="text-[9px] text-red-200/70 mt-0.5">Automated Fallback Slate Displayed</span>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="mt-2.5 flex items-center justify-between gap-2">
                {!isSafe ? (
                  <button
                    onClick={() => handleRestore(cam.id)}
                    disabled={emergencyLocked}
                    className="w-full flex items-center justify-center gap-1 py-1 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Approve & Restore Feed
                  </button>
                ) : (
                  <button
                    onClick={() => handleSimulateCut(cam.id)}
                    disabled={emergencyLocked}
                    className="w-full py-1 px-2 bg-zinc-800 hover:bg-red-900/40 hover:text-red-300 text-zinc-400 rounded text-[11px] border border-zinc-700/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Test Safe Cut
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Global Actions */}
      <div className="flex items-center justify-between p-3 bg-[#111118] border border-[#27272a] rounded-lg">
        <div>
          <span className="text-xs font-semibold text-zinc-300 block">AI Sentinel Moderation Gate</span>
          <span className="text-[11px] text-zinc-500">
            Pre-broadcast rolling buffer screening all incoming feeds. Safe fail-closed architecture.
          </span>
        </div>
        <button
          onClick={toggleEmergencyLock}
          className={`px-4 py-2 text-xs font-bold rounded flex items-center gap-1.5 transition ${
            emergencyLocked
              ? 'bg-zinc-700 text-zinc-200'
              : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30'
          }`}
        >
          <Lock className="w-4 h-4" />
          {emergencyLocked ? 'Unlock Stream' : 'Panic: Cut All Cameras'}
        </button>
      </div>
    </div>
  )
}
