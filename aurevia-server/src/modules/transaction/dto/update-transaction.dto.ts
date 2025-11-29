import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TransactionStatus } from '../entities/transaction.entity';

export class UpdateTransactionDto {
  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  @IsOptional()
  @IsString()
  admin_notes?: string;
}
