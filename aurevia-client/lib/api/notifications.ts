import axiosInstance from '@/lib/axios';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  status: 'UNREAD' | 'READ' | 'ARCHIVED';
  metadata?: any;
  related_entity_type?: string;
  related_entity_id?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
}

export class NotificationApiService {
  /**
   * Get all notifications for the current user (paginated)
   */
  static async getNotifications(page: number = 1, limit: number = 20): Promise<NotificationListResponse> {
    const response = await axiosInstance.get(`/notifications?page=${page}&limit=${limit}`);
    return response.data;
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId: string): Promise<Notification> {
    const response = await axiosInstance.put(`/notifications/${notificationId}/mark`, {
      status: 'READ'
    });
    return response.data;
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(): Promise<{ message: string; count: number }> {
    const response = await axiosInstance.put('/notifications/mark-all-read');
    return response.data;
  }

  /**
   * Delete a specific notification
   */
  static async deleteNotification(notificationId: string): Promise<{ message: string }> {
    const response = await axiosInstance.delete(`/notifications/${notificationId}`);
    return response.data;
  }

  /**
   * Delete all notifications for the current user
   */
  static async deleteAllNotifications(): Promise<{ message: string; count: number }> {
    const response = await axiosInstance.delete('/notifications/delete-all');
    return response.data;
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount(): Promise<{ count: number }> {
    const response = await axiosInstance.get('/notifications/unread-count');
    return response.data;
  }
}

