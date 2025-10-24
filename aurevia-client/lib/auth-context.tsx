"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axiosInstance, { getAuthData, updateAuthData, clearAuthData } from './axios'
import { User } from './api'

interface AuthResponse {
  access_token: string
  refresh_token: string
  user: User
}

interface AuthContextType {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateUser: (user: User) => void
  refreshAccessToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load auth data from localStorage on mount
  useEffect(() => {
    const loadAuthData = () => {
      try {
        const storedData = getAuthData()
        if (storedData) {
          setUser(storedData.user)
          setAccessToken(storedData.accessToken)
          setRefreshToken(storedData.refreshToken)
        }
      } catch (error) {
        console.error('Failed to load auth data:', error)
        clearAuthData()
      } finally {
        setIsLoading(false)
      }
    }

    loadAuthData()
  }, [])

  // Save auth data to localStorage whenever it changes
  useEffect(() => {
    if (user && accessToken && refreshToken) {
      updateAuthData({ user, accessToken, refreshToken })
    } else {
      clearAuthData()
    }
  }, [user, accessToken, refreshToken])

  // Listen for storage changes from axios interceptor (token refresh)
  useEffect(() => {
    const handleStorageChange = () => {
      const storedData = getAuthData()
      
      if (storedData) {
        // Check if the access token has changed (refreshed by axios interceptor)
        if (storedData.accessToken !== accessToken) {
          console.log('🔄 Access token updated from axios interceptor, syncing auth context...')
          setAccessToken(storedData.accessToken)
          
          // Also update user and refresh token if they changed
          if (storedData.user && JSON.stringify(storedData.user) !== JSON.stringify(user)) {
            setUser(storedData.user)
          }
          if (storedData.refreshToken !== refreshToken) {
            setRefreshToken(storedData.refreshToken)
          }
        }
      } else {
        // Auth data was cleared
        if (user || accessToken || refreshToken) {
          console.log('🔄 Auth data cleared from storage, logging out...')
          setUser(null)
          setAccessToken(null)
          setRefreshToken(null)
        }
      }
    }

    // Check for changes periodically (since localStorage events don't fire in same tab)
    const interval = setInterval(handleStorageChange, 1000)

    return () => clearInterval(interval)
  }, [user, accessToken, refreshToken])

  const login = async (email: string, password: string) => {
    try {
      const response = await axiosInstance.post<AuthResponse>('/auth/login', {
        email,
        password,
      })
      
      const { user, access_token, refresh_token } = response.data
      
      setUser(user)
      setAccessToken(access_token)
      setRefreshToken(refresh_token)
    } catch (error: any) {
      // Extract error message from axios error
      const errorMessage = error.response?.data?.message || error.message || 'Login failed'
      throw new Error(errorMessage)
    }
  }

  const logout = async () => {
    try {
      if (accessToken) {
        await axiosInstance.post('/auth/logout')
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setAccessToken(null)
      setRefreshToken(null)
      clearAuthData()
    }
  }

  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await axiosInstance.post<{ access_token: string }>('/auth/refresh', {
        refresh_token: refreshToken,
      })

      const newAccessToken = response.data.access_token
      setAccessToken(newAccessToken)
      console.log('Token refreshed successfully')
      // Update localStorage
      updateAuthData({ user, accessToken: newAccessToken, refreshToken })
      
      
      return newAccessToken
    } catch (error) {
      console.error('Token refresh failed:', error)
      // Clear auth and logout user
      setUser(null)
      setAccessToken(null)
      setRefreshToken(null)
      clearAuthData()
      return null
    }
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
    // Update in localStorage as well
    if (accessToken && refreshToken) {
      updateAuthData({ user: updatedUser, accessToken, refreshToken })
    }
  }

  const value: AuthContextType = {
    user,
    accessToken,
    refreshToken,
    isLoading,
    isAuthenticated: !!user && !!accessToken,
    login,
    logout,
    updateUser,
    refreshAccessToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
