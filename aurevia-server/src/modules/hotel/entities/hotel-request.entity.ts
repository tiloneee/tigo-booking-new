import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum HotelRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('hotel_requests')
export class HotelRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column('text')
  description: string;

  @Column({ length: 500 })
  address: string;

  @Column({ length: 100 })
  city: string;

  @Column({ length: 100 })
  state: string;

  @Column({ length: 20 })
  zip_code: string;

  @Column({ length: 100 })
  country: string;

  @Column({ length: 20 })
  phone_number: string;

  @Column({
    type: 'enum',
    enum: HotelRequestStatus,
    default: HotelRequestStatus.PENDING,
  })
  status: HotelRequestStatus;

  @Column('uuid')
  requested_by_user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requested_by_user_id' })
  requested_by: User;

  @Column('uuid', { nullable: true })
  reviewed_by_user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reviewed_by_user_id' })
  reviewed_by: User;

  @Column('text', { nullable: true })
  admin_notes: string;

  @Column('uuid', { nullable: true })
  created_hotel_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
