import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Hotel } from '../entities/hotel.entity';
import { HotelAmenity } from '../entities/hotel-amenity.entity';
import { Room } from '../entities/room.entity';
import { RoomAvailability } from '../entities/room-availability.entity';
import { HotelRequest, HotelRequestStatus } from '../entities/hotel-request.entity';
import { CreateHotelDto } from '../dto/hotel/create-hotel.dto';
import { UpdateHotelDto } from '../dto/hotel/update-hotel.dto';
import { SearchHotelDto } from '../dto/hotel/search-hotel.dto';
import { CreateHotelRequestDto } from '../dto/hotel/create-hotel-request.dto';
import { ReviewHotelRequestDto } from '../dto/hotel/review-hotel-request.dto';
import { GeocodingService } from './geocoding.service';
import { HotelDataSyncService } from '../../search/services/data-sync/hotel.data-sync.service';
import { In } from 'typeorm';
import { User } from 'src/modules/user/entities/user.entity';
import { UserService } from 'src/modules/user/services/user.service';
import { NotificationEventService } from '../../notification/services/notification-event.service';


@Injectable()
export class HotelService {
  private readonly logger = new Logger(HotelService.name);

  constructor(
    @InjectRepository(Hotel)
    private hotelRepository: Repository<Hotel>,

    @InjectRepository(HotelAmenity)
    private amenityRepository: Repository<HotelAmenity>,

    @InjectRepository(Room)
    private roomRepository: Repository<Room>,

    @InjectRepository(RoomAvailability)
    private roomAvailabilityRepository: Repository<RoomAvailability>,

    @InjectRepository(HotelRequest)
    private hotelRequestRepository: Repository<HotelRequest>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private geocodingService: GeocodingService,

    private hotelDataSyncService: HotelDataSyncService,
    private userService: UserService,
    private notificationEventService: NotificationEventService,
  ) {}

  /**
   * Helper method to remove sensitive fields from hotel owner data
   */
  private sanitizeHotelOwnerData(hotel: Hotel): void {
    if (hotel.owner) {
      delete (hotel.owner as any).password_hash;
      delete (hotel.owner as any).refresh_token;
      delete (hotel.owner as any).activation_token;
      delete (hotel.owner as any).roles;
      delete (hotel.owner as any).is_active;
      delete (hotel.owner as any).created_at;
      delete (hotel.owner as any).updated_at;
      delete (hotel.owner as any).phone_number;
    }
  }

  /**
   * Helper method to sanitize multiple hotels
   */
  private sanitizeHotelsOwnerData(hotels: Hotel[]): void {
    hotels.forEach((hotel) => this.sanitizeHotelOwnerData(hotel));
  }

  async create(
    createHotelDto: CreateHotelDto,
    ownerId: string,
  ): Promise<Hotel> {
    try {
      // Check if hotel with same name and address exists
      const existingHotel = await this.hotelRepository.findOne({
        where: {
          name: createHotelDto.name,
          address: createHotelDto.address,
        },
      });

      if (existingHotel) {
        throw new ConflictException(
          'Hotel with this name and address already exists',
        );
      }

      // Geocode the address
      const coordinates = await this.geocodingService.geocodeAddress(
        createHotelDto.address,
        createHotelDto.city,
        createHotelDto.state,
        createHotelDto.country,
      );

      // Create hotel entity with proper typing
      const hotelData: Partial<Hotel> = {
        name: createHotelDto.name,
        description: createHotelDto.description,
        address: createHotelDto.address,
        city: createHotelDto.city,
        state: createHotelDto.state,
        zip_code: createHotelDto.zip_code,
        country: createHotelDto.country,
        phone_number: createHotelDto.phone_number,
        owner_id: ownerId,
        latitude: coordinates?.latitude || null,
        longitude: coordinates?.longitude || null,
      };

      const hotel = this.hotelRepository.create(hotelData);

      // Save hotel first
      const savedHotel = await this.hotelRepository.save(hotel);

      // Handle amenities if provided
      if (createHotelDto.amenity_ids && createHotelDto.amenity_ids.length > 0) {
        const amenities = await this.amenityRepository.find({
          where: { id: In(createHotelDto.amenity_ids) },
        });
        savedHotel.amenities = amenities;
        await this.hotelRepository.save(savedHotel);
      }

      this.logger.log(
        `Hotel created successfully: ${savedHotel.id} by owner ${ownerId}`,
      );
      this.hotelDataSyncService.onHotelCreated(savedHotel);
      return this.findOne(savedHotel.id);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error('Failed to create hotel', error);
      throw new BadRequestException('Failed to create hotel');
    }
  }

