# Chat Module Documentation

## Overview

The Chat Module provides real-time messaging capabilities for the Tigo booking system, enabling communication between customers, hotel owners, and administrators. The module uses Redis for real-time pub/sub messaging and WebSocket connections for instant message delivery.

## Architecture

### Components

1. **Entities**
   - `ChatRoom`: Manages chat rooms between different user types
   - `ChatMessage`: Stores individual messages with metadata

2. **Services**
   - `ChatService`: Core business logic for chat operations
   - `RedisService`: Redis integration for real-time messaging and user presence

3. **Controllers**
   - `ChatController`: REST API endpoints for chat operations

4. **Gateways**
   - `ChatGateway`: WebSocket gateway for real-time communication

5. **DTOs**
   - Various DTOs for request validation and data transfer

## Supported Chat Types

The system supports three types of chat rooms:

1. **Customer ↔ Hotel Owner** (`CUSTOMER_HOTEL_OWNER`)
2. **Customer ↔ Admin** (`CUSTOMER_ADMIN`)
3. **Hotel Owner ↔ Admin** (`HOTEL_OWNER_ADMIN`)

## Database Schema

### Chat Rooms Table
```sql
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  participant1_id UUID NOT NULL,
  participant2_id UUID NOT NULL,
  hotel_id UUID,
  last_message_content TEXT,
  last_message_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (participant1_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (participant2_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (participant1_id, participant2_id, type)
);
```

### Chat Messages Table
```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY,
  chat_room_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text',
  status VARCHAR(20) DEFAULT 'sent',
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  metadata JSONB,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (chat_room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## API Endpoints

### REST API

#### Chat Rooms

- **POST /chat/rooms** - Create or get existing chat room
- **GET /chat/rooms** - Get user's chat rooms with pagination
- **GET /chat/rooms/:roomId** - Get specific chat room details

#### Messages

- **POST /chat/messages** - Send a message
- **GET /chat/rooms/:roomId/messages** - Get messages with pagination
- **POST /chat/rooms/:roomId/read** - Mark messages as read
- **DELETE /chat/messages/:messageId** - Delete a message

#### Utility

- **GET /chat/rooms/:roomId/online-users** - Get online users in room
- **GET /chat/health** - Health check endpoint

### WebSocket Events

#### Connection
- Connect to `/chat` namespace with JWT token
- Token can be provided via:
  - `Authorization: Bearer <token>` header
  - `token` query parameter

#### Client → Server Events

```javascript
// Join a chat room
socket.emit('join_room', { roomId: 'room-uuid' });

// Leave a chat room
socket.emit('leave_room', { roomId: 'room-uuid' });

// Send a message
socket.emit('send_message', {
  chat_room_id: 'room-uuid',
  content: 'Hello!',
  type: 'text' // optional
});

// Mark messages as read
socket.emit('mark_messages_read', { roomId: 'room-uuid' });

// Typing indicators
socket.emit('typing_start', { roomId: 'room-uuid' });
socket.emit('typing_stop', { roomId: 'room-uuid' });
```

#### Server → Client Events

```javascript
// Connection confirmation
socket.on('connected', (data) => {
  console.log('Connected:', data);
});

// Room join confirmation
socket.on('joined_room', (data) => {
  console.log('Joined room:', data.roomId);
});

// New message received
socket.on('new_message', (message) => {
  console.log('New message:', message);
});

// Messages marked as read
socket.on('messages_read', (data) => {
  console.log('Messages read by:', data.userId);
});

// Message deleted
socket.on('message_deleted', (data) => {
  console.log('Message deleted:', data.messageId);
});

// User typing indicator
socket.on('user_typing', (data) => {
  console.log('User typing:', data.userId, data.isTyping);
});

