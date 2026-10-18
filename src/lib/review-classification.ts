import type { Expense } from "./budget";
import { expenseCategory } from "./money-flow";
export const reviewCategories = [
  { key: "groceries", label: "Groceries" },
  { key: "shopping", label: "Shopping & dining" },
  { key: "transit", label: "Transit" },
  { key: "subscriptions", label: "Subscriptions" },
  { key: "utilities", label: "Utilities" },
  { key: "rent", label: "Rent" },
  { key: "insurance", label: "Insurance" },
  { key: "refills", label: "Home & refills" },
] as const;
export type ReviewCategory = (typeof reviewCategories)[number]["key"];
const routing = new Set([
  "groceries",
  "shopping",
  "utilities",
  "insurance",
  "transit",
  "transport",
  "transportation",
  "subscriptions",
  "subscription",
  "rent",
  "refills",
]);
export function chooseReviewCategory(e: Expense, key: ReviewCategory): Expense {
  const bucket =
    key === "groceries"
      ? "groceries"
      : key === "shopping"
        ? "discretionary"
        : key === "refills"
          ? "reserved"
          : "bill";
  return {
    ...e,
    bucket,
    tags: [...e.tags.filter((t) => !routing.has(t.toLowerCase())), key],
  };
}
export function selectedReviewCategory(e: Expense): string {
  const category = expenseCategory(e);
  if (category === "essential")
    return e.tags.includes("insurance")
      ? "insurance"
      : e.tags.includes("utilities")
        ? "utilities"
        : e.tags.includes("rent")
          ? "rent"
          : "bill";
  return category;
}
