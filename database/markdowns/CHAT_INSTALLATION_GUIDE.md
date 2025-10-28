# Chat System Redesign - Installation Guide

## Prerequisites
- PostgreSQL database running
- Redis running
- Node.js installed
- Backend and frontend projects set up

## Step-by-Step Installation

### 1. Backend Setup

```bash
# Navigate to backend
cd tigo-server

# No new dependencies needed - existing packages cover the changes

# Apply database migration
# Option A: Using psql
psql -U your_username -d your_database -f src/migrations/update-chat-rooms-user-to-user.sql

# Option B: Using a migration tool (adjust as needed)
# npm run migration:run

# Restart the server
npm run start:dev
```

### 2. Frontend Setup

```bash
# Navigate to frontend
cd aurevia-client

# Install required UI dependencies
npm install @radix-ui/react-scroll-area @radix-ui/react-avatar @radix-ui/react-separator date-fns

# Or using yarn
yarn add @radix-ui/react-scroll-area @radix-ui/react-avatar @radix-ui/react-separator date-fns

# Restart the development server
npm run dev
```

### 3. Verify Installation

#### Test Backend
```bash
# In tigo-server directory
curl http://localhost:3000/chat/health

# Expected response:
# {"status":"healthy","timestamp":"2025-10-27T..."}
```

#### Test Frontend
1. Open browser to `http://localhost:3001`
2. Navigate to any booking details page
3. Chat interface should appear

### 4. Database Migration Details

The migration will:
- ✅ Remove the `type` enum column
- ✅ Add `booking_id` column
- ✅ Update indexes
- ✅ Add foreign key constraint

**Before Migration:**
```sql
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY,
  type VARCHAR(50) NOT NULL,  -- This will be removed
  participant1_id UUID NOT NULL,
  participant2_id UUID NOT NULL,
  hotel_id UUID,
  ...
);
```

**After Migration:**
```sql
CREATE TABLE chat_rooms (
  id UUID PRIMARY KEY,
  participant1_id UUID NOT NULL,
  participant2_id UUID NOT NULL,
  booking_id UUID,  -- This is new
  hotel_id UUID,
  ...
);
```

### 5. Environment Variables

Ensure these are set in your `.env` files:

**Backend (tigo-server/.env)**
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=your_user
DATABASE_PASSWORD=your_password
DATABASE_NAME=your_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=1d

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3001
```

**Frontend (aurevia-client/.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 6. Common Issues & Solutions

#### Issue: Migration fails with "column type does not exist"
**Solution**: The column was already removed or never existed. Skip this part of migration.

#### Issue: WebSocket connection fails
**Solution**: 
1. Check Redis is running: `redis-cli ping`
2. Verify CORS settings in backend
3. Check browser console for errors

#### Issue: UI components not found
**Solution**: 
```bash
cd aurevia-client
npm install @radix-ui/react-scroll-area @radix-ui/react-avatar @radix-ui/react-separator
```

#### Issue: Notifications not working
**Solution**:
1. Verify Redis is running
2. Check notification module is imported in app.module.ts
3. Check Redis subscription in chat gateway logs

### 7. Testing the Chat System

#### Test 1: Create Chat from Booking
```typescript
// In your booking creation flow
import { createChatRoomFromBooking } from "@/lib/api/chat"

const booking = await createBooking(bookingData)
const chatRoom = await createChatRoomFromBooking(booking.id)
console.log('Chat room created:', chatRoom)
```

#### Test 2: Send a Message
```typescript
import { sendMessage } from "@/lib/api/chat"

await sendMessage({
  chat_room_id: chatRoom.id,
  content: "Hello! I have a question about my booking.",
  type: "text"
})
```

#### Test 3: Real-time Updates
1. Open booking page in two browser windows
2. Login as customer in one, hotel owner in other
3. Send message from one window
4. Should appear instantly in both windows

### 8. Rollback (If Needed)

If you need to rollback the changes:

```sql
-- Rollback migration
ALTER TABLE chat_rooms ADD COLUMN type VARCHAR(50);
UPDATE chat_rooms SET type = 'customer_hotel_owner'; -- Set default
ALTER TABLE chat_rooms ALTER COLUMN type SET NOT NULL;

-- Remove booking_id
ALTER TABLE chat_rooms DROP COLUMN booking_id;

-- Restore old index
DROP INDEX IF EXISTS "IDX_chat_rooms_participant1_participant2";
CREATE UNIQUE INDEX "IDX_chat_rooms_participant1_participant2_type" 
ON chat_rooms (participant1_id, participant2_id, type);
```

Then revert code changes using git:
```bash
git checkout HEAD~1 -- tigo-server/src/modules/chat
git checkout HEAD~1 -- aurevia-client/lib/api/chat.ts
git checkout HEAD~1 -- aurevia-client/components/chat/booking-chat.tsx
```

## Verification Checklist

- [ ] Database migration applied successfully
- [ ] Backend server starts without errors
- [ ] Frontend builds without errors
- [ ] Can access `/chat/health` endpoint
- [ ] Can create chat room from booking
- [ ] Can send and receive messages
- [ ] Real-time updates work via WebSocket
- [ ] Notifications are sent for new messages
- [ ] UI components render correctly
- [ ] Mobile view is responsive

## Next Steps

After installation:
1. Test chat creation from your booking flow
2. Customize chat UI to match your design
3. Add additional features (file upload, typing indicators, etc.)
4. Configure notification preferences
5. Add chat to mobile app (if applicable)

## Support

For issues, check:
- **Backend Logs**: tigo-server terminal
- **Frontend Logs**: Browser DevTools console
- **Database**: Check chat_rooms and chat_messages tables
- **Redis**: Monitor with `redis-cli MONITOR`

## Resources

- [Documentation](./CHAT_REDESIGN_DOCUMENTATION.md)
- [WebSocket Events](./CHAT_REDESIGN_DOCUMENTATION.md#websocket-events)
- [API Reference](./CHAT_REDESIGN_DOCUMENTATION.md#api-endpoints)
