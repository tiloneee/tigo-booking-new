import {
  IsString,
  IsOptional,
  IsArray,
  IsPhoneNumber,
  Length,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHotelDto {
  @ApiProperty({
    description: 'Hotel name',
    example: 'Grand Saigon Hotel',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  name: string;

  @ApiProperty({
    description: 'Hotel description',
    example:
      'A luxurious 5-star hotel in the heart of Ho Chi Minh City with stunning city views and world-class amenities.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Hotel address',
    example: '123 Nguyen Hue Boulevard',
    minLength: 1,
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  address: string;

  @ApiProperty({
    description: 'City name',
    example: 'Ho Chi Minh City',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  city: string;

  @ApiProperty({
    description: 'State or province',
    example: 'Ho Chi Minh',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  state: string;

  @ApiProperty({
    description: 'ZIP or postal code',
    example: '70000',
    minLength: 1,
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  zip_code: string;

  @ApiProperty({
    description: 'Country name',
    example: 'Vietnam',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  country: string;

  @ApiProperty({
    description: 'Hotel phone number (Vietnam format)',
    example: '+84283829999',
  })
  @IsPhoneNumber('VN')
  phone_number: string;

  @ApiPropertyOptional({
    description: 'Array of amenity IDs to associate with the hotel',
    example: ['amenity-uuid-1', 'amenity-uuid-2', 'amenity-uuid-3'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenity_ids?: string[];
}
