import { IsOptional, IsString, IsNumber, IsEnum, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { ChatRoomType } from '../entities/chat-room.entity';

export class ChatRoomQueryDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @IsOptional()
  @IsEnum(ChatRoomType)
  type?: ChatRoomType;

  @IsOptional()
  @IsUUID()
  participant_id?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
