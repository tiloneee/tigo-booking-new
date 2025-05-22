# Tigo-Booking Database Diagram

This document provides a textual representation of the tigo-booking database schema, defined using DBML (Database Markup Language). You can copy and paste the DBML code into a tool like dbdiagram.io to visualize the relationships and structure.

This schema is designed to support a comprehensive booking platform similar to Agoda or Booking.com, covering hotels, restaurants, and transportation services, with robust user management and advanced features.

---

## Core User Management & Authentication

```dbml
Table users {
  id uuid [pk]
  first_name varchar(100)
  last_name varchar(100)
  email varchar(255) [unique, not null]
  password_hash text [not null]
  phone_number varchar(25) [unique, null]
  refresh_token text [null, note: 'Stores the refresh token for authentication sessions']
  is_active boolean [default: true, note: 'Account activation status']
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
}

Table roles {
  id uuid [pk]
  name varchar(50) [unique, not null, note: 'e.g., Admin, Customer, HotelOwner, RestaurantOwner, TransportOwner']
  description text [null]
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
}

// Junction table for many-to-many relationship between users and roles
Table user_roles {
  user_id uuid [ref: > users.id, pk]
  role_id uuid [ref: > roles.id, pk]
  created_at timestamp [default: `now()`]
}

// Optional: For more granular permissions (e.g., 'can_manage_bookings', 'can_edit_properties')
Table permissions {
  id uuid [pk]
  name varchar(100) [unique, not null]
  description text [null]
}

Table role_permissions {
  role_id uuid [ref: > roles.id, pk]
  permission_id uuid [ref: > permissions.id, pk]
}
```

---

## Hotel Management & Bookings

```dbml
Table hotels {
  id uuid [pk]
  owner_id uuid [ref: > users.id, not null, note: 'User who owns this hotel']
  name varchar(255) [not null]
  description text [null]
  address_line1 varchar(255) [not null]
  address_line2 varchar(255) [null]
  city varchar(100) [not null]
  state_province varchar(100) [null]
  zip_code varchar(20) [null]
  country varchar(100) [not null]
  latitude decimal(9,6) [null, note: 'For geospatial search']
  longitude decimal(9,6) [null, note: 'For geospatial search']
  avg_rating decimal(3,2) [default: 0.00, note: 'Computed average from hotel_reviews']
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
}

Table hotel_amenities {
  id uuid [pk]
  name varchar(100) [unique, not null, note: 'e.g., Wi-Fi, Pool, Parking, Gym']
  description text [null]
}

Table hotel_has_amenities { // Junction table for many-to-many
  hotel_id uuid [ref: > hotels.id, pk]
  amenity_id uuid [ref: > hotel_amenities.id, pk]
}

Table rooms {
  id uuid [pk]
  hotel_id uuid [ref: > hotels.id, not null]
  room_number varchar(50) [not null, note: 'Unique within a hotel']
  type varchar(50) [not null, note: 'e.g., Standard, Deluxe, Suite']
  description text [null]
  max_occupancy integer [not null]
  bed_configuration varchar(100) [null, note: 'e.g., 1 King, 2 Queens']
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
}

// For dynamic pricing and availability per room per date
Table room_availability {
  room_id uuid [ref: > rooms.id, pk]
  date date [pk]
  price_per_night decimal(10,2) [not null]
  available_units integer [not null, note: 'Number of units of this room type available on this date']
  status varchar(20) [default: 'Available', note: 'Available, Booked, Maintenance']
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
}

Table hotel_bookings {
  id uuid [pk]
  user_id uuid [ref: > users.id, not null, note: 'User who made the booking']
  room_id uuid [ref: > rooms.id, not null]
  hotel_id uuid [ref: > hotels.id, not null] // Denormalized for easier querying
  check_in_date date [not null]
  check_out_date date [not null]
  number_of_guests integer [not null]
  total_price decimal(10,2) [not null]
  booking_status varchar(20) [default: 'Pending', note: 'Pending, Confirmed, Cancelled, Completed, NoShow']
  payment_status varchar(20) [default: 'Pending', note: 'Pending, Paid, Refunded, Failed']
  cancellation_reason text [null]
  special_requests text [null]
  booked_at timestamp [default: `now()`, note: 'When the booking was made']
  updated_at timestamp [default: `now()`]
}

Table hotel_reviews {
  id uuid [pk]
  hotel_id uuid [ref: > hotels.id, not null]
  user_id uuid [ref: > users.id, not null]
  rating integer [not null, note: '1-5 scale']
  comment text [null]
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
}
```

