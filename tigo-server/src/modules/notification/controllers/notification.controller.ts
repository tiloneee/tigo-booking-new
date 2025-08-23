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
    return this.notificationService.getNotifications(req.user.id, queryDto);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const count = await this.notificationService.getUnreadCount(req.user.id);
    return { count };
  }

  @Put(':id/mark')
  @HttpCode(HttpStatus.OK)
  async markNotification(
    @Request() req: any,
    @Param('id') notificationId: string,
    @Body() markDto: MarkNotificationDto,
  ) {
    await this.notificationService.markAsRead(req.user.id, notificationId);
    return { message: 'Notification marked successfully' };
  }

  @Put('mark-all-read')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Request() req: any) {
    await this.notificationService.markAllAsRead(req.user.id);
    return { message: 'All notifications marked as read' };
  }

  @Put('bulk-mark')
  @HttpCode(HttpStatus.OK)
  async bulkMarkNotifications(
    @Request() req: any,
    @Body() bulkMarkDto: BulkMarkNotificationDto,
  ) {
    await this.notificationService.bulkMarkNotifications(req.user.id, bulkMarkDto);
    return { message: 'Notifications marked successfully' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteNotification(
    @Request() req: any,
    @Param('id') notificationId: string,
  ) {
    await this.notificationService.deleteNotification(req.user.id, notificationId);
    return { message: 'Notification deleted successfully' };
  }

  // Preference endpoints
  @Get('preferences')
  async getUserPreferences(@Request() req: any) {
    return this.notificationService.getAllUserPreferences(req.user.id);
  }

  @Put('preferences/:type')
  async updateNotificationPreference(
    @Request() req: any,
    @Param('type') type: NotificationType,
    @Body() updateDto: UpdateNotificationPreferenceDto,
  ) {
    return this.notificationService.updateUserPreference(
      req.user.id,
      type,
      updateDto,
    );
  }

  @Post('preferences')
  async createNotificationPreference(
    @Request() req: any,
    @Body() createDto: CreateNotificationPreferenceDto,
  ) {
    return this.notificationService.updateUserPreference(
      req.user.id,
      createDto.type,
      createDto,
    );
  }
}
