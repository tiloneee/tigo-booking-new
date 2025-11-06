# Redis Service Architecture Diagram

## New Architecture (After Refactoring)

```
┌─────────────────────────────────────────────────────────────────┐
│                          AppModule                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              CommonModule (@Global)                         │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │           RedisService                                │  │ │
│  │  │  • Main Client                                        │  │ │
│  │  │  • Publisher Client                                   │  │ │
│  │  │  • Subscriber Client                                  │  │ │
│  │  │                                                        │  │ │
│  │  │  Operations:                                          │  │ │
│  │  │  ├─ Key-Value (set, get, del, exists)                │  │ │
│  │  │  ├─ Pub/Sub (publish, subscribe, unsubscribe)        │  │ │
│  │  │  ├─ Hash (hSet, hGet, hGetAll, hDel)                 │  │ │
│  │  │  ├─ Set (sAdd, sRem, sMembers, sIsMember)            │  │ │
│  │  │  ├─ List (lPush, rPush, lRange, lTrim)               │  │ │
│  │  │  └─ Chat Helpers (online, rooms)                     │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │                                                              │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │           EmailService                                │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Global Injection
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ ChatModule   │  │ Notification │  │ Other Modules│
    │              │  │   Module     │  │              │
    ├──────────────┤  ├──────────────┤  ├──────────────┤
    │ • Gateway    │  │ • Gateway    │  │ • Services   │
    │ • Service    │  │ • Service    │  │              │
    │ • Controller │  │ • Redis Svc  │  │              │
    └──────────────┘  └──────────────┘  └──────────────┘
         │                  │                  │
         └─────────┬────────┴──────────────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │   Redis Server      │
        │   localhost:6379    │
        └─────────────────────┘
```

## Old Architecture (Before Refactoring)

```
┌─────────────────────────────────────────────────────────────────┐
│                          AppModule                               │
│                                                                  │
│  ┌──────────────────────┐         ┌──────────────────────────┐ │
│  │   ChatModule         │         │  NotificationModule      │ │
│  │                      │         │                          │ │
│  │  ┌───────────────┐  │         │  ┌──────────────────┐    │ │
│  │  │ RedisService  │◄─┼─────────┼──┤ Uses ChatModule  │    │ │
│  │  │ (local)       │  │         │  │ for Redis        │    │ │
│  │  └───────────────┘  │         │  └──────────────────┘    │ │
│  │                      │         │                          │ │
│  │  Exports:            │         │  Imports:                │ │
│  │  • RedisService ─────┼────────►│  • ChatModule            │ │
│  └──────────────────────┘         └──────────────────────────┘ │
│                                                                  │
│  ❌ Problems:                                                   │
│  • Circular dependency risk                                     │
│  • RedisService tied to ChatModule                              │
│  • Hard to maintain                                             │
│  • Limited functionality                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### Chat Module - Real-time Messaging

```
┌──────────────┐
│   Client     │
└──────┬───────┘
       │ WebSocket
       ▼
┌──────────────┐     inject     ┌──────────────┐
│ ChatGateway  │───────────────►│ RedisService │
└──────┬───────┘                └──────┬───────┘
       │                               │
       │ publishMessage('chat:123')    │
       │                               ▼
       │                        ┌──────────────┐
       │                        │ Redis Server │
       │                        │   Pub/Sub    │
       │                        └──────┬───────┘
       │                               │
       │ subscribe('chat:123')         │
       │◄──────────────────────────────┘
       │
       ▼
┌──────────────┐
│   Client     │
└──────────────┘
```

### Notification Module - Real-time Notifications

```
┌──────────────┐
│ User Action  │
│ (Booking,    │
│  Payment)    │
└──────┬───────┘
       │
       ▼
┌─────────────────────┐     inject     ┌──────────────┐
│ NotificationService │───────────────►│ RedisService │
└─────────┬───────────┘                └──────┬───────┘
          │                                   │
          │ publishMessage('notif:userId')    │
          │                                   ▼
          │                            ┌──────────────┐
          │                            │ Redis Server │
          │                            │   Pub/Sub    │
          │                            └──────┬───────┘
          │                                   │
          ▼                                   │
┌─────────────────────┐                      │
│ Database            │                      │
│ (Persistent)        │                      │
└─────────────────────┘                      │
                                             │
                        subscribe('notif:userId')
                                             │
                                             ▼
                                   ┌──────────────────┐
                                   │ Client (WebSocket)│
                                   └──────────────────┘
