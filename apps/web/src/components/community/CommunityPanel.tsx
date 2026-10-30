import React from 'react'
import { Coffee, Users, Sparkles, MessageSquare } from 'lucide-react'
import { Community, ChatMessage } from '../../types'
import { MemberList } from './MemberList'
import { ChatPanel } from './ChatPanel'
import { Badge } from '../ui/badge'

interface CommunityPanelProps {
  community: Community | null
  messages: ChatMessage[]
  onSendMessage: (msg: string) => void
  onLeaveRoom?: () => void
}

export function CommunityPanel({ community, messages, onSendMessage }: CommunityPanelProps) {
  if (!community) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-[#11111a] border border-[#222230] rounded-2xl">
        <Coffee className="w-10 h-10 text-indigo-400 mb-2 opacity-60" />
        <h4 className="font-bold text-sm text-white">Join a Cafe Table</h4>
        <p className="text-xs text-[#828399] max-w-xs mt-1">
          Pick your interests to get matched into a cozy 3–6 person viewing lounge.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Community Info Card */}
      <div className="p-4 bg-[#11111a] border border-[#222230] rounded-2xl shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center">
              <Coffee className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-white leading-tight">{community.name}</h3>
              <span className="text-[10px] text-[#787890] block">{community.description}</span>
            </div>
          </div>
          <Badge variant="default" className="text-[9px] py-0 font-mono">
            {community.members.length}/{community.capacity} Seats
          </Badge>
        </div>

        <MemberList members={community.members} />
      </div>

      {/* Chat Area */}
      <div className="flex-1 min-h-[380px]">
        <ChatPanel messages={messages} onSendMessage={onSendMessage} />
      </div>
    </div>
  )
}
