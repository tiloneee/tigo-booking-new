import { Hotel } from './hotel.entity';
import { RoomAvailability } from './room-availability.entity';
import { HotelBooking } from './hotel-booking.entity';
export declare class Room {
    id: string;
    room_number: string;
    room_type: string;
    description: string;
    max_occupancy: number;
    bed_configuration: string;
    size_sqm: number;
    is_active: boolean;
    hotel: Hotel;
    hotel_id: string;
    availability: RoomAvailability[];
    bookings: HotelBooking[];
    created_at: Date;
    updated_at: Date;
}
