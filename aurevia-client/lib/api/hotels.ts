// Hotel API service functions

import { Hotel, HotelSearchQuery, HotelSearchResult, CreateBookingData, Booking, AutocompleteResult } from '@/types/hotel';
import axiosInstance from '@/lib/axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export class HotelApiService {
  /**
   * Get all hotels without search constraints
   */
  static async getAllHotels(page: number = 1, limit: number = 12, sortBy?: string, sortOrder?: string): Promise<HotelSearchResult> {
    const searchParams = new URLSearchParams();
    searchParams.set('page', page.toString());
    searchParams.set('limit', limit.toString());
    
    if (sortBy) {
      searchParams.set('sort_by', sortBy);
    }
    if (sortOrder) {
      searchParams.set('sort_order', sortOrder);
    }

    const response = await axiosInstance.get(`/hotels/all?${searchParams.toString()}`);
    
    const data = response.data;
    return {
      hotels: data.data || [],
      total: data.pagination?.total || 0,
      page: data.pagination?.page || 1,
      limit: data.pagination?.limit || 10,
      has_more: data.pagination?.has_more || false,
    };
  }

  /**
   * Search hotels with filters (Elasticsearch-powered)
   */
  static async searchHotels(query: HotelSearchQuery): Promise<HotelSearchResult> {
    const searchParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, item.toString()));
        } else {
          searchParams.set(key, value.toString());
        }
      }
    });

    const response = await axiosInstance.get(`/hotels/search?${searchParams.toString()}`);
    const data = response.data;
    
    // Handle both old format (with pagination) and new Elasticsearch format
    if (data.hotels) {
      // New Elasticsearch format
      return {
        hotels: data.hotels || [],
        total: data.total || 0,
        page: data.page || 1,
        limit: data.limit || 10,
        has_more: (data.page * data.limit) < data.total,
        aggregations: data.aggregations,
      };
    } else {
      // Fallback to old format
      return {
        hotels: data.data || [],
        total: data.pagination?.total || 0,
        page: data.pagination?.page || 1,
        limit: data.pagination?.limit || 10,
        has_more: data.pagination?.has_more || false,
      };
    }
  }

  /**
   * Get hotel details by ID (using public endpoint)
   */
  static async getHotelById(hotelId: string): Promise<Hotel> {
    const response = await axiosInstance.get(`/hotels/${hotelId}/public`);
    // The public endpoint returns the hotel data directly, not wrapped in a data field
    return response.data;
  }

  /**
   * Get rooms for a hotel (public endpoint with availability info)
   */
  static async getHotelRooms(hotelId: string, checkInDate?: string, checkOutDate?: string, numberOfGuests?: number): Promise<any[]> {
    const searchParams = new URLSearchParams();
    if (checkInDate) searchParams.set('check_in_date', checkInDate);
    if (checkOutDate) searchParams.set('check_out_date', checkOutDate);
    if (numberOfGuests) searchParams.set('number_of_guests', numberOfGuests.toString());

    const response = await axiosInstance.get(
      `/hotels/${hotelId}/rooms/public?${searchParams.toString()}`
    );
    
    return response.data.data;
  }

  /**
   * Get nightly price breakdown for a room
   */
  static async getRoomPricingBreakdown(
    roomId: string,
    checkInDate: string,
    checkOutDate: string
  ): Promise<{
    nights: Array<{ date: string; dayName: string; price: number }>;
    subtotal: number;
    numberOfNights: number;
  }> {
    const searchParams = new URLSearchParams();
    searchParams.set('check_in_date', checkInDate);
    searchParams.set('check_out_date', checkOutDate);

    const response = await axiosInstance.get(
      `/rooms/${roomId}/pricing-breakdown?${searchParams.toString()}`
    );
    
    return response.data;
  }

  /**
   * Create a new booking
   */
  static async createBooking(bookingData: CreateBookingData): Promise<Booking> {
    const response = await axiosInstance.post('/bookings', bookingData);
    
    // Handle different response structures
    if (response.data.data) {
      return response.data.data;
    } else if (response.data.id) {
      return response.data;
    }
    
    throw new Error('Invalid booking response structure');
  }

  /**
   * Get user's bookings
   */
  static async getUserBookings(page = 1, limit = 10): Promise<{
    bookings: Booking[];
    total: number;
    page: number;
    limit: number;
  }> {
    const response = await axiosInstance.get(
      `/bookings/my-bookings?page=${page}&limit=${limit}`
    );

    const data = response.data;
    return {
      bookings: data.data || [],
      total: data.pagination?.total || 0,
      page: data.pagination?.page || 1,
      limit: data.pagination?.limit || 10,
    };
  }

  /**
   * Cancel a booking
   */
  static async cancelBooking(bookingId: string): Promise<void> {
    await axiosInstance.patch(`/bookings/${bookingId}/cancel`);
  }

  /**
   * Get autocomplete suggestions from Elasticsearch
   */
  static async getAutocompleteSuggestions(query: string, limit: number = 10): Promise<AutocompleteResult> {
    if (!query || query.trim().length < 2) {
      return { suggestions: [] };
    }

    try {
      const searchParams = new URLSearchParams();
      searchParams.set('q', query.trim());
      searchParams.set('limit', limit.toString());

      const response = await axiosInstance.get(`/search/hotels/autocomplete?${searchParams.toString()}`);
      return response.data;
    } catch (error) {
      console.warn('Autocomplete failed, falling back to popular cities:', error);
      // Fallback to popular cities if autocomplete fails
      const popularCities = await this.getPopularCities();
      const filteredCities = popularCities.filter(city => 
        city.toLowerCase().includes(query.toLowerCase())
      );
      
      return {
        suggestions: filteredCities.map(city => ({
          text: city,
          type: 'city' as const,
        })),
      };
    }
  }

  /**
   * Advanced Elasticsearch search with full features
   */
  static async advancedSearch(query: HotelSearchQuery): Promise<HotelSearchResult> {
    const searchParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, item.toString()));
        } else {
          searchParams.set(key, value.toString());
        }
      }
    });

    const response = await fetch(`${API_BASE_URL}/search/hotels?${searchParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Advanced search failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      hotels: data.hotels || [],
      total: data.total || 0,
      page: data.page || 1,
      limit: data.limit || 10,
      has_more: (data.page * data.limit) < data.total,
      aggregations: data.aggregations,
    };
  }

  /**
   * Get popular cities for destination suggestions (fallback)
   */
  static async getPopularCities(): Promise<string[]> {
    // Return Vietnamese cities since our hotel database is focused on Vietnam
    return [
      'Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hoi An', 'Hue', 
      'Nha Trang', 'Can Tho', 'Dalat', 'Vung Tau', 'Phan Thiet',
      'Ha Long', 'Sapa', 'Ninh Binh', 'Quy Nhon', 'Mui Ne'
    ];
  }

  /**
   * Get room details by ID
   */
  static async getRoomById(roomId: string) {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch room details: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Get booking details by ID
   */
  static async getBookingById(bookingId: string): Promise<Booking> {
    const response = await axiosInstance.get(`/bookings/${bookingId}`);
    
    // Handle different response structures
    if (response.data.data) {
      return response.data.data;
    } else if (response.data.id) {
      return response.data;
    }
    
    throw new Error('Invalid booking response structure');
  }

  /**
   * Get hotel amenities list
   */
  static async getHotelAmenities() {
    try {
      const response = await axiosInstance.get('/hotels/amenities');
      return response.data.data || [];
    } catch (error) {
      console.warn('Failed to fetch amenities:', error);
      
      // Fallback amenities
      return [
        { id: '1', name: 'WiFi', category: 'connectivity' },
        { id: '2', name: 'Pool', category: 'recreation' },
        { id: '3', name: 'Gym', category: 'fitness' },
        { id: '4', name: 'Spa', category: 'wellness' },
        { id: '5', name: 'Restaurant', category: 'dining' },
        { id: '6', name: 'Bar', category: 'dining' },
        { id: '7', name: 'Parking', category: 'services' },
        { id: '8', name: 'Pet Friendly', category: 'services' },
      ];
    }
  }
}
