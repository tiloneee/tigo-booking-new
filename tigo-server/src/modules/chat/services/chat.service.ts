import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ChatRoom, ChatRoomType } from '../entities/chat-room.entity';
import { ChatMessage, MessageStatus } from '../entities/chat-message.entity';
import { User } from '../../user/entities/user.entity';
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
    private readonly userService: UserService,
    private readonly redisService: RedisService,
  ) {}

  async createOrGetChatRoom(createChatRoomDto: CreateChatRoomDto, currentUserId: string): Promise<ChatRoom> {
    const { type, participant1_id, participant2_id, hotel_id } = createChatRoomDto;
    console.log("currentUserId", currentUserId);
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
    console.log("currentUser", currentUser);
    const isAdmin = currentUser?.roles.some(role => role.name === 'Admin');
    console.log("isAdmin", isAdmin);
    const isParticipant = [participant1_id, participant2_id].includes(currentUserId);
    console.log("isParticipant", isParticipant);
    if (!isAdmin && !isParticipant) {
      throw new ForbiddenException('You can only create chat rooms where you are a participant');
    }

    // Validate chat room type based on user roles
    await this.validateChatRoomType(type, participant1, participant2);

    // Check if chat room already exists (order-independent)
    let existingRoom = await this.chatRoomRepository.findOne({
      where: [
        { type, participant1_id, participant2_id },
        { type, participant1_id: participant2_id, participant2_id: participant1_id },
      ],
      relations: ['participant1', 'participant2'],
    });

    if (existingRoom) {
      return existingRoom;
    }

    // Create new chat room
    const chatRoom = this.chatRoomRepository.create({
      type,
      participant1_id,
      participant2_id,
      hotel_id,
    });

    const savedRoom = await this.chatRoomRepository.save(chatRoom);
    
    // Load relations for return
    const roomWithRelations = await this.chatRoomRepository.findOne({
      where: { id: savedRoom.id },
      relations: ['participant1', 'participant2'],
    });

    if (!roomWithRelations) {
      throw new NotFoundException('Created room not found');
    }

    return roomWithRelations;
  }

  async getChatRooms(query: ChatRoomQueryDto, currentUserId: string): Promise<{ rooms: ChatRoom[], total: number }> {
    const { page = 1, limit = 20, type, participant_id, search } = query;
    const skip = (page - 1) * limit;

    let queryBuilder: SelectQueryBuilder<ChatRoom> = this.chatRoomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.participant1', 'p1')
      .leftJoinAndSelect('room.participant2', 'p2')
      .where('(room.participant1_id = :userId OR room.participant2_id = :userId)', { userId: currentUserId })
      .andWhere('room.is_active = true');

    if (type) {
      queryBuilder = queryBuilder.andWhere('room.type = :type', { type });
    }

    if (participant_id) {
      queryBuilder = queryBuilder.andWhere(
        '(room.participant1_id = :participantId OR room.participant2_id = :participantId)',
        { participantId: participant_id }
      );
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
      relations: ['participant1', 'participant2'],
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

  private async validateChatRoomType(type: ChatRoomType, participant1: User, participant2: User): Promise<void> {
    // Roles are already loaded from userService.findOne()
    const p1Roles = participant1.roles?.map(r => r.name) || [];
    const p2Roles = participant2.roles?.map(r => r.name) || [];

    switch (type) {
      case ChatRoomType.CUSTOMER_HOTEL_OWNER:
        const hasCustomer = p1Roles.includes('Customer') || p2Roles.includes('Customer');
        const hasHotelOwner = p1Roles.includes('HotelOwner') || p2Roles.includes('HotelOwner');
        if (!hasCustomer || !hasHotelOwner) {
          throw new BadRequestException('Customer-Hotel Owner chat requires one customer and one hotel owner');
        }
        break;

      case ChatRoomType.CUSTOMER_ADMIN:
        const hasCustomerAdmin = p1Roles.includes('Customer') || p2Roles.includes('Customer');
        const hasAdmin = p1Roles.includes('Admin') || p2Roles.includes('Admin');
        if (!hasCustomerAdmin || !hasAdmin) {
          throw new BadRequestException('Customer-Admin chat requires one customer and one admin');
        }
        break;

      case ChatRoomType.HOTEL_OWNER_ADMIN:
        const hasHotelOwnerAdmin = p1Roles.includes('HotelOwner') || p2Roles.includes('HotelOwner');
        const hasAdminRole = p1Roles.includes('Admin') || p2Roles.includes('Admin');
        if (!hasHotelOwnerAdmin || !hasAdminRole) {
          throw new BadRequestException('Hotel Owner-Admin chat requires one hotel owner and one admin');
        }
        break;

      default:
        throw new BadRequestException('Invalid chat room type');
    }
  }
}
