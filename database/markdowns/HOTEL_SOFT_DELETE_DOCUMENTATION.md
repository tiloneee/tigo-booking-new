# Hotel Soft Delete Feature Documentation

## Overview
This feature allows hotel owners to request deletion of their hotels, which requires admin approval. When approved, the hotel is soft-deleted (deactivated) rather than permanently removed from the database. Inactive hotels are excluded from search results.

## Architecture

### Backend Components

#### 1. Entity: `HotelDeletionRequest`
**File:** `tigo-server/src/modules/hotel/entities/hotel-deletion-request.entity.ts`

**Fields:**
- `id`: UUID primary key
- `hotel_id`: Reference to the hotel
- `reason`: Text field explaining why deletion is requested
- `status`: Enum (pending, approved, rejected)
- `requested_by_user_id`: Hotel owner who submitted the request
- `reviewed_by_user_id`: Admin who reviewed the request
- `admin_notes`: Optional notes from admin
- `created_at`, `updated_at`: Timestamps

**Status Flow:**
```
pending → approved (hotel.is_active = false)
        → rejected (hotel remains active)
```

#### 2. DTOs
**Create Request DTO:** `create-hotel-deletion-request.dto.ts`
- `reason`: string (min: 10, max: 1000 characters)

**Review Request DTO:** `review-hotel-deletion-request.dto.ts`
- `status`: 'approved' | 'rejected'
- `admin_notes`: optional string (max: 1000 characters)

#### 3. Service Methods
**File:** `hotel.service.ts`

| Method | Access | Description |
|--------|--------|-------------|
| `createHotelDeletionRequest()` | Hotel Owner | Submit deletion request for owned hotel |
| `getAllHotelDeletionRequests()` | Admin | Get all requests with optional status filter |
| `getHotelDeletionRequestsByOwner()` | Hotel Owner | Get own deletion requests |
| `getHotelDeletionRequestById()` | Admin | Get single request details |
| `reviewHotelDeletionRequest()` | Admin | Approve/reject request |

**Key Logic:**
- **Validation:** Verifies hotel ownership before creating request
- **Duplicate Prevention:** Checks for existing pending requests
- **Soft Delete:** On approval, sets `hotel.is_active = false`
- **Search Sync:** Updates Elasticsearch index when hotel is deactivated

