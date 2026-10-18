import type { Expense } from "./budget";
const index = (month: string) =>
  Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7)) - 1;
// Budget allocations are derived views. The stored purchase retains its full cash amount.
export function monthlyExpenses(rows: Expense[], month: string): Expense[] {
  return rows.flatMap((e) => {
    if (!e.spread) return e.date.startsWith(month) ? [e] : [];
    const age = index(month) - index(e.date.slice(0, 7)),
      n = e.spread.months;
    if (age < 0 || age >= n) return [];
    const amount =
      Math.floor((e.amount * (age + 1)) / n) - Math.floor((e.amount * age) / n);
    return amount
      ? [
          {
            ...e,
            amount,
            date: age === 0 ? e.date : month + "-01",
            bucket: e.bucket === "fixed" ? "discretionary" : e.bucket,
            budgetAllocation: {
              purchaseAmount: e.amount,
              purchaseDate: e.date,
            },
          },
        ]
      : [];
  });
}
