# Booking Transaction Log - Quick Reference

## Quick Start

### For Developers Working on Booking Module

The booking service now uses the **Transaction Service** for all balance operations. Here's what you need to know:

## Key Changes

### ❌ OLD WAY (Don't use this anymore)
```typescript
// Checking balance
const userBalance = parseFloat(user.balance.toString());

// Deducting balance
await manager.update(User, userId, {
  balance: newBalance,
});

// Adding balance (refund)
const newBalance = currentBalance + refundAmount;
await this.userRepository.update(userId, { balance: newBalance });
```

### ✅ NEW WAY (Use this)
```typescript
// Checking balance
const userBalance = await this.transactionService.getUserBalance(userId);

// Deducting balance (booking payment)
await this.transactionService.deductBalance(
  userId,
  amount,
  TransactionType.BOOKING_PAYMENT,
  description,
  bookingId,  // reference_id
  'booking'   // reference_type
);

// Adding balance (refund)
await this.transactionService.addBalance(
  userId,
  amount,
  TransactionType.REFUND,
  description,
  bookingId,  // reference_id
  'booking'   // reference_type
);
```

## Transaction Service Methods

### `getUserBalance(userId: string): Promise<number>`
Gets the current balance from the balance snapshot table.

**Example:**
```typescript
const balance = await this.transactionService.getUserBalance(userId);
console.log(`Current balance: $${balance.toFixed(2)}`);
```

### `deductBalance(userId, amount, type, description?, referenceId?, referenceType?)`
Deducts amount from user balance and creates a transaction record.

**Parameters:**
- `userId`: User ID
- `amount`: Amount to deduct (will be made negative automatically)
- `type`: Transaction type (use `TransactionType.BOOKING_PAYMENT`)
- `description`: Human-readable description
- `referenceId`: Booking ID to link transaction
- `referenceType`: 'booking'

**Example:**
```typescript
await this.transactionService.deductBalance(
  userId,
  finalPrice,
  TransactionType.BOOKING_PAYMENT,
  `Booking payment for ${hotel.name} - Room ${room.number}`,
  bookingId,
  'booking'
);
```

### `addBalance(userId, amount, type, description?, referenceId?, referenceType?)`
Adds amount to user balance and creates a transaction record.

**Parameters:**
- `userId`: User ID
- `amount`: Amount to add (will be made positive automatically)
- `type`: Transaction type (use `TransactionType.REFUND`)
- `description`: Human-readable description
- `referenceId`: Booking ID to link transaction
- `referenceType`: 'booking'

**Example:**
```typescript
await this.transactionService.addBalance(
  userId,
  refundAmount,
  TransactionType.REFUND,
  `Refund for cancelled booking - ${refundStatus === 'PartialRefund' ? '50%' : 'Full'}`,
  bookingId,
  'booking'
);
```

## Transaction Types

```typescript
enum TransactionType {
  TOPUP = 'topup',                    // Admin-approved balance topup
  BOOKING_PAYMENT = 'booking_payment', // Payment for booking
  REFUND = 'refund',                  // Refund for cancelled booking
  ADMIN_ADJUSTMENT = 'admin_adjustment' // Manual admin adjustment
}
```

## What Happens Behind the Scenes

When you call transaction service methods:

1. ✅ **Transaction Record Created** in `transactions` table
2. ✅ **Balance Snapshot Updated** in `balance_snapshots` table
3. ✅ **Redis Event Published** for real-time updates
4. ✅ **WebSocket Notification Sent** to user
5. ✅ **Balance Cache Invalidated** in Redis
6. ✅ **All in One Database Transaction** (atomic)

## Importing Transaction Service

### In Module (`hotel.module.ts`)
```typescript
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [
    // ... other imports
    TransactionModule,
  ],
})
```

### In Service (`booking.service.ts`)
```typescript
import { TransactionService } from '../../transaction/services/transaction.service';
import { TransactionType } from '../../transaction/entities/transaction.entity';

constructor(
  // ... other dependencies
  private transactionService: TransactionService,
) {}
```

## Common Patterns

