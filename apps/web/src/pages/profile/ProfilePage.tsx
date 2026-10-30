import React, { useState } from 'react'
import { User, Heart, Sparkles, Save, CheckCircle } from 'lucide-react'
import { InterestSelector } from '../../components/community/InterestSelector'
import { useAuthStore } from '../../stores/authStore'
import { Button } from '../../components/ui/button'

export function ProfilePage() {
  const { user } = useAuthStore()
  const [interests, setInterests] = useState<string[]>([
    'Competitive Gaming',
    'Esports Analysis',
    'Tech & Audio Gear',
  ])
  const [preferredSize, setPreferredSize] = useState(4)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Viewing Profile & Preferences</h1>
        <p className="text-sm text-[#828399] mt-1">
          Customize your interest embeddings for AI Cafe matching and multi-POV stream preferences.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-[#11111a] border border-[#222230] space-y-6 shadow-xl">
        {/* User Card */}
        <div className="flex items-center gap-4 pb-6 border-b border-[#20202e]">
          <img
            src={user?.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=streamer'}
            alt="User"
            className="w-14 h-14 rounded-2xl border border-indigo-500/40"
          />
          <div>
            <h2 className="text-lg font-bold text-white">{user?.displayName || 'StageSide Broadcaster'}</h2>
            <span className="text-xs text-indigo-400 font-mono">@{user?.username || 'broadcaster'} • {user?.role || 'Streamer'}</span>
          </div>
        </div>

        {/* Interests */}
        <InterestSelector selectedInterests={interests} onChange={setInterests} />

        {/* Preferred Community Size */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-xs font-bold text-white">
            <span>Preferred Cafe Table Size</span>
            <span className="font-mono text-indigo-400">{preferredSize} People</span>
          </div>
          <input
            type="range"
            min="3"
            max="6"
            value={preferredSize}
            onChange={(e) => setPreferredSize(parseInt(e.target.value))}
            className="w-full accent-indigo-500 h-1.5 bg-[#202030] rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#636378] font-mono">
            <span>3 (Intimate Trio)</span>
            <span>4 (Standard)</span>
            <span>5 (Lively)</span>
            <span>6 (Full Table)</span>
          </div>
        </div>

        <div className="pt-4 border-t border-[#20202e] flex justify-end">
          <Button onClick={handleSave} className="gap-2 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs">
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saved ? 'Saved Preferences ✓' : 'Save Preferences'}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
