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
var RoomService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const room_entity_1 = require("../entities/room.entity");
const room_availability_entity_1 = require("../entities/room-availability.entity");
const hotel_entity_1 = require("../entities/hotel.entity");
const hotel_data_sync_service_1 = require("../../search/services/data-sync/hotel.data-sync.service");
let RoomService = RoomService_1 = class RoomService {
    roomRepository;
    roomAvailabilityRepository;
    hotelRepository;
    dataSource;
    hotelDataSyncService;
    logger = new common_1.Logger(RoomService_1.name);
    SENSITIVE_OWNER_FIELDS = [
        'password_hash',
        'refresh_token',
        'activation_token',
        'roles',
        'is_active',
        'created_at',
        'updated_at',
    ];
    constructor(roomRepository, roomAvailabilityRepository, hotelRepository, dataSource, hotelDataSyncService) {
        this.roomRepository = roomRepository;
        this.roomAvailabilityRepository = roomAvailabilityRepository;
        this.hotelRepository = hotelRepository;
        this.dataSource = dataSource;
        this.hotelDataSyncService = hotelDataSyncService;
    }
    sanitizeUserObject(user, fieldsToRemove) {
        if (!user)
            return;
        fieldsToRemove.forEach((field) => {
            delete user[field];
        });
    }
    sanitizeRoomOwnerData(room) {
        if (room && room.hotel && room.hotel.owner) {
            this.sanitizeUserObject(room.hotel.owner, this.SENSITIVE_OWNER_FIELDS);
        }
    }
    sanitizeRoomsOwnerData(rooms) {
        rooms.filter(room => room).forEach((room) => this.sanitizeRoomOwnerData(room));
    }
    async create(createRoomDto, userId, userRoles) {
        const hotel = await this.hotelRepository.findOne({
            where: { id: createRoomDto.hotel_id },
            relations: ['owner'],
        });
        if (!hotel) {
            throw new common_1.NotFoundException('Hotel not found');
        }
        if (hotel.owner_id !== userId && !userRoles.includes('Admin')) {
            throw new common_1.ForbiddenException('You can only add rooms to your own hotels');
        }
        const existingRoom = await this.roomRepository.findOne({
            where: {
                hotel_id: createRoomDto.hotel_id,
                room_number: createRoomDto.room_number,
            },
        });
        if (existingRoom) {
            throw new common_1.ConflictException('Room number already exists in this hotel');
        }
        const room = this.roomRepository.create(createRoomDto);
        const savedRoom = await this.roomRepository.save(room);
        this.sanitizeRoomOwnerData(savedRoom);
        return savedRoom;
    }
    async findPublicRoomsByHotel(hotelId, checkInDate, checkOutDate, numberOfGuests) {
        const hotel = await this.hotelRepository.findOne({
            where: { id: hotelId },
        });
        if (!hotel) {
            throw new common_1.NotFoundException('Hotel not found');
        }
        const rooms = await this.roomRepository.find({
            where: { hotel_id: hotelId, is_active: true },
            order: { room_number: 'ASC' },
        });
        if (!checkInDate || !checkOutDate) {
            return {
                data: rooms.map(room => ({
                    id: room.id,
                    room_number: room.room_number,
                    room_type: room.room_type,
                    description: room.description,
                    max_occupancy: room.max_occupancy,
                    bed_configuration: room.bed_configuration,
                    size_sqm: room.size_sqm,
                })),
            };
        }
        const roomsWithPricing = await Promise.all(rooms.map(async (room) => {
            if (numberOfGuests && room.max_occupancy < numberOfGuests) {
                return null;
            }
            const availability = await this.roomAvailabilityRepository
                .createQueryBuilder('avail')
                .where('avail.room_id = :roomId', { roomId: room.id })
                .andWhere('avail.date >= :checkIn', { checkIn: checkInDate })
                .andWhere('avail.date < :checkOut', { checkOut: checkOutDate })
                .andWhere('avail.status = :status', { status: 'Available' })
                .andWhere('avail.available_units > 0')
                .getMany();
            const startDate = new Date(checkInDate);
            const endDate = new Date(checkOutDate);
            const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            if (availability.length < nights) {
                return null;
            }
            const avgPricePerNight = availability.reduce((sum, avail) => {
                return sum + parseFloat(avail.price_per_night.toString());
            }, 0) / availability.length;
            return {
                id: room.id,
                room_number: room.room_number,
                room_type: room.room_type,
                description: room.description,
                max_occupancy: room.max_occupancy,
                bed_configuration: room.bed_configuration,
                size_sqm: room.size_sqm,
                pricing: {
                    price_per_night: avgPricePerNight.toFixed(2),
                    available_units: Math.min(...availability.map(a => a.available_units)),
                },
            };
        }));
        const availableRooms = roomsWithPricing.filter(room => room !== null);
        return { data: availableRooms };
    }
    async findByHotel(hotelId, userId, userRoles) {
        const hotel = await this.hotelRepository.findOne({
            where: { id: hotelId },
        });
        if (!hotel) {
            throw new common_1.NotFoundException('Hotel not found');
        }
        if (hotel.owner_id !== userId && !userRoles.includes('Admin')) {
            throw new common_1.ForbiddenException('You can only view rooms for your own hotels');
        }
        const rooms = await this.roomRepository.find({
            where: { hotel_id: hotelId },
            relations: ['availability'],
            order: { room_number: 'ASC' },
        });
        this.sanitizeRoomsOwnerData(rooms);
        return rooms;
    }
    async findOne(id) {
        const room = await this.roomRepository.findOne({
            where: { id },
            relations: ['hotel', 'availability'],
        });
        if (!room) {
            throw new common_1.NotFoundException('Room not found');
        }
        this.sanitizeRoomOwnerData(room);
        return room;
    }
    async update(id, updateRoomDto, userId, userRoles) {
        const room = await this.roomRepository.findOne({
            where: { id },
            relations: ['hotel'],
        });
        if (!room) {
            throw new common_1.NotFoundException('Room not found');
        }
        if (room.hotel.owner_id !== userId && !userRoles.includes('Admin')) {
            throw new common_1.ForbiddenException('You can only update rooms in your own hotels');
        }
        if (updateRoomDto.room_number &&
            updateRoomDto.room_number !== room.room_number) {
            const existingRoom = await this.roomRepository.findOne({
                where: {
                    hotel_id: room.hotel_id,
                    room_number: updateRoomDto.room_number,
                },
            });
            if (existingRoom) {
                throw new common_1.ConflictException('Room number already exists in this hotel');
            }
        }
        await this.roomRepository.update(id, updateRoomDto);
        return this.findOne(id);
    }
    async delete(id, userId, userRoles) {
        const room = await this.roomRepository.findOne({
            where: { id },
            relations: ['hotel', 'bookings'],
        });
        if (!room) {
            throw new common_1.NotFoundException('Room not found');
        }
        if (room.hotel.owner_id !== userId && !userRoles.includes('Admin')) {
            throw new common_1.ForbiddenException('You can only delete rooms from your own hotels');
        }
        if (room.bookings && room.bookings.length > 0) {
            throw new common_1.BadRequestException('Cannot delete room with existing bookings');
        }
        await this.roomRepository.delete(id);
    }
    async createAvailability(createAvailabilityDto, userId, userRoles) {
        const room = await this.roomRepository.findOne({
            where: { id: createAvailabilityDto.room_id },
            relations: ['hotel'],
        });
        if (!room) {
            throw new common_1.NotFoundException('Room not found');
        }
        if (room.hotel.owner_id !== userId && !userRoles.includes('Admin')) {
            throw new common_1.ForbiddenException('You can only manage availability for your own hotel rooms');
        }
        const existingAvailability = await this.roomAvailabilityRepository.findOne({
            where: {
                room_id: createAvailabilityDto.room_id,
                date: createAvailabilityDto.date,
            },
        });
        if (existingAvailability) {
            throw new common_1.ConflictException('Availability already exists for this room and date');
        }
        const availability = this.roomAvailabilityRepository.create({
            ...createAvailabilityDto,
            total_units: createAvailabilityDto.total_units ||
                createAvailabilityDto.available_units,
        });
        const savedAvailability = await this.roomAvailabilityRepository.save(availability);
        this.sanitizeRoomOwnerData(savedAvailability.room);
        this.hotelDataSyncService.onRoomAvailabilityChanged(savedAvailability.room_id);
        return savedAvailability;
    }
    async createBulkAvailability(bulkAvailabilityDto, userId, userRoles) {
        const room = await this.roomRepository.findOne({
            where: { id: bulkAvailabilityDto.room_id },
            relations: ['hotel'],
        });
        if (!room) {
            throw new common_1.NotFoundException('Room not found');
        }
        if (room.hotel.owner_id !== userId && !userRoles.includes('Admin')) {
            throw new common_1.ForbiddenException('You can only manage availability for your own hotel rooms');
        }
        const startDate = new Date(bulkAvailabilityDto.start_date);
        const endDate = new Date(bulkAvailabilityDto.end_date);
        const dates = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            dates.push(d.toISOString().split('T')[0]);
        }
        return this.dataSource.transaction(async (manager) => {
            const availabilityRecords = [];
            for (const date of dates) {
                const existing = await manager.findOne(room_availability_entity_1.RoomAvailability, {
                    where: { room_id: bulkAvailabilityDto.room_id, date },
                });
                if (!existing) {
                    const availability = manager.create(room_availability_entity_1.RoomAvailability, {
                        room_id: bulkAvailabilityDto.room_id,
                        date,
                        price_per_night: bulkAvailabilityDto.price_per_night,
                        available_units: bulkAvailabilityDto.available_units,
                        total_units: bulkAvailabilityDto.total_units ||
                            bulkAvailabilityDto.available_units,
                        status: bulkAvailabilityDto.status || 'Available',
                    });
                    const saved = await manager.save(availability);
                    availabilityRecords.push(saved);
                    this.hotelDataSyncService.onRoomAvailabilityChanged(saved.room_id);
                }
            }
            return availabilityRecords;
        });
    }
    async updateAvailability(roomId, date, updateAvailabilityDto, userId, userRoles) {
        const room = await this.roomRepository.findOne({
            where: { id: roomId },
            relations: ['hotel'],
        });
        if (!room) {
            throw new common_1.NotFoundException('Room not found');
        }
        if (room.hotel.owner_id !== userId && !userRoles.includes('Admin')) {
            throw new common_1.ForbiddenException('You can only manage availability for your own hotel rooms');
        }
        const availability = await this.roomAvailabilityRepository.findOne({
            where: { room_id: roomId, date },
        });
        if (!availability) {
            throw new common_1.NotFoundException('Availability record not found');
        }
        await this.roomAvailabilityRepository.update(availability.id, updateAvailabilityDto);
        const updatedAvailability = await this.roomAvailabilityRepository.findOne({
            where: { id: availability.id },
            relations: ['room'],
        });
        if (!updatedAvailability) {
            throw new common_1.NotFoundException('Failed to retrieve updated availability');
        }
        this.sanitizeRoomOwnerData(updatedAvailability.room);
        this.hotelDataSyncService.onRoomAvailabilityChanged(updatedAvailability.room_id);
        return updatedAvailability;
    }
    async getAvailability(roomId, startDate, endDate) {
        const query = this.roomAvailabilityRepository
            .createQueryBuilder('availability')
            .where('availability.room_id = :roomId', { roomId });
        if (startDate) {
            query.andWhere('availability.date >= :startDate', { startDate });
        }
        if (endDate) {
            query.andWhere('availability.date <= :endDate', { endDate });
        }
        const availability = await query
            .orderBy('availability.date', 'ASC')
            .getMany();
        this.sanitizeRoomsOwnerData(availability.map((a) => a.room));
        return availability;
    }
    async checkAvailability(roomId, checkInDate, checkOutDate, requiredUnits = 1) {
        const availability = await this.roomAvailabilityRepository
            .createQueryBuilder('availability')
            .where('availability.room_id = :roomId', { roomId })
            .andWhere('availability.date >= :checkIn', { checkIn: checkInDate })
            .andWhere('availability.date < :checkOut', { checkOut: checkOutDate })
            .andWhere('availability.status = :status', { status: 'Available' })
            .orderBy('availability.date', 'ASC')
            .getMany();
        const startDate = new Date(checkInDate);
        const endDate = new Date(checkOutDate);
        const requiredDates = [];
        for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
            requiredDates.push(d.toISOString().split('T')[0]);
        }
        const availableDates = availability.map((a) => a.date);
        const unavailableDates = requiredDates.filter((date) => {
            const availRecord = availability.find((a) => a.date === date);
            return !availRecord || availRecord.available_units < requiredUnits;
        });
        if (unavailableDates.length > 0) {
            return {
                available: false,
                unavailableDates,
            };
        }
        const totalPrice = availability.reduce((sum, record) => sum + parseFloat(record.price_per_night.toString()), 0);
        return {
            available: true,
            totalPrice,
        };
    }
    async getPricingBreakdown(roomId, checkInDate, checkOutDate) {
        const room = await this.roomRepository.findOne({
            where: { id: roomId },
        });
        if (!room) {
            throw new common_1.NotFoundException('Room not found');
        }
        const availability = await this.roomAvailabilityRepository
            .createQueryBuilder('avail')
            .where('avail.room_id = :roomId', { roomId })
            .andWhere('avail.date >= :checkIn', { checkIn: checkInDate })
            .andWhere('avail.date < :checkOut', { checkOut: checkOutDate })
            .orderBy('avail.date', 'ASC')
            .getMany();
        const startDate = new Date(checkInDate);
        const endDate = new Date(checkOutDate);
        const nights = [];
        let subtotal = 0;
        for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const availRecord = availability.find((a) => a.date === dateStr);
            if (availRecord) {
                const price = parseFloat(availRecord.price_per_night.toString());
                nights.push({
                    date: dateStr,
                    dayName: d.toLocaleDateString('en-US', { weekday: 'long' }),
                    price,
                });
                subtotal += price;
            }
            else {
                nights.push({
                    date: dateStr,
                    dayName: d.toLocaleDateString('en-US', { weekday: 'long' }),
                    price: 0,
                });
            }
        }
        return {
            nights,
            subtotal,
            numberOfNights: nights.length,
        };
    }
};
exports.RoomService = RoomService;
exports.RoomService = RoomService = RoomService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(room_entity_1.Room)),
    __param(1, (0, typeorm_1.InjectRepository)(room_availability_entity_1.RoomAvailability)),
    __param(2, (0, typeorm_1.InjectRepository)(hotel_entity_1.Hotel)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        hotel_data_sync_service_1.HotelDataSyncService])
], RoomService);
//# sourceMappingURL=room.service.js.map