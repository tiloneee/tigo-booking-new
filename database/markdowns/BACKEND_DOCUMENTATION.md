# Tigo Booking Backend - Technical Documentation

## 📚 Table of Contents
- [System Overview](#system-overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Module Structure](#module-structure)
- [API Endpoints](#api-endpoints)
- [Authentication & Authorization](#authentication--authorization)
- [Real-Time Features](#real-time-features)
- [Database Design](#database-design)
- [Deployment & Configuration](#deployment--configuration)

---

## 🎯 System Overview

### Project Description
Tigo Booking is a comprehensive hotel booking platform built with NestJS, providing enterprise-grade features including real-time chat, advanced search with Elasticsearch, notification system, and transaction management.

### Key Features
- **User Management**: Multi-role authentication (Admin, Customer, HotelOwner)
- **Hotel Management**: CRUD operations with approval workflow
- **Booking System**: Real-time room availability and reservation
- **Payment System**: Integrated wallet and transaction management
- **Real-Time Chat**: WebSocket-based messaging between users
- **Notifications**: Multi-channel notification system (In-app, Email, Push)
- **Search**: Elasticsearch-powered hotel search with filters
- **Review System**: Multi-criteria rating and review platform

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
│              (Next.js Web App, Mobile Apps)                  │
└────────────┬────────────────────────────┬───────────────────┘
             │                            │
             │ HTTP/REST                  │ WebSocket
             │                            │
┌────────────▼────────────────────────────▼───────────────────┐
│                      API Gateway Layer                       │
│                    (NestJS Controllers)                      │
├──────────────────────────────────────────────────────────────┤
│                     Business Logic Layer                     │
│                      (NestJS Services)                       │
├──────────────────────────────────────────────────────────────┤
│                    Data Access Layer                         │
│                  (TypeORM Repositories)                      │
└────────────┬─────────────┬──────────────┬───────────────────┘
             │             │              │
             │             │              │
     ┌───────▼──────┐ ┌───▼────┐  ┌─────▼──────┐
     │  PostgreSQL  │ │ Redis  │  │Elasticsearch│
     │   Database   │ │ Cache  │  │   Search    │
     └──────────────┘ └────────┘  └────────────┘
```

### Design Patterns

1. **Module Pattern**: Each feature is encapsulated in a NestJS module
2. **Repository Pattern**: TypeORM repositories for data access
3. **DTO Pattern**: Data Transfer Objects for API validation
4. **Guard Pattern**: Authentication and authorization guards
5. **Gateway Pattern**: WebSocket gateways for real-time features
6. **Event-Driven**: Event emitters for notification system

---

## 🛠️ Technology Stack

### Core Framework
- **NestJS** v11.0.1 - Progressive Node.js framework
- **TypeScript** v5.7.3 - Type-safe JavaScript
- **Node.js** v18+ - Runtime environment

### Database & ORM
- **PostgreSQL** 17.4 - Primary relational database
- **TypeORM** v0.3.24 - Object-Relational Mapping
- **Redis** v4.7.1 - Caching and session management

### Search & Analytics
- **Elasticsearch** v8.15.0 - Full-text search engine
- **@nestjs/elasticsearch** v11.1.0 - Elasticsearch integration

### Authentication & Security
- **Passport.js** v0.7.0 - Authentication middleware
- **JWT** (@nestjs/jwt v11.0.0) - Token-based auth
- **bcryptjs** v3.0.2 - Password hashing
- **cookie-parser** v1.4.7 - Cookie handling

### Real-Time Communication
- **Socket.IO** v4.8.1 - WebSocket library
- **@nestjs/websockets** v11.1.6 - WebSocket integration

### API Documentation
- **Swagger** (@nestjs/swagger v11.2.0) - OpenAPI documentation

### Email Service
- **Nodemailer** v7.0.3 - Email sending

### Validation
- **class-validator** v0.14.2 - DTO validation
- **class-transformer** v0.5.1 - Object transformation

---

## 📦 Module Structure

### 1. User Module (`src/modules/user/`)

#### Responsibilities
- User registration and authentication
- Role-based access control (RBAC)
- User profile management
- Email verification

#### Key Components

**Controllers:**
- `AuthController` - Login, register, refresh token
- `UserController` - Profile management, user CRUD

**Services:**
- `AuthService` - Authentication logic, JWT token generation
- `UserService` - User CRUD operations, role management

**Entities:**
- `User` - User account information
- `Role` - System roles (Admin, Customer, HotelOwner)
- `Permission` - Fine-grained permissions

**DTOs:**
```typescript
// Registration
CreateUserDto {
  email: string
  password: string
  firstName: string
  lastName: string
  phoneNumber?: string
}

// Login
LoginDto {
  email: string
  password: string
}

// Response
LoginResponseDto {
  user: User
  accessToken: string
  refreshToken: string (in HTTP-only cookie)
}
```

**Authentication Flow:**
```
1. User Registration → Email Verification → Account Activation
2. User Login → JWT Access Token + Refresh Token (cookie)
3. Protected Routes → JWT Validation → Role Check
4. Token Refresh → Validate Refresh Token → New Access Token
```

---

### 2. Hotel Module (`src/modules/hotel/`)

#### Responsibilities
- Hotel management (CRUD)
- Room inventory management
- Booking processing
- Review and rating system
- Amenity management

#### Key Components

**Controllers:**
- `HotelController` - Hotel CRUD, search, approval workflow
- `RoomController` - Room management
- `BookingController` - Booking creation and management
- `ReviewController` - Review submission and moderation
- `AmenityController` - Amenity management

**Services:**
- `HotelService` - Hotel business logic, approval workflow
- `RoomService` - Room availability, pricing
- `BookingService` - Booking validation, conflict checking
- `ReviewService` - Review aggregation, rating calculation
- `AmenityService` - Amenity CRUD
- `GeocodingService` - Location coordinate conversion

**Entities:**
- `Hotel` - Hotel information
- `Room` - Room inventory
- `RoomAvailability` - Daily availability and pricing
- `HotelBooking` - Booking records
- `HotelReview` - Customer reviews
- `HotelAmenity` - Amenity master data
- `HotelRequest` - Hotel creation requests
- `HotelDeletionRequest` - Hotel deletion requests

**Business Logic Examples:**

1. **Hotel Approval Workflow**
```typescript
// Hotel Owner submits request
POST /hotels/requests
{
  name: string
  description: string
  address: string
  // ... other details
}

// Admin reviews and approves
PATCH /hotels/requests/:id/approve
→ Creates actual Hotel entity
→ Notifies hotel owner
→ Sets owner_id to requestor
```

2. **Room Availability Check**
```typescript
// Check if room is available for date range
async checkAvailability(
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  unitsNeeded: number
): Promise<boolean> {
  // Query room_availability table
  // Check available_units >= unitsNeeded
  // Validate no booking conflicts
  // Return availability status
}
```

3. **Booking Creation Flow**
```typescript
// 1. Validate room availability
// 2. Calculate total price from availability records
// 3. Check user balance (if using wallet)
// 4. Create booking (status: Pending)
// 5. Deduct user balance
// 6. Create transaction record
// 7. Send notification to hotel owner
// 8. Return booking confirmation
```

---

### 3. Transaction Module (`src/modules/transaction/`)

#### Responsibilities
- Wallet balance management
- Transaction processing
- Topup request handling
- Refund processing
- Payment reconciliation

#### Key Components

**Controllers:**
- `TransactionController` - Transaction history, topup requests

**Services:**
- `TransactionService` - Transaction CRUD, balance updates

**Entities:**
- `Transaction` - Transaction records
- `BalanceSnapshot` - Current user balances

**Transaction Types:**
```typescript
enum TransactionType {
  TOPUP = 'topup',
  BOOKING_PAYMENT = 'booking_payment',
  REFUND = 'refund',
  ADMIN_ADJUSTMENT = 'admin_adjustment'
}

enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}
```

**Topup Workflow:**
```
1. User requests topup → Transaction (pending)
2. Admin reviews request
3. Admin approves → Transaction (success) + Balance updated
4. User receives notification
```

**Payment Processing:**
```typescript
async processBookingPayment(
  userId: string,
  bookingId: string,
  amount: number
): Promise<Transaction> {
  // 1. Check user balance
  // 2. Create transaction record
  // 3. Deduct from balance_snapshots
  // 4. Update booking payment_status
  // 5. Emit payment event
  // 6. Return transaction
}
```

---

### 4. Chat Module (`src/modules/chat/`)

#### Responsibilities
- Real-time messaging
- Chat room management
- Message persistence
- Read receipts and delivery status

#### Key Components

**Controllers:**
- `ChatController` - Chat room creation, message history

**Services:**
- `ChatService` - Message CRUD, room management

**Gateways:**
- `ChatGateway` - WebSocket event handlers

**Entities:**
- `ChatRoom` - Chat room between two users
- `ChatMessage` - Individual messages

**WebSocket Events:**
```typescript
// Client → Server
@SubscribeMessage('send_message')
async handleSendMessage(
  client: Socket,
  payload: SendMessageDto
) {
  // 1. Validate user authentication
  // 2. Save message to database
  // 3. Emit to recipient via WebSocket
  // 4. Update chat room last_message
}

// Server → Client
socket.emit('new_message', {
  id: string
  chatRoomId: string
  senderId: string
  content: string
  type: 'text' | 'file' | 'image'
  createdAt: Date
})

socket.emit('message_delivered', { messageId: string })
socket.emit('message_read', { messageId: string })
```

**Chat Room Creation:**
```typescript
// Automatic room creation between participants
POST /chat/rooms
{
  participant2Id: string
  hotelId?: string
  bookingId?: string
}

// Room lookup: Check existing room between users
// If exists, return existing room
// If not, create new room
```

---

### 5. Notification Module (`src/modules/notification/`)

#### Responsibilities
- Multi-channel notifications (In-app, Email, Push)
- Notification templates
- User preferences management
- Real-time notification delivery

#### Key Components

**Controllers:**
- `NotificationController` - Get notifications, mark as read
- `DebugController` - Testing and debugging

**Services:**
- `NotificationService` - Notification CRUD
- `RedisNotificationService` - Real-time delivery via Redis
- `NotificationEventService` - Event-driven notification creation

**Gateways:**
- `NotificationGateway` - WebSocket notification delivery

**Entities:**
- `Notification` - Notification records
- `NotificationTemplate` - Reusable templates
- `NotificationPreference` - User preferences

**Notification Types:**
```typescript
enum NotificationType {
  CHAT_MESSAGE = 'CHAT_MESSAGE',
  NEW_BOOKING = 'NEW_BOOKING',
  BOOKING_CONFIRMATION = 'BOOKING_CONFIRMATION',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  HOTEL_APPROVED = 'HOTEL_APPROVED',
  HOTEL_REJECTED = 'HOTEL_REJECTED',
  TOPUP_APPROVED = 'TOPUP_APPROVED',
  TOPUP_REJECTED = 'TOPUP_REJECTED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT'
}
```

**Notification Creation Flow:**
```typescript
async createNotification(
  userId: string,
  type: NotificationType,
  data: NotificationData
) {
  // 1. Get user preferences for notification type
  // 2. Apply template with data variables
  // 3. Create notification record
  // 4. If in_app_enabled: Send via WebSocket
  // 5. If email_enabled: Queue email
  // 6. If push_enabled: Send push notification
  // 7. Store in database for history
}
```

---

### 6. Search Module (`src/modules/search/`)

#### Responsibilities
- Hotel search with Elasticsearch
- Advanced filtering (location, price, rating, amenities)
- Autocomplete suggestions
- Search result ranking

#### Key Components

**Controllers:**
- `SearchController` - Search endpoints

**Services:**
- `SearchService` - Elasticsearch queries, indexing

**Search Features:**
```typescript
// Hotel Search
GET /search/hotels
Query Parameters:
  - query: string (hotel name, city, description)
  - city: string
  - minPrice: number
  - maxPrice: number
  - rating: number
  - amenities: string[]
  - page: number
  - limit: number

// Elasticsearch Query Structure
{
  bool: {
    must: [
      { match: { name: query } },
      { term: { is_active: true } }
    ],
    filter: [
      { range: { avg_rating: { gte: rating } } },
      { terms: { amenity_ids: amenities } },
      { geo_distance: { distance: "10km", location: coords } }
    ]
  }
}
```

**Indexing Strategy:**
```typescript
// Hotel document structure in Elasticsearch
{
  id: string
  name: string
  description: string
  city: string
  country: string
  location: {
    lat: number
    lon: number
  }
  avg_rating: number
  total_reviews: number
  amenities: string[]
  min_price: number
  is_active: boolean
}
```

---

## 🔐 Authentication & Authorization

### Authentication Strategy

**JWT Token-Based Authentication:**
```typescript
// Access Token (Short-lived)
{
  sub: userId,
  email: string,
  roles: string[],
  exp: 15 minutes
}

// Refresh Token (Long-lived, HTTP-only cookie)
{
  sub: userId,
  exp: 7 days
}
```

### Authorization Levels

**1. Public Routes** (No authentication required)
```typescript
POST /auth/register
POST /auth/login
GET /hotels (public hotel listing)
GET /hotels/:id (public hotel details)
```

**2. Authenticated Routes** (JWT required)
```typescript
@UseGuards(JwtAuthGuard)
GET /bookings/my-bookings
POST /bookings
GET /notifications
POST /chat/messages
```

**3. Role-Based Routes**
```typescript
// Admin Only
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
GET /users
PATCH /hotels/requests/:id/approve
PATCH /transactions/:id/approve

// Hotel Owner
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('HotelOwner')
POST /hotels/requests
GET /hotels/my-hotels
POST /rooms

// Customer
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Customer')
POST /bookings
POST /reviews
```

**4. Resource Ownership Guards**
```typescript
@UseGuards(JwtAuthGuard, HotelOwnershipGuard)
PATCH /hotels/:id
DELETE /rooms/:id
// Validates that user owns the hotel
```

### Guard Implementation

```typescript
// JWT Auth Guard
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Validates JWT token
    // Attaches user to request object
    return super.canActivate(context);
  }
}

// Roles Guard
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler()
    );
    const { user } = context.switchToHttp().getRequest();
    return user.roles.some(role => 
      requiredRoles.includes(role.name)
    );
  }
}
```

---

## 🔌 API Endpoints

### Authentication Endpoints

```http
POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/refresh
POST /auth/forgot-password
POST /auth/reset-password
GET  /auth/activate/:token
```

### User Management

```http
GET    /users
GET    /users/:id
PATCH  /users/:id
DELETE /users/:id
GET    /users/profile
PATCH  /users/profile
```

### Hotel Management

```http
# Hotels
GET    /hotels
GET    /hotels/:id
POST   /hotels
PATCH  /hotels/:id
DELETE /hotels/:id
GET    /hotels/my-hotels

