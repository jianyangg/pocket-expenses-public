import type { Expense } from "../budget";
import type { BankTransaction } from "./types";
type Classification = Pick<Expense, "bucket" | "tags" | "reviewed">;
const spendingTags: Record<string, string> = {
  FOOD_AND_DRINK: "dining",
  GENERAL_MERCHANDISE: "shopping",
  ENTERTAINMENT: "entertainment",
  GENERAL_SERVICES: "services",
  MEDICAL: "healthcare",
  PERSONAL_CARE: "personalcare",
  HOME_IMPROVEMENT: "household",
  TRAVEL: "travel",
  BANK_FEES: "fees",
  GOVERNMENT_AND_NON_PROFIT: "government",
};
// Provider categories are defaults. Explicit user decisions still take priority
// in merchant inference and bank sync; duplicate matching remains independent.
export function bankCategory(t: BankTransaction): Classification | null {
  const { primary = "", detailed = "" } = t.personal_finance_category ?? {};
  if (detailed === "FOOD_AND_DRINK_GROCERIES")
    return { bucket: "groceries", tags: ["groceries"], reviewed: true };
  if (primary === "RENT_AND_UTILITIES")
    return {
      bucket: "bill",
      tags: [detailed.endsWith("_RENT") ? "rent" : "utilities"],
      reviewed: true,
    };
  if (primary === "TRANSPORTATION")
    return { bucket: "bill", tags: ["transit"], reviewed: true };
  const tag = spendingTags[primary];
  return tag ? { bucket: "discretionary", tags: [tag], reviewed: true } : null;
}
