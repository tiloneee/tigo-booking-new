import { Repository, DataSource } from 'typeorm';
import { HotelReview } from '../entities/hotel-review.entity';
import { Hotel } from '../entities/hotel.entity';
import { HotelBooking } from '../entities/hotel-booking.entity';
import { User } from '../../user/entities/user.entity';
import { CreateReviewDto } from '../dto/review/create-review.dto';
import { UpdateReviewDto } from '../dto/review/update-review.dto';
export declare class ReviewService {
    private reviewRepository;
    private hotelRepository;
    private bookingRepository;
    private userRepository;
    private dataSource;
    private readonly logger;
    private readonly SENSITIVE_REVIEW_FIELDS;
    private readonly SENSITIVE_USER_FIELDS;
    constructor(reviewRepository: Repository<HotelReview>, hotelRepository: Repository<Hotel>, bookingRepository: Repository<HotelBooking>, userRepository: Repository<User>, dataSource: DataSource);
    private sanitizeUserObject;
    private sanitizeReviewObject;
    private sanitizeReviewData;
    private sanitizeReviewsOwnerData;
    create(createReviewDto: CreateReviewDto, userId: string): Promise<HotelReview>;
    findByHotel(hotelId: string, isApprovedOnly?: boolean): Promise<HotelReview[]>;
    findByUser(userId: string): Promise<HotelReview[]>;
    findOne(id: string): Promise<HotelReview>;
    update(id: string, updateReviewDto: UpdateReviewDto, userId: string): Promise<HotelReview>;
    delete(id: string, userId: string, userRoles: string[]): Promise<void>;
    moderateReview(id: string, isApproved: boolean, moderationNotes?: string): Promise<HotelReview>;
    voteHelpful(reviewId: string, userId: string, isHelpful: boolean): Promise<HotelReview>;
    getReviewStatistics(hotelId: string): Promise<{
        totalReviews: number;
        averageRating: number;
        ratingDistribution: {
            [rating: number]: number;
        };
        verifiedStaysPercentage: number;
    }>;
    private updateHotelRating;
}
