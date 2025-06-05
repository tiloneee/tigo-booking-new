import { Hotel } from './hotel.entity';
import { User } from '../../user/entities/user.entity';
export declare class HotelReview {
    id: string;
    rating: number;
    comment: string;
    hotel: Hotel;
    hotel_id: string;
    user: User;
    user_id: string;
    created_at: Date;
    updated_at: Date;
}
