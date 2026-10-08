import type { Budget, Expense } from "./budget";
export function expenseCategory(e: Expense) {
  const text = (e.description + " " + e.tags.join(" ")).toLowerCase();
  if (e.bucket === "investment") return "investments";
  if (e.bucket === "fixed") return "setup";
  if (e.bucket === "groceries") return "groceries";
  if (
    e.bucket === "bill" &&
    /\b(rent|utilities|utility|electricity|internet|coned|con ed)\b/.test(text)
  )
    return "essential";
  if (
    /\b(subscription|subscriptions|netflix|spotify|chatgpt|openai|prime|notability)\b/.test(
      text,
    ) ||
    (/\bapple\b/.test(text) && Math.abs(e.amount) <= 3000)
  )
    return "subscriptions";
  if (
    /\b(transit|transport|transportation|mta|subway|bus|uber|lyft)\b/.test(text)
  )
    return "transit";
  return "shopping";
}
export function moneyFlow(
  b: Budget,
  expenses: Expense[],
  includeSetup = false,
) {
  const starting =
    b.income - b.rent - b.utilities - (includeSetup ? b.depreciation : 0);
  const totals = {
    groceries: 0,
    subscriptions: 0,
    transit: 0,
    shopping: 0,
    investments: 0,
  };
  for (const e of expenses) {
    const category = expenseCategory(e);
    if (category in totals) totals[category as keyof typeof totals] += e.amount;
  }
  return {
    starting,
    remaining: starting - Object.values(totals).reduce((a, b) => a + b, 0),
    ...totals,
    wants: totals.shopping + totals.subscriptions + totals.transit,
  };
}