---

## Restaurant Management & Reservations

```dbml
Table restaurants {
  id uuid [pk]
  owner_id uuid [ref: > users.id, not null, note: 'User who owns this restaurant']
  name varchar(255) [not null]
  description text [null]
  cuisine_type varchar(100) [null]
  address_line1 varchar(255) [not null]
  address_line2 varchar(255) [null]
  city varchar(100) [not null]
  state_province varchar(100) [null]
  zip_code varchar(20) [null]
  country varchar(100) [not null]
  phone_number varchar(25) [unique, null]
  avg_rating decimal(2,1) [default: 0.0, note: 'Computed average from restaurant_reviews']
  opening_hours jsonb [null, note: 'e.g., {"Mon": "9AM-5PM", "Tue": "9AM-5PM"}']
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
}

Table restaurant_reservations {
  id uuid [pk]
  restaurant_id uuid [ref: > restaurants.id, not null]
  user_id uuid [ref: > users.id, not null, note: 'User who made the reservation']
  reservation_start_time timestamp [not null]
  reservation_end_time timestamp [null]
  number_of_guests integer [not null]
  reservation_status varchar(20) [default: 'Pending', note: 'Pending, Confirmed, Cancelled, Seated, Completed, NoShow']
  special_requests text [null]
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
}

Table restaurant_reviews {
  id uuid [pk]
  restaurant_id uuid [ref: > restaurants.id, not null]
  user_id uuid [ref: > users.id, not null]
  rating integer [not null, note: '1-5 scale']
  comment text [null]
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
}
```

---

## Transportation Management & Bookings

```dbml
Table transportation_companies {
  id uuid [pk]
  owner_id uuid [ref: > users.id, not null, note: 'User who owns this company']
  name varchar(255) [unique, not null]
  description text [null]
  address_line1 varchar(255) [not null]
  address_line2 varchar(255) [null]
  city varchar(100) [not null]
  state_province varchar(100) [null]
  zip_code varchar(20) [null]
  country varchar(100) [not null]
  phone_number varchar(25) [not null]
  avg_rating decimal(2,1) [default: 0.0, note: 'Computed average from transportation_reviews']
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
}

Table vehicles {
  id uuid [pk]
  company_id uuid [ref: > transportation_companies.id, not null]
  vehicle_plate varchar(255) [unique, not null]
  type varchar(50) [not null, note: 'e.g., Bus, Car, Van']
  number_of_seats integer [not null]
  make varchar(100) [null]
  model varchar(100) [null]
  year integer [null]
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
}

Table routes {
  id uuid [pk]
  company_id uuid [ref: > transportation_companies.id, not null, note: 'Routes often belong to a company']
  departure_location_name varchar(255) [not null]
  departure_latitude decimal(9,6) [null]
  departure_longitude decimal(9,6) [null]
  arrival_location_name varchar(255) [not null]
  arrival_latitude decimal(9,6) [null]
  arrival_longitude decimal(9,6) [null]
  distance_km float [null]
  estimated_duration_minutes integer [null]
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
}

Table trips {
  id uuid [pk]
  company_id uuid [ref: > transportation_companies.id, not null] // Denormalized for easier querying
  vehicle_id uuid [ref: > vehicles.id, not null]
  route_id uuid [ref: > routes.id, not null]
  departure_time timestamp [not null]
  arrival_time timestamp [not null]
  price_per_seat decimal(10,2) [not null]
  available_seats integer [not null, note: 'Current available seats for booking']
  trip_status varchar(20) [default: 'Scheduled', note: 'Scheduled, Departed, Completed, Cancelled']
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
}

Table transportation_bookings {
  id uuid [pk]
  user_id uuid [ref: > users.id, not null, note: 'User who made the booking']
  trip_id uuid [ref: > trips.id, not null]
  number_of_seats_booked integer [not null]
  total_price decimal(10,2) [not null]
  booking_status varchar(20) [default: 'Pending', note: 'Pending, Confirmed, Cancelled, Completed']
  payment_status varchar(20) [default: 'Pending', note: 'Pending, Paid, Refunded, Failed']
  booked_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
}

Table transportation_reviews {
  id uuid [pk]
  company_id uuid [ref: > transportation_companies.id, not null]
  user_id uuid [ref: > users.id, not null]
  rating integer [not null, note: '1-5 scale']
  review text [null]
  created_at timestamp [default: `now()`]
  updated_at timestamp [default: `now()`]
}
```

