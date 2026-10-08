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
  const [, , expenses, plans] = await sql.transaction([
    sql`set local role pocket_app`,
    sql`select set_config('app.user_id', ${userId}, true)`,
    sql`select id,amount,description,tags,bucket,reviewed,spread,to_char(date,'YYYY-MM-DD') as date from expenses where user_id=${userId} order by date,id`,
    sql`select month,plan from monthly_budgets where user_id=${userId}`,
  ]);
  return {
    version: 1,
    expenses: expenses as Expense[],
    budgets: Object.fromEntries(plans.map((p) => [p.month, p.plan])),
  };
}
export async function writeSnapshot(userId: string, snapshot: Snapshot) {
  const sql = database();
  await sql.transaction([
    sql`set local role pocket_app`,
    sql`select set_config('app.user_id', ${userId}, true)`,
    ...snapshot.expenses.map(
      (
        e,
      ) => sql`insert into expenses(id,user_id,amount,description,tags,bucket,date,reviewed,spread)
      values (${e.id},${userId},${e.amount},${e.description},${e.tags},${e.bucket},${e.date},${e.reviewed ?? false},${JSON.stringify(e.spread ?? null)}::jsonb)
      on conflict(id) do update set amount=excluded.amount,description=excluded.description,tags=excluded.tags,bucket=excluded.bucket,date=excluded.date,reviewed=excluded.reviewed,spread=excluded.spread
      where expenses.user_id=${userId}`,
    ),
    ...snapshot.expenses.map(
      (e) =>
        sql`update bank_transactions set customized=true where user_id=${userId} and expense_id=${e.id}`,
    ),
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
