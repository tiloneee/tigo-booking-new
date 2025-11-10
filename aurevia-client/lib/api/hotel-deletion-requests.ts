// Hotel Deletion Request API service functions

import axiosInstance from '@/lib/axios';

export interface CreateHotelDeletionRequestData {
  reason: string;
}

export interface HotelDeletionRequest {
  id: string;
  hotel_id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_by_user_id: string;
  reviewed_by_user_id: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  hotel?: {
    id: string;
    name: string;
    address: string;
    city: string;
    is_active: boolean;
  };
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

export const hotelDeletionRequestApi = {
  /**
   * Submit a hotel deletion request (Hotel Owner)
   */
  async createHotelDeletionRequest(
    hotelId: string,
    data: CreateHotelDeletionRequestData,
  ): Promise<HotelDeletionRequest> {
    const response = await axiosInstance.post(
      `/hotels/${hotelId}/deletion-request`,
      data,
    );
    return response.data;
  },

  /**
   * Get all hotel deletion requests submitted by the current user (Hotel Owner)
   */
  async getMyHotelDeletionRequests(): Promise<HotelDeletionRequest[]> {
    const response = await axiosInstance.get('/hotels/deletion-requests/mine');
    return response.data;
  },

  /**
   * Get all hotel deletion requests (Admin only)
   */
  async getAllHotelDeletionRequests(
    status?: 'pending' | 'approved' | 'rejected',
  ): Promise<HotelDeletionRequest[]> {
    const params = new URLSearchParams();
    if (status) {
      params.set('status', status);
    }
    const response = await axiosInstance.get(
      `/hotels/deletion-requests?${params.toString()}`,
    );
    return response.data;
  },

  /**
   * Get hotel deletion request by ID (Admin only)
   */
  async getHotelDeletionRequestById(
    requestId: string,
  ): Promise<HotelDeletionRequest> {
    const response = await axiosInstance.get(
      `/hotels/deletion-requests/${requestId}`,
    );
    return response.data;
  },

  /**
   * Review a hotel deletion request (Admin only)
   */
  async reviewHotelDeletionRequest(
    requestId: string,
    status: 'approved' | 'rejected',
    adminNotes?: string,
  ): Promise<HotelDeletionRequest> {
    const response = await axiosInstance.patch(
      `/hotels/deletion-requests/${requestId}/review`,
      {
        status,
        admin_notes: adminNotes,
      },
    );
    return response.data;
  },
};
