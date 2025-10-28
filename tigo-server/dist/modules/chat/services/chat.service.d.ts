import { Repository } from 'typeorm';
import { ChatRoom } from '../entities/chat-room.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { HotelBooking } from '../../hotel/entities/hotel-booking.entity';
import { UserService } from '../../user/services/user.service';
import { CreateChatRoomDto } from '../dto/create-chat-room.dto';
import { SendMessageDto } from '../dto/send-message.dto';
import { ChatRoomQueryDto } from '../dto/chat-room-query.dto';
import { MessageQueryDto } from '../dto/message-query.dto';
import { RedisService } from './redis.service';
export declare class ChatService {
    private readonly chatRoomRepository;
    private readonly chatMessageRepository;
    private readonly hotelBookingRepository;
    private readonly userService;
    private readonly redisService;
    constructor(chatRoomRepository: Repository<ChatRoom>, chatMessageRepository: Repository<ChatMessage>, hotelBookingRepository: Repository<HotelBooking>, userService: UserService, redisService: RedisService);
    createOrGetChatRoom(createChatRoomDto: CreateChatRoomDto, currentUserId: string): Promise<ChatRoom>;
    createChatRoomFromBooking(bookingId: string, currentUserId: string): Promise<ChatRoom>;
    getChatRooms(query: ChatRoomQueryDto, currentUserId: string): Promise<{
        rooms: ChatRoom[];
        total: number;
    }>;
    getChatRoom(roomId: string, currentUserId: string): Promise<ChatRoom>;
    sendMessage(sendMessageDto: SendMessageDto, senderId: string): Promise<ChatMessage>;
    getMessages(query: MessageQueryDto, currentUserId: string): Promise<{
        messages: ChatMessage[];
        total: number;
    }>;
    markMessagesAsRead(roomId: string, userId: string): Promise<void>;
    deleteMessage(messageId: string, currentUserId: string): Promise<void>;
}
