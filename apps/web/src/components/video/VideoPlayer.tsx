import React, { useState } from 'react'
import { Camera, ModerationState } from '../../types'
import { BlockedOverlay } from './BlockedOverlay'
import { Volume2, VolumeX, Maximize2, ShieldCheck, Activity, Radio, Sparkles } from 'lucide-react'

interface VideoPlayerProps {
  selectedCamera: Camera
  onSwitchSafe: () => void
}

export function VideoPlayer({ selectedCamera, onSwitchSafe }: VideoPlayerProps) {
  const [muted, setMuted] = useState(true)
  const isBlocked = selectedCamera.moderationState !== ModerationState.SAFE

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#0a0a10] border border-[#222230] shadow-2xl flex flex-col justify-between group">
      {/* Simulation of Live Sanitized WebRTC feed */}
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#12121e] to-[#0c0c14]">
        {/* Animated video background simulator */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="text-center z-10 space-y-3 p-6">
          <div className="w-16 h-16 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mx-auto shadow-xl shadow-indigo-600/30">
            <Radio className="w-8 h-8 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400">
              LiveKit WebRTC POV Feed
            </span>
            <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1">
              {selectedCamera.label}
            </h2>
            <p className="text-xs text-[#8e8fa6] max-w-sm mx-auto mt-1">
              Sanitized 60 FPS media stream delivered from StageSide Media Gateway after AI Sentinel verification.
            </p>
          </div>
        </div>
      </div>

      {/* Top Stream HUD */}
      <div className="relative z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-extrabold tracking-wider uppercase flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            LIVE
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-semibold">
            {selectedCamera.label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>AI Sentinel Protected</span>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="relative z-20 flex items-center justify-between p-4 bg-gradient-to-t from-black/80 to-transparent opacity-90 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMuted(!muted)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <span className="text-xs text-[#9d9eb5] font-mono">1080p60 • Ultra-low Latency (WebRTC)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen()
              else document.documentElement.requestFullscreen()
            }}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Blocked Fallback Overlay when AI Sentinel isolates this camera */}
      {isBlocked && (
        <BlockedOverlay
          cameraLabel={selectedCamera.label}
          onSwitchSafe={onSwitchSafe}
        />
      )}
    </div>
  )
}
