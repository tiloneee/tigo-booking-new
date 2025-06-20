import {
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsArray,
  Min,
  Max,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchHotelDto {
  // Location-based search
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsLatitude()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  @Type(() => Number)
  longitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  radius_km?: number; // For geospatial search

  // Booking criteria
  @IsOptional()
  @IsDateString()
  check_in_date?: string;

  @IsOptional()
  @IsDateString()
  check_out_date?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  number_of_guests?: number;

  // Filters
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenity_ids?: string[];

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

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  min_rating?: number;

  @IsOptional()
  @IsString()
  room_type?: string;

  // Sorting
  @IsOptional()
  @IsString()
  sort_by?: 'price' | 'rating' | 'distance' | 'name';

  @IsOptional()
  @IsString()
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
  limit?: number = 10;
}
