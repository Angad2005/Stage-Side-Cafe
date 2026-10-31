import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { RefreshCw, Radio } from 'lucide-react'
import type { User } from '../../types'

export function CallbackPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [error, setError] = useState<string | null>(null)
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true
    const params = new URLSearchParams(window.location.hash.slice(1))
    const oauthError = params.get('error')
    if (oauthError) {
      setError(oauthError)
      window.history.replaceState(null, '', window.location.pathname)
      return
    }

    const token = params.get('access_token')
    const userParam = params.get('user')
    if (!token || !userParam) {
      navigate('/login', { replace: true })
      return
    }

    try {
      const user = JSON.parse(userParam) as User
      login(token, user)
      window.history.replaceState(null, '', window.location.pathname)
      navigate('/studio', { replace: true })
    } catch {
      setError('StageSide could not finish signing in. Please connect your Twitch account again.')
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [login, navigate])

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6 text-center text-[#ededed]">
        <Radio className="w-8 h-8 text-amber-300 mb-4" />
        <h2 className="text-lg font-bold text-white">Twitch connection could not finish</h2>
        <p role="alert" className="text-sm text-[#a4a5be] mt-2 max-w-md">{error}</p>
        <Link to="/login" className="mt-5 px-4 py-2.5 rounded-xl bg-[#9146FF] text-white text-sm font-bold hover:bg-[#772ce8]">
          Try connecting again
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6 text-center text-[#ededed]">
      <RefreshCw className="w-8 h-8 text-[#a970ff] animate-spin mb-4" />
      <h2 className="text-lg font-bold text-white">Connecting your Twitch channel...</h2>
      <p className="text-xs text-[#7e7f96] mt-1">Preparing your StageSide studio.</p>
    </div>
  )
}
