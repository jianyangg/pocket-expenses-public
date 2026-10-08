import { money, type Expense } from "@/lib/budget";
import { spendingTrend } from "@/lib/spending-trend";
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
  const days = points.length;
  const total = points.reduce((n, p) => n + p.spent, 0);
  const low = Math.min(0, ...points.map((p) => p.spent)),
    high = Math.max(1, ...points.map((p) => p.spent));
  const y = (value: number) => 20 + (100 * (high - value)) / (high - low);
  const step = 300 / days;
  const balances = [{ day: 0, remaining: starting }, ...points];
  const floor = Math.min(0, ...balances.map((p) => p.remaining));
  const ceiling = Math.max(1, ...balances.map((p) => p.remaining));
  const line = balances
    .map(
      (p) =>
        `${10 + (p.day / days) * 300},${20 + (100 * (ceiling - p.remaining)) / (ceiling - floor)}`,
    )
    .join(" ");
  return (
    <section className="trend-grid" aria-label="Spending trends">
      <div className="trend-surface">
        <div className="section-head">
          <h2>Daily spending</h2>
          <strong>{money(total)}</strong>
        </div>
        <svg
          className="trend-chart"
          viewBox="0 0 320 146"
          role="img"
          aria-label="Daily spending including refunds"
        >
          <line x1="10" x2="310" y1={y(0)} y2={y(0)} stroke="#e5e5ea" />
          {points.map((p, index) => (
            <rect
              key={p.date}
              x={10 + index * step + step * 0.15}
              y={Math.min(y(p.spent), y(0))}
              width={step * 0.7}
              height={Math.max(1, Math.abs(y(p.spent) - y(0)))}
              rx={Math.min(3, step * 0.2)}
              fill={
                p.spent < 0 ? "#34c759" : p.day === days ? "#007aff" : "#a8caff"
              }
            >
              <title>
                {p.date}: {money(p.spent)}
              </title>
            </rect>
          ))}
        </svg>
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
        <svg
          className="trend-chart"
          viewBox="0 0 320 146"
          role="img"
          aria-label="Remaining monthly balance after spending and investments"
        >
          <line x1="10" x2="310" y1="120" y2="120" stroke="#e5e5ea" />
          <polygon
            points={`10,120 ${line} 310,120`}
            fill="#007aff"
            opacity=".07"
          />
          <polyline
            points={line}
            fill="none"
            stroke="#007aff"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {balances.map((p) => (
            <circle
              key={p.day}
              cx={10 + (p.day / days) * 300}
              cy={20 + (100 * (ceiling - p.remaining)) / (ceiling - floor)}
              r={p.day === days ? 4 : 2}
              fill="#007aff"
            >
              <title>
                Day {p.day}: {money(p.remaining)}
              </title>
            </circle>
          ))}
        </svg>
        <div className="chart-axis">
          <span>Month start</span>
          <span>Day {days}</span>
        </div>
      </div>
    </section>
  );
}
