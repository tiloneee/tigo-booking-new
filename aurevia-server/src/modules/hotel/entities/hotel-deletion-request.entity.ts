import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Hotel } from './hotel.entity';

export enum HotelDeletionRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('hotel_deletion_requests')
@Index(['status'])
@Index(['hotel_id'])
@Index(['requested_by_user_id'])
export class HotelDeletionRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  hotel_id: string;

  @ManyToOne(() => Hotel, { eager: true })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @Column({ type: 'text' })
  reason: string;

  @Column({
    type: 'enum',
    enum: HotelDeletionRequestStatus,
    default: HotelDeletionRequestStatus.PENDING,
  })
  status: HotelDeletionRequestStatus;

  @Column({ nullable: true })
  requested_by_user_id: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'requested_by_user_id' })
  requested_by: User;

  @Column({ nullable: true })
  reviewed_by_user_id: string | null;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'reviewed_by_user_id' })
  reviewed_by: User | null;

  @Column({ type: 'text', nullable: true })
  admin_notes: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
