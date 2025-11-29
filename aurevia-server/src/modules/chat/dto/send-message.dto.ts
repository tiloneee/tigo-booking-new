import { IsEnum, IsOptional, IsString, IsUUID, IsNumber } from 'class-validator';
import { MessageType } from '../entities/chat-message.entity';

export class SendMessageDto {
  @IsUUID()
  chat_room_id: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType = MessageType.TEXT;

  @IsOptional()
  @IsString()
  file_url?: string;

  @IsOptional()
  @IsString()
  file_name?: string;

  @IsOptional()
  @IsNumber()
  file_size?: number;

  @IsOptional()
  metadata?: Record<string, any>;
}
