# Hotel Request Feature Documentation

## Overview
The Hotel Request feature allows authenticated users to submit requests to add new hotels to the platform. These requests are reviewed by administrators who can approve or reject them. When approved, a new hotel is automatically created in the system.

## Features

### User Features
- **Submit Hotel Requests**: Any authenticated user can submit a request to add a new hotel
- **View Request History**: Users can view their submitted hotel requests and their status
- **Request Status Tracking**: Track whether requests are pending, approved, or rejected

### Admin Features
- **View All Requests**: Admins can view all hotel requests with filtering by status
- **Review Requests**: Approve or reject hotel requests with optional admin notes
- **Auto-Creation**: Approved requests automatically create a new hotel in the system

## API Endpoints

### 1. Create Hotel Request
**POST** `/api/hotels/requests`

**Authentication**: Required (JWT)

**Request Body**:
```json
{
  "name": "Grand Saigon Hotel",
  "description": "A luxurious 5-star hotel...",
  "address": "123 Nguyen Hue Boulevard",
  "city": "Ho Chi Minh City",
  "state": "Ho Chi Minh",
  "zip_code": "70000",
  "country": "Vietnam",
  "phone_number": "+84283829999"
}
```

**Response**: `201 Created`
```json
{
  "id": "uuid-string",
  "name": "Grand Saigon Hotel",
  "status": "pending",
  "requested_by_user_id": "uuid-string",
  "created_at": "2024-01-15T10:30:00Z",
  ...
}
```

### 2. Get My Hotel Requests
**GET** `/api/hotels/requests/mine`

**Authentication**: Required (JWT)

**Response**: `200 OK`
```json
[
  {
    "id": "uuid-string",
    "name": "Grand Saigon Hotel",
    "status": "pending",
    "created_at": "2024-01-15T10:30:00Z",
    ...
  }
]
```

### 3. Get All Hotel Requests (Admin Only)
**GET** `/api/hotels/requests?status=pending`

**Authentication**: Required (JWT + Admin Role)

**Query Parameters**:
- `status` (optional): Filter by status (pending, approved, rejected)

**Response**: `200 OK`
```json
[
  {
    "id": "uuid-string",
    "name": "Grand Saigon Hotel",
    "status": "pending",
    "requested_by": {
      "id": "uuid-string",
      "username": "johndoe",
      "email": "john@example.com"
    },
    "created_at": "2024-01-15T10:30:00Z",
    ...
  }
]
```

### 4. Get Hotel Request by ID (Admin Only)
**GET** `/api/hotels/requests/:id`

**Authentication**: Required (JWT + Admin Role)

**Response**: `200 OK`
```json
{
  "id": "uuid-string",
  "name": "Grand Saigon Hotel",
  "description": "A luxurious 5-star hotel...",
  "address": "123 Nguyen Hue Boulevard",
  "city": "Ho Chi Minh City",
  "state": "Ho Chi Minh",
  "zip_code": "70000",
  "country": "Vietnam",
  "phone_number": "+84283829999",
  "status": "pending",
  "requested_by": {
    "id": "uuid-string",
    "username": "johndoe",
    "email": "john@example.com"
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### 5. Review Hotel Request (Admin Only)
**PATCH** `/api/hotels/requests/:id/review`

**Authentication**: Required (JWT + Admin Role)

**Request Body**:
```json
{
  "status": "approved",
  "admin_notes": "All details verified. Hotel created successfully."
}
```

**Response**: `200 OK`
```json
{
  "id": "uuid-string",
  "name": "Grand Saigon Hotel",
  "status": "approved",
  "reviewed_by_user_id": "admin-uuid",
  "admin_notes": "All details verified. Hotel created successfully.",
  "created_hotel_id": "new-hotel-uuid",
  "updated_at": "2024-01-15T11:00:00Z"
}
```

## Frontend Integration

### Hotel Request API Service
Located in: `aurevia-client/lib/api/hotel-requests.ts`

**Available Methods**:
```typescript
// Submit a hotel request
hotelRequestApi.createHotelRequest(data)

// Get user's hotel requests
hotelRequestApi.getMyHotelRequests()

// Get all requests (admin)
hotelRequestApi.getAllHotelRequests(status?)

// Get request by ID (admin)
hotelRequestApi.getHotelRequestById(requestId)

