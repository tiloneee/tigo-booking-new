import { ReviewService } from '../services/review.service';
import { CreateReviewDto } from '../dto/review/create-review.dto';
import { UpdateReviewDto } from '../dto/review/update-review.dto';
export declare class ReviewController {
    private readonly reviewService;
    constructor(reviewService: ReviewService);
    create(createReviewDto: CreateReviewDto, req: any): Promise<import("../entities/hotel-review.entity").HotelReview>;
    getMyReviews(req: any): Promise<import("../entities/hotel-review.entity").HotelReview[]>;
    findOne(id: string): Promise<import("../entities/hotel-review.entity").HotelReview>;
    update(id: string, updateReviewDto: UpdateReviewDto, req: any): Promise<import("../entities/hotel-review.entity").HotelReview>;
    remove(id: string, req: any): Promise<void>;
    voteHelpful(id: string, isHelpful: boolean, req: any): Promise<import("../entities/hotel-review.entity").HotelReview>;
    moderateReview(id: string, isApproved: boolean, moderationNotes?: string): Promise<import("../entities/hotel-review.entity").HotelReview>;
}
export declare class HotelReviewController {
    private readonly reviewService;
    constructor(reviewService: ReviewService);
    getHotelReviews(hotelId: string, includePending?: string): Promise<import("../entities/hotel-review.entity").HotelReview[]>;
    createHotelReview(hotelId: string, createReviewDto: CreateReviewDto, req: any): Promise<import("../entities/hotel-review.entity").HotelReview>;
    getReviewStatistics(hotelId: string): Promise<{
        totalReviews: number;
        averageRating: number;
        ratingDistribution: {
            [rating: number]: number;
        };
        verifiedStaysPercentage: number;
    }>;
}
