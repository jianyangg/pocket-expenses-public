import { database, readSnapshot } from "../database";
import { plaid, BankError } from "./client";
import { unseal } from "./crypto";
import {
  bankQuery,
  credentials,
  connections,
  records,
  signingKey,
} from "./store";
import { inferCategory } from "../infer-category";
import { toExpense, findDuplicate } from "./transactions";
import type { SyncPage, BankTransaction, TransactionRecord } from "./types";
export async function syncBank(
  userId: string,
  force = false,
  onlyItem?: string,
) {
  const config = await credentials(userId);
  if (!config) return;
  for (const item of await connections(userId)) {
    if (onlyItem && item.item_id !== onlyItem) continue;
    const claimed = await bankQuery(
      userId,
      `update bank_connections set syncing_until=now()+interval '2 minutes' where user_id=$1 and item_id=$2 and (syncing_until is null or syncing_until<now()) and ($3::boolean or last_synced is null or last_synced<now()-interval '5 minutes') returning item_id`,
      [userId, item.item_id, force],
    );
    if (!claimed.length) continue;
    try {
      let added: BankTransaction[] = [];
      let removed: string[] = [];
      let cursor = item.cursor || undefined;
      let complete = false;
      for (let attempt = 0; attempt < 3 && !complete; attempt++) {
        added = [];
        removed = [];
        cursor = item.cursor || undefined;
        try {
          for (let page = 0; page < 100; page++) {
            const response = await plaid<SyncPage>(
              config,
              "/transactions/sync",
              {
                access_token: unseal(item.token, signingKey()),
                cursor,
                count: 500,
              },
            );
            added.push(...response.added, ...response.modified);
            removed.push(...response.removed.map((t) => t.transaction_id));
            cursor = response.next_cursor;
            if (!response.has_more) {
              complete = true;
              break;
            }
          }
        } catch (error) {
          if (
            !(error instanceof BankError) ||
            error.code !== "TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION"
          )
            throw error;
        }
      }
      if (!complete)
        throw new Error("Bank update is still in progress. Try again shortly.");
      const existing = await records(userId, item.item_id);
      const recordMap = new Map(existing.map((r) => [r.transaction_id, r]));
      const snapshot = await readSnapshot(userId);
      const bankIds = new Set(existing.map((r) => r.expense_id));
      const candidates = snapshot.expenses.filter((e) => !bankIds.has(e.id));
      const sql = database();
      const statements = [];
      const retainedIds = new Set<string>();
      for (const t of added) {
        const previous =
          recordMap.get(t.transaction_id) ||
          (t.pending_transaction_id
            ? recordMap.get(t.pending_transaction_id)
            : undefined);
        const rawExpense = toExpense(t);
        const expense = rawExpense
          ? inferCategory(rawExpense, snapshot.expenses)
          : null;
        let expenseId = previous?.expense_id || null;
        let owned = previous?.owned || false;
        let decision = previous?.decision || "imported";
        const customized = previous?.customized || false;
        if (!previous) {
          if (t.date < item.start_date || !expense) decision = "ignored";
          else {
            const duplicate = findDuplicate(t, candidates);
            decision = duplicate.kind === "review" ? "review" : "imported";
            if (duplicate.kind === "match") {
              expenseId = duplicate.id;
              const index = candidates.findIndex((e) => e.id === expenseId);
              if (index >= 0) candidates.splice(index, 1);
            } else if (duplicate.kind === "new") {
              expenseId = expense.id;
              owned = true;
            }
          }
        }
        if (previous && owned && !expense && expenseId) {
          statements.push(
            sql`delete from expenses where id=${expenseId} and user_id=${userId}`,
          );
          expenseId = null;
          decision = "ignored";
        }
        if (expenseId) retainedIds.add(expenseId);
        if (decision === "imported" && expense && owned) {
          expense.id = expenseId!;
          statements.push(
            sql`insert into expenses(id,user_id,amount,description,tags,bucket,date) values(${expense.id},${userId},${expense.amount},${expense.description},${expense.tags},${expense.bucket},${expense.date}) on conflict(id) do update set amount=excluded.amount,date=excluded.date where expenses.user_id=${userId}`,
          );
        }
        const record: TransactionRecord = {
          transaction_id: t.transaction_id,
          expense_id: expenseId,
          owned,
          customized,
          decision,
          data: t,
        };
        recordMap.set(t.transaction_id, record);
        statements.push(
          sql`insert into bank_transactions(user_id,item_id,transaction_id,expense_id,owned,customized,decision,data) values(${userId},${item.item_id},${t.transaction_id},${expenseId},${owned},${customized},${decision},${JSON.stringify(t)}::jsonb) on conflict(transaction_id) do update set data=excluded.data,active=true,expense_id=excluded.expense_id,owned=excluded.owned,customized=excluded.customized,decision=excluded.decision where bank_transactions.user_id=${userId}`,
        );
      }
      for (const id of removed) {
        const r = recordMap.get(id);
        if (r?.expense_id && r.owned && !retainedIds.has(r.expense_id))
          statements.push(
            sql`delete from expenses where id=${r.expense_id} and user_id=${userId}`,
          );
        statements.push(
          sql`update bank_transactions set active=false where transaction_id=${id} and user_id=${userId}`,
        );
      }
      statements.push(
        sql`update bank_connections set cursor=${cursor!},last_synced=now() where item_id=${item.item_id} and user_id=${userId}`,
      );
      await sql.transaction([
        sql`set local role pocket_app`,
        sql`select set_config('app.user_id',${userId},true)`,
        ...statements,
      ]);
    } finally {
      await bankQuery(
        userId,
        "update bank_connections set syncing_until=null where user_id=$1 and item_id=$2",
        [userId, item.item_id],
      );
    }
  }
}
