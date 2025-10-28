-- Migration: Update chat_rooms table for user-to-user chat
-- Date: 2025-10-27
-- Description: Remove type enum, add booking_id, update indexes for simpler user-to-user chat

-- Step 1: Drop existing constraint on unique index that includes 'type'
ALTER TABLE chat_rooms DROP CONSTRAINT IF EXISTS "UQ_chat_rooms_participant1_participant2_type";
DROP INDEX IF EXISTS "IDX_chat_rooms_participant1_participant2_type";

-- Step 2: Remove the type column (if using PostgreSQL with enum type)
-- First, drop the column
ALTER TABLE chat_rooms DROP COLUMN IF EXISTS type;

-- Step 3: Add booking_id column if it doesn't exist
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS booking_id UUID;

-- Step 4: Add foreign key constraint for booking_id
ALTER TABLE chat_rooms 
ADD CONSTRAINT fk_chat_rooms_booking 
FOREIGN KEY (booking_id) 
REFERENCES hotel_bookings(id) 
ON DELETE SET NULL;

-- Step 5: Create new unique index for participant pairs (order-independent will be handled by application)
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_chat_rooms_participant1_participant2" 
ON chat_rooms (participant1_id, participant2_id);

-- Step 6: Create index on booking_id for faster lookups
CREATE INDEX IF NOT EXISTS "IDX_chat_rooms_booking_id" 
ON chat_rooms (booking_id);

-- Step 7: Create index on hotel_id for faster lookups
CREATE INDEX IF NOT EXISTS "IDX_chat_rooms_hotel_id" 
ON chat_rooms (hotel_id);

-- Optional: Clean up any orphaned chat rooms (rooms without valid participants)
-- DELETE FROM chat_rooms 
-- WHERE participant1_id NOT IN (SELECT id FROM users) 
--    OR participant2_id NOT IN (SELECT id FROM users);

-- Note: The ChatRoomType enum can be dropped from the database if it's not used elsewhere
-- DROP TYPE IF EXISTS "chat_room_type_enum";
