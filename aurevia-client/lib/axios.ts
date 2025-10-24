import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ✅ Enable sending cookies with requests
  timeout: 30000, // 30 seconds
})

// Track if we're currently refreshing the token
let isRefreshing = false
// Queue for requests waiting for token refresh
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (error?: any) => void
}> = []

// Process the queue after token refresh
const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })

  failedQueue = []
}

// Get auth data from localStorage
const getAuthData = () => {
  if (typeof window === 'undefined') return null
  
  try {
    const storedData = localStorage.getItem('auth_data')
    if (storedData) {
      return JSON.parse(storedData)
    }
  } catch (error) {
    console.error('Failed to parse auth data:', error)
  }
  return null
}

// Update auth data in localStorage
const updateAuthData = (data: any) => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem('auth_data', JSON.stringify(data))
  } catch (error) {
    console.error('Failed to update auth data:', error)
  }
}

// Clear auth data from localStorage
const clearAuthData = () => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem('auth_data')
  } catch (error) {
    console.error('Failed to clear auth data:', error)
  }
}

// Request interceptor - Add access token to all requests
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authData = getAuthData()
    
    if (authData?.accessToken) {
      config.headers.Authorization = `Bearer ${authData.accessToken}`
    }
    
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle token refresh on 401
axiosInstance.interceptors.response.use(
  (response) => {
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // If error is not 401 or request is already retried, reject immediately
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    // If the failed request is the refresh token endpoint itself, logout
    if (originalRequest.url?.includes('/auth/refresh')) {
      clearAuthData()
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'
      }
      return Promise.reject(error)
    }

    // If we're already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`
          }
          return axiosInstance(originalRequest)
        })
        .catch((err) => {
          return Promise.reject(err)
        })
    }

    // Mark that we're refreshing the token
    originalRequest._retry = true
    isRefreshing = true

    try {
      // Attempt to refresh the token using cookie-based refresh
      // Refresh token is automatically sent via httpOnly cookie
      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        {}, // Empty body - token is in cookie
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true, // Send cookies
        }
      )

      const { access_token } = response.data

      // Get current auth data (without refresh token now)
      const authData = getAuthData()

      // Update the stored auth data with new access token
      const updatedAuthData = {
        user: authData?.user,
        accessToken: access_token,
        // No refreshToken in localStorage anymore - it's in httpOnly cookie
      }

      updateAuthData(updatedAuthData)

      // Update the authorization header for the original request
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${access_token}`
      }

      // Process the queue with the new token
      processQueue(null, access_token)

      // Retry the original request
      return axiosInstance(originalRequest)
    } catch (refreshError) {
      // Refresh failed, clear auth data and redirect to login
      processQueue(refreshError, null)
      clearAuthData()
      
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'
      }
      
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default axiosInstance

// Export helper functions for use in auth context
export { getAuthData, updateAuthData, clearAuthData }
