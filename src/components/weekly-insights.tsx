import { expenseCategory } from "@/lib/money-flow";
import { money, type Expense } from "@/lib/budget";
import { weeklyInsights } from "@/lib/spending-insights";
const labels: Record<string, string> = {
  groceries: "Groceries",
  shopping: "Shopping & dining",
  subscriptions: "Subscriptions",
  transit: "Transit",
  refills: "Home & refills",
};
export default function WeeklyInsights({
  expenses,
  today,
  onEdit,
}: {
  expenses: Expense[];
  today: string;
  onEdit: (e: Expense) => void;
}) {
  const i = weeklyInsights(expenses, today);
  return (
    <section className="panel weekly-insights">
      <div className="section-head">
        <h2>Last 7 days</h2>
        <strong>{money(i.total)}</strong>
      </div>
      <p className="hint">
        {i.change === 0
          ? "Same as the prior 7 days"
          : `${money(Math.abs(i.change))} ${i.change > 0 ? "more" : "less"} than the prior 7 days`}{" "}
        · recorded purchases, net of refunds
      </p>
      {i.categories.map((c) => (
        <details key={c.key}>
          <summary>
            <span>{labels[c.key] ?? c.key}</span>
            <strong>{money(c.amount)}</strong>
          </summary>
          <ul>
            {i.rows
              .filter((e) => expenseCategory(e) === c.key)
              .map((e) => (
                <li key={e.id}>
                  <button className="quiet" onClick={() => onEdit(e)}>
                    <span>
                      {e.description}
                      <small>{e.date}</small>
                    </span>
                    <strong>{money(e.amount)}</strong>
                  </button>
                </li>
              ))}
          </ul>
        </details>
      ))}
      {i.increases.map(({ current, previous }) => (
        <button
          key={current.id}
          className="subscription-change quiet"
          onClick={() => onEdit(current)}
        >
          {current.description}: {money(current.amount)}, up from{" "}
          {money(previous.amount)} on {previous.date} ›
        </button>
      ))}
      {i.merchants[0] ? (
        <p className="repeat-note">
          {i.merchants[0].name}: {i.merchants[0].count} purchases,{" "}
          {money(i.merchants[0].amount)} net.
        </p>
      ) : null}
      {!i.rows.length ? (
        <p className="hint">No spending recorded in this period.</p>
      ) : null}
    </section>
  );
}
