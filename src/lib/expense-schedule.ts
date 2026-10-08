import { expenseCategory } from "./money-flow";
import type { Expense } from "./budget";
export type ExpenseSpread = { kind: "prepaid" | "asset"; months: number };
export function validateSpread(e: Expense) {
  if (e.spread == null) return;
  const s = e.spread;
  if (
    !["prepaid", "asset"].includes(s.kind) ||
    !Number.isInteger(s.months) ||
    s.months < 1 ||
    s.months > 600 ||
    e.amount <= 0 ||
    e.bucket === "investment" ||
    ["rent", "utilities", "insurance"].some((t) => e.tags.includes(t))
  )
    throw new Error(
      "Spread positive purchases over 1–600 months; essential bills and investments cannot be spread.",
    );
}
const monthIndex = (m: string) =>
  Number(m.slice(0, 4)) * 12 + Number(m.slice(5, 7)) - 1;
export function scheduleLedger(expenses: Expense[], month: string) {
  let openingPrepaid = 0,
    prepaidBalance = 0,
    openingAsset = 0,
    assetBalance = 0,
    assetCost = 0,
    assetExpense = 0,
    prepaidPurchases = 0,
    assetPurchases = 0;
  const recognized: Expense[] = [];
  for (const e of expenses) {
    if (!e.spread) continue;
    const age = monthIndex(month) - monthIndex(e.date.slice(0, 7));
    if (age < 0) continue;
    const n = e.spread.months;
    const before = Math.floor((e.amount * Math.min(age, n)) / n);
    const after = Math.floor((e.amount * Math.min(age + 1, n)) / n);
    const amount = after - before;
    if (e.spread.kind === "prepaid") {
      openingPrepaid += age === 0 ? 0 : e.amount - before;
      prepaidBalance += e.amount - after;
      if (age === 0) prepaidPurchases += e.amount;
      if (amount)
        recognized.push({
          ...e,
          amount,
          date: month + "-01",
          spread: undefined,
          bucket: e.bucket === "fixed" ? "discretionary" : e.bucket,
        });
    } else {
      openingAsset += age === 0 ? 0 : e.amount - before;
      assetBalance += e.amount - after;
      assetCost += e.amount;
      assetExpense += amount;
      if (age === 0) assetPurchases += e.amount;
    }
  }
  return {
    openingPrepaid,
    prepaidBalance,
    openingAsset,
    assetBalance,
    assetCost,
    assetExpense,
    prepaidPurchases,
    assetPurchases,
    recognized,
  };
}
