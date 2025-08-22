import { User } from '../../user/entities/user.entity';
import { ChatRoom } from './chat-room.entity';
export declare enum MessageStatus {
    SENT = "sent",
    DELIVERED = "delivered",
    READ = "read"
}
export declare enum MessageType {
    TEXT = "text",
    FILE = "file",
    IMAGE = "image"
}
export declare class ChatMessage {
    id: string;
    chat_room_id: string;
    sender_id: string;
    chatRoom: ChatRoom;
    sender: User;
    content: string;
    type: MessageType;
    status: MessageStatus;
    file_url: string;
    file_name: string;
    file_size: number;
    metadata: Record<string, any>;
    is_edited: boolean;
    edited_at: Date;
    created_at: Date;
    updated_at: Date;
}
