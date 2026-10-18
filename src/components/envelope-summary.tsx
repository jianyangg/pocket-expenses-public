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
        {[
          { label: "Groceries", pace: p.groceries },
          { label: "Shopping & dining", pace: p.shopping },
        ].map(({ label, pace }) => (
          <div key={label}>
            <span>{label}</span>
            <strong className={pace.monthlyRemaining < 0 ? "negative" : ""}>
              {money(pace.monthlyRemaining)}
            </strong>
            <small>
              {pace.monthlyRemaining < 0 ? "over budget" : "left this month"}
            </small>
            {pace.leftToday !== null ? (
              <small
                className={"category-pace " + (pace.overToday ? "over" : "")}
                title="This category’s balance at the start of today, divided by days remaining, less today’s spending."
              >
                {pace.overToday > 0
                  ? `${money(pace.overToday)} over today’s pace`
                  : `Today’s pace: ${money(pace.leftToday)} left`}
              </small>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
