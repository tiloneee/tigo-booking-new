import { RedisService } from '../../chat/services/redis.service';
import { Notification } from '../entities/notification.entity';
export declare class RedisNotificationService {
    private readonly redisService;
    private readonly NOTIFICATION_CHANNEL;
    private readonly UNREAD_COUNT_PREFIX;
    private readonly USER_NOTIFICATIONS_PREFIX;
    constructor(redisService: RedisService);
    sendRealTimeNotification(userId: string, notification: Notification): Promise<void>;
    updateUnreadCount(userId: string): Promise<void>;
    storeRecentNotification(userId: string, notification: Notification): Promise<void>;
    getRecentNotifications(userId: string): Promise<Notification[]>;
    subscribeToUserNotifications(userId: string, callback: (notification: any) => void): Promise<void>;
    subscribeToUserNotificationCount(userId: string, callback: (data: any) => void): Promise<void>;
    unsubscribeFromUserNotifications(userId: string): Promise<void>;
    sendBroadcastNotification(notification: any): Promise<void>;
    subscribeToBroadcastNotifications(callback: (notification: any) => void): Promise<void>;
    cacheUserPreferences(userId: string, preferences: any): Promise<void>;
    getCachedUserPreferences(userId: string): Promise<any>;
    clearUserPreferencesCache(userId: string): Promise<void>;
}
