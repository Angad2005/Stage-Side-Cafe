import React from 'react'
import { Camera, ShieldCheck, ShieldAlert, Users, Radio } from 'lucide-react'
import { Badge } from '../ui/badge'
import { ModerationState, Camera as CameraType } from '../../types'
import { cn } from '../../lib/utils'

interface CameraCardProps {
  camera: CameraType
  isSelected: boolean
  onSelect: () => void
}

export function CameraCard({ camera, isSelected, onSelect }: CameraCardProps) {
  const isSafe = camera.moderationState === ModerationState.SAFE

  return (
    <button
      onClick={isSafe ? onSelect : undefined}
      disabled={!isSafe}
      className={cn(
        'group relative w-full text-left rounded-xl p-3 border transition-all duration-200 flex flex-col justify-between overflow-hidden',
        isSelected
          ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-600/20 ring-1 ring-indigo-500'
          : isSafe
          ? 'bg-[#141420] border-[#252538] hover:border-indigo-500/50 hover:bg-[#181827] cursor-pointer'
          : 'bg-red-950/20 border-red-500/40 cursor-not-allowed opacity-75'
      )}
    >
      {/* Top row: Label & Status Badge */}
      <div className="flex items-center justify-between w-full mb-2">
        <div className="flex items-center gap-2">
          <Camera className={cn('w-4 h-4', isSelected ? 'text-indigo-400' : 'text-[#8f90a2]')} />
          <span className="font-bold text-xs text-white tracking-tight">{camera.label}</span>
        </div>
        <Badge variant={isSafe ? 'safe' : 'unsafe'} className="py-0 text-[10px]">
          {isSafe ? 'SAFE' : 'ISOLATED'}
        </Badge>
      </div>

      {/* Simulated thumbnail view */}
      <div className="w-full h-20 rounded-lg bg-[#0e0e17] border border-[#20202e] flex items-center justify-center relative overflow-hidden mb-2">
        {isSafe ? (
          <div className="flex flex-col items-center justify-center text-center p-2">
            <Radio className={cn('w-5 h-5 mb-1', isSelected ? 'text-indigo-400 animate-pulse' : 'text-[#62627a]')} />
            <span className="text-[10px] text-[#8e8fa6] font-mono">Sanitized WebRTC Track</span>
          </div>
        ) : (
          <div className="absolute inset-0 bg-red-950/80 flex flex-col items-center justify-center p-2 text-center text-red-300">
            <ShieldAlert className="w-5 h-5 text-red-400 mb-0.5" />
            <span className="text-[10px] font-bold">Safe Fallback Active</span>
          </div>
        )}

        {isSelected && isSafe && (
          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[9px] font-bold font-mono">
            ACTIVE POV
          </span>
        )}
      </div>

      {/* Bottom info */}
      <div className="flex items-center justify-between text-[11px] text-[#787890] w-full">
        <span className="font-mono text-[10px]">{camera.isPrimary ? 'Primary Broadcast' : 'Multi-POV Angle'}</span>
        <div className="flex items-center gap-1 font-mono">
          <Users className="w-3 h-3" />
          <span>{camera.activeViewers || 340}</span>
        </div>
      </div>
    </button>
  )
}
