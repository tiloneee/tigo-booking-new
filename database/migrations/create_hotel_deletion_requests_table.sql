-- Create hotel_deletion_requests table
CREATE TABLE IF NOT EXISTS hotel_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    requested_by_user_id UUID,
    reviewed_by_user_id UUID,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_hotel_deletion_requests_hotel
        FOREIGN KEY (hotel_id)
        REFERENCES hotels(id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_hotel_deletion_requests_requester
        FOREIGN KEY (requested_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,
    
    CONSTRAINT fk_hotel_deletion_requests_reviewer
        FOREIGN KEY (reviewed_by_user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,
    
    -- Check constraint for status
    CONSTRAINT chk_hotel_deletion_request_status
        CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_hotel_deletion_requests_status 
    ON hotel_deletion_requests(status);

CREATE INDEX IF NOT EXISTS idx_hotel_deletion_requests_hotel_id 
    ON hotel_deletion_requests(hotel_id);

CREATE INDEX IF NOT EXISTS idx_hotel_deletion_requests_requester 
    ON hotel_deletion_requests(requested_by_user_id);

CREATE INDEX IF NOT EXISTS idx_hotel_deletion_requests_created_at 
    ON hotel_deletion_requests(created_at DESC);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_hotel_deletion_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_hotel_deletion_requests_updated_at
    BEFORE UPDATE ON hotel_deletion_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_hotel_deletion_requests_updated_at();

-- Add comments for documentation
COMMENT ON TABLE hotel_deletion_requests IS 'Stores hotel deletion requests from hotel owners requiring admin approval';
COMMENT ON COLUMN hotel_deletion_requests.id IS 'Unique identifier for the deletion request';
COMMENT ON COLUMN hotel_deletion_requests.hotel_id IS 'Reference to the hotel requested for deletion';
COMMENT ON COLUMN hotel_deletion_requests.reason IS 'Reason provided by hotel owner for deletion';
COMMENT ON COLUMN hotel_deletion_requests.status IS 'Current status of the request (pending, approved, rejected)';
COMMENT ON COLUMN hotel_deletion_requests.requested_by_user_id IS 'User who submitted the deletion request';
COMMENT ON COLUMN hotel_deletion_requests.reviewed_by_user_id IS 'Admin who reviewed the request';
COMMENT ON COLUMN hotel_deletion_requests.admin_notes IS 'Notes from admin regarding the decision';
