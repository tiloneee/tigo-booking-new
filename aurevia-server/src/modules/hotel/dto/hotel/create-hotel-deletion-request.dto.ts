import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHotelDeletionRequestDto {
  @ApiProperty({
    description: 'Reason for deleting the hotel',
    example: 'The hotel is permanently closed',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Reason must be at least 10 characters long' })
  @MaxLength(1000, { message: 'Reason must not exceed 1000 characters' })
  reason: string;
}
