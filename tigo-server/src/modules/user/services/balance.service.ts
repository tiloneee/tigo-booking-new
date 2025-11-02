import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BalanceTopup, TopupStatus } from '../entities/balance-topup.entity';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { CreateTopupDto } from '../dto/create-topup.dto';
import { UpdateTopupDto } from '../dto/update-topup.dto';
import { NotificationEventService } from './../../notification/services/notification-event.service';

@Injectable()
export class BalanceService {
    private readonly logger = new Logger(BalanceService.name);
    constructor(
        @InjectRepository(BalanceTopup)
        private topupRepository: Repository<BalanceTopup>,

        @InjectRepository(User)
        private userRepository: Repository<User>,

        @InjectRepository(Role)
        private roleRepository: Repository<Role>,

        private NotificationEventService: NotificationEventService,
    ) { }

    async createTopupRequest(
        userId: string,
        createTopupDto: CreateTopupDto,
    ): Promise<BalanceTopup> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['roles'],
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const topup = this.topupRepository.create({
            user_id: userId,
            amount: createTopupDto.amount,
            status: TopupStatus.PENDING,
        });
        await this.topupRepository.save(topup);

        const topupWithUser = await this.topupRepository.findOne({
            where: { id: topup.id },
            relations: ['user'],
        });

        if (!topupWithUser) {
            throw new NotFoundException('Topup request not found after creation');
        }

        // Send notification to the user who created the request
        if (topupWithUser.user_id) {
           try {
            await this.NotificationEventService.triggerTopupNotification(
                topupWithUser.user_id,
                'TOPUP_REQUEST',
                'Topup Request Created',
                `Your topup request of $${topupWithUser.amount} has been created and is pending approval.`,
                { 
                    topup_id: topupWithUser.id,
                    amount: topupWithUser.amount,
                    created_at: topupWithUser.created_at,
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
                
                // Send notification to each admin
                for (const admin of adminRole.users) {
                    try {
                        await this.NotificationEventService.triggerTopupNotification(
                            admin.id,
                            'TOPUP_REQUEST',
                            'New Topup Request',
                            `${userName} has requested a topup of $${topupWithUser.amount}. Please review and approve.`,
                            {
                                topup_id: topupWithUser.id,
                                amount: topupWithUser.amount,
                                user_id: topupWithUser.user_id,
                                user_name: userName,
                                created_at: topupWithUser.created_at,
                            },
                        );
                    } catch (error) {
                        this.logger.error(`Failed to send notification to admin ${admin.id}`, error);
                    }
                }
                
                this.logger.log(`Sent topup request notifications to ${adminRole.users.length} admin(s)`);
            } else {
                this.logger.warn('No admin users found to notify about topup request');
            }
        } catch (error) {
            this.logger.error('Failed to send notifications to admins', error);
        }
        
        return topupWithUser;
    }    async getUserTopups(userId: string): Promise<BalanceTopup[]> {
        return this.topupRepository.find({
            where: { user_id: userId },
            order: { created_at: 'DESC' },
        });
    }

    async getAllTopups(): Promise<BalanceTopup[]> {
        return this.topupRepository.find({
            relations: ['user'],
            order: { created_at: 'DESC' },
        });
    }

    async getPendingTopups(): Promise<BalanceTopup[]> {
        return this.topupRepository.find({
            where: { status: TopupStatus.PENDING },
            relations: ['user'],
            order: { created_at: 'ASC' },
        });
    }

    async getTopupById(id: string): Promise<BalanceTopup> {
        const topup = await this.topupRepository.findOne({
            where: { id },
            relations: ['user', 'processor'],
        });

        if (!topup) {
            throw new NotFoundException('Topup request not found');
        }

        return topup;
    }

    async processTopup(
        topupId: string,
        adminId: string,
        updateTopupDto: UpdateTopupDto,
    ): Promise<BalanceTopup> {
        const topup = await this.getTopupById(topupId);

        if (topup.status !== TopupStatus.PENDING) {
            throw new BadRequestException(
                `Topup request has already been ${topup.status}`,
            );
        }

        topup.status = updateTopupDto.status;
        if (updateTopupDto.admin_notes) {
            topup.admin_notes = updateTopupDto.admin_notes;
        }
        topup.processed_by = adminId;

        // If approved, add balance to user
        if (updateTopupDto.status === TopupStatus.APPROVED) {
            const user = await this.userRepository.findOne({
                where: { id: topup.user_id },
            });

            if (!user) {
                throw new NotFoundException('User not found');
            }

            const currentBalance = parseFloat(user.balance.toString());
            const topupAmount = parseFloat(topup.amount.toString());
            user.balance = currentBalance + topupAmount;

            await this.userRepository.save(user);

            // Send approval notification to user
            try {
                await this.NotificationEventService.triggerTopupNotification(
                    topup.user_id,
                    'TOPUP_APPROVED',
                    'Topup Request Approved',
                    `Your topup request of $${topup.amount} has been approved. Your new balance is $${user.balance}.${topup.admin_notes ? ` Admin notes: ${topup.admin_notes}` : ''}`,
                    {
                        topup_id: topup.id,
                        amount: topup.amount,
                        new_balance: user.balance,
                        admin_notes: topup.admin_notes,
                    },
                );
            } catch (error) {
                this.logger.error(
                    `Failed to send approval notification for topup ${topup.id}:`,
                    error,
                );
            }
        } else if (updateTopupDto.status === TopupStatus.REJECTED) {
            // Send rejection notification to user
            try {
                await this.NotificationEventService.triggerTopupNotification(
                    topup.user_id,
                    'TOPUP_REJECTED',
                    'Topup Request Rejected',
                    `Your topup request of $${topup.amount} has been rejected.${topup.admin_notes ? ` Reason: ${topup.admin_notes}` : ''}`,
                    {
                        topup_id: topup.id,
                        amount: topup.amount,
                        admin_notes: topup.admin_notes,
                    },
                );
            } catch (error) {
                this.logger.error(
                    `Failed to send rejection notification for topup ${topup.id}:`,
                    error,
                );
            }
        }

        return this.topupRepository.save(topup);
    }

    async getUserBalance(userId: string): Promise<number> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            select: ['balance'],
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return parseFloat(user.balance.toString());
    }

    async deductBalance(userId: string, amount: number): Promise<void> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const currentBalance = parseFloat(user.balance.toString());

        if (currentBalance < amount) {
            throw new BadRequestException('Insufficient balance');
        }

        user.balance = currentBalance - amount;
        await this.userRepository.save(user);
    }

    async addBalance(userId: string, amount: number): Promise<void> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const currentBalance = parseFloat(user.balance.toString());
        user.balance = currentBalance + amount;
        await this.userRepository.save(user);
    }
}
