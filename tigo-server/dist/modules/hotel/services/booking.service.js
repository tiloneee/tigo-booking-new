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
var BookingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const hotel_booking_entity_1 = require("../entities/hotel-booking.entity");
const hotel_entity_1 = require("../entities/hotel.entity");
const room_entity_1 = require("../entities/room.entity");
const room_availability_entity_1 = require("../entities/room-availability.entity");
const user_entity_1 = require("../../user/entities/user.entity");
let BookingService = BookingService_1 = class BookingService {
    bookingRepository;
    hotelRepository;
    roomRepository;
    roomAvailabilityRepository;
    userRepository;
    dataSource;
    logger = new common_1.Logger(BookingService_1.name);
    SENSITIVE_USER_FIELDS = [
        'password_hash',
        'refresh_token',
        'activation_token',
        'roles',
        'is_active',
        'created_at',
        'updated_at',
    ];
    SENSITIVE_OWNER_FIELDS = [
        'password_hash',
        'refresh_token',
        'activation_token',
        'roles',
        'is_active',
        'created_at',
        'updated_at'
    ];
    constructor(bookingRepository, hotelRepository, roomRepository, roomAvailabilityRepository, userRepository, dataSource) {
        this.bookingRepository = bookingRepository;
        this.hotelRepository = hotelRepository;
        this.roomRepository = roomRepository;
        this.roomAvailabilityRepository = roomAvailabilityRepository;
        this.userRepository = userRepository;
        this.dataSource = dataSource;
    }
    sanitizeUserObject(user, fieldsToRemove) {
        if (!user)
            return;
        fieldsToRemove.forEach(field => {
            delete user[field];
        });
    }
    sanitizeBookingOwnerData(booking) {
        this.sanitizeUserObject(booking.user, this.SENSITIVE_USER_FIELDS);
        this.sanitizeUserObject(booking.hotel?.owner, this.SENSITIVE_OWNER_FIELDS);
    }
    sanitizeBookingsOwnerData(bookings) {
        bookings.forEach((booking) => this.sanitizeBookingOwnerData(booking));
    }
    async create(createBookingDto, userId) {
        return this.dataSource.transaction(async (manager) => {
            const checkIn = new Date(createBookingDto.check_in_date);
            const checkOut = new Date(createBookingDto.check_out_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (checkIn >= checkOut) {
                throw new common_1.BadRequestException('Check-out date must be after check-in date');
            }
            if (checkIn < today) {
                throw new common_1.BadRequestException('Check-in date cannot be in the past');
            }
            const room = await manager.findOne(room_entity_1.Room, {
                where: {
                    id: createBookingDto.room_id,
                    hotel_id: createBookingDto.hotel_id,
                },
                relations: ['hotel'],
            });
            if (!room) {
                throw new common_1.NotFoundException('Room not found or does not belong to the specified hotel');
            }
            if (!room.hotel.is_active) {
                throw new common_1.BadRequestException('Hotel is not active');
            }
            if (createBookingDto.number_of_guests > room.max_occupancy) {
                throw new common_1.BadRequestException(`Room can accommodate maximum ${room.max_occupancy} guests`);
            }
            const dates = [];
            for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
                dates.push(d.toISOString().split('T')[0]);
            }
            const unitsRequested = createBookingDto.units_requested || 1;
            const availability = await manager.find(room_availability_entity_1.RoomAvailability, {
                where: {
                    room_id: createBookingDto.room_id,
                    date: (0, typeorm_2.In)(dates),
                    status: 'Available',
                },
                order: { date: 'ASC' },
            });
            if (availability.length !== dates.length) {
                const availableDates = availability.map((a) => a.date);
                const unavailableDates = dates.filter((date) => !availableDates.includes(date));
                throw new common_1.ConflictException(`Room is not available for dates: ${unavailableDates.join(', ')}`);
            }
            const insufficientDates = availability.filter((a) => a.available_units < unitsRequested);
            if (insufficientDates.length > 0) {
                throw new common_1.ConflictException(`Insufficient units available for dates: ${insufficientDates.map((a) => a.date).join(', ')}`);
            }
            const totalPrice = availability.reduce((sum, record) => {
                return (sum + parseFloat(record.price_per_night.toString()) * unitsRequested);
            }, 0);
            const bookingData = {
                hotel_id: createBookingDto.hotel_id,
                room_id: createBookingDto.room_id,
                user_id: userId,
                check_in_date: createBookingDto.check_in_date,
                check_out_date: createBookingDto.check_out_date,
                number_of_guests: createBookingDto.number_of_guests,
                units_requested: unitsRequested,
                total_price: totalPrice,
                guest_name: createBookingDto.guest_name,
                guest_phone: createBookingDto.guest_phone,
                guest_email: createBookingDto.guest_email,
                special_requests: createBookingDto.special_requests,
                status: 'Pending',
                payment_status: 'Pending',
            };
            const booking = manager.create(hotel_booking_entity_1.HotelBooking, bookingData);
            const savedBooking = await manager.save(booking);
            for (const availRecord of availability) {
                await manager.update(room_availability_entity_1.RoomAvailability, availRecord.id, {
                    available_units: availRecord.available_units - unitsRequested,
                });
            }
            this.logger.log(`Booking created successfully: ${savedBooking.id} for room ${createBookingDto.room_id}`);
            const bookingWithRelations = await manager.findOne(hotel_booking_entity_1.HotelBooking, {
                where: { id: savedBooking.id },
                relations: ['hotel', 'room', 'user'],
            });
            if (!bookingWithRelations) {
                throw new common_1.NotFoundException('Failed to retrieve created booking');
            }
            this.sanitizeBookingOwnerData(bookingWithRelations);
            return bookingWithRelations;
        });
    }
    async findByUser(userId) {
        const bookings = await this.bookingRepository.find({
            where: { user_id: userId },
            relations: ['hotel', 'room'],
            order: { created_at: 'DESC' },
        });
        this.sanitizeBookingsOwnerData(bookings);
        return bookings;
    }
    async findByHotelOwner(ownerId, hotelId) {
        const queryBuilder = this.bookingRepository
            .createQueryBuilder('booking')
            .leftJoinAndSelect('booking.hotel', 'hotel')
            .leftJoinAndSelect('booking.room', 'room')
            .leftJoinAndSelect('booking.user', 'user')
            .where('hotel.owner_id = :ownerId', { ownerId });
        if (hotelId) {
            queryBuilder.andWhere('booking.hotel_id = :hotelId', { hotelId });
        }
        const bookings = await queryBuilder.orderBy('booking.created_at', 'DESC').getMany();
        this.sanitizeBookingsOwnerData(bookings);
        return bookings;
    }
    async findAll() {
        const bookings = await this.bookingRepository.find({
            relations: ['hotel', 'room', 'user'],
            order: { created_at: 'DESC' },
        });
        this.sanitizeBookingsOwnerData(bookings);
        return bookings;
    }
    async findOne(id) {
        const booking = await this.bookingRepository.findOne({
            where: { id },
            relations: ['hotel', 'room', 'user'],
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        this.sanitizeBookingOwnerData(booking);
        return booking;
    }
    async updateStatus(id, updateBookingDto, userId, userRoles) {
        const booking = await this.findOne(id);
        const isOwner = booking.user_id === userId;
        const isHotelOwner = booking.hotel.owner_id === userId;
        const isAdmin = userRoles.includes('Admin');
        if (!isOwner && !isHotelOwner && !isAdmin) {
            throw new common_1.ForbiddenException('You do not have permission to update this booking');
        }
        if (updateBookingDto.status) {
            const now = new Date();
            switch (updateBookingDto.status) {
                case 'Confirmed':
                    updateBookingDto.confirmed_at = now;
                    updateBookingDto.admin_notes = `Room ${booking.room.room_number} assigned to Mr/Mrs ${booking.guest_name}`;
                    break;
                case 'Cancelled':
                    if (booking.status === 'Cancelled') {
                        throw new common_1.BadRequestException('Booking is already cancelled');
                    }
                    updateBookingDto.cancelled_at = now;
                    updateBookingDto.confirmed_at = undefined;
                    await this.restoreAvailability(booking);
                    break;
            }
        }
        await this.bookingRepository.update(id, updateBookingDto);
        const updatedBooking = await this.findOne(id);
        this.sanitizeBookingOwnerData(updatedBooking);
        return updatedBooking;
    }
    async cancelBooking(id, userId, cancellationReason) {
        const booking = await this.findOne(id);
        if (booking.user_id !== userId && booking) {
            throw new common_1.ForbiddenException('You can only cancel your own bookings');
        }
        if (booking.status === 'Cancelled') {
            throw new common_1.BadRequestException('Booking is already cancelled');
        }
        if (booking.status === 'Completed' || booking.status === 'CheckedOut') {
            throw new common_1.BadRequestException('Cannot cancel a completed booking');
        }
        const checkInDate = new Date(booking.check_in_date);
        const now = new Date();
        const hoursDifference = (checkInDate.getTime() - now.getTime()) / (1000 * 3600);
        if (hoursDifference < 24) {
            throw new common_1.BadRequestException('Cannot cancel booking less than 24 hours before check-in');
        }
        return this.dataSource.transaction(async (manager) => {
            await manager.update(hotel_booking_entity_1.HotelBooking, id, {
                status: 'Cancelled',
                cancellation_reason: cancellationReason,
                cancelled_at: now,
            });
            await this.restoreAvailability(booking, manager);
            const cancelledBooking = await manager.findOne(hotel_booking_entity_1.HotelBooking, {
                where: { id },
                relations: ['hotel', 'room', 'user'],
            });
            if (!cancelledBooking) {
                throw new common_1.NotFoundException('Failed to retrieve cancelled booking');
            }
            this.sanitizeBookingOwnerData(cancelledBooking);
            return cancelledBooking;
        });
    }
    async search(searchDto) {
        const queryBuilder = this.bookingRepository
            .createQueryBuilder('booking')
            .leftJoinAndSelect('booking.hotel', 'hotel')
            .leftJoinAndSelect('booking.room', 'room')
            .leftJoinAndSelect('booking.user', 'user');
        if (searchDto.hotel_id) {
            queryBuilder.andWhere('booking.hotel_id = :hotelId', {
                hotelId: searchDto.hotel_id,
            });
        }
        if (searchDto.room_id) {
            queryBuilder.andWhere('booking.room_id = :roomId', {
                roomId: searchDto.room_id,
            });
        }
        if (searchDto.user_id) {
            queryBuilder.andWhere('booking.user_id = :userId', {
                userId: searchDto.user_id,
            });
        }
        if (searchDto.status && searchDto.status.length > 0) {
            queryBuilder.andWhere('booking.status IN (:...statuses)', {
                statuses: searchDto.status,
            });
        }
        if (searchDto.payment_status && searchDto.payment_status.length > 0) {
            queryBuilder.andWhere('booking.payment_status IN (:...paymentStatuses)', {
                paymentStatuses: searchDto.payment_status,
            });
        }
        if (searchDto.check_in_from) {
            queryBuilder.andWhere('booking.check_in_date >= :checkInFrom', {
                checkInFrom: searchDto.check_in_from,
            });
        }
        if (searchDto.check_in_to) {
            queryBuilder.andWhere('booking.check_in_date <= :checkInTo', {
                checkInTo: searchDto.check_in_to,
            });
        }
        if (searchDto.guest_name) {
            queryBuilder.andWhere('LOWER(booking.guest_name) LIKE LOWER(:guestName)', {
                guestName: `%${searchDto.guest_name}%`,
            });
        }
        if (searchDto.min_price) {
            queryBuilder.andWhere('booking.total_price >= :minPrice', {
                minPrice: searchDto.min_price,
            });
        }
        if (searchDto.max_price) {
            queryBuilder.andWhere('booking.total_price <= :maxPrice', {
                maxPrice: searchDto.max_price,
            });
        }
        const sortBy = searchDto.sort_by || 'created_at';
        const sortOrder = searchDto.sort_order || 'DESC';
        queryBuilder.orderBy(`booking.${sortBy}`, sortOrder);
        const page = searchDto.page || 1;
        const limit = searchDto.limit || 20;
        const skip = (page - 1) * limit;
        queryBuilder.skip(skip).take(limit);
        const [bookings, total] = await queryBuilder.getManyAndCount();
        this.sanitizeBookingsOwnerData(bookings);
        return {
            bookings,
            total,
            page,
            limit,
        };
    }
    async restoreAvailability(booking, manager) {
        const transactionManager = manager || this.dataSource.manager;
        const checkIn = new Date(booking.check_in_date);
        const checkOut = new Date(booking.check_out_date);
        const dates = [];
        for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
            dates.push(d.toISOString().split('T')[0]);
        }
        for (const date of dates) {
            const availability = await transactionManager.findOne(room_availability_entity_1.RoomAvailability, {
                where: { room_id: booking.room_id, date },
            });
            if (availability) {
                await transactionManager.update(room_availability_entity_1.RoomAvailability, availability.id, {
                    available_units: availability.available_units + booking.units_requested,
                });
            }
        }
        this.logger.log(`Availability restored for booking: ${booking.id}`);
    }
};
exports.BookingService = BookingService;
exports.BookingService = BookingService = BookingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(hotel_booking_entity_1.HotelBooking)),
    __param(1, (0, typeorm_1.InjectRepository)(hotel_entity_1.Hotel)),
    __param(2, (0, typeorm_1.InjectRepository)(room_entity_1.Room)),
    __param(3, (0, typeorm_1.InjectRepository)(room_availability_entity_1.RoomAvailability)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], BookingService);
//# sourceMappingURL=booking.service.js.map