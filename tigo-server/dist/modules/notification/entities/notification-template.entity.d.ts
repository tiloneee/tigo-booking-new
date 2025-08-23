import { NotificationType } from './notification.entity';
export declare class NotificationTemplate {
    id: string;
    type: NotificationType;
    title_template: string;
    message_template: string;
    email_template: string;
    is_active: boolean;
    default_settings: any;
    created_at: Date;
    updated_at: Date;
}
