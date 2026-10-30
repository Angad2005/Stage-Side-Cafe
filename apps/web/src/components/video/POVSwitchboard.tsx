import React from 'react'
import { CameraCard } from './CameraCard'
import { useCameraSwitcher } from '../../hooks/useCameraSwitcher'
import { Layers, ShieldCheck } from 'lucide-react'

export function POVSwitchboard({ streamId }: { streamId: string }) {
  const { cameras, selectedCameraId, switchCamera } = useCameraSwitcher(streamId)

  return (
    <div className="w-full bg-[#11111a] border border-[#222230] rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#20202e]">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h3 className="font-extrabold text-sm text-white tracking-tight">POV Switchboard</h3>
          <span className="text-xs text-[#717188] hidden sm:inline">• Independent WebRTC camera selection</span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Centralized Safety Shield Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {cameras.map((camera) => (
          <CameraCard
            key={camera.id}
            camera={camera}
            isSelected={camera.id === selectedCameraId}
            onSelect={() => switchCamera(camera.id)}
          />
        ))}
      </div>
    </div>
  )
}