// Review request (admin)
hotelRequestApi.reviewHotelRequest(requestId, status, adminNotes?)
```

### Request Hub Page
Located in: `aurevia-client/app/(user)/requests/page.tsx`

The Request Hub page provides a tabbed interface for:
1. **Topup Balance Tab**: Existing functionality for balance top-up
2. **Hotel Request Tab**: New functionality to submit hotel requests

**Form Fields**:
- Hotel Name (required)
- Description (required)
- Street Address (required)
- City (required)
- State/Province (required)
- Zip Code (required)
- Country (required)
- Phone Number (required - Vietnam format)

## Database Schema

### hotel_requests Table
```sql
CREATE TABLE hotel_requests (
    id UUID PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    address VARCHAR(500) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    requested_by_user_id UUID NOT NULL,
    reviewed_by_user_id UUID,
    admin_notes TEXT,
    created_hotel_id UUID,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (requested_by_user_id) REFERENCES users(id),
    FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id),
    FOREIGN KEY (created_hotel_id) REFERENCES hotels(id)
);
```

**Indexes**:
- `idx_hotel_requests_status`: For filtering by status
- `idx_hotel_requests_requester`: For user-specific queries
- `idx_hotel_requests_created_at`: For chronological ordering

## Workflow

### User Submission Flow
1. User navigates to Request Hub (`/requests`)
2. User switches to "Hotel Request" tab
3. User fills out the hotel request form with all required information
4. User submits the request
5. System validates the data and creates a pending request
6. User receives confirmation message
7. User can view their request status in "My Requests" section (future feature)

### Admin Review Flow
1. Admin views all pending hotel requests
2. Admin selects a request to review
3. Admin verifies all information
4. Admin approves or rejects the request with optional notes
5. If approved:
   - System automatically creates a new hotel
   - Hotel is geocoded and indexed for search
   - Request is marked as approved with hotel ID
6. If rejected:
   - Request is marked as rejected with admin notes
7. User is notified of the decision (future: via notification system)

## Validation Rules

### Phone Number
- Must be in Vietnam format: `+84XXXXXXXXX`
- Validated using `class-validator`'s `@IsPhoneNumber('VN')`

### Required Fields
- All address fields are required
- Phone number must be provided
- Name and description cannot be empty

### Optional Fields
- Admin notes are optional during review

## Error Handling

### Common Errors
- **400 Bad Request**: Validation failed, missing required fields
- **401 Unauthorized**: User not authenticated
- **403 Forbidden**: User lacks required permissions (admin only endpoints)
- **404 Not Found**: Hotel request not found
- **409 Conflict**: Hotel with same name and address already exists (during approval)

## Future Enhancements

1. **Image Upload**: Support for hotel images in requests
2. **Notification System**: Notify users when their requests are reviewed
3. **Request Comments**: Allow admins to comment on requests before approval
4. **Bulk Operations**: Approve/reject multiple requests at once
5. **Request Editing**: Allow users to edit pending requests
6. **Advanced Filtering**: Filter by city, date range, requester, etc.
7. **Request Analytics**: Dashboard showing request statistics

## Security Considerations

- All endpoints require JWT authentication
- Admin-only endpoints protected by role-based guards
- User data (passwords, tokens) sanitized from responses
- Foreign key constraints ensure data integrity
- Cascade delete for user removal

## Testing

### Manual Testing Steps
1. **Create Request**:
   - Login as regular user
   - Navigate to `/requests`
   - Fill hotel request form
   - Submit and verify success message

2. **View Requests**:
   - Login as admin
   - Access admin panel (future)
   - View all pending requests

3. **Approve Request**:
   - Login as admin
   - Review a pending request
   - Approve with notes
   - Verify hotel is created

4. **Reject Request**:
   - Login as admin
   - Review a pending request
   - Reject with notes
   - Verify status update

## Migration Instructions

1. Run the migration SQL file:
   ```bash
   psql -U postgres -d tigo_booking -f database/migrations/create_hotel_requests_table.sql
   ```

2. Restart the backend server to apply TypeORM changes

3. Test the new endpoints using Postman or the frontend

## Related Files

### Backend
- `src/modules/hotel/entities/hotel-request.entity.ts`
- `src/modules/hotel/dto/hotel/create-hotel-request.dto.ts`
- `src/modules/hotel/dto/hotel/review-hotel-request.dto.ts`
- `src/modules/hotel/services/hotel.service.ts` (methods added)
- `src/modules/hotel/controllers/hotel.controller.ts` (endpoints added)
- `src/modules/hotel/hotel.module.ts` (entity registered)

### Frontend
- `lib/api/hotel-requests.ts`
- `app/(user)/requests/page.tsx`

### Database
- `database/migrations/create_hotel_requests_table.sql`

## Support

For issues or questions about the Hotel Request feature, please contact the development team or create an issue in the project repository.
