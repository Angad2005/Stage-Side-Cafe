import React, { useState } from 'react'
import { Sliders, Save, CheckCircle } from 'lucide-react'
import { ModerationPolicy } from '../../types'
import { Button } from '../ui/button'

const POLICY_STORAGE_KEY = 'stageside_moderation_policies'
const DEFAULT_POLICIES: ModerationPolicy[] = [
  { category: 'visual_safety', enabled: true, holdThreshold: 0.5, blockThreshold: 0.8 },
  { category: 'violence', enabled: true, holdThreshold: 0.6, blockThreshold: 0.85 },
  { category: 'privacy', enabled: true, holdThreshold: 0.4, blockThreshold: 0.7 },
  { category: 'dangerous_activity', enabled: true, holdThreshold: 0.5, blockThreshold: 0.8 },
]

function loadPolicies(): ModerationPolicy[] {
  try {
    const saved = localStorage.getItem(POLICY_STORAGE_KEY)
    const parsed = saved ? JSON.parse(saved) : null
    if (Array.isArray(parsed)) return parsed
  } catch {
    // Use defaults if saved demo settings are unavailable.
  }
  return DEFAULT_POLICIES
}

export function PolicyEditor({
  onSave,
}: {
  onSave?: (policies: ModerationPolicy[]) => void
}) {
  const [policies, setPolicies] = useState<ModerationPolicy[]>(loadPolicies)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updatePolicy = (category: string, updates: Partial<ModerationPolicy>) => {
    setPolicies((current) => current.map((policy) =>
      policy.category === category ? { ...policy, ...updates } : policy
    ))
    setSaved(false)
    setError(null)
  }

  const handleSave = () => {
    try {
      localStorage.setItem(POLICY_STORAGE_KEY, JSON.stringify(policies))
      onSave?.(policies)
      setSaved(true)
      setError(null)
      window.setTimeout(() => setSaved(false), 2500)
    } catch {
      setSaved(false)
      setError('Could not save policies in this browser.')
    }
  }

  return (
    <div className="p-5 rounded-2xl bg-[#11111a] border border-[#222230] space-y-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-[#20202e]">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h3 className="font-extrabold text-sm text-white">Moderation Sensitivity Thresholds</h3>
        </div>
        <Button size="sm" onClick={handleSave} className="gap-1.5 bg-indigo-600 hover:bg-indigo-500">
          {saved ? <CheckCircle className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          <span>{saved ? 'Saved ✓' : 'Save Policies'}</span>
        </Button>
      </div>
      {error && <p role="alert" className="text-xs text-amber-300">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {policies.map((policy) => (
          <div key={policy.category} className="p-4 rounded-xl bg-[#151522] border border-[#242436] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white capitalize">
                {policy.category.replace(/_/g, ' ')}
              </span>
              <label className="flex items-center gap-2 text-xs text-[#8e8fa6] cursor-pointer">
                <span>{policy.enabled ? 'Active' : 'Disabled'}</span>
                <input
                  type="checkbox"
                  checked={policy.enabled}
                  onChange={(event) => updatePolicy(policy.category, { enabled: event.target.checked })}
                  className="rounded border-[#3a3a52]"
                />
              </label>
            </div>

            {policy.enabled && (
              <div className="space-y-2 pt-1">
                <div>
                  <div className="flex justify-between text-[11px] text-[#7d7e95] mb-1 font-mono">
                    <span>Hold & Review Gate</span>
                    <span>{(policy.holdThreshold * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={policy.holdThreshold}
                    onChange={(event) => updatePolicy(policy.category, { holdThreshold: parseFloat(event.target.value) })}
                    className="w-full accent-amber-500 h-1 bg-[#252538] rounded-lg"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-[#7d7e95] mb-1 font-mono">
                    <span>Immediate Cut Gate</span>
                    <span>{(policy.blockThreshold * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={policy.blockThreshold}
                    onChange={(event) => updatePolicy(policy.category, { blockThreshold: parseFloat(event.target.value) })}
                    className="w-full accent-red-500 h-1 bg-[#252538] rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
