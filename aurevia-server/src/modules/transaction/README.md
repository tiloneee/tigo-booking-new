# Transaction Module Documentation

## Overview

The Transaction module is a refactored version of the balance system that implements proper transaction logging and balance snapshots. Instead of directly modifying user balances, all balance changes are now recorded as transactions with full audit trails.

## Architecture

### Entities

#### 1. Transaction Entity (`transactions`)
Stores all balance-related transactions with complete audit information.

**Fields:**
- `id` (UUID): Primary key
- `user_id` (UUID): Reference to the user
- `type` (enum): Transaction type
  - `TOPUP`: User requests to add balance
  - `BOOKING_PAYMENT`: Payment for hotel booking
  - `REFUND`: Refund for cancelled booking
  - `ADMIN_ADJUSTMENT`: Manual balance adjustment by admin
- `amount` (decimal): Transaction amount (positive for credits, negative for debits)
- `status` (enum): Transaction status
  - `PENDING`: Awaiting approval (for topups)
  - `SUCCESS`: Completed successfully
  - `FAILED`: Failed or rejected
  - `CANCELLED`: Cancelled by user or system
- `description` (text): Transaction description
- `admin_notes` (text): Notes from admin (for topup approvals/rejections)
- `processed_by` (UUID): Admin who processed the transaction
- `reference_id` (UUID): Link to related entity (booking, etc.)
- `reference_type` (string): Type of referenced entity
- `created_at` (timestamp): Creation time
- `updated_at` (timestamp): Last update time

#### 2. BalanceSnapshot Entity (`balance_snapshots`)
Stores the current balance for each user, updated automatically when transactions succeed.

**Fields:**
- `id` (UUID): Primary key
- `user_id` (UUID): Reference to the user (unique)
- `current_balance` (decimal): Current balance amount
- `created_at` (timestamp): Creation time
- `last_updated` (timestamp): Last update time

## API Endpoints

### User Endpoints (Authenticated)

#### Create Topup Request
```
POST /transactions/topup
```
**Body:**
```json
{
  "amount": 100.00,
  "description": "Adding funds to account" // optional
}
```

#### Get My Transactions
```
GET /transactions/my-transactions
```
Returns all transactions for the authenticated user.

#### Get Current Balance
```
GET /transactions/balance
```
Returns the current balance as a number.

#### Get Balance Snapshot
```
GET /transactions/balance/snapshot
```
Returns the full balance snapshot object with metadata.

#### Get Specific Transaction
```
GET /transactions/:id
```

### Admin Endpoints (Admin Role Required)

#### Get Pending Topups
```
GET /transactions/topup/pending
```
Returns all pending topup requests awaiting approval.

#### Get All Topup Transactions
```
GET /transactions/topup/all
```
Returns all topup transactions (pending, approved, rejected).

#### Get All Transactions
```
GET /transactions/all
```
Returns all transactions in the system.

#### Process Topup Request
```
PATCH /transactions/topup/:id/process
```
**Body:**
```json
{
  "status": "success", // or "failed"
  "admin_notes": "Approved after verification" // optional
}
```

## Service Methods

### TransactionService

#### User-facing Methods

- `createTopupRequest(userId, createTopupDto)`: Create a pending topup transaction
- `getUserTransactions(userId)`: Get all transactions for a user
- `getUserBalance(userId)`: Get current balance (returns number)
- `getBalanceSnapshot(userId)`: Get balance snapshot with metadata
- `getTransactionById(id)`: Get specific transaction details

#### Admin Methods

- `getPendingTopups()`: Get all pending topup requests
- `getAllTopupTransactions()`: Get all topup transactions
- `getAllTransactions()`: Get all transactions
- `processTopup(transactionId, adminId, updateTransactionDto)`: Approve/reject topup

#### System Methods (for other modules)

- `createTransaction(createTransactionDto)`: Create any type of transaction
- `deductBalance(userId, amount, type, description, referenceId, referenceType)`: Deduct balance (creates negative transaction)
- `addBalance(userId, amount, type, description, referenceId, referenceType)`: Add balance (creates positive transaction)

