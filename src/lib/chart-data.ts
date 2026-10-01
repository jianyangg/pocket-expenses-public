import { buckets, calculatePlan, type Expense, type Budget } from "./budget";
export type ChartSlice = { label: string; amount: number };
const labels = {
  discretionary: "Shopping & dining",
  groceries: "Groceries",
  bill: "Bills & transit",
  investment: "Investments",
  fixed: "Fixed purchases",
  reserved: "Refills & renewals",
  review: "Needs review",
};
export function spendingSlices(expenses: Expense[]): ChartSlice[] {
  return buckets
    .map((bucket) => ({
      label: labels[bucket],
      amount: expenses
        .filter((e) => e.bucket === bucket)
        .reduce((sum, e) => sum + e.amount, 0),
    }))
    .filter((s) => s.amount !== 0);
}
export function budgetSlices(b: Budget): ChartSlice[] {
  const available = calculatePlan(
    b,
    [],
    "2026-10",
    "2026-10-01",
  ).discretionaryBudget;
  return [
    { label: "Rent", amount: b.rent },
    {
      label: "Bills & savings",
      amount:
        b.utilities + b.subscriptions + b.transit + b.refills + b.renewals,
    },
    { label: "Groceries", amount: b.groceries },
    { label: "Investing", amount: b.investing },
    { label: "Past purchases", amount: b.depreciation },
    { label: "Spending", amount: Math.max(0, available) },
  ].filter((s) => s.amount > 0);
}