# Hotel Requests (Approval Workflow)
GET    /hotels/requests
POST   /hotels/requests
GET    /hotels/requests/:id
PATCH  /hotels/requests/:id/approve
PATCH  /hotels/requests/:id/reject

# Rooms
GET    /hotels/:hotelId/rooms
POST   /hotels/:hotelId/rooms
GET    /rooms/:id
PATCH  /rooms/:id
DELETE /rooms/:id

# Room Availability
GET    /rooms/:roomId/availability
POST   /rooms/:roomId/availability
PATCH  /availability/:id
DELETE /availability/:id
```

### Booking Management

```http
GET    /bookings
POST   /bookings
GET    /bookings/:id
PATCH  /bookings/:id
DELETE /bookings/:id
GET    /bookings/my-bookings
GET    /hotels/:hotelId/bookings
PATCH  /bookings/:id/status (confirm/cancel)
```

### Review System

```http
GET    /hotels/:hotelId/reviews
POST   /hotels/:hotelId/reviews
GET    /reviews/:id
PATCH  /reviews/:id
DELETE /reviews/:id
GET    /reviews/mine
POST   /reviews/:id/vote
```

### Transaction & Wallet

```http
GET    /transactions
GET    /transactions/:id
POST   /transactions/topup
GET    /transactions/mine
PATCH  /transactions/:id/approve
GET    /balance
```

### Chat System

```http
GET    /chat/rooms
POST   /chat/rooms
GET    /chat/rooms/:id
GET    /chat/rooms/:id/messages
POST   /chat/messages
PATCH  /chat/messages/:id/read
```

### Notifications

```http
GET    /notifications
GET    /notifications/unread
PATCH  /notifications/:id/read
PATCH  /notifications/read-all
DELETE /notifications/:id
GET    /notifications/preferences
PATCH  /notifications/preferences
```

### Search

```http
GET    /search/hotels
GET    /search/suggestions
```

### Amenities

```http
GET    /amenities
POST   /amenities
PATCH  /amenities/:id
DELETE /amenities/:id
```

---

## 🌐 Real-Time Features

### WebSocket Events

#### Chat Events
```typescript
// Client → Server
socket.emit('send_message', {
  chatRoomId: string
  content: string
  type: 'text' | 'file' | 'image'
})

