"use client";
import { useEffect, useRef } from "react";
import { money, type Expense } from "@/lib/budget";
import { dayActivity } from "@/lib/day-activity";
import { expenseCategory } from "@/lib/money-flow";
import { spendingCategories } from "@/lib/category-breakdown";
import InlineExpenseNote from "./inline-expense-note";
type Actions = {
  busy: boolean;
  onEdit: (expense: Expense) => void;
  onSaveNote: (id: string, note: string) => Promise<boolean>;
};
function DayRows({
  rows,
  busy,
  onEdit,
  onSaveNote,
}: Actions & { rows: Expense[] }) {
  return (
    <ul className="day-activity-rows">
      {rows.map((e) => (
        <li key={e.id}>
          <div className="day-activity-row">
            <button
              className="day-activity-merchant"
              onClick={() => onEdit(e)}
              disabled={busy}
            >
              {e.description}
              <small>
                {spendingCategories.find((c) => c.key === expenseCategory(e))
                  ?.label ?? "Other"}
                {e.pending ? " · Pending" : ""}
              </small>
            </button>
            <strong className={e.amount < 0 ? "refund" : ""}>
              {money(e.amount)}
            </strong>
          </div>
          {e.budgetAllocation ? (
            <p className="day-allocation">
              Monthly portion · {money(e.budgetAllocation.purchaseAmount)} paid{" "}
              {e.budgetAllocation.purchaseDate}
            </p>
          ) : null}
          <InlineExpenseNote expense={e} busy={busy} onSave={onSaveNote} />
        </li>
      ))}
    </ul>
  );
}
export default function DayActivity({
  date,
  expenses,
  onBack,
  onShowAll,
  ...actions
}: Actions & {
  date: string;
  expenses: Expense[];
  onBack: () => void;
  onShowAll: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const day = dayActivity(expenses, date);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ block: "start" });
  }, [date]);
  const onEdit = (expense: Expense) => {
    const original = expenses.find((e) => e.id === expense.id);
    if (original) actions.onEdit(original);
  };
  return (
    <section
      className="day-activity panel"
      aria-labelledby="day-activity-title"
    >
      <div className="day-activity-nav">
        <button className="quiet" onClick={onBack}>
          ‹ Back to charts
        </button>
        <button className="quiet" onClick={onShowAll}>
          Whole month
        </button>
      </div>
      <div className="section-head">
        <h2 id="day-activity-title" ref={heading} tabIndex={-1}>
          {new Date(date + "T12:00:00Z").toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
          })}
        </h2>
        <strong className={day.total < 0 ? "refund" : ""}>
          {money(day.total)}
        </strong>
      </div>
      <p className="day-activity-caption">
        Daily spending
        {day.refunds
          ? ` · ${money(day.purchases)} purchases − ${money(day.refunds)} refunds`
          : ""}
      </p>
      {day.counted.length ? (
        <DayRows {...actions} onEdit={onEdit} rows={day.counted} />
      ) : (
        <p className="day-activity-empty">No spending recorded on this day.</p>
      )}
      {day.other.length ? (
        <details className="day-other-transactions">
          <summary>Other transactions · {day.other.length}</summary>
          <p className="day-activity-caption">
            Excluded from the daily spending total.
          </p>
          <DayRows {...actions} onEdit={onEdit} rows={day.other} />
        </details>
      ) : null}
    </section>
  );
}
