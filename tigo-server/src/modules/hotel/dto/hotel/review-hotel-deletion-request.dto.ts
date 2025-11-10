import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { HotelDeletionRequestStatus } from '../../entities/hotel-deletion-request.entity';

export class ReviewHotelDeletionRequestDto {
  @ApiProperty({
    description: 'Status of the deletion request',
    enum: [HotelDeletionRequestStatus.APPROVED, HotelDeletionRequestStatus.REJECTED],
    example: HotelDeletionRequestStatus.APPROVED,
  })
  @IsEnum([HotelDeletionRequestStatus.APPROVED, HotelDeletionRequestStatus.REJECTED], {
    message: 'Status must be either approved or rejected',
  })
  status: HotelDeletionRequestStatus.APPROVED | HotelDeletionRequestStatus.REJECTED;

  @ApiProperty({
    description: 'Admin notes regarding the decision',
    example: 'Request approved. Hotel will be deactivated.',
    required: false,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Admin notes must not exceed 1000 characters' })
  admin_notes?: string;
}
