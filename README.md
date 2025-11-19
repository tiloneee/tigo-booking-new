# 🏨 Tigo Booking Platform

A comprehensive hotel booking platform inspired by Agoda and Booking.com. Built with NestJS and Next.js, featuring real-time chat, advanced search with Elasticsearch, wallet-based payments, and a complete admin dashboard for hotel and booking management.

## 🌟 Features

### 🔐 Authentication & Authorization
- **JWT-based Authentication** with refresh tokens stored in httpOnly cookies
- **Role-Based Access Control (RBAC)** with granular permissions system
- **Multi-role Support**: Admin, Customer, HotelOwner
- **Secure Token Management** with automatic refresh and expiration handling
- **Cookie-based Session** for enhanced security

### 🏨 Hotel Management System
- **Complete Hotel CRUD** with owner verification and admin approval workflow
- **Room Management** with types, occupancy, bed configurations, and pricing
- **Dynamic Availability** with date-range availability management
- **Real-time Availability** checking with pessimistic locking to prevent overbooking
- **Geospatial Search** with Elasticsearch for location-based filtering
- **Review & Rating System** with multi-criteria ratings (cleanliness, service, location, facilities, value)
- **Amenities Management** with categorized amenities (wifi, pool, gym, spa, etc.)
- **Hotel Request System** with admin approval workflow for new hotels
- **Hotel Deletion Requests** with approval process for safety

### 💬 Real-time Chat System
- **WebSocket-based Messaging** using Socket.IO for instant communication
- **Chat Rooms** between customers and hotel owners
- **Message Read Status** tracking with unread counts
- **Real-time Notifications** for new messages
- **Message History** with pagination support
- **Typing Indicators** and online status

### 🔔 Notification System
- **Multi-channel Notifications**: In-app, Email, Push (WebSocket)
- **Real-time Updates** via WebSocket connections
- **Notification Types**: Booking confirmations, payment updates, chat messages
- **Read/Unread Tracking** with unread count badges
- **Email Notifications** via Nodemailer for critical updates

### 🔍 Advanced Search & Filtering (Elasticsearch)
- **Full-text Search** powered by Elasticsearch 8.15
- **Location-based Search** with geospatial queries and distance sorting
- **Date Availability** filtering integrated with booking data
- **Price Range** and rating-based filtering
- **Amenity-based Filtering** with multiple amenity selection
- **Sorting Options**: relevance, price, rating, distance, name
- **Pagination Support** with efficient result sets
- **Auto-sync** between PostgreSQL and Elasticsearch for real-time updates

### 💳 Wallet & Transaction System
- **Virtual Wallet** for each user with balance management
- **Balance Top-up Requests** with admin approval workflow
- **Transaction Logging** with comprehensive audit trails
- **Booking Transactions** with automatic balance deduction
- **Transaction Types**: TopUp, Debit, Refund, Adjustment
- **Transaction Status Tracking**: Pending, Completed, Failed, Refunded
- **Pessimistic Locking** to prevent race conditions in concurrent bookings

### 📊 Admin Dashboard & Management
- **User Management**: View, activate/deactivate users, role assignment
- **Hotel Management**: View all hotels, manage status, navigate to hotel details
- **Hotel Request Approval**: Review and approve/reject new hotel submissions
- **Balance Request Approval**: Process user balance top-up requests
- **Hotel Deletion Requests**: Handle hotel deletion with approval workflow
- **Booking Management**: View and manage booking status (confirm, cancel, complete)
- **Review Monitoring**: View and filter hotel reviews
- **Comprehensive Hotel Page**: Dedicated management interface per hotel with tabs for:
  - Hotel Info & Amenities editing
  - Room management with availability
  - Booking status management
  - Review display and filtering

### 🛡️ Security & Compliance
- **Data Protection** with comprehensive input validation using class-validator
- **Audit Trails** for all critical operations with timestamps
- **Concurrency Handling** with pessimistic locking to prevent race conditions
- **Role-based Resource Access** with ownership verification guards
- **Security Guards** for endpoint protection (JWT, Roles, Permissions)
- **HTTP-only Cookies** for refresh token storage
- **CORS Configuration** for secure cross-origin requests

