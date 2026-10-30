import React from 'react'
import { Shield, Activity, Cpu, Clock, Layers } from 'lucide-react'
import { Badge } from '../ui/badge'

export function SentinelStatusPanel() {
  const modules = [
    { name: 'ONNX Visual Safety (Nudity/Sexuality)', latency: '12ms', status: 'optimal' },
    { name: 'Violence & Weapon Classifier', latency: '15ms', status: 'optimal' },
    { name: 'OCR Sensitive Privacy Engine', latency: '8ms', status: 'optimal' },
    { name: 'OpenAI Omni-Moderation (VLM verify)', latency: '180ms', status: 'active' },
    { name: 'Esports Context Protector', latency: '4ms', status: 'optimal' },
  ]

  return (
    <div className="p-5 rounded-2xl bg-[#11111a] border border-[#222230] space-y-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-[#20202e]">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-400" />
          <h3 className="font-extrabold text-sm text-white">AI Sentinel Engine Health</h3>
        </div>
        <Badge variant="safe" className="font-mono">
          Fail-Closed Gate Active
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-[#151522] border border-[#242436]">
          <span className="text-[10px] text-[#717188] uppercase font-mono block">Buffer Duration</span>
          <span className="text-lg font-extrabold text-white font-mono">3.00s</span>
          <span className="text-[10px] text-emerald-400 block mt-0.5">Pre-broadcast hold</span>
        </div>
        <div className="p-3 rounded-xl bg-[#151522] border border-[#242436]">
          <span className="text-[10px] text-[#717188] uppercase font-mono block">Inference Speed</span>
          <span className="text-lg font-extrabold text-white font-mono">34.2ms</span>
          <span className="text-[10px] text-[#717188] block mt-0.5">GPU TensorRT</span>
        </div>
        <div className="p-3 rounded-xl bg-[#151522] border border-[#242436]">
          <span className="text-[10px] text-[#717188] uppercase font-mono block">Sample Frequency</span>
          <span className="text-lg font-extrabold text-white font-mono">5.0 FPS</span>
          <span className="text-[10px] text-indigo-400 block mt-0.5">Per-camera feed</span>
        </div>
        <div className="p-3 rounded-xl bg-[#151522] border border-[#242436]">
          <span className="text-[10px] text-[#717188] uppercase font-mono block">Isolated POVs</span>
          <span className="text-lg font-extrabold text-emerald-400 font-mono">0 Clean</span>
          <span className="text-[10px] text-[#717188] block mt-0.5">All angles safe</span>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        <span className="text-xs font-bold text-[#828399] uppercase font-mono tracking-wider">
          Active Detection Modules
        </span>
        <div className="space-y-1.5">
          {modules.map((m) => (
            <div
              key={m.name}
              className="flex items-center justify-between p-2.5 rounded-lg bg-[#141420] border border-[#222234] text-xs"
            >
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[#dedee8] font-medium">{m.name}</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-[#6d6e82]">{m.latency}</span>
                <span className="text-emerald-400 font-bold uppercase">{m.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