### Pattern 1: Create Booking with Payment
```typescript
// 1. Check balance
const balance = await this.transactionService.getUserBalance(userId);
if (balance < totalPrice) {
  throw new BadRequestException('Insufficient balance');
}

// 2. Create booking first (to get ID)
const booking = await manager.save(HotelBooking, bookingData);

// 3. Process payment with reference to booking
await this.transactionService.deductBalance(
  userId,
  totalPrice,
  TransactionType.BOOKING_PAYMENT,
  `Payment for ${hotel.name}`,
  booking.id,
  'booking'
);
```

### Pattern 2: Cancel Booking with Refund
```typescript
// 1. Calculate refund based on policy
const refundAmount = calculateRefund(booking);

// 2. Process refund
await this.transactionService.addBalance(
  booking.user_id,
  refundAmount,
  TransactionType.REFUND,
  `Refund for cancelled booking`,
  booking.id,
  'booking'
);

// 3. Update booking status
await this.bookingRepository.update(booking.id, {
  status: 'Cancelled',
  payment_status: refundAmount === paidAmount ? 'Refunded' : 'PartialRefund'
});
```

## Error Handling

Transaction service will throw:
- `NotFoundException`: User not found
- `BadRequestException`: Insufficient balance or negative balance would result

**Example:**
```typescript
try {
  await this.transactionService.deductBalance(...);
} catch (error) {
  if (error instanceof BadRequestException) {
    // Handle insufficient balance
  }
  throw error;
}
```

## Debugging

### Check Transaction History
```sql
SELECT * FROM transactions 
WHERE user_id = 'xxx' 
ORDER BY created_at DESC;
```

### Check Balance Snapshot
```sql
SELECT * FROM balance_snapshots 
WHERE user_id = 'xxx';
```

### Verify Transaction-Booking Link
```sql
SELECT 
  t.id as transaction_id,
  t.type,
  t.amount,
  t.description,
  b.id as booking_id,
  b.status as booking_status
FROM transactions t
LEFT JOIN hotel_bookings b ON t.reference_id = b.id::text
WHERE t.user_id = 'xxx';
```

## Best Practices

1. ✅ **Always create booking before payment** to get reference ID
2. ✅ **Include descriptive messages** in transactions
3. ✅ **Link transactions to bookings** via reference_id
4. ✅ **Check balance before operations** (service handles this, but good to pre-check)
5. ✅ **Let transaction service handle validation** (don't duplicate checks)
6. ❌ **Never update User.balance directly** (use transaction service)
7. ❌ **Don't bypass transaction service** (always use it for consistency)

## Testing Your Changes

```typescript
// Test 1: Create booking
const booking = await bookingService.create(createDto, userId);
// Verify transaction created
const transactions = await transactionService.getUserTransactions(userId);
expect(transactions[0].type).toBe(TransactionType.BOOKING_PAYMENT);
expect(transactions[0].reference_id).toBe(booking.id);

// Test 2: Cancel booking
await bookingService.cancelBooking(booking.id, userId);
// Verify refund transaction created
const refundTx = await transactionService.getUserTransactions(userId);
expect(refundTx[0].type).toBe(TransactionType.REFUND);

// Test 3: Balance consistency
const snapshot = await transactionService.getBalanceSnapshot(userId);
const txSum = calculateTransactionSum(userId);
expect(snapshot.current_balance).toBe(txSum);
```

## Need Help?

- **Transaction Service Code**: `tigo-server/src/modules/transaction/services/transaction.service.ts`
- **Transaction Entity**: `tigo-server/src/modules/transaction/entities/transaction.entity.ts`
- **Full Documentation**: `database/markdowns/BOOKING_TRANSACTION_LOG_INTEGRATION.md`
- **Balance Snapshot**: `tigo-server/src/modules/transaction/entities/balance-snapshot.entity.ts`

## Migration Checklist

When migrating existing booking code:

- [ ] Import `TransactionService` and `TransactionType`
- [ ] Inject `TransactionService` in constructor
- [ ] Replace `user.balance` reads with `getUserBalance()`
- [ ] Replace balance updates with `deductBalance()` or `addBalance()`
- [ ] Add `reference_id` (booking ID) to link transactions
- [ ] Add descriptive messages to transactions
- [ ] Remove direct User balance updates
- [ ] Test booking creation flow
- [ ] Test booking cancellation flow
- [ ] Verify transaction history in database
