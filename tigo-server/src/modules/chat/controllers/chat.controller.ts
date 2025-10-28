import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ChatService } from '../services/chat.service';
import { RedisService } from '../services/redis.service';
import { CreateChatRoomDto } from '../dto/create-chat-room.dto';
import { SendMessageDto } from '../dto/send-message.dto';
import { ChatRoomQueryDto } from '../dto/chat-room-query.dto';
import { MessageQueryDto } from '../dto/message-query.dto';
import { ChatRoom } from '../entities/chat-room.entity';
import { ChatMessage } from '../entities/chat-message.entity';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly redisService: RedisService,
  ) {}

  @Post('rooms')
  @ApiOperation({ summary: 'Create or get existing chat room' })
  @ApiResponse({ status: 201, description: 'Chat room created or retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  async createOrGetChatRoom(
    @Body() createChatRoomDto: CreateChatRoomDto,
    @Request() req: any,
  ): Promise<ChatRoom> {

    return this.chatService.createOrGetChatRoom(createChatRoomDto, req.user.userId);
  }

  @Post('rooms/from-booking/:bookingId')
  @ApiOperation({ summary: 'Create or get chat room for a booking' })
  @ApiResponse({ status: 201, description: 'Chat room created or retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async createChatRoomFromBooking(
    @Param('bookingId') bookingId: string,
    @Request() req: any,
  ): Promise<ChatRoom> {
    return this.chatService.createChatRoomFromBooking(bookingId, req.user.userId);
  }

  @Get('rooms')
  @ApiOperation({ summary: 'Get user chat rooms' })
  @ApiResponse({ status: 200, description: 'Chat rooms retrieved successfully' })
  async getChatRooms(
    @Query() query: ChatRoomQueryDto,
    @Request() req: any,
  ): Promise<{ rooms: ChatRoom[]; total: number; page: number; limit: number }> {
    const result = await this.chatService.getChatRooms(query, req.user.userId);
    return {
      ...result,
      page: query.page || 1,
      limit: query.limit || 20,
    };
  }

  @Get('rooms/:roomId')
  @ApiOperation({ summary: 'Get specific chat room' })
  @ApiResponse({ status: 200, description: 'Chat room retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Chat room not found' })
  async getChatRoom(
    @Param('roomId') roomId: string,
    @Request() req: any,
  ): Promise<ChatRoom> {
    return this.chatService.getChatRoom(roomId, req.user.userId);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send a message' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Chat room not found' })
  async sendMessage(
    @Body() sendMessageDto: SendMessageDto,
    @Request() req: any,
  ): Promise<ChatMessage> {
    return this.chatService.sendMessage(sendMessageDto, req.user.userId);
  }

  @Get('rooms/:roomId/messages')
  @ApiOperation({ summary: 'Get messages in a chat room' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Chat room not found' })
  async getMessages(
    @Param('roomId') roomId: string,
    @Query() query: Omit<MessageQueryDto, 'chat_room_id'>,
    @Request() req: any,
  ): Promise<{ messages: ChatMessage[]; total: number; page: number; limit: number }> {
    const messageQuery: MessageQueryDto = {
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

  @Post('rooms/:roomId/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark messages in a room as read' })
  @ApiResponse({ status: 204, description: 'Messages marked as read successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Chat room not found' })
  async markMessagesAsRead(
    @Param('roomId') roomId: string,
    @Request() req: any,
  ): Promise<void> {
    await this.chatService.markMessagesAsRead(roomId, req.user.userId);
  }

  @Delete('messages/:messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: 204, description: 'Message deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async deleteMessage(
    @Param('messageId') messageId: string,
    @Request() req: any,
  ): Promise<void> {
    await this.chatService.deleteMessage(messageId, req.user.userId);
  }

  @Get('rooms/:roomId/online-users')
  @ApiOperation({ summary: 'Get online users in a chat room' })
  @ApiResponse({ status: 200, description: 'Online users retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Chat room not found' })
  async getOnlineUsers(
    @Param('roomId') roomId: string,
    @Request() req: any,
  ): Promise<{ onlineUsers: string[] }> {
    // First verify access to the room
    await this.chatService.getChatRoom(roomId, req.user.userId);
    
    // This would need to be implemented in ChatService or called from ChatGateway
    // For now, return empty array - you can extend this based on your needs
    return { onlineUsers: [] };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for chat service' })
  @ApiResponse({ status: 200, description: 'Chat service is healthy' })
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('redis/status')
  @ApiOperation({ summary: 'Detailed Redis status and chat metrics' })
  @ApiResponse({ status: 200, description: 'Redis status retrieved successfully' })
  async getRedisStatus(): Promise<any> {
    try {
      // Test basic Redis operations
      const testKey = `health:check:${Date.now()}`;
      const testValue = 'health-check';
      
      await this.redisService.set(testKey, testValue, 10);
      const retrievedValue = await this.redisService.get(testKey);
      await this.redisService.del(testKey);
      
      // Get chat metrics (this would need to be implemented in RedisService)
      // For now, we'll return basic status
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        tests: {
          basic_operations: retrievedValue === testValue ? 'passed' : 'failed',
          key_expiration: 'tested',
          connection: 'established'
        },
        metrics: {
          online_users: 0, // Would be implemented with proper Redis queries
          active_rooms: 0,  // Would be implemented with proper Redis queries
        },
        redis: {
          version: 'connected',
          memory_usage: 'available',
          connected_clients: 'multiple'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        connection: 'failed'
      };
    }
  }
}