#### 4. API Endpoints
**Base Path:** `/api/hotels`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/:id/deletion-request` | HotelOwner, Admin | Create deletion request |
| GET | `/deletion-requests` | Admin | Get all deletion requests |
| GET | `/deletion-requests/mine` | HotelOwner, Admin | Get own deletion requests |
| GET | `/deletion-requests/:id` | Admin | Get request by ID |
| PATCH | `/deletion-requests/:id/review` | Admin | Review request |

**Important:** Hotel-specific endpoints must be registered BEFORE generic `:id` routes to avoid routing conflicts.

#### 5. Database Schema
**Table:** `hotel_deletion_requests`

```sql
CREATE TABLE hotel_deletion_requests (
    id UUID PRIMARY KEY,
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_hotel_deletion_requests_status` - Fast filtering by status
- `idx_hotel_deletion_requests_hotel_id` - Hotel lookup
- `idx_hotel_deletion_requests_requester` - Owner's requests
- `idx_hotel_deletion_requests_created_at` - Chronological ordering

### Frontend Components

#### 1. API Service
**File:** `lib/api/hotel-deletion-requests.ts`

**Functions:**
- `createHotelDeletionRequest(hotelId, data)`
- `getMyHotelDeletionRequests()`
- `getAllHotelDeletionRequests(status?)`
- `getHotelDeletionRequestById(requestId)`
- `reviewHotelDeletionRequest(requestId, status, adminNotes?)`

#### 2. Admin Dashboard Tab
**File:** `components/dashboard/hotel-deletion-requests-tab.tsx`

**Features:**
- Organized by status (Pending, Approved, Rejected)
- Review dialog with approve/reject actions
- Display hotel info, reason, admin notes
- Shows hotel deactivation status
- Real-time refresh after review

**UI Components:**
- Request cards with hotel details
- Status badges (color-coded)
- Review dialog with admin notes textarea
- Approve (green) / Reject (red) buttons

#### 3. Integration
Updated `app/(dashboard)/admin/dashboard/page.tsx`:
- Added "Deletion Requests" tab
- Integrated with existing search functionality
- Loads deletion requests on dashboard mount
- Refreshes data after review actions

## Search Behavior

### Hotel Visibility Rules
1. **Active Hotels (`is_active = true`):**
   - Appear in public search results
   - Shown in hotel listings
   - Available for booking

2. **Inactive Hotels (`is_active = false`):**
   - **Excluded** from public search
   - **Excluded** from `findAllActive()` queries
   - Removed from Elasticsearch index
   - Still visible in admin dashboard
   - Historical bookings remain accessible

### Search Method
**Service:** `hotel.service.ts`
**Method:** `findAllActive()`

```typescript
.where('hotel.is_active = :isActive', { isActive: true })
```

This filter is already implemented and automatically excludes soft-deleted hotels.

## User Workflows

### Hotel Owner: Request Deletion
1. Navigate to owned hotel management
2. Click "Request Deletion" button
3. Provide detailed reason (min 10 characters)
4. Submit request
5. Wait for admin review
6. Receive notification of decision

### Admin: Review Request
1. Navigate to Admin Dashboard → Deletion Requests tab
2. View pending requests with hotel details
3. Read owner's deletion reason
4. Click "Approve & Deactivate" or "Reject"
5. Add admin notes (required for rejection)
6. Confirm decision
7. Hotel is deactivated if approved

## Security Considerations

1. **Ownership Verification:** Only hotel owners can request deletion of their hotels
2. **Admin-Only Review:** Only admins can approve/reject requests
3. **Soft Delete:** Hotels are deactivated, not permanently deleted
4. **Audit Trail:** All requests logged with timestamps and user references
5. **Concurrent Request Prevention:** Only one pending request per hotel allowed

## Database Migration

**File:** `database/migrations/create_hotel_deletion_requests_table.sql`

**Run Migration:**
```bash
cd tigo-server
psql -U postgres -d tigo_booking_db -f ../database/migrations/create_hotel_deletion_requests_table.sql
```

**Status:** ✅ Migration completed successfully

## Testing Checklist

### Backend
- [ ] Hotel owner can create deletion request for owned hotel
- [ ] Non-owners cannot create deletion request
- [ ] Duplicate pending requests are prevented
- [ ] Admin can view all deletion requests
- [ ] Admin can filter by status (pending/approved/rejected)
- [ ] Hotel owner can view only their own requests
- [ ] Admin approval sets hotel.is_active = false
- [ ] Elasticsearch index is updated on approval
- [ ] Inactive hotels excluded from search results

### Frontend
- [ ] Admin dashboard shows deletion requests tab
- [ ] Requests organized by status
- [ ] Review dialog works for approve/reject
- [ ] Admin notes required for rejection
- [ ] Data refreshes after review
- [ ] Search filters deletion requests correctly
- [ ] Status badges display correctly
- [ ] Hotel deactivation status shown

## Future Enhancements

1. **Notifications:**
   - Implement `notifyAdminsNewHotelDeletionRequest()`
   - Implement `notifyHotelDeletionRequestReviewed()`
   - Real-time notifications for hotel owners

2. **Hotel Owner UI:**
   - Add deletion request button to hotel management page
   - Show deletion request status in hotel owner dashboard
   - Allow viewing/tracking submission history

3. **Reactivation Workflow:**
   - Add request to reactivate deleted hotels
   - Admin approval required for reactivation

4. **Bulk Operations:**
   - Admin ability to bulk approve/reject requests
   - Filter by hotel characteristics

5. **Analytics:**
   - Track deletion request patterns
   - Identify common deletion reasons
   - Monitor inactive hotel statistics

## API Documentation

Full Swagger documentation available at `/api/docs` when server is running.

**Example Request (Create Deletion Request):**
```http
POST /api/hotels/{hotelId}/deletion-request
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "The hotel has permanently closed operations due to business reasons."
}
```

**Example Response:**
```json
{
  "id": "uuid",
  "hotel_id": "uuid",
  "reason": "The hotel has permanently closed operations...",
  "status": "pending",
  "requested_by_user_id": "uuid",
  "reviewed_by_user_id": null,
  "admin_notes": null,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

## Troubleshooting

### Issue: Route conflict (404 on deletion-requests endpoint)
**Solution:** Ensure hotel-specific routes are registered BEFORE `:id` routes in `hotel.controller.ts`

### Issue: Hotel still appears in search after approval
**Solution:** 
1. Verify `is_active = false` in database
2. Check Elasticsearch sync logs
3. Re-index Elasticsearch if needed

### Issue: Cannot create duplicate request error
**Solution:** Check for existing pending request. Only one pending request per hotel is allowed.

## Conclusion

The hotel soft delete feature provides a controlled workflow for hotel deactivation, ensuring:
- **Owner control:** Hotel owners can request removal
- **Admin oversight:** Admins review and approve requests
- **Data preservation:** Soft delete maintains historical data
- **Search integrity:** Inactive hotels automatically excluded
- **Audit trail:** Complete history of deletion requests

This implementation follows best practices for data management and user experience.
