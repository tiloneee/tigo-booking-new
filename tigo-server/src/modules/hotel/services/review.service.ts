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

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

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
  ) {}

  async create(
    createReviewDto: CreateReviewDto,
    userId: string,
  ): Promise<HotelReview> {
    return this.dataSource.transaction(async (manager) => {
      // Check if hotel exists
      const hotel = await manager.findOne(Hotel, {
        where: { id: createReviewDto.hotel_id, is_active: true },
      });

      if (!hotel) {
        throw new NotFoundException('Hotel not found');
      }

      // Check if user already reviewed this hotel
      const existingReview = await manager.findOne(HotelReview, {
        where: { hotel_id: createReviewDto.hotel_id, user_id: userId },
      });

      if (existingReview) {
        throw new ConflictException('You have already reviewed this hotel');
      }

      // Stay verification logic
      let isVerifiedStay = false;
      let stayDate: Date | null = null;
      let bookingId: string | null = createReviewDto.booking_id || null;

      if (createReviewDto.booking_id) {
        // Verify the booking belongs to the user and hotel
        const booking = await manager.findOne(HotelBooking, {
          where: {
            id: createReviewDto.booking_id,
            user_id: userId,
            hotel_id: createReviewDto.hotel_id,
            status: 'Completed', // Only allow reviews for completed stays
          },
        });

        if (booking) {
          isVerifiedStay = true;
          stayDate = new Date(booking.check_out_date);
        } else {
          throw new BadRequestException(
            'Invalid booking for review verification',
          );
        }
      } else {
        // Check if user has any completed booking for this hotel
        const completedBooking = await manager.findOne(HotelBooking, {
          where: {
            user_id: userId,
            hotel_id: createReviewDto.hotel_id,
            status: 'Completed',
          },
          order: { check_out_date: 'DESC' },
        });

        if (completedBooking) {
          isVerifiedStay = true;
          stayDate = new Date(completedBooking.check_out_date);
          bookingId = completedBooking.id;
        }
      }

      // Create review
      const reviewData: Partial<HotelReview> = {
        hotel_id: createReviewDto.hotel_id,
        user_id: userId,
        booking_id: bookingId,
        rating: createReviewDto.rating,
        comment: createReviewDto.comment,
        title: createReviewDto.title,
        cleanliness_rating: createReviewDto.cleanliness_rating,
        location_rating: createReviewDto.location_rating,
        service_rating: createReviewDto.service_rating,
        value_rating: createReviewDto.value_rating,
        is_verified_stay: isVerifiedStay,
        stay_date: stayDate || undefined,
        is_approved: true, // Auto-approve for now, can be changed to false for moderation
      };

      const review = manager.create(HotelReview, reviewData);
      const savedReview = await manager.save(review);

      // Update hotel average rating
      await this.updateHotelRating(createReviewDto.hotel_id, manager);

      this.logger.log(
        `Review created: ${savedReview.id} for hotel ${createReviewDto.hotel_id}`,
      );

      const reviewWithRelations = await manager.findOne(HotelReview, {
        where: { id: savedReview.id },
        relations: ['hotel', 'user', 'booking'],
      });

      if (!reviewWithRelations) {
        throw new NotFoundException('Failed to retrieve created review');
      }

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

    return this.reviewRepository.find({
      where: whereCondition,
      relations: ['user'],
      order: { created_at: 'DESC' },
      select: {
        user: {
          id: true,
          first_name: true,
          last_name: true,
        },
      },
    });
  }

  async findByUser(userId: string): Promise<HotelReview[]> {
    return this.reviewRepository.find({
      where: { user_id: userId },
      relations: ['hotel'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<HotelReview> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['hotel', 'user', 'booking'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

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
      if (updateReviewDto.rating) {
        await this.updateHotelRating(review.hotel_id, manager);
      }

      const updatedReview = await manager.findOne(HotelReview, {
        where: { id },
        relations: ['hotel', 'user', 'booking'],
      });

      if (!updatedReview) {
        throw new NotFoundException('Failed to retrieve updated review');
      }

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
    return this.findOne(id);
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

    return this.findOne(reviewId);
  }

  async getReviewStatistics(hotelId: string): Promise<{
    totalReviews: number;
    averageRating: number;
    ratingDistribution: { [rating: number]: number };
    verifiedStaysPercentage: number;
  }> {
    const reviews = await this.reviewRepository.find({
      where: { hotel_id: hotelId, is_approved: true },
    });

    const totalReviews = reviews.length;

    if (totalReviews === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        verifiedStaysPercentage: 0,
      };
    }

    const averageRating =
      reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let verifiedStaysCount = 0;

    reviews.forEach((review) => {
      ratingDistribution[review.rating]++;
      if (review.is_verified_stay) {
        verifiedStaysCount++;
      }
    });

    const verifiedStaysPercentage = (verifiedStaysCount / totalReviews) * 100;

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 100) / 100,
      ratingDistribution,
      verifiedStaysPercentage: Math.round(verifiedStaysPercentage * 100) / 100,
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
