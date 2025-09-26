import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../services/redis.service';
import { ChatService } from '../services/chat.service';
import { SendMessageDto } from '../dto/send-message.dto';
interface AuthenticatedSocket extends Socket {
    userId?: string;
    userRoles?: string[];
}
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    private readonly jwtService;
    private readonly redisService;
    private readonly chatService;
    server: Server;
    private readonly logger;
    private connectedUsers;
    constructor(jwtService: JwtService, redisService: RedisService, chatService: ChatService);
    afterInit(): Promise<void>;
    private retryRedisSubscription;
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): Promise<void>;
    handleJoinRoom(client: AuthenticatedSocket, data: {
        roomId: string;
    }): Promise<void>;
    handleLeaveRoom(client: AuthenticatedSocket, data: {
        roomId: string;
    }): Promise<void>;
    handleSendMessage(client: AuthenticatedSocket, sendMessageDto: SendMessageDto): Promise<void>;
    handleMarkMessagesRead(client: AuthenticatedSocket, data: {
        roomId: string;
    }): Promise<void>;
    handleTypingStart(client: AuthenticatedSocket, data: {
        roomId: string;
    }): Promise<void>;
    handleTypingStop(client: AuthenticatedSocket, data: {
        roomId: string;
    }): Promise<void>;
    private extractTokenFromSocket;
    private joinUserRooms;
    private subscribeToRedisEvents;
    private handleRedisMessage;
    sendToUser(userId: string, event: string, data: any): Promise<boolean>;
    sendToRoom(roomId: string, event: string, data: any): Promise<void>;
    getOnlineUsersInRoom(roomId: string): Promise<string[]>;
}
export {};
