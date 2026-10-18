"use client";
import { useCallback, useRef, useState } from "react";
import { budgetForMonth } from "@/lib/storage";
import { authClient } from "@/lib/auth/client";
import { useTracker } from "@/lib/use-tracker";
import Login from "./login";
import QuickEntry, { type QuickEntryHandle } from "./quick-entry";
import BudgetSettings from "./budget-settings";
import ExpenseList from "./expense-list";
import ExpenseReview from "./expense-review";
import ActionStrip from "./action-strip";
import BankMatchInbox from "./bank-match-inbox";
import CashForecast from "./cash-forecast";
import WeeklyInsights from "./weekly-insights";
import SpendingPlanSettings from "./spending-plan-settings";
import { useCash } from "@/lib/use-cash";
import { needsReview } from "@/lib/review-queue";
import { envelopesForMonth, type SpendingPlan } from "@/lib/spending-plan";
import MonthlyMoney from "./monthly-money";
import InterfaceIcon from "./interface-icon";
import SpendingTrends from "./spending-trends";
import { moneyFlow } from "@/lib/money-flow";
import FinancialStatements from "./financial-statements";
import { useFinancial } from "@/lib/use-financial";
import MoneySettings from "./money-settings";
import TrackerTools from "./tracker-tools";

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
  const cash = useCash(Boolean(user));
  const quickEntry = useRef<QuickEntryHandle>(null);
  const [showMoneySettings, setShowMoneySettings] = useState(false);
  const [view, setView] = useState<
    "overview" | "activity" | "review" | "statements" | "budget"
  >("overview");
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
  const planning: SpendingPlan = finance.settings.spendingPlan ?? {
    startMonth:
      finance.settings.investmentPlan?.asOf.slice(0, 7) ?? today.slice(0, 7),
    through: finance.settings.investmentPlan?.through ?? today.slice(0, 7),
    buffer: finance.settings.investmentPlan?.buffer ?? 0,
    carryPositive: false,
    paidEssentials: {},
  };
  const envelopes = envelopesForMonth(
    snapshot.budgets,
    snapshot.expenses,
    month,
    planning,
  );
  const bankReviews = snapshot.bankReviews ?? [];
  const reviewCount =
    bankReviews.length + snapshot.expenses.filter(needsReview).length;
  async function resolve(body: Record<string, unknown>) {
    try {
      const r = await fetch("/api/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const error = await r.json();
        throw Error(error.error);
      }
      await reload(true);
      void cash.refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save this decision");
      return false;
    }
  }

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
            ref={quickEntry}
            expenses={snapshot.expenses}
            key={editing?.id ?? "new"}
            onSave={add}
            busy={busy}
            editing={editing}
            onCancel={editing ? () => setEditing(undefined) : undefined}
          />
          <nav className="dashboard-tabs" aria-label="Dashboard sections">
            {(["overview", "review", "activity", "budget"] as const).map(
              (tab) => (
                <button
                  key={tab}
                  aria-pressed={view === tab}
                  onClick={() => setView(tab)}
                >
                  <InterfaceIcon name={tab} />
                  {tab === "overview"
                    ? "Today"
                    : tab === "activity"
                      ? "Activity"
                      : tab === "review"
                        ? "Review"
                        : "Plan"}
                </button>
              ),
            )}
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
                envelopes={envelopes}
                onPlan={() => setView("budget")}
                includeSetup={finance.settings.includeSetup}
                month={month}
                today={today}
              >
                <ActionStrip
                  count={reviewCount}
                  onReview={() => setView("review")}
                  onInvest={() => quickEntry.current?.open("investment")}
                  onRefund={() => quickEntry.current?.open("refund")}
                />
                {bankReviews.length ? (
                  <p className="review-warning">
                    Spending totals are provisional until possible duplicates
                    are resolved.
                  </p>
                ) : null}
                {finance.ready ? (
                  <CashForecast
                    budgets={snapshot.budgets}
                    expenses={snapshot.expenses}
                    plan={planning}
                    cash={cash.cash}
                    loading={cash.loading}
                    error={cash.error}
                    today={today}
                    duplicateCount={bankReviews.length}
                    busy={busy}
                    onEdit={setEditing}
                    onConfirmPaid={(e) => void add({ ...e, settled: true })}
                    onRefresh={() => void cash.refresh()}
                    onPlan={() => setView("budget")}
                  />
                ) : null}
              </MonthlyMoney>
              <WeeklyInsights
                expenses={snapshot.expenses}
                today={today}
                onEdit={setEditing}
              />
              <SpendingTrends
                expenses={expenses.filter((e) => e.bucket !== "investment")}
                month={month}
                today={today}
                starting={
                  budget.groceries +
                  budget.discretionary +
                  budget.subscriptions +
                  budget.transit +
                  budget.refills +
                  budget.renewals +
                  envelopes.carry
                }
              />
            </>
          ) : null}
          {view === "review" ? (
            <>
              <BankMatchInbox reviews={bankReviews} onResolve={resolve} />
              <ExpenseReview
                expenses={snapshot.expenses}
                today={today}
                busy={busy}
                onSave={add}
              />
            </>
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
                onUndoMatch={(id) =>
                  void resolve({ action: "undo", expenseId: id })
                }
              />
            ) : null}
            {view === "budget" ? (
              <div className="sidebar">
                <SpendingPlanSettings
                  settings={finance.settings}
                  plan={planning}
                  budget={budget}
                  month={month}
                  onSave={finance.save}
                />
                <button className="quiet" onClick={() => setView("statements")}>
                  View financial statements
                </button>
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
            <TrackerTools
              snapshot={snapshot}
              busy={busy}
              importFile={importFile}
              setError={setError}
            />
          ) : null}
        </>
      )}
    </main>
  );
}
