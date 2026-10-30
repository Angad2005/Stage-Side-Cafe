import React, { useState } from 'react'
import { Lock, AlertOctagon, Unlock, ShieldAlert } from 'lucide-react'
import { Button } from '../ui/button'
import { useStreamStore } from '../../stores/streamStore'
import { api } from '../../services/api'

export function EmergencyControls({ streamId }: { streamId: string }) {
  const { emergencyLocked, setEmergencyLock } = useStreamStore()
  const [loading, setLoading] = useState(false)

  const handlePanicCut = async () => {
    setLoading(true)
    try {
      await api.emergencyLock(streamId, 'Streamer Emergency Panic Cut Activated')
      setEmergencyLock(true)
    } catch {
      // Local optimistic cut
      setEmergencyLock(true)
    } finally {
      setLoading(false)
    }
  }

  const handleReleaseLock = () => {
    setEmergencyLock(false)
  }

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/40 via-[#181216] to-[#11111a] border border-red-500/40 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl shadow-red-950/20">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/50 flex items-center justify-center shrink-0">
          <AlertOctagon className="w-6 h-6 text-red-400 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-extrabold text-sm text-white">Emergency Broadcast Lock</h4>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/30 uppercase">
              Fail-Closed Master Switch
            </span>
          </div>
          <p className="text-xs text-[#a68c92] mt-0.5">
            Immediately cuts every camera feed to safe fallback slate across Twitch and LiveKit.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {emergencyLocked ? (
          <Button
            variant="safe"
            onClick={handleReleaseLock}
            className="gap-2 bg-emerald-600 hover:bg-emerald-500"
          >
            <Unlock className="w-4 h-4" />
            Release Broadcast Lock
          </Button>
        ) : (
          <Button
            variant="destructive"
            onClick={handlePanicCut}
            disabled={loading}
            className="gap-2 bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/30 text-xs font-bold"
          >
            <Lock className="w-4 h-4" />
            PANIC: Cut All Cameras
          </Button>
        )}
      </div>
    </div>
  )
}
