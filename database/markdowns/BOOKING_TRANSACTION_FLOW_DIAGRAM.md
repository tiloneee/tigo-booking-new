# Booking Transaction Flow Diagram

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BOOKING FLOW WITH TRANSACTIONS                   │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Frontend   │────────▶│   Booking    │────────▶│ Transaction  │
│  (User UI)   │         │   Service    │         │   Service    │
└──────────────┘         └──────────────┘         └──────────────┘
                                │                         │
                                │                         │
                                ▼                         ▼
                    ┌──────────────────┐    ┌─────────────────────┐
                    │ hotel_bookings   │    │   transactions      │
                    │   (Booking DB)   │◀───│   (Payment Log)     │
                    └──────────────────┘    └─────────────────────┘
                                                        │
                                                        │
                                                        ▼
                                            ┌─────────────────────┐
                                            │ balance_snapshots   │
                                            │  (Current Balance)  │
                                            └─────────────────────┘
                                                        │
                                                        │
                                                        ▼
                                                  ┌──────────┐
                                                  │  Redis   │
                                                  │ Pub/Sub  │
                                                  └──────────┘
                                                        │
                                                        │
                                                        ▼
                                                  ┌──────────┐
                                                  │ WebSocket│
                                                  │ to Client│
                                                  └──────────┘
```

## Booking Creation Flow

```
User Creates Booking
        │
        ├─ 1. Validate booking details (dates, room, guests)
        │
        ├─ 2. Check availability
        │
        ├─ 3. Calculate total price + fees
        │
        ├─ 4. Check Balance
        │     └─▶ TransactionService.getUserBalance(userId)
        │           └─▶ SELECT * FROM balance_snapshots WHERE user_id = ?
        │                 └─▶ Returns: Current Balance
        │
        ├─ 5. Validate Sufficient Balance
        │     └─▶ if (balance < totalPrice) throw BadRequestException
        │
        ├─ 6. Create Booking Record
        │     └─▶ INSERT INTO hotel_bookings (...)
        │           └─▶ Returns: Booking ID
        │
        ├─ 7. Process Payment
        │     └─▶ TransactionService.deductBalance(
        │           userId,
        │           totalPrice,
        │           TransactionType.BOOKING_PAYMENT,
        │           description,
        │           bookingId,      ← Links to booking
        │           'booking'
        │         )
        │           ├─▶ INSERT INTO transactions (
        │           │     user_id,
        │           │     type: 'booking_payment',
        │           │     amount: -150.00,           ← Negative for deduction
        │           │     status: 'success',
        │           │     reference_id: booking_id,  ← Links to booking
        │           │     reference_type: 'booking'
        │           │   )
        │           │
        │           ├─▶ UPDATE balance_snapshots
        │           │     SET current_balance = current_balance - 150.00
        │           │     WHERE user_id = ?
        │           │
        │           ├─▶ PUBLISH to Redis 'balance:updates'
        │           │     {
        │           │       userId,
        │           │       newBalance,
        │           │       transactionId,
        │           │       type: 'booking_payment',
        │           │       amount: -150.00
        │           │     }
        │           │
        │           └─▶ WebSocket Emit 'balance_updated' to user
        │
        ├─ 8. Update Room Availability
        │     └─▶ UPDATE room_availability SET available_units = available_units - 1
        │
        └─ 9. Send Notifications
              ├─▶ Customer: "Booking confirmed"
              └─▶ Hotel Owner: "New booking received"