## 🛠️ Tech Stack

### Backend (NestJS)
- **Framework**: NestJS 11.0.1 with TypeScript 5.7.3
- **Database**: PostgreSQL 17.4
- **ORM**: TypeORM 0.3.24 with migration support
- **Search Engine**: Elasticsearch 8.15.0
- **Cache**: Redis 4.7.1 for session and WebSocket state
- **Real-time**: Socket.IO 4.8.1 for WebSocket communication
- **Authentication**: JWT with Passport.js, bcryptjs for password hashing
- **Validation**: class-validator & class-transformer
- **Documentation**: Swagger/OpenAPI at `/api/docs`
- **Email Service**: Nodemailer 7.0.3

### Frontend (Next.js)
- **Framework**: Next.js 15.2.4 with App Router
- **UI Library**: React 19.0.0
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4.1.10 with custom vintage theme
- **HTTP Client**: Axios 1.12.2 with interceptors for JWT refresh
- **Real-time**: Socket.IO Client 4.8.1
- **UI Components**: Radix UI primitives
- **Notifications**: Sonner for toast notifications
- **Icons**: Lucide React
- **Date Handling**: date-fns 4.1.0

### Database & Data Management
- **Primary Database**: PostgreSQL 17.4 with UUID support
- **Schema Definition**: DBML for visualization (22 tables)
- **Data Relationships**: Complex many-to-many with junction tables
- **Performance**: Strategic indexing and query optimization
- **Search Index**: Elasticsearch with auto-sync from PostgreSQL
- **Caching**: Redis for WebSocket state and session management

## 📁 Project Structure

```
tigo-booking-new/
├── database/                     # Database documentation and schemas
│   ├── markdowns/               # Detailed implementation documentation
│   │   ├── CHAT_MODULE_DOCUMENTATION.md
│   │   ├── BOOKING_TRANSACTION_FLOW_DIAGRAM.md
│   │   ├── ELASTICSEARCH_IMPLEMENTATION_PLAN.md
│   │   ├── DASHBOARD_FEATURE_DOCUMENTATION.md
│   │   └── ... (30+ documentation files)
│   ├── DATABASE_DIAGRAM.md      # Complete database schema (DBML - 22 tables)
│   ├── migrations/              # SQL migration files
│   └── dummy_db.sql             # Database dump with sample data
│
├── aurevia-client/              # Next.js frontend application
│   ├── app/                     # Next.js App Router
│   │   ├── (dashboard)/         # Admin dashboard routes
│   │   │   └── admin/
│   │   │       ├── page.tsx     # Main dashboard with tabs
│   │   │       └── hotel/[id]/  # Hotel management page
│   │   └── (user)/              # User-facing routes
│   │       ├── auth/            # Login/Register
│   │       ├── hotels/          # Hotel browsing
│   │       ├── chat/            # Chat interface
│   │       ├── notifications/   # Notification center
│   │       └── dashboard/       # User dashboard
│   ├── components/              # React components
│   │   ├── dashboard/           # Admin dashboard components
│   │   │   ├── hotels-tab.tsx
│   │   │   ├── users-tab.tsx
│   │   │   ├── hotel-requests-tab.tsx
│   │   │   ├── balance-requests-tab.tsx
│   │   │   └── hotel-management/ # Hotel detail page tabs
│   │   ├── chat/                # Chat components
│   │   ├── notifications/       # Notification components
│   │   └── ui/                  # Reusable UI components (Radix UI)
│   ├── lib/                     # Utilities and services
│   │   ├── auth-context.tsx     # Auth state management
│   │   ├── chat-context.tsx     # Chat WebSocket context
│   │   ├── axios.ts             # Axios config with JWT refresh
│   │   └── api/                 # API service layer
│   │       ├── hotels.ts
│   │       ├── chat.ts
│   │       ├── notifications.ts
│   │       └── dashboard.ts
│   └── types/                   # TypeScript type definitions
│
├── tigo-server/                 # NestJS backend application
│   ├── src/
│   │   ├── common/              # Shared utilities
│   │   │   ├── decorators/      # Custom decorators (@Roles, @Public)
│   │   │   ├── guards/          # Auth & authorization guards
│   │   │   └── strategies/      # Passport JWT strategy
│   │   ├── modules/
│   │   │   ├── user/            # User & authentication module
│   │   │   │   ├── controllers/ # auth.controller, user.controller
│   │   │   │   ├── entities/    # User, Role, Permission
│   │   │   │   └── services/    # Auth service, user service
│   │   │   ├── hotel/           # Hotel management module
│   │   │   │   ├── controllers/ # Hotel, room, booking, review controllers
│   │   │   │   ├── entities/    # Hotel, Room, Booking, Review, Amenity
│   │   │   │   └── services/    # Hotel business logic
│   │   │   ├── transaction/     # Wallet & transaction module
│   │   │   │   ├── controllers/ # Balance, transaction controllers
│   │   │   │   ├── entities/    # Balance, Transaction, BalanceRequest
│   │   │   │   └── services/    # Transaction processing
│   │   │   ├── chat/            # Real-time chat module
│   │   │   │   ├── chat.gateway.ts  # WebSocket gateway
│   │   │   │   ├── entities/    # ChatRoom, ChatMessage
│   │   │   │   └── services/    # Chat business logic
│   │   │   ├── notification/    # Notification module
│   │   │   │   ├── notification.gateway.ts
│   │   │   │   ├── entities/    # Notification
│   │   │   │   └── services/    # Notification delivery
│   │   │   └── search/          # Elasticsearch module
│   │   │       ├── search.controller.ts
│   │   │       └── search.service.ts
│   │   ├── scripts/             # Database seeding and utilities
│   │   │   ├── seed.ts          # Main seed script
│   │   │   └── elasticsearch-setup.ts
│   │   └── main.ts              # Application entry point
│   └── test/                    # Test suites
│
├── BACKEND_DOCUMENTATION.md     # Comprehensive backend technical docs
├── FRONTEND_DOCUMENTATION.md    # Comprehensive frontend technical docs
└── README.md                    # Project overview (this file)
```

