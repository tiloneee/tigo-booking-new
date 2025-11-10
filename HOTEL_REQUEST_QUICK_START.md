# Hotel Request Feature - Quick Start Guide

## What Was Implemented

✅ **Backend (NestJS)**
- New `HotelRequest` entity for storing hotel requests
- DTOs for creating and reviewing hotel requests
- Service methods in `HotelService` for CRUD operations
- API endpoints in `HotelController`:
  - `POST /api/hotels/requests` - Submit hotel request (authenticated users)
  - `GET /api/hotels/requests/mine` - Get user's requests (authenticated users)
  - `GET /api/hotels/requests` - Get all requests (admin only)
  - `GET /api/hotels/requests/:id` - Get request by ID (admin only)
  - `PATCH /api/hotels/requests/:id/review` - Approve/reject request (admin only)

✅ **Frontend (Next.js)**
- New API service in `lib/api/hotel-requests.ts`
- Updated Request Hub page (`app/(user)/requests/page.tsx`) with hotel request form
- Complete form with all required fields:
  - Hotel name, description
  - Address, city, state, zip code, country
  - Phone number (Vietnam format)

✅ **Database**
- Migration file for `hotel_requests` table
- Proper foreign key constraints
- Indexes for performance
- Auto-update timestamp trigger

## How to Use

### 1. Run Database Migration
```bash
cd tigo-server
# Run the migration
psql -U postgres -d tigo_booking -f ../database/migrations/create_hotel_requests_table.sql
```

### 2. Start the Backend
```bash
cd tigo-server
npm run start:dev
```

### 3. Start the Frontend
```bash
cd aurevia-client
npm run dev
```

### 4. Test the Feature

**As a User:**
1. Login to the application
2. Navigate to `/requests`
3. Click on the "Hotel Request" tab
4. Fill in all the required fields
5. Submit the request
6. You should see a success message

**As an Admin:**
Use Postman or any API client to test admin endpoints:
```bash
# Get all pending requests
GET http://localhost:3000/api/hotels/requests?status=pending
Authorization: Bearer <admin-jwt-token>

# Approve a request
PATCH http://localhost:3000/api/hotels/requests/<request-id>/review
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "status": "approved",
  "admin_notes": "All details verified."
}
```

## API Examples

### Submit Hotel Request
```bash
curl -X POST http://localhost:3000/api/hotels/requests \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Grand Saigon Hotel",
    "description": "A luxurious 5-star hotel in the heart of Ho Chi Minh City",
    "address": "123 Nguyen Hue Boulevard",
    "city": "Ho Chi Minh City",
    "state": "Ho Chi Minh",
    "zip_code": "70000",
    "country": "Vietnam",
    "phone_number": "+84283829999"
  }'
```

### Get My Requests
```bash
curl -X GET http://localhost:3000/api/hotels/requests/mine \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Get All Requests (Admin)
```bash
curl -X GET "http://localhost:3000/api/hotels/requests?status=pending" \
  -H "Authorization: Bearer <admin-jwt-token>"
```

### Approve Request (Admin)
```bash
curl -X PATCH http://localhost:3000/api/hotels/requests/<request-id>/review \
  -H "Authorization: Bearer <admin-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "admin_notes": "All details verified. Hotel created successfully."
  }'
```

## What Happens When a Request is Approved

1. The hotel request status changes to "approved"
2. A new hotel is automatically created using the request data
3. The hotel is geocoded (latitude/longitude calculated)
4. The hotel is indexed in Elasticsearch for search
5. The `created_hotel_id` field is populated with the new hotel's ID
6. Admin notes are saved

## Important Notes

- **Phone Number Format**: Must be Vietnam format (e.g., +84283829999)
- **Required Fields**: All address fields, name, description, and phone number are required
- **Optional Fields**: None - all fields are required
- **Auto-Creation**: Approved requests automatically create hotels owned by the requester
- **Status Values**: `pending`, `approved`, `rejected`

## Common Issues & Solutions

### Issue: "Phone number validation failed"
**Solution**: Ensure phone number is in Vietnam format: `+84XXXXXXXXX`

### Issue: "Unauthorized"
**Solution**: Make sure you're logged in and the JWT token is valid

### Issue: "Hotel already exists"
**Solution**: A hotel with the same name and address already exists (checked during approval)

### Issue: Database table doesn't exist
**Solution**: Run the migration file first

## Future Admin Dashboard Integration

The admin endpoints are ready to be integrated into an admin dashboard. You can:
1. Create an admin page to list all requests
2. Add filters for status (pending/approved/rejected)
3. Create a detail view for reviewing individual requests
4. Add approve/reject buttons with a notes input field

## Files Modified/Created

### Backend Files
- ✅ `tigo-server/src/modules/hotel/entities/hotel-request.entity.ts` (new)
- ✅ `tigo-server/src/modules/hotel/dto/hotel/create-hotel-request.dto.ts` (new)
- ✅ `tigo-server/src/modules/hotel/dto/hotel/review-hotel-request.dto.ts` (new)
- ✅ `tigo-server/src/modules/hotel/services/hotel.service.ts` (modified)
- ✅ `tigo-server/src/modules/hotel/controllers/hotel.controller.ts` (modified)
- ✅ `tigo-server/src/modules/hotel/hotel.module.ts` (modified)

### Frontend Files
- ✅ `aurevia-client/lib/api/hotel-requests.ts` (new)
- ✅ `aurevia-client/app/(user)/requests/page.tsx` (modified)

### Database Files
- ✅ `database/migrations/create_hotel_requests_table.sql` (new)
- ✅ `database/markdowns/HOTEL_REQUEST_DOCUMENTATION.md` (new)

## Next Steps

1. **Run the migration** to create the database table
2. **Test the endpoints** using Postman or the frontend
3. **Create an admin dashboard** to manage requests (optional)
4. **Add notifications** to alert users when their requests are reviewed (optional)
5. **Add image upload** support for hotel images (optional)

## Support

For detailed documentation, see: `database/markdowns/HOTEL_REQUEST_DOCUMENTATION.md`