// Errors
socket.on('error', (error) => {
  console.error('Chat error:', error.message);
});
```

## Redis Integration

### Keys Used

- `user:{userId}:online` - User online status (TTL: 5 minutes)
- `room:{roomId}:users` - Set of users in a room

### Pub/Sub Channels

- `chat:events` - General chat events (messages, read status, deletions)

## Message Flow

### Sending a Message

1. User sends message via WebSocket or REST API
2. `ChatService.sendMessage()` validates and saves to database
3. Message published to Redis `chat:events` channel
4. All connected WebSocket clients in the room receive the message
5. Message delivery confirmation sent to sender

### Real-time Updates

1. Redis pub/sub broadcasts events to all server instances
2. WebSocket gateway receives Redis events and forwards to appropriate rooms
3. Connected clients receive updates instantly

## Authentication & Authorization

### JWT Authentication
- All endpoints require valid JWT token
- Token must contain user ID (`sub`) and roles
- WebSocket connections authenticated on connect

### Role-based Access Control
- Users can only create rooms where they are participants
- Admins have full access to all rooms
- Message deletion restricted to sender or admin
- Chat room type validation based on user roles

## Testing Guide

### Prerequisites

1. **Redis Server Running**
   ```bash
   # Start Redis (Docker)
   docker run -d -p 6379:6379 redis:alpine
   
   # Or use local Redis installation
   redis-server
   ```

2. **Environment Variables**
   ```env
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-secret-key
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=password
   DB_DATABASE=tigo_booking
   ```

3. **Database Setup**
   - Ensure PostgreSQL is running
   - Database migrations will run automatically (synchronize: true)

### Testing REST API

#### 1. Authentication Setup
First, get a JWT token by logging in through the auth endpoint:

```bash
# Login to get JWT token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password"
  }'
```

#### 2. Create Chat Room
```bash
# Create a customer-hotel owner chat room
curl -X POST http://localhost:3000/chat/rooms \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "customer_hotel_owner",
    "participant1_id": "customer-user-id",
    "participant2_id": "hotel-owner-id",
    "hotel_id": "hotel-id"
  }'
```

#### 3. Get Chat Rooms
```bash
# Get user's chat rooms
curl -X GET "http://localhost:3000/chat/rooms?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 4. Send Message
```bash
# Send a text message
curl -X POST http://localhost:3000/chat/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_room_id": "room-uuid",
    "content": "Hello, how can I help you?",
    "type": "text"
  }'
```

#### 5. Get Messages
```bash
# Get messages in a room
curl -X GET "http://localhost:3000/chat/rooms/ROOM_ID/messages?page=1&limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 6. Mark Messages as Read
```bash
# Mark messages as read
curl -X POST http://localhost:3000/chat/rooms/ROOM_ID/read \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Testing WebSocket Connection

#### JavaScript Client Example
```html
<!DOCTYPE html>
<html>
<head>
    <title>Chat Test</title>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
</head>
<body>
    <div id="messages"></div>
    <input type="text" id="messageInput" placeholder="Type a message...">
    <button onclick="sendMessage()">Send</button>

    <script>
        const token = 'YOUR_JWT_TOKEN';
        const socket = io('http://localhost:3000/chat', {
            auth: {
                token: token
            },
            extraHeaders: {
                Authorization: `Bearer ${token}`
            }
        });

        let currentRoomId = 'YOUR_ROOM_ID';

        socket.on('connect', () => {
            console.log('Connected to chat server');
            socket.emit('join_room', { roomId: currentRoomId });
        });

        socket.on('connected', (data) => {
            console.log('Chat connection confirmed:', data);
        });

        socket.on('joined_room', (data) => {
            console.log('Joined room:', data.roomId);
        });

        socket.on('new_message', (message) => {
            const messagesDiv = document.getElementById('messages');
            messagesDiv.innerHTML += `<div><b>${message.sender.first_name}:</b> ${message.content}</div>`;
        });

        socket.on('user_typing', (data) => {
            console.log(`User ${data.userId} is ${data.isTyping ? 'typing' : 'stopped typing'}`);
        });

        socket.on('error', (error) => {
            console.error('Chat error:', error);
        });

        function sendMessage() {
            const input = document.getElementById('messageInput');
            if (input.value.trim()) {
                socket.emit('send_message', {
                    chat_room_id: currentRoomId,
                    content: input.value,
                    type: 'text'
                });
                input.value = '';
            }
        }

        // Handle typing indicators
        let typingTimer;
        document.getElementById('messageInput').addEventListener('input', () => {
            socket.emit('typing_start', { roomId: currentRoomId });
            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => {
                socket.emit('typing_stop', { roomId: currentRoomId });
            }, 1000);
        });
    </script>
</body>
</html>
```

