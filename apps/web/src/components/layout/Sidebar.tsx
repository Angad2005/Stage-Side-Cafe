import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Compass, Video, Radio, Users, Settings, ShieldCheck, Heart } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Sidebar() {
  const location = useLocation()

  const links = [
    { to: '/', label: 'Explore Feeds', icon: Compass },
    { to: '/watch/stageside_stream_001', label: 'Multi-POV Watch', icon: Video },
    { to: '/studio', label: 'Streamer Studio', icon: Radio },
    { to: '/communities', label: 'Cafe Tables', icon: Users },
    { to: '/profile', label: 'My Interests', icon: Heart },
  ]

  return (
    <aside className="w-64 border-r border-[#20202e] bg-[#0c0c14] hidden md:flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-6">
        <div>
          <span className="text-[11px] font-bold text-[#62627a] uppercase tracking-wider px-3 block mb-2 font-mono">
            Platform Navigation
          </span>
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon
              const active = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
                    active
                      ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
                      : 'text-[#8f90a2] hover:bg-[#161622] hover:text-[#dedee8]'
                  )}
                >
                  <Icon className={cn('w-4 h-4', active ? 'text-indigo-400' : 'text-[#717188]')} />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Feature badge */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950/40 to-transparent border border-indigo-500/20">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Pre-Broadcast Safety</span>
          </div>
          <p className="text-[11px] text-[#8e8fa6] leading-relaxed">
            AI Sentinel buffers & classifies each camera POV before distribution. Blocked angles never reach viewers.
          </p>
        </div>
      </div>

      <div className="p-3 border-t border-[#1e1e2d] text-center">
        <span className="text-[10px] text-[#55556c] font-mono block">StageSide Cafe v1.0</span>
        <span className="text-[10px] text-[#55556c] block">Twitch Hackathon Edition</span>
      </div>
    </aside>
  )
}
