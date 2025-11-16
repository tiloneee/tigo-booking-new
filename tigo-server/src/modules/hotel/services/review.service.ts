import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { HotelReview } from '../entities/hotel-review.entity';
import { Hotel } from '../entities/hotel.entity';
import { HotelBooking } from '../entities/hotel-booking.entity';
import { User } from '../../user/entities/user.entity';
import { CreateReviewDto } from '../dto/review/create-review.dto';
import { UpdateReviewDto } from '../dto/review/update-review.dto';
import { HotelDataSyncService } from '../../search/services/data-sync/hotel.data-sync.service';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  private readonly SENSITIVE_REVIEW_FIELDS = [
    'is_approved',
    'moderation_notes',
    'is_verified_stay',
    'booking',
  ] as const;

  private readonly SENSITIVE_USER_FIELDS = [
    'password_hash',
    'refresh_token',
    'activation_token',
    'roles',
    'is_active',
    'created_at',
    'updated_at',
  ] as const;

  constructor(
    @InjectRepository(HotelReview)
    private reviewRepository: Repository<HotelReview>,

    @InjectRepository(Hotel)
    private hotelRepository: Repository<Hotel>,

    @InjectRepository(HotelBooking)
    private bookingRepository: Repository<HotelBooking>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private dataSource: DataSource,

    private hotelDataSyncService: HotelDataSyncService,
  ) {}

  private sanitizeUserObject(
    user: any,
    fieldsToRemove: readonly string[],
  ): void {
    if (!user) return;

    fieldsToRemove.forEach((field) => {
      delete user[field];
    });
  }

  private sanitizeReviewObject(
    review: any,
    fieldsToRemove: readonly string[],
  ): void {
    if (!review) return;

    fieldsToRemove.forEach((field) => {
      delete review[field];
    });
  }

  private sanitizeReviewData(review: HotelReview): void {
    this.sanitizeReviewObject(review, this.SENSITIVE_REVIEW_FIELDS);
    this.sanitizeUserObject(review.user, this.SENSITIVE_USER_FIELDS);
    this.sanitizeUserObject(review.hotel.owner, this.SENSITIVE_USER_FIELDS);
  }

  private sanitizeReviewsOwnerData(reviews: HotelReview[]): void {
    reviews.forEach((review) => this.sanitizeReviewData(review));
  }

  async create(
    createReviewDto: CreateReviewDto,
    userId: string,
  ): Promise<HotelReview> {
    return this.dataSource.transaction(async (manager) => {
      // Validate booking_id is present (now required)
      if (!createReviewDto.booking_id) {
        throw new BadRequestException('Booking ID is required for creating a review');
      }

      // Check if this booking has already been reviewed
      const existingReview = await manager.findOne(HotelReview, {
        where: { booking_id: createReviewDto.booking_id },
      });

      if (existingReview) {
        throw new ConflictException('This booking has already been reviewed');
      }

      // Verify the booking exists and belongs to the user
      const booking = await manager.findOne(HotelBooking, {
        where: {
          id: createReviewDto.booking_id,
          user_id: userId,
        },
        relations: ['hotel'],
      });

      if (!booking) {
        throw new NotFoundException('Booking not found or does not belong to you');
      }

      // Check if booking is completed or checked out
      if (!['Completed', 'CheckedOut', 'Confirmed'].includes(booking.status)) {
        throw new BadRequestException(
          'Only completed or checked-out bookings can be reviewed',
        );
      }

      // Check if hotel exists and is active
      const hotel = await manager.findOne(Hotel, {
        where: { id: booking.hotel_id, is_active: true },
      });

      if (!hotel) {
        throw new NotFoundException('Hotel not found or is no longer active');
      }

      // Set verified stay data from booking
      const isVerifiedStay = true;
      const stayDate = new Date(booking.check_out_date);
      const hotelId = booking.hotel_id;

      // Create review
      const reviewData: Partial<HotelReview> = {
        hotel_id: hotelId,
        user_id: userId,
        booking_id: createReviewDto.booking_id,
        rating: createReviewDto.rating,
        comment: createReviewDto.comment,
        title: createReviewDto.title,
        cleanliness_rating: createReviewDto.cleanliness_rating,
        location_rating: createReviewDto.location_rating,
        service_rating: createReviewDto.service_rating,
        value_rating: createReviewDto.value_rating,
        is_verified_stay: isVerifiedStay,
        stay_date: stayDate,
        is_approved: true, // Auto-approve for now, can be changed to false for moderation
      };

      const review = manager.create(HotelReview, reviewData);
      const savedReview = await manager.save(review);

      // Update hotel average rating
      await this.updateHotelRating(hotelId, manager);

      this.logger.log(
        `Review created: ${savedReview.id} for booking ${createReviewDto.booking_id}`,
      );

      const reviewWithRelations = await manager.findOne(HotelReview, {
        where: { id: savedReview.id },
        relations: ['hotel', 'user', 'booking'],
      });

      if (!reviewWithRelations) {
        throw new NotFoundException('Failed to retrieve created review');
      }

      this.sanitizeReviewData(reviewWithRelations);
      this.hotelDataSyncService.onReviewChanged(reviewWithRelations);
      return reviewWithRelations;
    });
  }

  async findByHotel(
    hotelId: string,
    isApprovedOnly: boolean = true,
  ): Promise<HotelReview[]> {
    const whereCondition: any = { hotel_id: hotelId };

    if (isApprovedOnly) {
      whereCondition.is_approved = true;
    }

    const reviews = await this.reviewRepository.find({
      where: whereCondition,
      relations: ['user', 'booking', 'booking.room'],
      order: { created_at: 'DESC' },
      select: {
        user: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
        },
        booking: {
          id: true,
          check_in_date: true,
          check_out_date: true,
          room: {
            id: true,
            room_type: true,
          },
        },
      },
    });
    return reviews;
  }

  async findByUser(userId: string): Promise<HotelReview[]> {
    const reviews = await this.reviewRepository.find({
      where: { user_id: userId },
      relations: ['hotel'],
      order: { created_at: 'DESC' },
    });
    this.sanitizeReviewsOwnerData(reviews);
    return reviews;
  }

  async findOne(id: string): Promise<HotelReview> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['hotel', 'user', 'booking'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    this.sanitizeReviewData(review);
    return review;
  }

  async update(
    id: string,
    updateReviewDto: UpdateReviewDto,
    userId: string,
  ): Promise<HotelReview> {
    const review = await this.findOne(id);

    // Check if user owns this review
    if (review.user_id !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    return this.dataSource.transaction(async (manager) => {
      await manager.update(HotelReview, id, updateReviewDto);

      // Update hotel average rating if rating changed
      if (updateReviewDto.rating !== undefined) {
        await this.updateHotelRating(review.hotel_id, manager);
      }

      const updatedReview = await manager.findOne(HotelReview, {
        where: { id },
        relations: ['hotel', 'user', 'booking'],
      });

      if (!updatedReview) {
        throw new NotFoundException('Failed to retrieve updated review');
      }

      this.sanitizeReviewData(updatedReview);
      this.hotelDataSyncService.onReviewChanged(updatedReview);
      return updatedReview;
    });
  }

  async delete(id: string, userId: string, userRoles: string[]): Promise<void> {
    const review = await this.findOne(id);

    // Check permissions - user can delete own review, admin can delete any
    const isOwner = review.user_id === userId;
    const isAdmin = userRoles.includes('Admin');

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(HotelReview, id);

      // Update hotel average rating
      await this.updateHotelRating(review.hotel_id, manager);
    });

    this.logger.log(`Review deleted: ${id}`);
    this.hotelDataSyncService.onReviewChanged(review);
  }

  async moderateReview(
    id: string,
    isApproved: boolean,
    moderationNotes?: string,
  ): Promise<HotelReview> {
    const review = await this.findOne(id);

    await this.reviewRepository.update(id, {
      is_approved: isApproved,
      moderation_notes: moderationNotes,
    });

    this.logger.log(`Review ${isApproved ? 'approved' : 'rejected'}: ${id}`);
    const updatedReview = await this.findOne(id);
    this.sanitizeReviewData(updatedReview);
    this.hotelDataSyncService.onReviewChanged(updatedReview);
    return updatedReview;
  }

  async voteHelpful(
    reviewId: string,
    userId: string,
    isHelpful: boolean,
  ): Promise<HotelReview> {
    // This is a simplified implementation - in production you'd want to track individual votes
    const review = await this.findOne(reviewId);

    const increment = isHelpful ? 1 : 0;
    await this.reviewRepository.update(reviewId, {
      helpful_votes: review.helpful_votes + increment,
      total_votes: review.total_votes + 1,
    });

    const updatedReview = await this.findOne(reviewId);
    this.sanitizeReviewData(updatedReview);
    this.hotelDataSyncService.onReviewChanged(updatedReview);
    return updatedReview;
  }

  async getReviewStatistics(hotelId: string): Promise<{
    total_reviews: number;
    average_rating: number;
    rating_distribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
    average_cleanliness: number | null;
    average_location: number | null;
    average_service: number | null;
    average_value: number | null;
    verified_stays_count: number;
  }> {
    const reviews = await this.reviewRepository.find({
      where: { hotel_id: hotelId, is_approved: true },
    });

    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      return {
        total_reviews: 0,
        average_rating: 0,
        rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        average_cleanliness: null,
        average_location: null,
        average_service: null,
        average_value: null,
        verified_stays_count: 0,
      };
    }

    const averageRating =
      reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let verifiedStaysCount = 0;
    let cleanlinessSum = 0;
    let cleanlinessCount = 0;
    let locationSum = 0;
    let locationCount = 0;
    let serviceSum = 0;
    let serviceCount = 0;
    let valueSum = 0;
    let valueCount = 0;

    reviews.forEach((review) => {
      ratingDistribution[review.rating]++;
      if (review.is_verified_stay) {
        verifiedStaysCount++;
      }
      
      // Calculate category averages
      if (review.cleanliness_rating) {
        cleanlinessSum += review.cleanliness_rating;
        cleanlinessCount++;
      }
      if (review.location_rating) {
        locationSum += review.location_rating;
        locationCount++;
      }
      if (review.service_rating) {
        serviceSum += review.service_rating;
        serviceCount++;
      }
      if (review.value_rating) {
        valueSum += review.value_rating;
        valueCount++;
      }
    });

    return {
      total_reviews: totalReviews,
      average_rating: Math.round(averageRating * 100) / 100,
      rating_distribution: ratingDistribution,
      average_cleanliness: cleanlinessCount > 0 ? Math.round((cleanlinessSum / cleanlinessCount) * 100) / 100 : null,
      average_location: locationCount > 0 ? Math.round((locationSum / locationCount) * 100) / 100 : null,
      average_service: serviceCount > 0 ? Math.round((serviceSum / serviceCount) * 100) / 100 : null,
      average_value: valueCount > 0 ? Math.round((valueSum / valueCount) * 100) / 100 : null,
      verified_stays_count: verifiedStaysCount,
    };
  }

  private async updateHotelRating(
    hotelId: string,
    manager?: any,
  ): Promise<void> {
    const transactionManager = manager || this.dataSource.manager;

    const result = await transactionManager
      .createQueryBuilder()
      .select('AVG(review.rating)', 'avgRating')
      .addSelect('COUNT(review.id)', 'totalReviews')
      .from(HotelReview, 'review')
      .where('review.hotel_id = :hotelId', { hotelId })
      .andWhere('review.is_approved = :isApproved', { isApproved: true })
      .getRawOne();

    const avgRating = parseFloat(result.avgRating) || 0;
    const totalReviews = parseInt(result.totalReviews) || 0;

    await transactionManager.update(Hotel, hotelId, {
      avg_rating: Math.round(avgRating * 100) / 100,
      total_reviews: totalReviews,
    });
  }
}
