import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Entities
import { Notification } from './entities/notification.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { NotificationPreference } from './entities/notification-preference.entity';

// Services
import { NotificationService } from './services/notification.service';
import { RedisNotificationService } from './services/redis-notification.service';
import { NotificationEventService } from './services/notification-event.service';

// Controllers
import { NotificationController } from './controllers/notification.controller';
import { DebugController } from './controllers/debug.controller';

// Gateways
import { NotificationGateway } from './gateways/notification.gateway';

// Import other modules
import { ChatModule } from '../chat/chat.module';
import { UserModule } from '../user/user.module';
import { EmailService } from '../../common/services/email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationTemplate,
      NotificationPreference,
    ]),
    ChatModule, // Import for Redis service
    UserModule, // Import for User entity
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1d'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [NotificationController, DebugController],
  providers: [
    NotificationService,
    RedisNotificationService,
    NotificationEventService,
    NotificationGateway,
    EmailService,
  ],
  exports: [
    NotificationService,
    RedisNotificationService,
    NotificationEventService,
    NotificationGateway,
  ],
})
export class NotificationModule {}
