import { money, type Expense } from "@/lib/budget";
import type { Envelopes } from "@/lib/spending-plan";
import { spendingSummary } from "@/lib/spending-summary";
export default function EnvelopeSummary({
  envelopes: e,
  expenses,
  today,
  month,
  onPlan,
}: {
  envelopes: Envelopes;
  expenses: Expense[];
  today: string;
  month: string;
  onPlan: () => void;
}) {
  const p = spendingSummary(e, expenses, month, today);
  return (
    <section className="envelope-summary">
      <p className="available-label">
        {p.netRemaining < 0
          ? "Over this month’s budget"
          : "Left in this month’s budget"}
      </p>
      <strong
        className={"available-amount " + (p.netRemaining < 0 ? "negative" : "")}
      >
        {money(Math.abs(p.netRemaining))}
      </strong>
      <p className="budget-summary-context">
        All spending categories combined, including overspending.
      </p>
      <div className="envelope-cards">
        <div>
          <span>
            {e.groceriesLeft < 0
              ? "Groceries over budget"
              : "Groceries left this month"}
          </span>
          <strong className={e.groceriesLeft < 0 ? "negative" : ""}>
            {money(Math.abs(e.groceriesLeft))}
          </strong>
        </div>
        <div>
          <span>
            {e.discretionaryLeft < 0
              ? "Shopping & dining over budget"
              : "Shopping & dining left"}
          </span>
          <strong className={e.discretionaryLeft < 0 ? "negative" : ""}>
            {money(Math.abs(e.discretionaryLeft))}
          </strong>
          <small>{money(e.limit)} monthly budget</small>
        </div>
      </div>
      {p.daysLeft ? (
        <div
          className={
            "today-pace " + (p.overToday || p.netRemaining < 0 ? "over" : "")
          }
        >
          <div>
            <span>Remaining for today</span>
            <strong>{money(p.dailyRemaining ?? 0)}</strong>
          </div>
          <small>
            {money(p.spentToday)} counted today · {money(p.allowance)} daily
            budget
          </small>
          {p.overToday > 0 ? (
            <small>{money(p.overToday)} over today’s budget.</small>
          ) : null}
          {p.netRemaining < 0 ? (
            <small>
              Your combined monthly budget is already exceeded. Groceries and
              other category balances are shown above.
            </small>
          ) : (
            <small>
              Includes groceries, shopping, dining, transit, subscriptions and
              refills.
            </small>
          )}
        </div>
      ) : null}
      {e.carry < 0 ? (
        <p className="carry-note">
          {money(-e.carry)} of earlier overspending is included in this month’s
          shopping budget.
        </p>
      ) : null}
      {e.discretionaryLeft < 0 ? (
        <p className="carry-note">
          Shopping overspending reduces future months’ shopping budgets.{" "}
          <button className="quiet" onClick={onPlan}>
            Edit budget
          </button>
        </p>
      ) : null}
    </section>
  );
}
