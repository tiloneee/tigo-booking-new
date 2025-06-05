import { User } from '../../user/entities/user.entity';
import { Room } from './room.entity';
import { HotelBooking } from './hotel-booking.entity';
import { HotelReview } from './hotel-review.entity';
import { HotelAmenity } from './hotel-amenity.entity';
export declare class Hotel {
    id: string;
    name: string;
    description: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    phone_number: string;
    latitude: number | null;
    longitude: number | null;
    avg_rating: number;
    total_reviews: number;
    is_active: boolean;
    owner: User;
    owner_id: string;
    rooms: Room[];
    bookings: HotelBooking[];
    reviews: HotelReview[];
    amenities: HotelAmenity[];
    created_at: Date;
    updated_at: Date;
}
