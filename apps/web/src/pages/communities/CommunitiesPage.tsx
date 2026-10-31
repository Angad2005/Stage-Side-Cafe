import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Coffee, Users, ArrowRight, Radio } from 'lucide-react'
import { InterestSelector } from '../../components/community/InterestSelector'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { useCommunityStore } from '../../stores/communityStore'
import { useAuthStore } from '../../stores/authStore'
import type { Community, CommunityMember } from '../../types'

interface DemoTable {
  id: string
  name: string
  interests: string[]
  currentSize: number
  capacity: number
  currentAngle: string
}

const SAMPLE_TABLES: DemoTable[] = [
  {
    id: 'table_01',
    name: 'Pixel Corner #A4',
    interests: ['Competitive Gaming', 'Strategy & Tactics'],
    currentSize: 4,
    capacity: 6,
    currentAngle: 'Gameplay Feed',
  },
  {
    id: 'table_02',
    name: 'Coffee & Commentary #F9',
    interests: ['Behind the Scenes', 'Tech & Audio Gear'],
    currentSize: 3,
    capacity: 6,
    currentAngle: 'Host POV',
  },
  {
    id: 'table_03',
    name: 'Hype Lounge #C2',
    interests: ['Memes & Hype', 'Esports Analysis'],
    currentSize: 5,
    capacity: 6,
    currentAngle: 'Guest POV',
  },
]

const SAMPLE_MEMBERS: CommunityMember[] = [
  { userId: 'usr_sarah', username: 'sarah_fps', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=sarah', joinedAt: new Date().toISOString() },
  { userId: 'usr_marcus', username: 'marcus_gg', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=marcus', joinedAt: new Date().toISOString() },
  { userId: 'usr_elena', username: 'elena_tech', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=elena', joinedAt: new Date().toISOString() },
  { userId: 'usr_jules', username: 'julesplays', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=jules', joinedAt: new Date().toISOString() },
  { userId: 'usr_zoe', username: 'zoe_streams', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=zoe', joinedAt: new Date().toISOString() },
]

export function CommunitiesPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { setCommunity, setMessages } = useCommunityStore()
  const [selectedInterests, setSelectedInterests] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('stageside_viewer_preferences')
      const preferences = saved ? JSON.parse(saved) as { interests?: string[] } : null
      if (Array.isArray(preferences?.interests)) return preferences.interests
    } catch {
      // Keep the default demo match interests.
    }
    return ['Competitive Gaming', 'Esports Analysis']
  })

  const matchedTable = useMemo(() => {
    return [...SAMPLE_TABLES].sort((a, b) => {
      const scoreA = a.interests.filter((interest) => selectedInterests.includes(interest)).length
      const scoreB = b.interests.filter((interest) => selectedInterests.includes(interest)).length
      return scoreB - scoreA
    })[0]
  }, [selectedInterests])

  const joinTable = (table: DemoTable, interests = table.interests) => {
    const viewer: CommunityMember = user
      ? {
          userId: user.id,
          username: user.displayName,
          avatarUrl: user.avatarUrl,
          joinedAt: new Date().toISOString(),
        }
      : { userId: 'guest-viewer', username: 'You', joinedAt: new Date().toISOString() }
    const members = [viewer, ...SAMPLE_MEMBERS.slice(0, table.currentSize)]
    const community: Community = {
      id: table.id,
      streamId: 'stageside_stream_001',
      name: table.name,
      description: `Matched around ${interests.length ? interests.join(', ') : 'live stream chat'}`,
      capacity: table.capacity,
      memberCount: members.length,
      members,
      isActive: true,
    }
    setCommunity(community)
    setMessages([{
      id: `welcome_${Date.now()}`,
      communityId: community.id,
      userId: 'system',
      username: 'StageSide Cafe',
      message: `You joined ${community.name}. Say hello to your table!`,
      messageType: 'system',
      createdAt: new Date().toISOString(),
    }])
    navigate(`/watch/${community.streamId}`)
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <Coffee className="w-6 h-6 text-indigo-400" />
          <h1 className="text-2xl font-black text-white tracking-tight">StageSide Cafe Tables</h1>
        </div>
        <p className="text-sm text-[#8f90a2] mt-1">
          Never get lost in a 50,000-viewer waterfall chat. StageSide organizes viewers into curated tables of 3 to 6
          people sharing your interests.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-[#11111a] border border-[#222230] space-y-4 shadow-xl">
        <InterestSelector selectedInterests={selectedInterests} onChange={setSelectedInterests} />
        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs text-[#717188] font-mono">
            {selectedInterests.length} vibes selected • demo interest matching ready
          </span>
          <Button
            onClick={() => joinTable(matchedTable, selectedInterests)}
            disabled={selectedInterests.length === 0}
            className="gap-2 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs"
          >
            <span>Find My Table</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#7e7f96] font-mono">
          Featured Live Tables (VALORANT Finals)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SAMPLE_TABLES.map((table) => (
            <div
              key={table.id}
              className="p-5 rounded-2xl bg-[#11111a] border border-[#222230] hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm text-white">{table.name}</h4>
                  <Badge variant="default" className="text-[10px] font-mono">
                    {table.currentSize}/{table.capacity} Seats
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {table.interests.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded bg-[#161624] text-[10px] text-indigo-300 border border-[#242436]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#1e1e2c] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-[#828399]">
                  <Radio className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-mono text-[11px]">{table.currentAngle}</span>
                </div>
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => joinTable(table)}>
                  <Users className="w-3 h-3 mr-1" />
                  Join Table
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
