import React, { useEffect, useState, useCallback } from 'react'
import type { TwitchAuth } from '../viewer/types'
import {
  Shield,
  Camera,
  Save,
  Plus,
  Trash2,
  Settings,
  AlertTriangle,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CameraConfig {
  id: string
  name: string
  label: string
  sourceId: string
  isPrimary: boolean
  sortOrder: number
}

interface PolicyConfig {
  category: string
  enabled: boolean
  holdThreshold: number
  blockThreshold: number
}

const DEFAULT_POLICIES: PolicyConfig[] = [
  { category: 'visual_safety', enabled: true, holdThreshold: 0.5, blockThreshold: 0.8 },
  { category: 'violence', enabled: true, holdThreshold: 0.6, blockThreshold: 0.85 },
  { category: 'privacy', enabled: true, holdThreshold: 0.4, blockThreshold: 0.7 },
  { category: 'dangerous_activity', enabled: true, holdThreshold: 0.5, blockThreshold: 0.8 },
]

/* ------------------------------------------------------------------ */
/*  Configuration Panel                                                */
/* ------------------------------------------------------------------ */

export default function ConfigPanel() {
  const [auth, setAuth] = useState<TwitchAuth | null>(null)
  const [cameras, setCameras] = useState<CameraConfig[]>([])
  const [policies, setPolicies] = useState<PolicyConfig[]>(DEFAULT_POLICIES)
  const [activeTab, setActiveTab] = useState<'cameras' | 'sentinel'>('cameras')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (window.Twitch?.ext) {
      window.Twitch.ext.onAuthorized((authData) => {
        setAuth(authData)
        loadConfig(authData)
      })
    }
  }, [])

  const loadConfig = async (authData: TwitchAuth) => {
    try {
      const backendUrl =
        import.meta.env.VITE_STAGESIDE_API_URL || 'https://api.stageside.cafe'
      const res = await fetch(
        `${backendUrl}/api/v1/twitch/extension/config`,
        {
          headers: {
            Authorization: `Bearer ${authData.token}`,
          },
        }
      )
      if (res.ok) {
        const data = await res.json()
        if (data.cameras) setCameras(data.cameras)
        if (data.policies) setPolicies(data.policies)
      }
    } catch (err) {
      console.error('[StageSide Config] Failed to load config:', err)
    }
  }

  const saveConfig = useCallback(async () => {
    if (!auth) return
    setSaving(true)

    try {
      const backendUrl =
        import.meta.env.VITE_STAGESIDE_API_URL || 'https://api.stageside.cafe'
      await fetch(`${backendUrl}/api/v1/twitch/extension/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ cameras, policies }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('[StageSide Config] Failed to save config:', err)
    } finally {
      setSaving(false)
    }
  }, [auth, cameras, policies])

  const addCamera = () => {
    const newCamera: CameraConfig = {
      id: `cam_${Date.now()}`,
      name: `camera_${cameras.length + 1}`,
      label: `Camera ${cameras.length + 1}`,
      sourceId: '',
      isPrimary: cameras.length === 0,
      sortOrder: cameras.length,
    }
    setCameras([...cameras, newCamera])
  }

  const removeCamera = (id: string) => {
    setCameras(cameras.filter((c) => c.id !== id))
  }

  const updateCamera = (id: string, updates: Partial<CameraConfig>) => {
    setCameras(cameras.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  }

  const updatePolicy = (category: string, updates: Partial<PolicyConfig>) => {
    setPolicies(
      policies.map((p) => (p.category === category ? { ...p, ...updates } : p))
    )
  }

  return (
    <div className="w-full min-h-screen bg-background text-foreground p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="font-bold text-lg">StageSide Cafe Configuration</h1>
        </div>
        <button
          onClick={saveConfig}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
            bg-primary hover:bg-primary/90 text-white transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Configuration'}
        </button>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 border-b border-border">
        <button
          onClick={() => setActiveTab('cameras')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'cameras'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Camera className="w-4 h-4 inline mr-2" />
          Cameras
        </button>
        <button
          onClick={() => setActiveTab('sentinel')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'sentinel'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          AI Sentinel Policies
        </button>
      </div>

      {/* Cameras tab */}
      {activeTab === 'cameras' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Configure your camera sources for multi-POV streaming.
            </p>
            <button
              onClick={addCamera}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                bg-card hover:bg-card/80 border border-border transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add Camera
            </button>
          </div>

          {cameras.map((camera) => (
            <div
              key={camera.id}
              className="p-4 rounded-lg border border-border bg-card space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={camera.label}
                    onChange={(e) =>
                      updateCamera(camera.id, { label: e.target.value })
                    }
                    className="bg-transparent border-none text-sm font-medium outline-none"
                    placeholder="Camera label"
                  />
                </div>
                <button
                  onClick={() => removeCamera(camera.id)}
                  className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Source ID
                  </label>
                  <input
                    type="text"
                    value={camera.sourceId}
                    onChange={(e) =>
                      updateCamera(camera.id, { sourceId: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-md bg-muted border border-border text-sm outline-none focus:border-primary"
                    placeholder="e.g., obs_camera_1"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={camera.name}
                    onChange={(e) =>
                      updateCamera(camera.id, { name: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-md bg-muted border border-border text-sm outline-none focus:border-primary"
                    placeholder="camera_host"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={camera.isPrimary}
                  onChange={(e) =>
                    updateCamera(camera.id, { isPrimary: e.target.checked })
                  }
                  className="rounded border-border"
                />
                Primary camera (shown by default)
              </label>
            </div>
          ))}

          {cameras.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Camera className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No cameras configured</p>
              <p className="text-xs mt-1">
                Click "Add Camera" to set up your multi-POV streams
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sentinel policies tab */}
      {activeTab === 'sentinel' && (
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-suspicious/10 border border-suspicious/20">
            <AlertTriangle className="w-4 h-4 text-suspicious mt-0.5 shrink-0" />
            <p className="text-xs text-suspicious">
              These thresholds control when AI Sentinel holds or blocks a camera.
              Lower thresholds are more aggressive (more false positives).
              Higher thresholds are more permissive (may miss violations).
            </p>
          </div>

          {policies.map((policy) => (
            <div
              key={policy.category}
              className="p-4 rounded-lg border border-border bg-card space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">
                  {policy.category.replace(/_/g, ' ')}
                </span>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <span className="text-muted-foreground">
                    {policy.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <input
                    type="checkbox"
                    checked={policy.enabled}
                    onChange={(e) =>
                      updatePolicy(policy.category, {
                        enabled: e.target.checked,
                      })
                    }
                    className="rounded border-border"
                  />
                </label>
              </div>

              {policy.enabled && (
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Hold threshold</span>
                      <span>{(policy.holdThreshold * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={policy.holdThreshold}
                      onChange={(e) =>
                        updatePolicy(policy.category, {
                          holdThreshold: parseFloat(e.target.value),
                        })
                      }
                      className="w-full h-1 rounded-full appearance-none bg-suspicious/30 accent-suspicious"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Block threshold</span>
                      <span>{(policy.blockThreshold * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={policy.blockThreshold}
                      onChange={(e) =>
                        updatePolicy(policy.category, {
                          blockThreshold: parseFloat(e.target.value),
                        })
                      }
                      className="w-full h-1 rounded-full appearance-none bg-unsafe/30 accent-unsafe"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
