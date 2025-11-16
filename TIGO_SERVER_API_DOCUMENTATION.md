# Tigo Server Backend API Documentation

## Overview
Tigo Booking is a comprehensive hotel booking platform backend built with NestJS, TypeScript, PostgreSQL, Redis, and Elasticsearch. This document provides a complete reference to all backend functionality, endpoints, and features.

**Base URL:** `http://localhost:3000`  
**API Documentation:** `http://localhost:3000/api` (Swagger UI)

---

## Table of Contents
1. [Architecture](#architecture)
2. [Authentication & Authorization](#authentication--authorization)
3. [User Management](#user-management)
4. [Hotel Management](#hotel-management)
5. [Room Management](#room-management)
6. [Booking Management](#booking-management)
7. [Review System](#review-system)
8. [Amenities](#amenities)
9. [Search & Discovery](#search--discovery)
10. [Real-time Chat](#real-time-chat)
11. [Notifications](#notifications)
12. [Transaction & Balance System](#transaction--balance-system)
13. [WebSocket Events](#websocket-events)

---

## Architecture

### Core Technologies
- **Framework:** NestJS (Node.js)
- **Language:** TypeScript
- **Database:** PostgreSQL (with TypeORM)
- **Cache & Sessions:** Redis
- **Search Engine:** Elasticsearch
- **Real-time:** Socket.IO (WebSockets)
- **Authentication:** JWT with refresh token rotation
- **API Documentation:** Swagger/OpenAPI

### Module Structure
```
src/
├── common/           # Shared services, guards, decorators
├── modules/
│   ├── user/        # Authentication & user management
│   ├── hotel/       # Hotel, room, booking, review management
│   ├── search/      # Elasticsearch integration
│   ├── chat/        # Real-time messaging
│   ├── notification/# Real-time notifications
│   └── transaction/ # Balance & payment system
```

### Core Services
- **Redis Service:** Caching, session management, pub/sub
- **Email Service:** User activation, notifications
- **JWT Guards:** Authentication & authorization
- **Role-based Access Control (RBAC):** Admin, HotelOwner, Customer

---

## Authentication & Authorization

### Base Path: `/auth`

#### 1. Register New User
**POST** `/auth/register`
- **Access:** Public
- **Body:**
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string",
    "role": "Customer" | "HotelOwner"
  }
  ```
- **Response:** User created, activation email sent
- **Features:**
  - Password hashing (bcrypt)
  - Email verification required
  - Default role: Customer

#### 2. Login
**POST** `/auth/login`
- **Access:** Public
- **Body:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response:**
  ```json
  {
    "access_token": "jwt_token",
    "user": { /* user object */ }
  }
  ```
- **Features:**
  - HttpOnly cookie for refresh token (7 days)
  - Returns access token (expires in 15 min)
  - Account must be activated

#### 3. Activate Account
**GET** `/auth/activate?token=<token>`
- **Access:** Public
- **Response:** Redirects to frontend with success/error

#### 4. Refresh Token
**POST** `/auth/refresh`
- **Access:** Requires refresh token cookie
- **Response:** New access token
- **Features:** Cookie-based refresh token flow

#### 5. Logout
**POST** `/auth/logout`
- **Access:** Authenticated
- **Response:** Clears refresh token cookie
- **Features:** Invalidates session

### Role-Based Access Control

**Roles:**
- **Admin:** Full system access
- **HotelOwner:** Manage own hotels, rooms, bookings
- **Customer:** Book hotels, write reviews, chat

---

## User Management

### Base Path: `/users`

#### 1. Create User (Admin)
**POST** `/users`
- **Access:** Admin only
- **Body:** CreateUserDto
- **Response:** Created user

#### 2. Get All Users (Admin)
**GET** `/users`
- **Access:** Admin only
- **Response:** Array of all users

#### 3. Get Current User Profile
**GET** `/users/profile`
- **Access:** Authenticated
- **Response:** Current user details

#### 4. Update Current User Profile
**PATCH** `/users/profile`
- **Access:** Authenticated
- **Body:** UpdateUserDto
- **Response:** Updated user

#### 5. Get User by ID (Admin)
**GET** `/users/:id`
- **Access:** Admin only
- **Response:** User details

#### 6. Update User (Admin)
**PATCH** `/users/:id`
- **Access:** Admin only
- **Body:** UpdateUserDto
- **Response:** Updated user

#### 7. Delete User (Admin)
**DELETE** `/users/:id`
- **Access:** Admin only
- **Response:** Deletion confirmation

#### 8. Assign Role (Admin)
**POST** `/users/:id/roles`
- **Access:** Admin only
- **Body:** `{ "role": "Admin" | "HotelOwner" | "Customer" }`
- **Response:** Updated user with new role

---

## Hotel Management

### Base Path: `/hotels`

#### Public Endpoints

##### 1. Get All Hotels (Public)
**GET** `/hotels/all`
- **Access:** Public
- **Query Params:**
  - `page` (default: 1)
  - `limit` (default: 12)
  - `sort_by` (name, rating)
  - `sort_order` (ASC, DESC)
- **Response:** Paginated list of active hotels

##### 2. Search Hotels (Public)
**GET** `/hotels/search`
- **Access:** Public
- **Query Params:**
  - `city` - City name
  - `check_in_date` - YYYY-MM-DD
  - `check_out_date` - YYYY-MM-DD
  - `number_of_guests` - Number
  - `min_price` - Minimum price per night
  - `max_price` - Maximum price per night
  - `min_rating` - Minimum rating (1-5)
  - `latitude` - For geo search
  - `longitude` - For geo search
  - `radius_km` - Search radius
  - `sort_by` (price, rating, distance, name)
  - `sort_order` (ASC, DESC)
  - `page`, `limit`
- **Response:** Filtered and sorted hotel results
- **Features:** Powered by Elasticsearch for fast, relevant results

##### 3. Get Hotel Details (Public)
**GET** `/hotels/:id/public`
- **Access:** Public
- **Response:** Detailed hotel information including amenities and rooms

#### Hotel Owner/Admin Endpoints

##### 4. Create Hotel
**POST** `/hotels`
- **Access:** HotelOwner, Admin
- **Body:** CreateHotelDto
  ```json
  {
    "name": "string",
    "description": "string",
    "address": "string",
    "city": "string",
    "state": "string",
    "zip_code": "string",
    "country": "string",
    "phone_number": "string",
    "latitude": number,
    "longitude": number
  }
  ```
- **Response:** Created hotel
- **Features:** Auto-indexed in Elasticsearch

##### 5. Get Own Hotels
**GET** `/hotels/mine`
- **Access:** HotelOwner, Admin
- **Response:** List of hotels owned by authenticated user

##### 6. Get Hotel Details (Owner/Admin)
**GET** `/hotels/:id`
- **Access:** Owner or Admin
- **Response:** Full hotel details with management data
- **Guard:** HotelOwnershipGuard

##### 7. Update Hotel
**PATCH** `/hotels/:id`
- **Access:** Owner or Admin
- **Body:** UpdateHotelDto
- **Response:** Updated hotel
- **Guard:** HotelOwnershipGuard

##### 8. Delete Hotel
**DELETE** `/hotels/:id`
- **Access:** Owner or Admin
- **Response:** Deletion confirmation
- **Guard:** HotelOwnershipGuard

##### 9. Get All Hotels (Admin)
**GET** `/hotels`
- **Access:** Admin only
- **Response:** All hotels including inactive

##### 10. Health Check
**GET** `/hotels/health`
- **Access:** Public
- **Response:** Service health status

### Hotel Request System

#### Hotel Creation Requests

##### 1. Submit Hotel Request
**POST** `/hotels/requests`
- **Access:** Authenticated users
- **Body:** CreateHotelRequestDto
- **Response:** Pending request
- **Use Case:** Users can request new hotels to be added

##### 2. Get All Hotel Requests (Admin)
**GET** `/hotels/requests`
- **Access:** Admin only
- **Query:** `status` (pending, approved, rejected)
- **Response:** List of hotel requests

##### 3. Get Own Hotel Requests
**GET** `/hotels/requests/mine`
- **Access:** Authenticated
- **Response:** User's submitted requests

##### 4. Get Hotel Request by ID (Admin)
**GET** `/hotels/requests/:id`
- **Access:** Admin only
- **Response:** Request details

##### 5. Review Hotel Request (Admin)
**PATCH** `/hotels/requests/:id/review`
- **Access:** Admin only
- **Body:**
  ```json
  {
    "status": "approved" | "rejected",
    "admin_notes": "string"
  }
  ```
- **Response:** Updated request
- **Features:** Auto-creates hotel if approved

### Hotel Deletion Requests

##### 1. Create Deletion Request
**POST** `/hotels/:id/deletion-request`
- **Access:** Owner or Admin
- **Body:**
  ```json
  {
    "reason": "string"
  }
  ```
- **Response:** Pending deletion request

##### 2. Get All Deletion Requests (Admin)
**GET** `/hotels/deletion-requests`
- **Access:** Admin only
- **Query:** `status` (pending, approved, rejected)
- **Response:** List of deletion requests

##### 3. Get Own Deletion Requests
**GET** `/hotels/deletion-requests/mine`
- **Access:** HotelOwner, Admin
- **Response:** Owner's deletion requests

##### 4. Get Deletion Request by ID (Admin)
**GET** `/hotels/deletion-requests/:id`
- **Access:** Admin only
- **Response:** Request details

##### 5. Review Deletion Request (Admin)
**PATCH** `/hotels/deletion-requests/:id/review`
- **Access:** Admin only
- **Body:**
  ```json
  {
    "status": "approved" | "rejected",
    "admin_notes": "string"
  }
  ```
- **Response:** Updated request
- **Features:** Soft-deletes hotel (is_active = false) if approved

---

## Room Management

### Base Path: `/rooms` and `/hotels/:hotelId/rooms`

#### Public Endpoints

##### 1. Get Room Details
**GET** `/rooms/:id`
- **Access:** Public
- **Response:** Room details

##### 2. Get Rooms for Hotel (Public)
**GET** `/hotels/:hotelId/rooms/public`
- **Access:** Public
- **Query Params:**
  - `check_in_date` - YYYY-MM-DD
  - `check_out_date` - YYYY-MM-DD
  - `number_of_guests` - Number
- **Response:** Available rooms with pricing for date range
- **Features:** Real-time availability check

##### 3. Check Room Availability
**GET** `/rooms/:id/availability/check`
- **Access:** Public
- **Query:**
  - `check_in_date` - Required
  - `check_out_date` - Required
  - `units` - Number of units (default: 1)
- **Response:**
  ```json
  {
    "available": boolean,
    "available_units": number
  }
  ```

##### 4. Get Pricing Breakdown
**GET** `/rooms/:id/pricing-breakdown`
- **Access:** Public
- **Query:**
  - `check_in_date` - Required
  - `check_out_date` - Required
- **Response:** Nightly price breakdown for date range

#### Owner/Admin Endpoints

##### 5. Create Room
**POST** `/rooms` or **POST** `/hotels/:hotelId/rooms`
- **Access:** HotelOwner, Admin
- **Body:** CreateRoomDto
  ```json
  {
    "hotel_id": "uuid",
    "room_type": "string",
    "max_occupancy": number,
    "base_price": number,
    "description": "string",
    "amenities": ["string"]
  }
  ```
- **Response:** Created room

##### 6. Get All Rooms for Hotel (Owner/Admin)
**GET** `/hotels/:hotelId/rooms`
- **Access:** Owner or Admin
- **Response:** All rooms with management data

##### 7. Update Room
**PATCH** `/rooms/:id`
- **Access:** Owner or Admin
- **Body:** UpdateRoomDto
- **Response:** Updated room
- **Guard:** Validates ownership

##### 8. Delete Room
**DELETE** `/rooms/:id`
- **Access:** Owner or Admin
- **Response:** Deletion confirmation

### Room Availability Management

##### 9. Get Room Availability
**GET** `/rooms/:id/availability`
- **Access:** Public
- **Query:**
  - `start_date` - Optional
  - `end_date` - Optional
- **Response:** Availability records for date range

##### 10. Set Room Availability
**POST** `/rooms/:id/availability`
- **Access:** Owner or Admin
- **Body:**
  ```json
  {
    "date": "YYYY-MM-DD",
    "available_units": number,
    "price_per_night": number
  }
  ```
- **Response:** Created availability record

##### 11. Set Bulk Availability
**POST** `/rooms/:id/availability/bulk`
- **Access:** Owner or Admin
- **Body:**
  ```json
  {
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD",
    "available_units": number,
    "price_per_night": number
  }
  ```
- **Response:** Created availability records for date range

##### 12. Update Room Availability
**PATCH** `/rooms/:id/availability/:date`
- **Access:** Owner or Admin
- **Body:**
  ```json
  {
    "available_units": number,
    "price_per_night": number
  }
  ```
- **Response:** Updated availability record

---

## Booking Management

### Base Path: `/bookings` and `/hotels/:hotelId/bookings`

#### Customer Endpoints

##### 1. Create Booking
**POST** `/bookings`
- **Access:** Customer, Admin
- **Body:** CreateBookingDto
  ```json
  {
    "room_id": "uuid",
    "check_in_date": "YYYY-MM-DD",
    "check_out_date": "YYYY-MM-DD",
    "number_of_guests": number,
    "units_booked": number,
    "special_requests": "string"
  }
  ```
- **Response:** Created booking with confirmation
- **Features:**
  - Validates availability
  - Calculates total price
  - Deducts from user balance
  - Creates transaction log
  - Sends notifications

##### 2. Get Own Bookings
**GET** `/bookings/mine`
- **Access:** Authenticated
- **Response:** User's bookings

##### 3. Get Booking Details
**GET** `/bookings/:id`
- **Access:** Authenticated (own bookings or owner/admin)
- **Response:** Booking details

##### 4. Cancel Booking
**PATCH** `/bookings/:id/cancel`
- **Access:** Authenticated (own booking)
- **Body:**
  ```json
  {
    "cancellation_reason": "string"
  }
  ```
- **Response:** Cancelled booking
- **Features:**
  - Refund to user balance
  - Creates refund transaction
  - Updates room availability

#### Owner/Admin Endpoints

##### 5. Get Hotel Bookings
**GET** `/hotels/:hotelId/bookings`
- **Access:** Owner or Admin
- **Response:** All bookings for the hotel

##### 6. Search Bookings
**GET** `/bookings/search`
- **Access:** Owner or Admin
- **Query:** SearchBookingDto
- **Response:** Filtered bookings
- **Features:** HotelOwners see only own hotels

##### 7. Update Booking Status
**PATCH** `/bookings/:id/status`
- **Access:** Owner or Admin
- **Body:** UpdateBookingDto
  ```json
  {
    "status": "confirmed" | "checked_in" | "checked_out" | "cancelled"
  }
  ```
- **Response:** Updated booking

##### 8. Get All Bookings (Admin)
**GET** `/bookings`
- **Access:** Admin only
- **Response:** All bookings

---

## Review System

### Base Path: `/reviews` and `/hotels/:hotelId/reviews`

#### Public Endpoints

##### 1. Get Hotel Reviews
**GET** `/hotels/:hotelId/reviews`
- **Access:** Public
- **Query:** `include_pending` (true/false)
- **Response:** Approved reviews for hotel
- **Features:** Only approved reviews shown by default

##### 2. Get Review Statistics
**GET** `/hotels/:hotelId/reviews/statistics`
- **Access:** Public
- **Response:**
  ```json
  {
    "average_rating": number,
    "total_reviews": number,
    "rating_distribution": {
      "5": number,
      "4": number,
      "3": number,
      "2": number,
      "1": number
    }
  }
  ```

##### 3. Get Review Details
**GET** `/reviews/:id`
- **Access:** Public
- **Response:** Review details

#### Customer Endpoints

##### 4. Create Review
**POST** `/reviews` or **POST** `/hotels/:hotelId/reviews`
- **Access:** Customer, Admin
- **Body:** CreateReviewDto
  ```json
  {
    "hotel_id": "uuid",
    "booking_id": "uuid",
    "rating": number (1-5),
    "comment": "string",
    "stay_date": "YYYY-MM-DD"
  }
  ```
- **Response:** Created review
- **Features:**
  - Must have stayed at hotel
  - Pending approval by default
  - Updates hotel avg_rating

##### 5. Get Own Reviews
**GET** `/reviews/mine`
- **Access:** Customer, Admin
- **Response:** User's submitted reviews

##### 6. Update Review
**PATCH** `/reviews/:id`
- **Access:** Customer (own), Admin
- **Body:** UpdateReviewDto
- **Response:** Updated review

##### 7. Delete Review
**DELETE** `/reviews/:id`
- **Access:** Customer (own), Admin
- **Response:** Deletion confirmation

##### 8. Vote Helpful
**POST** `/reviews/:id/vote`
- **Access:** Customer, Admin
- **Body:**
  ```json
  {
    "is_helpful": boolean
  }
  ```
- **Response:** Updated vote count

#### Admin Endpoints

##### 9. Moderate Review
**PATCH** `/reviews/:id/moderate`
- **Access:** Admin only
- **Body:**
  ```json
  {
    "is_approved": boolean,
    "moderation_notes": "string"
  }
  ```
- **Response:** Moderated review

---

## Amenities

### Base Path: `/amenities`

#### Public Endpoints

##### 1. Get All Active Amenities
**GET** `/amenities`
- **Access:** Public
- **Query:** `category` (optional)
- **Response:** List of active amenities

##### 2. Get Amenities by Category
**GET** `/amenities/by-category`
- **Access:** Public
- **Response:** Amenities grouped by category
  ```json
  {
    "Technology": [...],
    "Recreation": [...],
    "Dining": [...]
  }
  ```

##### 3. Search Amenities
**GET** `/amenities/search?q=<term>`
- **Access:** Public
- **Response:** Matching amenities

##### 4. Get Amenity Usage Statistics
**GET** `/amenities/statistics`
- **Access:** Public
- **Response:** Popularity statistics

##### 5. Get Amenity Details
**GET** `/amenities/:id`
- **Access:** Public
- **Response:** Amenity details

#### Admin Endpoints

##### 6. Create Amenity
**POST** `/amenities`
- **Access:** Admin only
- **Body:** CreateAmenityDto
  ```json
  {
    "name": "string",
    "category": "string",
    "icon": "string",
    "description": "string"
  }
  ```
- **Response:** Created amenity

##### 7. Get All Amenities (Admin)
**GET** `/amenities/admin/all`
- **Access:** Admin only
- **Query:**
  - `category` - Optional
  - `is_active` - true/false
- **Response:** All amenities including inactive

##### 8. Update Amenity
**PATCH** `/amenities/:id`
- **Access:** Admin only
- **Body:** UpdateAmenityDto
- **Response:** Updated amenity

##### 9. Deactivate Amenity
**PATCH** `/amenities/:id/deactivate`
- **Access:** Admin only
- **Response:** Soft-deleted amenity

##### 10. Activate Amenity
**PATCH** `/amenities/:id/activate`
- **Access:** Admin only
- **Response:** Activated amenity

##### 11. Delete Amenity (Hard Delete)
**DELETE** `/amenities/:id`
- **Access:** Admin only
- **Response:** Permanent deletion
- **Warning:** Use with caution

---

## Search & Discovery

### Base Path: `/search`

#### Elasticsearch-Powered Search

##### 1. Search Hotels
**GET** `/search/hotels`
- **Access:** Public
- **Query Parameters:**
  - `query` - General search term
  - `city` - City filter
  - `latitude`, `longitude` - Geo location
  - `radius_km` - Search radius (default: 50)
  - `check_in_date`, `check_out_date` - Date filters
  - `number_of_guests` - Guest count
  - `amenity_ids` - Array of amenity IDs
  - `min_price`, `max_price` - Price range
  - `min_rating` - Minimum rating
  - `room_type` - Room type filter
  - `sort_by` - price, rating, distance, name, relevance
  - `sort_order` - ASC, DESC
  - `page`, `limit` - Pagination
- **Response:**
  ```json
  {
    "hotels": [...],
    "total": number,
    "page": number,
    "limit": number,
    "aggregations": {
      "price_ranges": {...},
      "rating_distribution": {...},
      "amenity_counts": {...}
    }
  }
  ```
- **Features:**
  - Full-text search
  - Geo-spatial search
  - Faceted search with aggregations
  - Relevance scoring
  - Fast performance

##### 2. Autocomplete Suggestions
**GET** `/search/hotels/autocomplete?q=<query>`
- **Access:** Public
- **Query:** `limit` (default: 10)
- **Response:** Suggested hotel names and cities

##### 3. Health Check
**GET** `/search/health`
- **Access:** Public
- **Response:** Elasticsearch cluster health

#### Admin Endpoints

##### 4. Create Indices
**POST** `/search/admin/indices/create`
- **Access:** Admin only
- **Response:** All indices created
- **Use Case:** Initial setup or rebuild

##### 5. Delete Index
**DELETE** `/search/admin/indices/:indexName`
- **Access:** Admin only
- **Response:** Index deleted

##### 6. Get Index Statistics
**GET** `/search/admin/indices/:indexName/stats`
- **Access:** Admin only
- **Response:** Index statistics and document count

---

## Real-time Chat

### REST API Base Path: `/chat`
### WebSocket Namespace: `/chat`

#### REST Endpoints

##### 1. Create or Get Chat Room
**POST** `/chat/rooms`
- **Access:** Authenticated
- **Body:** CreateChatRoomDto
  ```json
  {
    "participant_ids": ["uuid1", "uuid2"],
    "type": "user_to_user" | "booking_support"
  }
  ```
- **Response:** Chat room
- **Features:** Returns existing room if already exists

##### 2. Create Chat from Booking
**POST** `/chat/rooms/from-booking/:bookingId`
- **Access:** Authenticated
- **Response:** Chat room for booking
- **Features:**
  - Links customer and hotel owner
  - Associated with booking

##### 3. Get User Chat Rooms
**GET** `/chat/rooms`
- **Access:** Authenticated
- **Query:**
  - `page` (default: 1)
  - `limit` (default: 20)
  - `type` - Filter by room type
- **Response:** Paginated chat rooms

##### 4. Get Specific Chat Room
**GET** `/chat/rooms/:roomId`
- **Access:** Authenticated (participants only)
- **Response:** Chat room details

##### 5. Send Message
**POST** `/chat/messages`
- **Access:** Authenticated
- **Body:**
  ```json
  {
    "chat_room_id": "uuid",
    "message": "string",
    "message_type": "text" | "image" | "file"
  }
  ```
- **Response:** Created message
- **Features:** Broadcasts via WebSocket

##### 6. Get Messages
**GET** `/chat/rooms/:roomId/messages`
- **Access:** Authenticated (participants)
- **Query:**
  - `page` (default: 1)
  - `limit` (default: 50)
  - `before` - Get messages before timestamp
- **Response:** Paginated messages

##### 7. Mark Messages as Read
**POST** `/chat/rooms/:roomId/read`
- **Access:** Authenticated
- **Response:** 204 No Content
- **Features:** Updates read receipts

##### 8. Delete Message
**DELETE** `/chat/messages/:messageId`
- **Access:** Authenticated (sender only)
- **Response:** 204 No Content

##### 9. Get Online Users
**GET** `/chat/rooms/:roomId/online-users`
- **Access:** Authenticated
- **Response:** List of online user IDs

##### 10. Health Check
**GET** `/chat/health`
- **Access:** Authenticated
- **Response:** Service health status

##### 11. Redis Status
**GET** `/chat/redis/status`
- **Access:** Authenticated
- **Response:** Redis connection and metrics

#### WebSocket Events

**Connection:** Connect to `ws://localhost:3000/chat` with JWT token

**Client → Server Events:**
- `join_room` - Join a chat room
  ```json
  { "roomId": "uuid" }
  ```
- `leave_room` - Leave a chat room
  ```json
  { "roomId": "uuid" }
  ```
- `send_message` - Send a message
  ```json
  { "chat_room_id": "uuid", "message": "string" }
  ```
- `mark_messages_read` - Mark messages as read
  ```json
  { "roomId": "uuid" }
  ```
- `typing_start` - User started typing
  ```json
  { "roomId": "uuid" }
  ```
- `typing_stop` - User stopped typing
  ```json
  { "roomId": "uuid" }
  ```

**Server → Client Events:**
- `connected` - Connection established
- `joined_room` - Successfully joined room
- `left_room` - Successfully left room
- `new_message` - New message received
  ```json
  {
    "id": "uuid",
    "chat_room_id": "uuid",
    "sender_id": "uuid",
    "message": "string",
    "created_at": "timestamp"
  }
  ```
- `message_sent` - Message sent confirmation
- `messages_marked_read` - Read receipt
- `user_typing` - Another user is typing
- `user_stopped_typing` - User stopped typing
- `error` - Error occurred

---

## Notifications

### REST API Base Path: `/notifications`
### WebSocket Namespace: `/notifications`

#### REST Endpoints

##### 1. Create Notification
**POST** `/notifications`
- **Access:** Authenticated
- **Body:** CreateNotificationDto
- **Response:** Created notification

##### 2. Send Notification
**POST** `/notifications/send`
- **Access:** Authenticated
- **Body:** SendNotificationDto
  ```json
  {
    "user_id": "uuid",
    "type": "booking_confirmation" | "payment_success" | "chat_message" | etc,
    "title": "string",
    "message": "string",
    "data": {}
  }
  ```
- **Response:** Sent notification

##### 3. Send Bulk Notification
**POST** `/notifications/send/bulk`
- **Access:** Authenticated
- **Body:** SendBulkNotificationDto
  ```json
  {
    "user_ids": ["uuid1", "uuid2"],
    "type": "string",
    "title": "string",
    "message": "string"
  }
  ```
- **Response:** Bulk send confirmation

##### 4. Get User Notifications
**GET** `/notifications`
- **Access:** Authenticated
- **Query:**
  - `page` (default: 1)
  - `limit` (default: 20)
  - `type` - Filter by type
  - `is_read` - true/false
- **Response:** Paginated notifications

##### 5. Get Unread Count
**GET** `/notifications/unread-count`
- **Access:** Authenticated
- **Response:**
  ```json
  { "count": number }
  ```

##### 6. Mark Notification as Read
**PUT** `/notifications/:id/mark`
- **Access:** Authenticated
- **Response:** Updated notification

##### 7. Mark All as Read
**PUT** `/notifications/mark-all-read`
- **Access:** Authenticated
- **Response:** Confirmation

##### 8. Bulk Mark Notifications
**PUT** `/notifications/bulk-mark`
- **Access:** Authenticated
- **Body:**
  ```json
  {
    "notification_ids": ["uuid1", "uuid2"],
    "is_read": boolean
  }
  ```
- **Response:** Confirmation

##### 9. Delete Notification
**DELETE** `/notifications/:id`
- **Access:** Authenticated
- **Response:** Deletion confirmation

##### 10. Delete All Notifications
**DELETE** `/notifications/delete-all`
- **Access:** Authenticated
- **Response:** Deletion confirmation

#### Notification Preferences

##### 11. Get User Preferences
**GET** `/notifications/preferences`
- **Access:** Authenticated
- **Response:** User's notification preferences

##### 12. Update Preference
**PUT** `/notifications/preferences/:type`
- **Access:** Authenticated
- **Body:**
  ```json
  {
    "enabled": boolean,
    "push_enabled": boolean,
    "email_enabled": boolean
  }
  ```
- **Response:** Updated preference

##### 13. Create Preference
**POST** `/notifications/preferences`
- **Access:** Authenticated
- **Body:** CreateNotificationPreferenceDto
- **Response:** Created preference

#### WebSocket Events

**Connection:** Connect to `ws://localhost:3000/notifications` with JWT token

**Client → Server Events:**
- `join_room` - Join notification room
- `leave_room` - Leave notification room
- `mark_as_read` - Mark notification as read
- `get_unread_count` - Request unread count

**Server → Client Events:**
- `new_notification` - New notification received
- `unread_count` - Unread count update
- `notification_marked` - Notification marked
- `room_notification` - Room-specific notification
- `broadcast_notification` - System-wide notification
- `recent_notifications` - Recent notifications on connect

#### Notification Types
- `booking_confirmation`
- `booking_cancellation`
- `booking_reminder`
- `payment_success`
- `payment_failed`
- `refund_processed`
- `chat_message`
- `review_posted`
- `hotel_approved`
- `hotel_rejected`
- `system_announcement`

---

## Transaction & Balance System

### Base Path: `/transactions`
### WebSocket Namespace: `/balance`

#### Customer Endpoints

##### 1. Create Top-up Request
**POST** `/transactions/topup`
- **Access:** Authenticated
- **Body:**
  ```json
  {
    "amount": number,
    "payment_method": "bank_transfer" | "credit_card"
  }
  ```
- **Response:** Pending top-up transaction
- **Features:**
  - Creates transaction with pending status
  - Admin approval required

##### 2. Get User Transactions
**GET** `/transactions/my-transactions`
- **Access:** Authenticated
- **Response:** User's transaction history
- **Types:** topup, booking, refund, adjustment

##### 3. Get Current Balance
**GET** `/transactions/balance`
- **Access:** Authenticated
- **Response:**
  ```json
  {
    "balance": number,
    "currency": "USD"
  }
  ```

##### 4. Get Cached Balance
**GET** `/transactions/balance/cached`
- **Access:** Authenticated
- **Response:** Balance from Redis cache
- **Features:** Faster response, near real-time

##### 5. Get Balance Snapshot
**GET** `/transactions/balance/snapshot`
- **Access:** Authenticated
- **Response:** Balance snapshot with verification
- **Features:** Double-entry accounting verification

##### 6. Get Transaction by ID
**GET** `/transactions/:id`
- **Access:** Authenticated
- **Response:** Transaction details

#### Admin Endpoints

##### 7. Get Pending Top-ups
**GET** `/transactions/topup/pending`
- **Access:** Admin only
- **Response:** All pending top-up requests

##### 8. Get All Top-ups
**GET** `/transactions/topup/all`
- **Access:** Admin only
- **Response:** All top-up transactions

##### 9. Get All Transactions
**GET** `/transactions/all`
- **Access:** Admin only
- **Response:** All transactions in system

##### 10. Process Top-up
**PATCH** `/transactions/topup/:id/process`
- **Access:** Admin only
- **Body:**
  ```json
  {
    "status": "completed" | "failed",
    "admin_notes": "string"
  }
  ```
- **Response:** Processed transaction
- **Features:**
  - Updates user balance if approved
  - Creates balance snapshot
  - Sends notifications
  - Publishes balance update event

##### 11. Verify User Balance
**GET** `/transactions/verify/:userId`
- **Access:** Admin only
- **Response:** Balance verification report
- **Features:** Compares snapshot with calculated balance

##### 12. Audit All Balances
**GET** `/transactions/audit`
- **Access:** Admin only
- **Response:** System-wide balance audit
- **Features:** Verifies integrity of all user balances

##### 13. Recalculate User Balance
**POST** `/transactions/recalculate/:userId`
- **Access:** Admin only
- **Response:** Recalculated balance
- **Use Case:** Fix discrepancies

##### 14. Recalculate All Balances
**POST** `/transactions/recalculate-all`
- **Access:** Admin only
- **Response:** System-wide recalculation
- **Warning:** Resource intensive

### Transaction System Features

#### Double-Entry Accounting
- Every transaction recorded with debit/credit
- Balance snapshots for verification
- Audit trail maintained

#### Transaction Types
- **topup:** User adds funds
- **booking:** Payment for booking
- **refund:** Cancellation refund
- **adjustment:** Manual balance correction (admin)

#### Transaction Flow
1. User creates booking → Deducts balance
2. Creates transaction log (debit)
3. Updates balance snapshot
4. Publishes balance update via Redis
5. WebSocket broadcasts to user

#### Balance Update WebSocket

**Connection:** Connect to `ws://localhost:3000/balance` with JWT token

**Client → Server Events:**
- `subscribe_balance` - Subscribe to balance updates
- `get_current_balance` - Request current balance

**Server → Client Events:**
- `balance_initial` - Initial balance on connect
- `balance_updated` - Balance changed
  ```json
  {
    "newBalance": number,
    "previousBalance": number,
    "transactionId": "uuid",
    "transactionType": "string",
    "amount": number
  }
  ```
- `balance_current` - Current balance response
- `balance_subscribed` - Subscription confirmed

---

## WebSocket Events Summary

### Chat WebSocket (`/chat`)
- **Connection:** JWT authentication required
- **Features:** Real-time messaging, typing indicators, online presence
- **Events:** See [Real-time Chat](#real-time-chat) section

### Notifications WebSocket (`/notifications`)
- **Connection:** JWT authentication required
- **Features:** Real-time notifications, unread counts, room notifications
- **Events:** See [Notifications](#notifications) section

### Balance WebSocket (`/balance`)
- **Connection:** JWT authentication required
- **Features:** Real-time balance updates, transaction notifications
- **Events:** See [Transaction & Balance System](#transaction--balance-system) section

---

## Common Response Formats

### Success Response
```json
{
  "statusCode": 200,
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

### Pagination Response
```json
{
  "data": [...],
  "total": number,
  "page": number,
  "limit": number,
  "has_more": boolean
}
```

---

## Authentication Flow

### 1. Registration
1. POST `/auth/register` with user details
2. Backend sends activation email
3. User clicks link in email
4. GET `/auth/activate?token=<token>`
5. Account activated

### 2. Login
1. POST `/auth/login` with credentials
2. Backend returns access token (JWT)
3. Refresh token stored in httpOnly cookie
4. Client uses access token for API requests

### 3. Token Refresh
1. Access token expires (15 min)
2. POST `/auth/refresh` with refresh token cookie
3. Backend returns new access token
4. Continue using new access token

### 4. Logout
1. POST `/auth/logout`
2. Backend clears refresh token cookie
3. Client discards access token

---

## Error Codes

| Status Code | Meaning |
|------------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Not authenticated |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error |

---

## Rate Limiting & Security

### Security Features
- **JWT Authentication:** Short-lived access tokens, long-lived refresh tokens
- **Password Hashing:** bcrypt with salt
- **CORS:** Configured for frontend domain
- **Helmet:** Security headers
- **Validation:** Class-validator for input validation
- **SQL Injection:** Protected by TypeORM parameterized queries
- **XSS:** Input sanitization

### Best Practices
- Always use HTTPS in production
- Store access token in memory (not localStorage)
- Refresh token in httpOnly cookie
- Implement rate limiting in production
- Enable CSRF protection
- Regular security audits

---

## Environment Variables

Required environment variables:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=tigo_booking

# JWT
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200

# Email
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASSWORD=your_app_password

# Frontend
FRONTEND_URL=http://localhost:3001

# App
NODE_ENV=development
PORT=3000
```

---

## Database Schema Overview

### Core Tables
- **users** - User accounts
- **hotels** - Hotel listings
- **rooms** - Room types
- **room_availability** - Daily availability & pricing
- **bookings** - Reservations
- **reviews** - Hotel reviews
- **amenities** - Hotel amenities
- **hotel_amenities** - Hotel-amenity relationship
- **chat_rooms** - Chat rooms
- **chat_messages** - Chat messages
- **notifications** - User notifications
- **notification_preferences** - User preferences
- **transactions** - Financial transactions
- **balance_snapshots** - Balance verification
- **hotel_requests** - Hotel creation requests
- **hotel_deletion_requests** - Hotel deletion requests

---

## Performance Optimization

### Caching Strategy
- **Redis:** User sessions, balance cache, online presence
- **Elasticsearch:** Fast hotel search with caching
- **Database Indexes:** Optimized queries
- **Eager Loading:** Reduce N+1 queries

### Scalability
- **Horizontal Scaling:** Stateless API design
- **Load Balancing:** Redis pub/sub for multi-instance
- **Database Pooling:** Connection pooling
- **CDN:** Static asset delivery

---

## Testing

### API Testing
- Swagger UI: `http://localhost:3000/api`
- Postman collection available in `/database/markdowns/hotel_api_postman_collection.json`

### E2E Tests
```bash
npm run test:e2e
```

---

## Deployment Considerations

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up database backups
- [ ] Configure Redis persistence
- [ ] Set up Elasticsearch cluster
- [ ] Implement rate limiting
- [ ] Set up monitoring & logging
- [ ] Configure email service
- [ ] Set up CDN for assets

---

## Support & Documentation

- **Swagger API Docs:** `http://localhost:3000/api`
- **Source Code:** `/tigo-server/src`
- **Database Docs:** `/database/markdowns/`
- **Frontend Integration:** `/aurevia-client/`

---

## Version History

**Version:** 1.0.0  
**Last Updated:** November 2024  
**Framework:** NestJS 10.x  
**Node.js:** 18.x or higher

---

## Conclusion

This documentation covers all backend functionality of the Tigo Booking platform. For specific implementation details, refer to the source code in `/tigo-server/src/`. For frontend integration, see the client documentation in `/aurevia-client/`.

**Happy Coding! 🚀**
