import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Assessor } from '../types/database'

interface AuthState {
  assessor: Assessor | null
  sessionExpiry: number | null
  setAssessor: (assessor: Assessor | null) => void
  setSessionExpiry: (expiry: number) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      assessor: null,
      sessionExpiry: null,
      
      setAssessor: (assessor) => set({ assessor }),
      
      setSessionExpiry: (expiry) => set({ sessionExpiry: expiry }),
      
      logout: () => set({ assessor: null, sessionExpiry: null }),
      
      isAuthenticated: () => {
        const { assessor, sessionExpiry } = get()
        if (!assessor || !sessionExpiry) return false
        return Date.now() < sessionExpiry
      },
    }),
    {
      name: 'redi-auth-storage',
    }
  )
)
