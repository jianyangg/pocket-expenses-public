"use client";
import { useState } from "react";
import type { Budget, Expense } from "@/lib/budget";
import {
  financialReport,
  reportNames,
  type ReportView,
} from "@/lib/financial-report";
import { financialStatements } from "@/lib/statements";
import { inputsForMonth, type FinancialSettings } from "@/lib/use-financial";
import StatementAssumptions from "./statement-assumptions";
const tabs = {
  profit: "Profit or loss",
  cash: "Cash flows",
  position: "Financial position",
} as const;
function statementAmount(value: number) {
  const n = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value) / 100);
  return value < 0 ? `(${n})` : n;
}
export default function FinancialStatements({
  budget,
  expenses,
  month,
  today,
  settings,
  onSave,
}: {
  budget: Budget;
  expenses: Expense[];
  month: string;
  today: string;
  settings: FinancialSettings;
  onSave: (s: FinancialSettings) => Promise<boolean>;
}) {
  const [view, setView] = useState<ReportView>("profit");
  const i = inputsForMonth(settings, month);
  const rows = financialReport(view, budget, expenses, i);
  const p = financialStatements(budget, expenses, i);
  const [year, m] = month.split("-").map(Number);
  const end = new Date(Date.UTC(year, m, 0));
  const current = today.startsWith(month);
  const date = current ? new Date(today + "T12:00:00Z") : end;
  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  return (
    <section className="panel financial-report">
      <nav className="report-tabs" aria-label="Financial statements">
        {(Object.keys(tabs) as ReportView[]).map((key) => (
          <button
            key={key}
            aria-pressed={view === key}
            onClick={() => setView(key)}
          >
            {tabs[key]}
          </button>
        ))}
      </nav>
      <table className="report-table">
        <caption>
          <span className="report-entity">Personal financial statements</span>
          <strong>{reportNames[view]}</strong>
          <span>
            {view === "position"
              ? "As at "
              : current
                ? "For the month to "
                : "For the month ended "}
            {dateLabel}
          </span>
        </caption>
        <thead>
          <tr>
            <th scope="col">Account</th>
            <th scope="col">USD</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, index) => (
            <tr key={index} className={"report-" + r.kind}>
              <th scope="row" colSpan={r.value === undefined ? 2 : 1}>
                {r.label}
              </th>
              {r.value !== undefined ? (
                <td>{statementAmount(r.value)}</td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="report-note">
        Based on recorded transactions and opening balances. Essential bills not
        recorded as paid are accrued in this model.
      </p>
      {view === "position" && p.check !== 0 ? (
        <p className="error" role="alert">
          Unreconciled balance: {statementAmount(p.check)} USD. Check opening
          balances and income allocations.
        </p>
      ) : null}
      <StatementAssumptions settings={settings} month={month} onSave={onSave} />
      {!settings.inputs[month] ? (
        <p className="error">
          Enter opening balances for this month before relying on these
          statements.
        </p>
      ) : null}
    </section>
  );
}
