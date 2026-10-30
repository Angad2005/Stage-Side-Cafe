import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, Radio, ArrowRight } from 'lucide-react'
import { Button } from '../../components/ui/button'

export function LoginPage() {
  const handleTwitchLogin = () => {
    // In production redirects to Twitch OAuth URL
    window.location.href = '/auth/callback?code=mock_auth_code'
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6 text-[#ededed]">
      <div className="w-full max-w-md p-8 rounded-3xl bg-[#11111a] border border-[#222230] shadow-2xl space-y-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center mx-auto">
          <Shield className="w-7 h-7 text-indigo-400" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">StageSide Cafe</h1>
          <p className="text-xs text-[#8e8fa6] mt-1.5 leading-relaxed">
            Connect with Twitch to start multi-POV broadcasting with automated AI Sentinel pre-distribution protection.
          </p>
        </div>

        <Button
          onClick={handleTwitchLogin}
          className="w-full py-3 h-12 bg-[#9146FF] hover:bg-[#772ce8] text-white font-extrabold text-sm gap-2 shadow-xl shadow-[#9146FF]/25 cursor-pointer"
        >
          <Radio className="w-4 h-4" />
          <span>Connect with Twitch</span>
        </Button>

        <div className="pt-2 text-xs text-[#636378]">
          <Link to="/" className="text-indigo-400 hover:underline">
            Back to Explore Streams
          </Link>
        </div>
      </div>
    </div>
  )
}