## 🎯 Core Functionalities

### User Management & Authentication
- **Email-based Registration**: Secure user registration with password hashing
- **JWT Authentication**: Access token (15 min) + Refresh token (7 days in httpOnly cookie)
- **Role-based Access Control**: Admin, Customer, HotelOwner with permission system
- **Automatic Token Refresh**: Frontend automatically refreshes expired tokens
- **User Profile Management**: Update profile information and view balance
- **Admin User Management**: Activate/deactivate users, view all accounts

### Hotel Operations & Management
- **Hotel Request Workflow**: Users submit hotel requests → Admin approves → Hotel created
- **Complete Hotel CRUD**: Create, read, update, delete hotels (with owner verification)
- **Room Management**: Multiple rooms per hotel with pricing and occupancy details
- **Availability Management**: Date-range availability with optimistic/pessimistic locking
- **Amenities System**: Categorized amenities (wifi, pool, gym, parking, spa, etc.)
- **Hotel Status Management**: Active/Inactive status controlled by admin
- **Hotel Deletion Requests**: Safe deletion workflow with admin approval
- **Owner Dashboard**: Hotel owners can manage their properties and view bookings

### Booking & Transaction System
- **Room Booking**: Check availability and book rooms for specific dates
- **Wallet-based Payments**: Virtual wallet with balance deduction for bookings
- **Balance Top-up**: Users request balance top-up → Admin approves
- **Transaction Logging**: Complete audit trail of all financial transactions
- **Booking Status Flow**: Pending → Confirmed → Completed (or Cancelled)
- **Pessimistic Locking**: Prevents double-booking in concurrent scenarios
- **Booking Management**: Admin and hotel owners can confirm/cancel/complete bookings

### Review & Rating System
- **Multi-criteria Reviews**: Rate cleanliness, service, location, facilities, value (1-5 stars)
- **Text Reviews**: Users can write detailed feedback
- **Verified Bookings**: Only users who completed bookings can review
- **Average Ratings**: Automatic calculation of overall hotel ratings
- **Review Filtering**: Filter by rating score and search by reviewer name
- **Review Display**: Public display on hotel pages with detailed breakdowns

