import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ChatRoomType } from '../entities/chat-room.entity';

export class CreateChatRoomDto {
  @IsEnum(ChatRoomType)
  type: ChatRoomType;

  @IsUUID()
  participant1_id: string;

  @IsUUID()
  participant2_id: string;

  @IsOptional()
  @IsUUID()
  hotel_id?: string;
}
