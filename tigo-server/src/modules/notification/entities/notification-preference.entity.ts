import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Unique,
  } from 'typeorm';
  import { User } from '../../user/entities/user.entity';
  import { NotificationType } from './notification.entity';
  
  @Entity('notification_preferences')
  @Unique(['user_id', 'type'])
  export class NotificationPreference {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column('uuid')
    user_id: string;
  
    @ManyToOne(() => User, (user) => user.id, {
      onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;
  
    @Column({
      type: 'enum',
      enum: NotificationType,
    })
    type: NotificationType;
  
    @Column({ default: true })
    in_app_enabled: boolean;
  
    @Column({ default: true })
    email_enabled: boolean;
  
    @Column({ default: false })
    push_enabled: boolean;
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
  }