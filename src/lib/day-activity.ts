import type { Expense } from "./budget";
import { monthlyExpenses } from "./expense-allocation";
import { dailySpendingRows } from "./spending-trend";
export function dayActivity(expenses: Expense[], date: string) {
  const counted = dailySpendingRows(
    monthlyExpenses(expenses, date.slice(0, 7)),
    date,
  );
  const ids = new Set(counted.map((e) => e.id));
  const other = expenses.filter((e) => e.date === date && !ids.has(e.id));
  const purchases = counted.reduce((n, e) => n + Math.max(0, e.amount), 0);
  const refunds = counted.reduce((n, e) => n + Math.max(0, -e.amount), 0);
  return { counted, other, purchases, refunds, total: purchases - refunds };
}
