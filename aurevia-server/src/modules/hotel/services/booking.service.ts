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
import { NotificationEventService } from '../../notification/services/notification-event.service';
import { TransactionService } from '../../transaction/services/transaction.service';
import { TransactionType } from '../../transaction/entities/transaction.entity';

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
    private notificationEventService: NotificationEventService,
    private transactionService: TransactionService,
  ) { }

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

      // Get user and check balance
      const user = await manager.findOne(User, {
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
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

      const finalPrice = totalPrice + (totalPrice * 0.1); // Including 10% tax or fees

      // Check if user has sufficient balance using transaction service
      const userBalance = await this.transactionService.getUserBalance(userId);
      if (userBalance < finalPrice) {
        throw new BadRequestException(
          `Insufficient balance. Your balance: $${userBalance.toFixed(2)}, Required: $${finalPrice.toFixed(2)}`,
        );
      }

      // Create booking first
      const bookingData = {
        hotel_id: createBookingDto.hotel_id,
        room_id: createBookingDto.room_id,
        user_id: userId,
        check_in_date: createBookingDto.check_in_date,
        check_out_date: createBookingDto.check_out_date,
        number_of_guests: createBookingDto.number_of_guests,
        units_requested: unitsRequested,
        total_price: totalPrice,
        paid_amount: finalPrice,
        guest_name: createBookingDto.guest_name,
        guest_phone: createBookingDto.guest_phone,
        guest_email: createBookingDto.guest_email,
        special_requests: createBookingDto.special_requests,
        status: 'Pending',
        payment_status: 'Paid',
      };

      const booking = manager.create(HotelBooking, bookingData);
      const savedBooking = await manager.save(booking);

      // Now deduct the booking amount from user's balance using transaction service with booking reference
      await this.transactionService.deductBalance(
        userId,
        finalPrice,
        TransactionType.BOOKING_PAYMENT,
        `Booking payment for ${room.hotel.name} - Room ${room.room_number}`,
        savedBooking.id, // Link transaction to booking
        'booking',
      );

      this.logger.log(
        `User ${userId} balance deducted: $${finalPrice.toFixed(2)} for booking ${savedBooking.id}`,
      );

      // Update availability (decrement available units)
      for (const availRecord of availability) {
        await manager.update(RoomAvailability, availRecord.id, {
          available_units: availRecord.available_units - unitsRequested,
          status: 'Booked',
        });
      }

      this.logger.log(
        `Booking created successfully: ${savedBooking.id} for room ${createBookingDto.room_id}`,
      );

      const bookingWithRelations = await manager.findOne(HotelBooking, {
        where: { id: savedBooking.id },
        relations: ['hotel', 'room', 'user', 'hotel.owner'],
      });

      if (!bookingWithRelations) {
        throw new NotFoundException('Failed to retrieve created booking');
      }
      if (bookingWithRelations.user_id) {
        try {
          await this.notificationEventService.triggerBookingNotification(
            bookingWithRelations.user_id,
            'BOOKING_CREATED',
            'Booking Created Successfully!',
            `Your booking at ${bookingWithRelations.hotel.name} - Room ${bookingWithRelations.room?.room_number || 'N/A'} has been confirmed. Check-in: ${new Date(bookingWithRelations.check_in_date).toLocaleDateString()}`,
            {
              booking_id: bookingWithRelations.id,
              hotel_id: bookingWithRelations.hotel_id,
              room_id: bookingWithRelations.room_id,
              guest_name: bookingWithRelations.guest_name,
              number_of_guests: bookingWithRelations.number_of_guests,
              check_in_date: bookingWithRelations.check_in_date,
              check_out_date: bookingWithRelations.check_out_date,
              paid_amount: bookingWithRelations.paid_amount,
              total_price: bookingWithRelations.total_price,
            },
          );
        } catch (error) {
          this.logger.error('Failed to send booking created notification to customer:', error);
        }
      }
      // Send notification to hotel owner about new booking
      if (bookingWithRelations.hotel?.owner?.id) {
        try {
          await this.notificationEventService.triggerBookingNotification(
            bookingWithRelations.hotel.owner.id,
            'BOOKING_CONFIRMATION',
            'New Booking Received!',
            `You have a new booking at ${bookingWithRelations.hotel.name} - Room ${bookingWithRelations.room?.room_number || 'N/A'} from ${bookingWithRelations.guest_name || 'Guest'}. Check-in: ${new Date(bookingWithRelations.check_in_date).toLocaleDateString()}`,
            {
              booking_id: bookingWithRelations.id,
              hotel_id: bookingWithRelations.hotel_id,
              room_id: bookingWithRelations.room_id,
              guest_name: bookingWithRelations.guest_name,
              number_of_guests: bookingWithRelations.number_of_guests,
              check_in_date: bookingWithRelations.check_in_date,
              check_out_date: bookingWithRelations.check_out_date,
              total_price: bookingWithRelations.total_price,
            },
          );
        } catch (error) {
          this.logger.error('Failed to send new booking notification to hotel owner:', error);
          // Don't fail the booking if notification fails
        }
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
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['hotel', 'room', 'user', 'hotel.owner'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check permissions
    const isOwner = booking.user_id === userId;
    const isHotelOwner = booking.hotel.owner_id === userId;
    const isAdmin = userRoles.includes('Admin');

    if (!isOwner && !isHotelOwner && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to update this booking',
      );
    }

    const oldStatus = booking.status;

    // Handle status-specific logic
    if (updateBookingDto.status) {
      const now = new Date();

      switch (updateBookingDto.status) {
        case 'Confirmed':
          updateBookingDto.confirmed_at = now;
          updateBookingDto.admin_notes = `Room ${booking.room.room_number} assigned to Mr/Mrs ${booking.guest_name}`;

          // Send confirmation notification to customer
          if (booking.user_id && oldStatus !== 'Confirmed') {
            try {
              await this.notificationEventService.triggerBookingNotification(
                booking.user_id,
                'BOOKING_CONFIRMATION',
                'Booking Confirmed!',
                `Your booking at ${booking.hotel.name} - Room ${booking.room?.room_number || 'N/A'} has been confirmed. Check-in: ${new Date(booking.check_in_date).toLocaleDateString()}`,
                {
                  booking_id: booking.id,
                  hotel_id: booking.hotel_id,
                  room_id: booking.room_id,
                  check_in_date: booking.check_in_date,
                  check_out_date: booking.check_out_date,
                },
              );
            } catch (error) {
              this.logger.error('Failed to send confirmation notification:', error);
            }
          }
          break;

        case 'Cancelled':
          if (booking.status === 'Cancelled') {
            throw new BadRequestException('Booking is already cancelled');
          }
          updateBookingDto.cancellation_reason = updateBookingDto.admin_notes || 'No reason provided';
          updateBookingDto.cancelled_at = now;
          updateBookingDto.confirmed_at = undefined;

          // Calculate refund based on cancellation timing
          // Check-in date is stored as date only, but check-in time is always at 2 PM (14:00)
          const checkInDate = new Date(booking.check_in_date);
          checkInDate.setHours(14, 0, 0, 0); // Set to 2 PM (14:00)
          
          const hoursDiff = (checkInDate.getTime() - now.getTime()) / (1000 * 3600);
          const paidAmount = parseFloat(booking.paid_amount.toString());
          let refundAmt = 0;
          let refundStatus: 'Refunded' | 'PartialRefund' = 'Refunded';

          if (hoursDiff < 24) {
            // Less than 1 day: 50% refund
            refundAmt = paidAmount * 0.5;
            refundStatus = 'PartialRefund';
          } else {
            // More than 1 day: Full refund
            refundAmt = paidAmount;
            refundStatus = 'Refunded';
          }

          updateBookingDto.payment_status = refundStatus;

          // Refund the user's balance using transaction service
          if (refundAmt > 0 && booking.user_id) {
            await this.transactionService.addBalance(
              booking.user_id,
              refundAmt,
              TransactionType.REFUND,
              `Refund for cancelled booking at ${booking.hotel.name} - Room ${booking.room.room_number} (${refundStatus === 'PartialRefund' ? '50% refund - cancelled within 24 hours' : 'Full refund'})`,
              booking.id,
              'booking',
            );

            this.logger.log(
              `Refund processed for user ${booking.user_id}: $${refundAmt.toFixed(2)} (${refundStatus})`,
            );
          }

          // Restore availability when booking is cancelled
          await this.restoreAvailability(booking);

          // Send cancellation notification to customer
          if (booking.user_id) {
            const refundMessage = refundStatus === 'PartialRefund'
              ? `Refunded: $${refundAmt.toFixed(2)} (50% - cancelled within 24 hours)`
              : `Refunded: $${refundAmt.toFixed(2)} (Full refund)`;

            try {
              await this.notificationEventService.triggerBookingNotification(
                booking.user_id,
                'BOOKING_CANCELLED',
                'Booking Cancelled!',
                `Your booking at ${booking.hotel.name} - Room ${booking.room?.room_number || 'N/A'} has been cancelled. ${refundMessage}. Reason: ${updateBookingDto.cancellation_reason}`,
                {
                  booking_id: booking.id,
                  hotel_id: booking.hotel_id,
                  room_id: booking.room_id,
                  check_in_date: booking.check_in_date,
                  check_out_date: booking.check_out_date,
                  cancellation_reason: updateBookingDto.cancellation_reason,
                  cancelled_by: isHotelOwner ? 'hotel_owner' : (isAdmin ? 'admin' : 'customer'),
                  refund_amount: refundAmt,
                  payment_status: refundStatus,
                },
              );
            } catch (error) {
              this.logger.error('Failed to send cancellation notification:', error);
            }
          }
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

    // Check cancellation policy and calculate refund
    // Check-in date is stored as date only (e.g., 2025-10-13)
    // Check-in time is always at 2 PM (14:00)
    const checkInDate = new Date(booking.check_in_date);
    checkInDate.setHours(14, 0, 0, 0); // Set to 2 PM (14:00)
    
    const now = new Date();
    const hoursDifference =
      (checkInDate.getTime() - now.getTime()) / (1000 * 3600);

    // Determine refund amount and payment status based on cancellation timing
    const paidAmount = parseFloat(booking.paid_amount.toString());
    let refundAmount = 0;
    let paymentStatus: 'Refunded' | 'PartialRefund' = 'Refunded';

    if (hoursDifference < 24) {
      // Less than 1 day before check-in: 50% refund
      refundAmount = paidAmount * 0.5;
      paymentStatus = 'PartialRefund';
      this.logger.log(
        `Cancellation within 24 hours of check-in (${checkInDate.toLocaleString()}). Partial refund (50%): $${refundAmount.toFixed(2)}`,
      );
    } else {
      // More than 1 day before check-in: Full refund
      refundAmount = paidAmount;
      paymentStatus = 'Refunded';
      this.logger.log(
        `Cancellation more than 24 hours before check-in (${checkInDate.toLocaleString()}). Full refund: $${refundAmount.toFixed(2)}`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // Refund the user's balance using transaction service
      if (refundAmount > 0) {
        await this.transactionService.addBalance(
          userId,
          refundAmount,
          TransactionType.REFUND,
          `Refund for cancelled booking at ${booking.hotel.name} - Room ${booking.room.room_number} (${paymentStatus === 'PartialRefund' ? '50% refund - cancelled within 24 hours' : 'Full refund'})${cancellationReason ? ` - Reason: ${cancellationReason}` : ''}`,
          booking.id,
          'booking',
        );

        this.logger.log(
          `Refund processed for user ${userId}: $${refundAmount.toFixed(2)} (${paymentStatus})`,
        );
      }

      await manager.update(HotelBooking, id, {
        status: 'Cancelled',
        cancellation_reason: cancellationReason,
        cancelled_at: now,
        payment_status: paymentStatus,
      });

      // Restore room availability
      await this.restoreAvailability(booking, manager);

      const cancelledBooking = await manager.findOne(HotelBooking, {
        where: { id },
        relations: ['hotel', 'room', 'user', 'hotel.owner'],
      });

      if (!cancelledBooking) {
        throw new NotFoundException('Failed to retrieve cancelled booking');
      }

      // Send notification to hotel owner about booking cancellation
      if (cancelledBooking.hotel?.owner?.id) {
        try {
          await this.notificationEventService.triggerBookingNotification(
            cancelledBooking.hotel.owner.id,
            'BOOKING_CANCELLED',
            'Booking Cancelled',
            `A booking for ${cancelledBooking.hotel.name} - Room ${cancelledBooking.room?.room_number || 'N/A'} has been cancelled by ${cancelledBooking.user?.first_name || 'Guest'} ${cancelledBooking.user?.last_name || ''}. Check-in date: ${new Date(cancelledBooking.check_in_date).toLocaleDateString()}`,
            {
              booking_id: cancelledBooking.id,
              hotel_id: cancelledBooking.hotel_id,
              room_id: cancelledBooking.room_id,
              guest_name: cancelledBooking.guest_name,
              check_in_date: cancelledBooking.check_in_date,
              check_out_date: cancelledBooking.check_out_date,
              cancellation_reason: cancellationReason || 'No reason provided',
              cancelled_by: 'customer',
            },
          );
        } catch (error) {
          this.logger.error('Failed to send cancellation notification to hotel owner:', error);
          // Don't fail the cancellation if notification fails
        }
        if (cancelledBooking.user_id) {
          try {
            const refundMessage = paymentStatus === 'PartialRefund' 
              ? `Refunded amount: $${refundAmount.toFixed(2)} (50% - cancelled within 24 hours of check-in)`
              : `Refunded amount: $${refundAmount.toFixed(2)} (Full refund)`;
            
            await this.notificationEventService.triggerBookingNotification(
              cancelledBooking.user_id,
              'BOOKING_CANCELLED',
              'Booking Cancelled',
              `Your booking for ${cancelledBooking.hotel.name} - Room ${cancelledBooking.room?.room_number || 'N/A'} has been cancelled. ${refundMessage}. Check-in date: ${new Date(cancelledBooking.check_in_date).toLocaleDateString()}`,
              {
                booking_id: cancelledBooking.id,
                hotel_id: cancelledBooking.hotel_id,
                room_id: cancelledBooking.room_id,
                guest_name: cancelledBooking.guest_name,
                check_in_date: cancelledBooking.check_in_date,
                check_out_date: cancelledBooking.check_out_date,
                cancellation_reason: cancellationReason || 'No reason provided',
                cancelled_by: 'customer',
                refund_amount: refundAmount,
                payment_status: paymentStatus,
              },
            );
          } catch (error) {
            this.logger.error('Failed to send cancellation notification to user:', error);
            // Don't fail the cancellation if notification fails
          }
        }
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
          status: 'Available',
        });
      }
    }

    this.logger.log(`Availability restored for booking: ${booking.id}`);
  }
}
