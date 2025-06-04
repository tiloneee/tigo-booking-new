import { 
  IsString, 
  IsOptional, 
  IsNumber, 
  IsNotEmpty, 
  Length, 
  Min,
  IsUUID 
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoomDto {
  @IsUUID()
  hotel_id: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  room_number: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  room_type: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  max_occupancy: number;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  bed_configuration?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  size_sqm?: number;
} 