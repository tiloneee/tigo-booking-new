import type { DashboardUser, Hotel, Room, Booking, RoomAvailability } from '@/types/dashboard'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// Helper function to make authenticated API calls
async function fetchWithAuth(url: string, accessToken: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

// User Management APIs (Admin only)
export const usersApi = {
  getAll: async (accessToken: string): Promise<DashboardUser[]> => {
    return fetchWithAuth(`${API_BASE_URL}/users`, accessToken)
  },

  getOne: async (accessToken: string, userId: string): Promise<DashboardUser> => {
    return fetchWithAuth(`${API_BASE_URL}/users/${userId}`, accessToken)
  },

  update: async (
    accessToken: string,
    userId: string,
    data: Partial<DashboardUser>
  ): Promise<DashboardUser> => {
    return fetchWithAuth(`${API_BASE_URL}/users/${userId}`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  delete: async (accessToken: string, userId: string): Promise<{ message: string }> => {
    return fetchWithAuth(`${API_BASE_URL}/users/${userId}`, accessToken, {
      method: 'DELETE',
    })
  },

  assignRole: async (
    accessToken: string,
    userId: string,
    role: string
  ): Promise<DashboardUser> => {
    return fetchWithAuth(`${API_BASE_URL}/users/${userId}/roles`, accessToken, {
      method: 'POST',
      body: JSON.stringify({ role }),
    })
  },
}

// Hotel Management APIs
export const hotelsApi = {
  // Get all hotels (Admin only)
  getAll: async (accessToken: string): Promise<Hotel[]> => {
    return fetchWithAuth(`${API_BASE_URL}/hotels`, accessToken)
  },

  // Get hotels owned by the current user (HotelOwner)
  getOwned: async (accessToken: string): Promise<Hotel[]> => {
    return fetchWithAuth(`${API_BASE_URL}/hotels/mine`, accessToken)
  },

  // Get single hotel with details
  getOne: async (accessToken: string, hotelId: string): Promise<Hotel> => {
    return fetchWithAuth(`${API_BASE_URL}/hotels/${hotelId}`, accessToken)
  },

  // Update hotel
  update: async (
    accessToken: string,
    hotelId: string,
    data: Partial<Hotel>
  ): Promise<Hotel> => {
    return fetchWithAuth(`${API_BASE_URL}/hotels/${hotelId}`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  // Delete hotel
  delete: async (accessToken: string, hotelId: string): Promise<{ message: string }> => {
    return fetchWithAuth(`${API_BASE_URL}/hotels/${hotelId}`, accessToken, {
      method: 'DELETE',
    })
  },
}

// Room Management APIs
export const roomsApi = {
  // Get all rooms for a hotel
  getByHotel: async (accessToken: string, hotelId: string): Promise<Room[]> => {
    return fetchWithAuth(`${API_BASE_URL}/hotels/${hotelId}/rooms`, accessToken)
  },

  // Get single room
  getOne: async (accessToken: string, roomId: string): Promise<Room> => {
    return fetchWithAuth(`${API_BASE_URL}/rooms/${roomId}`, accessToken)
  },

  // Create room
  create: async (
    accessToken: string,
    hotelId: string,
    data: Partial<Room>
  ): Promise<Room> => {
    return fetchWithAuth(`${API_BASE_URL}/hotels/${hotelId}/rooms`, accessToken, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Update room
  update: async (
    accessToken: string,
    roomId: string,
    data: Partial<Room>
  ): Promise<Room> => {
    return fetchWithAuth(`${API_BASE_URL}/rooms/${roomId}`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  // Delete room
  delete: async (accessToken: string, roomId: string): Promise<{ message: string }> => {
    return fetchWithAuth(`${API_BASE_URL}/rooms/${roomId}`, accessToken, {
      method: 'DELETE',
    })
  },
}

// Room Availability APIs
export const availabilityApi = {
  // Get availability for a room
  getByRoom: async (accessToken: string, roomId: string): Promise<RoomAvailability[]> => {
    return fetchWithAuth(`${API_BASE_URL}/rooms/${roomId}/availability`, accessToken)
  },

  // Create availability
  create: async (
    accessToken: string,
    roomId: string,
    data: Partial<RoomAvailability>
  ): Promise<RoomAvailability> => {
    return fetchWithAuth(`${API_BASE_URL}/rooms/${roomId}/availability`, accessToken, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Update availability (requires roomId and date)
  update: async (
    accessToken: string,
    roomId: string,
    date: string,
    data: Partial<RoomAvailability>
  ): Promise<RoomAvailability> => {
    return fetchWithAuth(`${API_BASE_URL}/rooms/${roomId}/availability/${date}`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  // Delete availability
  delete: async (
    accessToken: string,
    availabilityId: string
  ): Promise<{ message: string }> => {
    return fetchWithAuth(`${API_BASE_URL}/availability/${availabilityId}`, accessToken, {
      method: 'DELETE',
    })
  },
}

// Booking Management APIs
export const bookingsApi = {
  
  // Get user's own bookings
  getByUser: async (accessToken: string): Promise<Booking[]> => {
    return fetchWithAuth(`${API_BASE_URL}/bookings/mine`, accessToken)
  },
  
  // Get all bookings for a hotel
  getByHotel: async (accessToken: string, hotelId: string): Promise<Booking[]> => {
    return fetchWithAuth(`${API_BASE_URL}/hotels/${hotelId}/bookings`, accessToken)
  },

  // Get single booking
  getOne: async (accessToken: string, bookingId: string): Promise<Booking> => {
    return fetchWithAuth(`${API_BASE_URL}/bookings/${bookingId}`, accessToken)
  },

  // Update booking
  update: async (
    accessToken: string,
    bookingId: string,
    data: Partial<Booking>
  ): Promise<Booking> => {
    return fetchWithAuth(`${API_BASE_URL}/bookings/${bookingId}`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  // Cancel booking
  cancel: async (
    accessToken: string,
    bookingId: string,
    reason?: string
  ): Promise<Booking> => {
    return fetchWithAuth(`${API_BASE_URL}/bookings/${bookingId}/cancel`, accessToken, {
      method: 'POST',
      body: JSON.stringify({ cancellation_reason: reason }),
    })
  },

  // Update booking status (confirm/cancel)
  updateStatus: async (
    accessToken: string,
    bookingId: string,
    status: string,
    adminNotes?: string
  ): Promise<Booking> => {
    return fetchWithAuth(`${API_BASE_URL}/bookings/${bookingId}/status`, accessToken, {
      method: 'PATCH',
      body: JSON.stringify({ 
        status,
        admin_notes: adminNotes 
      }),
    })
  },
}



