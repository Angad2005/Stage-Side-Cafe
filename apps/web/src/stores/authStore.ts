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

const storedToken = localStorage.getItem('stageside_token')

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: storedToken,
  isAuthenticated: Boolean(storedToken),
  isLoading: Boolean(storedToken),

  login: (token, user) => {
    api.setToken(token)
    set({ token, user, isAuthenticated: true, isLoading: false })
  },

  logout: () => {
    api.setToken(null)
    set({ token: null, user: null, isAuthenticated: false, isLoading: false })
  },

  fetchCurrentUser: async () => {
    set({ isLoading: true })
    try {
      const me = await api.getMe()
      set({ user: me, isAuthenticated: true, isLoading: false })
    } catch {
      api.setToken(null)
      set({ token: null, user: null, isAuthenticated: false, isLoading: false })
    }
  },
}))
