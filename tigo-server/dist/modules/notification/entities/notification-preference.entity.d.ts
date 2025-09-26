import { User } from '../../user/entities/user.entity';
import { NotificationType } from './notification.entity';
export declare class NotificationPreference {
    id: string;
    user_id: string;
    user: User;
    type: NotificationType;
    in_app_enabled: boolean;
    email_enabled: boolean;
    push_enabled: boolean;
    created_at: Date;
    updated_at: Date;
}
