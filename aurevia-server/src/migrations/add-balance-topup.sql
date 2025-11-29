-- Migration: Add balance to users and create balance_topups table
-- Run this migration to add balance tracking functionality

-- Add balance column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance DECIMAL(10, 2) DEFAULT 0;

-- Create balance_topups table
CREATE TABLE IF NOT EXISTS balance_topups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_balance_topups_user_id ON balance_topups(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_topups_status ON balance_topups(status);
CREATE INDEX IF NOT EXISTS idx_balance_topups_created_at ON balance_topups(created_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_balance_topups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_balance_topups_updated_at
    BEFORE UPDATE ON balance_topups
    FOR EACH ROW
    EXECUTE FUNCTION update_balance_topups_updated_at();
