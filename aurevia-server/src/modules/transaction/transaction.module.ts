import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Transaction } from './entities/transaction.entity';
import { BalanceSnapshot } from './entities/balance-snapshot.entity';
import { User } from '../user/entities/user.entity';
import { Role } from '../user/entities/role.entity';
import { TransactionService } from './services/transaction.service';
import { TransactionController } from './controllers/transaction.controller';
import { BalanceGateway } from './gateways/balance.gateway';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, BalanceSnapshot, User, Role]),
    NotificationModule,
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
  controllers: [TransactionController],
  providers: [TransactionService, BalanceGateway],
  exports: [TransactionService, BalanceGateway],
})
export class TransactionModule {}
