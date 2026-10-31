import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Share2 } from 'lucide-react'
import { VideoPlayer } from '../../components/video/VideoPlayer'
import { POVSwitchboard } from '../../components/video/POVSwitchboard'
import { CommunityPanel } from '../../components/community/CommunityPanel'
import { useCameraSwitcher } from '../../hooks/useCameraSwitcher'
import { useCommunityStore } from '../../stores/communityStore'
import { useAuthStore } from '../../stores/authStore'
import { useWebSocket } from '../../hooks/useWebSocket'
import { Button } from '../../components/ui/button'

export function ViewerPage() {
  const { streamId = 'stageside_stream_001' } = useParams()
  const { user } = useAuthStore()
  const { selectedCamera, switchCamera, availableCameras } = useCameraSwitcher(streamId)
  const { currentCommunity, messages, addMessage } = useCommunityStore()
  const [shareMessage, setShareMessage] = useState<string | null>(null)

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

  const handleShare = async () => {
    setShareMessage(null)
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'StageSide Cafe live stream',
          text: 'Join me in this StageSide Cafe multi-POV stream.',
          url,
        })
        setShareMessage('Stream link shared.')
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        setShareMessage('Stream link copied to clipboard.')
      } else {
        const copiedUrl = window.prompt('Copy this stream link:', url)
        setShareMessage(copiedUrl ? 'Stream link is ready to copy.' : 'Sharing cancelled.')
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      setShareMessage('Could not share automatically. Copy the URL from your browser address bar.')
    }
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <VideoPlayer selectedCamera={selectedCamera} onSwitchSafe={handleSwitchToSafe} />

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

            <div className="flex flex-col items-start sm:items-end gap-2">
              <Button type="button" size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => void handleShare()}>
                <Share2 className="w-3.5 h-3.5" />
                Share
              </Button>
              {shareMessage && <span role="status" className="text-[10px] text-indigo-300">{shareMessage}</span>}
            </div>
          </div>

          <POVSwitchboard streamId={streamId} />
        </div>

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
