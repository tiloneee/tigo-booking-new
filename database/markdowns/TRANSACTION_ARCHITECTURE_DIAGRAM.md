# Transaction Module Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TRANSACTION MODULE                          │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐
│   TransactionModule  │◄────────┤   AppModule          │
│                      │         │                      │
│  - TransactionCtrl   │         │  Imports:            │
│  - TransactionSvc    │         │  - UserModule        │
│  - Entities          │         │  - HotelModule       │
└──────────┬───────────┘         │  - TransactionModule │
           │                     │  - NotificationModule│
           │                     └──────────────────────┘
           │
           ├─────► Controllers ◄───────┐
           │                            │
           │       ┌────────────────────┴──────────────────────┐
           │       │  TransactionController                    │
           │       │                                           │
           │       │  User Endpoints:                          │
           │       │  - POST   /transactions/topup             │
           │       │  - GET    /transactions/my-transactions   │
           │       │  - GET    /transactions/balance           │
           │       │  - GET    /transactions/balance/snapshot  │
           │       │  - GET    /transactions/:id               │
           │       │                                           │
           │       │  Admin Endpoints:                         │
           │       │  - GET    /transactions/topup/pending     │
           │       │  - GET    /transactions/topup/all         │
           │       │  - GET    /transactions/all               │
           │       │  - PATCH  /transactions/topup/:id/process │
           │       └───────────────────────────────────────────┘
           │
           ├─────► Services ◄────────┐
           │                          │
           │       ┌──────────────────┴───────────────────────────────┐
           │       │  TransactionService                              │
           │       │                                                  │
           │       │  Public Methods:                                 │
           │       │  - createTopupRequest()                          │
           │       │  - processTopup()                                │
           │       │  - getUserTransactions()                         │
           │       │  - getUserBalance()                              │
           │       │  - getBalanceSnapshot()                          │
           │       │  - deductBalance()  ◄─── Used by BookingService │
           │       │  - addBalance()     ◄─── Used by BookingService │
           │       │  - createTransaction()                           │
           │       │                                                  │
           │       │  Private Methods:                                │
           │       │  - updateBalanceSnapshot()                       │
           │       │  - initializeBalanceSnapshot()                   │
           │       └──────────────────────────────────────────────────┘
           │
           └─────► Entities
                   │
                   ├── Transaction Entity
                   │   ┌─────────────────────────────────┐
                   │   │  transactions                   │
                   │   ├─────────────────────────────────┤
                   │   │ id: UUID                        │
                   │   │ user_id: UUID                   │
                   │   │ type: enum                      │
                   │   │   - TOPUP                       │
                   │   │   - BOOKING_PAYMENT             │
                   │   │   - REFUND                      │
                   │   │   - ADMIN_ADJUSTMENT            │
                   │   │ amount: decimal                 │
                   │   │ status: enum                    │
                   │   │   - PENDING                     │
                   │   │   - SUCCESS                     │
                   │   │   - FAILED                      │
                   │   │   - CANCELLED                   │
                   │   │ description: text               │
                   │   │ admin_notes: text               │
                   │   │ processed_by: UUID              │
                   │   │ reference_id: UUID              │
                   │   │ reference_type: string          │
                   │   │ created_at: timestamp           │
                   │   │ updated_at: timestamp           │
                   │   └─────────────────────────────────┘
                   │
                   └── BalanceSnapshot Entity
                       ┌─────────────────────────────────┐
                       │  balance_snapshots              │
                       ├─────────────────────────────────┤
                       │ id: UUID                        │
                       │ user_id: UUID (unique)          │
                       │ current_balance: decimal        │
                       │ created_at: timestamp           │
                       │ last_updated: timestamp         │
                       └─────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Topup Request Flow

