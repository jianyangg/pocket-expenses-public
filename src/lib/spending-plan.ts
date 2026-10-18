import { monthlyExpenses } from "./expense-allocation";
import type { Budget, Expense } from "./budget";
import { budgetForMonth } from "./storage";
import { expenseCategory } from "./money-flow";
export type SpendingPlan = {
  startMonth: string;
  through: string;
  carryPositive: boolean;
  buffer: number;
  paidEssentials: Record<
    string,
    { rent: number; utilities: number; insurance: number }
  >;
};
export const nextMonth = (month: string) =>
  new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 1))
    .toISOString()
    .slice(0, 7);
export function monthsBetween(start: string, end: string) {
  const months: string[] = [];
  for (let m = start; m <= end && months.length < 120; m = nextMonth(m))
    months.push(m);
  return months;
}
export function envelopesForMonth(
  budgets: Record<string, Budget>,
  rows: Expense[],
  month: string,
  plan: SpendingPlan,
  basis: "monthly" | "cash" = "monthly",
) {
  let carry = 0;
  for (const m of monthsBetween(
    month < plan.startMonth ? month : plan.startMonth,
    month,
  )) {
    const b = budgetForMonth(budgets, m),
      expenses =
        basis === "cash"
          ? rows.filter((e) => e.date.startsWith(m))
          : monthlyExpenses(rows, m);
    const sum = (c: string) =>
      expenses
        .filter((e) => expenseCategory(e) === c)
        .reduce((n, e) => n + e.amount, 0);
    const limit = b.discretionary ?? 0;
    const discretionaryLeft = limit + carry - sum("shopping");
    if (m === month)
      return {
        carry,
        limit,
        discretionaryLeft,
        groceriesLeft: b.groceries - sum("groceries"),
        subscriptionsLeft: b.subscriptions - sum("subscriptions"),
        transitLeft: b.transit - sum("transit"),
        spent: sum("shopping"),
        grocerySpent: sum("groceries"),
        refillsLeft: b.refills + b.renewals - sum("refills"),
      };
    carry = plan.carryPositive
      ? discretionaryLeft
      : Math.min(0, discretionaryLeft);
  }
  const b = budgetForMonth(budgets, month);
  return {
    carry: 0,
    limit: b.discretionary ?? 0,
    discretionaryLeft: b.discretionary ?? 0,
    groceriesLeft: b.groceries,
    subscriptionsLeft: b.subscriptions,
    transitLeft: b.transit,
    spent: 0,
    grocerySpent: 0,
    refillsLeft: b.refills + b.renewals,
  };
}
export type Envelopes = ReturnType<typeof envelopesForMonth>;
export function validateSpendingPlan(value: unknown): SpendingPlan | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== "object") throw Error("Invalid spending plan");
  const p = value as SpendingPlan;
  const month = (v: unknown) =>
    typeof v === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
  if (
    !month(p.startMonth) ||
    !month(p.through) ||
    p.through < p.startMonth ||
    monthsBetween(p.startMonth, p.through).length >= 120 ||
    typeof p.carryPositive !== "boolean" ||
    !Number.isSafeInteger(p.buffer) ||
    p.buffer < 0 ||
    p.buffer > 100000000 ||
    !p.paidEssentials ||
    typeof p.paidEssentials !== "object"
  )
    throw Error("Invalid spending plan");
  for (const [m, paid] of Object.entries(p.paidEssentials)) {
    if (
      !month(m) ||
      !paid ||
      [paid.rent, paid.utilities, paid.insurance].some(
        (n) => !Number.isSafeInteger(n) || n < 0 || n > 100000000,
      )
    )
      throw Error("Invalid paid bills");
  }
  return {
    startMonth: p.startMonth,
    through: p.through,
    carryPositive: p.carryPositive,
    buffer: p.buffer,
    paidEssentials: p.paidEssentials,
  };
}
