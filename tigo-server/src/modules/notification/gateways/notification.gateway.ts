import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisNotificationService } from '../services/redis-notification.service';
import { NotificationService } from '../services/notification.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRoles?: string[];
}

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly connectedUsers = new Map<string, AuthenticatedSocket>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisNotificationService: RedisNotificationService,
    private readonly notificationService: NotificationService,
  ) {}

  afterInit(server: Server) {
    console.log('Notification Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      const token = this.extractTokenFromHandshake(client);
      if (!token) {
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token);
      client.userId = payload.sub;
      client.userRoles = payload.roles || [];

      if (!client.userId) {
        client.disconnect();
        return;
      }

      console.log(`Notification client connected: ${client.userId}`);

      // Store the connection
      this.connectedUsers.set(client.userId, client);

      // Subscribe to user-specific notifications
      await this.subscribeToUserNotifications(client.userId);

      // Subscribe to broadcast notifications
      await this.subscribeToBroadcastNotifications();

      // Send initial unread count
      const unreadCount = await this.notificationService.getUnreadCount(client.userId);
      client.emit('unread_count', { count: unreadCount });

      // Send recent notifications
      const recentNotifications = await this.redisNotificationService.getRecentNotifications(client.userId);
      if (recentNotifications.length > 0) {
        client.emit('recent_notifications', recentNotifications);
      }

    } catch (error) {
      console.error('Authentication failed:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      console.log(`Notification client disconnected: ${client.userId}`);
      
      // Unsubscribe from notifications
      await this.redisNotificationService.unsubscribeFromUserNotifications(client.userId);
      
      // Remove from connected users
      this.connectedUsers.delete(client.userId);
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    if (!client.userId) return;

    client.join(`room:${data.roomId}`);
    console.log(`User ${client.userId} joined notification room: ${data.roomId}`);
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string },
  ) {
    if (!client.userId) return;

    client.leave(`room:${data.roomId}`);
    console.log(`User ${client.userId} left notification room: ${data.roomId}`);
  }

  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { notificationId: string },
  ) {
    if (!client.userId) return;

    try {
      await this.notificationService.markAsRead(client.userId, data.notificationId);
      
      // Send updated unread count
      const unreadCount = await this.notificationService.getUnreadCount(client.userId);
      client.emit('unread_count', { count: unreadCount });
      
      client.emit('notification_marked', { notificationId: data.notificationId });
    } catch (error) {
      client.emit('error', { message: 'Failed to mark notification as read' });
    }
  }

  @SubscribeMessage('get_unread_count')
  async handleGetUnreadCount(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.userId) return;

    const unreadCount = await this.notificationService.getUnreadCount(client.userId);
    client.emit('unread_count', { count: unreadCount });
  }

  // Send notification to specific user
  async sendNotificationToUser(userId: string, notification: any) {
    const client = this.connectedUsers.get(userId);
    if (client) {
      client.emit('new_notification', notification);
      
      // Update unread count
      const unreadCount = await this.notificationService.getUnreadCount(userId);
      client.emit('unread_count', { count: unreadCount });
    }
  }

  // Send notification to all users in a room
  async sendNotificationToRoom(roomId: string, notification: any) {
    this.server.to(`room:${roomId}`).emit('room_notification', notification);
  }

  // Send broadcast notification to all connected users
  async sendBroadcastNotification(notification: any) {
    this.server.emit('broadcast_notification', notification);
  }

  private extractTokenFromHandshake(client: AuthenticatedSocket): string | null {
    // Try to get token from query params
    const token = client.handshake.query.token as string;
    if (token) return token;

    // Try to get token from auth header
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  private async subscribeToUserNotifications(userId: string) {
    await this.redisNotificationService.subscribeToUserNotifications(
      userId,
      (notification) => {
        this.sendNotificationToUser(userId, notification);
      },
    );

    await this.redisNotificationService.subscribeToUserNotificationCount(
      userId,
      async () => {
        const unreadCount = await this.notificationService.getUnreadCount(userId);
        const client = this.connectedUsers.get(userId);
        if (client) {
          client.emit('unread_count', { count: unreadCount });
        }
      },
    );
  }

  private async subscribeToBroadcastNotifications() {
    await this.redisNotificationService.subscribeToBroadcastNotifications(
      (notification) => {
        this.sendBroadcastNotification(notification);
      },
    );
  }
}
