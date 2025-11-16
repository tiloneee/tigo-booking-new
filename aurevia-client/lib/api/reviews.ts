// Review API service functions

import { Review, CreateReviewDto, UpdateReviewDto, ReviewStatistics } from '@/types/review';
import axiosInstance from '@/lib/axios';

export class ReviewApiService {
  /**
   * Create a review for a hotel
   */
  static async createReview(reviewData: CreateReviewDto): Promise<Review> {
    const response = await axiosInstance.post('/reviews', reviewData);
    return response.data;
  }

  /**
   * Create a review for a specific hotel (alternative endpoint)
   */
  static async createHotelReview(hotelId: string, reviewData: CreateReviewDto): Promise<Review> {
    const response = await axiosInstance.post(`/hotels/${hotelId}/reviews`, reviewData);
    return response.data;
  }

  /**
   * Get all reviews for a hotel
   */
  static async getHotelReviews(hotelId: string, includePending: boolean = false): Promise<Review[]> {
    const response = await axiosInstance.get(`/hotels/${hotelId}/reviews`, {
      params: { include_pending: includePending }
    });
    return response.data;
  }

  /**
   * Get review statistics for a hotel
   */
  static async getHotelReviewStatistics(hotelId: string): Promise<ReviewStatistics> {
    const response = await axiosInstance.get(`/hotels/${hotelId}/reviews/statistics`);
    return response.data;
  }

  /**
   * Get current user's reviews
   */
  static async getMyReviews(): Promise<Review[]> {
    const response = await axiosInstance.get('/reviews/mine');
    return response.data;
  }

  /**
   * Get a specific review by ID
   */
  static async getReviewById(reviewId: string): Promise<Review> {
    const response = await axiosInstance.get(`/reviews/${reviewId}`);
    return response.data;
  }

  /**
   * Update a review
   */
  static async updateReview(reviewId: string, updateData: UpdateReviewDto): Promise<Review> {
    const response = await axiosInstance.patch(`/reviews/${reviewId}`, updateData);
    return response.data;
  }

  /**
   * Delete a review
   */
  static async deleteReview(reviewId: string): Promise<void> {
    await axiosInstance.delete(`/reviews/${reviewId}`);
  }

  /**
   * Vote on a review's helpfulness
   */
  static async voteHelpful(reviewId: string, isHelpful: boolean): Promise<Review> {
    const response = await axiosInstance.post(`/reviews/${reviewId}/vote`, {
      is_helpful: isHelpful
    });
    return response.data;
  }
}
