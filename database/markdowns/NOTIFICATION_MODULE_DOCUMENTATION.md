# Notification Module Documentation

## Overview

The Notification Module is a comprehensive real-time notification system built for the Tigo Booking platform. It provides in-app notifications, email notifications, and real-time updates using Redis and WebSocket connections.

## Architecture

### Core Components

1. **Entities**
   - `Notification`: Main notification entity storing notification data
   - `NotificationTemplate`: Templates for different notification types
   - `NotificationPreference`: User preferences for notification settings

2. **Services**
   - `NotificationService`: Main service for CRUD operations
   - `RedisNotificationService`: Redis integration for real-time features
   - `NotificationEventService`: Event listener for cross-module notifications

3. **Controllers**
   - `NotificationController`: REST API endpoints for notifications

4. **Gateways**
   - `NotificationGateway`: WebSocket gateway for real-time notifications

## Notification Flow

### 1. Basic Notification Creation Flow

```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│   Event Source  │───▶│  NotificationService │───▶│   Database      │
│  (Chat, Hotel,  │    │                      │    │   (PostgreSQL)  │
│   Booking, etc.)│    │                      │    │                 │
└─────────────────┘    └──────────────────────┘    └─────────────────┘
                                 │
                                 ▼
                       ┌──────────────────────┐
                       │ RedisNotificationSvc │
                       │                      │
                       └──────────────────────┘
                                 │
                                 ▼
                       ┌──────────────────────┐
                       │   Redis Pub/Sub      │
                       │                      │
                       └──────────────────────┘
                                 │
                                 ▼
                       ┌──────────────────────┐
                       │ NotificationGateway  │
                       │    (WebSocket)       │
                       └──────────────────────┘
                                 │
                                 ▼
                       ┌──────────────────────┐
                       │   Client Browser     │
                       │   (Real-time UI)     │
                       └──────────────────────┘
```

### 2. Cross-Module Event Flow

```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Chat Module   │───▶│    Redis Pub/Sub     │───▶│ NotificationEvent   │
│                 │    │ notification:events  │    │     Service         │
└─────────────────┘    └──────────────────────┘    └─────────────────────┘
                                                              │
┌─────────────────┐    ┌──────────────────────┐              ▼
│  Hotel Module   │───▶│    Redis Pub/Sub     │    ┌─────────────────────┐
│                 │    │ notification:events  │    │ NotificationService │
└─────────────────┘    └──────────────────────┘    │                     │
                                                    └─────────────────────┘
┌─────────────────┐    ┌──────────────────────┐              │
│ Booking Module  │───▶│    Redis Pub/Sub     │              ▼
│                 │    │ notification:events  │    ┌─────────────────────┐
└─────────────────┘    └──────────────────────┘    │     Database        │
                                                    │   & Real-time       │
                                                    └─────────────────────┘
```

## Notification Types

The system supports the following notification types:

- `CHAT_MESSAGE`: New chat messages
- `BOOKING_CONFIRMATION`: Booking confirmed
- `BOOKING_CANCELLED`: Booking cancelled
- `BOOKING_REMINDER`: Booking reminders
- `REVIEW_RECEIVED`: New reviews received
- `HOTEL_APPROVED`: Hotel approval notifications
- `HOTEL_REJECTED`: Hotel rejection notifications
- `SYSTEM_ANNOUNCEMENT`: System-wide announcements
- `PAYMENT_SUCCESS`: Successful payments
- `PAYMENT_FAILED`: Failed payments

## API Endpoints

### Notification Management

#### Get Notifications
```http
GET /notifications?page=1&limit=20&type=CHAT_MESSAGE&status=UNREAD
Authorization: Bearer <jwt_token>
```

#### Get Unread Count
```http
GET /notifications/unread-count
Authorization: Bearer <jwt_token>
```

#### Mark Notification as Read
```http
PUT /notifications/{id}/mark
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "status": "READ"
}
```

#### Mark All as Read
```http
PUT /notifications/mark-all-read
Authorization: Bearer <jwt_token>
```

#### Send Notification
```http
POST /notifications/send
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "type": "CHAT_MESSAGE",
  "user_ids": ["user-uuid-1", "user-uuid-2"],
  "title": "New Message",
  "message": "You have received a new message",
  "metadata": {
    "chat_room_id": "room-uuid"
  }
}
```

### Notification Preferences

#### Get User Preferences
```http
GET /notifications/preferences
Authorization: Bearer <jwt_token>
```

#### Update Notification Preference
```http
PUT /notifications/preferences/CHAT_MESSAGE
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "in_app_enabled": true,
  "email_enabled": false,
  "push_enabled": true
}
```

## WebSocket Integration

### Connection
```javascript
const socket = io('ws://localhost:3000/notifications', {
  query: {
    token: 'your-jwt-token'
  }
});
```

### Event Listeners
```javascript
// New notification received
socket.on('new_notification', (notification) => {
  console.log('New notification:', notification);
  updateNotificationUI(notification);
});

// Unread count updated
socket.on('unread_count', ({ count }) => {
  console.log('Unread notifications:', count);
  updateNotificationBadge(count);
});

// Recent notifications on connect
socket.on('recent_notifications', (notifications) => {
  console.log('Recent notifications:', notifications);
  loadRecentNotifications(notifications);
});

// Broadcast notifications
socket.on('broadcast_notification', (notification) => {
  console.log('System announcement:', notification);
  showSystemNotification(notification);
});
```

