import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';
import { Hotel } from './hotel.entity';

@Entity('hotel_amenities')
export class HotelAmenity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 100, nullable: true })
  category: string;

  @Column({ length: 50, nullable: true })
  icon: string;

  @Column({ default: true })
  is_active: boolean;

  // Relationships
  @ManyToMany(() => Hotel, (hotel) => hotel.amenities)
  hotels: Hotel[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
