import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './services/redis.service';
import { EmailService } from './services/email.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService, EmailService],
  exports: [RedisService, EmailService],
})
export class CommonModule {}
