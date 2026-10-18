import { randomUUID } from "node:crypto";
import { possibleMatches } from "../purchase-matching";
import { bankQuery } from "./store";
import { toExpense } from "./transactions";
import type { BankTransaction } from "./types";
import type { Expense } from "../budget";
export async function matchPurchase(
  user: string,
  bankId: string,
  manual: Expense,
  query: typeof bankQuery = bankQuery,
) {
  const rows = await query(
    user,
    "select * from bank_transactions where user_id=$1 and transaction_id=$2 and active=true and decision in ('review','imported','ignored')",
    [user, bankId],
  );
  const bank = rows[0];
  if (!bank) throw Error("This purchase changed. Refresh and retry.");
  const actual = bank.data as BankTransaction;
  if (
    !possibleMatches(
      {
        id: "bank:" + actual.transaction_id,
        amount: Math.round(actual.amount * 100),
        date: actual.authorized_date ?? actual.date,
        description: actual.name,
        tags: [],
        bucket: manual.bucket,
        accountId: actual.account_id,
      },
      [manual],
    ).length
  )
    throw Error("These purchases are too different to match.");
  // One atomic statement links the record, saves the bank amount and removes only its duplicate.
  const result = await query(
    user,
    `with claimed as (
 update bank_transactions set decision='imported',expense_id=$3,owned=false,customized=true,undo_expense=$4::jsonb,duplicate_checked=true
 where user_id=$1 and transaction_id=$2 and active=true and undo_expense is null and (expense_id is null or expense_id=$5::uuid)
 and not exists(select 1 from bank_transactions other where other.user_id=$1 and other.active=true and other.expense_id=$3 and other.transaction_id<>$2)
 returning transaction_id), saved as (
 insert into expenses(id,user_id,amount,description,tags,bucket,date,reviewed,spread,payment,refund_of,item_note)
 select $3,$1,$6,$7,$8,$9,$10::date,true,$11::jsonb,'card',$12::uuid,$13 from claimed
 on conflict(id) do update set amount=excluded.amount,date=excluded.date,description=excluded.description,tags=excluded.tags,bucket=excluded.bucket,reviewed=true,spread=excluded.spread,refund_of=excluded.refund_of,item_note=excluded.item_note where expenses.user_id=$1 returning id), removed as (
 delete from expenses where user_id=$1 and id=$5::uuid and id<>$3 and exists(select 1 from saved) returning id)
 select id from saved`,
    [
      user,
      bankId,
      manual.id,
      JSON.stringify(manual),
      bank.expense_id,
      Math.round(actual.amount * 100),
      manual.description,
      manual.tags,
      manual.bucket,
      actual.date,
      JSON.stringify(manual.spread ?? null),
      manual.refundOf ?? null,
      manual.itemNote ?? "",
    ],
  );
  if (!result.length)
    throw Error("Already matched. Refresh to see the latest purchases.");
}
export async function undoMatch(
  user: string,
  expenseId: string,
  query: typeof bankQuery = bankQuery,
) {
  const records = await query(
    user,
    "select transaction_id,data,undo_expense from bank_transactions where user_id=$1 and expense_id=$2 and active=true and undo_expense is not null",
    [user, expenseId],
  );
  if (records.length !== 1)
    throw Error("This match cannot be undone. Refresh and retry.");
  const row = records[0],
    manual = row.undo_expense as Expense,
    bank =
      toExpense(row.data as BankTransaction) ??
      (manual.bucket === "investment"
        ? {
            ...manual,
            id: randomUUID(),
            amount: Math.round(row.data.amount * 100),
            description: row.data.merchant_name || row.data.name,
            date: row.data.date,
          }
        : null);
  if (!bank) throw Error("The bank purchase is no longer available.");
  const restored = await query(
    user,
    `with claimed as(update bank_transactions set expense_id=$3,owned=true,customized=false,undo_expense=null,duplicate_checked=true where user_id=$1 and transaction_id=$2 and active=true and undo_expense is not null returning transaction_id), saved as(
 insert into expenses(id,user_id,amount,description,tags,bucket,date,reviewed,spread,payment,refund_of,settled,item_note)
 select $4,$1,$5,$6,$7,$8,$9::date,$10,$11::jsonb,$12,$13::uuid,$19,$20 from claimed
 on conflict(id) do update set amount=excluded.amount,description=excluded.description,tags=excluded.tags,bucket=excluded.bucket,date=excluded.date,reviewed=excluded.reviewed,spread=excluded.spread,payment=excluded.payment,refund_of=excluded.refund_of,settled=excluded.settled,item_note=excluded.item_note where expenses.user_id=$1 returning id)
 insert into expenses(id,user_id,amount,description,tags,bucket,date) select $3,$1,$14,$15,$16,$17,$18::date from saved returning id`,
    [
      user,
      row.transaction_id,
      bank.id,
      manual.id,
      manual.amount,
      manual.description,
      manual.tags,
      manual.bucket,
      manual.date,
      manual.reviewed ?? false,
      JSON.stringify(manual.spread ?? null),
      manual.payment ?? "card",
      manual.refundOf ?? null,
      bank.amount,
      bank.description,
      bank.tags,
      bank.bucket,
      bank.date,
      manual.settled ?? false,
      manual.itemNote ?? "",
    ],
  );
  if (!restored.length)
    throw Error("Already undone. Refresh to see your purchases.");
}
export async function includeSeparate(
  user: string,
  bankId: string,
  query: typeof bankQuery = bankQuery,
) {
  const rows = await query(
    user,
    "select data from bank_transactions where user_id=$1 and transaction_id=$2 and decision in ('review','imported','ignored') and active=true",
    [user, bankId],
  );
  if (!rows.length) throw Error("Already reviewed.");
  const existing = await query(
    user,
    "update bank_transactions set duplicate_checked=true where user_id=$1 and transaction_id=$2 and active=true and decision<>'review' returning transaction_id",
    [user, bankId],
  );
  if (existing.length) return;

  const e = toExpense(rows[0].data as BankTransaction);
  if (!e) throw Error("This record is not a purchase.");
  const result = await query(
    user,
    `with claimed as(update bank_transactions set decision='imported',expense_id=$3,owned=true,duplicate_checked=true where user_id=$1 and transaction_id=$2 and decision='review' and active=true returning transaction_id) insert into expenses(id,user_id,amount,description,tags,bucket,date) select $3,$1,$4,$5,$6,$7,$8::date from claimed returning id`,
    [user, bankId, e.id, e.amount, e.description, e.tags, e.bucket, e.date],
  );
  if (!result.length) throw Error("Already reviewed.");
}

export async function excludePurchase(
  user: string,
  bankId: string,
  query: typeof bankQuery = bankQuery,
) {
  await query(
    user,
    `with old as(select expense_id,owned from bank_transactions where user_id=$1 and transaction_id=$2 and active=true for update),updated as(update bank_transactions set decision='ignored',expense_id=null,owned=false,duplicate_checked=true where user_id=$1 and transaction_id=$2 and exists(select 1 from old) returning transaction_id) delete from expenses where user_id=$1 and id in(select expense_id from old where owned=true) and exists(select 1 from updated)`,
    [user, bankId],
  );
}
