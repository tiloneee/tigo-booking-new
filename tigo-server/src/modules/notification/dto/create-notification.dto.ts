import { IsEnum, IsNotEmpty, IsOptional, IsString, IsObject, IsUUID } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @IsObject()
  @IsOptional()
  metadata?: any;

  @IsString()
  @IsOptional()
  related_entity_type?: string;

  @IsString()
  @IsOptional()
  related_entity_id?: string;
}
