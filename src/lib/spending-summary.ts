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
  const spentToday = { groceries: 0, shopping: 0 };
  for (const expense of expenses) {
    if (expense.date !== today) continue;
    const category = expenseCategory(expense);
    if (category === "groceries" || category === "shopping")
      spentToday[category] += expense.amount;
  }
  const daysLeft =
    month === today.slice(0, 7)
      ? new Date(
          Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0),
        ).getUTCDate() -
        Number(today.slice(8)) +
        1
      : 0;
  // Envelopes stay independent: shopping debt must not cancel grocery pacing.
  function pace(monthlyRemaining: number, spentToday: number) {
    const allowance = daysLeft
      ? Math.floor(Math.max(0, monthlyRemaining + spentToday) / daysLeft)
      : 0;
    return {
      monthlyRemaining,
      spentToday,
      allowance,
      leftToday:
        daysLeft && monthlyRemaining >= 0
          ? Math.max(0, Math.min(monthlyRemaining, allowance - spentToday))
          : null,
      overToday: daysLeft ? Math.max(0, spentToday - allowance) : 0,
    };
  }
  return {
    netRemaining,
    daysLeft,
    groceries: pace(e.groceriesLeft, spentToday.groceries),
    shopping: pace(e.discretionaryLeft, spentToday.shopping),
  };
}
