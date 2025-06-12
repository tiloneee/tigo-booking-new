import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateBookingDto } from './create-booking.dto';
import { IsOptional, IsIn, IsString, Length } from 'class-validator';

export class UpdateBookingDto extends PartialType(
  OmitType(CreateBookingDto, ['hotel_id', 'room_id'] as const),
) {
  @IsOptional()
  @IsIn([
    'Pending',
    'Confirmed',
    'Cancelled',
    'Completed',
    'CheckedIn',
    'CheckedOut',
    'NoShow',
  ])
  status?: string;

  @IsOptional()
  @IsIn(['Pending', 'Paid', 'Refunded', 'PartialRefund', 'Failed'])
  payment_status?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  cancellation_reason?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  admin_notes?: string;

  // Internal fields for service use
  confirmed_at?: Date;
  cancelled_at?: Date;
}
