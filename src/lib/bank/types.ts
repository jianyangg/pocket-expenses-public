import type { Expense } from "../budget";
export type BankTransaction = {
  transaction_id: string;
  pending_transaction_id?: string | null;
  account_id: string;
  amount: number;
  name: string;
  merchant_name?: string | null;
  date: string;
  pending: boolean;
  personal_finance_category?: { primary: string; detailed: string } | null;
};
export type Connection = {
  item_id: string;
  token: string;
  cursor: string | null;
  start_date: string;
  last_synced: string | null;
};
export type BankStatus = {
  configured: boolean;
  connected: boolean;
  lastSynced: string | null;
  reviews: { id: string; description: string; amount: number; date: string }[];
};
export type TransactionRecord = {
  transaction_id: string;
  expense_id: string | null;
  owned: boolean;
  customized: boolean;
  decision: string;
  data: BankTransaction;
};
export type SyncPage = {
  added: BankTransaction[];
  modified: BankTransaction[];
  removed: { transaction_id: string }[];
  next_cursor: string;
  has_more: boolean;
};
export type ImportDecision =
  { kind: "new" | "review" } | { kind: "match"; id: Expense["id"] };
