-- Migration: Create hotel_requests table
-- Description: Add support for users to submit hotel requests for admin approval

CREATE TABLE hotel_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_by_user_id UUID NOT NULL,
    reviewed_by_user_id UUID,
    admin_notes TEXT,
    created_hotel_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_hotel_request_requester 
        FOREIGN KEY (requested_by_user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_hotel_request_reviewer 
        FOREIGN KEY (reviewed_by_user_id) 
        REFERENCES users(id) 
        ON DELETE SET NULL,
    
    CONSTRAINT fk_hotel_request_created_hotel 
        FOREIGN KEY (created_hotel_id) 
        REFERENCES hotels(id) 
        ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_hotel_requests_status ON hotel_requests(status);
CREATE INDEX idx_hotel_requests_requester ON hotel_requests(requested_by_user_id);
CREATE INDEX idx_hotel_requests_created_at ON hotel_requests(created_at DESC);

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_hotel_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_hotel_request_updated_at
    BEFORE UPDATE ON hotel_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_hotel_request_updated_at();

-- Add comments for documentation
COMMENT ON TABLE hotel_requests IS 'Stores hotel addition requests submitted by users for admin approval';
COMMENT ON COLUMN hotel_requests.status IS 'Request status: pending, approved, or rejected';
COMMENT ON COLUMN hotel_requests.created_hotel_id IS 'ID of the hotel created if the request was approved';