```
┌─────────┐         ┌──────────────┐         ┌─────────────┐
│  User   │────────►│ POST /topup  │────────►│Transaction  │
│ (Client)│         │              │         │  Service    │
└─────────┘         └──────────────┘         └──────┬──────┘
                                                     │
                                                     │ Create PENDING
                                                     │ transaction
                                                     ▼
                         ┌──────────────────────────────────────┐
                         │                                      │
                         │  transactions                        │
                         │  ┌────────────────────────────────┐  │
                         │  │ status: PENDING                │  │
                         │  │ type: TOPUP                    │  │
                         │  │ amount: +100.00                │  │
                         │  └────────────────────────────────┘  │
                         └──────────────────────────────────────┘
                                           │
                                           │ Notify User & Admins
                                           ▼
                         ┌──────────────────────────────────────┐
                         │    NotificationService               │
                         └──────────────────────────────────────┘
```

### 2. Topup Approval Flow (Admin)

```
┌─────────┐         ┌────────────────┐         ┌─────────────┐
│  Admin  │────────►│ PATCH /process │────────►│Transaction  │
│         │         │  { status:     │         │  Service    │
└─────────┘         │    "success" } │         └──────┬──────┘
                    └────────────────┘                │
                                                      │ 1. Update status
                                                      ▼
                         ┌──────────────────────────────────────┐
                         │  transactions                        │
                         │  ┌────────────────────────────────┐  │
                         │  │ status: PENDING → SUCCESS      │  │
                         │  │ processed_by: admin_id         │  │
                         │  │ admin_notes: "Approved"        │  │
                         │  └────────────────────────────────┘  │
                         └──────────────────────────────────────┘
                                           │
                                           │ 2. Update snapshot
                                           ▼
                         ┌──────────────────────────────────────┐
                         │  balance_snapshots                   │
                         │  ┌────────────────────────────────┐  │
                         │  │ current_balance: 50 → 150      │  │
                         │  │ last_updated: now()            │  │
                         │  └────────────────────────────────┘  │
                         └──────────────────────────────────────┘
                                           │
                                           │ 3. Notify user
                                           ▼
                         ┌──────────────────────────────────────┐
                         │    NotificationService               │
                         │    "Topup approved! Balance: $150"   │
                         └──────────────────────────────────────┘
```

### 3. Booking Payment Flow

```
┌─────────┐         ┌───────────────┐         ┌─────────────┐
│  User   │────────►│ POST /booking │────────►│  Booking    │
│         │         │               │         │  Service    │
└─────────┘         └───────────────┘         └──────┬──────┘
                                                     │
                                                     │ 1. Calculate price
                                                     │ 2. Call deductBalance()
                                                     ▼
                         ┌──────────────────────────────────────┐
                         │    TransactionService                │
                         └───────────────┬──────────────────────┘
                                         │
                                         │ 3. Check balance
                                         │ 4. Create transaction
                                         ▼
                         ┌──────────────────────────────────────┐
                         │  transactions                        │
                         │  ┌────────────────────────────────┐  │
                         │  │ status: SUCCESS                │  │
                         │  │ type: BOOKING_PAYMENT          │  │
                         │  │ amount: -80.00                 │  │
                         │  │ reference_id: booking_id       │  │
                         │  │ reference_type: "booking"      │  │
                         │  └────────────────────────────────┘  │
                         └──────────────────────────────────────┘
                                           │
                                           │ 5. Update snapshot
                                           ▼
                         ┌──────────────────────────────────────┐
                         │  balance_snapshots                   │
                         │  ┌────────────────────────────────┐  │
                         │  │ current_balance: 150 → 70      │  │
                         │  │ last_updated: now()            │  │
                         │  └────────────────────────────────┘  │
                         └──────────────────────────────────────┘
                                           │
                                           │ 6. Return success
                                           ▼
                         ┌──────────────────────────────────────┐
                         │    BookingService                    │
                         │    Complete booking creation         │
                         └──────────────────────────────────────┘
```

### 4. Refund Flow (Booking Cancellation)

