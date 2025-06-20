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
var ReviewService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const hotel_review_entity_1 = require("../entities/hotel-review.entity");
const hotel_entity_1 = require("../entities/hotel.entity");
const hotel_booking_entity_1 = require("../entities/hotel-booking.entity");
const user_entity_1 = require("../../user/entities/user.entity");
let ReviewService = ReviewService_1 = class ReviewService {
    reviewRepository;
    hotelRepository;
    bookingRepository;
    userRepository;
    dataSource;
    logger = new common_1.Logger(ReviewService_1.name);
    SENSITIVE_REVIEW_FIELDS = [
        'is_approved',
        'moderation_notes',
        'is_verified_stay',
        'booking',
    ];
    SENSITIVE_USER_FIELDS = [
        'password_hash',
        'refresh_token',
        'activation_token',
        'roles',
        'is_active',
        'created_at',
        'updated_at',
    ];
    constructor(reviewRepository, hotelRepository, bookingRepository, userRepository, dataSource) {
        this.reviewRepository = reviewRepository;
        this.hotelRepository = hotelRepository;
        this.bookingRepository = bookingRepository;
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
    sanitizeReviewObject(review, fieldsToRemove) {
        if (!review)
            return;
        fieldsToRemove.forEach(field => {
            delete review[field];
        });
    }
    sanitizeReviewData(review) {
        this.sanitizeReviewObject(review, this.SENSITIVE_REVIEW_FIELDS);
        this.sanitizeUserObject(review.user, this.SENSITIVE_USER_FIELDS);
        this.sanitizeUserObject(review.hotel.owner, this.SENSITIVE_USER_FIELDS);
    }
    sanitizeReviewsOwnerData(reviews) {
        reviews.forEach((review) => this.sanitizeReviewData(review));
    }
    async create(createReviewDto, userId) {
        return this.dataSource.transaction(async (manager) => {
            if (!createReviewDto.hotel_id) {
                throw new common_1.BadRequestException('Hotel ID is required');
            }
            const hotel = await manager.findOne(hotel_entity_1.Hotel, {
                where: { id: createReviewDto.hotel_id, is_active: true },
            });
            if (!hotel) {
                throw new common_1.NotFoundException('Hotel not found');
            }
            const existingReview = await manager.findOne(hotel_review_entity_1.HotelReview, {
                where: { hotel_id: createReviewDto.hotel_id, user_id: userId },
            });
            if (existingReview) {
                throw new common_1.ConflictException('You have already reviewed this hotel');
            }
            let isVerifiedStay = false;
            let stayDate = null;
            let bookingId = createReviewDto.booking_id || null;
            if (createReviewDto.booking_id) {
                const booking = await manager.findOne(hotel_booking_entity_1.HotelBooking, {
                    where: {
                        id: createReviewDto.booking_id,
                        user_id: userId,
                        hotel_id: createReviewDto.hotel_id,
                        status: 'Completed',
                    },
                });
                if (booking) {
                    isVerifiedStay = true;
                    stayDate = new Date(booking.check_out_date);
                }
                else {
                    throw new common_1.BadRequestException('Invalid booking for review verification');
                }
            }
            else {
                const completedBooking = await manager.findOne(hotel_booking_entity_1.HotelBooking, {
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
            const reviewData = {
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
                is_approved: true,
            };
            const review = manager.create(hotel_review_entity_1.HotelReview, reviewData);
            const savedReview = await manager.save(review);
            await this.updateHotelRating(createReviewDto.hotel_id, manager);
            this.logger.log(`Review created: ${savedReview.id} for hotel ${createReviewDto.hotel_id}`);
            const reviewWithRelations = await manager.findOne(hotel_review_entity_1.HotelReview, {
                where: { id: savedReview.id },
                relations: ['hotel', 'user', 'booking'],
            });
            if (!reviewWithRelations) {
                throw new common_1.NotFoundException('Failed to retrieve created review');
            }
            this.sanitizeReviewData(reviewWithRelations);
            return reviewWithRelations;
        });
    }
    async findByHotel(hotelId, isApprovedOnly = true) {
        const whereCondition = { hotel_id: hotelId };
        if (isApprovedOnly) {
            whereCondition.is_approved = true;
        }
        const reviews = await this.reviewRepository.find({
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
        return reviews;
    }
    async findByUser(userId) {
        const reviews = await this.reviewRepository.find({
            where: { user_id: userId },
            relations: ['hotel'],
            order: { created_at: 'DESC' },
        });
        this.sanitizeReviewsOwnerData(reviews);
        return reviews;
    }
    async findOne(id) {
        const review = await this.reviewRepository.findOne({
            where: { id },
            relations: ['hotel', 'user', 'booking'],
        });
        if (!review) {
            throw new common_1.NotFoundException('Review not found');
        }
        this.sanitizeReviewData(review);
        return review;
    }
    async update(id, updateReviewDto, userId) {
        const review = await this.findOne(id);
        if (review.user_id !== userId) {
            throw new common_1.ForbiddenException('You can only update your own reviews');
        }
        return this.dataSource.transaction(async (manager) => {
            await manager.update(hotel_review_entity_1.HotelReview, id, updateReviewDto);
            if (updateReviewDto.rating) {
                await this.updateHotelRating(review.hotel_id, manager);
            }
            const updatedReview = await manager.findOne(hotel_review_entity_1.HotelReview, {
                where: { id },
                relations: ['hotel', 'user', 'booking'],
            });
            if (!updatedReview) {
                throw new common_1.NotFoundException('Failed to retrieve updated review');
            }
            this.sanitizeReviewData(updatedReview);
            return updatedReview;
        });
    }
    async delete(id, userId, userRoles) {
        const review = await this.findOne(id);
        const isOwner = review.user_id === userId;
        const isAdmin = userRoles.includes('Admin');
        if (!isOwner && !isAdmin) {
            throw new common_1.ForbiddenException('You can only delete your own reviews');
        }
        await this.dataSource.transaction(async (manager) => {
            await manager.delete(hotel_review_entity_1.HotelReview, id);
            await this.updateHotelRating(review.hotel_id, manager);
        });
        this.logger.log(`Review deleted: ${id}`);
    }
    async moderateReview(id, isApproved, moderationNotes) {
        const review = await this.findOne(id);
        await this.reviewRepository.update(id, {
            is_approved: isApproved,
            moderation_notes: moderationNotes,
        });
        this.logger.log(`Review ${isApproved ? 'approved' : 'rejected'}: ${id}`);
        const updatedReview = await this.findOne(id);
        this.sanitizeReviewData(updatedReview);
        return updatedReview;
    }
    async voteHelpful(reviewId, userId, isHelpful) {
        const review = await this.findOne(reviewId);
        const increment = isHelpful ? 1 : 0;
        await this.reviewRepository.update(reviewId, {
            helpful_votes: review.helpful_votes + increment,
            total_votes: review.total_votes + 1,
        });
        const updatedReview = await this.findOne(reviewId);
        this.sanitizeReviewData(updatedReview);
        return updatedReview;
    }
    async getReviewStatistics(hotelId) {
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
        const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
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
    async updateHotelRating(hotelId, manager) {
        const transactionManager = manager || this.dataSource.manager;
        const result = await transactionManager
            .createQueryBuilder()
            .select('AVG(review.rating)', 'avgRating')
            .addSelect('COUNT(review.id)', 'totalReviews')
            .from(hotel_review_entity_1.HotelReview, 'review')
            .where('review.hotel_id = :hotelId', { hotelId })
            .andWhere('review.is_approved = :isApproved', { isApproved: true })
            .getRawOne();
        const avgRating = parseFloat(result.avgRating) || 0;
        const totalReviews = parseInt(result.totalReviews) || 0;
        await transactionManager.update(hotel_entity_1.Hotel, hotelId, {
            avg_rating: Math.round(avgRating * 100) / 100,
            total_reviews: totalReviews,
        });
    }
};
exports.ReviewService = ReviewService;
exports.ReviewService = ReviewService = ReviewService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(hotel_review_entity_1.HotelReview)),
    __param(1, (0, typeorm_1.InjectRepository)(hotel_entity_1.Hotel)),
    __param(2, (0, typeorm_1.InjectRepository)(hotel_booking_entity_1.HotelBooking)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], ReviewService);
//# sourceMappingURL=review.service.js.map