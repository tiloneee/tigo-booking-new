# Chat System Redesign - Quick Reference

## 🚀 Quick Start

### 1. Install Dependencies (Frontend)
```bash
cd aurevia-client
npm install @radix-ui/react-scroll-area @radix-ui/react-avatar @radix-ui/react-separator date-fns
```

### 2. Run Database Migration
```bash
cd tigo-server
psql -U postgres -d your_database -f src/migrations/update-chat-rooms-user-to-user.sql
```

### 3. Restart Servers
```bash
# Terminal 1 - Backend
cd tigo-server
npm run start:dev

# Terminal 2 - Frontend  
cd aurevia-client
npm run dev
```

## 📋 Usage

### Basic Chat Implementation

```tsx
import BookingChat from "@/components/chat/booking-chat"

<BookingChat 
  bookingId="uuid"
  hotelName="Grand Hotel"
  checkInDate="2025-11-01"
  checkOutDate="2025-11-05"
/>
```

### Create Chat from Booking

```typescript
import { createChatRoomFromBooking } from "@/lib/api/chat"

const chatRoom = await createChatRoomFromBooking(bookingId)
```

### Send a Message

```typescript
import { sendMessage } from "@/lib/api/chat"

await sendMessage({
  chat_room_id: roomId,
  content: "Hello!",
  type: "text"
})
```

## 🔌 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/chat/rooms/from-booking/:id` | Create chat for booking |
| POST | `/chat/rooms` | Create/get chat room |
| GET | `/chat/rooms` | List user's chats |
| POST | `/chat/messages` | Send message |
| GET | `/chat/rooms/:id/messages` | Get messages |
| POST | `/chat/rooms/:id/read` | Mark as read |

## 🔔 Notifications

Notifications are **automatically sent** when:
- New message received
- User is offline or in different chat

Notification payload:
```json
{
  "type": "CHAT_MESSAGE",
  "title": "New message from John",
  "message": "Hello, I have a question...",
  "metadata": {
    "chat_room_id": "uuid",
    "sender_id": "uuid"
  }
}
```

## 🎨 Customization

### Change Chat Height
```tsx
<Card className="h-[800px]"> {/* Default: 600px */}
```

### Custom Message Styling
```tsx
// In booking-chat.tsx
className={`rounded-lg px-4 py-2 ${
  isOwnMessage 
    ? 'bg-blue-500 text-white'  // Your messages
    : 'bg-gray-200'              // Their messages
}`}
```

## 🐛 Debugging

### Check WebSocket Connection
```javascript
// Browser Console
socket.connected  // Should be true
```

### Test Redis
```bash
redis-cli ping  # Should return PONG
redis-cli MONITOR  # Watch real-time events
```

### View Notifications
```bash
# In Redis
redis-cli
> SUBSCRIBE notification:events
```

## 📊 Database Queries

### Get all chats for a user
```sql
SELECT * FROM chat_rooms 
WHERE participant1_id = 'user-uuid' 
   OR participant2_id = 'user-uuid';
```

### Get booking chats
```sql
SELECT * FROM chat_rooms 
WHERE booking_id IS NOT NULL;
```

### Get recent messages
```sql
SELECT * FROM chat_messages 
WHERE chat_room_id = 'room-uuid'
ORDER BY created_at DESC 
LIMIT 50;
```

## 🔧 Common Fixes

### "Cannot find module @radix-ui/..."
```bash
npm install @radix-ui/react-scroll-area @radix-ui/react-avatar @radix-ui/react-separator
```

### WebSocket not connecting
1. Check Redis: `redis-cli ping`
2. Verify CORS in backend
3. Check JWT token validity

### Messages not updating
1. Verify socket connection
2. Check browser console
3. Restart backend server

## 📱 Mobile Responsive

The chat UI is mobile-friendly by default:
- Stacks vertically on small screens
- Touch-friendly message input
- Optimized scrolling

## 🎯 Key Features

✅ Real-time messaging  
✅ Booking integration  
✅ Auto-notifications  
✅ Read receipts  
✅ Online status  
✅ Message history  
✅ Mobile responsive  
✅ Type safety (TypeScript)  

## 📚 Documentation Files

- **Full Guide**: `CHAT_REDESIGN_DOCUMENTATION.md`
- **Installation**: `CHAT_INSTALLATION_GUIDE.md`
- **Summary**: `CHAT_REDESIGN_SUMMARY.md`
- **This Guide**: `CHAT_QUICK_REFERENCE.md`

## ⚡ Pro Tips

1. **Always create chat from booking** - Use `createChatRoomFromBooking()` instead of manual creation
2. **Mark messages as read** - Call `markMessagesAsRead()` when user views chat
3. **Handle reconnection** - Socket.IO auto-reconnects, no extra code needed
4. **Optimize message loading** - Use pagination for large chat histories
5. **Test notifications** - Ensure Redis pub/sub is working

## 🎬 Next Steps

1. ✅ Install dependencies
2. ✅ Run migration
3. ✅ Test chat creation
4. ✅ Verify real-time updates
5. ✅ Check notifications
6. 🔜 Customize UI
7. 🔜 Add to mobile app
8. 🔜 Implement file uploads

---

**Need Help?** Check the full documentation or backend/frontend logs.