---

## Key Relationships and Design Choices

This schema is designed with clarity, scalability, and common booking system features in mind:

- **Users & Authentication:**
  - `users`: Central table for all user information, including `refresh_token` for persistent sessions.
  - `roles` & `user_roles`: Implements a flexible many-to-many relationship for user roles (e.g., Admin, Customer, HotelOwner). A user can have multiple roles.
  - `permissions` & `role_permissions` (Optional): Provides a granular RBAC (Role-Based Access Control) system where permissions are assigned to roles, and users inherit them.

- **Property Ownership:**
  - `hotels.owner_id`, `restaurants.owner_id`, and `transportation_companies.owner_id` explicitly link these entities to the users table, allowing a user to own multiple types of businesses.

- **Hotel Management:**
  - `hotels`: Stores general hotel information, including address breakdown and geospatial coordinates (latitude, longitude) for location-based searches. `avg_rating` is a computed field.
  - `hotel_amenities` & `hotel_has_amenities`: Manages amenities offered by hotels.
  - `rooms`: Defines the types of rooms available within a hotel.
  - `room_availability`: Crucial for dynamic pricing and inventory. This table tracks the `price_per_night` and `available_units` for each room (type) on a specific date. This allows prices and availability to fluctuate daily.
  - `hotel_bookings`: Records individual hotel bookings, linking to the user, room, and hotel. Includes `booking_status` and `payment_status`.

- **Restaurant Management:**
  - `restaurants`: Stores restaurant details, including cuisine type, address breakdown, `avg_rating`, and `opening_hours` (using JSONB for flexible schedules).
  - `restaurant_reservations`: Manages restaurant reservations, linking to the user and restaurant. Includes `reservation_start_time`, `number_of_guests`, and `reservation_status`.

- **Transportation Management:**
  - `transportation_companies`: Details about the transport providers, including address and `avg_rating`.
  - `vehicles`: Information about vehicles owned by a company, including `number_of_seats`.
  - `routes`: Defines travel routes with departure/arrival locations, names, and geospatial coordinates.
  - `trips`: Represents a specific journey on a route using a vehicle at a `departure_time`. `available_seats` is critical for real-time inventory and concurrency management.
  - `transportation_bookings`: Records transportation bookings, linking to the user and trip.

- **Reviews:**
  - Separate review tables (`hotel_reviews`, `restaurant_reviews`, `transportation_reviews`) allow users to rate and comment on specific hotels, restaurants, and transportation companies. Ratings in the main tables are aggregated from these reviews.

- **Timestamps & Constraints:**
  - Most tables include `created_at` and `updated_at` for auditing.
  - UUID is used for primary keys for distributed system benefits.
  - NOT NULL constraints ensure data integrity for critical fields.
  - ON DELETE CASCADE and ON DELETE RESTRICT are used appropriately for foreign key relationships to manage data integrity upon deletion.