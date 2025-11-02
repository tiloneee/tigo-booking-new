"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react'
import axiosInstance, { getAuthData, updateAuthData, clearAuthData } from './axios'
import { User, Role } from './api'

interface AuthResponse {
  access_token: string
  refresh_token: string
  user: User
}

interface AuthContextType {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateUser: (user: User) => void
  refreshAccessToken: () => Promise<string | null>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

// Helper function to normalize roles to string array
const normalizeRoles = (roles: string[] | Role[] | undefined): string[] => {
  if (!roles) return []
  
  // If it's already an array of strings, return it
  if (typeof roles[0] === 'string') {
    return roles as string[]
  }
  
  // If it's an array of role objects, extract the name property
  return (roles as Role[]).map(role => role.name)
}

// Helper function to normalize user data
const normalizeUser = (user: User): User => {
  return {
    ...user,
    roles: normalizeRoles(user.roles)
  }
}

// Helper function to decode JWT token
const decodeToken = (token: string): { exp: number; iat: number } | null => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Failed to decode token:', error)
    return null
  }
}

// Helper function to check if token will expire soon
// Refresh when less than 50% of token lifetime remains
const shouldRefreshToken = (token: string): boolean => {
  const decoded = decodeToken(token)
  if (!decoded?.exp || !decoded?.iat) return false
  
  const currentTime = Math.floor(Date.now() / 1000)
  const tokenLifetime = decoded.exp - decoded.iat
  const timeUntilExpiry = decoded.exp - currentTime
  
  // Refresh if less than 50% of token lifetime remains (or less than 10 seconds)
  const refreshThreshold = Math.max(Math.floor(tokenLifetime * 0.5), 10)
  
  return timeUntilExpiry < refreshThreshold
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isRefreshing = useRef(false) // Track if we're currently refreshing to prevent multiple simultaneous refreshes

  // Define refreshAccessToken early with useCallback
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    // Prevent multiple simultaneous refresh attempts
    if (isRefreshing.current) {
      console.log('⏸️ Token refresh already in progress, skipping...')
      return null
    }

    isRefreshing.current = true
    
    try {
      // Refresh token is now in httpOnly cookie, no need to send it
      const response = await axiosInstance.post<{ access_token: string }>('/auth/refresh')

      const newAccessToken = response.data.access_token
      setAccessToken(newAccessToken)
      console.log('✅ Token refreshed successfully')
      
      // Get current user from state
      const currentAuthData = getAuthData()
      // Update localStorage (no refresh token stored anymore)
      updateAuthData({ user: currentAuthData?.user, accessToken: newAccessToken })
      
      return newAccessToken
    } catch (error) {
      console.error('❌ Token refresh failed:', error)
      // Clear auth and logout user
      setUser(null)
      setAccessToken(null)
      clearAuthData()
      return null
    } finally {
      isRefreshing.current = false
    }
  }, []) // Remove 'user' dependency to prevent unnecessary recreations

  // Load auth data from localStorage on mount
  useEffect(() => {
    const loadAuthData = () => {
      try {
        const storedData = getAuthData()
        if (storedData) {
          // Normalize user data when loading from localStorage
          const normalizedUser = normalizeUser(storedData.user)
          setUser(normalizedUser)
          setAccessToken(storedData.accessToken)
          // No refresh token in localStorage anymore
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
    if (user && accessToken) {
      updateAuthData({ user, accessToken })
    } else {
      clearAuthData()
    }
  }, [user, accessToken])

  // Listen for storage changes from axios interceptor (token refresh)
  useEffect(() => {
    const handleStorageChange = () => {
      const storedData = getAuthData()
      
      if (storedData) {
        // Check if the access token has changed (refreshed by axios interceptor)
        if (storedData.accessToken && storedData.accessToken !== accessToken) {
          console.log('🔄 Access token updated from axios interceptor, syncing auth context...')
          setAccessToken(storedData.accessToken)
          
          // Also update user if it changed (deep comparison)
          if (storedData.user && JSON.stringify(storedData.user) !== JSON.stringify(user)) {
            // Normalize user data when syncing from storage
            const normalizedUser = normalizeUser(storedData.user)
            setUser(normalizedUser)
          }
        }
      } else {
        // Auth data was cleared
        if (user || accessToken) {
          console.log('🔄 Auth data cleared from storage, logging out...')
          setUser(null)
          setAccessToken(null)
        }
      }
    }

    // Check for changes periodically (since localStorage events don't fire in same tab)
    // Reduced frequency to avoid excessive checking
    const interval = setInterval(handleStorageChange, 2000) // Changed from 1000ms to 2000ms

    return () => clearInterval(interval)
  }, [user, accessToken])

  // Proactive token refresh - refresh before token expires
  // This effect only runs once on mount and checks localStorage for the current token
  useEffect(() => {
    const checkAndRefreshToken = async () => {
      // Always get the latest token from localStorage
      const currentAuthData = getAuthData()
      const currentToken = currentAuthData?.accessToken
      
      if (!currentToken) return

      try {
        if (shouldRefreshToken(currentToken)) {
          console.log('⏰ Access token expiring soon, proactively refreshing...')
          await refreshAccessToken()
        }
      } catch (error) {
        console.error('Proactive token refresh failed:', error)
      }
    }

    // Check every 7.5 seconds (for a 30 second token, this checks at 25% intervals)
    // This is a fixed interval that doesn't depend on token changes
    const checkInterval = 7500
    
    console.log(`⏱️ Setting up proactive token refresh checker (every ${checkInterval / 1000}s)`)

    // Set up the interval - it will check localStorage each time
    const refreshInterval = setInterval(checkAndRefreshToken, checkInterval)

    return () => {
      clearInterval(refreshInterval)
    }
  }, [refreshAccessToken]) // Only depends on refreshAccessToken (which is now stable)

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await axiosInstance.post<AuthResponse>('/auth/login', {
        email,
        password,
      })
      
      // Refresh token is now in httpOnly cookie, not in response
      const { user, access_token } = response.data
      
      // Normalize user data to ensure roles are always string array
      const normalizedUser = normalizeUser(user)
      
      setUser(normalizedUser)
      setAccessToken(access_token)
      // No need to set refresh token - it's in httpOnly cookie
    } catch (error: any) {
      // Re-throw the original axios error so the response data is preserved
      if (error.response?.data?.message) {
        const err = new Error(error.response.data.message) as any
        err.response = error.response
        throw err
      }
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      if (accessToken) {
        // Backend will clear the refresh token cookie
        await axiosInstance.post('/auth/logout')
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setAccessToken(null)
      clearAuthData()
    }
  }, [accessToken])

  const updateUser = useCallback((updatedUser: User) => {
    // Normalize user data to ensure roles are always string array
    const normalizedUser = normalizeUser(updatedUser)
    setUser(normalizedUser)
    // Update in localStorage as well
    if (accessToken) {
      updateAuthData({ user: normalizedUser, accessToken })
    }
  }, [accessToken])

  const refreshUser = useCallback(async () => {
    try {
      if (!accessToken) return
      
      // Fetch the latest user profile data
      const response = await axiosInstance.get<User>('/users/profile')
      const updatedUser = response.data
      
      // Normalize user data to ensure roles are always string array
      const normalizedUser = normalizeUser(updatedUser)
      
      setUser(normalizedUser)
      // Update in localStorage as well
      updateAuthData({ user: normalizedUser, accessToken })
    } catch (error) {
      console.error('Failed to refresh user data:', error)
    }
  }, [accessToken])

  // Memoize the context value to prevent unnecessary re-renders
  const value: AuthContextType = useMemo(() => ({
    user,
    accessToken,
    isLoading,
    isAuthenticated: !!user && !!accessToken,
    login,
    logout,
    updateUser,
    refreshAccessToken,
    refreshUser,
  }), [user, accessToken, isLoading, login, logout, updateUser, refreshAccessToken, refreshUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
