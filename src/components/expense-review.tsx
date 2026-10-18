"use client";
import { useRef, useState } from "react";
import type { Expense } from "@/lib/budget";
import { reviewQueue, daysBefore } from "@/lib/review-queue";
import ExpenseReviewCard from "./expense-review-card";
type Props = {
  expenses: Expense[];
  today: string;
  busy: boolean;
  onSave: (expense: Expense) => Promise<boolean>;
  onSaveNote: (id: string, note: string) => Promise<boolean>;
};
type History = { expense: Expense; saved: boolean };
export default function ExpenseReview({
  expenses,
  today,
  busy,
  onSave,
  onSaveNote,
}: Props) {
  const [start, setStart] = useState("2000-01-01");
  const [end, setEnd] = useState(today);
  const [done, setDone] = useState<string[]>([]);
  const [history, setHistory] = useState<History[]>([]);
  const [untagged, setUntagged] = useState(false);
  const [working, setWorking] = useState(false);
  const lock = useRef(false);
  const queue = reviewQueue(expenses, start, end, done, untagged);
  const current = queue[0];
  async function finish(value: Expense, save: boolean) {
    if (lock.current || busy) return;
    lock.current = true;
    setWorking(true);
    try {
      if (save && !(await onSave({ ...value, reviewed: true }))) return;
      setDone((ids) => [...ids, value.id]);
      setHistory((items) => [...items, { expense: current!, saved: save }]);
    } finally {
      lock.current = false;
      setWorking(false);
    }
  }
  async function undo() {
    const previous = history.at(-1);
    if (!previous || lock.current || busy) return;
    lock.current = true;
    setWorking(true);
    try {
      if (previous.saved && !(await onSave(previous.expense))) return;
      setDone((ids) => ids.filter((id) => id !== previous.expense.id));
      setHistory((items) => items.slice(0, -1));
    } finally {
      lock.current = false;
      setWorking(false);
    }
  }
  const tags = [
    ...new Set([
      "food",
      "groceries",
      "clothes",
      "shopping",
      ...expenses.flatMap((e) => e.tags),
    ]),
  ];
  return (
    <section className="review-panel">
      <div className="review-presets">
        <button
          className="quiet"
          aria-pressed={start === "2000-01-01"}
          onClick={() => {
            setStart("2000-01-01");
            setEnd(today);
          }}
        >
          All new
        </button>
        {[1, 3, 7].map((days) => (
          <button
            key={days}
            className="quiet"
            aria-pressed={
              start === daysBefore(today, days - 1) && end === today
            }
            onClick={() => {
              setStart(daysBefore(today, days - 1));
              setEnd(today);
            }}
          >
            {days === 1 ? "Today" : `Last ${days} days`}
          </button>
        ))}
      </div>
      <details className="review-custom">
        <summary>Custom dates</summary>
        <div className="review-dates">
          <label>
            From
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
        </div>
      </details>
      <label className="review-filter">
        <input
          type="checkbox"
          checked={untagged}
          onChange={(e) => setUntagged(e.target.checked)}
        />{" "}
        Only untagged
      </label>
      <div className="section-head">
        <span role="status">
          {queue.length} left · {done.length} reviewed
        </span>
        <button
          className="quiet"
          disabled={!history.length || busy || working}
          onClick={() => void undo()}
        >
          Undo
        </button>
      </div>
      {start > end ? (
        <p role="alert">Choose an end date after the start date.</p>
      ) : current ? (
        <ExpenseReviewCard
          key={current.id}
          expense={current}
          tags={tags}
          disabled={busy || working}
          onFinish={finish}
          onSaveNote={onSaveNote}
        />
      ) : (
        <div className="panel review-empty">
          <h2>{done.length ? "All done" : "All caught up"}</h2>
          <p>Nothing to categorise in this range.</p>
        </div>
      )}
    </section>
  );
}
