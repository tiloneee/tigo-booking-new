import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisService } from '../../chat/services/redis.service';
import { NotificationService } from './notification.service';
import { NotificationType } from '../entities/notification.entity';

@Injectable()
export class NotificationEventService implements OnModuleInit {
  constructor(
    private readonly redisService: RedisService,
    private readonly notificationService: NotificationService,
  ) {}

  async onModuleInit() {
    // Subscribe to notification events from other modules
    await this.subscribeToNotificationEvents();
  }

  private async subscribeToNotificationEvents() {
    await this.redisService.subscribe('notification:events', async (eventData) => {
      try {
        await this.handleNotificationEvent(eventData);
      } catch (error) {
        console.error('Error handling notification event:', error);
      }
    });
  }

  private async handleNotificationEvent(eventData: any) {
    const { type, user_id, title, message, metadata, related_entity_type, related_entity_id } = eventData;

    // Validate required fields
    if (!type || !user_id || !title || !message) {
      console.error('Invalid notification event data:', eventData);
      return;
    }

    // Map event type to notification type
    let notificationType: NotificationType;
    switch (type) {
      case 'CHAT_MESSAGE':
        notificationType = NotificationType.CHAT_MESSAGE;
        break;
      case 'BOOKING_CONFIRMATION':
        notificationType = NotificationType.BOOKING_CONFIRMATION;
        break;
      case 'BOOKING_CANCELLED':
        notificationType = NotificationType.BOOKING_CANCELLED;
        break;
      case 'NEW_BOOKING':
        notificationType = NotificationType.NEW_BOOKING;
        break;
      case 'BOOKING_REMINDER':
        notificationType = NotificationType.BOOKING_REMINDER;
        break;
      case 'REVIEW_RECEIVED':
        notificationType = NotificationType.REVIEW_RECEIVED;
        break;
      case 'HOTEL_APPROVED':
        notificationType = NotificationType.HOTEL_APPROVED;
        break;
      case 'HOTEL_REJECTED':
        notificationType = NotificationType.HOTEL_REJECTED;
        break;
      case 'SYSTEM_ANNOUNCEMENT':
        notificationType = NotificationType.SYSTEM_ANNOUNCEMENT;
        break;
      case 'PAYMENT_SUCCESS':
        notificationType = NotificationType.PAYMENT_SUCCESS;
        break;
      case 'PAYMENT_FAILED':
        notificationType = NotificationType.PAYMENT_FAILED;
        break;
      default:
        console.error(`Unknown notification type: ${type}`);
        return;
    }

    // Create notification
    await this.notificationService.createNotification({
      type: notificationType,
      user_id,
      title,
      message,
      metadata,
      related_entity_type,
      related_entity_id,
    });
  }

  // Helper methods for other modules to trigger notifications
  async triggerChatMessageNotification(userId: string, senderName: string, content: string, metadata: any) {
    await this.redisService.publishMessage('notification:events', {
      type: 'CHAT_MESSAGE',
      user_id: userId,
      title: `New message from ${senderName}`,
      message: content.length > 100 ? content.substring(0, 100) + '...' : content,
      metadata,
      related_entity_type: 'chat_message',
      related_entity_id: metadata.message_id,
    });
  }

  async triggerBookingNotification(userId: string, type: 'BOOKING_CONFIRMATION' | 'BOOKING_CANCELLED' | 'BOOKING_REMINDER', title: string, message: string, metadata: any) {
    await this.redisService.publishMessage('notification:events', {
      type,
      user_id: userId,
      title,
      message,
      metadata,
      related_entity_type: 'booking',
      related_entity_id: metadata.booking_id,
    });
  }

  async triggerHotelNotification(userId: string, type: 'HOTEL_APPROVED' | 'HOTEL_REJECTED', title: string, message: string, metadata: any) {
    await this.redisService.publishMessage('notification:events', {
      type,
      user_id: userId,
      title,
      message,
      metadata,
      related_entity_type: 'hotel',
      related_entity_id: metadata.hotel_id,
    });
  }

  async triggerReviewNotification(userId: string, title: string, message: string, metadata: any) {
    await this.redisService.publishMessage('notification:events', {
      type: 'REVIEW_RECEIVED',
      user_id: userId,
      title,
      message,
      metadata,
      related_entity_type: 'review',
      related_entity_id: metadata.review_id,
    });
  }

  async triggerPaymentNotification(userId: string, type: 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED', title: string, message: string, metadata: any) {
    await this.redisService.publishMessage('notification:events', {
      type,
      user_id: userId,
      title,
      message,
      metadata,
      related_entity_type: 'payment',
      related_entity_id: metadata.payment_id,
    });
  }

  async triggerSystemAnnouncement(title: string, message: string, metadata?: any) {
    // This will be handled differently as it needs to go to all users
    await this.redisService.publishMessage('notification:broadcast', {
      type: 'SYSTEM_ANNOUNCEMENT',
      title,
      message,
      metadata,
    });
  }
}
