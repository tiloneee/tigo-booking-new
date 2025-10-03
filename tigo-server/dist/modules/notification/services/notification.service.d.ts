import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../entities/notification.entity';
import { NotificationTemplate } from '../entities/notification-template.entity';
import { NotificationPreference } from '../entities/notification-preference.entity';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { SendNotificationDto, SendBulkNotificationDto } from '../dto/send-notification.dto';
import { NotificationQueryDto, BulkMarkNotificationDto } from '../dto/notification-query.dto';
import { RedisNotificationService } from './redis-notification.service';
import { EmailService } from '../../../common/services/email.service';
export declare class NotificationService {
    private readonly notificationRepository;
    private readonly templateRepository;
    private readonly preferenceRepository;
    private readonly redisNotificationService;
    private readonly emailService;
    private readonly logger;
    constructor(notificationRepository: Repository<Notification>, templateRepository: Repository<NotificationTemplate>, preferenceRepository: Repository<NotificationPreference>, redisNotificationService: RedisNotificationService, emailService: EmailService);
    createNotification(createDto: CreateNotificationDto): Promise<Notification>;
    sendNotification(sendDto: SendNotificationDto): Promise<Notification[]>;
    sendBulkNotification(bulkDto: SendBulkNotificationDto): Promise<void>;
    getNotifications(userId: string, queryDto: NotificationQueryDto): Promise<{
        notifications: Notification[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getUnreadCount(userId: string): Promise<number>;
    markAsRead(userId: string, notificationId: string): Promise<void>;
    markAllAsRead(userId: string): Promise<void>;
    bulkMarkNotifications(userId: string, bulkMarkDto: BulkMarkNotificationDto): Promise<void>;
    deleteNotification(userId: string, notificationId: string): Promise<void>;
    deleteAllNotifications(userId: string): Promise<void>;
    createTemplate(type: NotificationType, titleTemplate: string, messageTemplate: string): Promise<NotificationTemplate>;
    getTemplate(type: NotificationType): Promise<NotificationTemplate | null>;
    getUserPreferences(userId: string, type: NotificationType): Promise<NotificationPreference>;
    getAllUserPreferences(userId: string): Promise<NotificationPreference[]>;
    updateUserPreference(userId: string, type: NotificationType, updates: Partial<NotificationPreference>): Promise<NotificationPreference>;
    private sendEmailNotification;
}