### Real-time Chat Communication
- **WebSocket Messaging**: Instant communication using Socket.IO
- **Chat Rooms**: Dedicated rooms for customer-hotel owner conversations
- **Message History**: Persistent message storage with pagination
- **Unread Tracking**: Unread message counts per room
- **Read Status**: Mark messages as read when viewed
- **Real-time Notifications**: Toast notifications for new messages
- **Online Status**: Connection status indicators

### Notification System
- **Multi-channel Delivery**: In-app + Email + WebSocket push
- **Notification Types**: 
  - Booking confirmations/updates
  - Balance top-up approvals
  - Chat messages
  - Hotel request status
- **Real-time Push**: WebSocket notifications appear instantly
- **Unread Badges**: Visual indicators for unread notifications
- **Email Notifications**: Critical updates sent via Nodemailer
- **Mark as Read**: Individual and bulk mark as read

### Search & Discovery (Elasticsearch)
- **Full-text Search**: Search hotels by name, description, location
- **Geospatial Search**: Find hotels near coordinates with distance sorting
- **Date Availability Filter**: Only show available hotels for selected dates
- **Price Range Filter**: Min/max price filtering
- **Rating Filter**: Minimum rating requirement
- **Amenity Filter**: Multi-select amenity filtering
- **Sort Options**: Relevance, price (asc/desc), rating, distance, name
- **Auto-sync**: PostgreSQL changes automatically sync to Elasticsearch

### Admin Dashboard
- **User Management Tab**: View all users, activate/deactivate, assign roles
- **Hotels Tab**: Card-based view of all hotels with status toggle
- **Hotel Requests Tab**: Approve/reject new hotel submissions
- **Balance Requests Tab**: Approve/reject user balance top-up requests
- **Hotel Deletion Requests Tab**: Approve/reject hotel deletion requests
- **Hotel Detail Page**: Comprehensive management interface per hotel:
  - **Info Tab**: Edit hotel details, manage amenities
  - **Rooms Tab**: CRUD rooms, manage availability calendars
  - **Bookings Tab**: View and update booking statuses
  - **Reviews Tab**: View all reviews with filtering

## 🏗️ Architecture Highlights

### Backend Architecture (NestJS)
- **Modular Design**: 6 main modules (User, Hotel, Transaction, Chat, Notification, Search)
- **Service-Oriented**: Business logic encapsulated in dedicated service classes
- **Guard-Based Security**: JWT guards, Role guards, Permission guards
- **DTO Validation**: class-validator decorators for request validation
- **Repository Pattern**: TypeORM repositories for database abstraction
- **WebSocket Gateways**: Socket.IO gateways for real-time features
- **Dependency Injection**: NestJS IoC container for clean architecture

### Frontend Architecture (Next.js)
- **App Router**: File-based routing with route groups for organization
- **Server Components**: Optimized performance with React Server Components
- **Client Components**: Interactive components with state management
- **Context API**: AuthContext, ChatContext, NotificationContext for global state
- **API Layer**: Centralized Axios instance with JWT refresh interceptor
- **WebSocket Client**: Socket.IO client integration for real-time features
- **Component Library**: Radix UI primitives with custom Tailwind styling

### Database Design
- **22 Tables**: Users, Roles, Hotels, Rooms, Bookings, Reviews, Transactions, Chat, etc.
- **Complex Relationships**: Many-to-many with junction tables (hotel_amenities, user_roles)
- **UUID Primary Keys**: Universal unique identifiers for all entities
- **Optimized Indexes**: Strategic indexing on foreign keys and search columns
- **Audit Fields**: created_at, updated_at on all entities
- **DBML Schema**: Complete database diagram available in DATABASE_DIAGRAM.md

### Security Implementation
- **JWT Authentication**: Access token (15 min) + Refresh token (7 days)
- **HTTP-only Cookies**: Refresh tokens stored securely in cookies
- **Role-Based Access**: Admin, Customer, HotelOwner with permission checks
- **Input Validation**: class-validator on all DTOs, sanitization on inputs
- **Ownership Verification**: Guards verify resource ownership before operations
- **CORS Configuration**: Secure cross-origin setup with credentials
- **Password Hashing**: bcryptjs with salt rounds for password security

