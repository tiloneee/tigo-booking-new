import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { HotelSearchService } from '../hotel-search.service';
import { Hotel } from '../../../hotel/entities/hotel.entity';
import { Room } from '../../../hotel/entities/room.entity';
import { HotelReview } from '../../../hotel/entities/hotel-review.entity';
import { HotelBooking } from '../../../hotel/entities/hotel-booking.entity';
export declare class HotelDataSyncService implements OnModuleInit {
    private readonly hotelSearchService;
    private readonly hotelRepository;
    private readonly roomRepository;
    private readonly reviewRepository;
    private readonly bookingRepository;
    private readonly logger;
    private pricingUpdateQueue;
    private readonly DEBOUNCE_MS;
    constructor(hotelSearchService: HotelSearchService, hotelRepository: Repository<Hotel>, roomRepository: Repository<Room>, reviewRepository: Repository<HotelReview>, bookingRepository: Repository<HotelBooking>);
    onModuleInit(): Promise<void>;
    syncHotel(hotelId: string): Promise<void>;
    removeHotelFromIndex(hotelId: string): Promise<void>;
    updateHotelRating(hotelId: string): Promise<void>;
    updateHotelPricing(hotelId: string): Promise<void>;
    bulkSyncAllHotels(): Promise<void>;
    syncUpdatedHotels(since: Date): Promise<void>;
    onHotelCreated(hotel: Hotel): Promise<void>;
    onHotelUpdated(hotel: Hotel): Promise<void>;
    onHotelDeleted(hotelId: string): Promise<void>;
    onRoomAvailabilityChanged(roomId: string): Promise<void>;
    private debouncePricingUpdate;
    onBookingStatusChanged(booking: HotelBooking): Promise<void>;
    onReviewChanged(review: HotelReview): Promise<void>;
    validateDataConsistency(): Promise<{
        consistent: boolean;
        issues: string[];
    }>;
}
