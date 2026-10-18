import type { Budget, Expense } from "./budget";
import { budgetForMonth } from "./storage";
import { expenseCategory } from "./money-flow";
import {
  monthsBetween,
  envelopesForMonth,
  type SpendingPlan,
} from "./spending-plan";
export type CashSnapshot = {
  available: number;
  checkedAt: string;
  accounts: { name: string; available: number }[];
};
export function cashForecast(
  budgets: Record<string, Budget>,
  expenses: Expense[],
  plan: SpendingPlan,
  cash: CashSnapshot | null,
  today: string,
  duplicateCount: number,
) {
  expenses = expenses.filter(
    (e) =>
      e.date <= today &&
      (e.amount >= 0 ||
        e.source === "bank" ||
        e.source === "matched" ||
        e.settled === true ||
        e.payment === "cash" ||
        e.tags.includes("chase")),
  );
  const start = today.slice(0, 7);
  const months = monthsBetween(start, plan.through);
  const reserves = months.map((month) => {
    const b = budgetForMonth(budgets, month),
      rows = expenses.filter((e) => e.date.startsWith(month));
    const paid = plan.paidEssentials[month];
    const actual = (kind: string) =>
      rows
        .filter(
          (e) =>
            expenseCategory(e) === "essential" &&
            new RegExp(kind, "i").test(e.description + " " + e.tags.join(" ")),
        )
        .reduce((n, e) => n + e.amount, 0);
    const envelope = envelopesForMonth(budgets, expenses, month, plan);
    const essentials =
      Math.max(0, b.rent - Math.max(paid?.rent ?? 0, actual("rent|landlord"))) +
      Math.max(
        0,
        b.utilities -
          Math.max(
            paid?.utilities ?? 0,
            actual("utilit|con.?ed|internet|electric"),
          ),
      ) +
      Math.max(
        0,
        b.insurance - Math.max(paid?.insurance ?? 0, actual("insurance")),
      );
    const living =
      essentials +
      Math.max(0, envelope.groceriesLeft) +
      Math.max(0, envelope.discretionaryLeft) +
      Math.max(0, envelope.subscriptionsLeft) +
      Math.max(0, envelope.transitLeft) +
      Math.max(0, envelope.refillsLeft);
    return { month, essentials, living };
  });
  // Unmatched estimates may not yet be in the bank balance. Reserve them until reconciled.
  const manualRows = expenses.filter(
    (e) =>
      e.date <= today &&
      e.source !== "bank" &&
      e.source !== "matched" &&
      e.payment !== "cash" &&
      e.settled !== true &&
      e.bucket !== "transfer" &&
      !e.tags.includes("chase") &&
      e.date >= plan.startMonth + "-01",
  );
  const manualReserve = manualRows.reduce(
    (n, e) => n + Math.max(0, e.amount),
    0,
  );
  const reserved = reserves.reduce((n, r) => n + r.living, 0);
  const surplus = cash
    ? Math.max(0, cash.available - reserved - manualReserve - plan.buffer)
    : null;
  return {
    reserved,
    manualReserve,
    manualRows,
    reserves,
    investable: duplicateCount || !months.length ? null : surplus,
    cash: cash?.available ?? null,
    buffer: plan.buffer,
  };
}