## Integration with Other Modules

### For Booking Module

When processing bookings, use the transaction service to handle payments:

```typescript
import { TransactionService } from '../transaction/services/transaction.service';
import { TransactionType } from '../transaction/entities/transaction.entity';

// In booking.service.ts
constructor(
  // ... other dependencies
  private transactionService: TransactionService,
) {}

// When creating a booking
async createBooking(userId: string, createBookingDto: CreateBookingDto) {
  const totalPrice = await this.calculateTotalPrice(createBookingDto);
  
  // Deduct payment
  const transaction = await this.transactionService.deductBalance(
    userId,
    totalPrice,
    TransactionType.BOOKING_PAYMENT,
    `Payment for booking at ${hotelName}`,
    booking.id,
    'booking'
  );
  
  // Continue with booking creation...
}

// When cancelling a booking
async cancelBooking(bookingId: string) {
  const booking = await this.getBooking(bookingId);
  
  // Refund payment
  await this.transactionService.addBalance(
    booking.user_id,
    booking.total_price,
    TransactionType.REFUND,
    `Refund for cancelled booking at ${booking.hotel.name}`,
    bookingId,
    'booking'
  );
  
  // Continue with cancellation...
}
```

## Migration Guide

### Database Migration

Run the SQL migration file:
```bash
psql -U your_username -d your_database -f src/migrations/create-transaction-system.sql
```

This migration will:
1. Create `transactions` and `balance_snapshots` tables
2. Migrate existing `balance_topups` data to `transactions`
3. Initialize `balance_snapshots` from user balances
4. Optionally drop old `balance_topups` table (commented out by default)

### Code Updates

1. **Remove old balance endpoints**: The old `/balance/*` endpoints are deprecated. Update frontend to use `/transactions/*`

2. **Update booking service**: If your booking service uses balance deduction, update it to use `TransactionService`

3. **Update frontend**: Change API calls from balance to transaction endpoints

## Features

### Transaction Logging
- All balance changes are logged with full context
- Audit trail shows who processed transactions and when
- Reference links to related entities (bookings, etc.)

### Balance Snapshots
- Fast balance lookups without calculating sum of transactions
- Automatically updated when transactions succeed
- Includes last update timestamp

### Transaction Safety
- Uses database transactions to ensure consistency
- Balance cannot go negative (enforced at service level)
- Failed transactions don't affect balance

### Notifications
- Users notified when topup requests are created
- Admins notified of new topup requests
- Users notified when topups are approved/rejected

## Transaction Flow

### Topup Request Flow
1. User creates topup request → `PENDING` transaction created
2. Admin reviews request
3. Admin approves → Status changes to `SUCCESS`, balance snapshot updated
4. Admin rejects → Status changes to `FAILED`, no balance change

### Booking Payment Flow
1. User creates booking
2. System checks balance
3. System creates `SUCCESS` transaction with negative amount
4. Balance snapshot updated immediately
5. Booking confirmed

### Refund Flow
1. User cancels booking
2. System creates `SUCCESS` transaction with positive amount
3. Balance snapshot updated immediately
4. Booking cancelled

## Best Practices

1. **Always use service methods**: Don't directly modify balance snapshots
2. **Include descriptions**: Always provide meaningful transaction descriptions
3. **Link references**: When applicable, link transactions to bookings or other entities
4. **Check balance first**: For payments, verify sufficient balance before creating transactions
5. **Use transactions**: For complex operations, use database transactions

## Testing

Example test scenarios:
- Create topup request → Verify PENDING status
- Admin approves topup → Verify SUCCESS status and balance update
- Deduct balance for booking → Verify negative transaction and balance decrease
- Insufficient balance → Verify transaction rejected
- Refund cancelled booking → Verify positive transaction and balance increase

## Notes

- The old `balance` field in the `users` table is now deprecated but kept for backward compatibility
- The `balance_topups` table is migrated to `transactions` but not dropped by default
- All amounts in transactions are stored as decimals with 2 decimal places
- Positive amounts increase balance, negative amounts decrease balance
