# Chat System Redesign - User-to-User Implementation

## Overview

The chat system has been redesigned from a role-based approach (customer-to-hotel-owner, customer-to-admin, etc.) to a simpler **user-to-user** chat system. This redesign makes the implementation easier, more flexible, and integrates seamlessly with the booking system.

## Key Changes

### Backend Changes

#### 1. **Database Schema Updates**
- **Removed**: `type` enum column (ChatRoomType)
- **Added**: `booking_id` column to link chats with bookings
- **Updated**: Unique index now uses only `participant1_id` and `participant2_id`
- **Migration**: See `tigo-server/src/migrations/update-chat-rooms-user-to-user.sql`

#### 2. **Entity Updates**
**File**: `tigo-server/src/modules/chat/entities/chat-room.entity.ts`
- Removed `ChatRoomType` enum
- Added `booking_id` and `booking` relation
- Simplified unique constraint

#### 3. **DTO Updates**
**Files**: 
- `tigo-server/src/modules/chat/dto/create-chat-room.dto.ts`
- `tigo-server/src/modules/chat/dto/chat-room-query.dto.ts`

Changes:
- Removed `type` field requirement
- Added optional `booking_id` field
- Simplified validation

#### 4. **Service Updates**
**File**: `tigo-server/src/modules/chat/services/chat.service.ts`

Key Changes:
- Removed role-based validation (`validateChatRoomType`)
- Added `createChatRoomFromBooking()` method for booking integration
- Simplified chat room creation logic
- Enhanced notification integration for new messages

#### 5. **Controller Updates**
**File**: `tigo-server/src/modules/chat/controllers/chat.controller.ts`

New Endpoint:
```typescript
POST /chat/rooms/from-booking/:bookingId
```
Creates or retrieves a chat room for a specific booking between the customer and hotel owner.

#### 6. **Module Updates**
**File**: `tigo-server/src/modules/chat/chat.module.ts`
- Added `HotelBooking` entity to TypeORM imports
- Enables booking-chat integration

### Frontend Changes

#### 1. **API Client**
**File**: `aurevia-client/lib/api/chat.ts`

New Functions:
- `createChatRoomFromBooking(bookingId)` - Create chat from booking
- `createOrGetChatRoom(data)` - General chat room creation
- `getChatRooms(params)` - Get user's chat rooms with filters
- `sendMessage(data)` - Send messages
- `getMessages(roomId, params)` - Get message history
- `markMessagesAsRead(roomId)` - Mark messages as read
- `deleteMessage(messageId)` - Delete a message

#### 2. **Booking Chat Component**
**File**: `aurevia-client/components/chat/booking-chat.tsx`

Features:
- Real-time messaging via Socket.IO
- Booking context display (hotel name, dates)
- Auto-scrolling to new messages
- Read receipts
- Online status indicator
- Optimistic UI updates
- Message timestamps

Usage:
```tsx
import BookingChat from "@/components/chat/booking-chat"

<BookingChat 
  bookingId="uuid"
  hotelName="Hotel Name"
  checkInDate="2025-11-01"
  checkOutDate="2025-11-05"
/>
```

#### 3. **UI Components**
Created missing Shadcn UI components:
- `components/ui/input.tsx`
- `components/ui/scroll-area.tsx`
- `components/ui/avatar.tsx`
- `components/ui/separator.tsx`

## Setup Instructions

### 1. Database Migration

Run the migration to update your database schema:

```bash
cd tigo-server
# Apply the migration (adjust based on your DB tool)
psql -U your_user -d your_database -f src/migrations/update-chat-rooms-user-to-user.sql
```

### 2. Install Frontend Dependencies

```bash
cd aurevia-client
npm install @radix-ui/react-scroll-area @radix-ui/react-avatar @radix-ui/react-separator date-fns
```

### 3. Restart Services

```bash
# Terminal 1 - Backend
cd tigo-server
npm run start:dev

# Terminal 2 - Frontend
cd aurevia-client
npm run dev
```

## Usage Examples

### Creating a Chat When Booking is Created

In your booking creation flow, automatically create a chat:

