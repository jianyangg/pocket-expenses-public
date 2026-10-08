import { money, type Expense, type Budget } from "@/lib/budget";
import { spendingSlices, budgetSlices } from "@/lib/chart-data";
import DonutChart from "./donut-chart";
export default function Analysis({
  expenses,
  budget,
  includeSetup = false,
}: {
  expenses: Expense[];
  budget: Budget;
  includeSetup?: boolean;
}) {
  const hasSpending = expenses.length > 0;
  const groups = new Map<string, number>();
  for (const expense of expenses)
    for (const tag of expense.tags)
      groups.set(tag, (groups.get(tag) ?? 0) + expense.amount);
  return (
    <section className="panel analysis">
      <h2>{hasSpending ? "Spending breakdown" : "Budget breakdown"}</h2>
      <DonutChart
        slices={
          hasSpending
            ? spendingSlices(expenses)
            : budgetSlices(budget, includeSetup)
        }
        label={hasSpending ? "Net spent" : "Budget"}
      />
      {hasSpending ? (
        <details className="tag-breakdown">
          <summary>By tag</summary>
          <div className="tag-totals">
            {[...groups]
              .sort((a, b) => b[1] - a[1])
              .map(([tag, amount]) => (
                <div key={tag}>
                  <span>#{tag}</span>
                  <strong>{money(amount)}</strong>
                </div>
              ))}
          </div>
          <p className="hint">
            Tags can overlap; the chart counts each purchase once.
          </p>
        </details>
      ) : null}
    </section>
  );
}
