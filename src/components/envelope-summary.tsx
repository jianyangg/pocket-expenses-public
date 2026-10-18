import { money, type Expense } from "@/lib/budget";
import { expenseCategory } from "@/lib/money-flow";
import type { Envelopes } from "@/lib/spending-plan";
export default function EnvelopeSummary({
  envelopes,
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
  const e = envelopes;
  const left = [
    e.groceriesLeft,
    e.discretionaryLeft,
    e.transitLeft,
    e.subscriptionsLeft,
    e.refillsLeft,
  ].reduce((n, v) => n + Math.max(0, v), 0);
  const spentBy = (category: string) =>
    expenses
      .filter((p) => p.date === today && expenseCategory(p) === category)
      .reduce((n, p) => n + p.amount, 0);
  const spentToday = [
    "groceries",
    "shopping",
    "transit",
    "subscriptions",
    "refills",
  ].reduce((n, c) => n + spentBy(c), 0);
  const openingRoom =
    Math.max(0, e.groceriesLeft + spentBy("groceries")) +
    Math.max(0, e.discretionaryLeft + spentBy("shopping")) +
    Math.max(0, e.transitLeft + spentBy("transit")) +
    Math.max(0, e.subscriptionsLeft + spentBy("subscriptions")) +
    Math.max(0, e.refillsLeft + spentBy("refills"));
  const days =
    month === today.slice(0, 7)
      ? new Date(
          Number(month.slice(0, 4)),
          Number(month.slice(5)),
          0,
        ).getDate() -
        Number(today.slice(8)) +
        1
      : 0;
  const allowance = days ? Math.floor(openingRoom / days) : 0;
  const remaining = allowance - spentToday;
  return (
    <section className="envelope-summary">
      <p className="available-label">Everyday spending left</p>
      <strong className="available-amount">{money(left)}</strong>
      <div className="envelope-cards">
        <div>
          <span>Groceries</span>
          <strong className={e.groceriesLeft < 0 ? "negative" : ""}>
            {money(e.groceriesLeft)}
          </strong>
        </div>
        <div>
          <span>Discretionary</span>
          <strong className={e.discretionaryLeft < 0 ? "negative" : ""}>
            {money(e.discretionaryLeft)}
          </strong>
          <small>of {money(e.limit)} / month</small>
        </div>
      </div>
      {days ? (
        <div className={"today-pace " + (remaining < 0 ? "over" : "")}>
          <div>
            <span>
              {remaining < 0 ? "Over today’s pace" : "Left to spend today"}
            </span>
            <strong>{money(Math.abs(remaining))}</strong>
          </div>
          <small>
            {money(spentToday)} net spent · {money(allowance)} daily pace
          </small>
        </div>
      ) : null}
      {e.carry < 0 ? (
        <p className="carry-note">
          {money(-e.carry)} brought forward from earlier overspending.
        </p>
      ) : null}
      {e.discretionaryLeft < 0 ? (
        <p className="carry-note">
          {money(-e.discretionaryLeft)} will reduce future discretionary
          allowances.{" "}
          <button className="quiet" onClick={onPlan}>
            Adjust plan
          </button>
        </p>
      ) : null}
    </section>
  );
}
