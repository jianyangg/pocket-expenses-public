import { money, type Expense } from "@/lib/budget";
import { spendingTrend } from "@/lib/spending-trend";
import InteractiveTrendChart from "./interactive-trend-chart";
export default function SpendingTrends({
  expenses,
  month,
  today,
  starting,
}: {
  expenses: Expense[];
  month: string;
  today: string;
  starting: number;
}) {
  const points = spendingTrend(expenses, month, today, starting);
  if (!points.length) return null;
  const days = points.length,
    total = points.reduce((n, p) => n + p.spent, 0);
  return (
    <section className="trend-grid" aria-label="Spending trends">
      <div className="trend-surface">
        <div className="section-head">
          <h2>Daily spending</h2>
          <strong>{money(total)}</strong>
        </div>
        <InteractiveTrendChart
          kind="bar"
          label="Daily spending including refunds"
          points={points.map((p) => ({ date: p.date, value: p.spent }))}
        />
        <div className="chart-axis">
          <span>Day 1</span>
          <span>Day {days}</span>
        </div>
      </div>
      <div className="trend-surface">
        <div className="section-head">
          <h2>Available over time</h2>
          <strong>{money(points.at(-1)!.remaining)}</strong>
        </div>
        <InteractiveTrendChart
          kind="line"
          label="Remaining balance after spending and investments"
          points={[
            { date: month + "-01", value: starting, opening: true },
            ...points.map((p) => ({ date: p.date, value: p.remaining })),
          ]}
        />
        <div className="chart-axis">
          <span>Month start</span>
          <span>Day {days}</span>
        </div>
      </div>
    </section>
  );
}
