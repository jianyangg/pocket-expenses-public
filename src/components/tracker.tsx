"use client";
import { useCallback, useRef, useState } from "react";
import { calculatePlan, money } from "@/lib/budget";
import { budgetForMonth, downloadSnapshot } from "@/lib/storage";
import { authClient } from "@/lib/auth/client";
import { useTracker } from "@/lib/use-tracker";
import Login from "./login";
import QuickEntry from "./quick-entry";
import BudgetSettings from "./budget-settings";
import ExpenseList from "./expense-list";
import Analysis from "./analysis";
import ExpenseReview from "./expense-review";
import BankConnection from "./bank-connection";

export default function Tracker() {
  const {
    user,
    authReady,
    snapshot,
    loaded,
    today,
    month,
    setMonth,
    busy,
    error,
    setError,
    notice,
    editing,
    setEditing,
    removed,
    setRemoved,
    reload,
    add,
    updateBudget,
    deleteEntry,
    importFile,
  } = useTracker();
  const [view, setView] = useState<"overview" | "activity" | "review" | "budget">(
    "overview",
  );
  const importInput = useRef<HTMLInputElement>(null);
  const refreshBank = useCallback(() => {
    void reload(true);
  }, [reload]);
  if (!authReady || !today)
    return (
      <main className="loading" role="status">
        Opening Pocket…
      </main>
    );
  if (!user) return <Login />;
  const budget = budgetForMonth(snapshot.budgets, month);
  const plan = calculatePlan(budget, snapshot.expenses, month, today);
  const expenses = snapshot.expenses.filter((e) => e.date.startsWith(month));
  const monthName = new Date(month + "-01T12:00:00").toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" },
  );
  return (
    <main className="shell">
      <header>
        <a className="wordmark" href="/">
          pocket<span> / personal finances</span>
        </a>
        <div className="toolbar">
          <label className="month-picker">
            <span className="sr-only">Month</span>
            <input
              type="month"
              value={month}
              onChange={(e) => {
                if (e.target.value) {
                  setMonth(e.target.value);
                  setEditing(undefined);
                }
              }}
            />
          </label>
        </div>
      </header>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{monthName}</p>
          <h1>Your money</h1>
        </div>
        <span className="currency">USD</span>
      </div>
      {error ? (
        <div className="error panel" role="alert">
          {error}{" "}
          {!loaded ? (
            <button className="quiet" onClick={() => void reload()}>
              Retry loading
            </button>
          ) : null}
        </div>
      ) : null}
      {!loaded ? (
        <p role="status">
          {error
            ? "Data is unavailable. Retry before adding expenses."
            : "Loading your expenses…"}
        </p>
      ) : (
        <>
          <BankConnection onChange={refreshBank} />
          <section className="balances">
            <div className="hero-balance">
              <p>Daily spending</p>
              <strong>{money(plan.todayGuide)}</strong>
              <span>
                {plan.daysLeft
                  ? `${plan.daysLeft} days left`
                  : "This month has ended."}
              </span>
            </div>
            <div className="balance-card">
              <p>Spending left</p>
              <strong
                className={plan.discretionaryRemaining < 0 ? "negative" : ""}
              >
                {money(plan.discretionaryRemaining)}
              </strong>
            </div>
            <div className="balance-card">
              <p>Groceries left</p>
              <strong className={plan.groceriesRemaining < 0 ? "negative" : ""}>
                {money(plan.groceriesRemaining)}
              </strong>
              <span>of {money(budget.groceries)}</span>
            </div>
          </section>
          <div className="invest-strip">
            <span>
              Investing <strong>{money(budget.investing)}</strong> / month
            </span>
          </div>
          {plan.groceriesRemaining < 0 ? (
            <p className="error">
              Groceries are over budget by {money(-plan.groceriesRemaining)}.
              Your daily spending limit includes this shortfall.
            </p>
          ) : null}
          <div role="status" className="notice">
            {notice}
            {removed ? (
              <button
                className="quiet"
                disabled={busy}
                onClick={async () => {
                  if (await add(removed)) setRemoved(undefined);
                }}
              >
                Undo removal
              </button>
            ) : null}
          </div>
          <QuickEntry
            expenses={snapshot.expenses}
            key={editing?.id ?? "new"}
            onSave={add}
            busy={busy}
            editing={editing}
            onCancel={editing ? () => setEditing(undefined) : undefined}
          />
          <nav className="dashboard-tabs" aria-label="Dashboard sections">
            {(["overview", "activity", "review", "budget"] as const).map((tab) => (
              <button
                key={tab}
                aria-pressed={view === tab}
                onClick={() => setView(tab)}
              >
                {tab === "overview"
                  ? "Overview"
                  : tab === "activity"
                    ? "Expenses"
                    : tab === "review" ? "Categorize" : "Budget"}
              </button>
            ))}
          </nav>
          {view === "overview" ? (
            <Analysis expenses={expenses} budget={budget} />
          ) : null}
          {view === "review" ? <ExpenseReview expenses={snapshot.expenses} today={today} busy={busy} onSave={add} /> : null}
          <div className="content-grid">
            {view === "activity" ? (
              <ExpenseList
                expenses={expenses}
                busy={busy}
                onEdit={(e) => {
                  setEditing(e);
                }}
                onDelete={(e) => void deleteEntry(e)}
              />
            ) : null}
            {view === "budget" ? (
              <div className="sidebar">
                <BudgetSettings
                  initiallyOpen
                  budget={budget}
                  month={month}
                  busy={busy}
                  onSave={updateBudget}
                />
                <details className="panel">
                  <summary>How the numbers work</summary>
                  <dl className="math">
                    <dt>Income</dt>
                    <dd>{money(budget.income)}</dd>
                    <dt>Bills & transit reserved</dt>
                    <dd>−{money(plan.fixed)}</dd>
                    <dt>Groceries reserved</dt>
                    <dd>−{money(budget.groceries)}</dd>
                    <dt>Renewal & refill savings</dt>
                    <dd>−{money(plan.setAsides)}</dd>
                    <dt>Depreciation deduction</dt>
                    <dd>−{money(budget.depreciation)}</dd>
                    <dt>Investing target</dt>
                    <dd>−{money(budget.investing)}</dd>
                    <dt>Discretionary budget</dt>
                    <dd>{money(plan.discretionaryBudget)}</dd>
                    <dt>Discretionary spent</dt>
                    <dd>−{money(plan.discretionarySpent)}</dd>
                    <dt>Spending money left</dt>
                    <dd>{money(plan.discretionaryRemaining)}</dd>
                  </dl>
                  <p className="hint">
                    Planned income, not your bank balance. Enter all purchases
                    for an accurate guide. Grocery overspending is shown
                    separately. Depreciation is a noncash deduction you can
                    change or set to zero.
                  </p>
                </details>
              </div>
            ) : null}
          </div>
          {view === "budget" ? (
            <footer>
              <div>
                <button
                  className="quiet"
                  disabled={busy}
                  onClick={() => {
                    const raw = localStorage.getItem("pocket-expenses-v1");
                    if (!raw) {
                      setError("No previous browser entries found.");
                      return;
                    }
                    void importFile(
                      new File([raw], "browser-entries.json", {
                        type: "application/json",
                      }),
                    );
                  }}
                >
                  Import browser entries
                </button>
                {user ? (
                  <button
                    className="quiet"
                    disabled={busy}
                    onClick={async () => {
                      const { error } = await authClient.signOut();
                      if (error)
                        setError(error.message ?? "Could not sign out.");
                    }}
                  >
                    Sign out
                  </button>
                ) : (
                  <span className="mode">Local only</span>
                )}

                <button
                  className="quiet"
                  onClick={() => downloadSnapshot(snapshot)}
                >
                  Export for analysis
                </button>
                <button
                  className="quiet"
                  disabled={busy}
                  onClick={() => importInput.current?.click()}
                >
                  Import backup
                </button>
                <input
                  ref={importInput}
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  aria-label="Import Pocket export"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void importFile(f);
                    e.target.value = "";
                  }}
                />
              </div>
            </footer>
          ) : null}
        </>
      )}
    </main>
  );
}
