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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const chat_room_entity_1 = require("../entities/chat-room.entity");
const chat_message_entity_1 = require("../entities/chat-message.entity");
const hotel_booking_entity_1 = require("../../hotel/entities/hotel-booking.entity");
const user_service_1 = require("../../user/services/user.service");
const redis_service_1 = require("./redis.service");
let ChatService = class ChatService {
    chatRoomRepository;
    chatMessageRepository;
    hotelBookingRepository;
    userService;
    redisService;
    constructor(chatRoomRepository, chatMessageRepository, hotelBookingRepository, userService, redisService) {
        this.chatRoomRepository = chatRoomRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.hotelBookingRepository = hotelBookingRepository;
        this.userService = userService;
        this.redisService = redisService;
    }
    async createOrGetChatRoom(createChatRoomDto, currentUserId) {
        const { participant1_id, participant2_id, hotel_id, booking_id } = createChatRoomDto;
        const [participant1, participant2] = await Promise.all([
            this.userService.findOne(participant1_id).catch(() => null),
            this.userService.findOne(participant2_id).catch(() => null),
        ]);
        if (!participant1 || !participant2) {
            throw new common_1.NotFoundException('One or both participants not found');
        }
        const currentUser = await this.userService.findOne(currentUserId).catch(() => null);
        const isAdmin = currentUser?.roles.some(role => role.name === 'Admin');
        const isParticipant = [participant1_id, participant2_id].includes(currentUserId);
        if (!isAdmin && !isParticipant) {
            throw new common_1.ForbiddenException('You can only create chat rooms where you are a participant');
        }
        let existingRoom = await this.chatRoomRepository.findOne({
            where: [
                { participant1_id, participant2_id },
                { participant1_id: participant2_id, participant2_id: participant1_id },
            ],
            relations: ['participant1', 'participant2', 'booking'],
        });
        if (existingRoom) {
            if (booking_id && !existingRoom.booking_id) {
                existingRoom.booking_id = booking_id;
                await this.chatRoomRepository.save(existingRoom);
            }
            return existingRoom;
        }
        const chatRoom = this.chatRoomRepository.create({
            participant1_id,
            participant2_id,
            hotel_id,
            booking_id,
        });
        const savedRoom = await this.chatRoomRepository.save(chatRoom);
        const roomWithRelations = await this.chatRoomRepository.findOne({
            where: { id: savedRoom.id },
            relations: ['participant1', 'participant2', 'booking'],
        });
        if (!roomWithRelations) {
            throw new common_1.NotFoundException('Created room not found');
        }
        return roomWithRelations;
    }
    async createChatRoomFromBooking(bookingId, currentUserId) {
        const booking = await this.hotelBookingRepository.findOne({
            where: { id: bookingId },
            relations: ['hotel', 'hotel.owner', 'user'],
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        const isCustomer = booking.user_id === currentUserId;
        const isHotelOwner = booking.hotel?.owner_id === currentUserId;
        const currentUser = await this.userService.findOne(currentUserId).catch(() => null);
        const isAdmin = currentUser?.roles.some(role => role.name === 'Admin');
        if (!isCustomer && !isHotelOwner && !isAdmin) {
            throw new common_1.ForbiddenException('You can only create chat rooms for your own bookings');
        }
        const customerId = booking.user_id;
        const hotelOwnerId = booking.hotel?.owner_id;
        if (!hotelOwnerId) {
            throw new common_1.BadRequestException('Hotel owner not found for this booking');
        }
        return this.createOrGetChatRoom({
            participant1_id: customerId,
            participant2_id: hotelOwnerId,
            hotel_id: booking.hotel_id,
            booking_id: bookingId,
        }, currentUserId);
    }
    async getChatRooms(query, currentUserId) {
        const { page = 1, limit = 20, participant_id, search, booking_id } = query;
        const skip = (page - 1) * limit;
        let queryBuilder = this.chatRoomRepository
            .createQueryBuilder('room')
            .leftJoinAndSelect('room.participant1', 'p1')
            .leftJoinAndSelect('room.participant2', 'p2')
            .leftJoinAndSelect('room.booking', 'booking')
            .where('(room.participant1_id = :userId OR room.participant2_id = :userId)', { userId: currentUserId })
            .andWhere('room.is_active = true');
        if (participant_id) {
            queryBuilder = queryBuilder.andWhere('(room.participant1_id = :participantId OR room.participant2_id = :participantId)', { participantId: participant_id });
        }
        if (booking_id) {
            queryBuilder = queryBuilder.andWhere('room.booking_id = :bookingId', { bookingId: booking_id });
        }
        if (search) {
            queryBuilder = queryBuilder.andWhere('(LOWER(p1.first_name || \' \' || p1.last_name) LIKE LOWER(:search) OR LOWER(p2.first_name || \' \' || p2.last_name) LIKE LOWER(:search))', { search: `%${search}%` });
        }
        const [rooms, total] = await queryBuilder
            .orderBy('room.last_message_at', 'DESC')
            .skip(skip)
            .take(limit)
            .getManyAndCount();
        return { rooms, total };
    }
    async getChatRoom(roomId, currentUserId) {
        const room = await this.chatRoomRepository.findOne({
            where: { id: roomId },
            relations: ['participant1', 'participant2', 'booking'],
        });
        if (!room) {
            throw new common_1.NotFoundException('Chat room not found');
        }
        const hasAccess = [room.participant1_id, room.participant2_id].includes(currentUserId);
        const currentUser = await this.userService.findOne(currentUserId).catch(() => null);
        const isAdmin = currentUser?.roles.some(role => role.name === 'Admin');
        if (!hasAccess && !isAdmin) {
            throw new common_1.ForbiddenException('You do not have access to this chat room');
        }
        return room;
    }
    async sendMessage(sendMessageDto, senderId) {
        const { chat_room_id, content, type, file_url, file_name, file_size, metadata } = sendMessageDto;
        const chatRoom = await this.getChatRoom(chat_room_id, senderId);
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
        await this.chatRoomRepository.update(chat_room_id, {
            last_message_content: content,
            last_message_at: new Date(),
        });
        const messageWithSender = await this.chatMessageRepository.findOne({
            where: { id: savedMessage.id },
            relations: ['sender'],
        });
        if (!messageWithSender) {
            throw new common_1.NotFoundException('Created message not found');
        }
        await this.redisService.publishMessage('chat:events', {
            event: 'new_message',
            roomId: chat_room_id,
            data: messageWithSender,
        });
        const recipientId = chatRoom.participant1_id === senderId
            ? chatRoom.participant2_id
            : chatRoom.participant1_id;
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
    async getMessages(query, currentUserId) {
        const { chat_room_id, page = 1, limit = 50, before, after } = query;
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
        return { messages: messages.reverse(), total };
    }
    async markMessagesAsRead(roomId, userId) {
        await this.getChatRoom(roomId, userId);
        await this.chatMessageRepository
            .createQueryBuilder()
            .update(chat_message_entity_1.ChatMessage)
            .set({ status: chat_message_entity_1.MessageStatus.READ })
            .where('chat_room_id = :roomId', { roomId })
            .andWhere('sender_id != :userId', { userId })
            .andWhere('status = :status', { status: chat_message_entity_1.MessageStatus.DELIVERED })
            .execute();
        await this.redisService.publishMessage('chat:events', {
            event: 'messages_read',
            roomId,
            data: { userId, roomId },
        });
    }
    async deleteMessage(messageId, currentUserId) {
        const message = await this.chatMessageRepository.findOne({
            where: { id: messageId },
            relations: ['sender'],
        });
        if (!message) {
            throw new common_1.NotFoundException('Message not found');
        }
        const currentUser = await this.userService.findOne(currentUserId).catch(() => null);
        const isAdmin = currentUser?.roles.some(role => role.name === 'Admin');
        const isOwner = message.sender_id === currentUserId;
        if (!isOwner && !isAdmin) {
            throw new common_1.ForbiddenException('You can only delete your own messages');
        }
        await this.chatMessageRepository.remove(message);
        await this.redisService.publishMessage('chat:events', {
            event: 'message_deleted',
            roomId: message.chat_room_id,
            data: { messageId, deletedBy: currentUserId },
        });
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(chat_room_entity_1.ChatRoom)),
    __param(1, (0, typeorm_1.InjectRepository)(chat_message_entity_1.ChatMessage)),
    __param(2, (0, typeorm_1.InjectRepository)(hotel_booking_entity_1.HotelBooking)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        user_service_1.UserService,
        redis_service_1.RedisService])
], ChatService);
//# sourceMappingURL=chat.service.js.map