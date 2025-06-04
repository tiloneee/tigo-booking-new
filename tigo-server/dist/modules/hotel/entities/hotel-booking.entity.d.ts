import { Hotel } from './hotel.entity';
import { Room } from './room.entity';
import { User } from '../../user/entities/user.entity';
export declare class HotelBooking {
    id: string;
    check_in_date: string;
    check_out_date: string;
    number_of_guests: number;
    status: string;
    hotel: Hotel;
    hotel_id: string;
    room: Room;
    room_id: string;
    user: User;
    user_id: string;
    created_at: Date;
    updated_at: Date;
}
