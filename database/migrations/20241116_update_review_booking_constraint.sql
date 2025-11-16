-- Migration: Update review constraints to allow one review per booking instead of one per user per hotel
-- Date: 2024-11-16
-- Description: Change unique constraint from (hotel_id, user_id) to booking_id and make booking_id required

-- Step 1: Drop the old unique constraint
ALTER TABLE hotel_reviews DROP CONSTRAINT IF EXISTS "UQ_hotel_reviews_hotel_id_user_id";
ALTER TABLE hotel_reviews DROP CONSTRAINT IF EXISTS "UQ_ab4be114893559c12206b292d5b"; -- Replace with actual constraint name if different

-- Step 2: Update existing reviews without booking_id (if any)
-- This sets booking_id to NULL for any existing reviews without it
-- You may need to handle this differently based on your data
-- For now, we'll just verify all reviews have booking_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM hotel_reviews WHERE booking_id IS NULL) THEN
    RAISE NOTICE 'Warning: Some reviews exist without booking_id. Please update them manually.';
  END IF;
END $$;

-- Step 3: Make booking_id NOT NULL
ALTER TABLE hotel_reviews ALTER COLUMN booking_id SET NOT NULL;

-- Step 4: Add unique constraint on booking_id
ALTER TABLE hotel_reviews ADD CONSTRAINT "UQ_hotel_reviews_booking_id" UNIQUE (booking_id);

-- Step 5: Add comment to document the change
COMMENT ON CONSTRAINT "UQ_hotel_reviews_booking_id" ON hotel_reviews IS 
  'Ensures each booking can only be reviewed once. Users can review the same hotel multiple times via different bookings.';
