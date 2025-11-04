# Real-time Balance Update System Documentation

## Overview

This system provides real-time balance synchronization between the backend and frontend using Redis Pub/Sub and WebSocket, ensuring users always see their current balance without requiring page refreshes.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Client (Frontend)                            │
│                                                                  │
│  ┌────────────────┐         ┌──────────────────┐              │
│  │  Balance UI    │◄────────│  WebSocket       │              │
│  │  Component     │         │  Client          │              │
│  └────────────────┘         └──────┬───────────┘              │
└────────────────────────────────────│──────────────────────────┘
                                     │
                         WebSocket   │
                         Connection  │
                                     │
┌────────────────────────────────────│──────────────────────────┐
│                    Backend          │                          │
│                                     ▼                          │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              BalanceGateway                               │ │
│  │  • Handles WebSocket connections                          │ │
│  │  • Subscribes to Redis balance:updates channel            │ │
│  │  • Emits balance_updated events to clients               │ │
│  └──────────────────┬───────────────────────┬───────────────┘ │
│                     │                       │                  │
│                     │ Subscribes            │ Emits           │
│                     ▼                       ▼                  │
│  ┌──────────────────────────────┐  ┌──────────────────────┐  │
│  │     Redis Pub/Sub            │  │   Connected Clients  │  │
│  │  Channel: balance:updates    │  │   (User Rooms)       │  │
│  └──────┬───────────────────────┘  └──────────────────────┘  │
│         │                                                      │
│         │ Publishes                                           │
│         │                                                      │
│  ┌──────▼───────────────────────────────────────────────────┐ │
│  │            TransactionService                             │ │
│  │  • processTopup()                                         │ │
│  │  • createTransaction()                                    │ │
│  │  • Updates database                                       │ │
│  │  • Updates Redis cache                                    │ │
│  │  • Publishes balance update events                        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                  PostgreSQL Database                       │ │
│  │  • transactions table                                      │ │
│  │  • balance_snapshots table                                 │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Balance Gateway (`balance.gateway.ts`)

**Purpose**: WebSocket server that handles real-time balance communications

**Namespace**: `/balance`

**Key Features**:
- JWT authentication for WebSocket connections
- User-specific rooms for targeted updates
- Redis Pub/Sub integration
- Real-time balance broadcasts

**Events Emitted to Clients**:

| Event | Description | Payload |
|-------|-------------|---------|
| `balance_initial` | Sent when client connects | `{ balance: number }` |
| `balance_updated` | Balance changed | `{ newBalance, previousBalance, transactionId, transactionType, amount, timestamp }` |
| `transaction_completed` | Transaction successful | `{ transactionId, transactionType, amount, newBalance, timestamp }` |
| `transaction_failed` | Transaction failed | `{ transactionId, transactionType, timestamp }` |
| `balance_insufficient` | Insufficient funds warning | `{ requiredAmount, currentBalance, shortfall, timestamp }` |

**Events Received from Clients**:

| Event | Description | Response |
|-------|-------------|----------|
| `subscribe_balance` | Subscribe to balance updates | `balance_subscribed` |
| `get_current_balance` | Request current balance | `balance_current` |

### 2. Transaction Service (`transaction.service.ts`)

**Enhanced Methods**:

#### `publishBalanceUpdate()`
Publishes balance update to Redis when balance changes.

```typescript
private async publishBalanceUpdate(
  userId: string,
  newBalance: number,
  transactionId?: string,
  transactionType?: TransactionType,
  amount?: number,
  previousBalance?: number,
): Promise<void>
```

#### `getCachedBalance()`
Retrieves balance from Redis cache (fast) or database (fallback).

```typescript
async getCachedBalance(userId: string): Promise<number>
```

#### `publishTransactionCompleted()`
Notifies about successful transaction.

#### `publishTransactionFailed()`
Notifies about failed transaction.

### 3. Balance Update Events (`balance-update.event.ts`)

**Event Types**:
```typescript
enum BalanceEventType {
  BALANCE_UPDATED = 'balance_updated',
  BALANCE_INSUFFICIENT = 'balance_insufficient',
  TRANSACTION_COMPLETED = 'transaction_completed',
  TRANSACTION_FAILED = 'transaction_failed',
}
```

