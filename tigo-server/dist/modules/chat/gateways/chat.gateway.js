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
var ChatGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const redis_service_1 = require("../services/redis.service");
const chat_service_1 = require("../services/chat.service");
const send_message_dto_1 = require("../dto/send-message.dto");
const ws_jwt_auth_guard_1 = require("../guards/ws-jwt-auth.guard");
let ChatGateway = ChatGateway_1 = class ChatGateway {
    jwtService;
    redisService;
    chatService;
    server;
    logger = new common_1.Logger(ChatGateway_1.name);
    connectedUsers = new Map();
    constructor(jwtService, redisService, chatService) {
        this.jwtService = jwtService;
        this.redisService = redisService;
        this.chatService = chatService;
    }
    async afterInit() {
        this.logger.log('ChatGateway initialized');
        this.retryRedisSubscription();
    }
    async retryRedisSubscription(attempt = 1, maxAttempts = 5) {
        try {
            await this.subscribeToRedisEvents();
        }
        catch (error) {
            if (attempt < maxAttempts) {
                this.logger.warn(`Failed to subscribe to Redis events (attempt ${attempt}/${maxAttempts}): ${error.message}. Retrying in ${attempt * 2}s...`);
                setTimeout(() => {
                    this.retryRedisSubscription(attempt + 1, maxAttempts);
                }, attempt * 2000);
            }
            else {
                this.logger.error(`Failed to subscribe to Redis events after ${maxAttempts} attempts:`, error.message);
                this.logger.warn('Chat real-time features will be limited without Redis connection');
            }
        }
    }
    async handleConnection(client) {
        try {
            const token = this.extractTokenFromSocket(client);
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = await this.jwtService.verifyAsync(token);
            client.userId = payload.sub;
            client.userRoles = payload.roles || [];
            this.connectedUsers.set(client.userId, client.id);
            await this.redisService.setUserOnline(client.userId);
            this.logger.log(`User ${client.userId} connected`);
            await this.joinUserRooms(client);
            client.emit('connected', { message: 'Connected successfully', userId: client.userId });
        }
        catch (error) {
            this.logger.error('Connection error:', error);
            client.disconnect();
        }
    }
    async handleDisconnect(client) {
        if (client.userId) {
            this.connectedUsers.delete(client.userId);
            await this.redisService.setUserOffline(client.userId);
            const rooms = Array.from(client.rooms).filter(room => room !== client.id);
            for (const room of rooms) {
                await this.redisService.removeUserFromRoom(room, client.userId);
            }
            this.logger.log(`User ${client.userId} disconnected`);
        }
    }
    async handleJoinRoom(client, data) {
        try {
            if (!client.userId) {
                client.emit('error', { message: 'User not authenticated' });
                return;
            }
            await this.chatService.getChatRoom(data.roomId, client.userId);
            await client.join(data.roomId);
            await this.redisService.addUserToRoom(data.roomId, client.userId);
            this.logger.log(`User ${client.userId} joined room ${data.roomId}`);
            client.emit('joined_room', { roomId: data.roomId });
        }
        catch (error) {
            client.emit('error', { message: error.message });
        }
    }
    async handleLeaveRoom(client, data) {
        if (!client.userId) {
            client.emit('error', { message: 'User not authenticated' });
            return;
        }
        await client.leave(data.roomId);
        await this.redisService.removeUserFromRoom(data.roomId, client.userId);
        this.logger.log(`User ${client.userId} left room ${data.roomId}`);
        client.emit('left_room', { roomId: data.roomId });
    }
    async handleSendMessage(client, sendMessageDto) {
        try {
            if (!client.userId) {
                client.emit('error', { message: 'User not authenticated' });
                return;
            }
            const message = await this.chatService.sendMessage(sendMessageDto, client.userId);
            client.emit('message_sent', { messageId: message.id });
        }
        catch (error) {
            client.emit('error', { message: error.message });
        }
    }
    async handleMarkMessagesRead(client, data) {
        try {
            if (!client.userId) {
                client.emit('error', { message: 'User not authenticated' });
                return;
            }
            await this.chatService.markMessagesAsRead(data.roomId, client.userId);
            client.emit('messages_marked_read', { roomId: data.roomId });
        }
        catch (error) {
            client.emit('error', { message: error.message });
        }
    }
    async handleTypingStart(client, data) {
        client.to(data.roomId).emit('user_typing', {
            userId: client.userId,
            roomId: data.roomId,
            isTyping: true,
        });
    }
    async handleTypingStop(client, data) {
        client.to(data.roomId).emit('user_typing', {
            userId: client.userId,
            roomId: data.roomId,
            isTyping: false,
        });
    }
    extractTokenFromSocket(client) {
        const authHeader = client.handshake.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        const tokenFromQuery = client.handshake.query.token;
        return tokenFromQuery || null;
    }
    async joinUserRooms(client) {
        try {
            if (!client.userId) {
                return;
            }
            const { rooms } = await this.chatService.getChatRooms({ page: 1, limit: 100 }, client.userId);
            for (const room of rooms) {
                await client.join(room.id);
                await this.redisService.addUserToRoom(room.id, client.userId);
            }
            this.logger.log(`User ${client.userId} joined ${rooms.length} rooms`);
        }
        catch (error) {
            this.logger.error('Error joining user rooms:', error);
        }
    }
    async subscribeToRedisEvents() {
        try {
            await this.redisService.subscribe('chat:events', (message) => {
                this.handleRedisMessage(message);
            });
            this.logger.log('Successfully subscribed to Redis chat events');
        }
        catch (error) {
            this.logger.error('Error subscribing to Redis events:', error.message);
            throw error;
        }
    }
    handleRedisMessage(message) {
        const { event, roomId, data } = message;
        switch (event) {
            case 'new_message':
                this.server.to(roomId).emit('new_message', data);
                break;
            case 'message_deleted':
                this.server.to(roomId).emit('message_deleted', data);
                break;
            case 'messages_read':
                this.server.to(roomId).emit('messages_read', data);
                break;
            default:
                this.logger.warn(`Unknown Redis event: ${event}`);
        }
    }
    async sendToUser(userId, event, data) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.server.to(socketId).emit(event, data);
            return true;
        }
        return false;
    }
    async sendToRoom(roomId, event, data) {
        this.server.to(roomId).emit(event, data);
    }
    async getOnlineUsersInRoom(roomId) {
        const userIds = await this.redisService.getUsersInRoom(roomId);
        const onlineUsers = [];
        for (const userId of userIds) {
            if (await this.redisService.isUserOnline(userId)) {
                onlineUsers.push(userId);
            }
        }
        return onlineUsers;
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_auth_guard_1.WsJwtAuthGuard),
    (0, websockets_1.SubscribeMessage)('join_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_auth_guard_1.WsJwtAuthGuard),
    (0, websockets_1.SubscribeMessage)('leave_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleLeaveRoom", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_auth_guard_1.WsJwtAuthGuard),
    (0, websockets_1.SubscribeMessage)('send_message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, send_message_dto_1.SendMessageDto]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_auth_guard_1.WsJwtAuthGuard),
    (0, websockets_1.SubscribeMessage)('mark_messages_read'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMarkMessagesRead", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_auth_guard_1.WsJwtAuthGuard),
    (0, websockets_1.SubscribeMessage)('typing_start'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleTypingStart", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_auth_guard_1.WsJwtAuthGuard),
    (0, websockets_1.SubscribeMessage)('typing_stop'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleTypingStop", null);
exports.ChatGateway = ChatGateway = ChatGateway_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3001',
            methods: ['GET', 'POST'],
            credentials: true,
        },
        namespace: '/chat',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        redis_service_1.RedisService,
        chat_service_1.ChatService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map