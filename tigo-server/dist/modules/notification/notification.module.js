"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const notification_entity_1 = require("./entities/notification.entity");
const notification_template_entity_1 = require("./entities/notification-template.entity");
const notification_preference_entity_1 = require("./entities/notification-preference.entity");
const notification_service_1 = require("./services/notification.service");
const redis_notification_service_1 = require("./services/redis-notification.service");
const notification_event_service_1 = require("./services/notification-event.service");
const notification_controller_1 = require("./controllers/notification.controller");
const debug_controller_1 = require("./controllers/debug.controller");
const notification_gateway_1 = require("./gateways/notification.gateway");
const chat_module_1 = require("../chat/chat.module");
const user_module_1 = require("../user/user.module");
const email_service_1 = require("../../common/services/email.service");
let NotificationModule = class NotificationModule {
};
exports.NotificationModule = NotificationModule;
exports.NotificationModule = NotificationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                notification_entity_1.Notification,
                notification_template_entity_1.NotificationTemplate,
                notification_preference_entity_1.NotificationPreference,
            ]),
            chat_module_1.ChatModule,
            user_module_1.UserModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    secret: configService.get('JWT_SECRET'),
                    signOptions: {
                        expiresIn: configService.get('JWT_EXPIRES_IN', '1d'),
                    },
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        controllers: [notification_controller_1.NotificationController, debug_controller_1.DebugController],
        providers: [
            notification_service_1.NotificationService,
            redis_notification_service_1.RedisNotificationService,
            notification_event_service_1.NotificationEventService,
            notification_gateway_1.NotificationGateway,
            email_service_1.EmailService,
        ],
        exports: [
            notification_service_1.NotificationService,
            redis_notification_service_1.RedisNotificationService,
            notification_event_service_1.NotificationEventService,
            notification_gateway_1.NotificationGateway,
        ],
    })
], NotificationModule);
//# sourceMappingURL=notification.module.js.map