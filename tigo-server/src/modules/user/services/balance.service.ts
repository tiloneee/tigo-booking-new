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
import { CreateTopupDto } from '../dto/create-topup.dto';
import { UpdateTopupDto } from '../dto/update-topup.dto';
import { NotificationEventService } from './../../notification/services/notification-event.service';
import { create } from 'domain';

@Injectable()
export class BalanceService {
    private readonly logger = new Logger(BalanceService.name);
    constructor(
        @InjectRepository(BalanceTopup)
        private topupRepository: Repository<BalanceTopup>,

        @InjectRepository(User)
        private userRepository: Repository<User>,

        private NotificationEventService: NotificationEventService,
    ) { }

    async createTopupRequest(
        userId: string,
        createTopupDto: CreateTopupDto,
    ): Promise<BalanceTopup> {
        const user = await this.userRepository.findOne({
            where: { id: userId },
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
           }
              catch (error) {
                this.logger.error('Failed to send topup notification', error);
           }
        }
        
        return topupWithUser;
    }

    async getUserTopups(userId: string): Promise<BalanceTopup[]> {
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
