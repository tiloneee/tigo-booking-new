import { IsOptional, IsEnum, IsUUID, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { NotificationType, NotificationStatus } from '../entities/notification.entity';

export class NotificationQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @IsOptional()
  @IsUUID()
  user_id?: string;
}

export class MarkNotificationDto {
  @IsEnum(NotificationStatus)
  status: NotificationStatus;
}

export class BulkMarkNotificationDto {
  @IsEnum(NotificationStatus)
  status: NotificationStatus;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}
