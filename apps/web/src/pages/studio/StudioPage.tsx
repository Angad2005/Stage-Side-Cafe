import React, { useState } from 'react'
import {
  Radio,
  Camera,
  Shield,
  History,
  Coffee,
  BarChart3,
  Sliders,
  CheckCircle,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs'
import { StreamOverview } from '../../components/dashboard/StreamOverview'
import { CameraManager } from '../../components/dashboard/CameraManager'
import { AnalyticsPanel } from '../../components/dashboard/AnalyticsPanel'
import { SentinelStatusPanel } from '../../components/sentinel/SentinelStatusPanel'
import { PolicyEditor } from '../../components/sentinel/PolicyEditor'
import { IncidentHistory } from '../../components/sentinel/IncidentHistory'
import { EmergencyControls } from '../../components/sentinel/EmergencyControls'
import { TwitchConnectionCard } from '../../components/dashboard/TwitchConnectionCard'
import { Camera as CameraModel, ModerationEvent } from '../../types'

const MOCK_INCIDENTS: ModerationEvent[] = [
  {
    id: 'inc_001',
    cameraId: 'cam_guest',
    cameraLabel: 'Guest POV (B-Cam)',
    streamId: 'stageside_stream_001',
    category: 'visual_safety',
    subcategory: 'explicit_content_test_pattern',
    confidence: 0.96,
    action: 'blocked',
    modelId: 'onnx_visual_safety_v2',
    details: { reason: 'Test pattern triggered 3s rolling-buffer isolation gate' },
    frameTimestamp: Date.now() / 1000,
    resolved: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: 'inc_002',
    cameraId: 'cam_host',
    cameraLabel: 'Host POV (A-Cam)',
    streamId: 'stageside_stream_001',
    category: 'privacy',
    subcategory: 'exposed_phone_number',
    confidence: 0.89,
    action: 'blocked',
    modelId: 'ocr_privacy_engine',
    details: { reason: 'OCR detected live phone number on secondary monitor' },
    frameTimestamp: Date.now() / 1000,
    resolved: true,
    resolvedBy: 'usr_demo_streamer',
    resolvedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
  },
]

const INCIDENT_STORAGE_KEY = 'stageside_demo_incidents'

function loadIncidents(): ModerationEvent[] {
  try {
    const saved = localStorage.getItem(INCIDENT_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as ModerationEvent[]
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // Start with demo incidents if browser storage is unavailable.
  }
  return MOCK_INCIDENTS
}

export function StudioPage() {
  const [incidents, setIncidents] = useState<ModerationEvent[]>(loadIncidents)

  const persistIncidents = (updated: ModerationEvent[]) => {
    setIncidents(updated)
    try {
      localStorage.setItem(INCIDENT_STORAGE_KEY, JSON.stringify(updated))
    } catch {
      // Incident changes remain active for this visit if storage is unavailable.
    }
  }

  const handleResolveIncident = (id: string) => {
    persistIncidents(incidents.map((incident) =>
      incident.id === id
        ? { ...incident, resolved: true, resolvedAt: new Date().toISOString() }
        : incident
    ))
  }

  const handleSimulateCut = (camera: CameraModel) => {
    const now = new Date().toISOString()
    const incident: ModerationEvent = {
      id: `demo_inc_${Date.now()}`,
      cameraId: camera.id,
      cameraLabel: camera.label,
      streamId: camera.streamId,
      category: 'visual_safety',
      subcategory: 'simulated_test_cut',
      confidence: 0.99,
      action: 'blocked',
      modelId: 'stageside_demo_sentinel',
      details: { reason: 'Streamer triggered a demo cut to verify the safety workflow.' },
      frameTimestamp: Date.now() / 1000,
      resolved: false,
      createdAt: now,
    }
    persistIncidents([incident, ...incidents])
  }

  const handleRestoreCamera = (cameraId: string) => {
    persistIncidents(incidents.map((incident) =>
      incident.cameraId === cameraId && !incident.resolved
        ? { ...incident, resolved: true, resolvedAt: new Date().toISOString() }
        : incident
    ))
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Streamer Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-400" />
            <h1 className="text-2xl font-black text-white tracking-tight">Streamer Studio & Control Room</h1>
          </div>
          <p className="text-xs text-[#828399] mt-1 font-mono">
            Control Plane • Stream Configuration • Camera Switcher • AI Sentinel Policies
          </p>
        </div>
      </div>

      {/* Prominent Emergency Controls Bar */}
      <TwitchConnectionCard />
      <EmergencyControls streamId="stageside_stream_001" />

      {/* Studio Navigation Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-3 sm:grid-cols-6 h-auto p-1.5 gap-1 bg-[#12121d] border border-[#242436] rounded-2xl">
          <TabsTrigger value="overview" className="gap-2 py-2 text-xs">
            <Radio className="w-3.5 h-3.5" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="cameras" className="gap-2 py-2 text-xs">
            <Camera className="w-3.5 h-3.5" />
            <span>Cameras</span>
          </TabsTrigger>
          <TabsTrigger value="sentinel" className="gap-2 py-2 text-xs">
            <Shield className="w-3.5 h-3.5" />
            <span>AI Sentinel</span>
          </TabsTrigger>
          <TabsTrigger value="incidents" className="gap-2 py-2 text-xs">
            <History className="w-3.5 h-3.5" />
            <span>Incidents</span>
          </TabsTrigger>
          <TabsTrigger value="cafe" className="gap-2 py-2 text-xs">
            <Coffee className="w-3.5 h-3.5" />
            <span>Cafe Tables</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2 py-2 text-xs">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="space-y-6">
          <StreamOverview />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CameraManager onSimulateCut={handleSimulateCut} onRestore={handleRestoreCamera} />
            <SentinelStatusPanel />
          </div>
        </TabsContent>

        {/* Tab 2: Cameras */}
        <TabsContent value="cameras" className="space-y-6">
          <CameraManager onSimulateCut={handleSimulateCut} onRestore={handleRestoreCamera} />
        </TabsContent>

        {/* Tab 3: AI Sentinel */}
        <TabsContent value="sentinel" className="space-y-6">
          <SentinelStatusPanel />
          <PolicyEditor />
        </TabsContent>

        {/* Tab 4: Incidents */}
        <TabsContent value="incidents" className="space-y-6">
          <IncidentHistory incidents={incidents} onResolve={handleResolveIncident} />
        </TabsContent>

        {/* Tab 5: Cafe Management */}
        <TabsContent value="cafe" className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#11111a] border border-[#222230] space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#20202e]">
              <Coffee className="w-5 h-5 text-indigo-400" />
              <h3 className="font-extrabold text-sm text-white">Cafe Community Clustering Settings</h3>
            </div>
            <p className="text-xs text-[#8e8fa6] leading-relaxed">
              StageSide Cafe clusters viewers into small high-retention tables (3 to 6 viewers) using interest
              embeddings. Broadcasters can broadcast synchronized announcements or prompt topics to all tables simultaneously.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[#151522] border border-[#242436]">
                <span className="text-xs text-[#717188] font-mono block">Active Tables</span>
                <span className="text-2xl font-black text-white font-mono mt-1 block">236</span>
                <span className="text-xs text-indigo-400 mt-1 block">4.2 avg viewers / table</span>
              </div>
              <div className="p-4 rounded-xl bg-[#151522] border border-[#242436]">
                <span className="text-xs text-[#717188] font-mono block">Clustering Model</span>
                <span className="text-2xl font-black text-white font-mono mt-1 block">pgvector</span>
                <span className="text-xs text-emerald-400 mt-1 block">Cosine similarity matching</span>
              </div>
              <div className="p-4 rounded-xl bg-[#151522] border border-[#242436]">
                <span className="text-xs text-[#717188] font-mono block">Chat Sentiment</span>
                <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">94% Hype</span>
                <span className="text-xs text-[#717188] mt-1 block">Safe moderated chat</span>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 6: Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