```typescript
// After successful booking creation
import { createChatRoomFromBooking } from "@/lib/api/chat"

try {
  const chatRoom = await createChatRoomFromBooking(bookingId)
  console.log('Chat room created:', chatRoom.id)
} catch (error) {
  console.error('Failed to create chat:', error)
}
```

### Displaying Chat in Booking Details Page

```tsx
import BookingChat from "@/components/chat/booking-chat"

export default function BookingDetailsPage({ booking }) {
  return (
    <div>
      {/* Booking details */}
      
      {/* Chat Section */}
      <div className="mt-8">
        <h2>Chat with Hotel Owner</h2>
        <BookingChat 
          bookingId={booking.id}
          hotelName={booking.hotel.name}
          checkInDate={booking.check_in_date}
          checkOutDate={booking.check_out_date}
        />
      </div>
    </div>
  )
}
```

## Notification Integration

### How It Works

When a new message is sent:
1. Message is saved to database
2. Real-time event sent via Socket.IO to connected users
3. Notification event published to Redis (`notification:events` channel)
4. Notification service picks up the event
5. Notification created and sent to recipient

### Notification Payload

```typescript
{
  type: 'CHAT_MESSAGE',
  user_id: recipientId,
  title: 'New message from John Doe',
  message: 'Message preview...',
  metadata: {
    chat_room_id: 'uuid',
    sender_id: 'uuid',
    message_id: 'uuid',
  },
  related_entity_type: 'chat_message',
  related_entity_id: 'uuid',
}
```

## API Endpoints

### Chat Rooms

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat/rooms` | Create or get chat room |
| POST | `/chat/rooms/from-booking/:bookingId` | Create chat from booking |
| GET | `/chat/rooms` | Get user's chat rooms |
| GET | `/chat/rooms/:roomId` | Get specific chat room |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat/messages` | Send a message |
| GET | `/chat/rooms/:roomId/messages` | Get messages |
| POST | `/chat/rooms/:roomId/read` | Mark as read |
| DELETE | `/chat/messages/:messageId` | Delete message |

### Query Parameters

**Get Chat Rooms**:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `participant_id` - Filter by participant
- `search` - Search by participant name
- `booking_id` - Filter by booking

**Get Messages**:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)
- `before` - Messages before timestamp
- `after` - Messages after timestamp

## WebSocket Events

### Client → Server
- `connection` - Initial connection
- `join_room` - Join a chat room
- `leave_room` - Leave a chat room

### Server → Client
- `connected` - Connection confirmed
- `new_message` - New message received
- `messages_read` - Messages marked as read
- `message_deleted` - Message deleted
- `error` - Error event

## Features

✅ **User-to-user messaging** - Any user can chat with any other user  
✅ **Booking integration** - Chats linked to bookings  
✅ **Real-time updates** - Via Socket.IO and Redis  
✅ **Notifications** - New message notifications  
✅ **Read receipts** - Track message read status  
✅ **Message history** - Paginated message loading  
✅ **Online status** - See when users are online  
✅ **Responsive UI** - Mobile-friendly chat interface  

## Benefits of User-to-User Design

1. **Simplicity**: No need to manage complex role-based chat types
2. **Flexibility**: Users can chat regardless of roles
3. **Scalability**: Easy to add new features (group chats, etc.)
4. **Better UX**: Booking context is shown directly in chat
5. **Easier Frontend**: No need to handle different chat types

## Next Steps

1. **Install dependencies** in frontend
2. **Run database migration**
3. **Test chat creation** from booking flow
4. **Verify notifications** are working
5. **Customize UI** to match your design system

## Troubleshooting

### Chat room not created
- Check database migration ran successfully
- Verify booking has valid hotel owner

### Real-time not working
- Ensure Redis is running
- Check WebSocket connection in browser console
- Verify JWT token is valid

### Notifications not sending
- Check Redis connection
- Verify notification module is properly configured
- Check Redis logs for notification events

## Support

For issues or questions, check:
- Backend logs: `tigo-server` terminal
- Frontend logs: Browser console
- Redis logs: Check notification events channel
