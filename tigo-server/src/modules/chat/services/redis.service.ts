import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private publisher: RedisClientType;
  private subscriber: RedisClientType;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    
    // Main client for general operations
    this.client = createClient({ url: redisUrl });
    await this.client.connect();

    // Publisher client for publishing messages
    this.publisher = createClient({ url: redisUrl });
    await this.publisher.connect();

    // Subscriber client for subscribing to messages
    this.subscriber = createClient({ url: redisUrl });
    await this.subscriber.connect();

    console.log('Redis clients connected successfully');
  }

  async onModuleDestroy() {
    await this.client?.quit();
    await this.publisher?.quit();
    await this.subscriber?.quit();
  }

  async publishMessage(channel: string, message: any): Promise<void> {
    try {
      const result = await this.publisher.publish(channel, JSON.stringify(message));
    } catch (error) {
      console.error('Error publishing message:', error);
      throw error;
    }
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    try {
      // Ensure subscriber is connected
      if (!this.subscriber || !this.subscriber.isReady) {
        console.log('Waiting for Redis subscriber to be ready...');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        if (!this.subscriber || !this.subscriber.isReady) {
          throw new Error('Redis subscriber is not ready');
        }
      }

      await this.subscriber.subscribe(channel, (message) => {
        try {
          const parsedMessage = JSON.parse(message);
          callback(parsedMessage);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });
    } catch (error) {
      console.error('Error subscribing to channel:', error);
      throw error;
    }
  }

  async unsubscribe(channel: string): Promise<void> {
    try {
      await this.subscriber.unsubscribe(channel);
    } catch (error) {
      console.error('Error unsubscribing from channel:', error);
      throw error;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(key, ttl, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }
    } catch (error) {
      console.error('Error setting key:', error);
      throw error;
    }
  }

  async get(key: string): Promise<any> {
    try {
      const value = await this.client.get(key);
      if (!value) return null;
      
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('Error getting key:', error);
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Error deleting key:', error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Error checking key existence:', error);
      throw error;
    }
  }

  async setUserOnline(userId: string): Promise<void> {
    await this.set(`user:${userId}:online`, true, 300); // 5 minutes TTL
  }

  async setUserOffline(userId: string): Promise<void> {
    await this.del(`user:${userId}:online`);
  }

  async isUserOnline(userId: string): Promise<boolean> {
    return await this.exists(`user:${userId}:online`);
  }

  async addUserToRoom(roomId: string, userId: string): Promise<void> {
    await this.client.sAdd(`room:${roomId}:users`, userId);
  }

  async removeUserFromRoom(roomId: string, userId: string): Promise<void> {
    await this.client.sRem(`room:${roomId}:users`, userId);
  }

  async getUsersInRoom(roomId: string): Promise<string[]> {
    return await this.client.sMembers(`room:${roomId}:users`);
  }
}
