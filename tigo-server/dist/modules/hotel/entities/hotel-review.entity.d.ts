import { Hotel } from './hotel.entity';
import { HotelBooking } from './hotel-booking.entity';
import { User } from '../../user/entities/user.entity';
export declare class HotelReview {
    id: string;
    rating: number;
    comment: string;
    title: string;
    cleanliness_rating: number;
    location_rating: number;
    service_rating: number;
    value_rating: number;
    is_verified_stay: boolean;
    stay_date: Date;
    is_approved: boolean;
    moderation_notes: string;
    helpful_votes: number;
    total_votes: number;
    hotel: Hotel;
    hotel_id: string;
    user: User;
    user_id: string;
    booking: HotelBooking;
    booking_id: string | null;
    created_at: Date;
    updated_at: Date;
}
