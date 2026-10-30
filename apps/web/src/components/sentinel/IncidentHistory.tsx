import React, { useState } from 'react'
import { IncidentCard } from './IncidentCard'
import { ModerationEvent } from '../../types'
import { ShieldCheck, History } from 'lucide-react'

export function IncidentHistory({
  incidents,
  onResolve,
}: {
  incidents: ModerationEvent[]
  onResolve: (id: string) => void
}) {
  const [filter, setFilter] = useState<'all' | 'unresolved'>('all')

  const filtered = filter === 'unresolved' ? incidents.filter((i) => !i.resolved) : incidents

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-400" />
          <h3 className="font-bold text-sm text-white">AI Sentinel Incident Log</h3>
          <span className="text-xs text-[#717188] font-mono">({incidents.length} total events)</span>
        </div>

        <div className="flex items-center gap-1 bg-[#141420] p-1 rounded-lg border border-[#252538]">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition ${
              filter === 'all' ? 'bg-indigo-600 text-white' : 'text-[#828399] hover:text-white'
            }`}
          >
            All Logs
          </button>
          <button
            onClick={() => setFilter('unresolved')}
            className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition ${
              filter === 'unresolved' ? 'bg-indigo-600 text-white' : 'text-[#828399] hover:text-white'
            }`}
          >
            Pending Review
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 rounded-xl bg-[#11111a] border border-[#222230] text-center">
          <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-70" />
          <h4 className="font-bold text-sm text-white">No Safety Incidents</h4>
          <p className="text-xs text-[#7e7f96] mt-1">
            All camera feeds have passed automated rolling-buffer screening without violation.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((inc) => (
            <IncidentCard key={inc.id} incident={inc} onResolve={onResolve} />
          ))}
        </div>
      )}
    </div>
  )
}
