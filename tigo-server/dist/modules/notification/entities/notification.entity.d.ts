import { User } from '../../user/entities/user.entity';
export declare enum NotificationType {
    CHAT_MESSAGE = "CHAT_MESSAGE",
    BOOKING_CONFIRMATION = "BOOKING_CONFIRMATION",
    BOOKING_CANCELLED = "BOOKING_CANCELLED",
    BOOKING_REMINDER = "BOOKING_REMINDER",
    REVIEW_RECEIVED = "REVIEW_RECEIVED",
    HOTEL_APPROVED = "HOTEL_APPROVED",
    HOTEL_REJECTED = "HOTEL_REJECTED",
    SYSTEM_ANNOUNCEMENT = "SYSTEM_ANNOUNCEMENT",
    PAYMENT_SUCCESS = "PAYMENT_SUCCESS",
    PAYMENT_FAILED = "PAYMENT_FAILED"
}
export declare enum NotificationStatus {
    UNREAD = "UNREAD",
    READ = "READ",
    ARCHIVED = "ARCHIVED"
}
export declare class Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    status: NotificationStatus;
    metadata: any;
    user_id: string;
    user: User;
    related_entity_type: string;
    related_entity_id: string;
    is_push_sent: boolean;
    is_email_sent: boolean;
    created_at: Date;
    updated_at: Date;
}