✅ SUCCESS: Booking created with full audit trail
```

## Booking Cancellation Flow

```
User Cancels Booking
        │
        ├─ 1. Validate user owns booking
        │
        ├─ 2. Check booking status (not already cancelled/completed)
        │
        ├─ 3. Calculate Refund Based on Policy
        │     └─▶ checkInDate = booking.check_in_date (at 2 PM)
        │         now = current time
        │         hoursDiff = (checkInDate - now) / 3600
        │
        │         if (hoursDiff < 24):
        │           refundAmount = paidAmount × 0.5    ← 50% refund
        │           paymentStatus = 'PartialRefund'
        │         else:
        │           refundAmount = paidAmount × 1.0    ← Full refund
        │           paymentStatus = 'Refunded'
        │
        ├─ 4. Process Refund
        │     └─▶ TransactionService.addBalance(
        │           userId,
        │           refundAmount,
        │           TransactionType.REFUND,
        │           description,
        │           bookingId,      ← Links to original booking
        │           'booking'
        │         )
        │           ├─▶ INSERT INTO transactions (
        │           │     user_id,
        │           │     type: 'refund',
        │           │     amount: +75.00,              ← Positive for refund
        │           │     status: 'success',
        │           │     reference_id: booking_id,    ← Links to booking
        │           │     reference_type: 'booking',
        │           │     description: 'Refund for cancelled booking (50%)'
        │           │   )
        │           │
        │           ├─▶ UPDATE balance_snapshots
        │           │     SET current_balance = current_balance + 75.00
        │           │     WHERE user_id = ?
        │           │
        │           ├─▶ PUBLISH to Redis 'balance:updates'
        │           │     {
        │           │       userId,
        │           │       newBalance,
        │           │       transactionId,
        │           │       type: 'refund',
        │           │       amount: +75.00
        │           │     }
        │           │
        │           └─▶ WebSocket Emit 'balance_updated' to user
        │
        ├─ 5. Update Booking Status
        │     └─▶ UPDATE hotel_bookings
        │           SET status = 'Cancelled',
        │               payment_status = 'PartialRefund',
        │               cancelled_at = now
        │
        ├─ 6. Restore Room Availability
        │     └─▶ UPDATE room_availability SET available_units = available_units + 1
        │
        └─ 7. Send Notifications
              ├─▶ Customer: "Booking cancelled, refunded $75.00 (50%)"
              └─▶ Hotel Owner: "Booking cancelled by customer"

✅ SUCCESS: Booking cancelled with refund and audit trail
```

## Transaction Record Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    Transaction Record Example                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BOOKING PAYMENT TRANSACTION                                    │
│  ─────────────────────────────                                  │
│  id:              "550e8400-e29b-41d4-a716-446655440000"       │
│  user_id:         "123e4567-e89b-12d3-a456-426614174000"       │
│  type:            "booking_payment"                             │
│  amount:          -150.00           ← Negative for deduction    │
│  status:          "success"                                     │
│  description:     "Booking payment for Grand Hotel - Room 201"  │
│  reference_id:    "abc123..."       ← Links to booking.id       │
│  reference_type:  "booking"                                     │
│  created_at:      "2025-11-05 10:30:00"                         │
│                                                                 │
│  ─────────────────────────────────────────────────────────     │
│                                                                 │
│  REFUND TRANSACTION                                             │
│  ──────────────────                                             │
│  id:              "660e8400-e29b-41d4-a716-446655440001"       │
│  user_id:         "123e4567-e89b-12d3-a456-426614174000"       │
│  type:            "refund"                                      │
│  amount:          +75.00            ← Positive for addition     │
│  status:          "success"                                     │
│  description:     "Refund for cancelled booking (50% - within 24hrs)"│
│  reference_id:    "abc123..."       ← Links to booking.id       │
│  reference_type:  "booking"                                     │
│  created_at:      "2025-11-05 14:45:00"                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Balance Snapshot Updates

```
User Balance Timeline:
─────────────────────

Initial Balance: $500.00
     │
     │  Transaction: BOOKING_PAYMENT (-$150.00)
     │  ─────────────────────────────────────
     ├─▶ balance_snapshots.current_balance: $500.00 - $150.00 = $350.00
     │   transactions: [{ amount: -150.00, reference_id: booking_1 }]
     │
     ▼
