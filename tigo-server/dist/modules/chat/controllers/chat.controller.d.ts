import { ChatService } from '../services/chat.service';
import { RedisService } from '../services/redis.service';
import { CreateChatRoomDto } from '../dto/create-chat-room.dto';
import { SendMessageDto } from '../dto/send-message.dto';
import { ChatRoomQueryDto } from '../dto/chat-room-query.dto';
import { MessageQueryDto } from '../dto/message-query.dto';
import { ChatRoom } from '../entities/chat-room.entity';
import { ChatMessage } from '../entities/chat-message.entity';
export declare class ChatController {
    private readonly chatService;
    private readonly redisService;
    constructor(chatService: ChatService, redisService: RedisService);
    createOrGetChatRoom(createChatRoomDto: CreateChatRoomDto, req: any): Promise<ChatRoom>;
    createChatRoomFromBooking(bookingId: string, req: any): Promise<ChatRoom>;
    getChatRooms(query: ChatRoomQueryDto, req: any): Promise<{
        rooms: ChatRoom[];
        total: number;
        page: number;
        limit: number;
    }>;
    getChatRoom(roomId: string, req: any): Promise<ChatRoom>;
    sendMessage(sendMessageDto: SendMessageDto, req: any): Promise<ChatMessage>;
    getMessages(roomId: string, query: Omit<MessageQueryDto, 'chat_room_id'>, req: any): Promise<{
        messages: ChatMessage[];
        total: number;
        page: number;
        limit: number;
    }>;
    markMessagesAsRead(roomId: string, req: any): Promise<void>;
    deleteMessage(messageId: string, req: any): Promise<void>;
    getOnlineUsers(roomId: string, req: any): Promise<{
        onlineUsers: string[];
    }>;
    healthCheck(): Promise<{
        status: string;
        timestamp: string;
    }>;
    getRedisStatus(): Promise<any>;
}
