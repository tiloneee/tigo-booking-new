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
exports.RedisNotificationService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../../chat/services/redis.service");
let RedisNotificationService = class RedisNotificationService {
    redisService;
    NOTIFICATION_CHANNEL = 'notifications';
    UNREAD_COUNT_PREFIX = 'unread_count';
    USER_NOTIFICATIONS_PREFIX = 'user_notifications';
    constructor(redisService) {
        this.redisService = redisService;
    }
    async sendRealTimeNotification(userId, notification) {
        const channel = `${this.NOTIFICATION_CHANNEL}:${userId}`;
        await this.redisService.publishMessage(channel, {
            type: 'NEW_NOTIFICATION',
            data: notification,
            timestamp: new Date().toISOString(),
        });
        await this.updateUnreadCount(userId);
        await this.storeRecentNotification(userId, notification);
    }
    async updateUnreadCount(userId) {
        const countKey = `${this.UNREAD_COUNT_PREFIX}:${userId}`;
        const channel = `${this.NOTIFICATION_CHANNEL}:${userId}:count`;
        await this.redisService.publishMessage(channel, {
            type: 'UNREAD_COUNT_UPDATE',
            timestamp: new Date().toISOString(),
        });
    }
    async storeRecentNotification(userId, notification) {
        const key = `${this.USER_NOTIFICATIONS_PREFIX}:${userId}:recent`;
        const notificationData = JSON.stringify(notification);
        await this.redisService.set(key, notificationData, 86400);
    }
    async getRecentNotifications(userId) {
        const key = `${this.USER_NOTIFICATIONS_PREFIX}:${userId}:recent`;
        const notificationData = await this.redisService.get(key);
        if (!notificationData) {
            return [];
        }
        try {
            return [JSON.parse(notificationData)];
        }
        catch {
            return [];
        }
    }
    async subscribeToUserNotifications(userId, callback) {
        const channel = `${this.NOTIFICATION_CHANNEL}:${userId}`;
        await this.redisService.subscribe(channel, callback);
    }
    async subscribeToUserNotificationCount(userId, callback) {
        const channel = `${this.NOTIFICATION_CHANNEL}:${userId}:count`;
        await this.redisService.subscribe(channel, callback);
    }
    async unsubscribeFromUserNotifications(userId) {
        const channel = `${this.NOTIFICATION_CHANNEL}:${userId}`;
        await this.redisService.unsubscribe(channel);
    }
    async sendBroadcastNotification(notification) {
        const channel = `${this.NOTIFICATION_CHANNEL}:broadcast`;
        await this.redisService.publishMessage(channel, {
            type: 'BROADCAST_NOTIFICATION',
            data: notification,
            timestamp: new Date().toISOString(),
        });
    }
    async subscribeToBroadcastNotifications(callback) {
        const channel = `${this.NOTIFICATION_CHANNEL}:broadcast`;
        await this.redisService.subscribe(channel, callback);
    }
    async cacheUserPreferences(userId, preferences) {
        const key = `user_preferences:${userId}`;
        await this.redisService.set(key, preferences, 3600);
    }
    async getCachedUserPreferences(userId) {
        const key = `user_preferences:${userId}`;
        return this.redisService.get(key);
    }
    async clearUserPreferencesCache(userId) {
        const key = `user_preferences:${userId}`;
        await this.redisService.del(key);
    }
};
exports.RedisNotificationService = RedisNotificationService;
exports.RedisNotificationService = RedisNotificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], RedisNotificationService);
//# sourceMappingURL=redis-notification.service.js.map