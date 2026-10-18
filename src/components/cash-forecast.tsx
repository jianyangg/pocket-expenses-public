import { money, type Budget, type Expense } from "@/lib/budget";
import { cashForecast, type CashSnapshot } from "@/lib/cash-forecast";
import type { SpendingPlan } from "@/lib/spending-plan";
export default function CashForecast({
  budgets,
  expenses,
  plan,
  cash,
  today,
  duplicateCount,
  loading,
  error,
  onRefresh,
  onPlan,
  onConfirmPaid,
  onEdit,
  busy,
}: {
  budgets: Record<string, Budget>;
  expenses: Expense[];
  plan: SpendingPlan;
  cash: CashSnapshot | null;
  today: string;
  duplicateCount: number;
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onPlan: () => void;
  onConfirmPaid: (e: Expense) => void;
  onEdit: (e: Expense) => void;
  busy: boolean;
}) {
  const f = cashForecast(budgets, expenses, plan, cash, today, duplicateCount);
  const stale =
    !!cash && Date.now() - Date.parse(cash.checkedAt) > 24 * 3600000;
  const invested = expenses
    .filter(
      (e) =>
        e.bucket === "investment" &&
        e.date >= plan.startMonth + "-01" &&
        e.date <= today,
    )
    .reduce((n, e) => n + e.amount, 0);
  return (
    <section className="panel forecast-card">
      <div className="section-head">
        <h2>More you could invest</h2>
        <button className="quiet" disabled={loading} onClick={onRefresh}>
          {loading ? "Checking…" : "Refresh"}
        </button>
      </div>
      <strong className="forecast-amount">
        {f.investable === null || stale ? "—" : money(f.investable)}
      </strong>
      <p className="hint">
        {duplicateCount
          ? "Resolve possible duplicates to see a reliable estimate."
          : !cash
            ? "Connect a bank to calculate from current cash."
            : stale
              ? "Bank balances are over a day old. Refresh before moving money."
              : `After reserving living costs through ${plan.through}. ${plan.buffer ? money(plan.buffer) + " buffer kept." : "No emergency buffer kept."}`}
      </p>
      <div className="forecast-invested">
        <span>Already transferred to investments since {plan.startMonth}</span>
        <strong>{money(invested)}</strong>
      </div>
      <details>
        <summary>Where this number comes from</summary>
        <dl>
          <div>
            <dt>Bank cash available</dt>
            <dd>{cash ? money(cash.available) : "Unavailable"}</dd>
          </div>
          <div>
            <dt>Living costs reserved</dt>
            <dd>−{money(f.reserved)}</dd>
          </div>
          <div>
            <dt>Payments not yet confirmed in bank cash</dt>
            <dd>−{money(f.manualReserve)}</dd>
          </div>
          <div>
            <dt>Cash buffer</dt>
            <dd>−{money(f.buffer)}</dd>
          </div>
        </dl>
        {f.manualRows
          .filter((e) => e.amount > 0)
          .map((e) => (
            <div className="manual-reserve-row" key={e.id}>
              <button className="quiet" onClick={() => onEdit(e)}>
                {e.description} · {money(e.amount)}
              </button>
              <button
                className="quiet"
                disabled={busy}
                onClick={() => onConfirmPaid(e)}
              >
                Already in balance
              </button>
            </div>
          ))}
        <p className="hint">
          Cash already received is counted once. Depreciation is excluded.
          Manual estimates stay reserved until matched; refunds are released
          only when reflected by the bank.
        </p>
        {cash ? (
          <small>
            Balance checked {new Date(cash.checkedAt).toLocaleString()}
          </small>
        ) : null}
        {f.reserves.map((r) => (
          <div className="forecast-month" key={r.month}>
            <span>{r.month}</span>
            <strong>{money(r.living)}</strong>
          </div>
        ))}
        <button className="quiet" onClick={onPlan}>
          Edit reserves & buffer
        </button>
      </details>
      {error ? (
        <p role="alert" className="error">
          {error}
        </p>
      ) : null}
    </section>
  );
}
