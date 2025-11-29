import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ChatMessage } from './chat-message.entity';
import { HotelBooking } from '../../hotel/entities/hotel-booking.entity';

@Entity('chat_rooms')
@Index(['participant1_id', 'participant2_id'], { unique: true })
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  participant1_id: string;

  @Column({ type: 'uuid' })
  participant2_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'participant1_id' })
  participant1: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'participant2_id' })
  participant2: User;

  // Link to booking if chat was initiated from a booking
  @Column({ type: 'uuid', nullable: true })
  booking_id: string;

  @ManyToOne(() => HotelBooking, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'booking_id' })
  booking: HotelBooking;

  @Column({ type: 'uuid', nullable: true })
  hotel_id: string;

  @Column({ type: 'text', nullable: true })
  last_message_content: string;

  @Column({ type: 'timestamp', nullable: true })
  last_message_at: Date;

  @Column({ default: true })
  is_active: boolean;

  @OneToMany(() => ChatMessage, (message) => message.chatRoom)
  messages: ChatMessage[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
