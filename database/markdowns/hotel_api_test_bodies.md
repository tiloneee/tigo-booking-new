# Hotel Booking System - API Test Bodies
## Complete Request Body Examples for All Endpoints

---

## 📋 Table of Contents
1. [Hotel Management API](#hotel-management-api)
2. [Room Management API](#room-management-api)
3. [Booking Management API](#booking-management-api)
4. [Amenity Management API](#amenity-management-api)
5. [Complete Test Scenarios](#complete-test-scenarios)
6. [Authentication & Authorization](#authentication--authorization)

---

## 🏨 Hotel Management API

### **Create Hotel**
```http
POST /hotels
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Grand Saigon Hotel",
  "description": "A luxurious 5-star hotel in the heart of Ho Chi Minh City with stunning city views and world-class amenities.",
  "address": "123 Nguyen Hue Boulevard",
  "city": "Ho Chi Minh City",
  "state": "Ho Chi Minh",
  "zip_code": "70000",
  "country": "Vietnam",
  "phone_number": "+84283829999",
  "amenity_ids": ["amenity-uuid-1", "amenity-uuid-2", "amenity-uuid-3"]
}
```

### **Update Hotel**
```http
PATCH /hotels/{hotel-id}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Grand Saigon Hotel & Spa",
  "description": "Updated description with new spa facilities and premium services",
  "phone_number": "+84283829888",
  "amenity_ids": ["amenity-uuid-1", "amenity-uuid-2", "amenity-uuid-4"]
}
```

### **Search Hotels (Public)**
```http
GET /hotels/search?city=Ho Chi Minh City&check_in_date=2024-07-15&check_out_date=2024-07-20&number_of_guests=2&min_price=50&max_price=200&amenities=amenity-uuid-1,amenity-uuid-2&sort_by=price&sort_order=ASC&page=1&limit=10
```

### **Get Own Hotels**
```http
GET /hotels/mine
Authorization: Bearer <jwt_token>
```

### **Get Hotel Details (Owner/Admin)**
```http
GET /hotels/{hotel-id}
Authorization: Bearer <jwt_token>
```

### **Get Public Hotel Details**
```http
GET /hotels/{hotel-id}/public
```

### **Delete Hotel**
```http
DELETE /hotels/{hotel-id}
Authorization: Bearer <jwt_token>
```

### **Get All Hotels (Admin)**
```http
GET /hotels
Authorization: Bearer <jwt_token>
```

---

## 🛏️ Room Management API

### **Create Room**
```http
POST /rooms
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "hotel_id": "hotel-uuid-123",
  "room_number": "101",
  "room_type": "Deluxe King",
  "description": "Spacious deluxe room with king bed, city view, and modern amenities",
  "max_occupancy": 2,
  "bed_type": "King",
  "bed_count": 1,
  "room_size": 35,
  "has_balcony": true,
  "has_city_view": true,
  "has_ocean_view": false
}
```

### **Create Room for Specific Hotel**
```http
POST /hotels/{hotel-id}/rooms
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "room_number": "201",
  "room_type": "Executive Suite",
  "description": "Luxurious executive suite with separate living area and premium amenities",
  "max_occupancy": 4,
  "bed_type": "King + Sofa Bed",
  "bed_count": 2,
  "room_size": 65,
  "has_balcony": true,
  "has_city_view": true,
  "has_ocean_view": false
}
```

### **Update Room**
```http
PATCH /rooms/{room-id}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "description": "Updated room description with new renovations and premium fixtures",
  "max_occupancy": 3,
  "has_balcony": false,
  "room_size": 40
}
```

### **Get Room Details**
```http
GET /rooms/{room-id}
Authorization: Bearer <jwt_token>
```

### **Delete Room**
```http
DELETE /rooms/{room-id}
Authorization: Bearer <jwt_token>
```

### **Get Hotel Rooms**
```http
GET /hotels/{hotel-id}/rooms
Authorization: Bearer <jwt_token>
```

---

## 📅 Room Availability Management

### **Create Room Availability**
```http
POST /rooms/{room-id}/availability
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "date": "2024-07-15",
  "price_per_night": 120.00,
  "available_units": 5,
  "status": "Available"
}
```

### **Create Bulk Room Availability**
```http
POST /rooms/{room-id}/availability/bulk
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "start_date": "2024-07-01",
  "end_date": "2024-07-31",
  "price_per_night": 150.00,
  "available_units": 3,
  "status": "Available"
}
```

### **Update Room Availability**
```http
PATCH /rooms/{room-id}/availability/2024-07-15
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "price_per_night": 135.00,
  "available_units": 2,
  "status": "Available"
}
```

### **Get Room Availability (Public)**
```http
GET /rooms/{room-id}/availability?start_date=2024-07-01&end_date=2024-07-31
```

### **Check Room Availability (Public)**
```http
GET /rooms/{room-id}/availability/check?check_in_date=2024-07-15&check_out_date=2024-07-20&units=2
```

---

## 📝 Booking Management API

### **Create Booking (Customer)**
```http
POST /bookings
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "hotel_id": "hotel-uuid-123",
  "room_id": "room-uuid-456",
  "check_in_date": "2024-07-15",
  "check_out_date": "2024-07-20",
  "number_of_guests": 2,
  "units_requested": 1,
  "guest_name": "Nguyen Hoang Thien Loc",
  "guest_phone": "0922666766",
  "guest_email": "thienloc2015@gmail.com",
  "special_requests": "Late check-in requested, prefer high floor room with city view"
}
```

### **Get My Bookings (Customer)**
```http
GET /bookings/mine
Authorization: Bearer <jwt_token>
```

### **Cancel Booking (Customer)**
```http
PATCH /bookings/{booking-id}/cancel
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "cancellation_reason": "Change of travel plans due to work emergency"
}
```

### **Update Booking Status (Owner/Admin)**
```http
PATCH /bookings/{booking-id}/status
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "status": "Confirmed",
  "payment_status": "Paid",
  "admin_notes": "Payment confirmed via bank transfer. Room 201 assigned."
}
```

### **Search Bookings (Owner/Admin)**
```http
GET /bookings/search?hotel_id=hotel-uuid-123&status=Confirmed,Pending&check_in_from=2024-07-01&check_in_to=2024-07-31&min_price=100&max_price=500&sort_by=created_at&sort_order=DESC&page=1&limit=20
```

### **Get Booking Details**
```http
GET /bookings/{booking-id}
Authorization: Bearer <jwt_token>
```

### **Get All Bookings (Admin)**
```http
GET /bookings
Authorization: Bearer <jwt_token>
```

### **Get Hotel Bookings (Owner/Admin)**
```http
GET /hotels/{hotel-id}/bookings
Authorization: Bearer <jwt_token>
```

---

## 🏊‍♀️ Amenity Management API

### **Get All Active Amenities (Public)**
```http
GET /amenities
```

### **Get Amenities by Category (Public)**
```http
GET /amenities/by-category
```

### **Search Amenities (Public)**
```http
GET /amenities/search?q=pool
```

### **Get Amenity Usage Statistics (Public)**
```http
GET /amenities/statistics
```

### **Get Amenity Details (Public)**
```http
GET /amenities/{amenity-id}
```

### **Create Amenity (Admin)**
```http
POST /amenities
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Infinity Pool",
  "description": "Rooftop infinity pool with panoramic city views",
  "category": "Recreation",
  "icon": "pool-icon",
  "is_active": true
}
```

### **Update Amenity (Admin)**
```http
PATCH /amenities/{amenity-id}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Rooftop Infinity Pool",
  "description": "Updated: Rooftop infinity pool with panoramic city views and poolside bar service",
  "category": "Recreation & Wellness"
}
```

### **Get All Amenities for Admin**
```http
GET /amenities/admin/all?category=Recreation&is_active=true
Authorization: Bearer <jwt_token>
```

### **Deactivate Amenity (Admin)**
```http
PATCH /amenities/{amenity-id}/deactivate
Authorization: Bearer <jwt_token>
```

### **Activate Amenity (Admin)**
```http
PATCH /amenities/{amenity-id}/activate
Authorization: Bearer <jwt_token>
```

### **Delete Amenity (Admin)**
```http
DELETE /amenities/{amenity-id}
Authorization: Bearer <jwt_token>
```

---

## 🧪 Complete Test Scenarios

### **Scenario 1: Hotel Owner Complete Setup**

1. **Create Hotel**
   ```json
   POST /hotels
   {
     "name": "Luxury Beach Resort",
     "description": "5-star beachfront resort",
     "address": "456 Beach Road",
     "city": "Da Nang",
     "state": "Da Nang",
     "zip_code": "50000",
     "country": "Vietnam",
     "phone_number": "+84236123456"
   }
   ```

2. **Create Multiple Rooms**
   ```json
   POST /hotels/{hotel-id}/rooms
   {
     "room_number": "101",
     "room_type": "Ocean View Deluxe",
     "max_occupancy": 2,
     "bed_type": "King",
     "bed_count": 1,
     "has_ocean_view": true
   }
   ```

3. **Set Bulk Availability**
   ```json
   POST /rooms/{room-id}/availability/bulk
   {
     "start_date": "2024-07-01",
     "end_date": "2024-12-31",
     "price_per_night": 200.00,
     "available_units": 1,
     "status": "Available"
   }
   ```

### **Scenario 2: Customer Booking Journey**

1. **Search Hotels**
   ```http
   GET /hotels/search?city=Da Nang&check_in_date=2024-08-15&check_out_date=2024-08-20&number_of_guests=2
   ```

2. **View Hotel Details**
   ```http
   GET /hotels/{hotel-id}/public
   ```

3. **Check Room Availability**
   ```http
   GET /rooms/{room-id}/availability/check?check_in_date=2024-08-15&check_out_date=2024-08-20&units=1
   ```

4. **Create Booking**
   ```json
   POST /bookings
   {
     "hotel_id": "hotel-uuid",
     "room_id": "room-uuid",
     "check_in_date": "2024-08-15",
     "check_out_date": "2024-08-20",
     "number_of_guests": 2,
     "guest_name": "John Doe",
     "guest_email": "john@example.com"
   }
   ```

5. **View My Bookings**
   ```http
   GET /bookings/mine
   ```

### **Scenario 3: Admin Management**

1. **Create Amenities**
   ```json
   POST /amenities
   {
     "name": "Free WiFi",
     "category": "Technology",
     "description": "High-speed internet access"
   }
   ```

2. **View All Hotels**
   ```http
   GET /hotels
   ```

3. **View All Bookings**
   ```http
   GET /bookings
   ```

---

## 🔐 Authentication & Authorization

### **User Roles and Permissions**

| Role | Hotel Management | Room Management | Booking Management | Amenity Management |
|------|------------------|-----------------|-------------------|-------------------|
| **Customer** | ❌ | ❌ | ✅ Own bookings | ❌ |
| **HotelOwner** | ✅ Own hotels | ✅ Own rooms | ✅ Own hotel bookings | ❌ |
| **Admin** | ✅ All hotels | ✅ All rooms | ✅ All bookings | ✅ All amenities |


