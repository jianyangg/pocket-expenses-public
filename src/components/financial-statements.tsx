"use client";
import { useState } from "react";
import { money, type Budget, type Expense } from "@/lib/budget";
import { financialStatements, type StatementInputs } from "@/lib/statements";
import type { FinancialSettings } from "@/lib/use-financial";
import { inputsForMonth } from "@/lib/use-financial";
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
export default function FinancialStatements({
  budget,
  expenses,
  month,
  settings,
  onSave,
}: {
  budget: Budget;
  expenses: Expense[];
  month: string;
  settings: FinancialSettings;
  onSave: (s: FinancialSettings) => Promise<boolean>;
}) {
  const [view, setView] = useState<"IS" | "CFS" | "BS">("IS");
  const [error, setError] = useState("");
  const i = inputsForMonth(settings, month);
  const p = financialStatements(budget, expenses, i);
  const rows: { label: string; value: number; total?: boolean }[] =
    view === "IS"
      ? [
          { label: "Earned income", value: p.earnings },
          { label: "Recorded living expenses", value: -p.spending },
          {
            label: "Essential bills accrued but not recorded paid",
            value: -p.accrualAdjustment,
          },
          { label: "Depreciation", value: -p.depreciation },
          { label: "Net income", value: p.netIncome, total: true },
        ]
      : view === "CFS"
        ? [
            { label: "Operating · cash received", value: i.cashReceived },
            { label: "Operating · recorded payments", value: -p.spending },
            {
              label: "Investing · investments purchased",
              value: -p.investments,
            },
            {
              label: "Investing · setup assets purchased",
              value: -p.setupPurchases,
            },
            { label: "Net cash movement", value: p.cashMovement, total: true },
            { label: "Opening cash", value: i.openingCash },
            {
              label: "Closing cash · ledger model",
              value: p.closingCash,
              total: true,
            },
          ]
        : [
            { label: "Cash", value: p.closingCash },
            { label: "Investments at cost", value: p.closingInvestments },
            { label: "Setup assets · net book value", value: p.netSetup },
            {
              label: "Earned income not received/allocated",
              value: p.receivable,
            },
            { label: "Total assets", value: p.assets, total: true },
            { label: "Opening debts", value: i.openingDebt },
            {
              label: "Unpaid essential bills · model",
              value: p.accrualAdjustment,
            },
            {
              label: "Advance income not yet earned",
              value: p.closingDeferred,
            },
            { label: "Total liabilities", value: p.liabilities, total: true },
            { label: "Opening equity", value: p.openingEquity },
            { label: "Current month net income", value: p.netIncome },
            { label: "Closing equity", value: p.equity, total: true },
          ];
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
    <section className="panel statements">
      <div className="section-head">
        <h2>Financial statements</h2>
        <span>Monthly model</span>
      </div>
      <nav className="statement-tabs" aria-label="Statement">
        {(["IS", "CFS", "BS"] as const).map((s) => (
          <button key={s} aria-pressed={view === s} onClick={() => setView(s)}>
            {s}
          </button>
        ))}
      </nav>
      <h3>
        {view === "IS"
          ? "Income statement"
          : view === "CFS"
            ? "Cash flow statement"
            : "Balance sheet"}
      </h3>
      <p className="hint">
        {view === "IS"
          ? "Earned income and expenses. Depreciation reduces profit."
          : view === "CFS"
            ? "Recorded cash movements. Advance income is not received again; depreciation is not cash."
            : "Assets = liabilities + equity. Unpaid obligations and unearned advance income stay separate."}
      </p>
      {rows.map((r, index) => (
        <div
          key={index}
          className={"statement-row " + (r.total ? "statement-total" : "")}
        >
          <span>{r.label}</span>
          <strong>{money(r.value)}</strong>
        </div>
      ))}
      {view === "BS" ? (
        <p role="status" className="hint">
          Balance check: {money(p.check)}
        </p>
      ) : null}
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
      {!settings.inputs[month] ? (
        <p className="error">
          Enter opening balances for this month before relying on the
          statements.
        </p>
      ) : null}
    </section>
  );
}