socket.emit('typing', { chatRoomId: string })
socket.emit('mark_as_read', { messageId: string })

// Server → Client
socket.on('new_message', (message: ChatMessage) => {})
socket.on('user_typing', ({ userId, chatRoomId }) => {})
socket.on('message_read', ({ messageId }) => {})
```

#### Notification Events
```typescript
// Server → Client
socket.on('new_notification', (notification: Notification) => {})
socket.on('notification_update', ({ id, status }) => {})
```

### WebSocket Authentication
```typescript
// Client connects with JWT token
const socket = io('http://localhost:3000', {
  auth: {
    token: accessToken
  }
});

// Server validates token
@WebSocketGateway()
export class ChatGateway {
  @UseGuards(WsJwtAuthGuard)
  handleConnection(client: Socket) {
    // Extract user from JWT
    // Join user-specific room
  }
}
```

---

## 💾 Database Design

See [DATABASE_DIAGRAM.md](./database/DATABASE_DIAGRAM.md) for complete schema.

### Key Tables

**Core Entities:**
- `users` - User accounts
- `roles` - System roles
- `hotels` - Hotel information
- `rooms` - Room inventory
- `room_availability` - Daily pricing and availability
- `hotel_bookings` - Booking records
- `hotel_reviews` - Customer reviews
- `transactions` - Financial transactions

**Supporting Tables:**
- `hotel_amenities` - Amenity master data
- `hotel_has_amenities` - Hotel-amenity mapping
- `chat_rooms` - Chat conversations
- `chat_messages` - Chat messages
- `notifications` - Notification inbox
- `balance_snapshots` - Current user balances

### Indexing Strategy

**Performance Indexes:**
```sql
-- Frequent lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_hotels_city ON hotels(city);
CREATE INDEX idx_bookings_user ON hotel_bookings(user_id);
CREATE INDEX idx_bookings_hotel ON hotel_bookings(hotel_id);

