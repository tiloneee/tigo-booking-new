# Transaction Module Quick Start Guide

## Prerequisites
- Backup your database before running migrations
- Ensure the server is stopped or in maintenance mode

## Step 1: Run Database Migration

### Option A: Using psql command line
```bash
# Navigate to the project directory
cd tigo-server

# Run the migration
psql -U postgres -d tigo_booking -f src/migrations/create-transaction-system.sql
```

### Option B: Using pgAdmin or DBeaver
1. Open your database tool
2. Connect to your database
3. Open `src/migrations/create-transaction-system.sql`
4. Execute the SQL script

### Option C: Using TypeORM (if you prefer)
The entities will auto-sync when you start the server (if `synchronize: true` is enabled).

## Step 2: Verify Migration

Connect to your database and verify the tables were created:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('transactions', 'balance_snapshots');

-- Verify data migration
SELECT COUNT(*) FROM transactions;
SELECT COUNT(*) FROM balance_snapshots;

-- Check a sample transaction
SELECT * FROM transactions LIMIT 5;

-- Check a sample balance snapshot
SELECT * FROM balance_snapshots LIMIT 5;
```

## Step 3: Start the Server

```bash
cd tigo-server
npm run start:dev
```

The server should start without errors. Check the console for any migration-related messages.

## Step 4: Test the API

### Test User Endpoints

```bash
# Get current balance (replace TOKEN with your JWT)
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/transactions/balance

# Get balance snapshot
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/transactions/balance/snapshot

# Get my transactions
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/transactions/my-transactions

# Create topup request
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}' \
  http://localhost:3000/transactions/topup
```

### Test Admin Endpoints (Admin JWT required)

```bash
# Get pending topups
curl -H "Authorization: Bearer ADMIN_TOKEN" http://localhost:3000/transactions/topup/pending

# Get all transactions
curl -H "Authorization: Bearer ADMIN_TOKEN" http://localhost:3000/transactions/all

# Process topup (approve)
curl -X PATCH \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "success", "admin_notes": "Approved"}' \
  http://localhost:3000/transactions/topup/TRANSACTION_ID/process
```

## Step 5: Update Frontend (if applicable)

Update your frontend API calls:

```javascript
// Old
const balance = await api.get('/balance/current');
const topups = await api.get('/balance/topup/my-requests');

// New
const balance = await api.get('/transactions/balance');
const transactions = await api.get('/transactions/my-transactions');
```

## Troubleshooting

### Issue: Tables already exist
If you see "table already exists" errors, the migration was already run. You can skip this step.

### Issue: Foreign key constraint errors
Make sure the `users` table exists and has the required structure before running the migration.

### Issue: Server won't start
Check the console for TypeORM entity errors. Ensure all imports are correct in the module files.

### Issue: Old endpoints still work
If you need to keep old endpoints temporarily, you can re-add the balance controller to the UserModule.

## Verify Data Integrity

Run these queries to ensure data was migrated correctly:

```sql
-- Compare user balance with balance snapshot
SELECT 
    u.id,
    u.email,
    u.balance as old_balance,
    bs.current_balance as new_balance,
    (u.balance - bs.current_balance) as difference
FROM users u
LEFT JOIN balance_snapshots bs ON u.id = bs.user_id
WHERE ABS(u.balance - bs.current_balance) > 0.01;

-- Verify topup migration
SELECT 
    bt.id,
    bt.amount as topup_amount,
    bt.status as topup_status,
    t.amount as transaction_amount,
    t.status as transaction_status
FROM balance_topups bt
LEFT JOIN transactions t ON bt.id = t.id
WHERE bt.status != CASE 
    WHEN t.status = 'success' THEN 'approved'
    WHEN t.status = 'failed' THEN 'rejected'
    ELSE 'pending'
END;
```

If the above queries return no rows or show expected differences, the migration was successful!

## Next Steps

1. Test creating new topup requests
2. Test admin approval/rejection workflow
3. Update booking service to use transaction service (if needed)
4. Update frontend to use new endpoints
5. Monitor logs for any transaction-related errors
6. After verification, consider dropping old tables (optional):
   ```sql
   -- ONLY after thorough testing!
   DROP TABLE balance_topups;
   ALTER TABLE users DROP COLUMN balance;
   ```

## Rollback (if needed)

If you need to rollback:

1. Stop the server
2. Restore your database backup
3. Remove TransactionModule from app.module.ts
4. Re-add balance-related code to UserModule
5. Start the server

## Support

If you encounter issues:
1. Check server logs for detailed error messages
2. Verify database connection settings
3. Ensure all dependencies are installed (`npm install`)
4. Review the README in `src/modules/transaction/README.md`
