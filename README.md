# 🏨 Tigo Booking Platform

A comprehensive online booking platform designed to facilitate reservations for various services, including hotels, restaurants, and transportation. Inspired by popular platforms like Agoda and Booking.com, this project demonstrates robust backend architecture, advanced database design, and complex business logic beyond basic CRUD operations.

## 🌟 Features

### 🔐 Authentication & Authorization
- **JWT-based Authentication** with refresh tokens for persistent sessions
- **OAuth2 Integration** with social login providers (Google, Facebook, GitHub)
- **Role-Based Access Control (RBAC)** with granular permissions system
- **Account Activation** via email verification
- **Multi-role Support**: Admin, Customer, HotelOwner, RestaurantOwner, TransportOwner
- **Secure Token Management** with automatic refresh and expiration handling

### 🏨 Hotel Management System
- **Complete Hotel CRUD** with owner verification and admin oversight
- **Room Management** with types, occupancy, bed configurations, and amenities
- **Dynamic Pricing & Availability** with seasonal rates and demand-based pricing
- **Real-time Availability** checking with atomic booking operations
- **Geospatial Search** with location-based filtering and map integration
- **Review & Rating System** with automatic average calculation and moderation
- **Amenities Management** with flexible categorization and filtering

### 🍽️ Restaurant Management System
- **Restaurant Listings** with detailed information and cuisine types
- **Table Reservation System** with time-slot management
- **Operating Hours Management** with flexible scheduling
- **Restaurant Reviews** and rating system
- **Location-based Discovery** with geospatial search capabilities

### 🚗 Transportation Management System
- **Transportation Companies** with fleet management
- **Vehicle Management** with detailed specifications and capacity
- **Route Planning** with departure/arrival locations and coordinates
- **Trip Scheduling** with real-time availability and pricing
- **Seat Booking System** with inventory management
- **Multi-modal Transport** support (bus, car, van, etc.)

### 🔍 Advanced Search & Filtering
- **Multi-Service Search** across hotels, restaurants, and transportation
- **Location-based Search** with radius filtering and geospatial queries
- **Date Availability** filtering with real-time inventory checking
- **Price Range** and rating-based filtering
- **Amenity-based** and service-specific filtering
- **Sorting Options**: price, rating, distance, name, popularity
- **Pagination Support** for large result sets with performance optimization

### 📊 Business Intelligence & Analytics
- **Real-time Inventory Management** prevents overbooking across all services
- **Performance Analytics** for service providers with detailed reporting
- **Revenue Tracking** and financial reporting capabilities
- **Booking Lifecycle Management** with comprehensive status tracking
- **Demand Analytics** for pricing optimization
- **Customer Behavior Analytics** for business insights

### 💳 Payment & Booking Management
- **Payment Status Tracking** (Pending, Paid, Refunded, Failed)
- **Booking Lifecycle** (Pending, Confirmed, Cancelled, Completed, No-Show)
- **Refund Management** with automated processing capabilities
- **Multi-currency Support** for international transactions
- **Payment Gateway Integration** ready architecture

### 🛡️ Security & Compliance
- **Data Protection** with comprehensive input validation
- **Audit Trails** for all critical operations
- **Concurrency Handling** to prevent race conditions
- **Role-based Resource Access** with ownership verification
- **Security Guards** for endpoint protection

## 🛠️ Tech Stack

### Backend Technologies
- **Framework**: NestJS (Node.js) with TypeScript
- **Database**: PostgreSQL with advanced features
- **ORM**: TypeORM with migration support
- **Authentication**: JWT + OAuth2 with Passport.js
- **Validation**: class-validator & class-transformer
- **Documentation**: Swagger/OpenAPI with interactive UI
- **Email Service**: Nodemailer with SMTP support
- **Testing**: Jest with comprehensive test suites

### Database & Data Management
- **Primary Database**: PostgreSQL with UUID support
- **Schema Definition**: DBML for clear visualization
- **Geospatial Features**: PostGIS for location-based queries
- **Data Relationships**: Complex many-to-many relationships
- **Performance**: Optimized indexing and query performance

### Security & Authentication
- **JWT Tokens**: Access and refresh token management
- **OAuth2 Providers**: Google, Facebook, GitHub integration
- **Password Security**: bcrypt hashing with salt
- **Session Management**: Secure token storage and rotation
- **RBAC System**: Granular permission-based access control

## 📁 Project Structure

