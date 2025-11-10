import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HotelRequestStatus } from '../../entities/hotel-request.entity';

export class ReviewHotelRequestDto {
  @ApiProperty({
    description: 'Decision on the hotel request',
    enum: [HotelRequestStatus.APPROVED, HotelRequestStatus.REJECTED],
    example: HotelRequestStatus.APPROVED,
  })
  @IsEnum([HotelRequestStatus.APPROVED, HotelRequestStatus.REJECTED])
  status: HotelRequestStatus.APPROVED | HotelRequestStatus.REJECTED;

  @ApiPropertyOptional({
    description: 'Admin notes about the decision',
    example: 'Approved. All details verified.',
  })
  @IsOptional()
  @IsString()
  admin_notes?: string;
}
