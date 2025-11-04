import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../common/services/redis.service';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class RedisNotificationService {
  private readonly NOTIFICATION_CHANNEL = 'notifications';
  private readonly UNREAD_COUNT_PREFIX = 'unread_count';
  private readonly USER_NOTIFICATIONS_PREFIX = 'user_notifications';

  constructor(private readonly redisService: RedisService) {}

  async sendRealTimeNotification(userId: string, notification: Notification): Promise<void> {
    const channel = `${this.NOTIFICATION_CHANNEL}:${userId}`;
    
    await this.redisService.publishMessage(channel, {
      type: 'NEW_NOTIFICATION',
      data: notification,
      timestamp: new Date().toISOString(),
    });

    // Update unread count in Redis
    await this.updateUnreadCount(userId);
    
    // Store recent notifications in Redis for quick access
    await this.storeRecentNotification(userId, notification);
  }

  async updateUnreadCount(userId: string): Promise<void> {
    // This would typically query the database for actual unread count
    // For real-time updates, we can increment/decrement the cached count
    const countKey = `${this.UNREAD_COUNT_PREFIX}:${userId}`;
    
    // Publish unread count update
    const channel = `${this.NOTIFICATION_CHANNEL}:${userId}:count`;
    await this.redisService.publishMessage(channel, {
      type: 'UNREAD_COUNT_UPDATE',
      timestamp: new Date().toISOString(),
    });
  }

  async storeRecentNotification(userId: string, notification: Notification): Promise<void> {
    const key = `${this.USER_NOTIFICATIONS_PREFIX}:${userId}:recent`;
    
    // Store as a JSON string in Redis
    const notificationData = JSON.stringify(notification);
    await this.redisService.set(key, notificationData, 86400); // 24 hours TTL
  }

  async getRecentNotifications(userId: string): Promise<Notification[]> {
    const key = `${this.USER_NOTIFICATIONS_PREFIX}:${userId}:recent`;
    const notificationData = await this.redisService.get(key);
    
    if (!notificationData) {
      return [];
    }
    
    try {
      return [JSON.parse(notificationData)];
    } catch {
      return [];
    }
  }

  async subscribeToUserNotifications(
    userId: string,
    callback: (notification: any) => void,
  ): Promise<void> {
    const channel = `${this.NOTIFICATION_CHANNEL}:${userId}`;
    await this.redisService.subscribe(channel, callback);
  }

  async subscribeToUserNotificationCount(
    userId: string,
    callback: (data: any) => void,
  ): Promise<void> {
    const channel = `${this.NOTIFICATION_CHANNEL}:${userId}:count`;
    await this.redisService.subscribe(channel, callback);
  }

  async unsubscribeFromUserNotifications(userId: string): Promise<void> {
    const channel = `${this.NOTIFICATION_CHANNEL}:${userId}`;
    await this.redisService.unsubscribe(channel);
  }

  async sendBroadcastNotification(notification: any): Promise<void> {
    const channel = `${this.NOTIFICATION_CHANNEL}:broadcast`;
    
    await this.redisService.publishMessage(channel, {
      type: 'BROADCAST_NOTIFICATION',
      data: notification,
      timestamp: new Date().toISOString(),
    });
  }

  async subscribeToBroadcastNotifications(
    callback: (notification: any) => void,
  ): Promise<void> {
    const channel = `${this.NOTIFICATION_CHANNEL}:broadcast`;
    await this.redisService.subscribe(channel, callback);
  }

  // Cache notification preferences for faster access
  async cacheUserPreferences(userId: string, preferences: any): Promise<void> {
    const key = `user_preferences:${userId}`;
    await this.redisService.set(key, preferences, 3600); // 1 hour TTL
  }

  async getCachedUserPreferences(userId: string): Promise<any> {
    const key = `user_preferences:${userId}`;
    return this.redisService.get(key);
  }

  async clearUserPreferencesCache(userId: string): Promise<void> {
    const key = `user_preferences:${userId}`;
    await this.redisService.del(key);
  }
}
