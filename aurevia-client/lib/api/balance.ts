import axiosInstance from '../axios'

export interface BalanceTopup {
  id: string
  user_id: string
  amount: number
  status: 'pending' | 'approved' | 'rejected'
  admin_notes?: string
  processed_by?: string
  created_at: string
  updated_at: string
}

export interface CreateTopupRequest {
  amount: number
}

export interface UpdateTopupRequest {
  status: 'approved' | 'rejected'
  admin_notes?: string
}

export const balanceApi = {
  // Create a topup request (now handled by transaction module)
  createTopupRequest: async (data: CreateTopupRequest): Promise<BalanceTopup> => {
    const response = await axiosInstance.post('/transactions/topup', data)
    return response.data
  },

  // Get current user's balance (now from transaction module)
  getCurrentBalance: async (): Promise<number> => {
    const response = await axiosInstance.get('/transactions/balance')
    return response.data
  },

  // Get cached balance (from Redis cache)
  getCachedBalance: async (): Promise<{ balance: number; cached: boolean }> => {
    const response = await axiosInstance.get('/transactions/balance/cached')
    return response.data
  },

  // Get current user's topup requests
  getMyTopups: async (): Promise<BalanceTopup[]> => {
    const response = await axiosInstance.get('/transactions/user')
    return response.data
  },

  // Get specific transaction by ID
  getTopupById: async (id: string): Promise<BalanceTopup> => {
    const response = await axiosInstance.get(`/transactions/${id}`)
    return response.data
  },

  // Admin: Get all pending topups
  getPendingTopups: async (): Promise<BalanceTopup[]> => {
    const response = await axiosInstance.get('/transactions/topup/pending')
    return response.data
  },

  // Admin: Get all topups
  getAllTopups: async (): Promise<BalanceTopup[]> => {
    const response = await axiosInstance.get('/transactions/topup/all')
    return response.data
  },

  // Admin: Process a topup request
  processTopup: async (id: string, data: UpdateTopupRequest): Promise<BalanceTopup> => {
    const response = await axiosInstance.patch(`/transactions/topup/${id}/process`, data)
    return response.data
  },
}
