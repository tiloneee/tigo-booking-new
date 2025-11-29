-- Drop conflicting indexes
-- Note: Run this script against your PostgreSQL database before restarting the server

-- Drop indexes that might conflict with the new entity definitions
DROP INDEX IF EXISTS "IDX_8b2ce7d584da2ff659ab39d612";
DROP INDEX IF EXISTS "IDX_hotels_city";
DROP INDEX IF EXISTS "IDX_hotels_name";
DROP INDEX IF EXISTS "IDX_hotels_latitude";
DROP INDEX IF EXISTS "IDX_hotels_longitude";
DROP INDEX IF EXISTS "IDX_hotels_avg_rating";
DROP INDEX IF EXISTS "IDX_hotels_is_active";
DROP INDEX IF EXISTS "IDX_hotels_owner_id";
DROP INDEX IF EXISTS "IDX_hotels_created_at";

-- Drop room availability indexes
DROP INDEX IF EXISTS "IDX_room_availability_date";
DROP INDEX IF EXISTS "IDX_room_availability_price_per_night";
DROP INDEX IF EXISTS "IDX_room_availability_available_units";
DROP INDEX IF EXISTS "IDX_room_availability_status";
DROP INDEX IF EXISTS "IDX_room_availability_room_id";

-- You can now restart your NestJS application
-- The new composite indexes will be created automatically 