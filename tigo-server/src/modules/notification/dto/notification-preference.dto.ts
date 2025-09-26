import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class UpdateNotificationPreferenceDto {
  @IsOptional()
  @IsBoolean()
  in_app_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  email_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  push_enabled?: boolean;
}

export class CreateNotificationPreferenceDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsOptional()
  @IsBoolean()
  in_app_enabled?: boolean = true;

  @IsOptional()
  @IsBoolean()
  email_enabled?: boolean = true;

  @IsOptional()
  @IsBoolean()
  push_enabled?: boolean = false;
}
