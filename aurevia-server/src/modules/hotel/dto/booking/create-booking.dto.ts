import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsUUID,
  IsNotEmpty,
  Min,
  Length,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookingDto {
  @IsUUID()
  hotel_id: string;

  @IsUUID()
  room_id: string;

  @IsDateString()
  check_in_date: string;

  @IsDateString()
  check_out_date: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  number_of_guests: number;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  special_requests?: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  guest_name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 20)
  guest_phone?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  guest_email?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  units_requested?: number; // For rooms with multiple units

  // These will be calculated by the service
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  total_price?: number;

  @IsOptional()
  @IsIn(['Pending', 'Confirmed', 'Cancelled', 'Completed'])
  status?: string;
}
