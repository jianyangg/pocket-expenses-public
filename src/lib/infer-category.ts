import type { Expense } from "./budget";
const merchant = (text: string) =>
  text
    .toLowerCase()
    .replace(/\(classification to confirm\)/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
export function inferCategory(expense: Expense, history: Expense[]): Expense {
  const previous = history
    .filter(
      (e) =>
        e.id !== expense.id &&
        merchant(e.description) === merchant(expense.description) &&
        (e.reviewed || e.tags.includes("chase")) &&
        e.bucket !== "review",
    )
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  if (previous)
    return {
      ...expense,
      bucket: previous.bucket,
      tags: previous.tags.filter((t) => t !== "chase"),
    };
  const text = merchant(expense.description);
  if (/\b(coned|con ed|consolidated edison|electricity|internet)\b/.test(text))
    return { ...expense, bucket: "bill", tags: ["utilities"] };
  if (/\b(mta|subway|metrocard)\b/.test(text))
    return { ...expense, bucket: "bill", tags: ["transit"] };
  if (
    /\b(amazon prime|prime video|openai|chatgpt|spotify|netflix)\b/.test(text)
  )
    return { ...expense, bucket: "bill", tags: ["subscriptions"] };
  return expense;
}
