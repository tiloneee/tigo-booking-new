import { ChatRoomType } from '../entities/chat-room.entity';
export declare class CreateChatRoomDto {
    type: ChatRoomType;
    participant1_id: string;
    participant2_id: string;
    hotel_id?: string;
}
