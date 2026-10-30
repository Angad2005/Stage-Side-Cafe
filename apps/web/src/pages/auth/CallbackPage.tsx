import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { RefreshCw } from 'lucide-react'

export function CallbackPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  useEffect(() => {
    // Simulate successful OAuth exchange
    setTimeout(() => {
      login('demo_token_authenticated', {
        id: 'usr_demo_streamer',
        username: 'stageside_broadcaster',
        displayName: 'StageSide Broadcaster',
        role: 'streamer',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=streamer',
      })
      navigate('/studio')
    }, 1200)
  }, [login, navigate])

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6 text-center text-[#ededed]">
      <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
      <h2 className="text-lg font-bold text-white">Completing Twitch Authorization...</h2>
      <p className="text-xs text-[#7e7f96] mt-1">Connecting your channel and preparing AI Sentinel pipelines.</p>
    </div>
  )
}
