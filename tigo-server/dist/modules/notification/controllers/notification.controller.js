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
exports.NotificationController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../../common/guards/jwt-auth.guard");
const notification_service_1 = require("../services/notification.service");
const create_notification_dto_1 = require("../dto/create-notification.dto");
const send_notification_dto_1 = require("../dto/send-notification.dto");
const notification_query_dto_1 = require("../dto/notification-query.dto");
const notification_preference_dto_1 = require("../dto/notification-preference.dto");
const notification_entity_1 = require("../entities/notification.entity");
let NotificationController = class NotificationController {
    notificationService;
    constructor(notificationService) {
        this.notificationService = notificationService;
    }
    async createNotification(createDto) {
        return this.notificationService.createNotification(createDto);
    }
    async sendNotification(sendDto) {
        return this.notificationService.sendNotification(sendDto);
    }
    async sendBulkNotification(bulkDto) {
        await this.notificationService.sendBulkNotification(bulkDto);
        return { message: 'Bulk notifications sent successfully' };
    }
    async getNotifications(req, queryDto) {
        const userId = req.user?.id || req.user?.userId || req.user?.sub;
        if (!userId) {
            throw new common_1.BadRequestException('User ID not found in request');
        }
        return this.notificationService.getNotifications(userId, queryDto);
    }
    async getUnreadCount(req) {
        const userId = req.user?.id || req.user?.userId || req.user?.sub;
        if (!userId) {
            throw new common_1.BadRequestException('User ID not found in request');
        }
        const count = await this.notificationService.getUnreadCount(userId);
        return { count };
    }
    async markNotification(req, notificationId, markDto) {
        const userId = req.user?.id || req.user?.userId || req.user?.sub;
        if (!userId) {
            throw new common_1.BadRequestException('User ID not found in request');
        }
        await this.notificationService.markAsRead(userId, notificationId);
        return { message: 'Notification marked successfully' };
    }
    async markAllAsRead(req) {
        const userId = req.user?.id || req.user?.userId || req.user?.sub;
        if (!userId) {
            throw new common_1.BadRequestException('User ID not found in request');
        }
        await this.notificationService.markAllAsRead(userId);
        return { message: 'All notifications marked as read' };
    }
    async bulkMarkNotifications(req, bulkMarkDto) {
        const userId = req.user?.id || req.user?.userId || req.user?.sub;
        if (!userId) {
            throw new common_1.BadRequestException('User ID not found in request');
        }
        await this.notificationService.bulkMarkNotifications(userId, bulkMarkDto);
        return { message: 'Notifications marked successfully' };
    }
    async deleteNotification(req, notificationId) {
        const userId = req.user?.id || req.user?.userId || req.user?.sub;
        if (!userId) {
            throw new common_1.BadRequestException('User ID not found in request');
        }
        await this.notificationService.deleteNotification(userId, notificationId);
        return { message: 'Notification deleted successfully' };
    }
    async getUserPreferences(req) {
        const userId = req.user?.id || req.user?.userId || req.user?.sub;
        if (!userId) {
            throw new common_1.BadRequestException('User ID not found in request');
        }
        return this.notificationService.getAllUserPreferences(userId);
    }
    async updateNotificationPreference(req, type, updateDto) {
        const userId = req.user?.id || req.user?.userId || req.user?.sub;
        if (!userId) {
            throw new common_1.BadRequestException('User ID not found in request');
        }
        return this.notificationService.updateUserPreference(userId, type, updateDto);
    }
    async createNotificationPreference(req, createDto) {
        const userId = req.user?.id || req.user?.userId || req.user?.sub;
        if (!userId) {
            throw new common_1.BadRequestException('User ID not found in request');
        }
        return this.notificationService.updateUserPreference(userId, createDto.type, createDto);
    }
};
exports.NotificationController = NotificationController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_notification_dto_1.CreateNotificationDto]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "createNotification", null);
__decorate([
    (0, common_1.Post)('send'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_notification_dto_1.SendNotificationDto]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "sendNotification", null);
__decorate([
    (0, common_1.Post)('send/bulk'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [send_notification_dto_1.SendBulkNotificationDto]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "sendBulkNotification", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, notification_query_dto_1.NotificationQueryDto]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Get)('unread-count'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "getUnreadCount", null);
__decorate([
    (0, common_1.Put)(':id/mark'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, notification_query_dto_1.MarkNotificationDto]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "markNotification", null);
__decorate([
    (0, common_1.Put)('mark-all-read'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "markAllAsRead", null);
__decorate([
    (0, common_1.Put)('bulk-mark'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, notification_query_dto_1.BulkMarkNotificationDto]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "bulkMarkNotifications", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "deleteNotification", null);
__decorate([
    (0, common_1.Get)('preferences'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "getUserPreferences", null);
__decorate([
    (0, common_1.Put)('preferences/:type'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('type')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, notification_preference_dto_1.UpdateNotificationPreferenceDto]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "updateNotificationPreference", null);
__decorate([
    (0, common_1.Post)('preferences'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, notification_preference_dto_1.CreateNotificationPreferenceDto]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "createNotificationPreference", null);
exports.NotificationController = NotificationController = __decorate([
    (0, common_1.Controller)('notifications'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [notification_service_1.NotificationService])
], NotificationController);
//# sourceMappingURL=notification.controller.js.map