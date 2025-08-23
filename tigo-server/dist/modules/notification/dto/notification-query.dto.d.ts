import { NotificationType, NotificationStatus } from '../entities/notification.entity';
export declare class NotificationQueryDto {
    page?: number;
    limit?: number;
    type?: NotificationType;
    status?: NotificationStatus;
    user_id?: string;
}
export declare class MarkNotificationDto {
    status: NotificationStatus;
}
export declare class BulkMarkNotificationDto {
    status: NotificationStatus;
    type?: NotificationType;
}
