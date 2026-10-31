import React, { useEffect, useState } from 'react'
import { Heart, Save, CheckCircle } from 'lucide-react'
import { InterestSelector } from '../../components/community/InterestSelector'
import { useAuthStore } from '../../stores/authStore'
import { Button } from '../../components/ui/button'
import { api } from '../../services/api'

const PREFERENCES_KEY = 'stageside_viewer_preferences'
const DEFAULT_INTERESTS = ['Competitive Gaming', 'Esports Analysis', 'Tech & Audio Gear']

function loadSavedPreferences() {
  try {
    const saved = localStorage.getItem(PREFERENCES_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as { interests?: string[]; preferredCommunitySize?: number }
      return {
        interests: Array.isArray(parsed.interests) ? parsed.interests : DEFAULT_INTERESTS,
        preferredSize: Math.min(6, Math.max(3, Number(parsed.preferredCommunitySize) || 4)),
      }
    }
  } catch {
    // Use defaults if browser storage is unavailable.
  }
  return { interests: DEFAULT_INTERESTS, preferredSize: 4 }
}

export function ProfilePage() {
  const { user } = useAuthStore()
  const [initial] = useState(loadSavedPreferences)
  const [interests, setInterests] = useState<string[]>(initial.interests)
  const [preferredSize, setPreferredSize] = useState(initial.preferredSize)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    void api.getPreferences().then((preferences) => {
      if (cancelled) return
      setInterests(preferences.interests)
      setPreferredSize(preferences.preferredCommunitySize)
      try {
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
      } catch {
        // Account values still populate the form if storage is unavailable.
      }
    }).catch(() => {
      // Device preferences remain available when account sync is unavailable.
    })
    return () => { cancelled = true }
  }, [user?.id])

  const handleSave = async () => {
    const preferences = { interests, preferredCommunitySize: preferredSize }
    let storedLocally = false
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
      storedLocally = true
    } catch {
      // Keep going so an authenticated user can still save to the server.
    }

    setSaving(true)
    setSaved(false)
    setSaveMessage(null)
    try {
      if (user) {
        await api.updatePreferences(preferences)
        setSaveMessage(storedLocally
          ? 'Preferences saved to your account and this device.'
          : 'Preferences saved to your account.')
      } else if (storedLocally) {
        setSaveMessage('Preferences saved on this device. Connect Twitch to sync them to your account.')
      } else {
        setSaveMessage('Browser storage is unavailable, so these preferences could not be saved.')
        return
      }
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2000)
    } catch {
      setSaveMessage(storedLocally
        ? 'Saved on this device. Account sync failed; check your connection and try again.'
        : 'Account sync failed and browser storage is unavailable.')
    } finally {
      setSaving(false)
    }
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

        <InterestSelector selectedInterests={interests} onChange={setInterests} />

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

        <div className="pt-4 border-t border-[#20202e] flex flex-col items-end gap-2">
          {saveMessage && <p role="status" className="text-xs text-[#a4a5be]">{saveMessage}</p>}
          <Button onClick={() => void handleSave()} disabled={saving} className="gap-2 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs">
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving...' : saved ? 'Saved Preferences ✓' : 'Save Preferences'}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
