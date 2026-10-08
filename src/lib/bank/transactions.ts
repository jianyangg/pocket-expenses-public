import { randomUUID } from "node:crypto";
import type { Expense } from "../budget";
import type { BankTransaction, ImportDecision } from "./types";
export function toExpense(t: BankTransaction): Expense | null {
  const category = t.personal_finance_category;
  const primary = category?.primary || "";
  const detailed = category?.detailed || "";
  if (
    primary === "INCOME" ||
    primary.startsWith("TRANSFER_") ||
    primary === "LOAN_PAYMENTS" ||
    !Number.isFinite(t.amount) ||
    t.amount === 0
  )
    return null;
  const amount = Math.round(t.amount * 100);
  if (!Number.isSafeInteger(amount) || Math.abs(amount) > 100000000)
    return null;
  const bucket =
    detailed === "FOOD_AND_DRINK_GROCERIES"
      ? "groceries"
      : primary === "RENT_AND_UTILITIES"
        ? "bill"
        : primary === "TRANSPORTATION" &&
            !detailed.includes("TAXIS") &&
            !detailed.includes("CAR_RENTAL")
          ? "bill"
          : "discretionary";
  const tag =
    bucket === "groceries"
      ? "groceries"
      : primary === "FOOD_AND_DRINK"
        ? "food"
        : primary === "GENERAL_MERCHANDISE"
          ? "shopping"
          : primary === "ENTERTAINMENT"
            ? "entertainment"
            : primary === "TRANSPORTATION"
              ? "transport"
              : null;
  return {
    id: randomUUID(),
    amount,
    description: (t.merchant_name || t.name || "Bank purchase").slice(0, 300),
    tags: tag ? [tag] : [],
    bucket,
    date: t.date,
  };
}
const words = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3);
export function findDuplicate(
  t: BankTransaction,
  expenses: Expense[],
): ImportDecision {
  const amount = Math.round(t.amount * 100);
  const near = expenses.filter(
    (e) =>
      e.amount === amount &&
      Math.abs(Date.parse(e.date) - Date.parse(t.date)) <= 3 * 86400000,
  );
  if (!near.length) return { kind: "new" };
  const merchant = words(t.merchant_name || t.name);
  const matches = near.filter((e) =>
    words(e.description).some((w) => merchant.includes(w)),
  );
  return matches.length === 1
    ? { kind: "match", id: matches[0].id }
    : { kind: "review" };
}
