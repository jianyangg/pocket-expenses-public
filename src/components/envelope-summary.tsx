import { money, type Expense } from "@/lib/budget";
import type { Envelopes } from "@/lib/spending-plan";
import { spendingSummary } from "@/lib/spending-summary";
export default function EnvelopeSummary({
  envelopes: e,
  expenses,
  today,
  month,
}: {
  envelopes: Envelopes;
  expenses: Expense[];
  today: string;
  month: string;
}) {
  const p = spendingSummary(e, expenses, month, today);
  return (
    <section className="envelope-summary" aria-label="Monthly budget balance">
      <p className="available-label">This month’s budget balance</p>
      <strong
        className={"available-amount " + (p.netRemaining < 0 ? "negative" : "")}
      >
        {money(p.netRemaining)}
      </strong>
      <div className="envelope-cards">
        <div>
          <span>Groceries</span>
          <strong className={e.groceriesLeft < 0 ? "negative" : ""}>
            {money(e.groceriesLeft)}
          </strong>
          <small>
            {e.groceriesLeft < 0 ? "over budget" : "left this month"}
          </small>
        </div>
        <div>
          <span>Shopping & dining</span>
          <strong className={e.discretionaryLeft < 0 ? "negative" : ""}>
            {money(e.discretionaryLeft)}
          </strong>
          <small>
            {e.discretionaryLeft < 0 ? "over budget" : "left this month"}
          </small>
        </div>
      </div>
      {p.daysLeft ? (
        <div
          className={
            "today-pace " + (p.overToday || p.netRemaining < 0 ? "over" : "")
          }
        >
          <div>
            <span>Left for today</span>
            <strong>{money(p.dailyRemaining ?? 0)}</strong>
          </div>
          <small>
            {money(p.spentToday)} spent ·{" "}
            {p.netRemaining < 0
              ? "Monthly budget exceeded"
              : p.overToday > 0
                ? money(p.overToday) + " over today’s allowance"
                : money(p.allowance) + " allowance"}
          </small>
        </div>
      ) : null}
    </section>
  );
}
