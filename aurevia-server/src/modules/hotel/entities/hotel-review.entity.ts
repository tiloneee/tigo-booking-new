import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Hotel } from './hotel.entity';
import { HotelBooking } from './hotel-booking.entity';
import { User } from '../../user/entities/user.entity';

@Entity('hotel_reviews')
@Unique(['booking_id']) // Prevent multiple reviews for the same booking
export class HotelReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Main rating (1-5 stars)
  @Column({ type: 'int', width: 1 })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ length: 200, nullable: true })
  title: string;

  // Additional rating categories (optional)
  @Column({ type: 'int', width: 1, nullable: true })
  cleanliness_rating: number;

  @Column({ type: 'int', width: 1, nullable: true })
  location_rating: number;

  @Column({ type: 'int', width: 1, nullable: true })
  service_rating: number;

  @Column({ type: 'int', width: 1, nullable: true })
  value_rating: number;

  // Stay verification
  @Column({ default: false })
  is_verified_stay: boolean;

  @Column({ type: 'timestamp', nullable: true })
  stay_date: Date;

  // Moderation
  @Column({ default: true })
  is_approved: boolean;

  @Column({ type: 'text', nullable: true })
  moderation_notes: string;

  // Helpful votes
  @Column({ type: 'int', default: 0 })
  helpful_votes: number;

  @Column({ type: 'int', default: 0 })
  total_votes: number;

  // Relationships
  @ManyToOne(() => Hotel, (hotel) => hotel.reviews)
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @Column()
  hotel_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  @ManyToOne(() => HotelBooking, { nullable: false })
  @JoinColumn({ name: 'booking_id' })
  booking: HotelBooking;

  @Column()
  booking_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
