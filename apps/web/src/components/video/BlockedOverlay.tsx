import React from 'react'
import { ShieldAlert, RefreshCw, Radio } from 'lucide-react'
import { Button } from '../ui/button'

interface BlockedOverlayProps {
  cameraLabel: string
  reason?: string
  onSwitchSafe: () => void
}

export function BlockedOverlay({ cameraLabel, reason, onSwitchSafe }: BlockedOverlayProps) {
  return (
    <div className="absolute inset-0 bg-red-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 animate-in fade-in duration-300 border border-red-500/50">
      <div className="w-16 h-16 rounded-2xl bg-red-900/60 border border-red-500/50 flex items-center justify-center mb-4 shadow-xl shadow-red-500/20">
        <ShieldAlert className="w-9 h-9 text-red-400 animate-pulse" />
      </div>

      <span className="text-xs font-mono font-bold tracking-widest text-red-400 uppercase mb-1">
        AI Sentinel Isolation Active
      </span>
      <h3 className="text-xl font-extrabold text-white mb-2 tracking-tight">
        {cameraLabel} Suspended
      </h3>

      <p className="text-sm text-red-200/80 max-w-md mb-6 leading-relaxed">
        {reason ||
          'Potential visual safety or sensitive privacy content was isolated in the pre-broadcast rolling buffer before reaching the stream.'}
      </p>

      <div className="flex items-center gap-3">
        <Button variant="default" onClick={onSwitchSafe} className="gap-2 bg-indigo-600 hover:bg-indigo-500">
          <Radio className="w-4 h-4" />
          Switch to Safe Angle (Host POV)
        </Button>
      </div>

      <div className="mt-8 text-[11px] text-red-300/60 font-mono">
        StageSide Cafe Fail-Closed Protection • Host and other POV feeds continue broadcasting unaffected
      </div>
    </div>
  )
}
