export const buckets = [
  "discretionary",
  "groceries",
  "bill",
  "investment",
  "fixed",
  "reserved",
  "review",
] as const;
export type Bucket = (typeof buckets)[number];
export type Expense = {
  reviewed?: boolean;
  id: string;
  amount: number;
  description: string;
  tags: string[];
  bucket: Bucket;
  date: string;
};
export type Budget = {
  income: number;
  rent: number;
  utilities: number;
  subscriptions: number;
  transit: number;
  groceries: number;
  refills: number;
  renewals: number;
  depreciation: number;
  investing: number;
};
export const defaultBudget: Budget = {
  income: 0,
  rent: 0,
  utilities: 0,
  subscriptions: 0,
  transit: 0,
  groceries: 0,
  refills: 0,
  renewals: 0,
  depreciation: 0,
  investing: 0,
};
export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
export function todayInNewYork() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function parseEntry(text: string) {
  const match = text.trim().match(/^\$?(-?\d+(?:\.\d{1,2})?)(?:\s+|$)(.*)$/);
  if (!match) throw new Error("Start with an amount, like 12.50 lunch #food.");
  const amount = Math.round(Number(match[1]) * 100);
  if (
    !Number.isSafeInteger(amount) ||
    amount === 0 ||
    Math.abs(amount) > 100000000
  )
    throw new Error("Enter a nonzero amount below $1 million.");
  const tags = [
    ...new Set(
      [...match[2].matchAll(/#([\p{L}\p{N}_-]+)/gu)].map((m) =>
        m[1].toLowerCase(),
      ),
    ),
  ];
  const description =
    match[2]
      .replace(/#[\p{L}\p{N}_-]+/gu, "")
      .trim()
      .replace(/\s+/g, " ") || "Expense";
  if (
    description.length > 300 ||
    tags.length > 20 ||
    tags.some((t) => t.length > 40)
  )
    throw new Error(
      "Keep descriptions under 300 characters and use up to 20 short tags.",
    );
  return { amount, description, tags };
}
export function calculatePlan(
  b: Budget,
  expenses: Expense[],
  month: string,
  today: string,
) {
  const rows = expenses.filter((e) => e.date.startsWith(month));
  const sum = (bucket: Bucket) =>
    rows.filter((e) => e.bucket === bucket).reduce((n, e) => n + e.amount, 0);
  const fixed = b.rent + b.utilities + b.subscriptions + b.transit;
  const setAsides = b.refills + b.renewals;
  const discretionaryBudget =
    b.income - fixed - setAsides - b.groceries - b.depreciation - b.investing;
  const discretionaryRemaining =
    discretionaryBudget - sum("discretionary") - sum("review");
  const groceriesRemaining = b.groceries - sum("groceries");
  const [year, m] = month.split("-").map(Number);
  const days = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const daysLeft =
    month === today.slice(0, 7)
      ? days - Number(today.slice(8)) + 1
      : month > today.slice(0, 7)
        ? days
        : 0;
  const spendableRemaining =
    discretionaryRemaining + Math.min(0, groceriesRemaining);
  return {
    fixed,
    setAsides,
    discretionaryBudget,
    discretionaryRemaining,
    groceriesRemaining,
    spendableRemaining,
    daysLeft,
    todayGuide: daysLeft
      ? Math.floor(Math.max(0, spendableRemaining) / daysLeft)
      : 0,
    discretionarySpent: sum("discretionary") + sum("review"),
    groceriesSpent: sum("groceries"),
    invested: sum("investment"),
  };
}