```

## Service Dependency Graph

```
CommonModule (@Global)
├── RedisService
│   ├── Used by: ChatGateway
│   ├── Used by: ChatService
│   ├── Used by: ChatController
│   ├── Used by: NotificationGateway
│   ├── Used by: RedisNotificationService
│   ├── Used by: NotificationEventService
│   └── Available to: Any new service
└── EmailService
    ├── Used by: NotificationService
    └── Available to: Any new service
```

## Redis Key Structure

```
Redis Database
│
├── user:{userId}:online              (TTL: 5 min)
│   └── Tracks online status
│
├── user:{userId}:profile             (TTL: 1 hour)
│   └── Cached user profile data
│
├── room:{roomId}:users               (Set)
│   └── List of user IDs in chat room
│
├── chat:message:{messageId}          (Hash)
│   ├── content
│   ├── sender_id
│   ├── room_id
│   └── timestamp
│
├── notification:{userId}:recent      (TTL: 24 hours)
│   └── Recent notifications cache
│
├── notification:{userId}:unread      (No TTL)
│   └── Unread notification count
│
├── session:{sessionId}               (TTL: 1 day)
│   └── User session data
│
└── cache:{resource}:{id}             (TTL: varies)
    └── General purpose cache
```

## Redis Pub/Sub Channels

```
Pub/Sub Channels
│
├── notifications:{userId}
│   └── Real-time notifications for specific user
│
├── notifications:{userId}:count
│   └── Unread count updates
│
├── notifications:broadcast
│   └── System-wide notifications
│
├── chat:{roomId}
│   └── Chat messages for specific room
│
├── chat:typing:{roomId}
│   └── Typing indicators
│
├── user:status:{userId}
│   └── User online/offline status
│
└── notification:events
    └── System notification events
```

## Component Integration Flow

```
1. Application Startup
   │
   ├─► CommonModule initializes (@Global)
   │   ├─► RedisService.onModuleInit()
   │   │   ├─► Connect main client
   │   │   ├─► Connect publisher client
   │   │   └─► Connect subscriber client
   │   └─► EmailService initializes
   │
   ├─► ChatModule initializes
   │   ├─► ChatService (injects RedisService)
   │   ├─► ChatGateway (injects RedisService)
   │   └─► ChatController (injects RedisService)
   │
   ├─► NotificationModule initializes
   │   ├─► NotificationService
   │   ├─► RedisNotificationService (injects RedisService)
   │   ├─► NotificationEventService (injects RedisService)
   │   └─► NotificationGateway
   │
   └─► All services ready to use Redis!

2. During Application Runtime
   │
   ├─► User connects via WebSocket
   │   └─► ChatGateway.handleConnection()
   │       └─► redisService.setUserOnline(userId)
   │
   ├─► User sends message
   │   └─► ChatGateway.handleMessage()
   │       └─► redisService.publishMessage('chat:roomId', message)
   │
   ├─► System creates notification
   │   └─► NotificationService.create()
   │       ├─► Save to database
   │       └─► redisNotificationService.sendRealTimeNotification()
   │           └─► redisService.publishMessage('notifications:userId', notif)
   │
   └─► Cache operations
       └─► AnyService.getData()
           ├─► redisService.get('cache:key')
           ├─► If miss: fetch from DB
           └─► redisService.set('cache:key', data, ttl)

3. Application Shutdown
   │
   └─► CommonModule.onModuleDestroy()
       └─► RedisService.onModuleDestroy()
           ├─► client.quit()
           ├─► publisher.quit()
           └─► subscriber.quit()
```

## Benefits Visualization

```
Before:
Chat ─┐
      ├─► Redis Service (local) ─► Redis Server
Notification ─┘                       ↑
                                      │
❌ Tight coupling                     │
❌ Duplication                        │
❌ Hard to maintain                   │

After:
                  Common Module (Global)
                         │
                         ├─► Redis Service ─► Redis Server
                         │                       ↑
Chat ────────────────────┤                      │
Notification ────────────┤                      │
Transaction ─────────────┤                      │
Any New Module ──────────┘                      │
                                                │
✅ Loose coupling                               │
✅ Single source of truth                       │
✅ Easy to maintain                             │
✅ Enhanced functionality                       │
```
