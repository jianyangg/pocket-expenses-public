import { possibleMatches } from "../purchase-matching";
import { randomUUID } from "node:crypto";
import type { Expense } from "../budget";
import type { BankTransaction, ImportDecision } from "./types";
export function toExpense(t: BankTransaction): Expense | null {
  const category = t.personal_finance_category;
  const primary = category?.primary || "";
  const detailed = category?.detailed || "";
  const rent =
    t.amount > 0 &&
    /rent payment|landlord/i.test((t.merchant_name ?? "") + " " + t.name);
  if (
    primary === "INCOME" ||
    (primary.startsWith("TRANSFER_") && !rent) ||
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
      : rent || primary === "RENT_AND_UTILITIES"
        ? "bill"
        : primary === "TRANSPORTATION" &&
            !detailed.includes("TAXIS") &&
            !detailed.includes("CAR_RENTAL")
          ? "bill"
          : "discretionary";
  const tag = rent
    ? "rent"
    : bucket === "groceries"
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
export function findDuplicate(
  t: BankTransaction,
  expenses: Expense[],
): ImportDecision {
  const purchase: Expense = {
    id: "bank:" + t.transaction_id,
    amount: Math.round(t.amount * 100),
    date: t.authorized_date ?? t.date,
    description: t.merchant_name || t.name,
    tags: [],
    bucket: "discretionary",
    accountId: t.account_id,
  };
  return possibleMatches(purchase, expenses).length
    ? { kind: "review" }
    : { kind: "new" };
}

// A transfer to a broker may be omitted by Plaid's purchase classifier. Only
// offer it as an investment when an explicit manual investment is waiting.
export function investmentCandidate(
  t: BankTransaction,
  rows: Expense[],
): Expense | null {
  if (
    /online transfer (to|from).*(chk|sav)|transfer (to|from) (checking|savings)/i.test(
      t.name,
    )
  )
    return null;
  const e: Expense = {
    id: "bank:" + t.transaction_id,
    amount: Math.round(t.amount * 100),
    date: t.authorized_date ?? t.date,
    description: t.merchant_name || t.name,
    tags: [],
    bucket: "investment",
    accountId: t.account_id,
  };
  return possibleMatches(
    e,
    rows.filter((r) => r.bucket === "investment" && r.source === "manual"),
  ).length
    ? e
    : null;
}
