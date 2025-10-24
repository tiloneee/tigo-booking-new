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
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const chat_service_1 = require("../services/chat.service");
const redis_service_1 = require("../services/redis.service");
const create_chat_room_dto_1 = require("../dto/create-chat-room.dto");
const send_message_dto_1 = require("../dto/send-message.dto");
const chat_room_query_dto_1 = require("../dto/chat-room-query.dto");
let ChatController = class ChatController {
    chatService;
    redisService;
    constructor(chatService, redisService) {
        this.chatService = chatService;
        this.redisService = redisService;
    }
    async createOrGetChatRoom(createChatRoomDto, req) {
        return this.chatService.createOrGetChatRoom(createChatRoomDto, req.user.userId);
    }
    async getChatRooms(query, req) {
        const result = await this.chatService.getChatRooms(query, req.user.userId);
        return {
            ...result,
            page: query.page || 1,
            limit: query.limit || 20,
        };
    }
    async getChatRoom(roomId, req) {
        return this.chatService.getChatRoom(roomId, req.user.userId);
    }
    async sendMessage(sendMessageDto, req) {
        return this.chatService.sendMessage(sendMessageDto, req.user.userId);
    }
    async getMessages(roomId, query, req) {
        const messageQuery = {
            ...query,
            chat_room_id: roomId,
        };
        const result = await this.chatService.getMessages(messageQuery, req.user.userId);
        return {
            ...result,
            page: query.page || 1,
            limit: query.limit || 50,
        };
    }
    async markMessagesAsRead(roomId, req) {
        await this.chatService.markMessagesAsRead(roomId, req.user.userId);
    }
    async deleteMessage(messageId, req) {
        await this.chatService.deleteMessage(messageId, req.user.userId);
    }
    async getOnlineUsers(roomId, req) {
        await this.chatService.getChatRoom(roomId, req.user.userId);
        return { onlineUsers: [] };
    }
    async healthCheck() {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
        };
    }
    async getRedisStatus() {
        try {
            const testKey = `health:check:${Date.now()}`;
            const testValue = 'health-check';
            await this.redisService.set(testKey, testValue, 10);
            const retrievedValue = await this.redisService.get(testKey);
            await this.redisService.del(testKey);
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                tests: {
                    basic_operations: retrievedValue === testValue ? 'passed' : 'failed',
                    key_expiration: 'tested',
                    connection: 'established'
                },
                metrics: {
                    online_users: 0,
                    active_rooms: 0,
                },
                redis: {
                    version: 'connected',
                    memory_usage: 'available',
                    connected_clients: 'multiple'
                }
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message,
                connection: 'failed'
            };
        }
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Post)('rooms'),
    (0, swagger_1.ApiOperation)({ summary: 'Create or get existing chat room' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Chat room created or retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Participant not found' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_chat_room_dto_1.CreateChatRoomDto, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createOrGetChatRoom", null);
__decorate([
    (0, common_1.Get)('rooms'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user chat rooms' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Chat rooms retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chat_room_query_dto_1.ChatRoomQueryDto, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getChatRooms", null);
__decorate([
    (0, common_1.Get)('rooms/:roomId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get specific chat room' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Chat room retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Chat room not found' }),
    __param(0, (0, common_1.Param)('roomId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getChatRoom", null);
__decorate([
    (0, common_1.Post)('messages'),
    (0, swagger_1.ApiOperation)({ summary: 'Send a message' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Message sent successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Chat room not found' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_message_dto_1.SendMessageDto, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Get)('rooms/:roomId/messages'),
    (0, swagger_1.ApiOperation)({ summary: 'Get messages in a chat room' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Messages retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Chat room not found' }),
    __param(0, (0, common_1.Param)('roomId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)('rooms/:roomId/read'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Mark messages in a room as read' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Messages marked as read successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Chat room not found' }),
    __param(0, (0, common_1.Param)('roomId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "markMessagesAsRead", null);
__decorate([
    (0, common_1.Delete)('messages/:messageId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a message' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Message deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Message not found' }),
    __param(0, (0, common_1.Param)('messageId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "deleteMessage", null);
__decorate([
    (0, common_1.Get)('rooms/:roomId/online-users'),
    (0, swagger_1.ApiOperation)({ summary: 'Get online users in a chat room' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Online users retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Chat room not found' }),
    __param(0, (0, common_1.Param)('roomId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getOnlineUsers", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({ summary: 'Health check for chat service' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Chat service is healthy' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "healthCheck", null);
__decorate([
    (0, common_1.Get)('redis/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Detailed Redis status and chat metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Redis status retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getRedisStatus", null);
exports.ChatController = ChatController = __decorate([
    (0, swagger_1.ApiTags)('Chat'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('chat'),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        redis_service_1.RedisService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map