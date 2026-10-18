import type { Budget, Expense } from "./budget";
import {
  envelopesForMonth,
  monthsBetween,
  nextMonth,
  type SpendingPlan,
} from "./spending-plan";
export function budgetOutlook(
  budgets: Record<string, Budget>,
  expenses: Expense[],
  month: string,
  plan: SpendingPlan,
) {
  return monthsBetween(nextMonth(month), plan.through).map((month) => {
    const e = envelopesForMonth(budgets, expenses, month, plan);
    return { month, shopping: e.discretionaryLeft, groceries: e.groceriesLeft };
  });
}
