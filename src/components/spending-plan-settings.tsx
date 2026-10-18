"use client";
import { useState } from "react";
import type { FinancialSettings } from "@/lib/use-financial";
import type { SpendingPlan } from "@/lib/spending-plan";
import type { Budget } from "@/lib/budget";
export default function SpendingPlanSettings({
  settings,
  plan,
  budget,
  month,
  onSave,
}: {
  settings: FinancialSettings;
  plan: SpendingPlan;
  budget: Budget;
  month: string;
  onSave: (s: FinancialSettings) => Promise<boolean>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const usd = (key: string) => {
      const raw = String(form.get(key));
      if (!/^\d+(\.\d{1,2})?$/.test(raw))
        throw Error("Use nonnegative dollar amounts.");
      return Math.round(Number(raw) * 100);
    };
    setError("");
    try {
      const next = {
        ...plan,
        through: String(form.get("through")),
        buffer: usd("buffer"),
        carryPositive: form.get("carryPositive") === "on",
        paidEssentials: {
          ...plan.paidEssentials,
          [month]: {
            rent: usd("rent"),
            utilities: usd("utilities"),
            insurance: usd("insurance"),
          },
        },
      };
      setBusy(true);
      if (!(await onSave({ ...settings, spendingPlan: next })))
        throw Error("Could not save. Please retry.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel plan-reserves">
      <h2>Cash reserves & carryovers</h2>
      <form onSubmit={submit} key={month + JSON.stringify(plan)}>
        <div className="settings-grid">
          <label>
            Reserve living costs through
            <input
              name="through"
              type="month"
              min={month}
              defaultValue={plan.through}
            />
          </label>
          <label>
            Emergency cash buffer (USD)
            <input
              name="buffer"
              inputMode="decimal"
              defaultValue={(plan.buffer / 100).toFixed(2)}
            />
          </label>
        </div>
        <label className="inline-check">
          <input
            type="checkbox"
            name="carryPositive"
            defaultChecked={plan.carryPositive}
          />
          Carry unused discretionary money forward
        </label>
        <p className="hint">
          Overspending always reduces future discretionary allowances. Refunds
          restore the category in the month received.
        </p>
        <details>
          <summary>Bills already paid this month</summary>
          <p className="hint">
            Bank-recorded payments are counted automatically. Confirm payments
            missing from the feed here; they won’t be reserved twice.
          </p>
          <div className="settings-grid">
            {(["rent", "utilities", "insurance"] as const).map((k) => (
              <label key={k}>
                {k[0].toUpperCase() + k.slice(1)} paid (USD)
                <input
                  name={k}
                  inputMode="decimal"
                  defaultValue={(
                    (plan.paidEssentials[month]?.[k] ?? 0) / 100
                  ).toFixed(2)}
                />
                <small>Monthly plan: ${(budget[k] / 100).toFixed(2)}</small>
              </label>
            ))}
          </div>
        </details>
        <button disabled={busy}>{busy ? "Saving…" : "Save reserves"}</button>
        {error ? (
          <p role="alert" className="error">
            {error}
          </p>
        ) : null}
      </form>
    </section>
  );
}
