import { create } from 'zustand'
import type { Community, ChatMessage, CommunityMember } from '../types'

interface CommunityState {
  currentCommunity: Community | null
  messages: ChatMessage[]
  members: CommunityMember[]
  setCommunity: (community: Community) => void
  addMessage: (message: ChatMessage) => void
  setMessages: (messages: ChatMessage[]) => void
  setMembers: (members: CommunityMember[]) => void
  leaveCommunity: () => void
}

const DEFAULT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_1',
    communityId: 'comm_default',
    userId: 'usr_sarah',
    username: 'sarah_fps',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=sarah',
    message: 'Welcome everyone! That 1v3 clutch in round 4 was unbelievable!',
    messageType: 'text',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'msg_2',
    communityId: 'comm_default',
    userId: 'usr_marcus',
    username: 'marcus_gg',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=marcus',
    message: 'Switched to Guest POV during the post-game breakdown, audio commentary is so clean.',
    messageType: 'text',
    createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
  {
    id: 'msg_3',
    communityId: 'comm_default',
    userId: 'system',
    username: 'AI Sentinel',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=sentinel',
    message: '🛡️ AI Sentinel verified 3 camera feeds. Pre-broadcast screening nominal.',
    messageType: 'system',
    createdAt: new Date(Date.now() - 1000 * 30).toISOString(),
  },
]

export const useCommunityStore = create<CommunityState>((set) => ({
  currentCommunity: {
    id: 'comm_default',
    streamId: 'stageside_stream_001',
    name: 'Esports Strategy Lounge #4',
    description: 'Competitive gameplay, live analysis, and hype moments',
    capacity: 6,
    memberCount: 4,
    members: [
      { userId: 'usr_demo_streamer', username: 'StageSide Host', joinedAt: new Date().toISOString() },
      { userId: 'usr_sarah', username: 'sarah_fps', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=sarah', joinedAt: new Date().toISOString() },
      { userId: 'usr_marcus', username: 'marcus_gg', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=marcus', joinedAt: new Date().toISOString() },
      { userId: 'usr_elena', username: 'elena_tech', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=elena', joinedAt: new Date().toISOString() },
    ],
    isActive: true,
  },
  messages: DEFAULT_MESSAGES,
  members: [
    { userId: 'usr_demo_streamer', username: 'StageSide Host', joinedAt: new Date().toISOString() },
    { userId: 'usr_sarah', username: 'sarah_fps', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=sarah', joinedAt: new Date().toISOString() },
    { userId: 'usr_marcus', username: 'marcus_gg', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=marcus', joinedAt: new Date().toISOString() },
    { userId: 'usr_elena', username: 'elena_tech', avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=elena', joinedAt: new Date().toISOString() },
  ],

  setCommunity: (community) => set({ currentCommunity: community, members: community.members }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setMessages: (messages) => set({ messages }),
  setMembers: (members) => set({ members }),
  leaveCommunity: () => set({ currentCommunity: null, messages: [], members: [] }),
}))
