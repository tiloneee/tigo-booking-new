# Redis Service Migration Guide

## Overview
The Redis service has been moved from the chat module to the common folder to improve maintainability and allow shared access across all modules.

## Changes Made

### 1. New Redis Service Location
**Old:** `src/modules/chat/services/redis.service.ts`  
**New:** `src/common/services/redis.service.ts`

### 2. Enhanced Redis Service Features

The new centralized Redis service includes:

#### Core Operations
- **Key-Value Operations**: `set`, `get`, `del`, `exists`, `keys`, `expire`
- **Pub/Sub Operations**: `publishMessage`, `subscribe`, `unsubscribe`
- **Hash Operations**: `hSet`, `hGet`, `hGetAll`, `hDel`
- **Set Operations**: `sAdd`, `sRem`, `sMembers`, `sIsMember`
- **List Operations**: `lPush`, `rPush`, `lRange`, `lTrim`

#### Chat-Specific Operations
- `setUserOnline(userId)` - Mark user as online with 5min TTL
- `setUserOffline(userId)` - Remove online status
- `isUserOnline(userId)` - Check if user is online
- `addUserToRoom(roomId, userId)` - Add user to chat room
- `removeUserFromRoom(roomId, userId)` - Remove user from room
- `getUsersInRoom(roomId)` - Get all users in a room

#### Utility Methods
- `ping()` - Health check
- `flushAll()` - Clear all data (use with caution)
- `getClient()`, `getPublisher()`, `getSubscriber()` - Direct client access

### 3. Common Module Created

A new **CommonModule** has been created as a Global module that exports:
- `RedisService`
- `EmailService`

**Location:** `src/common/common.module.ts`

```typescript
@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService, EmailService],
  exports: [RedisService, EmailService],
})
export class CommonModule {}
```

### 4. Updated Modules

#### App Module
Added `CommonModule` to imports for global availability.

```typescript
// src/app.module.ts
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule, // ✅ Added
    TypeOrmModule.forRootAsync({...}),
    // ... other modules
  ],
})
```

#### Chat Module
- **Removed:** `RedisService` from providers and exports
- **Why:** Now available globally through CommonModule
- **Updated Files:**
  - `chat.module.ts`
  - `chat.service.ts`
  - `chat.gateway.ts`
  - `chat.controller.ts`

#### Notification Module
- **Removed:** Circular dependency with ChatModule
- **Updated Files:**
  - `notification.module.ts`
  - `redis-notification.service.ts`
  - `notification-event.service.ts`

### 5. Import Path Changes

All imports have been updated from:
```typescript
// ❌ Old
import { RedisService } from '../services/redis.service';
import { RedisService } from '../../chat/services/redis.service';
```

To:
```typescript
// ✅ New
import { RedisService } from '../../../common/services/redis.service';
// Or using the index file:
import { RedisService } from '@common'; // (if path alias configured)
```

## Benefits

### 1. **Better Maintainability**
- Single source of truth for Redis operations
- Easier to add new features and fix bugs
- Consistent error handling and logging

### 2. **Reduced Coupling**
- Removed circular dependency between Chat and Notification modules
- Each module can use Redis independently

### 3. **Enhanced Features**
- Comprehensive Redis operations (hashes, sets, lists)
- Better logging with Logger
- More robust error handling

### 4. **Scalability**
- Easy to add new modules that need Redis
- Global availability through @Global() decorator
- No need to import/export through multiple modules

## Usage Examples

### Basic Key-Value Operations
```typescript
@Injectable()
export class SomeService {
  constructor(private readonly redisService: RedisService) {}

  async cacheData(key: string, data: any) {
    await this.redisService.set(key, data, 3600); // 1 hour TTL
  }

  async getCachedData(key: string) {
    return await this.redisService.get(key);
  }
}
```

### Pub/Sub Pattern
```typescript
// Publisher
await this.redisService.publishMessage('user:notifications', {
  userId: '123',
  message: 'New notification',
});

// Subscriber
await this.redisService.subscribe('user:notifications', (data) => {
  console.log('Received:', data);
});
```

### Chat Operations
```typescript
// Mark user online
await this.redisService.setUserOnline(userId);

// Add user to room
await this.redisService.addUserToRoom(roomId, userId);

// Check online status
const isOnline = await this.redisService.isUserOnline(userId);
```

### Hash Operations (for complex data)
```typescript
// Store user session
await this.redisService.hSet('session:123', 'userId', 'user-id');
await this.redisService.hSet('session:123', 'token', 'jwt-token');

// Get session data
const sessionData = await this.redisService.hGetAll('session:123');
```

## Migration Checklist for New Features

When adding Redis functionality to a new module:

1. ✅ **CommonModule is already globally available** - No need to import
2. ✅ Inject `RedisService` in your service constructor
3. ✅ Use the appropriate Redis operation methods
4. ✅ Follow the existing patterns for channel naming and key prefixes

### Example: Adding Redis to a New Module

```typescript
// new-module.service.ts
import { Injectable } from '@nestjs/common';
import { RedisService } from '../../common/services/redis.service';

@Injectable()
export class NewModuleService {
  constructor(private readonly redisService: RedisService) {}

  async doSomething() {
    // Redis is ready to use!
    await this.redisService.set('my:key', 'value');
  }
}
```

## Testing

The Redis service can be easily mocked in tests:

```typescript
const mockRedisService = {
  set: jest.fn(),
  get: jest.fn(),
  publishMessage: jest.fn(),
  subscribe: jest.fn(),
};

const module = await Test.createTestingModule({
  providers: [
    YourService,
    { provide: RedisService, useValue: mockRedisService },
  ],
}).compile();
```

## Environment Configuration

Ensure your `.env` file has:
```env
REDIS_URL=redis://localhost:6379
```

## Notes

- The old Redis service file in `src/modules/chat/services/redis.service.ts` can now be safely deleted
- All Redis connections are automatically managed (connect on init, disconnect on destroy)
- The service uses three separate Redis clients: main, publisher, and subscriber
- All operations include error handling and logging

## Future Improvements

Consider these enhancements:
1. Add Redis Cluster support for high availability
2. Implement connection pooling
3. Add metrics and monitoring
4. Create a Redis admin interface
5. Add transaction support with MULTI/EXEC

## Troubleshooting

### Redis Connection Issues
Check if Redis is running:
```bash
redis-cli ping
# Should return: PONG
```

### Module Import Issues
If you get "RedisService not found", ensure:
1. CommonModule is imported in AppModule
2. CommonModule is marked with @Global()
3. You're using the correct import path

### Circular Dependency Issues
If you encounter circular dependencies:
1. Ensure CommonModule doesn't import feature modules
2. Feature modules should only inject services, not import modules
