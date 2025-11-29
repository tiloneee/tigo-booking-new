import { IsOptional, IsNumber, IsUUID, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class MessageQueryDto {
  @IsUUID()
  chat_room_id: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 50;

  @IsOptional()
  @IsDateString()
  before?: string;

  @IsOptional()
  @IsDateString()
  after?: string;
}
