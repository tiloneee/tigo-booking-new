import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsNotEmpty,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @IsNotEmpty()
  @IsUUID()
  booking_id: string; // Required: Each review must be linked to a booking

  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating: number;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  comment?: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  title?: string;

  // Additional rating categories (optional)
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  cleanliness_rating?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  location_rating?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  service_rating?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  value_rating?: number;
}
