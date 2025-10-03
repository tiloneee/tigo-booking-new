import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { NotificationService } from '../services/notification.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { SendNotificationDto, SendBulkNotificationDto } from '../dto/send-notification.dto';
import { 
  NotificationQueryDto, 
  MarkNotificationDto, 
  BulkMarkNotificationDto 
} from '../dto/notification-query.dto';
import { 
  UpdateNotificationPreferenceDto, 
  CreateNotificationPreferenceDto 
} from '../dto/notification-preference.dto';
import { NotificationType } from '../entities/notification.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  async createNotification(@Body() createDto: CreateNotificationDto) {
    return this.notificationService.createNotification(createDto);
  }

  @Post('send')
  async sendNotification(@Body() sendDto: SendNotificationDto) {
    return this.notificationService.sendNotification(sendDto);
  }

  @Post('send/bulk')
  @HttpCode(HttpStatus.OK)
  async sendBulkNotification(@Body() bulkDto: SendBulkNotificationDto) {
    await this.notificationService.sendBulkNotification(bulkDto);
    return { message: 'Bulk notifications sent successfully' };
  }

  @Get()
  async getNotifications(
    @Request() req: any,
    @Query() queryDto: NotificationQueryDto,
  ) {
    const userId = req.user?.id || req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    return this.notificationService.getNotifications(userId, queryDto);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const userId = req.user?.id || req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    const count = await this.notificationService.getUnreadCount(userId);
    return { count };
  }

  @Put(':id/mark')
  @HttpCode(HttpStatus.OK)
  async markNotification(
    @Request() req: any,
    @Param('id') notificationId: string,
    @Body() markDto: MarkNotificationDto,
  ) {
    const userId = req.user?.id || req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    await this.notificationService.markAsRead(userId, notificationId);
    return { message: 'Notification marked successfully' };
  }

  @Put('mark-all-read')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Request() req: any) {
    const userId = req.user?.id || req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    await this.notificationService.markAllAsRead(userId);
    return { message: 'All notifications marked as read' };
  }

  @Put('bulk-mark')
  @HttpCode(HttpStatus.OK)
  async bulkMarkNotifications(
    @Request() req: any,
    @Body() bulkMarkDto: BulkMarkNotificationDto,
  ) {
    const userId = req.user?.id || req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    await this.notificationService.bulkMarkNotifications(userId, bulkMarkDto);
    return { message: 'Notifications marked successfully' };
  }

  @Delete('delete-all')
  @HttpCode(HttpStatus.OK)
  async deleteAllNotifications(@Request() req: any) {
    const userId = req.user?.id || req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    await this.notificationService.deleteAllNotifications(userId);
    return { message: 'All notifications deleted successfully' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteNotification(
    @Request() req: any,
    @Param('id') notificationId: string,
  ) {
    const userId = req.user?.id || req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    await this.notificationService.deleteNotification(userId, notificationId);
    return { message: 'Notification deleted successfully' };
  }

  // Preference endpoints
  @Get('preferences')
  async getUserPreferences(@Request() req: any) {
    const userId = req.user?.id || req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    return this.notificationService.getAllUserPreferences(userId);
  }

  @Put('preferences/:type')
  async updateNotificationPreference(
    @Request() req: any,
    @Param('type') type: NotificationType,
    @Body() updateDto: UpdateNotificationPreferenceDto,
  ) {
    const userId = req.user?.id || req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    return this.notificationService.updateUserPreference(
      userId,
      type,
      updateDto,
    );
  }

  @Post('preferences')
  async createNotificationPreference(
    @Request() req: any,
    @Body() createDto: CreateNotificationPreferenceDto,
  ) {
    const userId = req.user?.id || req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new BadRequestException('User ID not found in request');
    }
    return this.notificationService.updateUserPreference(
      userId,
      createDto.type,
      createDto,
    );
  }
}
