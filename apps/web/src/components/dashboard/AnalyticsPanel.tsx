import React from 'react'
import { BarChart3, TrendingUp, Layers, Users } from 'lucide-react'

export function AnalyticsPanel() {
  const cameraStats = [
    { label: 'Host POV (A-Cam)', viewers: 738, share: 52, color: 'bg-indigo-500' },
    { label: 'Guest POV (B-Cam)', viewers: 398, share: 28, color: 'bg-violet-500' },
    { label: 'Direct Gameplay 4K', viewers: 284, share: 20, color: 'bg-emerald-500' },
  ]

  return (
    <div className="p-5 rounded-2xl bg-[#11111a] border border-[#222230] space-y-5 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-[#20202e]">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          <h3 className="font-extrabold text-sm text-white">Multi-POV Engagement Analytics</h3>
        </div>
        <span className="text-xs text-[#717188] font-mono">Live Session Data</span>
      </div>

      <div className="space-y-4">
        <span className="text-xs font-bold text-[#828399] uppercase font-mono tracking-wider block">
          Audience Distribution Across Camera Angles
        </span>

        {cameraStats.map((item) => (
          <div key={item.label} className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-white">{item.label}</span>
              <span className="text-[#8e8fa6] font-mono">
                {item.viewers} viewers ({item.share}%)
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[#181827] overflow-hidden">
              <div
                className={`h-full ${item.color} rounded-full transition-all duration-500`}
                style={{ width: `${item.share}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-[#20202e] grid grid-cols-2 gap-3 text-center">
        <div className="p-3 rounded-xl bg-[#151522] border border-[#242436]">
          <span className="text-[10px] text-[#717188] uppercase font-mono block">Total POV Switches</span>
          <span className="text-xl font-extrabold text-white font-mono mt-0.5 block">345</span>
          <span className="text-[10px] text-emerald-400 block mt-0.5">High Viewer Agency</span>
        </div>
        <div className="p-3 rounded-xl bg-[#151522] border border-[#242436]">
          <span className="text-[10px] text-[#717188] uppercase font-mono block">Cafe Retention Boost</span>
          <span className="text-xl font-extrabold text-white font-mono mt-0.5 block">+38%</span>
          <span className="text-[10px] text-indigo-400 block mt-0.5">Small-table community lift</span>
        </div>
      </div>
    </div>
  )
}
