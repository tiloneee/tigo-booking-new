import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private client;
    private publisher;
    private subscriber;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    publishMessage(channel: string, message: any): Promise<void>;
    subscribe(channel: string, callback: (message: any) => void): Promise<void>;
    unsubscribe(channel: string): Promise<void>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    get(key: string): Promise<any>;
    del(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    setUserOnline(userId: string): Promise<void>;
    setUserOffline(userId: string): Promise<void>;
    isUserOnline(userId: string): Promise<boolean>;
    addUserToRoom(roomId: string, userId: string): Promise<void>;
    removeUserFromRoom(roomId: string, userId: string): Promise<void>;
    getUsersInRoom(roomId: string): Promise<string[]>;
}
