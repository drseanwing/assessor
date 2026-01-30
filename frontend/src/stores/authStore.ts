import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Assessor } from '../types/database'

interface AuthState {
  assessor: Omit<Assessor, 'pin_hash'> | null
  token: string | null
  sessionExpiry: number | null
  setAssessor: (assessor: Omit<Assessor, 'pin_hash'> | null) => void
  setToken: (token: string | null) => void
  setSessionExpiry: (expiry: number) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      assessor: null,
      token: null,
      sessionExpiry: null,

      setAssessor: (assessor) => set({ assessor }),

      setToken: (token) => set({ token }),

      setSessionExpiry: (expiry) => set({ sessionExpiry: expiry }),

      logout: () => set({ assessor: null, token: null, sessionExpiry: null }),

      isAuthenticated: () => {
        const { assessor, token, sessionExpiry } = get()
        if (!assessor || !token || !sessionExpiry) return false
        return Date.now() < sessionExpiry
      },
    }),
    {
      name: 'redi-auth-storage',
    }
  )
)
