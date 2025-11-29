import { IsNumber, IsPositive, IsOptional, IsString } from 'class-validator';

export class CreateTopupDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}
