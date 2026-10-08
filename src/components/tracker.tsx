"use client";
import { useCallback, useRef, useState } from "react";
import { budgetForMonth, downloadSnapshot } from "@/lib/storage";
import { authClient } from "@/lib/auth/client";
import { useTracker } from "@/lib/use-tracker";
import Login from "./login";
import QuickEntry from "./quick-entry";
import BudgetSettings from "./budget-settings";
import ExpenseList from "./expense-list";
import ExpenseReview from "./expense-review";
import MonthlyMoney from "./monthly-money";
import InterfaceIcon from "./interface-icon";
import SpendingTrends from "./spending-trends";
import { moneyFlow } from "@/lib/money-flow";
import FinancialStatements from "./financial-statements";
import { useFinancial } from "@/lib/use-financial";
import MoneySettings from "./money-settings";

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
  const finance = useFinancial(Boolean(user));
  const [showMoneySettings, setShowMoneySettings] = useState(false);
  const [view, setView] = useState<
    "overview" | "activity" | "review" | "statements" | "budget"
  >("overview");
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
          <button
            className="icon-button"
            aria-label="Settings"
            aria-pressed={showMoneySettings}
            onClick={() => setShowMoneySettings((v) => !v)}
          >
            <InterfaceIcon name="settings" />
          </button>
          <label className="month-picker icon-button" title="Choose month">
            <InterfaceIcon name="calendar" />
            <span className="sr-only">Month</span>
            <input
              type="month"
              aria-label={"Choose month, currently " + monthName}
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
          <MoneySettings
            open={showMoneySettings}
            onClose={() => setShowMoneySettings(false)}
            onBankChange={refreshBank}
            settings={finance.settings}
            onSave={finance.save}
            ready={finance.ready}
            error={finance.error}
          />
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
            {(
              [
                "overview",
                "review",
                "activity",
                "statements",
                "budget",
              ] as const
            ).map((tab) => (
              <button
                key={tab}
                aria-pressed={view === tab}
                onClick={() => setView(tab)}
              >
                <InterfaceIcon name={tab} />
                {tab === "overview"
                  ? "Overview"
                  : tab === "activity"
                    ? "Expenses"
                    : tab === "review"
                      ? "Categorize"
                      : tab === "statements"
                        ? "Statements"
                        : "Budget"}
              </button>
            ))}
          </nav>
          {view === "statements" ? (
            <FinancialStatements
              budget={budget}
              expenses={snapshot.expenses}
              month={month}
              today={today}
              settings={finance.settings}
              onSave={finance.save}
            />
          ) : null}
          {view === "overview" ? (
            <>
              <MonthlyMoney
                budget={budget}
                expenses={expenses}
                includeSetup={finance.settings.includeSetup}
                month={month}
                today={today}
              />

              <SpendingTrends
                expenses={expenses}
                month={month}
                today={today}
                starting={
                  moneyFlow(budget, expenses, finance.settings.includeSetup)
                    .starting
                }
              />
            </>
          ) : null}

          {view === "review" ? (
            <ExpenseReview
              expenses={snapshot.expenses}
              today={today}
              busy={busy}
              onSave={add}
            />
          ) : null}
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
