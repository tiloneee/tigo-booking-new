import type { DashboardUser, Hotel, Room, Booking, RoomAvailability } from '@/types/dashboard'
import axiosInstance from '@/lib/axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

// User Management APIs (Admin only)
export const usersApi = {
  getAll: async (): Promise<DashboardUser[]> => {
    const response = await axiosInstance.get('/users');
    return response.data;
  },

  getOne: async (userId: string): Promise<DashboardUser> => {
    const response = await axiosInstance.get(`/users/${userId}`);
    return response.data;
  },

  update: async (
    userId: string,
    data: Partial<DashboardUser>
  ): Promise<DashboardUser> => {
    const response = await axiosInstance.patch(`/users/${userId}`, data);
    return response.data;
  },

  delete: async (userId: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(`/users/${userId}`);
    return response.data;
  },

  assignRole: async (
    userId: string,
    role: string
  ): Promise<DashboardUser> => {
    const response = await axiosInstance.post(`/users/${userId}/roles`, { role });
    return response.data;
  },
}

// Hotel Management APIs
export const hotelsApi = {
  // Get all hotels (Admin only)
  getAll: async (): Promise<Hotel[]> => {
    const response = await axiosInstance.get('/hotels');
    return response.data;
  },

  // Get hotels owned by the current user (HotelOwner)
  getOwned: async (): Promise<Hotel[]> => {
    const response = await axiosInstance.get('/hotels/mine');
    return response.data;
  },

  // Get single hotel with details
  getOne: async (hotelId: string): Promise<Hotel> => {
    const response = await axiosInstance.get(`/hotels/${hotelId}`);
    return response.data;
  },

  // Update hotel
  update: async (
    hotelId: string,
    data: Partial<Hotel>
  ): Promise<Hotel> => {
    const response = await axiosInstance.patch(`/hotels/${hotelId}`, data);
    return response.data;
  },

  // Delete hotel
  delete: async (hotelId: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(`/hotels/${hotelId}`);
    return response.data;
  },
}

// Room Management APIs
export const roomsApi = {
  // Get all rooms for a hotel
  getByHotel: async (hotelId: string): Promise<Room[]> => {
    const response = await axiosInstance.get(`/hotels/${hotelId}/rooms`);
    return response.data;
  },

  // Get single room
  getOne: async (roomId: string): Promise<Room> => {
    const response = await axiosInstance.get(`/rooms/${roomId}`);
    return response.data;
  },

  // Create room
  create: async (
    hotelId: string,
    data: Partial<Room>
  ): Promise<Room> => {
    const response = await axiosInstance.post(`/hotels/${hotelId}/rooms`, data);
    return response.data;
  },

  // Update room
  update: async (
    roomId: string,
    data: Partial<Room>
  ): Promise<Room> => {
    const response = await axiosInstance.patch(`/rooms/${roomId}`, data);
    return response.data;
  },

  // Delete room
  delete: async (roomId: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(`/rooms/${roomId}`);
    return response.data;
  },
}

// Room Availability APIs
export const availabilityApi = {
  // Get availability for a room
  getByRoom: async (roomId: string): Promise<RoomAvailability[]> => {
    const response = await axiosInstance.get(`/rooms/${roomId}/availability`);
    return response.data;
  },

  // Create availability
  create: async (
    roomId: string,
    data: Partial<RoomAvailability>
  ): Promise<RoomAvailability> => {
    const response = await axiosInstance.post(`/rooms/${roomId}/availability`, data);
    return response.data;
  },

  // Update availability (requires roomId and date)
  update: async (
    roomId: string,
    date: string,
    data: Partial<RoomAvailability>
  ): Promise<RoomAvailability> => {
    const response = await axiosInstance.patch(`/rooms/${roomId}/availability/${date}`, data);
    return response.data;
  },

  // Delete availability
  delete: async (
    availabilityId: string
  ): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(`/availability/${availabilityId}`);
    return response.data;
  },
}

// Booking Management APIs
export const bookingsApi = {
  
  // Get user's own bookings
  getByUser: async (): Promise<Booking[]> => {
    const response = await axiosInstance.get('/bookings/mine');
    return response.data;
  },
  
  // Get all bookings for hotel owner's hotels
  getByHotelOwner: async (): Promise<Booking[]> => {
    const response = await axiosInstance.get('/bookings/search');
    return response.data;
  },
  
  // Get all bookings for a hotel
  getByHotel: async (hotelId: string): Promise<Booking[]> => {
    const response = await axiosInstance.get(`/hotels/${hotelId}/bookings`);
    return response.data;
  },

  // Get single booking
  getOne: async (bookingId: string): Promise<Booking> => {
    const response = await axiosInstance.get(`/bookings/${bookingId}`);
    return response.data;
  },

  // Update booking
  update: async (
    bookingId: string,
    data: Partial<Booking>
  ): Promise<Booking> => {
    const response = await axiosInstance.patch(`/bookings/${bookingId}`, data);
    return response.data;
  },

  // Cancel booking
  cancel: async (
    bookingId: string,
    reason?: string
  ): Promise<Booking> => {
    const response = await axiosInstance.patch(`/bookings/${bookingId}/cancel`, {
      cancellation_reason: reason
    });
    return response.data;
  },

  // Update booking status (confirm/cancel)
  updateStatus: async (
    bookingId: string,
    status: string,
    adminNotes?: string
  ): Promise<Booking> => {
    const response = await axiosInstance.patch(`/bookings/${bookingId}/status`, {
      status,
      admin_notes: adminNotes
    });
    return response.data;
  },
}



