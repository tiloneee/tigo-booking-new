import { IsEmail, IsString, MinLength, IsOptional, IsPhoneNumber, IsIn } from 'class-validator';

export class CreateUserDto {
  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsPhoneNumber("VN")
  phone_number?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Customer', 'HotelOwner', 'Admin'])
  role?: string;
}
