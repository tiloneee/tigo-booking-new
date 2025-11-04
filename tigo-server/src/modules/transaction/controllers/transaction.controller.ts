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
import { TransactionService } from '../services/transaction.service';
import { CreateTopupDto } from '../dto/create-topup.dto';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('topup')
  createTopupRequest(@Request() req, @Body() createTopupDto: CreateTopupDto) {
    return this.transactionService.createTopupRequest(
      req.user.userId,
      createTopupDto,
    );
  }

  @Get('my-transactions')
  getMyTransactions(@Request() req) {
    return this.transactionService.getUserTransactions(req.user.userId);
  }

  @Get('balance')
  getCurrentBalance(@Request() req) {
    return this.transactionService.getUserBalance(req.user.userId);
  }

  @Get('balance/snapshot')
  getBalanceSnapshot(@Request() req) {
    return this.transactionService.getBalanceSnapshot(req.user.userId);
  }

  @Get('topup/pending')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  getPendingTopups() {
    return this.transactionService.getPendingTopups();
  }

  @Get('topup/all')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  getAllTopups() {
    return this.transactionService.getAllTopupTransactions();
  }

  @Get('all')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  getAllTransactions() {
    return this.transactionService.getAllTransactions();
  }

  @Get(':id')
  getTransactionById(@Param('id') id: string) {
    return this.transactionService.getTransactionById(id);
  }

  @Patch('topup/:id/process')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  processTopup(
    @Param('id') id: string,
    @Request() req,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionService.processTopup(
      id,
      req.user.userId,
      updateTransactionDto,
    );
  }

  @Post('recalculate/:userId')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  recalculateUserBalance(@Param('userId') userId: string) {
    return this.transactionService.recalculateBalanceSnapshot(userId);
  }

  @Post('recalculate-all')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  recalculateAllBalances() {
    return this.transactionService.recalculateAllBalanceSnapshots();
  }

  @Get('verify/:userId')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  verifyUserBalance(@Param('userId') userId: string) {
    return this.transactionService.verifyBalanceSnapshot(userId);
  }

  @Get('audit')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  auditAllBalances() {
    return this.transactionService.auditAllBalanceSnapshots();
  }
}
