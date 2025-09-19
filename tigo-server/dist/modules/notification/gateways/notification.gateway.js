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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const redis_notification_service_1 = require("../services/redis-notification.service");
const notification_service_1 = require("../services/notification.service");
let NotificationGateway = class NotificationGateway {
    jwtService;
    redisNotificationService;
    notificationService;
    server;
    connectedUsers = new Map();
    constructor(jwtService, redisNotificationService, notificationService) {
        this.jwtService = jwtService;
        this.redisNotificationService = redisNotificationService;
        this.notificationService = notificationService;
    }
    afterInit(server) {
        console.log('Notification Gateway initialized');
    }
    async handleConnection(client) {
        try {
            const token = this.extractTokenFromHandshake(client);
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = await this.jwtService.verifyAsync(token);
            client.userId = payload.sub;
            client.userRoles = payload.roles || [];
            if (!client.userId) {
                client.disconnect();
                return;
            }
            console.log(`Notification client connected: ${client.userId}`);
            this.connectedUsers.set(client.userId, client);
            await this.subscribeToUserNotifications(client.userId);
            await this.subscribeToBroadcastNotifications();
            const unreadCount = await this.notificationService.getUnreadCount(client.userId);
            client.emit('unread_count', { count: unreadCount });
            const recentNotifications = await this.redisNotificationService.getRecentNotifications(client.userId);
            if (recentNotifications.length > 0) {
                client.emit('recent_notifications', recentNotifications);
            }
        }
        catch (error) {
            console.error('Authentication failed:', error);
            client.disconnect();
        }
    }
    async handleDisconnect(client) {
        if (client.userId) {
            console.log(`Notification client disconnected: ${client.userId}`);
            await this.redisNotificationService.unsubscribeFromUserNotifications(client.userId);
            this.connectedUsers.delete(client.userId);
        }
    }
    async handleJoinRoom(client, data) {
        if (!client.userId)
            return;
        client.join(`room:${data.roomId}`);
        console.log(`User ${client.userId} joined notification room: ${data.roomId}`);
    }
    async handleLeaveRoom(client, data) {
        if (!client.userId)
            return;
        client.leave(`room:${data.roomId}`);
        console.log(`User ${client.userId} left notification room: ${data.roomId}`);
    }
    async handleMarkAsRead(client, data) {
        if (!client.userId)
            return;
        try {
            await this.notificationService.markAsRead(client.userId, data.notificationId);
            const unreadCount = await this.notificationService.getUnreadCount(client.userId);
            client.emit('unread_count', { count: unreadCount });
            client.emit('notification_marked', { notificationId: data.notificationId });
        }
        catch (error) {
            client.emit('error', { message: 'Failed to mark notification as read' });
        }
    }
    async handleGetUnreadCount(client) {
        if (!client.userId)
            return;
        const unreadCount = await this.notificationService.getUnreadCount(client.userId);
        client.emit('unread_count', { count: unreadCount });
    }
    async sendNotificationToUser(userId, notification) {
        const client = this.connectedUsers.get(userId);
        if (client) {
            client.emit('new_notification', notification);
            const unreadCount = await this.notificationService.getUnreadCount(userId);
            client.emit('unread_count', { count: unreadCount });
        }
    }
    async sendNotificationToRoom(roomId, notification) {
        this.server.to(`room:${roomId}`).emit('room_notification', notification);
    }
    async sendBroadcastNotification(notification) {
        this.server.emit('broadcast_notification', notification);
    }
    extractTokenFromHandshake(client) {
        const token = client.handshake.query.token;
        if (token)
            return token;
        const authHeader = client.handshake.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        return null;
    }
    async subscribeToUserNotifications(userId) {
        await this.redisNotificationService.subscribeToUserNotifications(userId, (notification) => {
            this.sendNotificationToUser(userId, notification);
        });
        await this.redisNotificationService.subscribeToUserNotificationCount(userId, async () => {
            const unreadCount = await this.notificationService.getUnreadCount(userId);
            const client = this.connectedUsers.get(userId);
            if (client) {
                client.emit('unread_count', { count: unreadCount });
            }
        });
    }
    async subscribeToBroadcastNotifications() {
        await this.redisNotificationService.subscribeToBroadcastNotifications((notification) => {
            this.sendBroadcastNotification(notification);
        });
    }
};
exports.NotificationGateway = NotificationGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificationGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], NotificationGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], NotificationGateway.prototype, "handleLeaveRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('mark_as_read'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], NotificationGateway.prototype, "handleMarkAsRead", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('get_unread_count'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationGateway.prototype, "handleGetUnreadCount", null);
exports.NotificationGateway = NotificationGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/notifications',
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:3001',
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        redis_notification_service_1.RedisNotificationService,
        notification_service_1.NotificationService])
], NotificationGateway);
//# sourceMappingURL=notification.gateway.js.map