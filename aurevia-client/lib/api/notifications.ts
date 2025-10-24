import axiosInstance from '@/lib/axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface CreateNotificationData {
  user_id: string;
  type: string;
  title: string;
  message: string;
  metadata?: any;
  related_entity_type?: string;
  related_entity_id?: string;
}

export class NotificationApiService {
  /**
   * Create a notification for a specific user
   */
  static async createNotification(
    notificationData: CreateNotificationData
  ): Promise<any> {
    const response = await axiosInstance.post('/notifications', notificationData);
    console.log('Notification created:', response.data);
    return response.data;
  }

  /**
   * Get notifications for a specific user
   */
  static async getUserNotifications(userId: string): Promise<any> {
    const response = await axiosInstance.get(`/notifications/user/${userId}`);
    return response.data;
  }
}

