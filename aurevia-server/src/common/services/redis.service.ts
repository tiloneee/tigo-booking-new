import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType;
  private publisher: RedisClientType;
  private subscriber: RedisClientType;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    
    try {
      // Main client for general operations
      this.client = createClient({ url: redisUrl });
      await this.client.connect();
      this.logger.log('Redis main client connected successfully');

      // Publisher client for publishing messages
      this.publisher = createClient({ url: redisUrl });
      await this.publisher.connect();
      this.logger.log('Redis publisher client connected successfully');

      // Subscriber client for subscribing to messages
      this.subscriber = createClient({ url: redisUrl });
      await this.subscriber.connect();
      this.logger.log('Redis subscriber client connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.client?.quit();
      await this.publisher?.quit();
      await this.subscriber?.quit();
      this.logger.log('Redis clients disconnected successfully');
    } catch (error) {
      this.logger.error('Error disconnecting Redis clients:', error);
    }
  }

  // ============= Pub/Sub Operations =============
  
  async publishMessage(channel: string, message: any): Promise<void> {
    try {
      const result = await this.publisher.publish(channel, JSON.stringify(message));
      this.logger.debug(`Published message to channel ${channel}, received by ${result} subscribers`);
    } catch (error) {
      this.logger.error(`Error publishing message to channel ${channel}:`, error);
      throw error;
    }
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    try {
      // Ensure subscriber is connected
      if (!this.subscriber || !this.subscriber.isReady) {
        this.logger.warn('Waiting for Redis subscriber to be ready...');
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
          this.logger.error(`Error parsing message from channel ${channel}:`, error);
        }
      });
      
      this.logger.log(`Subscribed to channel: ${channel}`);
    } catch (error) {
      this.logger.error(`Error subscribing to channel ${channel}:`, error);
      throw error;
    }
  }

  async unsubscribe(channel: string): Promise<void> {
    try {
      await this.subscriber.unsubscribe(channel);
      this.logger.log(`Unsubscribed from channel: ${channel}`);
    } catch (error) {
      this.logger.error(`Error unsubscribing from channel ${channel}:`, error);
      throw error;
    }
  }

  // ============= Key-Value Operations =============

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(key, ttl, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }
    } catch (error) {
      this.logger.error(`Error setting key ${key}:`, error);
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
      this.logger.error(`Error getting key ${key}:`, error);
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key ${key}:`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking key existence ${key}:`, error);
      throw error;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      this.logger.error(`Error getting keys with pattern ${pattern}:`, error);
      throw error;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.client.expire(key, seconds);
    } catch (error) {
      this.logger.error(`Error setting expiry for key ${key}:`, error);
      throw error;
    }
  }

  // ============= Hash Operations =============

  async hSet(key: string, field: string, value: any): Promise<void> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await this.client.hSet(key, field, stringValue);
    } catch (error) {
      this.logger.error(`Error setting hash field ${field} in key ${key}:`, error);
      throw error;
    }
  }

  async hGet(key: string, field: string): Promise<any> {
    try {
      const value = await this.client.hGet(key, field);
      if (!value) return null;
      
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      this.logger.error(`Error getting hash field ${field} from key ${key}:`, error);
      throw error;
    }
  }

  async hGetAll(key: string): Promise<Record<string, any>> {
    try {
      const result = await this.client.hGetAll(key);
      const parsed: Record<string, any> = {};
      
      for (const [field, value] of Object.entries(result)) {
        try {
          parsed[field] = JSON.parse(value);
        } catch {
          parsed[field] = value;
        }
      }
      
      return parsed;
    } catch (error) {
      this.logger.error(`Error getting all hash fields from key ${key}:`, error);
      throw error;
    }
  }

  async hDel(key: string, field: string): Promise<void> {
    try {
      await this.client.hDel(key, field);
    } catch (error) {
      this.logger.error(`Error deleting hash field ${field} from key ${key}:`, error);
      throw error;
    }
  }

  // ============= Set Operations =============

  async sAdd(key: string, member: string): Promise<void> {
    try {
      await this.client.sAdd(key, member);
    } catch (error) {
      this.logger.error(`Error adding member to set ${key}:`, error);
      throw error;
    }
  }

  async sRem(key: string, member: string): Promise<void> {
    try {
      await this.client.sRem(key, member);
    } catch (error) {
      this.logger.error(`Error removing member from set ${key}:`, error);
      throw error;
    }
  }

  async sMembers(key: string): Promise<string[]> {
    try {
      return await this.client.sMembers(key);
    } catch (error) {
      this.logger.error(`Error getting members from set ${key}:`, error);
      throw error;
    }
  }

  async sIsMember(key: string, member: string): Promise<boolean> {
    try {
      return await this.client.sIsMember(key, member);
    } catch (error) {
      this.logger.error(`Error checking membership in set ${key}:`, error);
      throw error;
    }
  }

  // ============= List Operations =============

  async lPush(key: string, value: any): Promise<void> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await this.client.lPush(key, stringValue);
    } catch (error) {
      this.logger.error(`Error pushing to list ${key}:`, error);
      throw error;
    }
  }

  async rPush(key: string, value: any): Promise<void> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await this.client.rPush(key, stringValue);
    } catch (error) {
      this.logger.error(`Error pushing to list ${key}:`, error);
      throw error;
    }
  }

  async lRange(key: string, start: number, stop: number): Promise<any[]> {
    try {
      const values = await this.client.lRange(key, start, stop);
      return values.map(value => {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      });
    } catch (error) {
      this.logger.error(`Error getting range from list ${key}:`, error);
      throw error;
    }
  }

  async lTrim(key: string, start: number, stop: number): Promise<void> {
    try {
      await this.client.lTrim(key, start, stop);
    } catch (error) {
      this.logger.error(`Error trimming list ${key}:`, error);
      throw error;
    }
  }

  // ============= Chat-Specific Operations =============

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

  // ============= Utility Methods =============

  async ping(): Promise<string> {
    try {
      return await this.client.ping();
    } catch (error) {
      this.logger.error('Error pinging Redis:', error);
      throw error;
    }
  }

  async flushAll(): Promise<void> {
    try {
      await this.client.flushAll();
      this.logger.warn('Redis database flushed');
    } catch (error) {
      this.logger.error('Error flushing Redis database:', error);
      throw error;
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }

  getPublisher(): RedisClientType {
    return this.publisher;
  }

  getSubscriber(): RedisClientType {
    return this.subscriber;
  }
}
