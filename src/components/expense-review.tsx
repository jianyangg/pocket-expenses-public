"use client";
import { useRef, useState } from "react";
import { buckets, money, type Expense, type Bucket } from "@/lib/budget";
import { reviewQueue, daysBefore, swipeAction } from "@/lib/review-queue";
import { normalizeTags } from "@/lib/entry-tags";
import TagPicker from "./tag-picker";
const labels: Record<Bucket, string> = {
  discretionary: "Spending",
  groceries: "Groceries",
  bill: "Bills & transit",
  investment: "Investing",
  fixed: "Fixed purchase",
  reserved: "Reserved refills",
  review: "Needs review",
};
type Props = {
  expenses: Expense[];
  today: string;
  busy: boolean;
  onSave: (expense: Expense) => Promise<boolean>;
};
type History = { expense: Expense; saved: boolean };
export default function ExpenseReview({
  expenses,
  today,
  busy,
  onSave,
}: Props) {
  const [start, setStart] = useState(daysBefore(today, 2));
  const [end, setEnd] = useState(today);
  const [done, setDone] = useState<string[]>([]);
  const [history, setHistory] = useState<History[]>([]);
  const [untagged, setUntagged] = useState(true);
  const [working, setWorking] = useState(false);
  const lock = useRef(false);
  const queue = reviewQueue(expenses, start, end, done, untagged);
  const current = queue[0];
  async function finish(value: Expense, save: boolean) {
    if (lock.current || busy) return;
    lock.current = true;
    setWorking(true);
    try {
      if (save && !(await onSave(value))) return;
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
        {[1, 3, 7].map((days) => (
          <button
            key={days}
            className="quiet"
            onClick={() => {
              setStart(daysBefore(today, days - 1));
              setEnd(today);
            }}
          >
            {days === 1 ? "Today" : `Last ${days} days`}
          </button>
        ))}
      </div>
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
      <label className="review-filter">
        <input
          type="checkbox"
          checked={untagged}
          onChange={(e) => setUntagged(e.target.checked)}
        />{" "}
        Only without tags
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
        <ReviewCard
          key={current.id}
          expense={current}
          tags={tags}
          disabled={busy || working}
          onFinish={finish}
        />
      ) : (
        <div className="panel review-empty">
          <h2>{done.length ? "All done" : "No transactions"}</h2>
          <p>Choose another date range to review more.</p>
          {done.length ? (
            <button
              className="quiet"
              onClick={() => {
                setDone([]);
                setHistory([]);
              }}
            >
              Review again
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
function ReviewCard({
  expense,
  tags: existing,
  disabled,
  onFinish,
}: {
  expense: Expense;
  tags: string[];
  disabled: boolean;
  onFinish: (expense: Expense, save: boolean) => Promise<void>;
}) {
  const [tags, setTags] = useState(expense.tags);
  const [query, setQuery] = useState("");
  const [bucket, setBucket] = useState(expense.bucket);
  const [drag, setDrag] = useState(0);
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const [options, setOptions] = useState(false);
  async function classify(value: "groceries" | "discretionary") {
    setDrag(0);
    await onFinish(
      {
        ...expense,
        bucket: value,
        tags: [
          ...new Set([
            ...tags.filter((t) => t !== "groceries" && t !== "shopping"),
            value === "groceries" ? "groceries" : "shopping",
          ]),
        ],
      },
      true,
    );
  }
  async function finish(save: boolean) {
    setDrag(0);
    await onFinish(
      {
        ...expense,
        bucket,
        tags: [...new Set([...tags, ...normalizeTags(query)])],
      },
      save,
    );
  }
  return (
    <>
      <article
        className="panel review-card"
        style={{ transform: `translateX(${drag}px) rotate(${drag / 25}deg)` }}
      >
        <div
          className="review-swipe-zone"
          onPointerDown={(e) => {
            if (disabled || e.button !== 0) return;
            pointer.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (pointer.current?.id === e.pointerId)
              setDrag(
                Math.max(-160, Math.min(160, e.clientX - pointer.current.x)),
              );
          }}
          onPointerCancel={() => {
            pointer.current = null;
            setDrag(0);
          }}
          onPointerUp={(e) => {
            if (pointer.current?.id !== e.pointerId) return;
            const action = swipeAction(
              e.clientX - pointer.current.x,
              e.clientY - pointer.current.y,
            );
            pointer.current = null;
            setDrag(0);
            if (action === "options") setOptions(true);
            else if (action) void classify(action);
          }}
        >
          <span className="review-date">{expense.date}</span>
          <h2>{expense.description}</h2>
          <strong className="review-amount">{money(expense.amount)}</strong>
          <p className="hint">← Groceries · Shopping → · ↑ More</p>
        </div>
        <fieldset disabled={disabled} hidden={!options}>
          <legend className="sr-only">Categorize transaction</legend>
          <div className="review-buckets">
            {(["discretionary", "groceries", "bill"] as Bucket[]).map(
              (value) => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={bucket === value}
                  onClick={() => setBucket(value)}
                >
                  {labels[value]}
                </button>
              ),
            )}
          </div>
          <details>
            <summary>Other categories</summary>
            <select
              aria-label="Budget category"
              value={bucket}
              onChange={(e) => setBucket(e.target.value as Bucket)}
            >
              {buckets.map((value) => (
                <option key={value} value={value}>
                  {labels[value]}
                </option>
              ))}
            </select>
          </details>
          <TagPicker
            tags={tags}
            query={query}
            existing={existing}
            onTags={(values) => {
              setTags(values);
              if (values.includes("groceries")) setBucket("groceries");
            }}
            onQuery={setQuery}
          />
        </fieldset>
      </article>
      <div className="review-actions">
        <button disabled={disabled} onClick={() => void classify("groceries")}>
          ← Groceries
        </button>
        <button
          className="quiet"
          disabled={disabled}
          onClick={() => setOptions((v) => !v)}
        >
          ↑ More
        </button>
        <button
          disabled={disabled}
          onClick={() => void classify("discretionary")}
        >
          Shopping →
        </button>
      </div>
      {options ? (
        <div className="review-actions">
          <button
            className="quiet"
            disabled={disabled}
            onClick={() => void finish(false)}
          >
            Skip
          </button>
          <button disabled={disabled} onClick={() => void finish(true)}>
            Save choice
          </button>
        </div>
      ) : null}
    </>
  );
}