#### Node.js Client Example
```javascript
const io = require('socket.io-client');

const token = 'YOUR_JWT_TOKEN';
const socket = io('http://localhost:3000/chat', {
    auth: { token },
    extraHeaders: {
        Authorization: `Bearer ${token}`
    }
});

const roomId = 'YOUR_ROOM_ID';

socket.on('connect', () => {
    console.log('Connected to chat server');
    socket.emit('join_room', { roomId });
});

socket.on('connected', (data) => {
    console.log('Connection confirmed:', data);
});

socket.on('new_message', (message) => {
    console.log(`New message from ${message.sender.first_name}: ${message.content}`);
});

// Send a test message
setTimeout(() => {
    socket.emit('send_message', {
        chat_room_id: roomId,
        content: 'Hello from Node.js client!',
        type: 'text'
    });
}, 2000);
```

### Testing Scenarios

#### 1. Basic Chat Flow
1. Create two users with different roles
2. Create a chat room between them
3. Send messages from both users
4. Verify real-time message delivery
5. Mark messages as read
6. Verify read status updates

#### 2. Multi-User Room
1. Create a room with multiple participants
2. Connect multiple WebSocket clients
3. Send messages from different users
4. Verify all users receive messages
5. Test typing indicators

#### 3. Reconnection Testing
1. Connect to a chat room
2. Disconnect the client
3. Reconnect and verify automatic room rejoining
4. Send messages and verify delivery

#### 4. Permission Testing
1. Try to create rooms with wrong user roles
2. Attempt to access rooms without permission
3. Try to delete messages from other users
4. Verify proper error responses

#### 5. File Upload Testing
```bash
# Send message with file attachment
curl -X POST http://localhost:3000/chat/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_room_id": "room-uuid",
    "content": "Check out this file",
    "type": "file",
    "file_url": "https://example.com/file.pdf",
    "file_name": "document.pdf",
    "file_size": 1024000
  }'
```

### Health Check

```bash
# Check chat service health
curl -X GET http://localhost:3000/chat/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check if JWT token is valid
   - Verify token is included in headers or query params
   - Ensure server is running on correct port

2. **Messages Not Delivered**
   - Check Redis connection
   - Verify users are in the same room
   - Check server logs for errors

3. **Permission Denied**
   - Verify user roles are correctly assigned
   - Check if user is participant in the chat room
   - Ensure JWT token contains correct user data

4. **Database Errors**
   - Check PostgreSQL connection
   - Verify database schema is up to date
   - Check foreign key constraints

### Debugging

Enable debug logging:
```typescript
// In main.ts or app.module.ts
import { Logger } from '@nestjs/common';

const logger = new Logger('ChatModule');
logger.debug('Chat module debugging enabled');
```

### Performance Considerations

1. **Message Pagination**: Use appropriate page sizes for message history
2. **Redis TTL**: User online status expires after 5 minutes of inactivity
3. **Connection Limits**: Monitor WebSocket connection count
4. **Database Indexes**: Ensure proper indexes on frequently queried fields

## Future Enhancements

1. **Message Reactions**: Add emoji reactions to messages
2. **File Upload**: Integrate with file storage service
3. **Message Threading**: Support for message replies/threads
4. **Push Notifications**: Mobile push notifications for offline users
5. **Message Encryption**: End-to-end message encryption
6. **Chat Analytics**: Message statistics and analytics
7. **Chat Moderation**: Automated content filtering
8. **Voice Messages**: Support for audio messages
9. **Message Search**: Full-text search in chat history
10. **Chat Export**: Export chat history functionality

## Security Considerations

1. **Input Validation**: All inputs are validated using class-validator
2. **XSS Prevention**: Message content should be sanitized on frontend
3. **Rate Limiting**: Implement rate limiting for message sending
4. **File Upload Security**: Validate file types and scan for malware
5. **Message Retention**: Implement message retention policies
6. **Audit Logging**: Log all chat operations for compliance
7. **CORS Configuration**: Properly configure CORS for WebSocket connections

## Monitoring

### Metrics to Track

1. **Active Connections**: Number of WebSocket connections
2. **Message Volume**: Messages sent per minute/hour
3. **Response Times**: API response times
4. **Error Rates**: Failed message delivery rates
5. **Redis Performance**: Redis operation latency
6. **Database Performance**: Query execution times

### Alerts

Set up alerts for:
- High error rates (>5%)
- Slow response times (>1s)
- Redis connection failures
- Database connection issues
- High memory usage
- WebSocket connection limits

---

This documentation provides a comprehensive guide to the Chat Module implementation, testing procedures, and operational considerations.
