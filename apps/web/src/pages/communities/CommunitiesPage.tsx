import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Coffee, Users, ArrowRight, Sparkles, Radio } from 'lucide-react'
import { InterestSelector, INTEREST_TAGS } from '../../components/community/InterestSelector'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'

export function CommunitiesPage() {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Competitive Gaming',
    'Esports Analysis',
  ])

  const sampleTables = [
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

      {/* Interest Selector Card */}
      <div className="p-6 rounded-2xl bg-[#11111a] border border-[#222230] space-y-4 shadow-xl">
        <InterestSelector
          selectedInterests={selectedInterests}
          onChange={setSelectedInterests}
        />
        <div className="pt-2 flex items-center justify-between">
          <span className="text-xs text-[#717188] font-mono">
            {selectedInterests.length} vibes selected • pgvector AI matching ready
          </span>
          <Link to="/watch/stageside_stream_001">
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs">
              <span>Find My Table</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Active Tables Showcase */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#7e7f96] font-mono">
          Featured Live Tables (VALORANT Finals)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sampleTables.map((t) => (
            <div
              key={t.id}
              className="p-5 rounded-2xl bg-[#11111a] border border-[#222230] hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm text-white">{t.name}</h4>
                  <Badge variant="default" className="text-[10px] font-mono">
                    {t.currentSize}/{t.capacity} Seats
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {t.interests.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-[#161624] text-[10px] text-indigo-300 border border-[#242436]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#1e1e2c] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-[#828399]">
                  <Radio className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-mono text-[11px]">{t.currentAngle}</span>
                </div>
                <Link to="/watch/stageside_stream_001">
                  <Button size="sm" variant="outline" className="text-xs h-7">
                    Join Table
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
