"use client";
import { useState } from "react";
import { money } from "@/lib/budget";
import type { DuplicateReview } from "@/lib/bank/types";
export default function BankMatchInbox({
  reviews,
  onResolve,
}: {
  reviews: DuplicateReview[];
  onResolve: (body: Record<string, unknown>) => Promise<boolean>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function resolve(body: Record<string, unknown>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (!(await onResolve(body)))
        setError("Could not save this decision. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  const review = reviews[0];
  if (!review) return null;
  return (
    <section className="panel match-inbox">
      <div className="section-head">
        <h2>Same purchase?</h2>
        <span>{reviews.length} to check</span>
      </div>
      <div className="match-bank">
        <span>
          From bank
          <small>
            {review.description} · {review.date}
          </small>
        </span>
        <strong>{money(review.amount)}</strong>
      </div>
      {review.candidates.map((e) => (
        <button
          className="match-option"
          disabled={busy}
          key={e.id}
          onClick={() =>
            void resolve({
              action: "match",
              bankId: review.bankId,
              expenseId: e.id,
            })
          }
        >
          <span>
            Match {e.description}
            <small>
              {e.date} · your estimate {money(e.amount)}
            </small>
          </span>
          <strong>Count once</strong>
        </button>
      ))}
      <div className="match-actions">
        <button
          disabled={busy}
          onClick={() =>
            void resolve({ action: "separate", bankId: review.bankId })
          }
        >
          {review.candidates.length ? "Separate purchase" : "Add bank purchase"}
        </button>
        <button
          className="quiet"
          disabled={busy}
          onClick={() =>
            void resolve({ action: "ignore", bankId: review.bankId })
          }
        >
          Exclude from expenses
        </button>
      </div>
      <p className="hint">
        Possible duplicates are held here until you decide. Resolve them before
        using the investment forecast.
      </p>
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
