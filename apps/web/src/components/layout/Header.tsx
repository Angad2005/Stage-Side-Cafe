import React, { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Shield, Radio, Activity, LogOut } from 'lucide-react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { useAuthStore } from '../../stores/authStore'
import { useStreamStore } from '../../stores/streamStore'

export function Header() {
  const { user, token, fetchCurrentUser, logout } = useAuthStore()
  const { currentStream, emergencyLocked } = useStreamStore()
  const location = useLocation()
  const navigate = useNavigate()

  const handleSignOut = () => {
    logout()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    if (token && !user) void fetchCurrentUser()
  }, [token, user, fetchCurrentUser])

  return (
    <header className="h-16 border-b border-[#20202e] bg-[#0c0c14]/90 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">StageSide</span>
              <span className="font-light text-base text-indigo-400">Cafe</span>
            </div>
            <span className="text-[10px] text-[#717188] block -mt-1 font-mono">AI-First Stream Shield</span>
          </div>
        </Link>

        {currentStream && (
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-[#242436]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-white uppercase tracking-wider">LIVE</span>
            <span className="text-xs text-[#8f90a2] truncate max-w-xs">{currentStream.title}</span>
          </div>
        )}
      </div>

      <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141420] border border-[#252538]">
        <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
        <span className="text-xs font-semibold text-[#dedee8]">AI Sentinel:</span>
        <Badge variant={emergencyLocked ? 'unsafe' : 'safe'} className="py-0 text-[10px]">
          {emergencyLocked ? 'Emergency Lock' : 'Gate Active (3.0s buffer)'}
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        <Link to="/studio">
          <Button variant={location.pathname === '/studio' ? 'default' : 'outline'} size="sm" className="gap-1.5">
            <Radio className="w-3.5 h-3.5" />
            <span>Studio Mode</span>
          </Button>
        </Link>

        {user ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 pl-2 border-l border-[#242436]">
              <img
                src={user.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=streamer'}
                alt=""
                className="w-8 h-8 rounded-full border border-[#9146FF]/50"
              />
              <div className="hidden sm:block text-left">
                <span className="text-xs font-bold text-white block leading-tight">{user.displayName}</span>
                <span className="text-[10px] text-[#a970ff] uppercase font-mono">{user.role}</span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 border-[#3a2d47] text-[#d7c4e9] hover:bg-[#21192a] hover:text-white"
              onClick={handleSignOut}
              aria-label="Sign out of your Twitch account"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        ) : (
          <Link to="/login">
            <Button size="sm" className="gap-1.5 bg-[#9146FF] hover:bg-[#772ce8] text-white">
              <Radio className="w-3.5 h-3.5" />
              <span>Connect Twitch</span>
            </Button>
          </Link>
        )}
      </div>
    </header>
  )
}
