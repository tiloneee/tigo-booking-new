# Tigo Booking System - Database Architecture Diagram

## Overview
This document provides a comprehensive database schema for the Tigo Booking System, a full-featured hotel booking platform with real-time chat, notifications, and transaction management.

---

## 📊 Visual Database Diagram (DBML)

Copy and paste this DBML code into [dbdiagram.io](https://dbdiagram.io) to visualize the database structure.

```dbml
// =====================================
// TIGO BOOKING SYSTEM - DATABASE SCHEMA
// =====================================

// ==================
// 1. USER MANAGEMENT
// ==================

Table users {
  id uuid [pk, default: `uuid_generate_v4()`]
  first_name varchar(100) [not null]
  last_name varchar(100) [not null]
  email varchar(255) [unique, not null]
  password_hash text [not null]
  phone_number varchar(25) [null]
  refresh_token text [null, note: 'JWT refresh token for authentication']
  is_active boolean [default: false, note: 'Email verification status']
  activation_token text [null]
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
  
  Indexes {
    email [unique]
    phone_number [unique]
  }
}

Table roles {
  id uuid [pk, default: `uuid_generate_v4()`]
  name varchar(50) [unique, not null, note: 'Admin, Customer, HotelOwner']
  description text
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
}

Table user_roles {
  user_id uuid [pk, ref: > users.id]
  role_id uuid [pk, ref: > roles.id]
  
  Indexes {
    (user_id, role_id) [pk]
  }
}

Table permissions {
  id uuid [pk, default: `uuid_generate_v4()`]
  name varchar(100) [unique, not null]
  description text
}

Table role_permissions {
  role_id uuid [pk, ref: > roles.id]
  permission_id uuid [pk, ref: > permissions.id]
  
  Indexes {
    (role_id, permission_id) [pk]
  }
}

// ==================
// 2. HOTEL MANAGEMENT
// ==================

Table hotels {
  id uuid [pk, default: `uuid_generate_v4()`]
  owner_id uuid [not null, ref: > users.id]
  name varchar(200) [not null]
  description text [not null]
  address varchar(500) [not null]
  city varchar(100) [not null]
  state varchar(100) [not null]
  zip_code varchar(20) [not null]
  country varchar(100) [not null]
  phone_number varchar(20) [not null]
  latitude numeric(10,8) [null]
  longitude numeric(11,8) [null]
  avg_rating numeric(3,2) [default: 0]
  total_reviews integer [default: 0]
  is_active boolean [default: true]
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
  
  Indexes {
    owner_id
    city
    is_active
  }
}

Table hotel_requests {
  id uuid [pk, default: `uuid_generate_v4()`]
  name varchar(200) [not null]
  description text [not null]
  address varchar(500) [not null]
  city varchar(100) [not null]
  state varchar(100) [not null]
  zip_code varchar(20) [not null]
  country varchar(100) [not null]
  phone_number varchar(20) [not null]
  status hotel_requests_status_enum [default: 'pending', note: 'pending, approved, rejected']
  requested_by_user_id uuid [not null, ref: > users.id]
  reviewed_by_user_id uuid [null, ref: > users.id]
  admin_notes text [null]
  created_hotel_id uuid [null]
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
  
  Indexes {
    status
    requested_by_user_id
  }
}

Table hotel_deletion_requests {
  id uuid [pk, default: `uuid_generate_v4()`]
  hotel_id uuid [not null, ref: > hotels.id]
  reason text [not null]
  status hotel_deletion_requests_status_enum [default: 'pending', note: 'pending, approved, rejected']
  requested_by_user_id uuid [null, ref: > users.id]
  reviewed_by_user_id uuid [null, ref: > users.id]
  admin_notes text [null]
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
  
  Indexes {
    hotel_id
    status
  }
}

// ==================
// 3. AMENITIES
// ==================

Table hotel_amenities {
  id uuid [pk, default: `uuid_generate_v4()`]
  name varchar(100) [not null]
  description text
  category varchar(100) [note: 'WiFi, Pool, Gym, etc.']
  icon varchar(50)
  is_active boolean [default: true]
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
}

Table hotel_has_amenities {
  hotel_id uuid [pk, ref: > hotels.id]
  amenity_id uuid [pk, ref: > hotel_amenities.id]
  
  Indexes {
    (hotel_id, amenity_id) [pk]
  }
}

Table hotel_amenity_mappings {
  hotel_id uuid [pk, ref: > hotels.id]
  amenity_id uuid [pk, ref: > hotel_amenities.id]
  
  Indexes {
    (hotel_id, amenity_id) [pk]
  }
}

// ==================
// 4. ROOMS & AVAILABILITY
// ==================

Table rooms {
  id uuid [pk, default: `uuid_generate_v4()`]
  hotel_id uuid [not null, ref: > hotels.id]
  room_number varchar(20) [not null]
  room_type varchar(100) [not null, note: 'Deluxe, Suite, Standard, etc.']
  description text
  max_occupancy integer [not null]
  bed_configuration varchar(200) [note: '1 King, 2 Queens, etc.']
  size_sqm numeric(10,2)
  is_active boolean [default: true]
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
  
  Indexes {
    hotel_id
    room_number
    is_active
  }
}

Table room_availability {
  id uuid [pk, default: `uuid_generate_v4()`]
  room_id uuid [not null, ref: > rooms.id]
  date date [not null]
  price_per_night numeric(10,2) [not null]
  available_units integer [not null]
  total_units integer [default: 0]
  status room_availability_status_enum [default: 'Available', note: 'Available, Booked, Maintenance, Blocked']
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
  
  Indexes {
    (room_id, date) [unique]
    status
  }
}

// ==================
// 5. BOOKINGS
// ==================

Table hotel_bookings {
  id uuid [pk, default: `uuid_generate_v4()`]
  user_id uuid [not null, ref: > users.id]
  room_id uuid [not null, ref: > rooms.id]
  hotel_id uuid [not null, ref: > hotels.id]
  check_in_date date [not null]
  check_out_date date [not null]
  number_of_guests integer [not null]
  units_requested integer [default: 1]
  total_price numeric(10,2) [not null]
  paid_amount numeric(10,2) [default: 0]
  guest_name varchar(200)
  guest_phone varchar(20)
  guest_email varchar(100)
  special_requests text
  status hotel_bookings_status_enum [default: 'Pending', note: 'Pending, Confirmed, Cancelled, Completed, CheckedIn, CheckedOut, NoShow']
  payment_status hotel_bookings_payment_status_enum [default: 'Pending', note: 'Pending, Paid, Refunded, PartialRefund, Failed']
  cancellation_reason text
  admin_notes text
  cancelled_at timestamp
  confirmed_at timestamp
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
  
  Indexes {
    user_id
    hotel_id
    room_id
    status
    (check_in_date, check_out_date)
  }
}

// ==================
// 6. REVIEWS
// ==================

Table hotel_reviews {
  id uuid [pk, default: `uuid_generate_v4()`]
  hotel_id uuid [not null, ref: > hotels.id]
  user_id uuid [not null, ref: > users.id]
  booking_id uuid [not null, ref: > hotel_bookings.id]
  rating integer [not null, note: '1-5 stars']
  comment text
  title varchar(200)
  cleanliness_rating integer [note: '1-5 stars']
  location_rating integer [note: '1-5 stars']
  service_rating integer [note: '1-5 stars']
  value_rating integer [note: '1-5 stars']
  is_verified_stay boolean [default: false]
  stay_date timestamp
  is_approved boolean [default: true]
  moderation_notes text
  helpful_votes integer [default: 0]
  total_votes integer [default: 0]
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
  
  Indexes {
    hotel_id
    user_id
    booking_id
    rating
  }
}

// ==================
// 7. TRANSACTIONS & PAYMENTS
// ==================

Table transactions {
  id uuid [pk, default: `gen_random_uuid()`]
  user_id uuid [not null, ref: > users.id]
  type transactions_type_enum [not null, note: 'topup, booking_payment, refund, admin_adjustment']
  status transactions_status_enum [default: 'pending', note: 'pending, success, failed, cancelled']
  amount numeric(10,2) [not null]
  description text
  admin_notes text
  processed_by uuid [null, ref: > users.id]
  reference_id uuid [null, note: 'Reference to booking or other entity']
  reference_type varchar [null, note: 'booking, topup, etc.']
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
  
  Indexes {
    user_id
    type
    status
    reference_id
  }
}

Table balance_snapshots {
  id uuid [pk, default: `gen_random_uuid()`]
  user_id uuid [not null, ref: > users.id]
  current_balance numeric(10,2) [default: 0, not null]
  created_at timestamp [default: `now()`]
  last_updated timestamp [default: `now()`]
  
  Indexes {
    user_id [unique]
  }
}

// ==================
// 8. REAL-TIME CHAT
// ==================

Table chat_rooms {
  id uuid [pk, default: `uuid_generate_v4()`]
  participant1_id uuid [not null, ref: > users.id]
  participant2_id uuid [not null, ref: > users.id]
  hotel_id uuid [null, ref: > hotels.id]
  booking_id uuid [null, ref: > hotel_bookings.id]
  last_message_content text
  last_message_at timestamp
  is_active boolean [default: true]
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
  
  Indexes {
    participant1_id
    participant2_id
    hotel_id
    booking_id
  }
}

Table chat_messages {
  id uuid [pk, default: `uuid_generate_v4()`]
  chat_room_id uuid [not null, ref: > chat_rooms.id]
  sender_id uuid [not null, ref: > users.id]
  content text [not null]
  type chat_messages_type_enum [default: 'text', note: 'text, file, image']
  status chat_messages_status_enum [default: 'sent', note: 'sent, delivered, read']
  file_url text
  file_name text
  file_size integer
  metadata jsonb
  is_edited boolean [default: false]
  edited_at timestamp
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
  
  Indexes {
    chat_room_id
    sender_id
    created_at
  }
}

// ==================
// 9. NOTIFICATIONS
// ==================

Table notifications {
  id uuid [pk, default: `uuid_generate_v4()`]
  user_id uuid [not null, ref: > users.id]
  type notifications_type_enum [not null, note: 'CHAT_MESSAGE, NEW_BOOKING, BOOKING_CONFIRMATION, etc.']
  title varchar [not null]
  message text [not null]
  status notifications_status_enum [default: 'UNREAD', note: 'UNREAD, READ, ARCHIVED']
  metadata jsonb
  related_entity_type varchar [note: 'booking, hotel, chat, etc.']
  related_entity_id varchar [note: 'UUID of related entity']
  is_push_sent boolean [default: false]
  is_email_sent boolean [default: false]
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
  
  Indexes {
    user_id
    type
    status
    created_at
  }
}

Table notification_templates {
  id uuid [pk, default: `uuid_generate_v4()`]
  type notification_templates_type_enum [not null]
  title_template varchar [not null]
  message_template text [not null]
  email_template text
  is_active boolean [default: true]
  default_settings jsonb
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
  
  Indexes {
    type [unique]
  }
}

Table notification_preferences {
  id uuid [pk, default: `uuid_generate_v4()`]
  user_id uuid [not null, ref: > users.id]
  type notification_preferences_type_enum [not null]
  in_app_enabled boolean [default: true]
  email_enabled boolean [default: true]
  push_enabled boolean [default: false]
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
  
  Indexes {
    user_id
    type
  }
}

// ==================
// ENUMS DEFINITION
// ==================

Enum hotel_requests_status_enum {
  pending
  approved
  rejected
}

Enum hotel_deletion_requests_status_enum {
  pending
  approved
  rejected
}

Enum room_availability_status_enum {
  Available
  Booked
  Maintenance
  Blocked
}

Enum hotel_bookings_status_enum {
  Pending
  Confirmed
  Cancelled
  Completed
  CheckedIn
  CheckedOut
  NoShow
}

Enum hotel_bookings_payment_status_enum {
  Pending
  Paid
  Refunded
  PartialRefund
  Failed
}

Enum transactions_type_enum {
  topup
  booking_payment
  refund
  admin_adjustment
}

Enum transactions_status_enum {
  pending
  success
  failed
  cancelled
}

Enum chat_messages_type_enum {
  text
  file
  image
}

Enum chat_messages_status_enum {
  sent
  delivered
  read
}

Enum notifications_type_enum {
  CHAT_MESSAGE
  NEW_BOOKING
  BOOKING_CREATED
  BOOKING_CONFIRMATION
  BOOKING_CANCELLED
  BOOKING_REMINDER
  REVIEW_RECEIVED
  HOTEL_APPROVED
  HOTEL_REJECTED
  HOTEL_REQUEST_CREATED
  SYSTEM_ANNOUNCEMENT
  PAYMENT_SUCCESS
  PAYMENT_FAILED
  TOPUP_REQUEST
  TOPUP_APPROVED
  TOPUP_REJECTED
}

Enum notifications_status_enum {
  UNREAD
  READ
  ARCHIVED
}

Enum notification_templates_type_enum {
  CHAT_MESSAGE
  NEW_BOOKING
  BOOKING_CREATED
  BOOKING_CONFIRMATION
  BOOKING_CANCELLED
  BOOKING_REMINDER
  REVIEW_RECEIVED
  HOTEL_APPROVED
  HOTEL_REJECTED
  HOTEL_REQUEST_CREATED
  SYSTEM_ANNOUNCEMENT
  PAYMENT_SUCCESS
  PAYMENT_FAILED
  TOPUP_REQUEST
  TOPUP_APPROVED
  TOPUP_REJECTED
}

Enum notification_preferences_type_enum {
  CHAT_MESSAGE
  NEW_BOOKING
  BOOKING_CREATED
  BOOKING_CONFIRMATION
  BOOKING_CANCELLED
  BOOKING_REMINDER
  REVIEW_RECEIVED
  HOTEL_APPROVED
  HOTEL_REJECTED
  HOTEL_REQUEST_CREATED
  SYSTEM_ANNOUNCEMENT
  PAYMENT_SUCCESS
  PAYMENT_FAILED
  TOPUP_REQUEST
  TOPUP_APPROVED
  TOPUP_REJECTED
}
```

---

## 📋 Table Descriptions

### 1. User Management Module

#### **users**
- Core user accounts table
- Stores authentication credentials (email, password_hash)
- Supports JWT refresh token authentication
- Email activation workflow with activation_token

#### **roles**
- Defines system roles: Admin, Customer, HotelOwner
- Supports role-based access control (RBAC)

#### **user_roles**
- Many-to-many relationship between users and roles
- Single user can have multiple roles

#### **permissions**
- Granular permission system for fine-grained access control

#### **role_permissions**
- Maps permissions to roles

---

### 2. Hotel Management Module

#### **hotels**
- Main hotel entity
- Stores location data (address, city, state, coordinates)
- Aggregated rating and review count
- Owner relationship for hotel management

#### **hotel_requests**
- Hotel creation request workflow
- Requires admin approval before hotel activation
- Tracks request status and admin review

#### **hotel_deletion_requests**
- Soft delete workflow for hotels
- Requires admin approval
- Maintains audit trail

---

### 3. Amenities Module

#### **hotel_amenities**
- Master list of available amenities
- Categorized amenities (WiFi, Pool, Gym, etc.)
- Icon support for UI display

#### **hotel_has_amenities / hotel_amenity_mappings**
- Many-to-many relationship between hotels and amenities
- Allows hotels to have multiple amenities

---

### 4. Room & Availability Module

#### **rooms**
- Individual room inventory for hotels
- Room types, capacity, and configuration
- Size and bed configuration metadata

#### **room_availability**
- Daily availability calendar
- Dynamic pricing per night
- Multi-unit support (multiple identical rooms)
- Status tracking (Available, Booked, Maintenance, Blocked)

---

### 5. Booking Module

#### **hotel_bookings**
- Central booking entity
- Supports multi-night stays
- Guest information capture
- Dual status system:
  - Booking status (Pending → Confirmed → Completed)
  - Payment status (Pending → Paid)
- Cancellation tracking with reasons

---

### 6. Review & Rating Module

#### **hotel_reviews**
- Multi-criteria rating system:
  - Overall rating (1-5 stars)
  - Cleanliness, Location, Service, Value ratings
- Verified stay validation via booking_id
- Helpfulness voting system
- Moderation support

---

### 7. Transaction & Payment Module

#### **transactions**
- Comprehensive transaction log
- Types: topup, booking_payment, refund, admin_adjustment
- Reference tracking to related entities
- Admin processing workflow

#### **balance_snapshots**
- Real-time user balance tracking
- Single record per user with current balance
- Updated via transaction processing

---

### 8. Real-Time Chat Module

#### **chat_rooms**
- Private 1-to-1 chat rooms
- Links to hotel and booking context
- Tracks last message for UI display

#### **chat_messages**
- Message content with type support (text, file, image)
- Delivery tracking (sent, delivered, read)
- File attachment support
- Edit tracking

---

### 9. Notification System

#### **notifications**
- User notification inbox
- Rich metadata support (JSON)
- Multi-channel tracking (in-app, email, push)
- Related entity linking for context

#### **notification_templates**
- Template-based notification system
- Supports email and in-app formats
- Variable substitution support

#### **notification_preferences**
- User-configurable notification settings
- Per-type granular control
- Multi-channel preferences

---

## 🔗 Key Relationships

### Primary Relationships

1. **User → Hotels** (1:Many)
   - HotelOwner creates and manages multiple hotels

2. **Hotel → Rooms** (1:Many)
   - Each hotel contains multiple rooms

3. **Room → Availability** (1:Many)
   - Each room has daily availability records

4. **User → Bookings** (1:Many)
   - Users can make multiple bookings

5. **Booking → Review** (1:1)
   - Each booking can have one review

6. **User ↔ User → ChatRoom** (Many:Many)
   - Users communicate via chat rooms

7. **ChatRoom → Messages** (1:Many)
   - Each chat room contains multiple messages

8. **User → Transactions** (1:Many)
   - Users have transaction history

9. **User → Notifications** (1:Many)
   - Users receive multiple notifications

---

## 📊 Database Statistics

- **Total Tables**: 22
- **Total Enums**: 10
- **Total Indexes**: 50+
- **Foreign Key Constraints**: 32

---

## 🔐 Security Features

1. **Password Hashing**: bcrypt hashed passwords
2. **JWT Authentication**: Access + Refresh token pattern
3. **Email Verification**: Activation token workflow
4. **Role-Based Access**: RBAC with permissions
5. **Soft Deletes**: Deletion request workflow
6. **Audit Trails**: Created/Updated timestamps on all tables

---

## 🚀 Performance Optimizations

1. **Strategic Indexing**: 
   - Composite indexes on frequently queried columns
   - Unique constraints on business keys

2. **Materialized Data**:
   - avg_rating and total_reviews on hotels
   - balance_snapshots for quick balance lookup

3. **Date Range Indexes**:
   - Optimized for booking date queries

4. **Status Indexes**:
   - Fast filtering by booking/request status

---

## 🔄 Data Flow Examples

### Booking Flow
```
User searches → Room Availability → Creates Booking (Pending) →
Admin Confirms → Booking (Confirmed) → Transaction (booking_payment) →
Stay Completes → Booking (Completed) → User leaves Review
```

### Hotel Creation Flow
```
HotelOwner submits → Hotel Request (pending) →
Admin Reviews → Hotel Request (approved) →
Hotel Created → Owner manages rooms/availability
```

### Transaction Flow
```
User requests topup → Transaction (pending) →
Admin approves → Transaction (success) →
Balance Snapshot updated → User can book
```

---

## 📝 Notes

- All tables use UUID primary keys for better distribution and security
- Timestamps are in UTC without timezone
- JSONB fields support flexible metadata storage
- Enum types provide type safety and data integrity
- ON DELETE CASCADE maintains referential integrity

---

## 🛠️ Technology Stack

- **Database**: PostgreSQL 17.4
- **Extensions**: uuid-ossp
- **ORM**: TypeORM
- **Backend**: NestJS
- **Real-time**: Socket.IO (WebSocket)
- **Search**: Elasticsearch (for hotel search)
- **Cache**: Redis (for chat and sessions)

---

*Generated from database dump on November 19, 2025*
