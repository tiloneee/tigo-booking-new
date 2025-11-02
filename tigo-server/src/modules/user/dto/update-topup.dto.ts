import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TopupStatus } from '../entities/balance-topup.entity';

export class UpdateTopupDto {
  @IsEnum(TopupStatus)
  status: TopupStatus;

  @IsOptional()
  @IsString()
  admin_notes?: string;
}