-- Date range queries
CREATE INDEX idx_availability_date ON room_availability(room_id, date);
CREATE INDEX idx_bookings_dates ON hotel_bookings(check_in_date, check_out_date);

-- Status filtering
CREATE INDEX idx_bookings_status ON hotel_bookings(status);
CREATE INDEX idx_transactions_status ON transactions(status);

-- Composite indexes
CREATE UNIQUE INDEX idx_room_avail ON room_availability(room_id, date);
CREATE INDEX idx_chat_participants ON chat_rooms(participant1_id, participant2_id);
```

---

## 🚀 Deployment & Configuration

### Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=tigo_booking_db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Elasticsearch
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_INDEX=hotels

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@tigobooking.com

# Frontend URL
FRONTEND_URL=http://localhost:3001

# Server
PORT=3000
NODE_ENV=development
```

### Running the Application

```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod

# Database seeding
npm run seed

# Elasticsearch setup
npm run elasticsearch:setup

# Redis check
npm run redis:check
```

### Docker Deployment

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_DB: tigo_booking_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  elasticsearch:
    image: elasticsearch:8.15.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"

  app:
    build: .
    depends_on:
      - postgres
      - redis
      - elasticsearch
    environment:
      - NODE_ENV=production
    ports:
      - "3000:3000"
