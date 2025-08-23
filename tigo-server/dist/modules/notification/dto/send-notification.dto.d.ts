import { NotificationType } from '../entities/notification.entity';
export declare class SendNotificationDto {
    type: NotificationType;
    user_ids: string[];
    title: string;
    message: string;
    metadata?: any;
    related_entity_type?: string;
    related_entity_id?: string;
}
export declare class SendBulkNotificationDto {
    type: NotificationType;
    title: string;
    message: string;
    metadata?: any;
}
