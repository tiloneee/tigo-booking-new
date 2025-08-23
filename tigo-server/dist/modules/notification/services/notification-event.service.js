"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationEventService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../chat/services/redis.service");
const notification_service_1 = require("./notification.service");
const notification_entity_1 = require("../entities/notification.entity");
let NotificationEventService = class NotificationEventService {
    redisService;
    notificationService;
    constructor(redisService, notificationService) {
        this.redisService = redisService;
        this.notificationService = notificationService;
    }
    async onModuleInit() {
        await this.subscribeToNotificationEvents();
    }
    async subscribeToNotificationEvents() {
        await this.redisService.subscribe('notification:events', async (eventData) => {
            try {
                await this.handleNotificationEvent(eventData);
            }
            catch (error) {
                console.error('Error handling notification event:', error);
            }
        });
    }
    async handleNotificationEvent(eventData) {
        const { type, user_id, title, message, metadata, related_entity_type, related_entity_id } = eventData;
        if (!type || !user_id || !title || !message) {
            console.error('Invalid notification event data:', eventData);
            return;
        }
        let notificationType;
        switch (type) {
            case 'CHAT_MESSAGE':
                notificationType = notification_entity_1.NotificationType.CHAT_MESSAGE;
                break;
            case 'BOOKING_CONFIRMATION':
                notificationType = notification_entity_1.NotificationType.BOOKING_CONFIRMATION;
                break;
            case 'BOOKING_CANCELLED':
                notificationType = notification_entity_1.NotificationType.BOOKING_CANCELLED;
                break;
            case 'BOOKING_REMINDER':
                notificationType = notification_entity_1.NotificationType.BOOKING_REMINDER;
                break;
            case 'REVIEW_RECEIVED':
                notificationType = notification_entity_1.NotificationType.REVIEW_RECEIVED;
                break;
            case 'HOTEL_APPROVED':
                notificationType = notification_entity_1.NotificationType.HOTEL_APPROVED;
                break;
            case 'HOTEL_REJECTED':
                notificationType = notification_entity_1.NotificationType.HOTEL_REJECTED;
                break;
            case 'SYSTEM_ANNOUNCEMENT':
                notificationType = notification_entity_1.NotificationType.SYSTEM_ANNOUNCEMENT;
                break;
            case 'PAYMENT_SUCCESS':
                notificationType = notification_entity_1.NotificationType.PAYMENT_SUCCESS;
                break;
            case 'PAYMENT_FAILED':
                notificationType = notification_entity_1.NotificationType.PAYMENT_FAILED;
                break;
            default:
                console.error(`Unknown notification type: ${type}`);
                return;
        }
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
    async triggerChatMessageNotification(userId, senderName, content, metadata) {
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
    async triggerBookingNotification(userId, type, title, message, metadata) {
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
    async triggerHotelNotification(userId, type, title, message, metadata) {
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
    async triggerReviewNotification(userId, title, message, metadata) {
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
    async triggerPaymentNotification(userId, type, title, message, metadata) {
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
    async triggerSystemAnnouncement(title, message, metadata) {
        await this.redisService.publishMessage('notification:broadcast', {
            type: 'SYSTEM_ANNOUNCEMENT',
            title,
            message,
            metadata,
        });
    }
};
exports.NotificationEventService = NotificationEventService;
exports.NotificationEventService = NotificationEventService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        notification_service_1.NotificationService])
], NotificationEventService);
//# sourceMappingURL=notification-event.service.js.map