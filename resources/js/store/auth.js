import { create } from 'zustand'
import api from '@/lib/axios'

const storedToken = localStorage.getItem('token') || null

export const useAuthStore = create((set, get) => ({
  token: storedToken,
  user: null,
  // Start as loading when a token exists so ProtectedRoute waits for
  // fetchMe() to fully hydrate the user before rendering any page.
  isLoading: Boolean(storedToken),
  error: null,

  /** POST /api/v1/auth/login — login accepts email or UDISE code */
  login: async (login, password) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await api.post('/v1/auth/login', { login, password })
      localStorage.setItem('token', data.token)
      set({ token: data.token, user: data.user, isLoading: false })
      return { success: true, user: data.user }
    } catch (err) {
      const message =
        err.response?.data?.errors?.login?.[0] ??
        err.response?.data?.message ??
        'Login failed. Please try again.'
      set({ isLoading: false, error: message })
      return { success: false, error: message }
    }
  },

  /** POST /api/v1/auth/logout */
  logout: async () => {
    try {
      await api.post('/v1/auth/logout')
    } catch {
      // Proceed regardless of server-side error
    }
    localStorage.removeItem('token')
    set({ token: null, user: null, error: null })
  },

  /** GET /api/v1/auth/me — hydrate user on app init or to refresh profile data */
  fetchMe: async () => {
    const { token } = get()
    if (!token) {
      set({ isLoading: false })
      return
    }

    set({ isLoading: true })
    try {
      const { data } = await api.get('/v1/auth/me')
      set({ user: data.user, isLoading: false })
    } catch {
      localStorage.removeItem('token')
      set({ token: null, user: null, isLoading: false })
    }
  },

  /**
   * Refresh current user without setting global isLoading — avoids unmounting
   * the whole app / ProtectedRoute when updating profile fields (e.g. district).
   */
  refreshUser: async () => {
    const { token } = get()
    if (!token) return
    try {
      const { data } = await api.get('/v1/auth/me')
      set({ user: data.user })
    } catch {
      localStorage.removeItem('token')
      set({ token: null, user: null, isLoading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