```
┌─────────┐         ┌──────────────────┐         ┌─────────────┐
│  User   │────────►│ DELETE /booking  │────────►│  Booking    │
│         │         │                  │         │  Service    │
└─────────┘         └──────────────────┘         └──────┬──────┘
                                                        │
                                                        │ 1. Validate cancellation
                                                        │ 2. Call addBalance()
                                                        ▼
                         ┌──────────────────────────────────────┐
                         │    TransactionService                │
                         └───────────────┬──────────────────────┘
                                         │
                                         │ 3. Create refund transaction
                                         ▼
                         ┌──────────────────────────────────────┐
                         │  transactions                        │
                         │  ┌────────────────────────────────┐  │
                         │  │ status: SUCCESS                │  │
                         │  │ type: REFUND                   │  │
                         │  │ amount: +80.00                 │  │
                         │  │ reference_id: booking_id       │  │
                         │  │ reference_type: "booking"      │  │
                         │  └────────────────────────────────┘  │
                         └──────────────────────────────────────┘
                                           │
                                           │ 4. Update snapshot
                                           ▼
                         ┌──────────────────────────────────────┐
                         │  balance_snapshots                   │
                         │  ┌────────────────────────────────┐  │
                         │  │ current_balance: 70 → 150      │  │
                         │  │ last_updated: now()            │  │
                         │  └────────────────────────────────┘  │
                         └──────────────────────────────────────┘
                                           │
                                           │ 5. Return success
                                           ▼
                         ┌──────────────────────────────────────┐
                         │    BookingService                    │
                         │    Complete cancellation             │
                         └──────────────────────────────────────┘
```

## Module Dependencies

```
┌─────────────────────┐
│   TransactionModule │
└──────────┬──────────┘
           │
           ├───► TypeOrmModule.forFeature([
           │       Transaction,
           │       BalanceSnapshot,
           │       User,
           │       Role
           │     ])
           │
           └───► NotificationModule
                 (for sending notifications)

Used by:
  ↓
┌─────────────────────┐
│   HotelModule       │
│   (BookingService)  │
└─────────────────────┘
  Uses TransactionService for:
  - Booking payments
  - Refunds
```

## Transaction States

```
TOPUP Transaction States:
┌─────────┐  create   ┌─────────┐  admin    ┌─────────┐
│         │──────────►│         │──approve─►│         │
│   N/A   │           │ PENDING │           │ SUCCESS │
│         │           │         │           │         │
└─────────┘           └────┬────┘           └─────────┘
                           │
                           │ admin reject
                           ▼
                      ┌─────────┐
                      │         │
                      │ FAILED  │
                      │         │
                      └─────────┘

PAYMENT/REFUND Transaction States:
┌─────────┐  create   ┌─────────┐
│         │──────────►│         │
│   N/A   │           │ SUCCESS │
│         │           │         │
└─────────┘           └─────────┘
(Auto-approved if balance sufficient)
```

## Database Relationships

```
┌───────────┐         ┌──────────────┐         ┌──────────────────┐
│   users   │◄────────│ transactions │────────►│  balance_snapshots│
│           │ user_id │              │ user_id │                  │
│  - id     │         │  - id        │         │  - id            │
│  - email  │         │  - user_id   │         │  - user_id       │
│  - ...    │         │  - type      │         │  - current_bal   │
└───────────┘         │  - amount    │         │  - last_updated  │
                      │  - status    │         └──────────────────┘
                      │  - ref_id    │
                      └──────┬───────┘
                             │
                             │ reference_id
                             ▼
                      ┌──────────────┐
                      │hotel_bookings│
                      │              │
                      │  - id        │
                      │  - user_id   │
                      │  - ...       │
                      └──────────────┘
```

## Performance Considerations

```
Fast Balance Lookup:
┌─────────────────────────────────────────────────┐
│ GET /transactions/balance                       │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ SELECT current_balance                          │
│ FROM balance_snapshots                          │
│ WHERE user_id = ?                               │
│                                                 │
│ ✓ O(1) lookup - indexed by user_id             │
│ ✓ No SUM() calculation needed                  │
│ ✓ No JOIN with transactions table              │
└─────────────────────────────────────────────────┘

Transaction History:
┌─────────────────────────────────────────────────┐
│ GET /transactions/my-transactions               │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ SELECT * FROM transactions                      │
│ WHERE user_id = ?                               │
│ ORDER BY created_at DESC                        │
│                                                 │
│ ✓ Indexed by user_id                           │
│ ✓ Indexed by created_at                        │
│ ✓ Can add pagination easily                    │
└─────────────────────────────────────────────────┘
```
