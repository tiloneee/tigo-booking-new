import { IsOptional, IsUUID } from 'class-validator';

export class CreateChatRoomDto {
  @IsUUID()
  participant1_id: string;

  @IsUUID()
  participant2_id: string;

  @IsOptional()
  @IsUUID()
  hotel_id?: string;

  @IsOptional()
  @IsUUID()
  booking_id?: string;
}
