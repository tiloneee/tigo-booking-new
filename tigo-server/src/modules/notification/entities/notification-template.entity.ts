import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NotificationType } from './notification.entity';

@Entity('notification_templates')
export class NotificationTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    unique: true,
  })
  type: NotificationType;
  
  @Column()
  title_template: string;

  @Column('text')
  message_template: string;

  @Column('text', { nullable: true })
  email_template: string;

  @Column({ default: true })
  is_active: boolean;

  @Column('jsonb', { nullable: true })
  default_settings: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
