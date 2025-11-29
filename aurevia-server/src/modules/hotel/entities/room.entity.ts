import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Hotel } from './hotel.entity';
import { RoomAvailability } from './room-availability.entity';
import { HotelBooking } from './hotel-booking.entity';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20 })
  room_number: string;

  @Column({ length: 100 })
  room_type: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  max_occupancy: number;

  @Column({ length: 200, nullable: true })
  bed_configuration: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  size_sqm: number;

  @Column({ default: true })
  is_active: boolean;

  // Relationships
  @ManyToOne(() => Hotel, (hotel) => hotel.rooms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @Column()
  hotel_id: string;

  @OneToMany(() => RoomAvailability, (availability) => availability.room, {
    cascade: true,
  })
  availability: RoomAvailability[];

  @OneToMany(() => HotelBooking, (booking) => booking.room)
  bookings: HotelBooking[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