```

### API Documentation

**Swagger UI available at:**
```
http://localhost:3000/api
```

---

## 📊 System Metrics & Monitoring

### Performance Considerations

1. **Database Optimization**
   - Connection pooling (TypeORM)
   - Query optimization with indexes
   - Pagination for large datasets

2. **Caching Strategy**
   - Redis for session management
   - Cache frequently accessed hotel data
   - Cache search results

3. **Real-Time Scalability**
   - Socket.IO Redis adapter for horizontal scaling
   - Room-based event broadcasting

4. **Search Performance**
   - Elasticsearch for fast full-text search
   - Async indexing to avoid blocking

---

## 🔒 Security Best Practices

1. **Authentication**
   - JWT tokens with short expiration
   - HTTP-only cookies for refresh tokens
   - Password hashing with bcrypt

2. **Authorization**
   - Role-based access control
   - Resource ownership validation
   - Guard-based route protection

3. **Input Validation**
   - DTO validation with class-validator
   - SQL injection prevention (TypeORM parameterized queries)
   - XSS protection

4. **Rate Limiting**
   - API rate limiting (recommended: @nestjs/throttler)
   - Login attempt limiting

5. **Data Protection**
   - CORS configuration
   - Helmet.js for security headers
   - HTTPS in production

---

## 📈 Future Enhancements

1. **Payment Gateway Integration**
   - Stripe/PayPal integration
   - Automated payment processing

2. **Advanced Analytics**
   - Booking analytics dashboard
   - Revenue reporting
   - User behavior tracking

3. **Multi-Language Support**
   - i18n for API responses
   - Multi-currency support

4. **Mobile Push Notifications**
   - Firebase Cloud Messaging
   - Apple Push Notification Service

5. **File Upload**
   - Hotel image management
   - S3/Cloud storage integration

---

## 🤝 Contributing

### Code Standards
- TypeScript strict mode
- ESLint + Prettier formatting
- Unit tests for services
- E2E tests for critical flows

### Git Workflow
```bash
# Feature branch
git checkout -b feature/new-feature

# Commit with conventional commits
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
```

---

## 📝 API Response Format

### Success Response
```json
{
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "name": "Hotel Name",
    // ... entity data
  },
  "message": "Success"
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "error": "Email must be valid"
    }
  ]
}
```

---

## 📞 Support & Contact

For technical questions or issues:
- GitHub Issues: [Repository Issues](https://github.com/tiloneee/tigo-booking-new/issues)
- Documentation: See `/docs` folder

---

*Last Updated: November 19, 2025*
*Version: 0.0.1*
