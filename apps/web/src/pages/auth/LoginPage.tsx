import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Radio } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { api } from '../../services/api'

export function LoginPage() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTwitchLogin = async () => {
    setError(null)
    setIsConnecting(true)
    try {
      const { login_url, configured } = await api.getTwitchLoginUrl()
      if (!configured) {
        setError('Add TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET to the project .env file, then restart the API.')
        setIsConnecting(false)
        return
      }
      window.location.assign(login_url)
    } catch {
      setError('Could not reach the StageSide API. Start the API service and try again.')
      setIsConnecting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6 text-[#ededed]">
      <div className="w-full max-w-md p-8 rounded-3xl bg-[#11111a] border border-[#222230] shadow-2xl space-y-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#9146FF]/15 border border-[#9146FF]/40 flex items-center justify-center mx-auto">
          <Shield className="w-7 h-7 text-[#a970ff]" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">StageSide Cafe</h1>
          <p className="text-xs text-[#8e8fa6] mt-2 leading-relaxed">
            Connect your Twitch channel to bring its live status into your multi-POV studio.
          </p>
        </div>

        <Button
          onClick={handleTwitchLogin}
          disabled={isConnecting}
          className="w-full py-3 h-12 bg-[#9146FF] hover:bg-[#772ce8] text-white font-extrabold text-sm gap-2 shadow-xl shadow-[#9146FF]/25 disabled:opacity-60"
        >
          <Radio className="w-4 h-4" />
          <span>{isConnecting ? 'Opening Twitch...' : 'Connect with Twitch'}</span>
        </Button>

        {error && (
          <p role="alert" className="text-xs leading-relaxed text-amber-300 bg-amber-400/10 border border-amber-400/20 rounded-xl p-3">
            {error}
          </p>
        )}

        <div className="pt-2 text-xs text-[#636378]">
          <Link to="/" className="text-indigo-400 hover:underline">
            Back to Explore Streams
          </Link>
        </div>
      </div>
    </div>
  )
}
