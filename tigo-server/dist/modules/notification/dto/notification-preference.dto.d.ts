import { NotificationType } from '../entities/notification.entity';
export declare class UpdateNotificationPreferenceDto {
    in_app_enabled?: boolean;
    email_enabled?: boolean;
    push_enabled?: boolean;
}
export declare class CreateNotificationPreferenceDto {
    type: NotificationType;
    in_app_enabled?: boolean;
    email_enabled?: boolean;
    push_enabled?: boolean;
}
