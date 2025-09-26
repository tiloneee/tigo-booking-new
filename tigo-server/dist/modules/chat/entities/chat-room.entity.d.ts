import { User } from '../../user/entities/user.entity';
import { ChatMessage } from './chat-message.entity';
export declare enum ChatRoomType {
    CUSTOMER_HOTEL_OWNER = "customer_hotel_owner",
    CUSTOMER_ADMIN = "customer_admin",
    HOTEL_OWNER_ADMIN = "hotel_owner_admin"
}
export declare class ChatRoom {
    id: string;
    type: ChatRoomType;
    participant1_id: string;
    participant2_id: string;
    participant1: User;
    participant2: User;
    hotel_id: string;
    last_message_content: string;
    last_message_at: Date;
    is_active: boolean;
    messages: ChatMessage[];
    created_at: Date;
    updated_at: Date;
}
