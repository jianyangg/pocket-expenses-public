import type { Expense } from "./budget";
import type { Envelopes } from "./spending-plan";
import { expenseCategory } from "./money-flow";
export function budgetRemaining(e: Envelopes) {
  return (
    e.groceriesLeft +
    e.discretionaryLeft +
    e.transitLeft +
    e.subscriptionsLeft +
    e.refillsLeft
  );
}
export function spendingSummary(
  e: Envelopes,
  expenses: Expense[],
  month: string,
  today: string,
) {
  const netRemaining = budgetRemaining(e);
  const spentToday = expenses
    .filter(
      (p) =>
        p.date === today &&
        [
          "groceries",
          "shopping",
          "transit",
          "subscriptions",
          "refills",
        ].includes(expenseCategory(p)),
    )
    .reduce((n, p) => n + p.amount, 0);
  const daysLeft =
    month === today.slice(0, 7)
      ? new Date(
          Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0),
        ).getUTCDate() -
        Number(today.slice(8)) +
        1
      : 0;
  const allowance = daysLeft
    ? Math.floor(Math.max(0, netRemaining + spentToday) / daysLeft)
    : 0;
  return {
    netRemaining,
    spentToday,
    daysLeft,
    allowance,
    dailyRemaining: daysLeft
      ? Math.max(0, Math.min(netRemaining, allowance - spentToday))
      : null,
    overToday: Math.max(0, spentToday - allowance),
  };
}
