-- Fix transactions table type column issue
-- This script handles the TypeORM enum migration issue

-- Step 1: Check current state
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'transactions' AND column_name = 'type';

-- Step 2: Check if enum type exists
SELECT typname FROM pg_type WHERE typname = 'transactions_type_enum';

-- Step 3: Drop the column if it exists and recreate with proper enum
DO $$
BEGIN
    -- Drop existing type column if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'type'
    ) THEN
        ALTER TABLE transactions DROP COLUMN type;
        RAISE NOTICE 'Dropped existing type column';
    END IF;

    -- Create enum type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transactions_type_enum') THEN
        CREATE TYPE transactions_type_enum AS ENUM (
            'topup',
            'booking_payment',
            'refund',
            'admin_adjustment'
        );
        RAISE NOTICE 'Created transactions_type_enum';
    END IF;

    -- Add the column back with NOT NULL constraint and default
    ALTER TABLE transactions 
    ADD COLUMN type transactions_type_enum NOT NULL DEFAULT 'admin_adjustment';
    
    RAISE NOTICE 'Added type column with NOT NULL constraint';
END $$;

-- Step 4: Verify the fix
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'transactions' AND column_name = 'type';

-- Step 5: Show current transactions
SELECT COUNT(*) as total_transactions, type, status
FROM transactions
GROUP BY type, status
ORDER BY type, status;
