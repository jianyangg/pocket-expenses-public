import type { Budget, Expense } from "./budget";
import { moneyFlow, expenseCategory } from "./money-flow";
export function dailyAllowance(
  b: Budget,
  expenses: Expense[],
  month: string,
  today: string,
  includeSetup: boolean,
) {
  const rows = expenses.filter((e) => e.date.startsWith(month));
  const days = new Date(
    Number(month.slice(0, 4)),
    Number(month.slice(5)),
    0,
  ).getDate();
  const daysLeft =
    month === today.slice(0, 7) ? days - Number(today.slice(8)) + 1 : 0;
  const spent = rows
    .filter(
      (e) =>
        e.date === today &&
        !["essential", "setup", "investments"].includes(expenseCategory(e)),
    )
    .reduce((n, e) => n + e.amount, 0);
  const balance = moneyFlow(b, rows, includeSetup).remaining;
  const allowance = daysLeft
    ? Math.floor(Math.max(0, balance + spent) / daysLeft)
    : 0;
  return { allowance, spent, remaining: allowance - spent, daysLeft };
}
