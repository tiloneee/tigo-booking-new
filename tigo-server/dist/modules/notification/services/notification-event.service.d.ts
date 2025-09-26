import { OnModuleInit } from '@nestjs/common';
import { RedisService } from '../../chat/services/redis.service';
import { NotificationService } from './notification.service';
export declare class NotificationEventService implements OnModuleInit {
    private readonly redisService;
    private readonly notificationService;
    constructor(redisService: RedisService, notificationService: NotificationService);
    onModuleInit(): Promise<void>;
    private subscribeToNotificationEvents;
    private handleNotificationEvent;
    triggerChatMessageNotification(userId: string, senderName: string, content: string, metadata: any): Promise<void>;
    triggerBookingNotification(userId: string, type: 'BOOKING_CONFIRMATION' | 'BOOKING_CANCELLED' | 'BOOKING_REMINDER', title: string, message: string, metadata: any): Promise<void>;
    triggerHotelNotification(userId: string, type: 'HOTEL_APPROVED' | 'HOTEL_REJECTED', title: string, message: string, metadata: any): Promise<void>;
    triggerReviewNotification(userId: string, title: string, message: string, metadata: any): Promise<void>;
    triggerPaymentNotification(userId: string, type: 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED', title: string, message: string, metadata: any): Promise<void>;
    triggerSystemAnnouncement(title: string, message: string, metadata?: any): Promise<void>;
}
