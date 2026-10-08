"use client";
import { useState } from "react";
import { type Budget } from "@/lib/budget";
const labels: Record<keyof Budget, string> = {
  income: "Monthly income",
  insurance: "Insurance (USD)",
  rent: "Rent",
  utilities: "Utilities & internet",
  subscriptions: "Monthly subscriptions",
  transit: "Transit allowance",
  groceries: "Groceries",
  refills: "Toiletry & household refill savings",
  renewals: "Annual renewal savings",
  depreciation: "Past purchases: monthly depreciation",
  investing: "Investment budget",
};
export default function BudgetSettings({
  budget,
  month,
  onSave,
  busy,
  initiallyOpen = false,
}: {
  budget: Budget;
  month: string;
  onSave: (b: Budget) => Promise<void>;
  busy: boolean;
  initiallyOpen?: boolean;
}) {
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const b = { ...budget };
    for (const k of Object.keys(labels) as (keyof Budget)[]) {
      const raw = String(form.get(k));
      if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
        setError("Use nonnegative amounts with up to two decimal places.");
        return;
      }
      b[k] = Math.round(Number(raw) * 100);
      if (b[k] > 100000000) {
        setError("Each amount must be below $1 million.");
        return;
      }
    }
    await onSave(b);
  }
  return (
    <details className="panel settings" open={initiallyOpen || undefined}>
      <summary>
        Monthly budget <span>Income, bills & investing</span>
      </summary>
      <form onSubmit={submit} key={month + JSON.stringify(budget)}>
        <div className="settings-grid">
          {(Object.keys(labels) as (keyof Budget)[]).map((k) => (
            <label key={k}>
              {labels[k]}
              <div className="currency-input">
                <span>$</span>
                <input
                  name={k}
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  defaultValue={(budget[k] / 100).toFixed(2)}
                />
              </div>
            </label>
          ))}
        </div>
        <p className="hint">Applies to {month}.</p>
        <button disabled={busy}>Save monthly plan</button>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </details>
  );
}
