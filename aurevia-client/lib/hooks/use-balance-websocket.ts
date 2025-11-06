import { useEffect, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '../auth-context'

interface BalanceUpdate {
  newBalance: number
  previousBalance?: number
  transactionId?: string
  transactionType?: string
  amount?: number
  timestamp: string
}

interface TransactionCompleted {
  transactionId: string
  transactionType: string
  amount: number
  newBalance: number
  timestamp: string
}

interface TransactionFailed {
  transactionId: string
  transactionType: string
  timestamp: string
}

interface BalanceInsufficient {
  requiredAmount: number
  currentBalance: number
  shortfall: number
  timestamp: string
}

export function useBalanceWebSocket() {
  const { accessToken, isAuthenticated } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [currentBalance, setCurrentBalance] = useState<number | null>(null)
  const [lastUpdate, setLastUpdate] = useState<BalanceUpdate | null>(null)

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      return
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000'
    
    const newSocket = io(`${socketUrl}/balance`, {
      auth: {
        token: accessToken,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    // Connection events
    newSocket.on('connect', () => {
      console.log('Balance WebSocket connected')
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('Balance WebSocket disconnected')
      setIsConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('Balance WebSocket connection error:', error)
      setIsConnected(false)
    })

    // Balance events
    newSocket.on('balance_initial', (data: { balance: number | null }) => {
      console.log('Initial balance received:', data.balance)
      if (data.balance !== null) {
        setCurrentBalance(data.balance)
      }
    })

    newSocket.on('balance_updated', (data: BalanceUpdate) => {
      console.log('Balance updated:', data)
      setCurrentBalance(data.newBalance)
      setLastUpdate(data)
    })

    newSocket.on('balance_current', (data: { balance: number | null }) => {
      console.log('Current balance received:', data.balance)
      if (data.balance !== null) {
        setCurrentBalance(data.balance)
      }
    })

    newSocket.on('transaction_completed', (data: TransactionCompleted) => {
      console.log('Transaction completed:', data)
      setCurrentBalance(data.newBalance)
    })

    newSocket.on('transaction_failed', (data: TransactionFailed) => {
      console.log('Transaction failed:', data)
    })

    newSocket.on('balance_insufficient', (data: BalanceInsufficient) => {
      console.warn('Insufficient balance:', data)
    })

    newSocket.on('error', (error: { message: string }) => {
      console.error('Balance WebSocket error:', error)
    })

    setSocket(newSocket)

    // Cleanup
    return () => {
      newSocket.close()
    }
  }, [accessToken, isAuthenticated])

  // Request current balance
  const refreshBalance = useCallback(() => {
    if (socket && isConnected) {
      socket.emit('get_current_balance')
    }
  }, [socket, isConnected])

  return {
    socket,
    isConnected,
    currentBalance,
    lastUpdate,
    refreshBalance,
  }
}
