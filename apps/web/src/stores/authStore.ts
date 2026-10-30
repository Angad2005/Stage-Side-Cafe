import { create } from 'zustand'
import type { User } from '../types'
import { api } from '../services/api'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string, user: User) => void
  logout: () => void
  fetchCurrentUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: {
    id: 'usr_demo_streamer',
    username: 'stageside_broadcaster',
    displayName: 'StageSide Host',
    role: 'streamer',
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=streamer',
  },
  token: localStorage.getItem('stageside_token') || 'demo_jwt_token',
  isAuthenticated: true,
  isLoading: false,

  login: (token, user) => {
    api.setToken(token)
    set({ token, user, isAuthenticated: true })
  },

  logout: () => {
    api.setToken(null)
    set({ token: null, user: null, isAuthenticated: false })
  },

  fetchCurrentUser: async () => {
    try {
      const me = await api.getMe()
      set({ user: me, isAuthenticated: true })
    } catch {
      // Use fallback streamer user
    }
  },
}))
