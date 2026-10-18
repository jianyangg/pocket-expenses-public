import type { Expense } from "./budget";
export type PurchaseMatch = {
  expense: Expense;
  difference: number;
  days: number;
};
export function possibleMatches(p: Expense, rows: Expense[]): PurchaseMatch[] {
  if (p.payment === "cash" || p.bucket === "transfer") return [];
  const tolerance = Math.max(200, Math.min(1000, Math.abs(p.amount) * 0.05));
  return rows
    .filter(
      (e) =>
        e.id !== p.id &&
        e.payment !== "cash" &&
        e.bucket !== "transfer" &&
        Math.sign(e.amount) === Math.sign(p.amount) &&
        Math.abs(e.amount - p.amount) <= tolerance &&
        Math.abs(Date.parse(e.date) - Date.parse(p.date)) <= 10 * 86400000 &&
        (!p.accountId || !e.accountId || p.accountId === e.accountId),
    )
    .map((expense) => ({
      expense,
      difference: Math.abs(expense.amount - p.amount),
      days: Math.abs(Date.parse(expense.date) - Date.parse(p.date)) / 86400000,
    }))
    .sort(
      (a, b) => a.difference + 100 * a.days - (b.difference + 100 * b.days),
    );
}
