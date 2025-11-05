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
  status: 'success' | 'failed' | 'cancelled'
  admin_notes?: string
}

export interface Transaction {
  id: string
  user_id: string
  user?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  type: string
  amount: number
  status: 'pending' | 'success' | 'failed'
  description?: string
  reference_id?: string
  reference_type?: string
  admin_notes?: string
  processed_by?: string
  processor?: {
    id: string
    first_name: string
    last_name: string
  }
  created_at: string
  updated_at: string
}

export const balanceApi = {
  // Create a topup request (now handled by transaction module)
  createTopupRequest: async (data: CreateTopupRequest): Promise<Transaction> => {
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

  // Get current user's transactions (replaces topup requests)
  getMyTransactions: async (): Promise<Transaction[]> => {
    const response = await axiosInstance.get('/transactions/my-transactions')
    return response.data
  },

  // Get specific transaction by ID
  getTransactionById: async (id: string): Promise<Transaction> => {
    const response = await axiosInstance.get(`/transactions/${id}`)
    return response.data
  },

  // Admin: Get all pending topups
  getPendingTopups: async (): Promise<Transaction[]> => {
    const response = await axiosInstance.get('/transactions/topup/pending')
    return response.data
  },

  // Admin: Get all topups
  getAllTopups: async (): Promise<Transaction[]> => {
    const response = await axiosInstance.get('/transactions/topup/all')
    return response.data
  },

  // Admin: Process a topup request
  processTopup: async (id: string, data: UpdateTopupRequest): Promise<Transaction> => {
    const response = await axiosInstance.patch(`/transactions/topup/${id}/process`, data)
    return response.data
  },
}
