import React from 'react'
import { Link } from 'react-router-dom'
import { Radio, Users, Camera, ShieldCheck, Sparkles } from 'lucide-react'
import { Badge } from '../../components/ui/badge'

export function ExplorePage() {
  const streams = [
    {
      id: 'stageside_stream_001',
      title: 'VALORANT Champions Tour Finals — Watch Party & Multi-POV Lounge',
      broadcaster: 'StageSide Host',
      game: 'VALORANT',
      viewers: 1420,
      camerasCount: 3,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=streamer',
      tags: ['Competitive Gaming', 'Multi-POV', 'AI Sentinel'],
    },
    {
      id: 'stream_apex_002',
      title: 'Apex Legends Predator Rank Push • Host & Secondary Squad Cams',
      broadcaster: 'ApexOverlord',
      game: 'Apex Legends',
      viewers: 890,
      camerasCount: 2,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=apex',
      tags: ['Esports Analysis', 'High FPS'],
    },
    {
      id: 'stream_speedrun_003',
      title: 'Elden Ring Any% Speedrun Marathon — Handcam & Split Screen',
      broadcaster: 'SpeedyKnight',
      game: 'Elden Ring',
      viewers: 540,
      camerasCount: 4,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=elden',
      tags: ['Speedrunning', 'Behind the Scenes'],
    },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden p-8 md:p-12 bg-gradient-to-r from-indigo-950 via-[#141424] to-[#0d0d16] border border-indigo-500/30 shadow-2xl">
        <div className="max-w-2xl space-y-4">
          <Badge variant="safe" className="py-1 px-3 text-xs gap-1.5 font-mono">
            <ShieldCheck className="w-4 h-4" />
            AI-Protected Multi-Camera Livestreams
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Every Angle. Your Community. One Safer Stream.
          </h1>
          <p className="text-[#a4a5be] text-sm md:text-base leading-relaxed">
            Welcome to StageSide Cafe. Switch between Host, Guest, and Gameplay feeds seamlessly with zero
            interruption, while AI Sentinel protects your viewing experience before broadcast.
          </p>
          <div className="pt-2">
            <Link
              to="/watch/stageside_stream_001"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              Watch Live Stream Now
            </Link>
          </div>
        </div>
      </div>

      {/* Streams Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-white">Live Multi-POV Broadcasts</h2>
            <p className="text-xs text-[#717188] mt-0.5">Explore active streams enabled with independent camera switching</p>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-bold">● 3 STREAMS LIVE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {streams.map((stream) => (
            <Link
              key={stream.id}
              to={`/watch/${stream.id}`}
              className="group block rounded-2xl bg-[#11111a] border border-[#222230] overflow-hidden hover:border-indigo-500/50 hover:shadow-xl transition-all duration-300"
            >
              {/* Thumbnail preview */}
              <div className="relative aspect-video bg-[#151524] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                <div className="flex flex-col items-center justify-center text-center p-4 z-0">
                  <Radio className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform mb-1 opacity-80" />
                  <span className="text-xs font-mono text-[#8a8ba0]">{stream.game}</span>
                </div>

                {/* Badges */}
                <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-extrabold tracking-wider uppercase">
                    LIVE
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white text-[10px] font-mono flex items-center gap-1">
                    <Camera className="w-3 h-3 text-indigo-400" />
                    {stream.camerasCount} POVs
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 text-xs text-white font-mono">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{stream.viewers.toLocaleString()} watching</span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <img src={stream.avatar} alt={stream.broadcaster} className="w-9 h-9 rounded-full border border-indigo-500/30" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-white truncate group-hover:text-indigo-400 transition-colors">
                      {stream.title}
                    </h3>
                    <span className="text-xs text-[#8e8fa6] block mt-0.5">{stream.broadcaster}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {stream.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded-md bg-[#181827] text-[10px] font-medium text-[#9d9eb2] border border-[#272738]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
