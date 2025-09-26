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

export enum ChatRoomType {
  CUSTOMER_HOTEL_OWNER = 'customer_hotel_owner',
  CUSTOMER_ADMIN = 'customer_admin',
  HOTEL_OWNER_ADMIN = 'hotel_owner_admin',
}

@Entity('chat_rooms')
@Index(['participant1_id', 'participant2_id', 'type'], { unique: true })
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ChatRoomType,
  })
  type: ChatRoomType;

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
