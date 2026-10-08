"use client";
import { useEffect, useId, useRef } from "react";
import { money, type Expense } from "@/lib/budget";
import {
  categoryBreakdown,
  spendingCategories,
  type SpendingCategory,
} from "@/lib/category-breakdown";
export default function CategoryDetails({
  category,
  expenses,
  month,
  onClose,
}: {
  category: SpendingCategory | null;
  expenses: Expense[];
  month: string;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (category && !node.open) node.showModal();
    else if (!category && node.open) node.close();
  }, [category]);
  const report = category
    ? categoryBreakdown(expenses, month, category)
    : { rows: [], total: 0 };
  const label =
    spendingCategories.find((c) => c.key === category)?.label ?? "Transactions";
  return (
    <dialog
      ref={dialog}
      className="category-details"
      aria-labelledby={title}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="category-details-header">
        <div className="section-head">
          <h2 id={title}>{label}</h2>
          <button className="quiet" onClick={onClose}>
            Done
          </button>
        </div>
        <div className="category-details-total">
          <strong>{money(report.total)}</strong>
          <span>
            {report.rows.length} transaction
            {report.rows.length === 1 ? "" : "s"} ·{" "}
            {new Date(month + "-01T12:00:00").toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
      {report.rows.length ? (
        <ul className="category-transactions">
          {report.rows.map((e) => (
            <li key={e.id}>
              <div>
                <p>{e.description}</p>
                <small>
                  {new Date(e.date + "T12:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                  {e.tags.length
                    ? " · " +
                      e.tags
                        .filter((t) => t !== "chase")
                        .map((t) => "#" + t)
                        .join(" ")
                    : ""}
                </small>
              </div>
              <strong className={e.amount < 0 ? "transaction-refund" : ""}>
                {money(e.amount)}
                {e.amount < 0 ? <small>Refund</small> : null}
              </strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className="category-details-empty">
          No transactions in this category this month.
        </p>
      )}
    </dialog>
  );
}
