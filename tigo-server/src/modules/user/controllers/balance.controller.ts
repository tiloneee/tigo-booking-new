import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { BalanceService } from '../services/balance.service';
import { CreateTopupDto } from '../dto/create-topup.dto';
import { UpdateTopupDto } from '../dto/update-topup.dto';

@Controller('balance')
@UseGuards(JwtAuthGuard)
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Post('topup')
  createTopupRequest(@Request() req, @Body() createTopupDto: CreateTopupDto) {
    return this.balanceService.createTopupRequest(
      req.user.userId,
      createTopupDto,
    );
  }

  @Get('topup/my-requests')
  getMyTopups(@Request() req) {
    return this.balanceService.getUserTopups(req.user.userId);
  }

  @Get('current')
  getCurrentBalance(@Request() req) {
    return this.balanceService.getUserBalance(req.user.userId);
  }

  @Get('topup/pending')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  getPendingTopups() {
    return this.balanceService.getPendingTopups();
  }

  @Get('topup/all')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  getAllTopups() {
    return this.balanceService.getAllTopups();
  }

  @Get('topup/:id')
  getTopupById(@Param('id') id: string) {
    return this.balanceService.getTopupById(id);
  }

  @Patch('topup/:id/process')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  processTopup(
    @Param('id') id: string,
    @Request() req,
    @Body() updateTopupDto: UpdateTopupDto,
  ) {
    return this.balanceService.processTopup(id, req.user.userId, updateTopupDto);
  }
}
