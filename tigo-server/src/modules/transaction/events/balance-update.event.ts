export enum BalanceEventType {
  BALANCE_UPDATED = 'balance_updated',
  BALANCE_INSUFFICIENT = 'balance_insufficient',
  TRANSACTION_COMPLETED = 'transaction_completed',
  TRANSACTION_FAILED = 'transaction_failed',
}

export interface BalanceUpdateEvent {
  event: BalanceEventType;
  userId: string;
  newBalance: number;
  previousBalance?: number;
  transactionId?: string;
  transactionType?: string;
  amount?: number;
  timestamp: string;
}

export interface TransactionEvent {
  event: BalanceEventType;
  userId: string;
  transactionId: string;
  transactionType: string;
  amount: number;
  status: string;
  description?: string;
  timestamp: string;
}
