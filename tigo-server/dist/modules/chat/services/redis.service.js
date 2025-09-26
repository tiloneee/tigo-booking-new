"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const redis_1 = require("redis");
let RedisService = class RedisService {
    configService;
    client;
    publisher;
    subscriber;
    constructor(configService) {
        this.configService = configService;
    }
    async onModuleInit() {
        const redisUrl = this.configService.get('REDIS_URL') || 'redis://localhost:6379';
        this.client = (0, redis_1.createClient)({ url: redisUrl });
        await this.client.connect();
        this.publisher = (0, redis_1.createClient)({ url: redisUrl });
        await this.publisher.connect();
        this.subscriber = (0, redis_1.createClient)({ url: redisUrl });
        await this.subscriber.connect();
        console.log('Redis clients connected successfully');
    }
    async onModuleDestroy() {
        await this.client?.quit();
        await this.publisher?.quit();
        await this.subscriber?.quit();
    }
    async publishMessage(channel, message) {
        try {
            const result = await this.publisher.publish(channel, JSON.stringify(message));
        }
        catch (error) {
            console.error('Error publishing message:', error);
            throw error;
        }
    }
    async subscribe(channel, callback) {
        try {
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
                }
                catch (error) {
                    console.error('Error parsing message:', error);
                }
            });
        }
        catch (error) {
            console.error('Error subscribing to channel:', error);
            throw error;
        }
    }
    async unsubscribe(channel) {
        try {
            await this.subscriber.unsubscribe(channel);
        }
        catch (error) {
            console.error('Error unsubscribing from channel:', error);
            throw error;
        }
    }
    async set(key, value, ttl) {
        try {
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            if (ttl) {
                await this.client.setEx(key, ttl, stringValue);
            }
            else {
                await this.client.set(key, stringValue);
            }
        }
        catch (error) {
            console.error('Error setting key:', error);
            throw error;
        }
    }
    async get(key) {
        try {
            const value = await this.client.get(key);
            if (!value)
                return null;
            try {
                return JSON.parse(value);
            }
            catch {
                return value;
            }
        }
        catch (error) {
            console.error('Error getting key:', error);
            throw error;
        }
    }
    async del(key) {
        try {
            await this.client.del(key);
        }
        catch (error) {
            console.error('Error deleting key:', error);
            throw error;
        }
    }
    async exists(key) {
        try {
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            console.error('Error checking key existence:', error);
            throw error;
        }
    }
    async setUserOnline(userId) {
        await this.set(`user:${userId}:online`, true, 300);
    }
    async setUserOffline(userId) {
        await this.del(`user:${userId}:online`);
    }
    async isUserOnline(userId) {
        return await this.exists(`user:${userId}:online`);
    }
    async addUserToRoom(roomId, userId) {
        await this.client.sAdd(`room:${roomId}:users`, userId);
    }
    async removeUserFromRoom(roomId, userId) {
        await this.client.sRem(`room:${roomId}:users`, userId);
    }
    async getUsersInRoom(roomId) {
        return await this.client.sMembers(`room:${roomId}:users`);
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map