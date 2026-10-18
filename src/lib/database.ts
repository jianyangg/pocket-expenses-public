import { reviewCandidates } from "./bank/review-candidates";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { Expense } from "./budget";
import type { Snapshot } from "./storage";
let connection: NeonQueryFunction<false, false>;
export function database() {
  if (!process.env.DATABASE_URL) throw new Error("Database is not configured.");
  return (connection ??= neon(process.env.DATABASE_URL));
}
// The owner comes exclusively from the authenticated server session.
// SET LOCAL is scoped to this transaction, including pooled connections.
export async function readSnapshot(userId: string): Promise<Snapshot> {
  const sql = database();
  const [, , expenses, plans, bank] = await sql.transaction([
    sql`set local role pocket_app`,
    sql`select set_config('app.user_id', ${userId}, true)`,
    sql`select e.id,e.amount,e.description,e.tags,e.bucket,e.reviewed,e.spread,e.payment,e.settled,e.refund_of as "refundOf",to_char(e.date,'YYYY-MM-DD') as date,
 case when b.expense_id is null then 'manual' when b.undo_expense is not null or not b.owned then 'matched' else 'bank' end as source,
 (b.undo_expense is not null and b.undo_expense<>'null'::jsonb) as "canUndoMatch",coalesce((b.data->>'pending')::boolean,false) as pending,b.data->>'account_id' as "accountId"
 from expenses e left join lateral(select expense_id,data,owned,undo_expense from bank_transactions where user_id=${userId} and expense_id=e.id and active=true order by (data->>'pending')::boolean limit 1)b on true where e.user_id=${userId} order by e.date,e.id`,
    sql`select month,plan from monthly_budgets where user_id=${userId}`,
    sql`select transaction_id,data,decision,owned,duplicate_checked from bank_transactions where user_id=${userId} and active=true and decision in ('review','ignored','imported') order by data->>'date' desc`,
  ]);
  return {
    version: 1,
    expenses: expenses as Expense[],
    bankReviews: reviewCandidates(
      expenses as Expense[],
      bank as Parameters<typeof reviewCandidates>[1],
    ),
    budgets: Object.fromEntries(plans.map((p) => [p.month, p.plan])),
  };
}
export async function writeSnapshot(
  userId: string,
  snapshot: Snapshot,
  separateBankExpenses: string[] = [],
) {
  const sql = database();
  await sql.transaction([
    sql`set local role pocket_app`,
    sql`select set_config('app.user_id', ${userId}, true)`,
    ...snapshot.expenses.map(
      (
        e,
      ) => sql`insert into expenses(id,user_id,amount,description,tags,bucket,date,reviewed,spread,payment,refund_of,settled)
      values (${e.id},${userId},${e.amount},${e.description},${e.tags},${e.bucket},${e.date},${e.reviewed ?? false},${JSON.stringify(e.spread ?? null)}::jsonb,${e.payment ?? "card"},${e.refundOf ?? null},${e.settled ?? false})
      on conflict(id) do update set amount=excluded.amount,description=excluded.description,tags=excluded.tags,bucket=excluded.bucket,date=excluded.date,reviewed=excluded.reviewed,spread=excluded.spread,payment=excluded.payment,refund_of=excluded.refund_of,settled=excluded.settled
      where expenses.user_id=${userId}`,
    ),
    ...snapshot.expenses.map(
      (e) =>
        sql`update bank_transactions set customized=true where user_id=${userId} and expense_id=${e.id}`,
    ),
    ...(separateBankExpenses.length
      ? [
          sql`update bank_transactions set duplicate_checked=true where user_id=${userId} and active=true and expense_id=any(${separateBankExpenses}::uuid[])`,
        ]
      : []),
    ...Object.entries(snapshot.budgets).map(
      ([month, plan]) => sql`insert into monthly_budgets(user_id,month,plan)
      values (${userId},${month},${JSON.stringify(plan)}::jsonb)
      on conflict(user_id,month) do update set plan=excluded.plan`,
    ),
  ]);
}
export async function deleteExpense(userId: string, id: string) {
  const sql = database();
  await sql.transaction([
    sql`set local role pocket_app`,
    sql`select set_config('app.user_id', ${userId}, true)`,
    sql`update bank_transactions set decision='ignored',expense_id=null,customized=true where expense_id=${id} and user_id=${userId}`,
    sql`delete from expenses where id=${id} and user_id=${userId}`,
  ]);
}
