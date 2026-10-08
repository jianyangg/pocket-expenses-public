import { money, type Budget, type Expense } from "@/lib/budget";
import { moneyFlow } from "@/lib/money-flow";
export default function MonthlyMoney({
  budget,
  expenses,
  includeSetup,
  onSettings,
}: {
  budget: Budget;
  expenses: Expense[];
  includeSetup: boolean;
  onSettings: () => void;
}) {
  const p = moneyFlow(budget, expenses, includeSetup);
  const parts = [
    { label: "Groceries", amount: p.groceries, color: "#6c9471" },
    { label: "Shopping & other", amount: p.shopping, color: "#a4b1c4" },
    { label: "Subscriptions", amount: p.subscriptions, color: "#a398ba" },
    { label: "Transit", amount: p.transit, color: "#92b9c1" },
    { label: "Investing", amount: p.investments, color: "#c9b183" },
    { label: "Available", amount: Math.max(0, p.remaining), color: "#275745" },
  ];
  const total = parts.reduce((n, s) => n + Math.max(0, s.amount), 0) || 1;
  return (
    <section className="panel money-dashboard">
      <div className="money-title">
        <span>Available this month</span>
        <button
          className="quiet"
          aria-label="Money view settings"
          onClick={onSettings}
        >
          Settings
        </button>
      </div>
      <strong
        className={"money-headline " + (p.remaining < 0 ? "negative" : "")}
      >
        {money(p.remaining)}
      </strong>
      <div
        className="money-river"
        role="img"
        aria-label={parts
          .map((s) => s.label + " " + money(s.amount))
          .join(", ")}
      >
        {parts
          .filter((s) => s.amount > 0)
          .map((s) => (
            <div
              key={s.label}
              style={{
                flexBasis: `${(s.amount / total) * 100}%`,
                background: s.color,
              }}
            />
          ))}
      </div>
      <div className="money-categories">
        {parts.slice(0, 5).map((s) => (
          <div key={s.label}>
            <span>
              <i style={{ background: s.color }} />
              {s.label}
            </span>
            <strong>{money(s.amount)}</strong>
            {s.label === "Investing" ? (
              <small>{money(budget.investing)} target</small>
            ) : s.label === "Subscriptions" ? (
              <small>{money(budget.subscriptions)} planned</small>
            ) : null}
          </div>
        ))}
      </div>
      <details className="money-baseline">
        <summary>
          Income & deductions <strong>{money(p.starting)}</strong>
        </summary>
        <dl className="math">
          <dt>Monthly income</dt>
          <dd>{money(budget.income)}</dd>
          <dt>Rent</dt>
          <dd>−{money(budget.rent)}</dd>
          <dt>Utilities & internet</dt>
          <dd>−{money(budget.utilities)}</dd>
          {includeSetup ? (
            <>
              <dt>Setup depreciation</dt>
              <dd>−{money(budget.depreciation)}</dd>
            </>
          ) : null}
        </dl>
      </details>
    </section>
  );
}
