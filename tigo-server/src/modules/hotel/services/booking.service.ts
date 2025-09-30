import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, In } from 'typeorm';
import { HotelBooking } from '../entities/hotel-booking.entity';
import { Hotel } from '../entities/hotel.entity';
import { Room } from '../entities/room.entity';
import { RoomAvailability } from '../entities/room-availability.entity';
import { User } from '../../user/entities/user.entity';
import { CreateBookingDto } from '../dto/booking/create-booking.dto';
import { UpdateBookingDto } from '../dto/booking/update-booking.dto';
import { SearchBookingDto } from '../dto/booking/search-booking.dto';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  // Define sensitive fields that should be removed from user objects
  private readonly SENSITIVE_USER_FIELDS = [
    'password_hash',
    'refresh_token',
    'activation_token',
    'roles',
    'is_active',
    'created_at',
    'updated_at',
  ] as const;

  private readonly SENSITIVE_OWNER_FIELDS = [
    'password_hash',
    'refresh_token',
    'activation_token',
    'roles',
    'is_active',
    'created_at',
    'updated_at',
  ] as const;

  constructor(
    @InjectRepository(HotelBooking)
    private bookingRepository: Repository<HotelBooking>,

    @InjectRepository(Hotel)
    private hotelRepository: Repository<Hotel>,

    @InjectRepository(Room)
    private roomRepository: Repository<Room>,

    @InjectRepository(RoomAvailability)
    private roomAvailabilityRepository: Repository<RoomAvailability>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private dataSource: DataSource,
  ) {}

  /**
   * Helper function to sanitize user objects by removing sensitive fields
   */
  private sanitizeUserObject(
    user: any,
    fieldsToRemove: readonly string[],
  ): void {
    if (!user) return;

    fieldsToRemove.forEach((field) => {
      delete user[field];
    });
  }

  /**
   * Helper function to sanitize booking owner data
   */
  private sanitizeBookingOwnerData(booking: HotelBooking): void {
    this.sanitizeUserObject(booking.user, this.SENSITIVE_USER_FIELDS);
    this.sanitizeUserObject(booking.hotel?.owner, this.SENSITIVE_OWNER_FIELDS);
  }

  private sanitizeBookingsOwnerData(bookings: HotelBooking[]): void {
    bookings.forEach((booking) => this.sanitizeBookingOwnerData(booking));
  }

  async create(
    createBookingDto: CreateBookingDto,
    userId: string,
  ): Promise<HotelBooking> {
    return this.dataSource.transaction(async (manager) => {
      // Validate dates
      const checkIn = new Date(createBookingDto.check_in_date);
      const checkOut = new Date(createBookingDto.check_out_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (checkIn >= checkOut) {
        throw new BadRequestException(
          'Check-out date must be after check-in date',
        );
      }

      if (checkIn < today) {
        throw new BadRequestException('Check-in date cannot be in the past');
      }

      // Verify room exists and belongs to the specified hotel
      const room = await manager.findOne(Room, {
        where: {
          id: createBookingDto.room_id,
          hotel_id: createBookingDto.hotel_id,
        },
        relations: ['hotel'],
      });

      if (!room) {
        throw new NotFoundException(
          'Room not found or does not belong to the specified hotel',
        );
      }

      if (!room.hotel.is_active) {
        throw new BadRequestException('Hotel is not active');
      }

      // Validate guest capacity
      if (createBookingDto.number_of_guests > room.max_occupancy) {
        throw new BadRequestException(
          `Room can accommodate maximum ${room.max_occupancy} guests`,
        );
      }

      // Generate date range for booking
      const dates: string[] = [];
      for (
        let d = new Date(checkIn);
        d < checkOut;
        d.setDate(d.getDate() + 1)
      ) {
        dates.push(d.toISOString().split('T')[0]);
      }

      const unitsRequested = createBookingDto.units_requested || 1;

      // Check availability for all dates atomically
      const availability = await manager.find(RoomAvailability, {
        where: {
          room_id: createBookingDto.room_id,
          date: In(dates),
          status: 'Available',
        },
        order: { date: 'ASC' },
      });

      // Verify all dates are available
      if (availability.length !== dates.length) {
        const availableDates = availability.map((a) => a.date);
        const unavailableDates = dates.filter(
          (date) => !availableDates.includes(date),
        );
        throw new ConflictException(
          `Room is not available for dates: ${unavailableDates.join(', ')}`,
        );
      }

      // Check if sufficient units are available
      const insufficientDates = availability.filter(
        (a) => a.available_units < unitsRequested,
      );
      if (insufficientDates.length > 0) {
        throw new ConflictException(
          `Insufficient units available for dates: ${insufficientDates.map((a) => a.date).join(', ')}`,
        );
      }

      // Calculate total price
      const totalPrice = availability.reduce((sum, record) => {
        return (
          sum + parseFloat(record.price_per_night.toString()) * unitsRequested
        );
      }, 0);

      // Create booking
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

      const booking = manager.create(HotelBooking, bookingData);
      const savedBooking = await manager.save(booking);

      // Update availability (decrement available units)
      for (const availRecord of availability) {
        await manager.update(RoomAvailability, availRecord.id, {
          available_units: availRecord.available_units - unitsRequested,
        });
      }

      this.logger.log(
        `Booking created successfully: ${savedBooking.id} for room ${createBookingDto.room_id}`,
      );

      const bookingWithRelations = await manager.findOne(HotelBooking, {
        where: { id: savedBooking.id },
        relations: ['hotel', 'room', 'user'],
      });

      if (!bookingWithRelations) {
        throw new NotFoundException('Failed to retrieve created booking');
      }

      this.sanitizeBookingOwnerData(bookingWithRelations);

      return bookingWithRelations;
    });
  }

  async findByUser(userId: string): Promise<HotelBooking[]> {
    const bookings = await this.bookingRepository.find({
      where: { user_id: userId },
      relations: ['hotel', 'room'],
      order: { created_at: 'DESC' },
    });
    this.sanitizeBookingsOwnerData(bookings);
    return bookings;
  }

  async findByHotelOwner(
    ownerId: string,
    hotelId?: string,
  ): Promise<HotelBooking[]> {
    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.hotel', 'hotel')
      .leftJoinAndSelect('booking.room', 'room')
      .leftJoinAndSelect('booking.user', 'user')
      .where('hotel.owner_id = :ownerId', { ownerId });

    if (hotelId) {
      queryBuilder.andWhere('booking.hotel_id = :hotelId', { hotelId });
    }

    const bookings = await queryBuilder
      .orderBy('booking.created_at', 'DESC')
      .getMany();
    this.sanitizeBookingsOwnerData(bookings);
    return bookings;
  }

  async findByHotel(
    hotelId: string,
  ): Promise<HotelBooking[]> {
    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.hotel', 'hotel')
      .leftJoinAndSelect('booking.room', 'room')
      .leftJoinAndSelect('booking.user', 'user')
      .where('booking.hotel_id = :hotelId', { hotelId });

    const bookings = await queryBuilder
      .orderBy('booking.created_at', 'DESC')
      .getMany();
    this.sanitizeBookingsOwnerData(bookings);
    return bookings;
  }

  async findAll(): Promise<HotelBooking[]> {
    const bookings = await this.bookingRepository.find({
      relations: ['hotel', 'room', 'user'],
      order: { created_at: 'DESC' },
    });
    this.sanitizeBookingsOwnerData(bookings);
    return bookings;
  }

  async findOne(id: string): Promise<HotelBooking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['hotel', 'room', 'user'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    this.sanitizeBookingOwnerData(booking);

    return booking;
  }

  async updateStatus(
    id: string,
    updateBookingDto: UpdateBookingDto,
    userId: string,
    userRoles: string[],
  ): Promise<HotelBooking> {
    const booking = await this.findOne(id);

    // Check permissions
    const isOwner = booking.user_id === userId;
    const isHotelOwner = booking.hotel.owner_id === userId;
    const isAdmin = userRoles.includes('Admin');

    if (!isOwner && !isHotelOwner && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to update this booking',
      );
    }

    // Handle status-specific logic
    if (updateBookingDto.status) {
      const now = new Date();

      switch (updateBookingDto.status) {
        case 'Confirmed':
          updateBookingDto.confirmed_at = now;
          updateBookingDto.admin_notes = `Room ${booking.room.room_number} assigned to Mr/Mrs ${booking.guest_name}`;
          break;
        case 'Cancelled':
          if (booking.status === 'Cancelled') {
            throw new BadRequestException('Booking is already cancelled');
          }
          updateBookingDto.cancelled_at = now;
          updateBookingDto.confirmed_at = undefined;
          // Restore availability when booking is cancelled
          await this.restoreAvailability(booking);
          break;
      }
    }

    await this.bookingRepository.update(id, updateBookingDto);
    const updatedBooking = await this.findOne(id);
    this.sanitizeBookingOwnerData(updatedBooking);
    return updatedBooking;
  }

  async cancelBooking(
    id: string,
    userId: string,
    cancellationReason?: string,
  ): Promise<HotelBooking> {
    const booking = await this.findOne(id);

    if (booking.user_id !== userId && booking) {
      throw new ForbiddenException('You can only cancel your own bookings');
    }

    if (booking.status === 'Cancelled') {
      throw new BadRequestException('Booking is already cancelled');
    }

    if (booking.status === 'Completed' || booking.status === 'CheckedOut') {
      throw new BadRequestException('Cannot cancel a completed booking');
    }

    // Check cancellation policy (can be made configurable)
    const checkInDate = new Date(booking.check_in_date);
    const now = new Date();
    const hoursDifference =
      (checkInDate.getTime() - now.getTime()) / (1000 * 3600);

    if (hoursDifference < 24) {
      throw new BadRequestException(
        'Cannot cancel booking less than 24 hours before check-in',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      await manager.update(HotelBooking, id, {
        status: 'Cancelled',
        cancellation_reason: cancellationReason,
        cancelled_at: now,
      });

      // Restore room availability
      await this.restoreAvailability(booking, manager);

      const cancelledBooking = await manager.findOne(HotelBooking, {
        where: { id },
        relations: ['hotel', 'room', 'user'],
      });

      if (!cancelledBooking) {
        throw new NotFoundException('Failed to retrieve cancelled booking');
      }

      this.sanitizeBookingOwnerData(cancelledBooking);

      return cancelledBooking;
    });
  }

  async search(searchDto: SearchBookingDto): Promise<{
    bookings: HotelBooking[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.hotel', 'hotel')
      .leftJoinAndSelect('booking.room', 'room')
      .leftJoinAndSelect('booking.user', 'user');

    // Apply filters
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
      queryBuilder.andWhere(
        'LOWER(booking.guest_name) LIKE LOWER(:guestName)',
        {
          guestName: `%${searchDto.guest_name}%`,
        },
      );
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

    // Sorting
    const sortBy = searchDto.sort_by || 'created_at';
    const sortOrder = searchDto.sort_order || 'DESC';
    queryBuilder.orderBy(`booking.${sortBy}`, sortOrder);

    // Pagination
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

  private async restoreAvailability(
    booking: HotelBooking,
    manager?: any,
  ): Promise<void> {
    const transactionManager = manager || this.dataSource.manager;

    // Generate date range for booking
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(booking.check_out_date);
    const dates: string[] = [];

    for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }

    // Restore availability for each date
    for (const date of dates) {
      const availability = await transactionManager.findOne(RoomAvailability, {
        where: { room_id: booking.room_id, date },
      });

      if (availability) {
        await transactionManager.update(RoomAvailability, availability.id, {
          available_units:
            availability.available_units + booking.units_requested,
        });
      }
    }

    this.logger.log(`Availability restored for booking: ${booking.id}`);
  }
}
