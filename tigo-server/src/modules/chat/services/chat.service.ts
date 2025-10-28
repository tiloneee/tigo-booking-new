import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ChatRoom } from '../entities/chat-room.entity';
import { ChatMessage, MessageStatus } from '../entities/chat-message.entity';
import { User } from '../../user/entities/user.entity';
import { HotelBooking } from '../../hotel/entities/hotel-booking.entity';
import { UserService } from '../../user/services/user.service';
import { CreateChatRoomDto } from '../dto/create-chat-room.dto';
import { SendMessageDto } from '../dto/send-message.dto';
import { ChatRoomQueryDto } from '../dto/chat-room-query.dto';
import { MessageQueryDto } from '../dto/message-query.dto';
import { RedisService } from './redis.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private readonly chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(HotelBooking)
    private readonly hotelBookingRepository: Repository<HotelBooking>,
    private readonly userService: UserService,
    private readonly redisService: RedisService,
  ) {}

  async createOrGetChatRoom(createChatRoomDto: CreateChatRoomDto, currentUserId: string): Promise<ChatRoom> {
    const { participant1_id, participant2_id, hotel_id, booking_id } = createChatRoomDto;
    
    // Validate participants exist
    const [participant1, participant2] = await Promise.all([
      this.userService.findOne(participant1_id).catch(() => null),
      this.userService.findOne(participant2_id).catch(() => null),
    ]);

    if (!participant1 || !participant2) {
      throw new NotFoundException('One or both participants not found');
    }

    // Check if current user is one of the participants or admin
    const currentUser = await this.userService.findOne(currentUserId).catch(() => null);
    const isAdmin = currentUser?.roles.some(role => role.name === 'Admin');
    const isParticipant = [participant1_id, participant2_id].includes(currentUserId);
    
    if (!isAdmin && !isParticipant) {
      throw new ForbiddenException('You can only create chat rooms where you are a participant');
    }

    // Check if chat room already exists (order-independent)
    let existingRoom = await this.chatRoomRepository.findOne({
      where: [
        { participant1_id, participant2_id },
        { participant1_id: participant2_id, participant2_id: participant1_id },
      ],
      relations: ['participant1', 'participant2', 'booking'],
    });

    if (existingRoom) {
      // Update booking_id if provided and not already set
      if (booking_id && !existingRoom.booking_id) {
        existingRoom.booking_id = booking_id;
        await this.chatRoomRepository.save(existingRoom);
      }
      return existingRoom;
    }

    // Create new chat room
    const chatRoom = this.chatRoomRepository.create({
      participant1_id,
      participant2_id,
      hotel_id,
      booking_id,
    });

    const savedRoom = await this.chatRoomRepository.save(chatRoom);
    
    // Load relations for return
    const roomWithRelations = await this.chatRoomRepository.findOne({
      where: { id: savedRoom.id },
      relations: ['participant1', 'participant2', 'booking'],
    });

    if (!roomWithRelations) {
      throw new NotFoundException('Created room not found');
    }

    return roomWithRelations;
  }

  async createChatRoomFromBooking(bookingId: string, currentUserId: string): Promise<ChatRoom> {
    // Fetch the booking with hotel and user relations
    const booking = await this.hotelBookingRepository.findOne({
      where: { id: bookingId },
      relations: ['hotel', 'hotel.owner', 'user'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Verify current user is either the customer or hotel owner
    const isCustomer = booking.user_id === currentUserId;
    const isHotelOwner = booking.hotel?.owner_id === currentUserId;
    const currentUser = await this.userService.findOne(currentUserId).catch(() => null);
    const isAdmin = currentUser?.roles.some(role => role.name === 'Admin');

    if (!isCustomer && !isHotelOwner && !isAdmin) {
      throw new ForbiddenException('You can only create chat rooms for your own bookings');
    }

    // Get the customer and hotel owner IDs
    const customerId = booking.user_id;
    const hotelOwnerId = booking.hotel?.owner_id;

    if (!hotelOwnerId) {
      throw new BadRequestException('Hotel owner not found for this booking');
    }

    // Create or get the chat room
    return this.createOrGetChatRoom({
      participant1_id: customerId,
      participant2_id: hotelOwnerId,
      hotel_id: booking.hotel_id,
      booking_id: bookingId,
    }, currentUserId);
  }

  async getChatRooms(query: ChatRoomQueryDto, currentUserId: string): Promise<{ rooms: ChatRoom[], total: number }> {
    const { page = 1, limit = 20, participant_id, search, booking_id } = query;
    const skip = (page - 1) * limit;

    let queryBuilder: SelectQueryBuilder<ChatRoom> = this.chatRoomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.participant1', 'p1')
      .leftJoinAndSelect('room.participant2', 'p2')
      .leftJoinAndSelect('room.booking', 'booking')
      .where('(room.participant1_id = :userId OR room.participant2_id = :userId)', { userId: currentUserId })
      .andWhere('room.is_active = true');

    if (participant_id) {
      queryBuilder = queryBuilder.andWhere(
        '(room.participant1_id = :participantId OR room.participant2_id = :participantId)',
        { participantId: participant_id }
      );
    }

    if (booking_id) {
      queryBuilder = queryBuilder.andWhere('room.booking_id = :bookingId', { bookingId: booking_id });
    }

    if (search) {
      queryBuilder = queryBuilder.andWhere(
        '(LOWER(p1.first_name || \' \' || p1.last_name) LIKE LOWER(:search) OR LOWER(p2.first_name || \' \' || p2.last_name) LIKE LOWER(:search))',
        { search: `%${search}%` }
      );
    }

    const [rooms, total] = await queryBuilder
      .orderBy('room.last_message_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { rooms, total };
  }

  async getChatRoom(roomId: string, currentUserId: string): Promise<ChatRoom> {
    const room = await this.chatRoomRepository.findOne({
      where: { id: roomId },
      relations: ['participant1', 'participant2', 'booking'],
    });

    if (!room) {
      throw new NotFoundException('Chat room not found');
    }

    // Check if current user has access to this room
    const hasAccess = [room.participant1_id, room.participant2_id].includes(currentUserId);
    const currentUser = await this.userService.findOne(currentUserId).catch(() => null);
    const isAdmin = currentUser?.roles.some(role => role.name === 'Admin');

    if (!hasAccess && !isAdmin) {
      throw new ForbiddenException('You do not have access to this chat room');
    }

    return room;
  }

  async sendMessage(sendMessageDto: SendMessageDto, senderId: string): Promise<ChatMessage> {
    const { chat_room_id, content, type, file_url, file_name, file_size, metadata } = sendMessageDto;

    // Verify chat room exists and user has access
    const chatRoom = await this.getChatRoom(chat_room_id, senderId);

    // Create message
    const message = this.chatMessageRepository.create({
      chat_room_id,
      sender_id: senderId,
      content,
      type,
      file_url,
      file_name,
      file_size,
      metadata,
    });

    const savedMessage = await this.chatMessageRepository.save(message);

    // Update chat room with last message info
    await this.chatRoomRepository.update(chat_room_id, {
      last_message_content: content,
      last_message_at: new Date(),
    });

    // Load sender information for the response
    const messageWithSender = await this.chatMessageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender'],
    });

    if (!messageWithSender) {
      throw new NotFoundException('Created message not found');
    }

    // Publish message to Redis for real-time delivery
    await this.redisService.publishMessage('chat:events', {
      event: 'new_message',
      roomId: chat_room_id,
      data: messageWithSender,
    });

    // Send notification to the recipient
    const recipientId = chatRoom.participant1_id === senderId 
      ? chatRoom.participant2_id 
      : chatRoom.participant1_id;

    // Publish notification event to Redis for notification service to pick up
    await this.redisService.publishMessage('notification:events', {
      type: 'CHAT_MESSAGE',
      user_id: recipientId,
      title: `New message from ${messageWithSender.sender.first_name || 'User'}`,
      message: content.length > 100 ? content.substring(0, 100) + '...' : content,
      metadata: {
        chat_room_id,
        sender_id: senderId,
        message_id: savedMessage.id,
      },
      related_entity_type: 'chat_message',
      related_entity_id: savedMessage.id,
    });

    return messageWithSender;
  }

  async getMessages(query: MessageQueryDto, currentUserId: string): Promise<{ messages: ChatMessage[], total: number }> {
    const { chat_room_id, page = 1, limit = 50, before, after } = query;

    // Verify access to chat room
    await this.getChatRoom(chat_room_id, currentUserId);

    const skip = (page - 1) * limit;
    
    let queryBuilder = this.chatMessageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .where('message.chat_room_id = :roomId', { roomId: chat_room_id });

    if (before) {
      queryBuilder = queryBuilder.andWhere('message.created_at < :before', { before });
    }

    if (after) {
      queryBuilder = queryBuilder.andWhere('message.created_at > :after', { after });
    }

    const [messages, total] = await queryBuilder
      .orderBy('message.created_at', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { messages: messages.reverse(), total }; // Reverse to show oldest first
  }

  async markMessagesAsRead(roomId: string, userId: string): Promise<void> {
    // Verify access to chat room
    await this.getChatRoom(roomId, userId);

    // Mark all unread messages in the room as read
    await this.chatMessageRepository
      .createQueryBuilder()
      .update(ChatMessage)
      .set({ status: MessageStatus.READ })
      .where('chat_room_id = :roomId', { roomId })
      .andWhere('sender_id != :userId', { userId })
      .andWhere('status = :status', { status: MessageStatus.DELIVERED })
      .execute();

    // Publish read status update
    await this.redisService.publishMessage('chat:events', {
      event: 'messages_read',
      roomId,
      data: { userId, roomId },
    });
  }

  async deleteMessage(messageId: string, currentUserId: string): Promise<void> {
    const message = await this.chatMessageRepository.findOne({
      where: { id: messageId },
      relations: ['sender'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user owns the message or is admin
    const currentUser = await this.userService.findOne(currentUserId).catch(() => null);

    const isAdmin = currentUser?.roles.some(role => role.name === 'Admin');
    const isOwner = message.sender_id === currentUserId;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.chatMessageRepository.remove(message);

    // Publish message deletion event
    await this.redisService.publishMessage('chat:events', {
      event: 'message_deleted',
      roomId: message.chat_room_id,
      data: { messageId, deletedBy: currentUserId },
    });
  }
}
