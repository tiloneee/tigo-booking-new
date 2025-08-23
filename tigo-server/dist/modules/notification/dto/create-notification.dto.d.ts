import { NotificationType } from '../entities/notification.entity';
export declare class CreateNotificationDto {
    type: NotificationType;
    title: string;
    message: string;
    user_id: string;
    metadata?: any;
    related_entity_type?: string;
    related_entity_id?: string;
}
