import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, NotificationStatus } from '../entities/notification.entity';
import { NotificationTemplate } from '../entities/notification-template.entity';
import { NotificationPreference } from '../entities/notification-preference.entity';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { SendNotificationDto, SendBulkNotificationDto } from '../dto/send-notification.dto';
import { NotificationQueryDto, MarkNotificationDto, BulkMarkNotificationDto } from '../dto/notification-query.dto';
import { RedisNotificationService } from './redis-notification.service';
import { EmailService } from '../../../common/services/email.service';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationTemplate)
    private readonly templateRepository: Repository<NotificationTemplate>,
    @InjectRepository(NotificationPreference)
    private readonly preferenceRepository: Repository<NotificationPreference>,
    private readonly redisNotificationService: RedisNotificationService,
    private readonly emailService: EmailService,
  ) {}

  async createNotification(createDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(createDto);
    const savedNotification = await this.notificationRepository.save(notification);

    // Send real-time notification via Redis
    await this.redisNotificationService.sendRealTimeNotification(
      savedNotification.user_id,
      savedNotification,
    );

    return savedNotification;
  }

  async sendNotification(sendDto: SendNotificationDto): Promise<Notification[]> {
    const notifications: Notification[] = [];

    for (const userId of sendDto.user_ids) {
      // Check user preferences
      const preferences = await this.getUserPreferences(userId, sendDto.type);
      
      if (!preferences.in_app_enabled) {
        continue; // Skip if in-app notifications are disabled
      }

      const notification = await this.createNotification({
        type: sendDto.type,
        title: sendDto.title,
        message: sendDto.message,
        user_id: userId,
        metadata: sendDto.metadata,
        related_entity_type: sendDto.related_entity_type,
        related_entity_id: sendDto.related_entity_id,
      });

      notifications.push(notification);

      // Send email if enabled
      if (preferences.email_enabled) {
        await this.sendEmailNotification(userId, notification);
      }
    }

    return notifications;
  }

  async sendBulkNotification(bulkDto: SendBulkNotificationDto): Promise<void> {
    // Get all users who have this notification type enabled
    const preferences = await this.preferenceRepository.find({
      where: {
        type: bulkDto.type,
        in_app_enabled: true,
      },
      relations: ['user'],
    });

    // If no preferences exist for this type, get all users and create default preferences
    if (preferences.length === 0) {
      // Get all users from the database
      const allUsers = await this.preferenceRepository.manager
        .createQueryBuilder()
        .select('DISTINCT user_id')
        .from('notification_preferences', 'np')
        .getRawMany();

      // For testing purposes, we'll get all users from the user table
      // This is a simplified approach - in production you might want to get users differently
      const allUserIds = await this.preferenceRepository.manager
        .createQueryBuilder()
        .select('id')
        .from('users', 'u')
        .getRawMany();

      for (const user of allUserIds) {
        // Create default preference for this notification type
        const defaultPreference = this.preferenceRepository.create({
          user_id: user.id,
          type: bulkDto.type,
          in_app_enabled: true,
          email_enabled: true,
          push_enabled: false,
        });
        await this.preferenceRepository.save(defaultPreference);

        // Send notification
        await this.createNotification({
          type: bulkDto.type,
          title: bulkDto.title,
          message: bulkDto.message,
          user_id: user.id,
          metadata: bulkDto.metadata,
        });
      }
    } else {
      // Use existing preferences
      for (const preference of preferences) {
        await this.createNotification({
          type: bulkDto.type,
          title: bulkDto.title,
          message: bulkDto.message,
          user_id: preference.user_id,
          metadata: bulkDto.metadata,
        });

        if (preference.email_enabled) {
          const notification = await this.notificationRepository.findOne({
            where: {
              user_id: preference.user_id,
              type: bulkDto.type,
              title: bulkDto.title,
            },
            order: { created_at: 'DESC' },
          });

          if (notification) {
            await this.sendEmailNotification(preference.user_id, notification);
          }
        }
      }
    }
  }

  async getNotifications(userId: string, queryDto: NotificationQueryDto) {
    const { page = 1, limit = 20, type, status } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.user_id = :userId', { userId })
      .orderBy('notification.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    if (type) {
      queryBuilder.andWhere('notification.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('notification.status = :status', { status });
    }

    const [notifications, total] = await queryBuilder.getManyAndCount();

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: {
        user_id: userId,
        status: NotificationStatus.UNREAD,
      },
    });
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, user_id: userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.status = NotificationStatus.READ;
    await this.notificationRepository.save(notification);

    // Update real-time notification count
    await this.redisNotificationService.updateUnreadCount(userId);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      {
        user_id: userId,
        status: NotificationStatus.UNREAD,
      },
      {
        status: NotificationStatus.READ,
      },
    );

    // Update real-time notification count
    await this.redisNotificationService.updateUnreadCount(userId);
  }

  async bulkMarkNotifications(
    userId: string,
    bulkMarkDto: BulkMarkNotificationDto,
  ): Promise<void> {
    const queryBuilder = this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ status: bulkMarkDto.status })
      .where('user_id = :userId', { userId });

    if (bulkMarkDto.type) {
      queryBuilder.andWhere('type = :type', { type: bulkMarkDto.type });
    }

    await queryBuilder.execute();

    // Update real-time notification count
    await this.redisNotificationService.updateUnreadCount(userId);
  }

  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    const result = await this.notificationRepository.delete({
      id: notificationId,
      user_id: userId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Notification not found');
    }

    // Update real-time notification count
    await this.redisNotificationService.updateUnreadCount(userId);
  }

  // Template management methods
  async createTemplate(type: NotificationType, titleTemplate: string, messageTemplate: string): Promise<NotificationTemplate> {
    const template = this.templateRepository.create({
      type,
      title_template: titleTemplate,
      message_template: messageTemplate,
    });

    return this.templateRepository.save(template);
  }

  async getTemplate(type: NotificationType): Promise<NotificationTemplate | null> {
    return this.templateRepository.findOne({ where: { type } });
  }

  // Preference management methods
  async getUserPreferences(userId: string, type: NotificationType): Promise<NotificationPreference> {
    let preference = await this.preferenceRepository.findOne({
      where: { user_id: userId, type },
    });

    if (!preference) {
      // Create default preference
      preference = this.preferenceRepository.create({
        user_id: userId,
        type,
        in_app_enabled: true,
        email_enabled: true,
        push_enabled: false,
      });
      await this.preferenceRepository.save(preference);
    }

    return preference;
  }

  async getAllUserPreferences(userId: string): Promise<NotificationPreference[]> {
    const preferences = await this.preferenceRepository.find({
      where: { user_id: userId },
    });

    // Create default preferences for missing notification types
    const existingTypes = preferences.map(p => p.type);
    const allTypes = Object.values(NotificationType);
    
    for (const type of allTypes) {
      if (!existingTypes.includes(type)) {
        const newPreference = this.preferenceRepository.create({
          user_id: userId,
          type,
          in_app_enabled: true,
          email_enabled: true,
          push_enabled: false,
        });
        const savedPreference = await this.preferenceRepository.save(newPreference);
        preferences.push(savedPreference);
      }
    }

    return preferences;
  }

  async updateUserPreference(
    userId: string,
    type: NotificationType,
    updates: Partial<NotificationPreference>,
  ): Promise<NotificationPreference> {
    let preference = await this.preferenceRepository.findOne({
      where: { user_id: userId, type },
    });

    if (!preference) {
      preference = this.preferenceRepository.create({
        user_id: userId,
        type,
        ...updates,
      });
    } else {
      Object.assign(preference, updates);
    }

    return this.preferenceRepository.save(preference);
  }

  private async sendEmailNotification(userId: string, notification: Notification): Promise<void> {
    try {
      // This would integrate with your email service
      // For now, we'll mark that email was sent
      notification.is_email_sent = true;
      await this.notificationRepository.save(notification);
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }
}
