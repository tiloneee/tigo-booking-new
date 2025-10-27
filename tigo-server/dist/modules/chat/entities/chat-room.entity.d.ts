import { User } from '../../user/entities/user.entity';
import { ChatMessage } from './chat-message.entity';
import { HotelBooking } from '../../hotel/entities/hotel-booking.entity';
export declare class ChatRoom {
    id: string;
    participant1_id: string;
    participant2_id: string;
    participant1: User;
    participant2: User;
    booking_id: string;
    booking: HotelBooking;
    hotel_id: string;
    last_message_content: string;
    last_message_at: Date;
    is_active: boolean;
    messages: ChatMessage[];
    created_at: Date;
    updated_at: Date;
}
