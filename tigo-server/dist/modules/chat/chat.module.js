"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const chat_room_entity_1 = require("./entities/chat-room.entity");
const chat_message_entity_1 = require("./entities/chat-message.entity");
const hotel_booking_entity_1 = require("../hotel/entities/hotel-booking.entity");
const chat_service_1 = require("./services/chat.service");
const redis_service_1 = require("./services/redis.service");
const chat_controller_1 = require("./controllers/chat.controller");
const chat_gateway_1 = require("./gateways/chat.gateway");
const ws_jwt_auth_guard_1 = require("./guards/ws-jwt-auth.guard");
const user_module_1 = require("../user/user.module");
let ChatModule = class ChatModule {
};
exports.ChatModule = ChatModule;
exports.ChatModule = ChatModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([chat_room_entity_1.ChatRoom, chat_message_entity_1.ChatMessage, hotel_booking_entity_1.HotelBooking]),
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
        controllers: [chat_controller_1.ChatController],
        providers: [
            chat_service_1.ChatService,
            redis_service_1.RedisService,
            chat_gateway_1.ChatGateway,
            ws_jwt_auth_guard_1.WsJwtAuthGuard,
        ],
        exports: [chat_service_1.ChatService, redis_service_1.RedisService, chat_gateway_1.ChatGateway],
    })
], ChatModule);
//# sourceMappingURL=chat.module.js.map