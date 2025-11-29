import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Hotel } from './hotel.entity';
import { Room } from './room.entity';
import { User } from '../../user/entities/user.entity';

@Entity('hotel_bookings')
export class HotelBooking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Booking dates
  @Column({ type: 'date' })
  check_in_date: string;

  @Column({ type: 'date' })
  check_out_date: string;

  @Column({ type: 'int' })
  number_of_guests: number;

  @Column({ type: 'int', default: 1 })
  units_requested: number;

  // Pricing
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  paid_amount: number;

  // Guest information
  @Column({ length: 200, nullable: true })
  guest_name: string;

  @Column({ length: 20, nullable: true })
  guest_phone: string;

  @Column({ length: 100, nullable: true })
  guest_email: string;

  @Column({ type: 'text', nullable: true })
  special_requests: string;

  // Status tracking
  @Column({
    type: 'enum',
    enum: [
      'Pending',
      'Confirmed',
      'Cancelled',
      'Completed',
      'CheckedIn',
      'CheckedOut',
      'NoShow',
    ],
    default: 'Pending',
  })
  status: string;

  @Column({
    type: 'enum',
    enum: ['Pending', 'Paid', 'Refunded', 'PartialRefund', 'Failed'],
    default: 'Pending',
  })
  payment_status: string;

  // Additional booking details
  @Column({ type: 'text', nullable: true })
  cancellation_reason: string;

  @Column({ type: 'text', nullable: true })
  admin_notes: string;

  @Column({ type: 'timestamp', nullable: true })
  cancelled_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  confirmed_at: Date;

  // Relationships
  @ManyToOne(() => Hotel, (hotel) => hotel.bookings)
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @Column()
  hotel_id: string;

  @ManyToOne(() => Room, (room) => room.bookings)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column()
  room_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
