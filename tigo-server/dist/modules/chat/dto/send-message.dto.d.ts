import { MessageType } from '../entities/chat-message.entity';
export declare class SendMessageDto {
    chat_room_id: string;
    content: string;
    type?: MessageType;
    file_url?: string;
    file_name?: string;
    file_size?: number;
    metadata?: Record<string, any>;
}
