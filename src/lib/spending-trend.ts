import type { Expense } from "./budget";
import { expenseCategory } from "./money-flow";
export function spendingTrend(
  expenses: Expense[],
  month: string,
  today: string,
  starting: number,
) {
  if (month > today.slice(0, 7)) return [];
  const days = new Date(
    Number(month.slice(0, 4)),
    Number(month.slice(5)),
    0,
  ).getDate();
  const count = month === today.slice(0, 7) ? Number(today.slice(8)) : days;
  let remaining = starting;
  return Array.from({ length: count }, (_, index) => {
    const day = index + 1,
      date = month + "-" + String(day).padStart(2, "0");
    const rows = expenses.filter(
      (e) =>
        e.date === date && !["essential", "setup"].includes(expenseCategory(e)),
    );
    const spent = rows
      .filter((e) => e.bucket !== "investment")
      .reduce((sum, e) => sum + e.amount, 0);
    remaining -= rows.reduce((sum, e) => sum + e.amount, 0);
    return { day, date, spent, remaining };
  });
}
