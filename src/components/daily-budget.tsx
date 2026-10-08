import { money, type Budget, type Expense } from "@/lib/budget";
import { dailyAllowance } from "@/lib/daily-allowance";
export default function DailyBudget({
  budget,
  expenses,
  month,
  today,
  includeSetup,
}: {
  budget: Budget;
  expenses: Expense[];
  month: string;
  today: string;
  includeSetup: boolean;
}) {
  const p = dailyAllowance(budget, expenses, month, today, includeSetup);
  if (!p.daysLeft) return null;
  const over = p.remaining < 0;
  return (
    <section
      className={"daily-budget " + (over ? "daily-over" : "")}
      aria-label="Today's spending budget"
    >
      <div className="daily-heading">
        <span>{over ? "Over today's budget" : "Left to spend today"}</span>
        <strong>{money(Math.abs(p.remaining))}</strong>
      </div>
      <div
        className="daily-meter"
        role="progressbar"
        aria-label="Today's budget used"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={
          p.allowance > 0
            ? Math.min(100, Math.max(0, (p.spent / p.allowance) * 100))
            : p.spent > 0
              ? 100
              : 0
        }
      >
        <span
          style={{
            width:
              (p.allowance > 0
                ? Math.min(100, Math.max(0, (p.spent / p.allowance) * 100))
                : p.spent > 0
                  ? 100
                  : 0) + "%",
          }}
        />
      </div>
      <div className="daily-caption">
        <span>{money(p.spent)} spent</span>
        <span>{money(p.allowance)} daily allowance</span>
      </div>
      <details>
        <summary>Groceries + everyday spending</summary>
        <p>
          Monthly money left before today's spending ÷ {p.daysLeft} days
          remaining. Investments reduce the available balance but are not
          today's spending.
        </p>
      </details>
    </section>
  );
}
