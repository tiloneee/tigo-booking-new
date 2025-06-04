import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne, 
  OneToMany, 
  ManyToMany, 
  JoinTable,
  JoinColumn
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Room } from './room.entity';
import { HotelBooking } from './hotel-booking.entity';
import { HotelReview } from './hotel-review.entity';
import { HotelAmenity } from './hotel-amenity.entity';

@Entity('hotels')
export class Hotel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text' })
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

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number | null;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.0 })
  avg_rating: number;

  @Column({ type: 'int', default: 0 })
  total_reviews: number;

  @Column({ default: true })
  is_active: boolean;

  // Relationships
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column()
  owner_id: string;

  @OneToMany(() => Room, room => room.hotel, { cascade: true })
  rooms: Room[];

  @OneToMany(() => HotelBooking, booking => booking.hotel)
  bookings: HotelBooking[];

  @OneToMany(() => HotelReview, review => review.hotel)
  reviews: HotelReview[];

  @ManyToMany(() => HotelAmenity, amenity => amenity.hotels)
  @JoinTable({
    name: 'hotel_amenity_mappings',
    joinColumn: { name: 'hotel_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'amenity_id', referencedColumnName: 'id' },
  })
  amenities: HotelAmenity[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 