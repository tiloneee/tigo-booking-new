import {
  IsOptional,
  IsString,
  IsDateString,
  IsArray,
  IsNumber,
  IsUUID,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchBookingDto {
  // Filter by hotel or room
  @IsOptional()
  @IsUUID()
  hotel_id?: string;

  @IsOptional()
  @IsUUID()
  room_id?: string;

  @IsOptional()
  @IsUUID()
  user_id?: string;

  // Date filters
  @IsOptional()
  @IsDateString()
  check_in_from?: string;

  @IsOptional()
  @IsDateString()
  check_in_to?: string;

  @IsOptional()
  @IsDateString()
  check_out_from?: string;

  @IsOptional()
  @IsDateString()
  check_out_to?: string;

  @IsOptional()
  @IsDateString()
  created_from?: string;

  @IsOptional()
  @IsDateString()
  created_to?: string;

  // Status filters
  @IsOptional()
  @IsArray()
  @IsIn(
    [
      'Pending',
      'Confirmed',
      'Cancelled',
      'Completed',
      'CheckedIn',
      'CheckedOut',
      'NoShow',
    ],
    { each: true },
  )
  status?: string[];

  @IsOptional()
  @IsArray()
  @IsIn(['Pending', 'Paid', 'Refunded', 'PartialRefund', 'Failed'], {
    each: true,
  })
  payment_status?: string[];

  // Price filters
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  min_price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  max_price?: number;

  // Guest info search
  @IsOptional()
  @IsString()
  guest_name?: string;

  @IsOptional()
  @IsString()
  guest_email?: string;

  @IsOptional()
  @IsString()
  guest_phone?: string;

  // Sorting
  @IsOptional()
  @IsIn([
    'created_at',
    'check_in_date',
    'check_out_date',
    'total_price',
    'status',
  ])
  sort_by?: string;

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sort_order?: 'ASC' | 'DESC';

  // Pagination
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}
