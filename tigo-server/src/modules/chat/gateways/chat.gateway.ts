import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../services/redis.service';
import { ChatService } from '../services/chat.service';
import { SendMessageDto } from '../dto/send-message.dto';
import { WsJwtAuthGuard } from '../guards/ws-jwt-auth.guard';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRoles?: string[];
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly chatService: ChatService,
  ) {}

  async afterInit() {
    this.logger.log('ChatGateway initialized');
    
    // Subscribe to Redis chat events after initialization with retry
    this.retryRedisSubscription();
  }

  private async retryRedisSubscription(attempt = 1, maxAttempts = 5) {
    try {
      await this.subscribeToRedisEvents();
    } catch (error) {
      if (attempt < maxAttempts) {
        this.logger.warn(`Failed to subscribe to Redis events (attempt ${attempt}/${maxAttempts}): ${error.message}. Retrying in ${attempt * 2}s...`);
        setTimeout(() => {
          this.retryRedisSubscription(attempt + 1, maxAttempts);
        }, attempt * 2000);
      } else {
        this.logger.error(`Failed to subscribe to Redis events after ${maxAttempts} attempts:`, error.message);
        this.logger.warn('Chat real-time features will be limited without Redis connection');
      }
    }
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract and verify JWT token
      const token = this.extractTokenFromSocket(client);
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.userId = payload.sub;
      client.userRoles = payload.roles || [];

      // Store user connection
      this.connectedUsers.set(client.userId!, client.id);
      await this.redisService.setUserOnline(client.userId!);

      this.logger.log(`User ${client.userId} connected`);

      // Join user to their chat rooms
      await this.joinUserRooms(client);

      client.emit('connected', { message: 'Connected successfully', userId: client.userId });
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      await this.redisService.setUserOffline(client.userId);
      
      // Leave all rooms
      const rooms = Array.from(client.rooms).filter(room => room !== client.id);
      for (const room of rooms) {
        await this.redisService.removeUserFromRoom(room, client.userId);
      }

      this.logger.log(`User ${client.userId} disconnected`);
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string }
  ) {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      // Verify user has access to this room
      await this.chatService.getChatRoom(data.roomId, client.userId);
      
      await client.join(data.roomId);
      await this.redisService.addUserToRoom(data.roomId, client.userId);
      
      this.logger.log(`User ${client.userId} joined room ${data.roomId}`);
      
      client.emit('joined_room', { roomId: data.roomId });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string }
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'User not authenticated' });
      return;
    }

    await client.leave(data.roomId);
    await this.redisService.removeUserFromRoom(data.roomId, client.userId);
    
    this.logger.log(`User ${client.userId} left room ${data.roomId}`);
    
    client.emit('left_room', { roomId: data.roomId });
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() sendMessageDto: SendMessageDto
  ) {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      const message = await this.chatService.sendMessage(sendMessageDto, client.userId);
      
      // Message will be broadcast through Redis subscription
      client.emit('message_sent', { messageId: message.id });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('mark_messages_read')
  async handleMarkMessagesRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string }
  ) {
    try {
      if (!client.userId) {
        client.emit('error', { message: 'User not authenticated' });
        return;
      }

      await this.chatService.markMessagesAsRead(data.roomId, client.userId);
      client.emit('messages_marked_read', { roomId: data.roomId });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('typing_start')
  async handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string }
  ) {
    client.to(data.roomId).emit('user_typing', {
      userId: client.userId,
      roomId: data.roomId,
      isTyping: true,
    });
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('typing_stop')
  async handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string }
  ) {
    client.to(data.roomId).emit('user_typing', {
      userId: client.userId,
      roomId: data.roomId,
      isTyping: false,
    });
  }

  private extractTokenFromSocket(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Try to get token from query params as fallback
    const tokenFromQuery = client.handshake.query.token as string;
    return tokenFromQuery || null;
  }

  private async joinUserRooms(client: AuthenticatedSocket) {
    try {
      if (!client.userId) {
        return;
      }

      // Get user's chat rooms
      const { rooms } = await this.chatService.getChatRooms(
        { page: 1, limit: 100 },
        client.userId
      );

      // Join all rooms
      for (const room of rooms) {
        await client.join(room.id);
        await this.redisService.addUserToRoom(room.id, client.userId);
      }

      this.logger.log(`User ${client.userId} joined ${rooms.length} rooms`);
    } catch (error) {
      this.logger.error('Error joining user rooms:', error);
    }
  }

  private async subscribeToRedisEvents() {
    try {
      // Subscribe to general chat events
      await this.redisService.subscribe('chat:events', (message) => {
        this.handleRedisMessage(message);
      });
      this.logger.log('Successfully subscribed to Redis chat events');
    } catch (error) {
      this.logger.error('Error subscribing to Redis events:', error.message);
      throw error;
    }
  }

  private handleRedisMessage(message: any) {
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

  // Method to send message to specific user
  async sendToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  // Method to send message to all users in a room
  async sendToRoom(roomId: string, event: string, data: any) {
    this.server.to(roomId).emit(event, data);
  }

  // Get online users in a room
  async getOnlineUsersInRoom(roomId: string): Promise<string[]> {
    const userIds = await this.redisService.getUsersInRoom(roomId);
    const onlineUsers: string[] = [];
    
    for (const userId of userIds) {
      if (await this.redisService.isUserOnline(userId)) {
        onlineUsers.push(userId);
      }
    }
    
    return onlineUsers;
  }
}
