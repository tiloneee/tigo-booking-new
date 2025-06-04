import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne,
  JoinColumn,
  Unique
} from 'typeorm';
import { Room } from './room.entity';

@Entity('room_availability')
@Unique(['room_id', 'date']) // Prevent duplicate availability records for same room and date
export class RoomAvailability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price_per_night: number;

  @Column({ type: 'int' })
  available_units: number;

  @Column({ 
    type: 'enum', 
    enum: ['Available', 'Booked', 'Maintenance', 'Blocked'], 
    default: 'Available' 
  })
  status: string;

  @Column({ type: 'int', default: 0 })
  total_units: number;

  // Relationships
  @ManyToOne(() => Room, room => room.availability, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column()
  room_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 