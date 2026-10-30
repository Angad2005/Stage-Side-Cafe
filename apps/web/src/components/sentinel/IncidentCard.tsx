import React from 'react'
import { ShieldAlert, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react'
import { ModerationEvent } from '../../types'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

interface IncidentCardProps {
  incident: ModerationEvent
  onResolve: (id: string) => void
}

export function IncidentCard({ incident, onResolve }: IncidentCardProps) {
  return (
    <div className="p-4 rounded-xl bg-[#141420] border border-[#252538] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-red-950/60 border border-red-500/40 flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-xs text-white capitalize">
              {incident.category.replace(/_/g, ' ')}
            </span>
            <Badge variant="unsafe" className="text-[10px] py-0 font-mono">
              {(incident.confidence * 100).toFixed(0)}% Confidence
            </Badge>
            <span className="text-[10px] text-[#717188] font-mono">
              {new Date(incident.createdAt).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-xs text-[#a0a1b6]">
            Isolated feed on <strong className="text-white">{incident.cameraLabel || incident.cameraId}</strong>. Action: {incident.action}.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {incident.resolved ? (
          <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold font-mono">
            <CheckCircle className="w-3.5 h-3.5" />
            Resolved
          </span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onResolve(incident.id)}
            className="text-xs h-8 gap-1.5 hover:border-emerald-500/50 hover:text-emerald-300"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Mark Resolved
          </Button>
        )}
      </div>
    </div>
  )
}
