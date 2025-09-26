import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller('debug')
@UseGuards(JwtAuthGuard)
export class DebugController {
  @Get('user')
  async getUser(@Request() req: any) {
    return {
      fullUser: req.user,
      id: req.user?.id,
      userId: req.user?.userId,
      sub: req.user?.sub,
      extractedUserId: req.user?.id || req.user?.userId || req.user?.sub,
    };
  }
}