### Real-time Architecture
- **WebSocket Server**: NestJS WebSocket gateways with Socket.IO
- **Redis Adapter**: Redis for Socket.IO adapter (multi-instance support)
- **Event-driven**: Event emitters for notification triggers
- **Room-based**: Chat rooms for targeted message delivery
- **Connection Management**: Automatic reconnection and connection state tracking

### Performance & Scalability
- **Elasticsearch**: Offload search queries from PostgreSQL
- **Redis Caching**: Session storage and WebSocket state
- **Pessimistic Locking**: Prevent race conditions in critical transactions
- **Optimistic UI**: Frontend updates optimistically before server confirmation
- **Pagination**: All list endpoints support pagination
- **Indexed Queries**: Database indexes on frequently queried columns
- **Connection Pooling**: TypeORM connection pool configuration
- **Async Operations**: Non-blocking async/await throughout the stack

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 17.4
- Redis 4.7+
- Elasticsearch 8.15+ (optional, for search features)

### Backend Setup

```bash
# Navigate to backend directory
cd tigo-server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npm run migration:run

# Seed database with initial data
npm run seed

# Set up Elasticsearch (optional)
npm run elasticsearch:setup

# Start development server
npm run start:dev
# Backend runs on http://localhost:3000
# Swagger API docs at http://localhost:3000/api/docs
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd aurevia-client

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:3000

# Start development server
npm run dev
# Frontend runs on http://localhost:3001
```

### Default Admin Credentials
After running the seed script:
- **Email**: admin@tigo.com
- **Password**: Admin123!

## 📚 Documentation

- **Backend Documentation**: See [BACKEND_DOCUMENTATION.md](./BACKEND_DOCUMENTATION.md)
- **Frontend Documentation**: See [FRONTEND_DOCUMENTATION.md](./FRONTEND_DOCUMENTATION.md)
- **Database Schema**: See [database/DATABASE_DIAGRAM.md](./database/DATABASE_DIAGRAM.md)
- **API Documentation**: Visit http://localhost:3000/api/docs after starting the backend

## 🛠️ Development Scripts

### Backend (tigo-server)
```bash
npm run start:dev          # Start development server with hot reload
npm run build              # Build for production
npm run start:prod         # Start production server
npm run seed               # Seed database with sample data
npm run elasticsearch:setup # Set up Elasticsearch indexes
npm run migration:generate # Generate new migration
npm run migration:run      # Run pending migrations
```

### Frontend (aurevia-client)
```bash
npm run dev                # Start development server (Turbopack)
npm run build              # Build for production
npm start                  # Start production server
npm run lint               # Run ESLint
```

## 📊 Key Modules

### 1. User Module
- Authentication (login, register, token refresh)
- User CRUD operations
- Role and permission management

### 2. Hotel Module
- Hotel CRUD with approval workflow
- Room management and availability
- Booking system with status tracking
- Review and rating system
- Hotel request and deletion workflows

### 3. Transaction Module
- Virtual wallet management
- Balance top-up requests
- Transaction logging
- Booking payment processing

### 4. Chat Module
- Real-time WebSocket messaging
- Chat room management
- Message read/unread tracking

### 5. Notification Module
- Multi-channel notifications (in-app, email, WebSocket)
- Notification CRUD operations
- Real-time push notifications

### 6. Search Module
- Elasticsearch integration
- Hotel search with filters
- Geospatial queries
- Auto-sync with PostgreSQL

## 🤝 Contributing

This is an academic project for demonstration purposes. The codebase showcases:
- Modern full-stack development with NestJS and Next.js
- Real-time features with WebSocket
- Advanced search with Elasticsearch
- Complex business logic beyond CRUD
- Role-based access control
- Transaction management with pessimistic locking

---

**Built with ❤️ using NestJS, Next.js, PostgreSQL, and TypeScript**

**Project by**: Tigo Booking Development Team  
**Repository**: [tiloneee/tigo-booking-new](https://github.com/tiloneee/tigo-booking-new) 