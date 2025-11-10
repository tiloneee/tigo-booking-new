// Hotel Request API service functions

import axiosInstance from '@/lib/axios';

export interface CreateHotelRequestData {
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  phone_number: string;
}

export interface HotelRequest {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  phone_number: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_by_user_id: string;
  reviewed_by_user_id: string | null;
  admin_notes: string | null;
  created_hotel_id: string | null;
  created_at: string;
  updated_at: string;
  requested_by?: {
    id: string;
    username: string;
    email: string;
  };
  reviewed_by?: {
    id: string;
    username: string;
    email: string;
  };
}

export const hotelRequestApi = {
  /**
   * Submit a hotel request
   */
  async createHotelRequest(data: CreateHotelRequestData): Promise<HotelRequest> {
    const response = await axiosInstance.post('/hotels/requests', data);
    return response.data;
  },

  /**
   * Get all hotel requests submitted by the current user
   */
  async getMyHotelRequests(): Promise<HotelRequest[]> {
    const response = await axiosInstance.get('/hotels/requests/mine');
    return response.data;
  },

  /**
   * Get all hotel requests (admin only)
   */
  async getAllHotelRequests(status?: 'pending' | 'approved' | 'rejected'): Promise<HotelRequest[]> {
    const params = new URLSearchParams();
    if (status) {
      params.set('status', status);
    }
    const response = await axiosInstance.get(`/hotels/requests?${params.toString()}`);
    return response.data;
  },

  /**
   * Get hotel request by ID (admin only)
   */
  async getHotelRequestById(requestId: string): Promise<HotelRequest> {
    const response = await axiosInstance.get(`/hotels/requests/${requestId}`);
    return response.data;
  },

  /**
   * Review a hotel request (admin only)
   */
  async reviewHotelRequest(
    requestId: string,
    status: 'approved' | 'rejected',
    adminNotes?: string,
  ): Promise<HotelRequest> {
    const response = await axiosInstance.patch(`/hotels/requests/${requestId}/review`, {
      status,
      admin_notes: adminNotes,
    });
    return response.data;
  },
};
