import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum NotificationType {
  CHAT_MESSAGE = 'CHAT_MESSAGE',
  NEW_BOOKING = 'NEW_BOOKING',
  BOOKING_CREATED = 'BOOKING_CREATED',
  BOOKING_CONFIRMATION = 'BOOKING_CONFIRMATION',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_REMINDER = 'BOOKING_REMINDER',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  HOTEL_APPROVED = 'HOTEL_APPROVED',
  HOTEL_REJECTED = 'HOTEL_REJECTED',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  TOPUP_REQUEST = 'TOPUP_REQUEST',
  TOPUP_APPROVED = 'TOPUP_APPROVED',
  TOPUP_REJECTED = 'TOPUP_REJECTED',
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
  })
  status: NotificationStatus;

  @Column('jsonb', { nullable: true })
  metadata: any;

  @Column('uuid')
  user_id: string;

  @ManyToOne(() => User, (user) => user.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  related_entity_type: string;

  @Column({ nullable: true })
  related_entity_id: string;

  @Column({ default: false })
  is_push_sent: boolean;

  @Column({ default: false })
  is_email_sent: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