  async findAll(): Promise<Hotel[]> {
    const hotels = await this.hotelRepository.find({
      relations: ['owner', 'amenities', 'rooms'],
      order: { created_at: 'DESC' },
    });

    // Remove sensitive fields from owner for each hotel
    this.sanitizeHotelsOwnerData(hotels);

    return hotels;
  }

  async findAllActive(options: {
    page: number;
    limit: number;
    sort_by?: string;
    sort_order?: 'ASC' | 'DESC';
  }): Promise<{ hotels: Hotel[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.hotelRepository
      .createQueryBuilder('hotel')
      .leftJoinAndSelect('hotel.amenities', 'amenities')
      .where('hotel.is_active = :isActive', { isActive: true });

    // Sorting
    const sortBy = options.sort_by || 'name';
    const sortOrder = options.sort_order || 'ASC';

    switch (sortBy) {
      case 'rating':
        queryBuilder.orderBy('hotel.avg_rating', sortOrder);
        break;
      case 'name':
      default:
        queryBuilder.orderBy('hotel.name', sortOrder);
        break;
    }

    // Pagination
    const skip = (options.page - 1) * options.limit;
    queryBuilder.skip(skip).take(options.limit);

    const [hotels, total] = await queryBuilder.getManyAndCount();

    // Sanitize owner data for public access
    this.sanitizeHotelsOwnerData(hotels);

    return {
      hotels,
      total,
      page: options.page,
      limit: options.limit,
    };
  }

  // Optimized query for owner's hotels
  async findByOwner(ownerId: string): Promise<Hotel[]> {
    const hotels = await this.hotelRepository.find({
      where: { owner_id: ownerId },
      relations: ['owner', 'amenities', 'rooms'],
      order: { created_at: 'DESC' },
    });

    // Remove sensitive fields from owner for each hotel
    this.sanitizeHotelsOwnerData(hotels);

    return hotels;
  }

  async findOne(id: string): Promise<Hotel> {
    const hotel = await this.hotelRepository.findOne({
      where: { id },
      relations: ['owner', 'amenities', 'rooms', 'rooms.availability'],
    });

    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    // Remove sensitive fields from owner
    this.sanitizeHotelOwnerData(hotel);

    return hotel;
  }


  async update(
    id: string,
    updateHotelDto: UpdateHotelDto,
    userId: string,
    userRoles: string[],
  ): Promise<Hotel> {
    const hotel = await this.findOne(id);

    // Check ownership or admin role
    if (hotel.owner_id !== userId && !userRoles.includes('Admin')) {
      throw new ForbiddenException('You can only update your own hotels');
    }

    // Handle geocoding if address fields changed
    const needsGeocoding =
      updateHotelDto.address ||
      updateHotelDto.city ||
      updateHotelDto.state ||
      updateHotelDto.country;

    let coordinates: { latitude: number; longitude: number } | null = null;
    if (needsGeocoding) {
      coordinates = await this.geocodingService.geocodeAddress(
        updateHotelDto.address || hotel.address,
        updateHotelDto.city || hotel.city,
        updateHotelDto.state || hotel.state,
        updateHotelDto.country || hotel.country,
      );
    }

    // Update hotel with proper type handling
    const updateData: Partial<Hotel> = {
      ...updateHotelDto,
    };

    if (coordinates) {
      updateData.latitude = coordinates.latitude;
      updateData.longitude = coordinates.longitude;
    }

    await this.hotelRepository.update(id, updateData);

    // Handle amenities if provided
    if (updateHotelDto.amenity_ids !== undefined) {
      const updatedHotel = await this.findOne(id);
      if (updateHotelDto.amenity_ids.length > 0) {
        const amenities = await this.amenityRepository.find({
          where: { id: In(updateHotelDto.amenity_ids) },
        });
        updatedHotel.amenities = amenities;
      } else {
        updatedHotel.amenities = [];
      }
      await this.hotelRepository.save(updatedHotel);
    }

    this.logger.log(`Hotel updated: ${id} by user ${userId}`);
    const updatedHotel = await this.findOne(id);
    this.sanitizeHotelOwnerData(updatedHotel);
    this.hotelDataSyncService.onHotelUpdated(updatedHotel);
    return updatedHotel;
  }

  async delete(id: string, userId: string, userRoles: string[]): Promise<void> {
    const hotel = await this.findOne(id);

    // Check ownership or admin role
    if (hotel.owner_id !== userId && !userRoles.includes('Admin')) {
      throw new ForbiddenException('You can only delete your own hotels');
    }

    await this.hotelRepository.delete(id);
    this.logger.log(`Hotel deleted: ${id} by user ${userId}`);
    this.hotelDataSyncService.onHotelDeleted(id);
  }

  async search(
    searchDto: SearchHotelDto,
  ): Promise<{ hotels: Hotel[]; total: number; page: number; limit: number }> {
    const startTime = Date.now();

    const queryBuilder = this.hotelRepository
      .createQueryBuilder('hotel')
      .leftJoinAndSelect('hotel.amenities', 'amenities')
      .leftJoinAndSelect('hotel.rooms', 'rooms')
      .leftJoinAndSelect('rooms.availability', 'availability')
      .where('hotel.is_active = :isActive', { isActive: true });

    // Location-based filtering
    if (searchDto.city) {
      queryBuilder.andWhere('LOWER(hotel.city) LIKE LOWER(:city)', {
        city: `%${searchDto.city}%`,
      });
    }

    // Geospatial search with optimized query
    if (searchDto.latitude && searchDto.longitude && searchDto.radius_km) {
      queryBuilder.andWhere(
        `
        (6371 * acos(cos(radians(:lat)) * cos(radians(hotel.latitude)) * 
        cos(radians(hotel.longitude) - radians(:lng)) + 
        sin(radians(:lat)) * sin(radians(hotel.latitude)))) <= :radius
      `,
        {
          lat: searchDto.latitude,
          lng: searchDto.longitude,
          radius: searchDto.radius_km,
        },
      );
    }

    // Rating filter
    if (searchDto.min_rating) {
      queryBuilder.andWhere('hotel.avg_rating >= :minRating', {
        minRating: searchDto.min_rating,
      });
    }

    // Room type filter
    if (searchDto.room_type) {
      queryBuilder.andWhere('rooms.room_type = :roomType', {
        roomType: searchDto.room_type,
      });
    }

    // Availability and pricing filter with optimized queries
    if (searchDto.check_in_date && searchDto.check_out_date) {
      queryBuilder.andWhere(
        'availability.date >= :checkIn AND availability.date < :checkOut',
        {
          checkIn: searchDto.check_in_date,
          checkOut: searchDto.check_out_date,
        },
      );

      queryBuilder.andWhere('availability.available_units > 0');
      queryBuilder.andWhere('availability.status = :status', {
        status: 'Available',
      });

      if (searchDto.min_price) {
        queryBuilder.andWhere('availability.price_per_night >= :minPrice', {
          minPrice: searchDto.min_price,
        });
      }

      if (searchDto.max_price) {
        queryBuilder.andWhere('availability.price_per_night <= :maxPrice', {
          maxPrice: searchDto.max_price,
        });
      }
    }

    // Amenity filter
    if (searchDto.amenity_ids && searchDto.amenity_ids.length > 0) {
      queryBuilder.andWhere('amenities.id IN (:...amenityIds)', {
        amenityIds: searchDto.amenity_ids,
      });
    }

    // Optimized sorting
    if (searchDto.sort_by) {
      const order = searchDto.sort_order || 'ASC';
      switch (searchDto.sort_by) {
        case 'price':
          // Only sort by price if we have date filters (availability data)
          if (searchDto.check_in_date && searchDto.check_out_date) {
            queryBuilder.orderBy('MIN(availability.price_per_night)', order);
          } else {
            // Fallback to hotel name if no date filters
            queryBuilder.orderBy('hotel.name', order);
          }
          break;
        case 'rating':
          queryBuilder.orderBy('hotel.avg_rating', order);
          break;
        case 'name':
          queryBuilder.orderBy('hotel.name', order);
          break;
        case 'distance':
          if (searchDto.latitude && searchDto.longitude) {
            queryBuilder.orderBy(
              `
              (6371 * acos(cos(radians(${searchDto.latitude})) * cos(radians(hotel.latitude)) * 
              cos(radians(hotel.longitude) - radians(${searchDto.longitude})) + 
              sin(radians(${searchDto.latitude})) * sin(radians(hotel.latitude))))
            `,
              order,
            );
          }
          break;
        default:
          queryBuilder.orderBy('hotel.created_at', 'DESC');
      }
    } else {
      queryBuilder.orderBy('hotel.created_at', 'DESC');
    }

    // Group by to handle joins properly
    queryBuilder.groupBy('hotel.id');
    queryBuilder.addGroupBy('amenities.id');
    queryBuilder.addGroupBy('rooms.id');
    queryBuilder.addGroupBy('availability.id');

    // Pagination
    const page = searchDto.page || 1;
    const limit = Math.min(searchDto.limit || 10, 100); // Limit max results
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    const [hotels, total] = await queryBuilder.getManyAndCount();

    const executionTime = Date.now() - startTime;
    this.logger.log(
      `Hotel search completed in ${executionTime}ms. Found ${total} results.`,
    );

    this.sanitizeHotelsOwnerData(hotels);
    return {
      hotels,
      total,
      page,
      limit,
    };
  }

  async calculateAverageRating(hotelId: string): Promise<void> {
    try {
      const result = await this.hotelRepository
        .createQueryBuilder('hotel')
        .leftJoin('hotel.reviews', 'review')
        .select('AVG(review.rating)', 'avgRating')
        .addSelect('COUNT(review.id)', 'totalReviews')
        .where('hotel.id = :hotelId', { hotelId })
        .getRawOne();

      const avgRating = parseFloat(result.avgRating) || 0;
      const totalReviews = parseInt(result.totalReviews) || 0;

      await this.hotelRepository.update(hotelId, {
        avg_rating: Math.round(avgRating * 100) / 100, // Round to 2 decimal places
        total_reviews: totalReviews,
      });

      this.logger.log(
        `Updated hotel ${hotelId} rating: ${avgRating} (${totalReviews} reviews)`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to calculate average rating for hotel ${hotelId}`,
        error,
      );
    }
  }

  async findOneForPublic(id: string): Promise<Hotel> {
    try {
      const hotel = await this.hotelRepository.findOne({
        where: { id, is_active: true },
        relations: ['amenities', 'rooms', 'owner'],
      });

      if (!hotel) {
        throw new NotFoundException(`Hotel with ID ${id} not found`);
      }

      // Remove sensitive owner data for public access
      this.sanitizeHotelsOwnerData([hotel]);

      return hotel;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to find hotel for public: ${id}`, error);
      throw new BadRequestException('Failed to retrieve hotel details');
    }
  }

  // ==================== HOTEL REQUEST METHODS ====================

  /**
   * Create a hotel request
   */
  async createHotelRequest(
    createHotelRequestDto: CreateHotelRequestDto,
    userId: string,
  ): Promise<HotelRequest> {
    try {
      const hotelRequest = this.hotelRequestRepository.create({
        ...createHotelRequestDto,
        requested_by_user_id: userId,
        status: HotelRequestStatus.PENDING,
      });

      const savedRequest = await this.hotelRequestRepository.save(hotelRequest);
      
      this.logger.log(
        `Hotel request created: ${savedRequest.id} by user ${userId}`,
      );

      // Get the requesting user
      const requestingUser = await this.userService.findOne(userId);
      const requesterName = `${requestingUser.first_name} ${requestingUser.last_name}`.trim() || requestingUser.email;

      // Send notifications to all admins
      const admins = await this.userService.findAllAdmins();
      for (const admin of admins) {
        await this.notificationEventService.triggerHotelRequestNotification(
          admin.id,
          'New Hotel Request',
          `${requesterName} has submitted a new hotel request for "${createHotelRequestDto.name}"`,
          {
            request_id: savedRequest.id,
            hotel_name: createHotelRequestDto.name,
            requester_name: requesterName,
            requester_id: userId,
          },
        );
      }

      if (requestingUser) {
        await this.notificationEventService.triggerHotelRequestNotification(
          requestingUser.id,
          'Hotel Request Submitted',
          `Your hotel request for "${createHotelRequestDto.name}" has been submitted and is pending review.`,
          {
            request_id: savedRequest.id,
            hotel_name: createHotelRequestDto.name,
          },
        )
      }
      
      return savedRequest;
    } catch (error) {
      this.logger.error('Failed to create hotel request', error);
      throw error;
    }
  }

  /**
   * Get all hotel requests (admin only)
   */
  async getAllHotelRequests(
    status?: HotelRequestStatus,
  ): Promise<HotelRequest[]> {
    try {
      const queryBuilder = this.hotelRequestRepository
        .createQueryBuilder('request')
        .leftJoinAndSelect('request.requested_by', 'requester')
        .leftJoinAndSelect('request.reviewed_by', 'reviewer')
        .orderBy('request.created_at', 'DESC');

      if (status) {
        queryBuilder.where('request.status = :status', { status });
      }

      const requests = await queryBuilder.getMany();
      
      // Sanitize user data
      requests.forEach((request) => {
        if (request.requested_by) {
          delete (request.requested_by as any).password_hash;
          delete (request.requested_by as any).refresh_token;
          delete (request.requested_by as any).activation_token;
        }
        if (request.reviewed_by) {
          delete (request.reviewed_by as any).password_hash;
          delete (request.reviewed_by as any).refresh_token;
          delete (request.reviewed_by as any).activation_token;
        }
      });

      return requests;
    } catch (error) {
      this.logger.error('Failed to get hotel requests', error);
      throw error;
    }
  }

  /**
   * Get hotel requests by user
   */
  async getHotelRequestsByUser(userId: string): Promise<HotelRequest[]> {
    try {
      const requests = await this.hotelRequestRepository.find({
        where: { requested_by_user_id: userId },
        relations: ['reviewed_by'],
        order: { created_at: 'DESC' },
      });

      // Sanitize reviewer data
      requests.forEach((request) => {
        if (request.reviewed_by) {
          delete (request.reviewed_by as any).password_hash;
          delete (request.reviewed_by as any).refresh_token;
          delete (request.reviewed_by as any).activation_token;
        }
      });

      return requests;
    } catch (error) {
      this.logger.error('Failed to get user hotel requests', error);
      throw error;
    }
  }

  /**
   * Get a single hotel request by ID
   */
  async getHotelRequestById(requestId: string): Promise<HotelRequest> {
    try {
      const request = await this.hotelRequestRepository.findOne({
        where: { id: requestId },
        relations: ['requested_by', 'reviewed_by'],
      });

      if (!request) {
        throw new NotFoundException('Hotel request not found');
      }

      // Sanitize user data
      if (request.requested_by) {
        delete (request.requested_by as any).password_hash;
        delete (request.requested_by as any).refresh_token;
        delete (request.requested_by as any).activation_token;
      }
      if (request.reviewed_by) {
        delete (request.reviewed_by as any).password_hash;
        delete (request.reviewed_by as any).refresh_token;
        delete (request.reviewed_by as any).activation_token;
      }

      return request;
    } catch (error) {
      this.logger.error('Failed to get hotel request', error);
      throw error;
    }
  }

  /**
   * Review (approve or reject) a hotel request
   */
  async reviewHotelRequest(
    requestId: string,
    reviewDto: ReviewHotelRequestDto,
    adminId: string,
  ): Promise<HotelRequest> {
    try {
      const request = await this.hotelRequestRepository.findOne({
        where: { id: requestId },
      });

      if (!request) {
        throw new NotFoundException('Hotel request not found');
      }

      if (request.status !== HotelRequestStatus.PENDING) {
        throw new BadRequestException(
          'Hotel request has already been reviewed',
        );
      }

      const requestUser = await this.userRepository.findOne({
        where: { id: request.requested_by_user_id },
      });

      if (!requestUser) {
        throw new NotFoundException('Requesting user not found');
      }

      // If approved, create the hotel
      let createdHotel: Hotel | null = null;
      if (reviewDto.status === HotelRequestStatus.APPROVED) {
        const createHotelDto: CreateHotelDto = {
          name: request.name,
          description: request.description,
          address: request.address,
          city: request.city,
          state: request.state,
          zip_code: request.zip_code,
          country: request.country,
          phone_number: request.phone_number,
        };

        
        createdHotel = await this.create(createHotelDto, requestUser.id);
        request.created_hotel_id = createdHotel.id;
        await this.userService.assignRole(requestUser.id, 'HotelOwner');

        // Send approval notification to the requesting user
        await this.notificationEventService.triggerHotelNotification(
          requestUser.id,
          'HOTEL_APPROVED',
          'Hotel Request Approved',
          `Congratulations! Your hotel request for "${request.name}" has been approved and your hotel is now created.`,
          {
            hotel_id: createdHotel.id,
            request_id: requestId,
            hotel_name: request.name,
          },
        );
      } else if (reviewDto.status === HotelRequestStatus.REJECTED) {
        // Send rejection notification to the requesting user
        const rejectionMessage = reviewDto.admin_notes 
          ? `Your hotel request for "${request.name}" has been rejected. Reason: ${reviewDto.admin_notes}`
          : `Your hotel request for "${request.name}" has been rejected.`;
        
        await this.notificationEventService.triggerHotelNotification(
          requestUser.id,
          'HOTEL_REJECTED',
          'Hotel Request Rejected',
          rejectionMessage,
          {
            request_id: requestId,
            hotel_name: request.name,
            admin_notes: reviewDto.admin_notes,
          },
        );
      }

      // Update the request
      request.status = reviewDto.status;
      request.reviewed_by_user_id = adminId;
      if (reviewDto.admin_notes) {
        request.admin_notes = reviewDto.admin_notes;
      }

      const updatedRequest = await this.hotelRequestRepository.save(request);

      this.logger.log(
        `Hotel request ${requestId} ${reviewDto.status} by admin ${adminId}`,
      );

      return updatedRequest;
    } catch (error) {
      this.logger.error('Failed to review hotel request', error);
      throw error;
    }
  }

  // Health check method for monitoring
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      const hotelCount = await this.hotelRepository.count();
      const activeHotelCount = await this.hotelRepository.count({
        where: { is_active: true },
      });

      return {
        status: 'healthy',
        details: {
          totalHotels: hotelCount,
          activeHotels: activeHotelCount,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('Hotel service health check failed', error);
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }
}
