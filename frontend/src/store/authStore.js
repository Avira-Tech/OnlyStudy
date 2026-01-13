import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'
import toast from 'react-hot-toast'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      // Login user
      login: async (email, password) => {
        set({ loading: true, error: null })
        try {
          const response = await api.post('/auth/login', { email, password })
          const { user, accessToken, refreshToken } = response.data.data

          // Store tokens
          localStorage.setItem('accessToken', accessToken)
          localStorage.setItem('refreshToken', refreshToken)

          set({
            user,
            isAuthenticated: true,
            loading: false,
            error: null,
          })

          return response.data
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Login failed'
          set({ loading: false, error: errorMessage })
          throw new Error(errorMessage)
        }
      },

      // Register user
      register: async (username, email, password, role = 'student') => {
        set({ loading: true, error: null })
        try {
          const response = await api.post('/auth/register', {
            username,
            email,
            password,
            role,
          })

          set({ loading: false, error: null })
          return response.data
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Registration failed'
          set({ loading: false, error: errorMessage })
          throw new Error(errorMessage)
        }
      },

      // Logout user
      logout: async () => {
        try {
          await api.post('/auth/logout')
        } catch (error) {
          console.error('Logout error:', error)
        }

        // Clear tokens
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')

        set({
          user: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        })
      },

      // Check authentication status
      checkAuth: async () => {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          set({ isAuthenticated: false, user: null })
          return
        }

        try {
          const response = await api.get('/auth/me')
          const user = response.data.data.user

          set({
            user,
            isAuthenticated: true,
            loading: false,
            error: null,
          })
        } catch (error) {
          // Token might be expired, try refresh
          try {
            const refreshToken = localStorage.getItem('refreshToken')
            if (refreshToken) {
              const refreshResponse = await api.post('/auth/refresh-token', {
                refreshToken,
              })
              const newAccessToken = refreshResponse.data.data.accessToken
              localStorage.setItem('accessToken', newAccessToken)

              // Retry getting user info
              const userResponse = await api.get('/auth/me')
              const user = userResponse.data.data.user

              set({
                user,
                isAuthenticated: true,
                loading: false,
                error: null,
              })
            }
          } catch (refreshError) {
            // Refresh failed, logout
            get().logout()
          }
        }
      },

      // Update user profile
      updateProfile: async (profileData) => {
        set({ loading: true, error: null })
        try {
          const response = await api.put('/auth/profile', profileData)
          const updatedUser = response.data.data.user

          set({
            user: { ...get().user, ...updatedUser },
            loading: false,
            error: null,
          })

          toast.success('Profile updated successfully')
          return response.data
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Profile update failed'
          set({ loading: false, error: errorMessage })
          throw new Error(errorMessage)
        }
      },

      // Change password
      changePassword: async (currentPassword, newPassword) => {
        set({ loading: true, error: null })
        try {
          await api.put('/auth/password', {
            currentPassword,
            newPassword,
          })

          set({ loading: false, error: null })
          toast.success('Password changed successfully')
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Password change failed'
          set({ loading: false, error: errorMessage })
          throw new Error(errorMessage)
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export default useAuthStore
