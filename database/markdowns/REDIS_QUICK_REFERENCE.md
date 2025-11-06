# Redis Service Quick Reference

## Import
```typescript
import { RedisService } from '../../common/services/redis.service';
// Or if using path alias:
import { RedisService } from '@common';
```

## Injection
```typescript
constructor(private readonly redisService: RedisService) {}
```

## Common Operations

### Key-Value Operations
```typescript
// Set with optional TTL (in seconds)
await redisService.set('key', 'value', 3600);

// Get
const value = await redisService.get('key');

// Delete
await redisService.del('key');

// Check exists
const exists = await redisService.exists('key');

// Set expiry
await redisService.expire('key', 3600);

// Get keys by pattern
const keys = await redisService.keys('user:*');
```

### Pub/Sub
```typescript
// Publish
await redisService.publishMessage('channel', { data: 'message' });

// Subscribe
await redisService.subscribe('channel', (message) => {
  console.log(message);
});

// Unsubscribe
await redisService.unsubscribe('channel');
```

### Hash Operations
```typescript
// Set hash field
await redisService.hSet('hash-key', 'field', 'value');

// Get hash field
const value = await redisService.hGet('hash-key', 'field');

// Get all fields
const all = await redisService.hGetAll('hash-key');

// Delete hash field
await redisService.hDel('hash-key', 'field');
```

### Set Operations
```typescript
// Add member
await redisService.sAdd('set-key', 'member');

// Remove member
await redisService.sRem('set-key', 'member');

// Get all members
const members = await redisService.sMembers('set-key');

// Check membership
const isMember = await redisService.sIsMember('set-key', 'member');
```

### List Operations
```typescript
// Push to left
await redisService.lPush('list-key', 'value');

// Push to right
await redisService.rPush('list-key', 'value');

// Get range
const values = await redisService.lRange('list-key', 0, -1);

// Trim list
await redisService.lTrim('list-key', 0, 99); // Keep first 100 items
```

### Chat-Specific Operations
```typescript
// User online status
await redisService.setUserOnline(userId);
await redisService.setUserOffline(userId);
const isOnline = await redisService.isUserOnline(userId);

// Room management
await redisService.addUserToRoom(roomId, userId);
await redisService.removeUserFromRoom(roomId, userId);
const users = await redisService.getUsersInRoom(roomId);
```

### Utility
```typescript
// Health check
await redisService.ping(); // Returns "PONG"

// Get raw clients (advanced usage)
const client = redisService.getClient();
const publisher = redisService.getPublisher();
const subscriber = redisService.getSubscriber();
```

## Key Naming Conventions

Use consistent prefixes for different data types:

```typescript
// User data
'user:{userId}:profile'
'user:{userId}:online'
'user:{userId}:preferences'

// Chat data
'room:{roomId}:users'
'room:{roomId}:messages'
'chat:message:{messageId}'

// Session data
'session:{sessionId}:data'

// Cache
'cache:{resource}:{id}'

// Notifications
'notification:{userId}:unread'
'notification:{userId}:recent'

// Channels (Pub/Sub)
'notifications:{userId}'
'chat:{roomId}'
'events:global'
```

## TTL Guidelines

Choose appropriate TTL values:

- **Short-lived (5-15 minutes)**: Online status, temporary locks
- **Medium (1-24 hours)**: Session data, cache
- **Long (1-7 days)**: User preferences, frequently accessed data
- **No TTL**: Persistent data that needs manual cleanup

```typescript
// Examples
await redisService.set('user:123:online', true, 300);      // 5 min
await redisService.set('cache:user:123', userData, 3600);  // 1 hour
await redisService.set('session:abc', sessionData, 86400); // 1 day
```

## Best Practices

1. **Always handle errors**
   ```typescript
   try {
     await redisService.set('key', 'value');
   } catch (error) {
     logger.error('Redis error:', error);
     // Fallback logic
   }
   ```

2. **Use meaningful key names**
   ```typescript
   // ✅ Good
   'user:123:profile'
   
   // ❌ Bad
   'u123p'
   ```

3. **Set appropriate TTLs**
   ```typescript
   // ✅ Good - prevents stale data
   await redisService.set('cache:data', data, 3600);
   
   // ❌ Bad - data never expires
   await redisService.set('cache:data', data);
   ```

4. **Batch operations when possible**
   ```typescript
   // ✅ Good
   const [user1, user2] = await Promise.all([
     redisService.get('user:1'),
     redisService.get('user:2'),
   ]);
   
   // ❌ Bad
   const user1 = await redisService.get('user:1');
   const user2 = await redisService.get('user:2');
   ```

5. **Clean up subscriptions**
   ```typescript
   // In onModuleDestroy
   async onModuleDestroy() {
     await this.redisService.unsubscribe('my-channel');
   }
   ```

## Common Patterns

### Cache-Aside Pattern
```typescript
async getUserData(userId: string) {
  // Try cache first
  const cached = await this.redisService.get(`cache:user:${userId}`);
  if (cached) return cached;
  
  // Fetch from DB
  const userData = await this.userRepository.findOne(userId);
  
  // Cache for 1 hour
  await this.redisService.set(`cache:user:${userId}`, userData, 3600);
  
  return userData;
}
```

### Rate Limiting
```typescript
async checkRateLimit(userId: string, limit: number = 10): Promise<boolean> {
  const key = `ratelimit:${userId}`;
  const current = await this.redisService.get(key) || 0;
  
  if (current >= limit) return false;
  
  await this.redisService.set(key, current + 1, 60); // 1 minute window
  return true;
}
```

### Distributed Lock
```typescript
async acquireLock(resource: string, ttl: number = 10): Promise<boolean> {
  const key = `lock:${resource}`;
  const value = Date.now().toString();
  
  // Try to acquire lock
  const result = await this.redisService.getClient().set(key, value, {
    NX: true, // Only set if not exists
    EX: ttl,
  });
  
  return result === 'OK';
}
```

### Recent Items List
```typescript
async addRecentItem(userId: string, itemId: string) {
  const key = `recent:${userId}`;
  
  // Add to front of list
  await this.redisService.lPush(key, itemId);
  
  // Keep only last 10 items
  await this.redisService.lTrim(key, 0, 9);
}
```

### Real-time Notifications
```typescript
async sendNotification(userId: string, notification: any) {
  // Store notification
  await this.redisService.lPush(
    `notifications:${userId}`,
    JSON.stringify(notification)
  );
  
  // Publish to real-time channel
  await this.redisService.publishMessage(
    `notifications:${userId}`,
    notification
  );
}
```
