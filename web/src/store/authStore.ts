import { create } from 'zustand'

type AuthState = {
  token: string | null
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null,
  isAuthenticated: typeof localStorage !== 'undefined' ? Boolean(localStorage.getItem('token')) : false,
  login: (token: string) => {
    localStorage.setItem('token', token)
    set({ token, isAuthenticated: true })
  },
  logout: () => {
    localStorage.removeItem('token')
    set({ token: null, isAuthenticated: false })
  },
}))


