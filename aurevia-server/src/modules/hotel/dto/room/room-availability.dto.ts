import {
  IsString,
  IsNumber,
  IsDateString,
  IsIn,
  Min,
  IsUUID,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoomAvailabilityDto {
  @IsUUID()
  room_id: string;

  @IsDateString()
  date: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price_per_night: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  available_units: number;

  @IsOptional()
  @IsIn(['Available', 'Booked', 'Maintenance', 'Blocked'])
  status?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  total_units?: number;
}

export class UpdateRoomAvailabilityDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price_per_night?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  available_units?: number;

  @IsOptional()
  @IsIn(['Available', 'Booked', 'Maintenance', 'Blocked'])
  status?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  total_units?: number;
}

export class BulkRoomAvailabilityDto {
  @IsUUID()
  @IsOptional()
  room_id: string;

  @IsDateString()
  start_date: string;

  @IsDateString()
  end_date: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price_per_night: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  available_units: number;

  @IsOptional()
  @IsIn(['Available', 'Booked', 'Maintenance', 'Blocked'])
  status?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  total_units?: number;
}
