import { IsOptional, IsString, IsNumber, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

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
  @IsUUID()
  participant_id?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  booking_id?: string;
}
