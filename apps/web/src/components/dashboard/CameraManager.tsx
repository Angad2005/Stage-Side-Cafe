import React, { useState } from 'react'
import { Camera, Plus, RefreshCw, Trash2, ShieldCheck, ShieldAlert } from 'lucide-react'
import { useStreamStore } from '../../stores/streamStore'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ModerationState, CameraStatus } from '../../types'

export function CameraManager() {
  const { cameras, updateCameraState, handleCameraRestored } = useStreamStore()

  const handleTestCut = (id: string) => {
    updateCameraState(id, {
      status: CameraStatus.BLOCKED,
      moderationState: ModerationState.UNSAFE,
    })
  }

  const handleApproveRestore = (id: string) => {
    handleCameraRestored(id)
  }

  return (
    <div className="p-5 rounded-2xl bg-[#11111a] border border-[#222230] space-y-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-[#20202e]">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-indigo-400" />
          <h3 className="font-extrabold text-sm text-white">Camera Sources & Ingest Keys</h3>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" />
          Add POV Feed
        </Button>
      </div>

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
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isSafe ? 'bg-indigo-600/20 text-indigo-400' : 'bg-red-600/20 text-red-400'
                  }`}
                >
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{cam.label}</span>
                    <Badge variant={isSafe ? 'safe' : 'unsafe'} className="py-0 text-[10px]">
                      {isSafe ? 'Screened Safe' : 'Isolated By Sentinel'}
                    </Badge>
                    {cam.isPrimary && (
                      <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase">
                        Primary Broadcast
                      </span>
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
                    className="text-xs text-red-300 hover:bg-red-950/40 hover:border-red-500/50"
                  >
                    Simulate AI Cut
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="safe"
                    onClick={() => handleApproveRestore(cam.id)}
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
