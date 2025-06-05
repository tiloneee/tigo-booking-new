import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Hotel } from './hotel.entity';
import { Room } from './room.entity';
import { User } from '../../user/entities/user.entity';

@Entity('hotel_bookings')
export class HotelBooking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Basic booking info stub - will be completed in Part 3
  @Column({ type: 'date' })
  check_in_date: string;

  @Column({ type: 'date' })
  check_out_date: string;

  @Column({ type: 'int' })
  number_of_guests: number;

  @Column({ 
    type: 'enum', 
    enum: ['Pending', 'Confirmed', 'Cancelled', 'Completed'], 
    enumName: 'hotel_booking_status_enum',
    default: 'Pending' 
  })
  status: string;

  // Relationships
  @ManyToOne(() => Hotel, hotel => hotel.bookings)
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @Column()
  hotel_id: string;

  @ManyToOne(() => Room, room => room.bookings)
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