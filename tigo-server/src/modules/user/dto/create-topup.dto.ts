import { IsNumber, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTopupDto {
  @IsNumber()
  @IsPositive()
  @Min(1)
  @Type(() => Number)
  amount: number;
}
