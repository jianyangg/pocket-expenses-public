import type { Expense } from "./budget";
import { expenseCategory } from "./money-flow";
const before = (date: string, days: number) =>
  new Date(Date.parse(date + "T12:00:00Z") - days * 86400000)
    .toISOString()
    .slice(0, 10);
export function weeklyInsights(expenses: Expense[], today: string) {
  const eligible = expenses.filter(
    (e) =>
      !["investments", "setup", "transfer", "essential"].includes(
        expenseCategory(e),
      ),
  );
  const rows = eligible.filter(
    (e) => e.date >= before(today, 6) && e.date <= today,
  );
  const total = rows.reduce((n, e) => n + e.amount, 0),
    previous = eligible
      .filter((e) => e.date >= before(today, 13) && e.date < before(today, 6))
      .reduce((n, e) => n + e.amount, 0);
  const categories = [...new Set(rows.map(expenseCategory))]
    .map((key) => ({
      key,
      amount: rows
        .filter((e) => expenseCategory(e) === key)
        .reduce((n, e) => n + e.amount, 0),
    }))
    .sort((a, b) => b.amount - a.amount);
  const merchants = [
    ...new Set(rows.map((e) => e.description.toLowerCase().trim())),
  ]
    .map((key) => {
      const purchases = rows.filter(
        (e) => e.description.toLowerCase().trim() === key,
      );
      return {
        name: purchases[0].description,
        count: purchases.filter((e) => e.amount > 0).length,
        amount: purchases.reduce((n, e) => n + e.amount, 0),
        rows: purchases,
      };
    })
    .filter((m) => m.count >= 2)
    .sort((a, b) => b.amount - a.amount);
  const increases = eligible
    .filter(
      (e) =>
        expenseCategory(e) === "subscriptions" &&
        e.amount > 0 &&
        e.date >= before(today, 6) &&
        e.date <= today,
    )
    .flatMap((current) => {
      const previous = eligible
        .filter(
          (e) =>
            e.id !== current.id &&
            e.date < current.date &&
            e.date <= today &&
            e.amount > 0 &&
            e.description.toLowerCase().trim() ===
              current.description.toLowerCase().trim(),
        )
        .sort((a, b) => b.date.localeCompare(a.date))[0];
      return previous && current.amount > previous.amount
        ? [{ current, previous }]
        : [];
    });
  return {
    increases,
    total,
    previous,
    change: total - previous,
    rows,
    categories,
    merchants,
  };
}