Current Balance: $350.00
     │
     │  Transaction: REFUND (+$75.00)
     │  ──────────────────────────────
     ├─▶ balance_snapshots.current_balance: $350.00 + $75.00 = $425.00
     │   transactions: [
     │     { amount: -150.00, reference_id: booking_1 },
     │     { amount: +75.00, reference_id: booking_1 }
     │   ]
     │
     ▼
Final Balance: $425.00
```

## Database Relationships

```
┌──────────────────┐
│      users       │
│   (User Data)    │
└────────┬─────────┘
         │
         │ user_id
         │
    ┌────┴────┬──────────────────┬─────────────────┐
    │         │                  │                 │
    ▼         ▼                  ▼                 ▼
┌─────────┐ ┌──────────────┐ ┌─────────────┐ ┌──────────────┐
│ hotel_  │ │ transactions │ │  balance_   │ │ notifications│
│bookings │ │              │ │ snapshots   │ │              │
└─────────┘ └──────────────┘ └─────────────┘ └──────────────┘
    │              │
    │              │ reference_id
    └──────────────┘
       (linked)

Relationships:
─────────────
• transactions.user_id        → users.id
• transactions.reference_id   → hotel_bookings.id (when reference_type = 'booking')
• balance_snapshots.user_id  → users.id (UNIQUE)
• hotel_bookings.user_id     → users.id
```

## Real-time Update Flow

```
Balance Change Event
         │
         ├─▶ 1. Transaction committed to database
         │
         ├─▶ 2. Balance snapshot updated
         │
         ├─▶ 3. Redis Pub/Sub
         │     └─▶ PUBLISH 'balance:updates' {
         │           userId: "123...",
         │           newBalance: 425.00,
         │           transactionId: "550...",
         │           transactionType: "refund",
         │           amount: 75.00,
         │           previousBalance: 350.00
         │         }
         │
         ├─▶ 4. BalanceGateway (WebSocket)
         │     └─▶ Receives Redis event
         │         └─▶ Finds connected clients for user
         │             └─▶ Emits 'balance_updated' to client(s)
         │
         └─▶ 5. Frontend Receives Update
               └─▶ Updates UI immediately
                   └─▶ Shows new balance: $425.00
                       └─▶ Updates transaction history
```

## Error Handling Flow

```
Transaction Attempt
        │
        ├─ Validation
        │   ├─▶ User exists? ─────NO───▶ throw NotFoundException
        │   ├─▶ Sufficient balance? ─NO───▶ throw BadRequestException
        │   └─▶ Valid amount? ──────NO───▶ throw BadRequestException
        │
        ├─ Database Transaction Start
        │   │
        │   ├─▶ Insert transaction record
        │   ├─▶ Update balance snapshot
        │   │
        │   ├─ Check: Would result in negative balance?
        │   │   └─▶ YES ─▶ ROLLBACK all changes
        │   │             throw BadRequestException
        │   │
        │   └─ All OK?
        │       └─▶ COMMIT transaction
        │
        ├─ Post-Transaction
        │   ├─▶ Clear Redis cache
        │   ├─▶ Publish balance update
        │   └─▶ Send WebSocket notification
        │
        └─ Error at any step?
            └─▶ ROLLBACK entire transaction
                └─▶ No partial updates
                    └─▶ Data integrity maintained
```

## Summary

### Key Points
1. ✅ Every balance change creates a transaction record
2. ✅ Transactions link to bookings via `reference_id`
3. ✅ Balance snapshots maintain current balance
4. ✅ Redis pub/sub for real-time updates
5. ✅ WebSocket notifications to frontend
6. ✅ Atomic database operations
7. ✅ Full audit trail maintained

### Benefits
- 🔍 **Traceability**: Every cent accounted for
- 🔒 **Integrity**: Atomic transactions prevent inconsistencies
- ⚡ **Real-time**: Instant balance updates
- 📊 **Reporting**: Easy to generate financial reports
- 🛡️ **Security**: No direct balance manipulation
