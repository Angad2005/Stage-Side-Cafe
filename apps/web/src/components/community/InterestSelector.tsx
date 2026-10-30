import React from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '../../lib/utils'

export const INTEREST_TAGS = [
  'Competitive Gaming',
  'Esports Analysis',
  'Behind the Scenes',
  'Casual Gaming',
  'Tech & Audio Gear',
  'Strategy & Tactics',
  'Memes & Hype',
  'Speedrunning',
]

interface InterestSelectorProps {
  selectedInterests: string[]
  onChange: (interests: string[]) => void
}

export function InterestSelector({ selectedInterests, onChange }: InterestSelectorProps) {
  const toggleInterest = (tag: string) => {
    if (selectedInterests.includes(tag)) {
      onChange(selectedInterests.filter((t) => t !== tag))
    } else {
      onChange([...selectedInterests, tag])
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-400 font-mono">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Select Your Viewing Vibes</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {INTEREST_TAGS.map((tag) => {
          const selected = selectedInterests.includes(tag)
          return (
            <button
              key={tag}
              onClick={() => toggleInterest(tag)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border',
                selected
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                  : 'bg-[#161624] text-[#8e8fa6] border-[#262638] hover:border-indigo-500/40 hover:text-white'
              )}
            >
              {tag}
            </button>
          )
        })}
      </div>
    </div>
  )
}
