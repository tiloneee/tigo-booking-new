import { 
  IsString, 
  IsOptional, 
  IsArray, 
  IsPhoneNumber, 
  Length, 
  IsNotEmpty 
} from 'class-validator';

export class CreateHotelDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  address: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  city: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  state: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  zip_code: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  country: string;

  @IsPhoneNumber("VN")
  phone_number: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenity_ids?: string[];
} 