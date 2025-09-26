import { IsEnum, IsNotEmpty, IsOptional, IsString, IsObject, IsUUID, IsArray } from 'class-validator';
import { NotificationType } from '../entities/notification.entity';

export class SendNotificationDto {
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  user_ids: string[];

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

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

export class SendBulkNotificationDto {
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsObject()
  @IsOptional()
  metadata?: any;
}