### Emitting Events
```javascript
// Mark notification as read
socket.emit('mark_as_read', { notificationId: 'notification-uuid' });

// Get current unread count
socket.emit('get_unread_count');

// Join notification room (for group notifications)
socket.emit('join_room', { roomId: 'room-uuid' });
```

## Testing Guide

### Prerequisites

1. **Start Redis Server**
   ```bash
   # Using provided script
   cd tigo-server
   ./scripts/start-redis.sh
   
   # Or manually
   redis-server
   ```

2. **Database Setup**
   ```bash
   # Ensure PostgreSQL is running and configured
   # The notification entities will be auto-created due to synchronize: true
   ```

3. **Environment Variables**
   ```bash
   # Add to .env file
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-secret-key
   JWT_EXPIRES_IN=1d
   ```

### Manual Testing

#### 1. Test Notification Creation

```bash
# Start the server
npm run start:dev

# Create a notification via API
curl -X POST http://localhost:3000/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CHAT_MESSAGE",
    "user_id": "user-uuid",
    "title": "Test Notification",
    "message": "This is a test notification"
  }'
```

#### 2. Test Real-time Notifications

1. **Setup WebSocket Client**
   ```javascript
   // In browser console or test client
   const socket = io('ws://localhost:3000/notifications', {
     query: { token: 'your-jwt-token' }
   });
   
   socket.on('connect', () => console.log('Connected to notifications'));
   socket.on('new_notification', (data) => console.log('Received:', data));
   ```

2. **Trigger Chat Notification**
   ```bash
   # Send a chat message (this should trigger a notification)
   curl -X POST http://localhost:3000/chat/messages \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "chat_room_id": "room-uuid",
       "content": "Hello, this should trigger a notification!"
     }'
   ```

#### 3. Test Notification Preferences

```bash
# Get current preferences
curl -X GET http://localhost:3000/notifications/preferences \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Update preferences
curl -X PUT http://localhost:3000/notifications/preferences/CHAT_MESSAGE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "in_app_enabled": true,
    "email_enabled": false,
    "push_enabled": false
  }'
```

### Automated Testing

#### Unit Tests
```bash
# Run notification service tests
npm run test -- notification.service.spec.ts

# Run specific test suites
npm run test -- --testNamePattern="NotificationService"
```

#### Integration Tests
```bash
# Run e2e tests
npm run test:e2e

# Test notification endpoints
npm run test:e2e -- --testNamePattern="Notification"
```

### Monitoring and Debugging

#### Redis Monitoring
```bash
# Monitor Redis activity
cd tigo-server
npm run redis:monitor

# Check Redis connection
npm run redis:check

# Redis admin interface
npm run redis:admin
```

#### Log Analysis
```bash
# Check notification service logs
tail -f logs/notification.log

# Monitor WebSocket connections
tail -f logs/websocket.log
```

### Performance Testing

#### Load Testing WebSocket Connections
```javascript
// Basic load test script
const io = require('socket.io-client');

const numClients = 100;
const clients = [];

for (let i = 0; i < numClients; i++) {
  const client = io('ws://localhost:3000/notifications', {
    query: { token: 'test-token' }
  });
  
  client.on('connect', () => {
    console.log(`Client ${i} connected`);
  });
  
  client.on('new_notification', (data) => {
    console.log(`Client ${i} received notification:`, data.title);
  });
  
  clients.push(client);
}
```

## Troubleshooting

### Common Issues

1. **WebSocket Connection Fails**
   - Check JWT token validity
   - Verify CORS settings
   - Ensure server is running

2. **Notifications Not Received**
   - Check user preferences
   - Verify Redis connection
   - Check notification event publication

3. **Performance Issues**
   - Monitor Redis memory usage
   - Check database query performance
   - Optimize notification queries

### Debug Commands

```bash
# Check notification module status
curl -X GET http://localhost:3000/notifications/health

# Verify Redis connection
redis-cli ping

# Check notification counts
curl -X GET http://localhost:3000/notifications/unread-count \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Future Enhancements

1. **Push Notifications**: Mobile push notification support
2. **Email Templates**: Rich HTML email templates
3. **Notification Scheduling**: Schedule notifications for future delivery
4. **Analytics**: Notification delivery and engagement metrics
5. **Bulk Operations**: Improved bulk notification handling
6. **Rate Limiting**: Prevent notification spam

## Security Considerations

1. **Authentication**: All endpoints require valid JWT tokens
2. **Authorization**: Users can only access their own notifications
3. **Data Validation**: All inputs are validated using class-validator
4. **Rate Limiting**: Consider implementing rate limiting for notification creation
5. **Privacy**: Sensitive data should not be included in notification metadata

## Contributing

When contributing to the notification module:

1. Follow the existing code structure
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Consider performance implications
5. Test real-time functionality thoroughly

---

**Last Updated**: January 2025
**Version**: 1.0.0
