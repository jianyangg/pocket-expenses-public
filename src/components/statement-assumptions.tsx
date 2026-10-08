"use client";
import { useState } from "react";
import type { StatementInputs } from "@/lib/statements";
import { inputsForMonth, type FinancialSettings } from "@/lib/use-financial";
const labels: Record<keyof StatementInputs, string> = {
  openingCash: "Opening cash",
  openingInvestments: "Opening investments",
  openingDebt: "Opening debt",
  openingDeferred: "Income received for future months",
  setupCost: "Setup assets at opening cost",
  openingDepreciation: "Depreciation before this month",
  cashReceived: "Cash income received this month",
  earnedFromAdvance: "Advance income earned this month",
};
export default function StatementAssumptions({
  settings,
  month,
  onSave,
}: {
  settings: FinancialSettings;
  month: string;
  onSave: (s: FinancialSettings) => Promise<boolean>;
}) {
  const [error, setError] = useState("");
  const i = inputsForMonth(settings, month);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const inputs = { ...i };
    for (const key of Object.keys(labels) as (keyof StatementInputs)[]) {
      const raw = String(form.get(key));
      if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
        setError("Enter positive amounts with up to two decimals.");
        return;
      }
      inputs[key] = Math.round(Number(raw) * 100);
    }
    if (inputs.earnedFromAdvance > inputs.openingDeferred) {
      setError("Advance income earned cannot exceed its opening balance.");
      return;
    }
    const ok = await onSave({
      ...settings,
      openingMonth: month,
      inputs: { ...settings.inputs, [month]: inputs },
    });
    setError(ok ? "" : "Could not save assumptions. Please retry.");
  }
  return (
    <details>
      <summary>Opening balances & assumptions</summary>
      <p className="hint">
        Opening values are entered separately for each month. Statements use
        recorded transactions; missing payments are not invented. Investment
        gains, debt movements and bank transfers are not modeled yet.
      </p>
      <form onSubmit={submit} key={month + JSON.stringify(i)}>
        <div className="settings-grid">
          {(Object.keys(labels) as (keyof StatementInputs)[]).map((key) => (
            <label key={key}>
              {labels[key]}
              <input
                name={key}
                inputMode="decimal"
                defaultValue={(i[key] / 100).toFixed(2)}
              />
            </label>
          ))}
        </div>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit">Save assumptions</button>
      </form>
    </details>
  );
}
