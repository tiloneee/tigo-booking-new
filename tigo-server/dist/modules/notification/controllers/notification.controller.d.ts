import { NotificationService } from '../services/notification.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { SendNotificationDto, SendBulkNotificationDto } from '../dto/send-notification.dto';
import { NotificationQueryDto, MarkNotificationDto, BulkMarkNotificationDto } from '../dto/notification-query.dto';
import { UpdateNotificationPreferenceDto, CreateNotificationPreferenceDto } from '../dto/notification-preference.dto';
import { NotificationType } from '../entities/notification.entity';
export declare class NotificationController {
    private readonly notificationService;
    constructor(notificationService: NotificationService);
    createNotification(createDto: CreateNotificationDto): Promise<import("../entities/notification.entity").Notification>;
    sendNotification(sendDto: SendNotificationDto): Promise<import("../entities/notification.entity").Notification[]>;
    sendBulkNotification(bulkDto: SendBulkNotificationDto): Promise<{
        message: string;
    }>;
    getNotifications(req: any, queryDto: NotificationQueryDto): Promise<{
        notifications: import("../entities/notification.entity").Notification[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getUnreadCount(req: any): Promise<{
        count: number;
    }>;
    markNotification(req: any, notificationId: string, markDto: MarkNotificationDto): Promise<{
        message: string;
    }>;
    markAllAsRead(req: any): Promise<{
        message: string;
    }>;
    bulkMarkNotifications(req: any, bulkMarkDto: BulkMarkNotificationDto): Promise<{
        message: string;
    }>;
    deleteNotification(req: any, notificationId: string): Promise<{
        message: string;
    }>;
    getUserPreferences(req: any): Promise<import("../entities/notification-preference.entity").NotificationPreference[]>;
    updateNotificationPreference(req: any, type: NotificationType, updateDto: UpdateNotificationPreferenceDto): Promise<import("../entities/notification-preference.entity").NotificationPreference>;
    createNotificationPreference(req: any, createDto: CreateNotificationPreferenceDto): Promise<import("../entities/notification-preference.entity").NotificationPreference>;
}