**Event Structure**:
```typescript
interface BalanceUpdateEvent {
  event: BalanceEventType;
  userId: string;
  newBalance: number;
  previousBalance?: number;
  transactionId?: string;
  transactionType?: string;
  amount?: number;
  timestamp: string;
}
```

## Data Flow

### Topup Approval Flow

1. **Admin approves topup** → `TransactionService.processTopup()`
2. **Get previous balance** from database
3. **Update database** (transaction + balance_snapshot)
4. **Get new balance** from database
5. **Publish to Redis**:
   ```json
   {
     "event": "balance_updated",
     "userId": "abc123",
     "newBalance": 150.00,
     "previousBalance": 100.00,
     "transactionId": "txn_xyz",
     "transactionType": "topup",
     "amount": 50.00,
     "timestamp": "2025-11-04T10:30:00Z"
   }
   ```
6. **BalanceGateway receives** from Redis subscription
7. **Emit to user's room** via WebSocket
8. **Client receives** `balance_updated` event
9. **UI updates** balance display

### Booking Payment Flow

1. **User books hotel** → `TransactionService.createTransaction()`
2. **Check sufficient balance**
3. **Get previous balance**
4. **Create transaction** (negative amount)
5. **Update balance_snapshot**
6. **Get new balance**
7. **Publish to Redis** (same as above)
8. **Real-time update** to client

## Redis Integration

### Redis Keys

| Key Pattern | Type | TTL | Purpose |
|-------------|------|-----|---------|
| `balance:user:{userId}` | String | 1 hour | Cached balance |
| `balance:updates` | Pub/Sub Channel | N/A | Balance update events |

### Redis Operations

```typescript
// Cache balance
await redisService.set(`balance:user:${userId}`, newBalance, 3600);

// Publish event
await redisService.publishMessage('balance:updates', balanceEvent);

// Subscribe to events
await redisService.subscribe('balance:updates', (event) => {
  // Handle event
});
```

## API Endpoints

### Get Cached Balance

```http
GET /transactions/balance/cached
Authorization: Bearer <jwt_token>
```

**Response**:
```json
{
  "balance": 150.50,
  "cached": true
}
```

## WebSocket Connection

### Client Connection Setup

```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:3000/balance', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Or using query parameter
const socket = io('http://localhost:3000/balance?token=your-jwt-token');
```

### Subscribe to Balance Updates

```typescript
// Listen for initial balance
socket.on('balance_initial', (data) => {
  console.log('Initial balance:', data.balance);
  updateUI(data.balance);
});

// Listen for balance updates
socket.on('balance_updated', (data) => {
  console.log('Balance updated:', data.newBalance);
  console.log('Previous balance:', data.previousBalance);
  console.log('Transaction:', data.transactionId);
  updateUI(data.newBalance);
});

// Listen for transaction completed
socket.on('transaction_completed', (data) => {
  console.log('Transaction completed:', data);
  showNotification(`Transaction of $${data.amount} completed`);
});

// Listen for transaction failed
socket.on('transaction_failed', (data) => {
  console.log('Transaction failed:', data);
  showError('Transaction failed');
});

// Listen for insufficient balance
socket.on('balance_insufficient', (data) => {
  console.log('Insufficient balance:', data);
  showError(`Need $${data.shortfall} more`);
});

// Request current balance
socket.emit('get_current_balance');
socket.on('balance_current', (data) => {
  console.log('Current balance:', data.balance);
});
```

## Frontend Integration Example

### React Hook

```typescript
import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

export const useBalance = (token: string) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Connect to balance WebSocket
    const newSocket = io('http://localhost:3000/balance', {
      auth: { token }
    });

    // Handle initial balance
    newSocket.on('balance_initial', (data) => {
      setBalance(data.balance);
    });

    // Handle balance updates
    newSocket.on('balance_updated', (data) => {
      setBalance(data.newBalance);
      // Optional: Show notification
      toast.success(`Balance updated: $${data.newBalance}`);
    });

    // Handle transaction completed
    newSocket.on('transaction_completed', (data) => {
      toast.success(`Transaction completed: $${data.amount}`);
    });

    // Handle errors
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, [token]);

  const refreshBalance = () => {
    socket?.emit('get_current_balance');
  };

  return { balance, refreshBalance };
};
```

