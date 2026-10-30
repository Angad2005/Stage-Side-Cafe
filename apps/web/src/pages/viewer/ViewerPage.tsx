import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { VideoPlayer } from '../../components/video/VideoPlayer'
import { POVSwitchboard } from '../../components/video/POVSwitchboard'
import { CommunityPanel } from '../../components/community/CommunityPanel'
import { useCameraSwitcher } from '../../hooks/useCameraSwitcher'
import { useCommunityStore } from '../../stores/communityStore'
import { useAuthStore } from '../../stores/authStore'
import { useWebSocket } from '../../hooks/useWebSocket'
import { Users, Shield, Share2, Sparkles, MessageCircle } from 'lucide-react'
import { Button } from '../../components/ui/button'

export function ViewerPage() {
  const { streamId = 'stageside_stream_001' } = useParams()
  const { user } = useAuthStore()
  const { selectedCamera, switchCamera, availableCameras } = useCameraSwitcher(streamId)
  const { currentCommunity, messages, addMessage } = useCommunityStore()

  // Real-time events connection
  useWebSocket(streamId)

  const handleSendMessage = (text: string) => {
    addMessage({
      id: `msg_${Date.now()}`,
      communityId: currentCommunity?.id || 'comm_default',
      userId: user?.id || 'usr_guest',
      username: user?.displayName || 'StageSide Viewer',
      avatarUrl: user?.avatarUrl,
      message: text,
      messageType: 'text',
      createdAt: new Date().toISOString(),
    })
  }

  const handleSwitchToSafe = () => {
    if (availableCameras.length > 0) {
      switchCamera(availableCameras[0].id)
    }
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      {/* Main Grid: Video & Switchboard (Left), Community & Chat (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Player & Switchboard */}
        <div className="lg:col-span-2 space-y-4">
          <VideoPlayer
            selectedCamera={selectedCamera}
            onSwitchSafe={handleSwitchToSafe}
          />

          {/* Stream title and Broadcaster metadata */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#11111a] border border-[#222230]">
            <div>
              <h1 className="text-lg font-extrabold text-white tracking-tight">
                VALORANT Champions Tour Finals — Watch Party & Multi-POV Lounge
              </h1>
              <div className="flex items-center gap-3 mt-1 text-xs text-[#8e8fa6]">
                <span className="font-semibold text-indigo-400">StageSide Broadcaster</span>
                <span>•</span>
                <span>VALORANT</span>
                <span>•</span>
                <span className="font-mono text-emerald-400">1,420 Viewers Synchronized</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                <Share2 className="w-3.5 h-3.5" />
                Share
              </Button>
            </div>
          </div>

          {/* POV Switchboard */}
          <POVSwitchboard streamId={streamId} />
        </div>

        {/* Right Column: Cafe Small Community & Synced Table Chat */}
        <div className="lg:col-span-1 min-h-[600px]">
          <CommunityPanel
            community={currentCommunity}
            messages={messages}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>
    </div>
  )
}
