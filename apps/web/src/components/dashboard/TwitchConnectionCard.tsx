import React, { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Gamepad2, Radio, RefreshCw, Users } from 'lucide-react'
import { api } from '../../services/api'
import { useAuthStore } from '../../stores/authStore'

interface TwitchStatus {
  connected: boolean
  account: {
    login: string
    displayName: string
    profileImageUrl: string | null
    channelUrl: string
  } | null
  stream: {
    isLive: boolean
    title: string | null
    gameName: string | null
    viewerCount: number
    startedAt: string | null
    language: string | null
  } | null
}

export function TwitchConnectionCard() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [status, setStatus] = useState<TwitchStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    setError(null)
    try {
      setStatus(await api.getTwitchAccount())
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Twitch status is unavailable.')
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    void refresh()
  }, [refresh])

  if (!isAuthenticated) {
    return (
      <section className="rounded-2xl border border-[#9146FF]/30 bg-gradient-to-r from-[#21152f] via-[#17131f] to-[#11111a] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#9146FF]/20 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 text-[#b98cff]" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#b98cff]">Twitch channel</p>
              <h2 className="mt-1 text-lg font-extrabold text-white">Bring your live channel into the Cafe</h2>
              <p className="mt-1 max-w-xl text-sm text-[#a4a5be]">Connect with Twitch to show your real channel identity and live status in the StageSide studio.</p>
            </div>
          </div>
          <Link to="/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#9146FF] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#772ce8] whitespace-nowrap">
            Connect Twitch
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-[#29263a] bg-[#11111a] p-5 sm:p-6" aria-live="polite">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#9146FF]/15 border border-[#9146FF]/30 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5 text-[#b98cff]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs font-bold uppercase tracking-widest text-[#b98cff]">Twitch channel</p>
              {status?.connected && (
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  Connected
                </span>
              )}
              {status?.stream?.isLive && (
                <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">Live</span>
              )}
            </div>
            {status?.account ? (
              <a href={status.account.channelUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1.5 text-lg font-extrabold text-white hover:text-[#c6a5ff]">
                {status.account.displayName}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <h2 className="mt-1 text-lg font-extrabold text-white">Channel connection</h2>
            )}
            <p className="mt-1 text-sm text-[#a4a5be]">
              {status?.stream?.isLive
                ? status.stream.title
                : status?.connected
                  ? 'Connected and waiting for your next broadcast.'
                  : 'Connect the Twitch account you want to use for StageSide.'}
            </p>
            {error && <p role="alert" className="mt-2 text-xs text-amber-300">{error}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3 lg:pl-5 lg:border-l lg:border-[#29263a]">
          {status?.stream?.isLive ? (
            <>
              <div className="rounded-xl bg-[#171522] px-3 py-2 min-w-24">
                <div className="flex items-center gap-1.5 text-xs text-[#a4a5be]"><Users className="w-3.5 h-3.5" /> Viewers</div>
                <p className="mt-1 text-lg font-black text-white">{status.stream.viewerCount.toLocaleString()}</p>
              </div>
              {status.stream.gameName && (
                <div className="rounded-xl bg-[#171522] px-3 py-2 min-w-24">
                  <div className="flex items-center gap-1.5 text-xs text-[#a4a5be]"><Gamepad2 className="w-3.5 h-3.5" /> Playing</div>
                  <p className="mt-1 max-w-36 truncate text-sm font-bold text-white">{status.stream.gameName}</p>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl bg-[#171522] px-3 py-2">
              <p className="text-xs text-[#a4a5be]">Broadcast status</p>
              <p className="mt-1 text-sm font-bold text-white">{status?.connected ? 'Offline' : 'Not connected'}</p>
            </div>
          )}
          <button type="button" onClick={() => void refresh()} disabled={loading} aria-label="Refresh Twitch status" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#302b42] text-[#c7b3e8] hover:bg-[#201a2b] disabled:opacity-50">
            <RefreshCw className={loading ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
          </button>
        </div>
      </div>
      {status?.connected && !status.stream?.isLive && (
        <div className="mt-4 rounded-xl border border-[#29263a] bg-[#15131d] px-4 py-3 text-xs text-[#9292a8]">
          Your Twitch account is connected. StageSide checks Twitch for your live broadcast when you refresh this panel.
        </div>
      )}
      {!status?.connected && !loading && (
        <div className="mt-4">
          <Link to="/login" className="text-xs font-bold text-[#b98cff] hover:underline">Connect or reconnect Twitch</Link>
        </div>
      )}
    </section>
  )
}
