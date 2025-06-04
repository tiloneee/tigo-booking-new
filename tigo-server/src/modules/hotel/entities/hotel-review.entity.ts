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
import { User } from '../../user/entities/user.entity';

@Entity('hotel_reviews')
export class HotelReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Basic review info stub - will be completed in Part 4
  @Column({ type: 'int', width: 1 })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  // Relationships
  @ManyToOne(() => Hotel, hotel => hotel.reviews)
  @JoinColumn({ name: 'hotel_id' })
  hotel: Hotel;

  @Column()
  hotel_id: string;

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