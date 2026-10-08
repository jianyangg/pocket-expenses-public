import { buckets, type Expense, type Budget } from "./budget";
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
  return [
    {label:"Rent",amount:b.rent},
    {label:"Utilities",amount:b.utilities},
    {label:"Setup depreciation",amount:b.depreciation},
    {label:"Available",amount:Math.max(0,b.income-b.rent-b.utilities-b.depreciation)}
  ].filter(s=>s.amount>0);
}
