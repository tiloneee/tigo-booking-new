import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { RedisNotificationService } from '../services/redis-notification.service';
import { NotificationService } from '../services/notification.service';
interface AuthenticatedSocket extends Socket {
    userId?: string;
    userRoles?: string[];
}
export declare class NotificationGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    private readonly redisNotificationService;
    private readonly notificationService;
    server: Server;
    private readonly connectedUsers;
    constructor(jwtService: JwtService, redisNotificationService: RedisNotificationService, notificationService: NotificationService);
    afterInit(server: Server): void;
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): Promise<void>;
    handleJoinRoom(client: AuthenticatedSocket, data: {
        roomId: string;
    }): Promise<void>;
    handleLeaveRoom(client: AuthenticatedSocket, data: {
        roomId: string;
    }): Promise<void>;
    handleMarkAsRead(client: AuthenticatedSocket, data: {
        notificationId: string;
    }): Promise<void>;
    handleGetUnreadCount(client: AuthenticatedSocket): Promise<void>;
    sendNotificationToUser(userId: string, notification: any): Promise<void>;
    sendNotificationToRoom(roomId: string, notification: any): Promise<void>;
    sendBroadcastNotification(notification: any): Promise<void>;
    private extractTokenFromHandshake;
    private subscribeToUserNotifications;
    private subscribeToBroadcastNotifications;
}
export {};