```
tigo-booking-new/
├── database/                     # Database documentation and schemas
│   ├── markdowns/               # Detailed functional specifications
│   │   ├── hotel_functions.md   # Hotel system requirements
│   │   └── hotel_implementation_plan.md # Implementation roadmap
│   ├── database_diagram.md      # Complete database schema (DBML)
│   └── README.md                # Database setup and overview
├── tigo-server/                 # Main NestJS application
│   ├── src/
│   │   ├── common/              # Shared utilities and infrastructure
│   │   │   ├── decorators/      # Custom decorators (roles, permissions)
│   │   │   ├── guards/          # Authentication & authorization guards
│   │   │   ├── services/        # Shared services (email, geocoding)
│   │   │   └── strategies/      # Passport strategies (JWT, OAuth2)
│   │   ├── modules/
│   │   │   ├── user/            # User management module
│   │   │   │   ├── controllers/ # Authentication & user endpoints
│   │   │   │   ├── dto/         # Data transfer objects
│   │   │   │   ├── entities/    # User, Role, Permission entities
│   │   │   │   └── services/    # Auth & user business logic
│   │   │   ├── hotel/           # Hotel management module
│   │   │   │   ├── controllers/ # Hotel, room, availability endpoints
│   │   │   │   ├── dto/         # Hotel-related DTOs
│   │   │   │   │   ├── hotel/   # Hotel creation, update, search
│   │   │   │   │   ├── room/    # Room management DTOs
│   │   │   │   │   ├── booking/ # Booking-related DTOs (future)
│   │   │   │   │   ├── review/  # Review system DTOs (future)
│   │   │   │   │   └── amenity/ # Amenity management DTOs
│   │   │   │   ├── entities/    # Hotel, Room, Booking, Review entities
│   │   │   │   ├── guards/      # Hotel-specific authorization guards
│   │   │   │   └── services/    # Hotel business logic & operations
│   │   │   ├── restaurant/      # Restaurant module (future implementation)
│   │   │   └── transportation/  # Transportation module (future implementation)
│   │   ├── scripts/             # Database seeding and utility scripts
│   │   └── main.ts              # Application entry point with Swagger
│   ├── test/                    # Comprehensive test suites
│   └── dist/                    # Compiled TypeScript output
├── package.json                 # Root dependencies and workspace config
└── README.md                    # Project overview (this file)
```

## 🎯 Core Functionalities

### User Management & Authentication
- **Multi-provider Registration**: Email, OAuth2 (Google, Facebook, GitHub)
- **Secure Authentication**: JWT with refresh token rotation
- **Role-based Access Control**: Granular permission system with 30+ permissions
- **Account Management**: Profile updates, password changes, account activation
- **Admin Dashboard**: User management and role assignment capabilities

### Hotel Operations & Management
- **Property Management**: Complete hotel CRUD with ownership verification
- **Room Inventory**: Detailed room specifications with availability tracking
- **Dynamic Pricing**: Date-based pricing with bulk availability management
- **Real-time Booking**: Atomic operations preventing overbooking
- **Owner Dashboard**: Performance analytics and booking management
- **Public Discovery**: Search and booking interface for customers

### Restaurant Services (Planned)
- **Restaurant Listings**: Comprehensive restaurant information management
- **Reservation System**: Time-slot based table booking
- **Menu Management**: Digital menu with pricing and availability
- **Review Integration**: Customer feedback and rating system
- **Location Services**: Geospatial search and discovery

### Transportation Services (Planned)
- **Fleet Management**: Vehicle registration and specification tracking
- **Route Planning**: Geographic route management with waypoints
- **Schedule Management**: Trip scheduling with real-time availability
- **Booking System**: Seat reservation with inventory control
- **Multi-modal Support**: Support for various transportation types

### Search & Discovery Engine
- **Unified Search**: Cross-service search capabilities
- **Geospatial Queries**: Location-based search with radius filtering
- **Advanced Filtering**: Multi-criteria filtering with real-time results
- **Smart Sorting**: Relevance-based result ordering
- **Performance Optimization**: Indexed queries with caching strategies

### Booking & Payment Processing
- **Real-time Availability**: Live inventory checking across all services
- **Secure Transactions**: Payment processing with multiple gateway support
- **Booking Lifecycle**: Complete status tracking from creation to completion
- **Automated Workflows**: Email confirmations and status updates
- **Refund Management**: Automated refund processing with business rules

### Data Management & Analytics
- **Comprehensive Schema**: Multi-service relational database design
- **Audit Trails**: Complete operation logging with timestamps
- **Performance Monitoring**: Query optimization and database performance tracking
- **Data Integrity**: Constraint-based data validation and consistency
- **Backup & Recovery**: Database backup strategies and disaster recovery

## 🏗️ Architecture Highlights

### Backend Architecture
- **Modular Design**: Domain-driven design with clear separation of concerns
- **Service-Oriented**: Business logic encapsulated in dedicated service classes
- **Guard-Based Security**: Custom guards for authentication and authorization
- **DTO Validation**: Comprehensive input validation using decorators
- **Repository Pattern**: Database operations abstracted through TypeORM repositories
- **Dependency Injection**: NestJS IoC container for clean architecture

### Database Design
- **Relational Structure**: Well-designed PostgreSQL schema with proper relationships
- **Performance Optimized**: Strategic indexing for efficient query execution
- **Geospatial Support**: PostGIS integration for location-based operations
- **Audit Trails**: Comprehensive tracking of data changes with timestamps
- **Scalable Schema**: Designed for horizontal scaling and multi-service expansion
- **Data Integrity**: Foreign key constraints and validation rules

### Security Implementation
- **Multi-layer Authentication**: JWT + OAuth2 with social provider integration
- **Role-Based Access**: Granular permission system with resource-level control
- **Input Validation**: Comprehensive data validation and sanitization
- **Ownership Verification**: Resource-level access control with owner checks
- **Security Guards**: Custom authorization logic for endpoint protection
- **Token Management**: Secure token storage with automatic rotation

### Performance & Scalability
- **Query Optimization**: Indexed database queries with join optimization
- **Caching Strategy**: Ready for Redis integration and response caching
- **Pagination**: Efficient pagination for large datasets
- **Connection Pooling**: Optimized database connection management
- **Async Operations**: Non-blocking operations for improved throughput
- **Modular Architecture**: Microservice-ready design for horizontal scaling

---

**Built with ❤️ using NestJS, PostgreSQL, and TypeScript** 