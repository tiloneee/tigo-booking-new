# Balance & Topup System Documentation

## Overview
The Balance & Topup system allows users to manage their account balance for making bookings. Users can submit topup requests which require admin approval before the balance is credited to their account.

## Database Schema

### Users Table (Modified)
```sql
ALTER TABLE users ADD COLUMN balance DECIMAL(10, 2) DEFAULT 0;
```

### Balance Topups Table
```sql
CREATE TABLE balance_topups (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    admin_notes TEXT,
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Status Values:**
- `pending` - Awaiting admin approval
- `approved` - Approved and balance credited
- `rejected` - Rejected by admin

## Backend Implementation

### Entities
- **`user.entity.ts`** - Added `balance: number` field
- **`balance-topup.entity.ts`** - New entity for tracking topup requests

### DTOs
- **`create-topup.dto.ts`** - For creating topup requests
  ```typescript
  {
    amount: number (min: 1)
  }
  ```

- **`update-topup.dto.ts`** - For processing topup requests (admin)
  ```typescript
  {
    status: 'approved' | 'rejected'
    admin_notes?: string
  }
  ```

### Service Layer
**`balance.service.ts`** provides:
- `createTopupRequest(userId, createTopupDto)` - Create a new topup request
- `getUserTopups(userId)` - Get user's topup history
- `getAllTopups()` - Admin: Get all topup requests
- `getPendingTopups()` - Admin: Get pending requests
- `getTopupById(id)` - Get specific topup details
- `processTopup(topupId, adminId, updateTopupDto)` - Admin: Approve/reject
- `getUserBalance(userId)` - Get current user balance
- `deductBalance(userId, amount)` - Deduct balance (for bookings)
- `addBalance(userId, amount)` - Add balance directly (admin function)

### Controller Layer
**`balance.controller.ts`** exposes endpoints:

#### User Endpoints
- **POST** `/balance/topup` - Create topup request
- **GET** `/balance/topup/my-requests` - Get my topup history
- **GET** `/balance/current` - Get current balance
- **GET** `/balance/topup/:id` - Get topup details

#### Admin Endpoints (Requires Admin role)
- **GET** `/balance/topup/pending` - Get pending topup requests
- **GET** `/balance/topup/all` - Get all topup requests
- **PATCH** `/balance/topup/:id/process` - Approve/reject topup

### Module Setup
Updated `user.module.ts` to include:
- `BalanceTopup` entity in TypeORM
- `BalanceService` provider
- `BalanceController` controller

## Frontend Implementation

### API Service
**`lib/api/balance.ts`** provides client-side methods:
```typescript
balanceApi.createTopupRequest(data)
balanceApi.getCurrentBalance()
balanceApi.getMyTopups()
balanceApi.getTopupById(id)
balanceApi.getPendingTopups() // Admin only
balanceApi.getAllTopups() // Admin only
balanceApi.processTopup(id, data) // Admin only
```

### User Interface
**Request Hub Page** (`/requests`)
- Tab 1: Topup Balance
  - Displays current balance
  - Form to request topup
  - Quick amount buttons ($10, $50, $100, $500)
  - Real-time API integration
  - Success/error notifications

### Auth Context
Added `refreshUser()` method to `AuthContext`:
- Fetches latest user profile data
- Updates user balance after topup approval
- Updates localStorage

### User Type
Updated `User` interface to include optional `balance` field:
```typescript
interface User {
  // ... existing fields
  balance?: number
}
```

## Migration

Run the SQL migration to set up the database:
```bash
psql -U your_username -d your_database -f src/migrations/add-balance-topup.sql
```

Or if using TypeORM migrations:
```bash
npm run migration:run
```

## Usage Flow

### User Requests Topup
1. User navigates to `/requests` page
2. Selects "Topup Balance" tab
3. Enters amount (minimum $1.00)
4. Submits request
5. Request status: `pending`
6. User receives success notification

### Admin Approves/Rejects
1. Admin navigates to admin dashboard (to be implemented)
2. Views pending topup requests via API: `GET /balance/topup/pending`
3. Reviews request details
4. Processes request via API: `PATCH /balance/topup/:id/process`
   ```json
   {
     "status": "approved",
     "admin_notes": "Verified payment"
   }
   ```
5. If approved:
   - Balance is automatically added to user account
   - Request status updated to `approved`
   - Processing admin recorded

### Balance Usage (Integration with Booking System)
```typescript
// In booking service
await balanceService.deductBalance(userId, bookingAmount)
```

## Security Features

1. **Authentication Required**: All endpoints require JWT authentication
2. **Role-Based Access**: Admin endpoints require Admin role
3. **Balance Validation**: Cannot deduct more than available balance
4. **Amount Validation**: Minimum topup amount enforced
5. **Status Protection**: Cannot process already-processed requests
6. **Audit Trail**: Records who processed each request and when

## API Examples

### Create Topup Request
```bash
POST /balance/topup
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 100.00
}
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "amount": 100.00,
  "status": "pending",
  "created_at": "2025-11-02T10:00:00Z",
  "updated_at": "2025-11-02T10:00:00Z"
}
```

### Process Topup (Admin)
```bash
PATCH /balance/topup/:id/process
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "approved",
  "admin_notes": "Payment verified via bank transfer"
}
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "amount": 100.00,
  "status": "approved",
  "admin_notes": "Payment verified via bank transfer",
  "processed_by": "admin-uuid",
  "created_at": "2025-11-02T10:00:00Z",
  "updated_at": "2025-11-02T10:05:00Z"
}
```

## Future Enhancements

1. **Payment Gateway Integration**: Integrate with Stripe/PayPal for automatic topup
2. **Email Notifications**: Notify users when topup is approved/rejected
3. **Transaction History**: Detailed transaction log with debits and credits
4. **Topup Limits**: Set minimum/maximum topup amounts
5. **Auto-approval**: For trusted users or verified payment methods
6. **Refund System**: Handle refunds for cancelled bookings
7. **Balance Alerts**: Notify users when balance is low
8. **Admin Dashboard**: UI for managing topup requests
9. **Reports**: Generate balance and topup reports

## Testing

### Test Scenarios
1. ✅ Create topup request with valid amount
2. ✅ Create topup request with invalid amount (< $1)
3. ✅ View topup history
4. ✅ Admin approve topup (balance increases)
5. ✅ Admin reject topup (balance unchanged)
6. ✅ Cannot process already-processed topup
7. ✅ Deduct balance for booking (sufficient funds)
8. ✅ Cannot deduct balance (insufficient funds)

### Sample Test Data
```typescript
// Valid topup request
{
  amount: 50.00
}

// Invalid topup request
{
  amount: 0.50  // Error: minimum $1
}
```

## Error Handling

- **400 Bad Request**: Invalid amount or already processed
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions (not admin)
- **404 Not Found**: Topup request or user not found

## Notes

- Balance is stored as DECIMAL(10, 2) for precision
- All monetary calculations use proper decimal arithmetic
- Topup requests are immutable once processed
- Admin notes are optional but recommended for audit purposes
