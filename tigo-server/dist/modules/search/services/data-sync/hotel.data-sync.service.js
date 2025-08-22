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
var HotelDataSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HotelDataSyncService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const hotel_search_service_1 = require("../hotel-search.service");
const hotel_entity_1 = require("../../../hotel/entities/hotel.entity");
const room_entity_1 = require("../../../hotel/entities/room.entity");
const hotel_review_entity_1 = require("../../../hotel/entities/hotel-review.entity");
const hotel_booking_entity_1 = require("../../../hotel/entities/hotel-booking.entity");
let HotelDataSyncService = HotelDataSyncService_1 = class HotelDataSyncService {
    hotelSearchService;
    hotelRepository;
    roomRepository;
    reviewRepository;
    bookingRepository;
    logger = new common_1.Logger(HotelDataSyncService_1.name);
    constructor(hotelSearchService, hotelRepository, roomRepository, reviewRepository, bookingRepository) {
        this.hotelSearchService = hotelSearchService;
        this.hotelRepository = hotelRepository;
        this.roomRepository = roomRepository;
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
    }
    async onModuleInit() {
        this.logger.log('DataSyncService initialized');
    }
    async syncHotel(hotelId) {
        try {
            const hotel = await this.hotelRepository.findOne({
                where: { id: hotelId },
                relations: ['amenities', 'owner'],
            });
            if (!hotel) {
                this.logger.warn(`Hotel ${hotelId} not found for sync`);
                return;
            }
            await this.hotelSearchService.indexHotel(hotel);
            this.logger.debug(`Hotel ${hotelId} synced successfully`);
        }
        catch (error) {
            this.logger.error(`Failed to sync hotel ${hotelId}`, error);
            throw error;
        }
    }
    async removeHotelFromIndex(hotelId) {
        try {
            await this.hotelSearchService.removeHotel(hotelId);
            this.logger.debug(`Hotel ${hotelId} removed from index`);
        }
        catch (error) {
            this.logger.error(`Failed to remove hotel ${hotelId} from index`, error);
            throw error;
        }
    }
    async updateHotelRating(hotelId) {
        try {
            const hotel = await this.hotelRepository.findOne({
                where: { id: hotelId },
            });
            if (!hotel) {
                this.logger.warn(`Hotel ${hotelId} not found for rating update`);
                return;
            }
            const reviews = await this.reviewRepository.find({
                where: { hotel_id: hotelId, is_approved: true },
            });
            let avgRating = 0;
            if (reviews.length > 0) {
                const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
                avgRating = totalRating / reviews.length;
            }
            const ratingDistribution = {
                '1': reviews.filter((r) => r.rating === 1).length,
                '2': reviews.filter((r) => r.rating === 2).length,
                '3': reviews.filter((r) => r.rating === 3).length,
                '4': reviews.filter((r) => r.rating === 4).length,
                '5': reviews.filter((r) => r.rating === 5).length,
            };
            await this.hotelSearchService.updateHotel(hotelId, {
                ratings: {
                    average: avgRating,
                    count: reviews.length,
                    distribution: ratingDistribution,
                },
            });
            this.logger.debug(`Hotel ${hotelId} rating updated in index`);
        }
        catch (error) {
            this.logger.error(`Failed to update hotel ${hotelId} rating`, error);
            throw error;
        }
    }
    async updateHotelPricing(hotelId) {
        try {
            const rooms = await this.roomRepository.find({
                where: { hotel_id: hotelId, is_active: true },
                relations: ['availability'],
            });
            let min_price = Number.MAX_VALUE;
            let max_price = 0;
            rooms.forEach((room) => {
                room.availability?.forEach((avail) => {
                    if (avail.price_per_night < min_price) {
                        min_price = avail.price_per_night;
                    }
                    if (avail.price_per_night > max_price) {
                        max_price = avail.price_per_night;
                    }
                });
            });
            if (min_price === Number.MAX_VALUE) {
                min_price = 0;
            }
            await this.hotelSearchService.updateHotel(hotelId, {
                pricing: {
                    min_price,
                    max_price,
                    currency: 'USD',
                },
            });
            this.logger.debug(`Hotel ${hotelId} pricing updated in index`);
        }
        catch (error) {
            this.logger.error(`Failed to update hotel ${hotelId} pricing`, error);
            throw error;
        }
    }
    async bulkSyncAllHotels() {
        try {
            const hotels = await this.hotelRepository.find({
                relations: ['amenities', 'owner'],
            });
            this.logger.log(`Starting bulk sync of ${hotels.length} hotels`);
            const batchSize = 100;
            for (let i = 0; i < hotels.length; i += batchSize) {
                const batch = hotels.slice(i, i + batchSize);
                await this.hotelSearchService.bulkIndexHotels(batch);
                this.logger.log(`Synced batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(hotels.length / batchSize)}`);
            }
            this.logger.log('Bulk sync completed successfully');
        }
        catch (error) {
            this.logger.error('Bulk sync failed', error);
            throw error;
        }
    }
    async syncUpdatedHotels(since) {
        try {
            const hotels = await this.hotelRepository.find({
                where: {
                    updated_at: { $gte: since },
                },
                relations: ['amenities', 'owner'],
            });
            this.logger.log(`Syncing ${hotels.length} hotels updated since ${since}`);
            for (const hotel of hotels) {
                await this.syncHotel(hotel.id);
            }
            this.logger.log('Incremental sync completed');
        }
        catch (error) {
            this.logger.error('Incremental sync failed', error);
            throw error;
        }
    }
    async onHotelCreated(hotel) {
        try {
            await this.syncHotel(hotel.id);
            this.logger.debug(`Hotel created event processed: ${hotel.id}`);
        }
        catch (error) {
            this.logger.error(`Failed to process hotel created event: ${hotel.id}`, error);
        }
    }
    async onHotelUpdated(hotel) {
        try {
            await this.syncHotel(hotel.id);
            this.logger.debug(`Hotel updated event processed: ${hotel.id}`);
        }
        catch (error) {
            this.logger.error(`Failed to process hotel updated event: ${hotel.id}`, error);
        }
    }
    async onHotelDeleted(hotelId) {
        try {
            await this.removeHotelFromIndex(hotelId);
            this.logger.debug(`Hotel deleted event processed: ${hotelId}`);
        }
        catch (error) {
            this.logger.error(`Failed to process hotel deleted event: ${hotelId}`, error);
        }
    }
    async onRoomAvailabilityChanged(roomId) {
        try {
            const room = await this.roomRepository.findOne({
                where: { id: roomId },
            });
            if (room) {
                await this.updateHotelPricing(room.hotel_id);
                this.logger.debug(`Room availability change processed: ${roomId}`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to process room availability change: ${roomId}`, error);
        }
    }
    async onBookingStatusChanged(booking) {
        try {
            await this.updateHotelPricing(booking.hotel_id);
            this.logger.debug(`Booking status change processed: ${booking.id}`);
        }
        catch (error) {
            this.logger.error(`Failed to process booking status change: ${booking.id}`, error);
        }
    }
    async onReviewChanged(review) {
        try {
            await this.updateHotelRating(review.hotel_id);
            this.logger.debug(`Review change processed: ${review.id}`);
        }
        catch (error) {
            this.logger.error(`Failed to process review change: ${review.id}`, error);
        }
    }
    async validateDataConsistency() {
        const issues = [];
        try {
            const pgHotelCount = await this.hotelRepository.count();
            const esResult = await this.hotelSearchService['searchService'].search({
                index: this.hotelSearchService['searchService'].getIndexName('hotels'),
                body: {
                    query: { match_all: {} },
                    size: 0,
                },
            });
            const esHotelCount = esResult.hits.total.value;
            if (pgHotelCount !== esHotelCount) {
                issues.push(`Hotel count mismatch: PostgreSQL=${pgHotelCount}, Elasticsearch=${esHotelCount}`);
            }
            const sampleHotels = await this.hotelRepository.find({
                take: 10,
                relations: ['amenities'],
            });
            for (const hotel of sampleHotels) {
                try {
                    const esResult = await this.hotelSearchService['searchService'].search({
                        index: this.hotelSearchService['searchService'].getIndexName('hotels'),
                        body: {
                            query: {
                                term: { id: hotel.id },
                            },
                        },
                    });
                    if (esResult.hits.total.value === 0) {
                        issues.push(`Hotel ${hotel.id} exists in PostgreSQL but not in Elasticsearch`);
                    }
                    else {
                        const esHotel = esResult.hits.hits[0]._source;
                        if (esHotel.name !== hotel.name) {
                            issues.push(`Hotel ${hotel.id} name mismatch: PG="${hotel.name}", ES="${esHotel.name}"`);
                        }
                    }
                }
                catch (error) {
                    issues.push(`Failed to check hotel ${hotel.id}: ${error.message}`);
                }
            }
            const consistent = issues.length === 0;
            this.logger.log(`Data consistency check completed: ${consistent ? 'CONSISTENT' : 'ISSUES FOUND'}`);
            return { consistent, issues };
        }
        catch (error) {
            this.logger.error('Data consistency check failed', error);
            throw error;
        }
    }
};
exports.HotelDataSyncService = HotelDataSyncService;
exports.HotelDataSyncService = HotelDataSyncService = HotelDataSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(hotel_entity_1.Hotel)),
    __param(2, (0, typeorm_1.InjectRepository)(room_entity_1.Room)),
    __param(3, (0, typeorm_1.InjectRepository)(hotel_review_entity_1.HotelReview)),
    __param(4, (0, typeorm_1.InjectRepository)(hotel_booking_entity_1.HotelBooking)),
    __metadata("design:paramtypes", [hotel_search_service_1.HotelSearchService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], HotelDataSyncService);
//# sourceMappingURL=hotel.data-sync.service.js.map