import axiosInstance from './axios'

export interface Role {
  id: string
  name: string
  description?: string  // Make description optional
  permissions?: any[]
  created_at?: string
  updated_at?: string
}

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone_number?: string
  roles: string[] | Role[]  // Backend may return either format, but will be normalized to string[]
  is_active: boolean
}

// Helper function to check if user has a specific role
export const hasRole = (user: User | null, roleName: string): boolean => {
  if (!user?.roles) return false
  
  // Handle both string array and Role object array
  if (typeof user.roles[0] === 'string') {
    return (user.roles as string[]).includes(roleName)
  }
  
  return (user.roles as Role[]).some(role => role.name === roleName)
}

// Helper function to get role name (handles both string and Role object)
export const getRoleName = (role: string | Role): string => {
  return typeof role === 'string' ? role : role.name
}

// Helper function to get all role names as strings
export const getRoleNames = (user: User | null): string[] => {
  if (!user?.roles) return []
  
  return user.roles.map(role => getRoleName(role))
}

export interface AuthResponse {
  access_token: string
  user: User
  // refresh_token is now in httpOnly cookie, not in response
}

export interface RegisterData {
  first_name: string
  last_name: string
  email: string
  password: string
  phone_number?: string
}

export interface LoginData {
  email: string
  password: string
}

export const authApi = {
  register: async (data: RegisterData): Promise<{ message: string; userId: string }> => {
    try {
      const response = await axiosInstance.post('/auth/register', data)
      return response.data
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed'
      throw new Error(errorMessage)
    }
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      const response = await axiosInstance.post('/auth/login', data)
      return response.data
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed'
      throw new Error(errorMessage)
    }
  },

  refreshToken: async (refreshToken: string): Promise<{ access_token: string }> => {
    try {
      const response = await axiosInstance.post('/auth/refresh', { refresh_token: refreshToken })
      return response.data
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Token refresh failed'
      throw new Error(errorMessage)
    }
  },

  logout: async (): Promise<{ message: string }> => {
    try {
      const response = await axiosInstance.post('/auth/logout')
      return response.data
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Logout failed'
      throw new Error(errorMessage)
    }
  },

  getProfile: async (): Promise<User> => {
    try {
      const response = await axiosInstance.get('/users/profile')
      return response.data
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch profile'
      throw new Error(errorMessage)
    }
  },

  updateProfile: async (data: { first_name: string; last_name: string; phone_number: string }): Promise<User> => {
    try {
      const response = await axiosInstance.patch('/users/profile', data)
      return response.data
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile'
      throw new Error(errorMessage)
    }
  },
} 