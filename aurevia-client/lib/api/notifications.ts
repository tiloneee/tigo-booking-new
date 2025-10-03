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
    notificationData: CreateNotificationData,
    token: string
  ): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(notificationData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || `Failed to create notification: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Notification created:', data);
    
    return data;
  }

  /**
   * Get notifications for a specific user
   */
  static async getUserNotifications(userId: string, token: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/notifications/user/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch notifications: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }
}
