import React from 'react'
import { CommunityMember } from '../../types'
import { Users } from 'lucide-react'

export function MemberList({ members }: { members: CommunityMember[] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-[#7e7f96] uppercase font-mono px-1">
        <span>Table Members</span>
        <span>{members.length}/6 Cozy Size</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {members.map((member) => (
          <div
            key={member.userId}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#181826] border border-[#27273c] text-xs text-white"
          >
            <img
              src={member.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${member.username}`}
              alt={member.username}
              className="w-4 h-4 rounded-full"
            />
            <span className="font-medium truncate max-w-[100px]">{member.username}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
