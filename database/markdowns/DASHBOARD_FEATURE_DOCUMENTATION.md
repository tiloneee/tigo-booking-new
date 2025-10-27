# Dashboard Feature Documentation

## Overview
The Admin/Hotel Owner dashboard provides a comprehensive management interface for users with elevated permissions. The dashboard includes role-based access control, displaying different information and capabilities based on the user's role (Admin or HotelOwner).

## Access Control

### Roles
- **Admin**: Full access to all users, hotels, rooms, bookings, and availability data
- **HotelOwner**: Access only to their own hotels, rooms, bookings, and availability data

### Dashboard Access
The dashboard button appears in the navigation bar only for users with Admin or HotelOwner roles. Users without these roles will not see the dashboard option.

## Features

### 1. Users Tab (Admin Only)
The Users tab is only visible to Admin users and provides:

**Features:**
- View list of all users in the system
- Display user information:
  - Name (First and Last)
  - Email address
  - Phone number
  - Account status (Active/Inactive)
  - Assigned roles
  - Registration date
- User management actions:
  - Delete user (with confirmation)
  - Edit user (placeholder for future implementation)

**Design Elements:**
- Color-coded role badges (Admin: Red, HotelOwner: Blue, Customer: Green)
- Expandable user cards for detailed information
- Active/Inactive status badges

### 2. Hotels Tab (Admin & HotelOwner)
The Hotels tab is visible to both Admin and HotelOwner users with different data scope:

**Admin View:**
- See all hotels in the system
- View hotel owner information

**HotelOwner View:**
- See only their own hotels
- Cannot see other hotels

**Hotel Information Displayed:**
- Hotel name and description
- Location (city, state, address)
- Contact information (phone number)
- Rating and review count
- Active/Inactive status
- Owner information (Admin only)

### 3. Expandable Hotel Sections
Each hotel card can be expanded to show:

#### a. Rooms Section
- List of all rooms in the hotel
- Room information:
  - Room number
  - Room type
  - Maximum occupancy
  - Bed configuration
  - Room size (square meters)
- Each room can be expanded to show availability

#### b. Room Availability Section
When a room is expanded, it shows:
- Date-by-date availability
- Number of available units per date
- Price per night
- Availability status (Available/Booked)
- Shows up to 10 most recent availability entries

#### c. Bookings Section
- List of all bookings for the hotel
- Booking information:
  - Check-in and check-out dates
  - Guest name and number of guests
  - Total price and paid amount
  - Special requests
  - Booking status (Pending, Confirmed, Cancelled, Completed, CheckedIn, CheckedOut, NoShow)
  - Payment status (Pending, Paid, Refunded, PartialRefund, Failed)

## Technical Implementation

### File Structure
```
aurevia-client/
├── app/
│   └── (dashboard)/
│       └── admin/
│           └── dashboard/
│               └── page.tsx              # Main dashboard page
├── components/
│   ├── auth/
│   │   └── user-nav.tsx                 # Updated to show dashboard button
│   └── dashboard/
│       ├── hotels-tab.tsx               # Hotels tab component
│       └── users-tab.tsx                # Users tab component
├── lib/
│   └── api/
│       └── dashboard.ts                 # API utility functions
└── types/
    └── dashboard.ts                     # TypeScript type definitions
```

### API Endpoints Used

**User Management (Admin only):**
- `GET /users` - Get all users
- `GET /users/:id` - Get single user
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `POST /users/:id/roles` - Assign role to user

**Hotel Management:**
- `GET /hotels` - Get all hotels (Admin)
- `GET /hotels/owner/my-hotels` - Get owned hotels (HotelOwner)
- `GET /hotels/:id` - Get single hotel
- `PATCH /hotels/:id` - Update hotel
- `DELETE /hotels/:id` - Delete hotel

**Room Management:**
- `GET /hotels/:hotelId/rooms` - Get all rooms for a hotel
- `GET /rooms/:id` - Get single room
- `POST /hotels/:hotelId/rooms` - Create room
- `PATCH /rooms/:id` - Update room
- `DELETE /rooms/:id` - Delete room

**Room Availability:**
- `GET /rooms/:roomId/availability` - Get room availability
- `POST /rooms/:roomId/availability` - Create availability
- `PATCH /availability/:id` - Update availability
- `DELETE /availability/:id` - Delete availability

**Booking Management:**
- `GET /hotels/:hotelId/bookings` - Get hotel bookings
- `GET /bookings/:id` - Get single booking
- `PATCH /bookings/:id` - Update booking
- `POST /bookings/:id/cancel` - Cancel booking

### Authentication & Authorization

**Frontend:**
- Uses NextAuth for session management
- Session includes user roles and access tokens
- ProtectedRoute component enforces role-based access
- Dashboard button only visible to Admin and HotelOwner roles

**Backend:**
- JWT-based authentication
- Role guards on API endpoints
- Hotel ownership verification for HotelOwner operations
- Admin has full access to all resources

## Usage

### For Admins:
1. Log in with an Admin account
2. Click "Dashboard" in the navigation bar
3. Navigate between "Users" and "Hotels" tabs
4. Click on a user card to see management options
5. Click on a hotel card to expand and see rooms/bookings
6. Click on a room to see availability details

### For Hotel Owners:
1. Log in with a HotelOwner account
2. Click "Dashboard" in the navigation bar
3. View your hotels (only "Hotels" tab is visible)
4. Click on a hotel to expand and see rooms/bookings
5. Click on a room to see availability details
6. Manage bookings for your properties

## Future Enhancements

Potential features to add:
1. User editing functionality
2. Create new hotel/room from dashboard
3. Inline editing of booking status
4. Bulk availability management
5. Analytics and reporting
6. Revenue tracking
7. Calendar view for availability
8. Export data functionality
9. Search and filter capabilities
10. Pagination for large datasets

## Design System

The dashboard follows the Aurevia brand design system:
- **Colors**: Walnut (dark backgrounds), Copper (accents), Cream (text)
- **Typography**: 
  - Playfair Display (headings)
  - Cormorant (body text)
  - Cinzel (labels and badges)
- **Components**: Shadcn UI with custom styling
- **Vintage aesthetic** with modern functionality

## Error Handling

- API errors are caught and displayed to the user
- Loading states shown during data fetching
- Confirmation dialogs for destructive actions
- Graceful degradation when data is unavailable

## Security Considerations

1. All API calls require authentication tokens
2. Role-based access enforced on both frontend and backend
3. Hotel owners can only access their own data
4. Sensitive operations require confirmation
5. Proper error messages without exposing sensitive information



