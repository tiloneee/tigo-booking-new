-- Migration: Create Transaction System
-- This migration creates the new transaction and balance_snapshot tables
-- and migrates data from the old balance_topups table

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('topup', 'booking_payment', 'refund', 'admin_adjustment')),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
    description TEXT,
    admin_notes TEXT,
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reference_id UUID,
    reference_type VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference_id, reference_type);

-- Create balance_snapshots table
CREATE TABLE IF NOT EXISTS balance_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    current_balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for balance_snapshots
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_user_id ON balance_snapshots(user_id);

-- Migrate existing balance_topups to transactions
INSERT INTO transactions (
    id,
    user_id,
    type,
    amount,
    status,
    admin_notes,
    processed_by,
    created_at,
    updated_at
)
SELECT 
    id,
    user_id,
    'topup'::VARCHAR,
    amount,
    CASE 
        WHEN status = 'approved' THEN 'success'::VARCHAR
        WHEN status = 'rejected' THEN 'failed'::VARCHAR
        ELSE 'pending'::VARCHAR
    END,
    admin_notes,
    processed_by,
    created_at,
    updated_at
FROM balance_topups
WHERE NOT EXISTS (SELECT 1 FROM transactions WHERE transactions.id = balance_topups.id);

-- Initialize balance_snapshots for all users based on their current balance
INSERT INTO balance_snapshots (user_id, current_balance, created_at, last_updated)
SELECT 
    id,
    COALESCE(balance, 0),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM users
WHERE NOT EXISTS (SELECT 1 FROM balance_snapshots WHERE balance_snapshots.user_id = users.id);

-- Update balance_snapshots for users with approved topups
-- This recalculates based on successful transactions
UPDATE balance_snapshots bs
SET current_balance = (
    SELECT COALESCE(SUM(t.amount), 0)
    FROM transactions t
    WHERE t.user_id = bs.user_id
    AND t.status = 'success'
),
last_updated = CURRENT_TIMESTAMP
WHERE EXISTS (
    SELECT 1 FROM transactions t
    WHERE t.user_id = bs.user_id
    AND t.status = 'success'
);

-- Optional: Drop old balance_topups table (uncomment if you want to remove the old table)
-- DROP TABLE IF EXISTS balance_topups;

-- Optional: Remove balance column from users table (uncomment if you want to remove it)
-- ALTER TABLE users DROP COLUMN IF EXISTS balance;