### Usage in Component

```typescript
import { useBalance } from './hooks/useBalance';

const BalanceDisplay = () => {
  const token = localStorage.getItem('token');
  const { balance, refreshBalance } = useBalance(token);

  return (
    <div className="balance-display">
      <h3>Current Balance</h3>
      <p>${balance?.toFixed(2) ?? '---'}</p>
      <button onClick={refreshBalance}>Refresh</button>
    </div>
  );
};
```

## Testing

### Test Balance Updates

1. **Connect client to WebSocket**:
   ```bash
   # Use a WebSocket client like wscat
   wscat -c "ws://localhost:3000/balance?token=YOUR_JWT_TOKEN"
   ```

2. **Trigger a topup approval** (as admin):
   ```bash
   curl -X PATCH http://localhost:3000/transactions/topup/TRANSACTION_ID/process \
     -H "Authorization: Bearer ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"status": "success"}'
   ```

3. **Observe WebSocket event**:
   ```json
   {
     "newBalance": 150.00,
     "previousBalance": 100.00,
     "transactionId": "...",
     "transactionType": "topup",
     "amount": 50.00,
     "timestamp": "2025-11-04T10:30:00Z"
   }
   ```

### Test Redis Pub/Sub

```bash
# Subscribe to Redis channel
redis-cli
SUBSCRIBE balance:updates

# In another terminal, trigger a transaction
# You should see the published message
```

## Performance Considerations

1. **Redis Cache**: Balances are cached for 1 hour, reducing database queries
2. **Targeted Broadcasting**: Events sent only to specific user rooms
3. **Connection Pooling**: Redis uses connection pooling for efficiency
4. **Async Operations**: All Redis operations are non-blocking

## Security

1. **JWT Authentication**: All WebSocket connections require valid JWT
2. **User Isolation**: Users only receive their own balance updates
3. **Authorization**: Transaction processing requires admin role
4. **Token Validation**: JWT tokens are verified on connection

## Troubleshooting

### Client Not Receiving Updates

1. Check WebSocket connection:
   ```typescript
   socket.on('connect', () => {
     console.log('Connected to balance socket');
   });
   
   socket.on('disconnect', () => {
     console.log('Disconnected from balance socket');
   });
   ```

2. Verify JWT token is valid
3. Check server logs for authentication errors
4. Ensure Redis is running and accessible

### Balance Not Updating

1. Check Redis connection: `redis-cli ping`
2. Verify transaction was successful in database
3. Check server logs for publish errors
4. Verify user is in correct room

### Redis Connection Issues

```typescript
// Check Redis status
await redisService.ping(); // Should return "PONG"

// Check if channel has subscribers
// In Redis CLI:
PUBSUB CHANNELS balance:*
```

## Monitoring

### Redis Monitoring

```bash
# Monitor Redis commands in real-time
redis-cli MONITOR

# Check number of connected clients
redis-cli CLIENT LIST

# Check pub/sub channels
redis-cli PUBSUB CHANNELS

# Check pub/sub subscribers
redis-cli PUBSUB NUMSUB balance:updates
```

### Application Logs

Balance updates are logged at INFO level:
```
[TransactionService] Published balance update for user abc123: 100 -> 150
[BalanceGateway] Broadcasting balance update to user abc123: 150
[BalanceGateway] Client xyz connected to balance updates
```

## Future Enhancements

1. **Rate Limiting**: Limit balance update frequency per user
2. **Historical Events**: Store last N balance events in Redis
3. **Reconnection Logic**: Auto-reconnect with event replay
4. **Multi-tenancy**: Support multiple organizations
5. **Analytics**: Track balance update patterns
6. **Push Notifications**: Mobile push for large balance changes

## Summary

The real-time balance update system provides:
- ✅ Instant balance synchronization
- ✅ No page refresh required
- ✅ Scalable Redis-based architecture
- ✅ Secure WebSocket connections
- ✅ Transaction event notifications
- ✅ High performance with caching
- ✅ Easy frontend integration
