"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const notification_entity_1 = require("../entities/notification.entity");
const notification_template_entity_1 = require("../entities/notification-template.entity");
const notification_preference_entity_1 = require("../entities/notification-preference.entity");
const redis_notification_service_1 = require("./redis-notification.service");
const email_service_1 = require("../../../common/services/email.service");
let NotificationService = class NotificationService {
    notificationRepository;
    templateRepository;
    preferenceRepository;
    redisNotificationService;
    emailService;
    constructor(notificationRepository, templateRepository, preferenceRepository, redisNotificationService, emailService) {
        this.notificationRepository = notificationRepository;
        this.templateRepository = templateRepository;
        this.preferenceRepository = preferenceRepository;
        this.redisNotificationService = redisNotificationService;
        this.emailService = emailService;
    }
    async createNotification(createDto) {
        const notification = this.notificationRepository.create(createDto);
        const savedNotification = await this.notificationRepository.save(notification);
        await this.redisNotificationService.sendRealTimeNotification(savedNotification.user_id, savedNotification);
        return savedNotification;
    }
    async sendNotification(sendDto) {
        const notifications = [];
        for (const userId of sendDto.user_ids) {
            const preferences = await this.getUserPreferences(userId, sendDto.type);
            if (!preferences.in_app_enabled) {
                continue;
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
            if (preferences.email_enabled) {
                await this.sendEmailNotification(userId, notification);
            }
        }
        return notifications;
    }
    async sendBulkNotification(bulkDto) {
        const preferences = await this.preferenceRepository.find({
            where: {
                type: bulkDto.type,
                in_app_enabled: true,
            },
            relations: ['user'],
        });
        if (preferences.length === 0) {
            const allUsers = await this.preferenceRepository.manager
                .createQueryBuilder()
                .select('DISTINCT user_id')
                .from('notification_preferences', 'np')
                .getRawMany();
            const allUserIds = await this.preferenceRepository.manager
                .createQueryBuilder()
                .select('id')
                .from('users', 'u')
                .getRawMany();
            for (const user of allUserIds) {
                const defaultPreference = this.preferenceRepository.create({
                    user_id: user.id,
                    type: bulkDto.type,
                    in_app_enabled: true,
                    email_enabled: true,
                    push_enabled: false,
                });
                await this.preferenceRepository.save(defaultPreference);
                await this.createNotification({
                    type: bulkDto.type,
                    title: bulkDto.title,
                    message: bulkDto.message,
                    user_id: user.id,
                    metadata: bulkDto.metadata,
                });
            }
        }
        else {
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
    async getNotifications(userId, queryDto) {
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
    async getUnreadCount(userId) {
        return this.notificationRepository.count({
            where: {
                user_id: userId,
                status: notification_entity_1.NotificationStatus.UNREAD,
            },
        });
    }
    async markAsRead(userId, notificationId) {
        const notification = await this.notificationRepository.findOne({
            where: { id: notificationId, user_id: userId },
        });
        if (!notification) {
            throw new common_1.NotFoundException('Notification not found');
        }
        notification.status = notification_entity_1.NotificationStatus.READ;
        await this.notificationRepository.save(notification);
        await this.redisNotificationService.updateUnreadCount(userId);
    }
    async markAllAsRead(userId) {
        await this.notificationRepository.update({
            user_id: userId,
            status: notification_entity_1.NotificationStatus.UNREAD,
        }, {
            status: notification_entity_1.NotificationStatus.READ,
        });
        await this.redisNotificationService.updateUnreadCount(userId);
    }
    async bulkMarkNotifications(userId, bulkMarkDto) {
        const queryBuilder = this.notificationRepository
            .createQueryBuilder()
            .update(notification_entity_1.Notification)
            .set({ status: bulkMarkDto.status })
            .where('user_id = :userId', { userId });
        if (bulkMarkDto.type) {
            queryBuilder.andWhere('type = :type', { type: bulkMarkDto.type });
        }
        await queryBuilder.execute();
        await this.redisNotificationService.updateUnreadCount(userId);
    }
    async deleteNotification(userId, notificationId) {
        const result = await this.notificationRepository.delete({
            id: notificationId,
            user_id: userId,
        });
        if (result.affected === 0) {
            throw new common_1.NotFoundException('Notification not found');
        }
        await this.redisNotificationService.updateUnreadCount(userId);
    }
    async createTemplate(type, titleTemplate, messageTemplate) {
        const template = this.templateRepository.create({
            type,
            title_template: titleTemplate,
            message_template: messageTemplate,
        });
        return this.templateRepository.save(template);
    }
    async getTemplate(type) {
        return this.templateRepository.findOne({ where: { type } });
    }
    async getUserPreferences(userId, type) {
        let preference = await this.preferenceRepository.findOne({
            where: { user_id: userId, type },
        });
        if (!preference) {
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
    async getAllUserPreferences(userId) {
        const preferences = await this.preferenceRepository.find({
            where: { user_id: userId },
        });
        const existingTypes = preferences.map(p => p.type);
        const allTypes = Object.values(notification_entity_1.NotificationType);
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
    async updateUserPreference(userId, type, updates) {
        let preference = await this.preferenceRepository.findOne({
            where: { user_id: userId, type },
        });
        if (!preference) {
            preference = this.preferenceRepository.create({
                user_id: userId,
                type,
                ...updates,
            });
        }
        else {
            Object.assign(preference, updates);
        }
        return this.preferenceRepository.save(preference);
    }
    async sendEmailNotification(userId, notification) {
        try {
            notification.is_email_sent = true;
            await this.notificationRepository.save(notification);
        }
        catch (error) {
            console.error('Failed to send email notification:', error);
        }
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __param(1, (0, typeorm_1.InjectRepository)(notification_template_entity_1.NotificationTemplate)),
    __param(2, (0, typeorm_1.InjectRepository)(notification_preference_entity_1.NotificationPreference)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        redis_notification_service_1.RedisNotificationService,
        email_service_1.EmailService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map