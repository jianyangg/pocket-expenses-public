"use client";
import { useState } from "react";
import { money, type Expense } from "@/lib/budget";
import { bucketLabels } from "./quick-entry";
export default function ExpenseList({
  expenses,
  onEdit,
  onDelete,
  busy,
}: {
  expenses: Expense[];
  onEdit: (e: Expense) => void;
  onDelete: (e: Expense) => void;
  busy: boolean;
}) {
  const [visible, setVisible] = useState(10);
  const [search, setSearch] = useState("");
  const rows = expenses
    .filter((e) =>
      `${e.description} ${e.tags.map((t) => "#" + t).join(" ")} ${e.bucket}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <section className="panel">
      <div className="section-head">
        <h2>
          Expenses <span className="count">{expenses.length}</span>
        </h2>
        <input
          className="search"
          aria-label="Search expenses or hashtags"
          placeholder="Search or #tag"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setVisible(10);
          }}
        />
      </div>
      {rows.length ? (
        <div>
          <ul className="expense-list">
            {rows.slice(0, visible).map((e) => (
              <li key={e.id}>
                <div>
                  <button
                    className="expense-title"
                    onClick={() => onEdit(e)}
                    disabled={busy}
                  >
                    {e.description}
                  </button>
                  <p>
                    {new Date(e.date + "T12:00:00").toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                      },
                    )}{" "}
                    <span className="dot">·</span> {bucketLabels[e.bucket]}
                  </p>
                  <div className="tags">
                    {e.tags.map((t) => (
                      <button key={t} onClick={() => setSearch("#" + t)}>
                        #{t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="expense-right">
                  <strong className={e.amount < 0 ? "refund" : ""}>
                    {money(e.amount)}
                  </strong>
                  <button
                    className="quiet"
                    disabled={busy}
                    onClick={() => onDelete(e)}
                    aria-label={`Delete ${e.description}`}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {rows.length > visible ? (
            <button
              className="quiet show-more"
              onClick={() => setVisible(visible + 10)}
            >
              Show more
            </button>
          ) : null}
        </div>
      ) : (
        <div className="empty">
          <h3>{search ? "No matching expenses." : "No expenses yet."}</h3>
          <p>{search ? "Try another merchant or tag." : "Tap + to add one."}</p>
        </div>
      )}
    </section>
  );
}
