import { ChatRoomType } from '../entities/chat-room.entity';
export declare class ChatRoomQueryDto {
    page?: number;
    limit?: number;
    type?: ChatRoomType;
    participant_id?: string;
    search?: string;
}
