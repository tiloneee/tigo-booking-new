# Hotel Module Implementation Plan
## Complete Implementation Roadmap for Tigo-Booking Hotel System

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Part 1: Dependencies, Folder Structure & Seed Update](#part-1-dependencies-folder-structure--seed-update)
3. [Part 2: Hotel and Room Implementation](#part-2-hotel-and-room-implementation)
4. [Part 3: Booking and Amenity Implementation](#part-3-booking-and-amenity-implementation)
5. [Part 4: Review Implementation](#part-4-review-implementation)
6. [Testing Strategy](#testing-strategy)
7. [Progress Tracking](#progress-tracking)

---

## Overview

This implementation plan breaks down the hotel module development into 4 manageable parts, following the existing patterns from the user module and implementing all features specified in the hotel functional specifications.

### 🎯 Goals
- ✅ Complete hotel booking platform
- ✅ Role-based access control
- ✅ Real-time availability management
- ✅ Review and rating system
- ✅ Geospatial search capabilities

### 🛠️ Tech Stack
- **Backend**: NestJS, TypeORM, PostgreSQL
- **Authentication**: JWT with role-based permissions
- **Validation**: class-validator, class-transformer
- **Database**: PostgreSQL with PostGIS for geospatial queries

---

## Part 1: Dependencies, Folder Structure & Seed Update

### ✅ Status: COMPLETED

### 📦 Dependencies Installation
```bash
npm install @nestjs/schedule class-transformer class-validator
npm install --save-dev @types/node
```

### 📁 Folder Structure Created
```
tigo-server/src/modules/hotel/
├── controllers/           # API route handlers
├── dto/                  # Data Transfer Objects
│   ├── hotel/           # Hotel-related DTOs
│   ├── room/            # Room-related DTOs  
│   ├── booking/         # Booking-related DTOs
│   ├── review/          # Review-related DTOs
│   └── amenity/         # Amenity-related DTOs
├── entities/            # TypeORM entities
├── services/            # Business logic services
├── guards/              # Custom authorization guards
└── hotel.module.ts      # Main module configuration
```

### 🔐 Permissions Added (30 total)
- **Hotel Management**: 6 permissions
- **Room Management**: 4 permissions  
- **Pricing & Availability**: 3 permissions
- **Customer Booking**: 5 permissions
- **Booking Administration**: 4 permissions
- **Reviews & Amenities**: 3 permissions

### 📝 Files Modified
- ✅ `tigo-server/src/scripts/seed.ts` - Added hotel permissions
- ✅ `tigo-server/src/app.module.ts` - Added HotelModule import
- ✅ `tigo-server/src/modules/hotel/hotel.module.ts` - Basic module structure

### Part 1: Dependencies & Setup ✅
- [x] Dependencies installed
- [x] Folder structure created
- [x] Permissions added to seed
- [x] App module updated
- [x] Basic hotel module created

---

## Part 2: Hotel and Room Implementation

### 🎯 Status: PENDING

### 📅 Estimated Time: 3-4 days

### 🏗️ Implementation Steps

#### Step 2.1: Create TypeORM Entities

**Files to Create:**
1. `entities/hotel.entity.ts`
2. `entities/hotel-amenity.entity.ts` 
3. `entities/room.entity.ts`
4. `entities/room-availability.entity.ts`

**Key Features:**
- Full database schema mapping
- Proper relationships between entities
- Validation decorators
- Automatic timestamps

#### Step 2.2: Create DTOs

**Hotel DTOs (`dto/hotel/`):**
- `create-hotel.dto.ts` - Hotel creation with validation
- `update-hotel.dto.ts` - Hotel update operations
- `search-hotel.dto.ts` - Search filters and pagination

**Room DTOs (`dto/room/`):**
- `create-room.dto.ts` - Room creation with hotel association
- `update-room.dto.ts` - Room modification
- `room-availability.dto.ts` - Pricing and availability management

#### Step 2.3: Create Services

**Files to Create:**
1. `services/hotel.service.ts` - Hotel CRUD operations
2. `services/room.service.ts` - Room management
3. `services/geocoding.service.ts` - Address to coordinates conversion

**Key Features:**
- Repository pattern implementation
- Transactional operations
- Error handling and validation
- Performance optimization

#### Step 2.4: Create Controllers

**Files to Create:**
1. `controllers/hotel.controller.ts` - Hotel management endpoints
2. `controllers/room.controller.ts` - Room management endpoints

**API Endpoints:**

**Hotel Management:**
```typescript
POST   /hotels              # Create hotel (HotelOwner, Admin)
GET    /hotels/mine          # Get own hotels (HotelOwner)
GET    /hotels/:id           # Get hotel details (Owner/Admin)
PUT    /hotels/:id           # Update hotel (Owner/Admin)
DELETE /hotels/:id           # Delete hotel (Owner/Admin)
GET    /hotels/search        # Search hotels (Public)
GET    /hotels/:id/public    # Public hotel details (Public)
```

**Room Management:**
```typescript
POST   /hotels/:id/rooms     # Add room (Owner/Admin)
GET    /hotels/:id/rooms     # List rooms (Owner/Admin)
PUT    /rooms/:id           # Update room (Owner/Admin)
DELETE /rooms/:id           # Delete room (Owner/Admin)
POST   /rooms/:id/availability # Set room availability (Owner/Admin)
PUT    /rooms/:id/availability # Update availability (Owner/Admin)
```

#### Step 2.5: Create Guards

**Files to Create:**
1. `guards/hotel-ownership.guard.ts` - Verify hotel ownership

#### Step 2.6: Update Module Configuration

**Update `hotel.module.ts`:**
- Add entity imports
- Register services
- Configure controllers
- Export necessary services

### ✅ Success Criteria
- [ ] All entities properly mapped to database
- [ ] CRUD operations working for hotels and rooms  
- [ ] Permission-based access control implemented
- [ ] Geospatial search functionality
- [ ] Room availability management
- [ ] Unit tests passing

---

## Part 3: Booking and Amenity Implementation

### 🎯 Status: PENDING

### 📅 Estimated Time: 3-4 days

### 🏗️ Implementation Steps

#### Step 3.1: Create Booking Entity and DTOs

**Files to Create:**
1. `entities/hotel-booking.entity.ts`
2. `dto/booking/create-booking.dto.ts`
3. `dto/booking/update-booking.dto.ts`
4. `dto/booking/search-booking.dto.ts`

#### Step 3.2: Create Amenity System

**Files to Create:**
1. `entities/hotel-amenity.entity.ts` (if not created in Part 2)
2. `dto/amenity/create-amenity.dto.ts`
3. `dto/amenity/update-amenity.dto.ts`

#### Step 3.3: Create Services

**Files to Create:**
1. `services/booking.service.ts` - Booking management with atomic operations
2. `services/amenity.service.ts` - Amenity catalog management

**Key Features:**
- **Atomic booking operations** - Prevent overbooking
- **Real-time availability checking**
- **Automatic price calculation**
- **Inventory management**
- **Payment status tracking**

#### Step 3.4: Create Controllers

**Files to Create:**
1. `controllers/booking.controller.ts`
2. `controllers/amenity.controller.ts`

**API Endpoints:**

**Booking Management:**
```typescript
POST   /bookings               # Create booking (Customer)
GET    /bookings/mine          # My bookings (Customer)
PUT    /bookings/:id/cancel    # Cancel booking (Customer)
GET    /hotels/:id/bookings    # Hotel bookings (Owner/Admin)
PUT    /bookings/:id/status    # Update booking status (Owner/Admin)
POST   /bookings/:id/payment   # Process payment (Owner/Admin)
```

**Amenity Management:**
```typescript
GET    /amenities             # List all amenities (Public)
POST   /amenities             # Create amenity (Admin)
PUT    /amenities/:id         # Update amenity (Admin)
DELETE /amenities/:id         # Delete amenity (Admin)
```

#### Step 3.5: Implement Business Logic

**Critical Features:**
- **Concurrency Control**: Prevent race conditions in booking
- **Inventory Management**: Real-time availability updates
- **Price Calculation**: Dynamic pricing based on dates
- **Cancellation Policies**: Configurable refund rules

### ✅ Success Criteria
- [ ] Atomic booking operations working
- [ ] No overbooking possible
- [ ] Real-time availability updates
- [ ] Payment processing integration ready
- [ ] Amenity management functional
- [ ] Booking status lifecycle implemented

---

## Part 4: Review Implementation

### 🎯 Status: PENDING

### 📅 Estimated Time: 2-3 days

### 🏗️ Implementation Steps

#### Step 4.1: Create Review Entity and DTOs

**Files to Create:**
1. `entities/hotel-review.entity.ts`
2. `dto/review/create-review.dto.ts`
3. `dto/review/update-review.dto.ts`

#### Step 4.2: Create Review Service

**Files to Create:**
1. `services/review.service.ts`

**Key Features:**
- **Stay Verification**: Only guests who stayed can review
- **Automatic Rating Calculation**: Update hotel average rating
- **Review Moderation**: Optional content filtering
- **Duplicate Prevention**: One review per stay

#### Step 4.3: Create Review Controller

**Files to Create:**
1. `controllers/review.controller.ts`

**API Endpoints:**
```typescript
POST   /hotels/:id/reviews    # Submit review (Customer)
GET    /hotels/:id/reviews    # Get reviews (Public)
PUT    /reviews/:id           # Update review (Customer - own only)
DELETE /reviews/:id           # Delete review (Customer/Admin)
GET    /reviews/mine          # My reviews (Customer)
```

#### Step 4.4: Implement Rating System

**Features:**
- **5-star rating scale**
- **Automatic average calculation**
- **Rating distribution analytics**
- **Review sorting and filtering**

### ✅ Success Criteria
- [ ] Review submission working
- [ ] Stay verification implemented
- [ ] Average rating auto-calculation
- [ ] Review moderation ready
- [ ] Analytics dashboard data available

---

## Testing Strategy

### 🧪 Unit Tests
- [ ] Entity validation tests
- [ ] Service method tests
- [ ] DTO validation tests
- [ ] Guard authorization tests

### 🔗 Integration Tests
- [ ] API endpoint tests
- [ ] Database transaction tests
- [ ] Permission verification tests
- [ ] Search functionality tests

### 📊 Performance Tests
- [ ] Concurrent booking tests
- [ ] Search query performance
- [ ] Large dataset handling
- [ ] Geographic search optimization

### 🔒 Security Tests
- [ ] Authorization bypass attempts
- [ ] SQL injection prevention
- [ ] Input validation tests
- [ ] Rate limiting tests

---

## Progress Tracking

### Part 1: Dependencies & Setup ✅
- [x] Dependencies installed
- [x] Folder structure created
- [x] Permissions added to seed
- [x] App module updated
- [x] Basic hotel module created

### Part 2: Hotel & Room Implementation ⏳
- [ ] Hotel entity created
- [ ] Room entity created
- [ ] Room availability entity created
- [ ] Hotel DTOs implemented
- [ ] Room DTOs implemented
- [ ] Hotel service implemented
- [ ] Room service implemented
- [ ] Geocoding service implemented
- [ ] Hotel controller implemented
- [ ] Room controller implemented
- [ ] Hotel ownership guard implemented
- [ ] Module configuration updated

### Part 3: Booking & Amenity Implementation ⏳
- [ ] Booking entity created
- [ ] Amenity entity created
- [ ] Booking DTOs implemented
- [ ] Amenity DTOs implemented
- [ ] Booking service implemented
- [ ] Amenity service implemented
- [ ] Booking controller implemented
- [ ] Amenity controller implemented
- [ ] Atomic operations tested
- [ ] Payment integration ready

### Part 4: Review Implementation ⏳
- [ ] Review entity created
- [ ] Review DTOs implemented
- [ ] Review service implemented
- [ ] Review controller implemented
- [ ] Stay verification working
- [ ] Rating calculation working
- [ ] Review moderation ready

### Final Integration & Testing ⏳
- [ ] All modules integrated
- [ ] API documentation complete
- [ ] Performance optimized
- [ ] Security verified
- [ ] Production ready

---

## 📞 Support & References

### Documentation References
- [Hotel Functional Specifications](./hotel_functions.md)
- [Database Schema](./database_diagram.md)
- [User Module Implementation](../tigo-server/src/modules/user/)

### Key Patterns to Follow
- Follow existing user module structure
- Use TypeORM decorators consistently
- Implement proper error handling
- Follow NestJS best practices
- Maintain security with guards and permissions

### Commands to Remember
```bash
# Install dependencies
npm install @nestjs/schedule class-transformer class-validator

# Run seed script
npm run seed

# Run development server
npm run start:dev

# Run tests
npm run test

# Build for production
npm run build
```

---

## 🎉 Final Notes

This implementation plan provides a complete roadmap for building a production-ready hotel booking system. Each part builds upon the previous one, ensuring a solid foundation while maintaining code quality and security standards.

**Remember to:**
- Test thoroughly after each part
- Commit changes frequently
- Follow the established patterns
- Update documentation as you progress
- Consider performance implications
- Maintain security standards

**Next Step:** Proceed with Part 2 - Hotel and Room Implementation 