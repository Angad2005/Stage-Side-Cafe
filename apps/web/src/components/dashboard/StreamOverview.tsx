import React from 'react'
import { Radio, Users, Shield, Layers, Camera, AlertTriangle } from 'lucide-react'
import { Badge } from '../ui/badge'
import { useStreamStore } from '../../stores/streamStore'

export function StreamOverview() {
  const { currentStream, cameras, emergencyLocked } = useStreamStore()

  const safeCams = cameras.filter((c) => c.status === 'online').length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="p-5 rounded-2xl bg-[#11111a] border border-[#222230] shadow-lg flex items-center justify-between">
        <div>
          <span className="text-xs text-[#717188] uppercase font-mono tracking-wider block">Live Status</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xl font-extrabold text-white">BROADCASTING</span>
          </div>
          <span className="text-xs text-indigo-400 mt-1 block">Twitch & LiveKit SFU</span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center">
          <Radio className="w-6 h-6 text-indigo-400" />
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-[#11111a] border border-[#222230] shadow-lg flex items-center justify-between">
        <div>
          <span className="text-xs text-[#717188] uppercase font-mono tracking-wider block">Active Viewers</span>
          <div className="text-xl font-extrabold text-white mt-1">1,420</div>
          <span className="text-xs text-[#717188] mt-1 block">Peak: 1,890 viewers</span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center">
          <Users className="w-6 h-6 text-violet-400" />
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-[#11111a] border border-[#222230] shadow-lg flex items-center justify-between">
        <div>
          <span className="text-xs text-[#717188] uppercase font-mono tracking-wider block">Multi-POV Cameras</span>
          <div className="text-xl font-extrabold text-white mt-1">
            {safeCams}/{cameras.length} Online
          </div>
          <span className="text-xs text-emerald-400 mt-1 block">All sanitized tracks active</span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-600/15 border border-emerald-500/30 flex items-center justify-center">
          <Camera className="w-6 h-6 text-emerald-400" />
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-[#11111a] border border-[#222230] shadow-lg flex items-center justify-between">
        <div>
          <span className="text-xs text-[#717188] uppercase font-mono tracking-wider block">Content Protection</span>
          <div className="text-xl font-extrabold text-white mt-1">
            {emergencyLocked ? 'EMERGENCY CUT' : 'AI SENTINEL SAFE'}
          </div>
          <span className="text-xs text-emerald-400 mt-1 block">Zero escape rate</span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-600/15 border border-emerald-500/30 flex items-center justify-center">
          <Shield className="w-6 h-6 text-emerald-400" />
        </div>
      </div>
    </div>
  )
}
