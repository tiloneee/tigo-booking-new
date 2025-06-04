import { 
  IsString, 
  IsOptional, 
  IsNotEmpty, 
  Length 
} from 'class-validator';

export class CreateAmenityDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  category?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  icon?: string;
} 