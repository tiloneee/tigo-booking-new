import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../entities/transaction.entity';
import { BalanceSnapshot } from '../entities/balance-snapshot.entity';
import { User } from '../../user/entities/user.entity';
import { Role } from '../../user/entities/role.entity';
import { CreateTopupDto } from '../dto/create-topup.dto';
import { UpdateTransactionDto } from '../dto/update-transaction.dto';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { NotificationEventService } from '../../notification/services/notification-event.service';
import { RedisService } from '../../../common/services/redis.service';
import { BalanceUpdateEvent, BalanceEventType } from '../events/balance-update.event';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);
  private readonly BALANCE_CHANNEL = 'balance:updates';
  private readonly USER_BALANCE_PREFIX = 'balance:user:';
  private readonly BALANCE_CACHE_TTL = 3600; // 1 hour

  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,

    @InjectRepository(BalanceSnapshot)
    private balanceSnapshotRepository: Repository<BalanceSnapshot>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    private notificationEventService: NotificationEventService,
    private redisService: RedisService,
    private dataSource: DataSource,
  ) {}

  /**
   * Create a topup request (creates a pending transaction)
   */
  async createTopupRequest(
    userId: string,
    createTopupDto: CreateTopupDto,
  ): Promise<Transaction> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Create a pending transaction for the topup
    const transaction = this.transactionRepository.create({
      user_id: userId,
      type: TransactionType.TOPUP,
      amount: createTopupDto.amount,
      status: TransactionStatus.PENDING,
      description:
        createTopupDto.description || `Topup request for $${createTopupDto.amount}`,
    });

    await this.transactionRepository.save(transaction);

    const transactionWithUser = await this.transactionRepository.findOne({
      where: { id: transaction.id },
      relations: ['user'],
    });

    if (!transactionWithUser) {
      throw new NotFoundException('Transaction not found after creation');
    }

    // Send notification to the user who created the request
    if (transactionWithUser.user_id) {
      try {
        await this.notificationEventService.triggerTopupNotification(
          transactionWithUser.user_id,
          'TOPUP_REQUEST',
          'Topup Request Created',
          `Your topup request of $${transactionWithUser.amount} has been created and is pending approval.`,
          {
            transaction_id: transactionWithUser.id,
            amount: transactionWithUser.amount,
            created_at: transactionWithUser.created_at,
          },
        );
      } catch (error) {
        this.logger.error('Failed to send topup notification to user', error);
      }
    }

    // Send notifications to all admins about the new topup request
    try {
      const adminRole = await this.roleRepository.findOne({
        where: { name: 'Admin' },
        relations: ['users'],
      });

      if (adminRole && adminRole.users && adminRole.users.length > 0) {
        const userName = `${user.first_name} ${user.last_name}`;

        for (const admin of adminRole.users) {
          try {
            await this.notificationEventService.triggerTopupNotification(
              admin.id,
              'TOPUP_REQUEST',
              'New Topup Request',
              `${userName} has requested a topup of $${transactionWithUser.amount}. Please review and approve.`,
              {
                transaction_id: transactionWithUser.id,
                amount: transactionWithUser.amount,
                user_id: transactionWithUser.user_id,
                user_name: userName,
                created_at: transactionWithUser.created_at,
              },
            );
          } catch (error) {
            this.logger.error(
              `Failed to send notification to admin ${admin.id}`,
              error,
            );
          }
        }

        this.logger.log(
          `Sent topup request notifications to ${adminRole.users.length} admin(s)`,
        );
      } else {
        this.logger.warn('No admin users found to notify about topup request');
      }
    } catch (error) {
      this.logger.error('Failed to send notifications to admins', error);
    }

    return transactionWithUser;
  }

  /**
   * Get all transactions for a user
   */
  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Get all topup transactions (pending, approved, rejected)
   */
  async getAllTopupTransactions(): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { type: TransactionType.TOPUP },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Get pending topup transactions
   */
  async getPendingTopups(): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: {
        type: TransactionType.TOPUP,
        status: TransactionStatus.PENDING,
      },
      relations: ['user'],
      order: { created_at: 'ASC' },
    });
  }

  /**
   * Get a specific transaction by ID
   */
  async getTransactionById(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['user', 'processor'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  /**
   * Process a topup transaction (approve or reject)
   */
  async processTopup(
    transactionId: string,
    adminId: string,
    updateTransactionDto: UpdateTransactionDto,
  ): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = await queryRunner.manager.findOne(Transaction, {
        where: { id: transactionId },
        relations: ['user'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      if (transaction.status !== TransactionStatus.PENDING) {
        throw new BadRequestException(
          `Transaction has already been ${transaction.status}`,
        );
      }

      if (transaction.type !== TransactionType.TOPUP) {
        throw new BadRequestException(
          'Only topup transactions can be processed through this endpoint',
        );
      }

      transaction.status = updateTransactionDto.status;
      if (updateTransactionDto.admin_notes) {
        transaction.admin_notes = updateTransactionDto.admin_notes;
      }
      transaction.processed_by = adminId;

      // If approved, update the balance snapshot
      if (updateTransactionDto.status === TransactionStatus.SUCCESS) {
        // Get previous balance before update
        const previousSnapshot = await queryRunner.manager.findOne(BalanceSnapshot, {
          where: { user_id: transaction.user_id },
        });
        const previousBalance = previousSnapshot?.current_balance || 0;

        await this.updateBalanceSnapshot(
          transaction.user_id,
          parseFloat(transaction.amount.toString()),
          queryRunner.manager,
        );

        await queryRunner.manager.save(transaction);
        await queryRunner.commitTransaction();

        // Get new balance after update
        const snapshot = await this.balanceSnapshotRepository.findOne({
          where: { user_id: transaction.user_id },
        });
        const newBalance = snapshot?.current_balance || 0;

        // Publish real-time balance update to Redis
        await this.publishBalanceUpdate(
          transaction.user_id,
          newBalance,
          transaction.id,
          TransactionType.TOPUP,
          parseFloat(transaction.amount.toString()),
          previousBalance,
        );

        // Publish transaction completed event
        await this.publishTransactionCompleted(
          transaction.user_id,
          transaction.id,
          TransactionType.TOPUP,
          parseFloat(transaction.amount.toString()),
          newBalance,
        );

        // Send approval notification to user
        try {
          await this.notificationEventService.triggerTopupNotification(
            transaction.user_id,
            'TOPUP_APPROVED',
            'Topup Request Approved',
            `Your topup request of $${transaction.amount} has been approved. Your new balance is $${newBalance}.${transaction.admin_notes ? ` Admin notes: ${transaction.admin_notes}` : ''}`,
            {
              transaction_id: transaction.id,
              amount: transaction.amount,
              new_balance: newBalance,
              admin_notes: transaction.admin_notes,
            },
          );
        } catch (error) {
          this.logger.error(
            `Failed to send approval notification for transaction ${transaction.id}:`,
            error,
          );
        }
      } else if (updateTransactionDto.status === TransactionStatus.FAILED) {
        await queryRunner.manager.save(transaction);
        await queryRunner.commitTransaction();

        // Publish transaction failed event
        await this.publishTransactionFailed(
          transaction.user_id,
          transaction.id,
          TransactionType.TOPUP,
        );

        // Send rejection notification to user
        try {
          await this.notificationEventService.triggerTopupNotification(
            transaction.user_id,
            'TOPUP_REJECTED',
            'Topup Request Rejected',
            `Your topup request of $${transaction.amount} has been rejected.${transaction.admin_notes ? ` Reason: ${transaction.admin_notes}` : ''}`,
            {
              transaction_id: transaction.id,
              amount: transaction.amount,
              admin_notes: transaction.admin_notes,
            },
          );
        } catch (error) {
          this.logger.error(
            `Failed to send rejection notification for transaction ${transaction.id}:`,
            error,
          );
        }
      } else {
        await queryRunner.manager.save(transaction);
        await queryRunner.commitTransaction();
      }

      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get user's current balance from snapshot
   */
  async getUserBalance(userId: string): Promise<number> {
    const snapshot = await this.balanceSnapshotRepository.findOne({
      where: { user_id: userId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!snapshot) {
      // Initialize snapshot if not exists
      await this.initializeBalanceSnapshot(userId);
      return 0;
    }

    return parseFloat(snapshot.current_balance.toString());
  }

  /**
   * Create a transaction (for booking payments, refunds, etc.)
   */
  async createTransaction(
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id: createTransactionDto.user_id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // For payments, check if user has sufficient balance
      if (
        createTransactionDto.amount < 0 &&
        createTransactionDto.type === TransactionType.BOOKING_PAYMENT
      ) {
        const currentBalance = await this.getUserBalance(
          createTransactionDto.user_id,
        );
        if (currentBalance < Math.abs(createTransactionDto.amount)) {
          throw new BadRequestException('Insufficient balance');
        }
      }

      // Get previous balance before update
      const previousSnapshot = await queryRunner.manager.findOne(BalanceSnapshot, {
        where: { user_id: createTransactionDto.user_id },
      });
      const previousBalance = previousSnapshot?.current_balance || 0;

      const transaction = queryRunner.manager.create(Transaction, {
        ...createTransactionDto,
        status: TransactionStatus.SUCCESS, // Auto-approve for system transactions
      });

      await queryRunner.manager.save(transaction);

      // Update balance snapshot
      await this.updateBalanceSnapshot(
        createTransactionDto.user_id,
        createTransactionDto.amount,
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();

      // Get new balance after update
      const snapshot = await this.balanceSnapshotRepository.findOne({
        where: { user_id: createTransactionDto.user_id },
      });
      const newBalance = snapshot?.current_balance || 0;

      // Publish real-time balance update to Redis
      await this.publishBalanceUpdate(
        createTransactionDto.user_id,
        newBalance,
        transaction.id,
        createTransactionDto.type,
        createTransactionDto.amount,
        previousBalance,
      );

      // Publish transaction completed event
      await this.publishTransactionCompleted(
        createTransactionDto.user_id,
        transaction.id,
        createTransactionDto.type,
        createTransactionDto.amount,
        newBalance,
      );

      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Deduct balance (create a negative transaction)
   */
  async deductBalance(
    userId: string,
    amount: number,
    type: TransactionType = TransactionType.BOOKING_PAYMENT,
    description?: string,
    referenceId?: string,
    referenceType?: string,
  ): Promise<Transaction> {
    return this.createTransaction({
      user_id: userId,
      type,
      amount: -Math.abs(amount), // Ensure negative
      description: description || `Balance deduction: $${amount}`,
      reference_id: referenceId,
      reference_type: referenceType,
    });
  }

  /**
   * Add balance (create a positive transaction)
   */
  async addBalance(
    userId: string,
    amount: number,
    type: TransactionType = TransactionType.REFUND,
    description?: string,
    referenceId?: string,
    referenceType?: string,
  ): Promise<Transaction> {
    return this.createTransaction({
      user_id: userId,
      type,
      amount: Math.abs(amount), // Ensure positive
      description: description || `Balance addition: $${amount}`,
      reference_id: referenceId,
      reference_type: referenceType,
    });
  }

  /**
   * Initialize balance snapshot for a user
   */
  private async initializeBalanceSnapshot(userId: string): Promise<void> {
    const existingSnapshot = await this.balanceSnapshotRepository.findOne({
      where: { user_id: userId },
    });

    if (!existingSnapshot) {
      const snapshot = this.balanceSnapshotRepository.create({
        user_id: userId,
        current_balance: 0,
      });
      await this.balanceSnapshotRepository.save(snapshot);
    }
  }

  /**
   * Update balance snapshot (must be called within a transaction)
   */
  private async updateBalanceSnapshot(
    userId: string,
    amount: number,
    manager: any,
  ): Promise<void> {
    let snapshot = await manager.findOne(BalanceSnapshot, {
      where: { user_id: userId },
    });

    if (!snapshot) {
      snapshot = manager.create(BalanceSnapshot, {
        user_id: userId,
        current_balance: 0,
      });
    }

    const currentBalance = parseFloat(snapshot.current_balance.toString());
    snapshot.current_balance = currentBalance + amount;

    if (snapshot.current_balance < 0) {
      throw new BadRequestException(
        'Transaction would result in negative balance',
      );
    }

    await manager.save(snapshot);
    await this.clearBalanceCache(userId);
  }

  /**
   * Get balance snapshot for a user
   */
  async getBalanceSnapshot(userId: string): Promise<BalanceSnapshot> {
    let snapshot = await this.balanceSnapshotRepository.findOne({
      where: { user_id: userId },
      relations: ['user'],
    });

    if (!snapshot) {
      await this.initializeBalanceSnapshot(userId);
      snapshot = await this.balanceSnapshotRepository.findOne({
        where: { user_id: userId },
        relations: ['user'],
      });
    }

    if (!snapshot) {
      throw new NotFoundException('Balance snapshot not found');
    }

    return snapshot;
  }

  /**
   * Get all transactions
   */
  async getAllTransactions(): Promise<Transaction[]> {
    return this.transactionRepository.find({
      relations: ['user', 'processor'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Recalculate balance snapshot for a user from transaction history
   * Use this when snapshot is suspected to be incorrect
   */
  async recalculateBalanceSnapshot(userId: string): Promise<BalanceSnapshot> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verify user exists
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Calculate balance from successful transactions
      const result = await queryRunner.manager
        .createQueryBuilder(Transaction, 't')
        .select('COALESCE(SUM(t.amount), 0)', 'total')
        .where('t.user_id = :userId', { userId })
        .andWhere('t.status = :status', { status: TransactionStatus.SUCCESS })
        .getRawOne();

      const calculatedBalance = parseFloat(result.total) || 0;

      // Get or create snapshot with lock
      let snapshot = await queryRunner.manager.findOne(BalanceSnapshot, {
        where: { user_id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      const oldBalance = snapshot?.current_balance || 0;

      if (!snapshot) {
        snapshot = queryRunner.manager.create(BalanceSnapshot, {
          user_id: userId,
          current_balance: calculatedBalance,
        });
      } else {
        snapshot.current_balance = calculatedBalance;
      }

      await queryRunner.manager.save(snapshot);
      await queryRunner.commitTransaction();

      this.logger.log(
        `Recalculated balance for user ${userId}: Old=${oldBalance}, New=${calculatedBalance}, Difference=${calculatedBalance - parseFloat(oldBalance.toString())}`,
      );

      return snapshot;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to recalculate balance for user ${userId}`,
        error,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Recalculate balance snapshots for all users
   * Use this for maintenance or after data migration
   */
  async recalculateAllBalanceSnapshots(): Promise<{
    total: number;
    updated: number;
    errors: number;
    details: Array<{
      userId: string;
      oldBalance: number;
      newBalance: number;
      difference: number;
    }>;
  }> {
    const users = await this.userRepository.find();
    const result: {
      total: number;
      updated: number;
      errors: number;
      details: Array<{
        userId: string;
        oldBalance: number;
        newBalance: number;
        difference: number;
      }>;
    } = {
      total: users.length,
      updated: 0,
      errors: 0,
      details: [],
    };

    for (const user of users) {
      try {
        const oldSnapshot = await this.balanceSnapshotRepository.findOne({
          where: { user_id: user.id },
        });
        const oldBalance = oldSnapshot
          ? parseFloat(oldSnapshot.current_balance.toString())
          : 0;

        const newSnapshot = await this.recalculateBalanceSnapshot(user.id);
        const newBalance = parseFloat(newSnapshot.current_balance.toString());

        if (Math.abs(oldBalance - newBalance) > 0.01) {
          result.details.push({
            userId: user.id,
            oldBalance,
            newBalance,
            difference: newBalance - oldBalance,
          });
          result.updated++;
        }
      } catch (error) {
        this.logger.error(
          `Failed to recalculate balance for user ${user.id}`,
          error,
        );
        result.errors++;
      }
    }

    this.logger.log(
      `Balance recalculation completed: ${result.updated} updated, ${result.errors} errors out of ${result.total} users`,
    );

    return result;
  }

  /**
   * Verify balance snapshot accuracy for a user
   * Returns true if snapshot matches calculated balance
   */
  async verifyBalanceSnapshot(userId: string): Promise<{
    isAccurate: boolean;
    snapshotBalance: number;
    calculatedBalance: number;
    difference: number;
  }> {
    const snapshot = await this.balanceSnapshotRepository.findOne({
      where: { user_id: userId },
    });

    const snapshotBalance = snapshot
      ? parseFloat(snapshot.current_balance.toString())
      : 0;

    // Calculate from transactions
    const result = await this.transactionRepository
      .createQueryBuilder('t')
      .select('COALESCE(SUM(t.amount), 0)', 'total')
      .where('t.user_id = :userId', { userId })
      .andWhere('t.status = :status', { status: TransactionStatus.SUCCESS })
      .getRawOne();

    const calculatedBalance = parseFloat(result.total) || 0;
    const difference = calculatedBalance - snapshotBalance;
    const isAccurate = Math.abs(difference) < 0.01; // Allow for floating point precision

    return {
      isAccurate,
      snapshotBalance,
      calculatedBalance,
      difference,
    };
  }

  /**
   * Audit all balance snapshots and return discrepancies
   */
  async auditAllBalanceSnapshots(): Promise<{
    total: number;
    accurate: number;
    inaccurate: number;
    discrepancies: Array<{
      userId: string;
      userEmail: string;
      snapshotBalance: number;
      calculatedBalance: number;
      difference: number;
    }>;
  }> {
    const users = await this.userRepository.find();
    const result: {
      total: number;
      accurate: number;
      inaccurate: number;
      discrepancies: Array<{
        userId: string;
        userEmail: string;
        snapshotBalance: number;
        calculatedBalance: number;
        difference: number;
      }>;
    } = {
      total: users.length,
      accurate: 0,
      inaccurate: 0,
      discrepancies: [],
    };

    for (const user of users) {
      try {
        const verification = await this.verifyBalanceSnapshot(user.id);

        if (verification.isAccurate) {
          result.accurate++;
        } else {
          result.inaccurate++;
          result.discrepancies.push({
            userId: user.id,
            userEmail: user.email,
            snapshotBalance: verification.snapshotBalance,
            calculatedBalance: verification.calculatedBalance,
            difference: verification.difference,
          });
        }
      } catch (error) {
        this.logger.error(
          `Failed to verify balance for user ${user.id}`,
          error,
        );
      }
    }

    if (result.inaccurate > 0) {
      this.logger.warn(
        `Balance audit found ${result.inaccurate} discrepancies out of ${result.total} users`,
      );
    } else {
      this.logger.log(
        `Balance audit completed: All ${result.total} snapshots are accurate`,
      );
    }

    return result;
  }

  /**
   * Publish balance update to Redis for real-time updates
   */
  private async publishBalanceUpdate(
    userId: string,
    newBalance: number,
    transactionId?: string,
    transactionType?: TransactionType,
    amount?: number,
    previousBalance?: number,
  ): Promise<void> {
    try {
      // Update Redis cache
      const cacheKey = `${this.USER_BALANCE_PREFIX}${userId}`;
      await this.clearBalanceCache(userId);
      await this.redisService.set(cacheKey, newBalance, this.BALANCE_CACHE_TTL);

      // Publish event to Redis channel
      const event: BalanceUpdateEvent = {
        event: BalanceEventType.BALANCE_UPDATED,
        userId,
        newBalance,
        previousBalance,
        transactionId,
        transactionType: transactionType?.toString(),
        amount,
        timestamp: new Date().toISOString(),
      };

      await this.redisService.publishMessage(this.BALANCE_CHANNEL, event);
      
      this.logger.log(
        `Published balance update for user ${userId}: ${previousBalance ?? 'N/A'} -> ${newBalance}`,
      );
    } catch (error) {
      this.logger.error(`Failed to publish balance update for user ${userId}:`, error);
    }
  }

  /**
   * Publish transaction completed event
   */
  private async publishTransactionCompleted(
    userId: string,
    transactionId: string,
    transactionType: TransactionType,
    amount: number,
    newBalance: number,
  ): Promise<void> {
    try {
      const event: BalanceUpdateEvent = {
        event: BalanceEventType.TRANSACTION_COMPLETED,
        userId,
        newBalance,
        transactionId,
        transactionType: transactionType.toString(),
        amount,
        timestamp: new Date().toISOString(),
      };

      await this.redisService.publishMessage(this.BALANCE_CHANNEL, event);
      
      this.logger.log(
        `Published transaction completed event for user ${userId}: ${transactionType} of ${amount}`,
      );
    } catch (error) {
      this.logger.error(`Failed to publish transaction completed event:`, error);
    }
  }

  /**
   * Publish transaction failed event
   */
  private async publishTransactionFailed(
    userId: string,
    transactionId: string,
    transactionType: TransactionType,
  ): Promise<void> {
    try {
      const event: BalanceUpdateEvent = {
        event: BalanceEventType.TRANSACTION_FAILED,
        userId,
        newBalance: 0, // Will be ignored
        transactionId,
        transactionType: transactionType.toString(),
        timestamp: new Date().toISOString(),
      };

      await this.redisService.publishMessage(this.BALANCE_CHANNEL, event);
      
      this.logger.log(
        `Published transaction failed event for user ${userId}: ${transactionType}`,
      );
    } catch (error) {
      this.logger.error(`Failed to publish transaction failed event:`, error);
    }
  }

  /**
   * Get balance from cache or database
   */
  async getCachedBalance(userId: string): Promise<number> {
    try {
      // Try cache first
      const cacheKey = `${this.USER_BALANCE_PREFIX}${userId}`;
      const cachedBalance = await this.redisService.get(cacheKey);
      
      if (cachedBalance !== null) {
        return parseFloat(cachedBalance);
      }

      // Fetch from database
      const balance = await this.getUserBalance(userId);
      
      // Update cache
      await this.redisService.set(cacheKey, balance, this.BALANCE_CACHE_TTL);
      
      return balance;
    } catch (error) {
      this.logger.error(`Error getting cached balance for user ${userId}:`, error);
      // Fallback to database
      return this.getUserBalance(userId);
    }
  }

  /**
   * Clear balance cache for a user
   */
  private async clearBalanceCache(userId: string): Promise<void> {
    try {
      const cacheKey = `${this.USER_BALANCE_PREFIX}${userId}`;
      await this.redisService.del(cacheKey);
    } catch (error) {
      this.logger.error(`Failed to clear balance cache for user ${userId}:`, error);
    }
  }
}
