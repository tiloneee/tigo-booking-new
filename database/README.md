# Tigo-Booking – A Comprehensive Booking Platform

---

## Overview

Tigo-Booking is a comprehensive online booking platform designed to facilitate reservations for various services, including hotels, restaurants, and transportation. Inspired by popular platforms like Agoda and Booking.com, this project demonstrates robust backend architecture, advanced database design, and complex business logic beyond basic CRUD operations.

---

## Key Features

- **Robust User Authentication & Role Management:**
  - Secure user registration and login with refresh token support for persistent sessions.
  - Flexible role assignment (e.g., Admin, Customer, HotelOwner, RestaurantOwner, TransportOwner).
  - Potential for granular Role-Based Access Control (RBAC) with permissions.
- **Multi-Service Booking:**
  - Dedicated modules for Hotel, Restaurant, and Transportation bookings.
- **Dynamic Hotel Pricing & Availability:**
  - Manages room availability and pricing on a daily basis, allowing for seasonal rates, demand-based pricing, and real-time inventory updates.
- **Geospatial Search Capabilities:**
  - Stores latitude and longitude for hotels and transportation routes, enabling location-based searches and map integrations.
- **Comprehensive Review & Rating System:**
  - Users can submit reviews and ratings for hotels, restaurants, and transportation companies.
  - Average ratings are computed and displayed for properties.
- **Detailed Property Management:**
  - Dedicated entities for Hotels, Rooms, Restaurants, Transportation Companies, Vehicles, Routes, and Trips.
  - Supports detailed property information, amenities, and operational data.
- **Payment & Booking Status Tracking:**
  - Tracks the lifecycle of bookings and payments (e.g., Pending, Confirmed, Cancelled, Paid, Refunded).
- **Concurrency Handling:**
  - Database design supports mechanisms to prevent overbooking for rooms and transportation seats.

---

## Technologies Used

- **Backend:** Nest.js (Node.js framework)
- **Database:** PostgreSQL
- **Database Schema Definition:** DBML (for clear visualization)
- **Authentication:** JWT (JSON Web Tokens) with Refresh Tokens
- *(Future: Frontend with React.js)*
- *(Future: Geocoding APIs for location data)*

---

## Database Schema Overview

The database schema is designed with a modular approach, separating concerns into distinct domains while maintaining clear relationships:

- **Core:** `users`, `roles`, `user_roles`, `permissions`, `role_permissions` for user management and authentication.
- **Hotels:** `hotels`, `hotel_amenities`, `hotel_has_amenities`, `rooms`, `room_availability`, `hotel_bookings`, `hotel_reviews`.
- **Restaurants:** `restaurants`, `restaurant_reservations`, `restaurant_reviews`.
- **Transportation:** `transportation_companies`, `vehicles`, `routes`, `trips`, `transportation_bookings`, `transportation_reviews`.

*Detailed schema and relationships can be found in* [`database_diagram.md`](./database_diagram.md).

---

## Getting Started

Follow these steps to set up the project locally.

### Prerequisites

- Node.js (LTS version recommended)
- PostgreSQL (version 12 or higher recommended)

### Database Setup

1. **Create a PostgreSQL Database:**

   ```sql
   CREATE DATABASE tigo_booking;
   ```

2. **Enable UUID Extension:**
   Connect to your `tigo_booking` database and enable the uuid-ossp extension, which is required for generating UUIDs for primary keys:

   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

3. **Create Tables:**
   Execute the SQL DDL script provided in `database_diagram.md` (the raw SQL part, not the DBML) in your `tigo_booking` database. You can use a tool like `psql` or a GUI client (e.g., DBeaver, pgAdmin) to run the script.

   *Example using psql (assuming you have the SQL in a file named `schema.sql`):*

   ```sh
   psql -U your_username -d tigo_booking -f path/to/schema.sql
   ```

### Backend Setup (Nest.js)

> **Note:** These steps are placeholders and assume a standard Nest.js project structure. You will implement the actual Nest.js application logic.

1. **Clone the Repository:**

   ```sh
   git clone https://github.com/your-username/tigo-booking.git
   cd tigo-booking/backend # Or wherever your Nest.js project resides
   ```

2. **Install Dependencies:**

   ```sh
   npm install
   # or
yarn install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root of your Nest.js project and add your database connection details:

   ```env
   DATABASE_URL="postgresql://your_username:your_password@localhost:5432/tigo_booking"
   JWT_SECRET="your_super_secret_jwt_key"
   REFRESH_TOKEN_SECRET="your_super_secret_refresh_token_key"
   ```

4. **Run Migrations (if using an ORM like TypeORM/Prisma):**
   If you're using an ORM, you'll typically have migration commands to apply the schema.

   *Example for TypeORM:*

   ```sh
   npm run typeorm migration:run
   ```

   *(If you're directly using pg client, the DDL script above handles table creation.)*

5. **Start the Backend Server:**

   ```sh
   npm run start:dev
   # or
yarn start:dev
   ```

The backend server should now be running, connected to your PostgreSQL database.

---

## Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

---

## License

This project is licensed under the MIT License.