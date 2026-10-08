import { scheduleLedger } from "./expense-schedule";
import type { Budget, Expense } from "./budget";
import { expenseCategory } from "./money-flow";
import { financialStatements, type StatementInputs } from "./statements";
export type ReportView = "profit" | "cash" | "position";
export type ReportRow = {
  label: string;
  value?: number;
  kind: "section" | "account" | "subtotal" | "total";
};
export const reportNames = {
  profit: "Statement of profit or loss",
  cash: "Statement of cash flows",
  position: "Statement of financial position",
};
export function financialReport(
  view: ReportView,
  b: Budget,
  expenses: Expense[],
  i: StatementInputs,
  month?: string,
): ReportRow[] {
  const p = financialStatements(b, expenses, i, month);
  const account = (label: string, value: number): ReportRow => ({
    label,
    value,
    kind: "account",
  });
  const section = (label: string): ReportRow => ({ label, kind: "section" });
  const subtotal = (label: string, value: number): ReportRow => ({
    label,
    value,
    kind: "subtotal",
  });
  const total = (label: string, value: number): ReportRow => ({
    label,
    value,
    kind: "total",
  });
  const recognition = scheduleLedger(
    expenses,
    month ?? expenses[0]?.date.slice(0, 7) ?? "2000-01",
  );
  const recognized = [
    ...expenses.filter(
      (e) => (!month || e.date.startsWith(month)) && !e.spread,
    ),
    ...recognition.recognized,
  ];
  const amount = (category: string) =>
    recognized
      .filter((e) => expenseCategory(e) === category)
      .reduce((n, e) => n + e.amount, 0);
  if (view === "profit")
    return [
      section("Income"),
      account("Salary income earned", p.earnings),
      subtotal("Total income", p.earnings),
      section("Expenses"),
      account("Rent", -Math.max(b.rent, p.rentPaid)),
      account(
        "Utilities and internet",
        -Math.max(b.utilities, p.utilitiesPaid),
      ),
      account("Insurance", -Math.max(b.insurance, p.insurancePaid)),
      account("Groceries", -amount("groceries")),
      account("Shopping and dining", -amount("shopping")),
      account("Subscriptions", -amount("subscriptions")),
      account("Transit", -amount("transit")),
      account("Depreciation of setup assets", -p.depreciation),
      subtotal(
        "Total expenses",
        -p.expenseSpending - p.accrualAdjustment - p.depreciation,
      ),
      total("Profit / (loss) for the period", p.netIncome),
    ];
  if (view === "cash")
    return [
      section("Cash flows from operating activities"),
      account("Income received", i.cashReceived),
      account("Living expenses paid", -p.spending),
      subtotal(
        "Net cash from operating activities",
        i.cashReceived - p.spending,
      ),
      section("Cash flows from investing activities"),
      account("Purchase of investments", -p.investments),
      account("Purchase of setup assets", -p.setupPurchases),
      subtotal(
        "Net cash used in investing activities",
        -p.investments - p.setupPurchases,
      ),
      total("Net increase / (decrease) in cash", p.cashMovement),
      account("Cash at beginning of period", i.openingCash),
      total("Cash at end of period", p.closingCash),
    ];
  return [
    section("Assets"),
    account("Cash and cash equivalents", p.closingCash),
    account("Income receivable", p.receivable),
    account("Prepaid expenses", p.prepaidBalance),
    subtotal(
      "Total current assets",
      p.closingCash + p.receivable + p.prepaidBalance,
    ),
    account("Investments at cost", p.closingInvestments),
    account("Setup assets at cost", p.assetCost),
    account("Less: accumulated depreciation", -p.accumulatedDepreciation),
    subtotal("Setup assets, net", p.netSetup),
    total("Total assets", p.assets),
    section("Liabilities"),
    account("Accrued essential bills", p.accrualAdjustment),
    account("Income received in advance", p.closingDeferred),
    account("Other outstanding debt", i.openingDebt),
    subtotal("Total liabilities", p.liabilities),
    section("Equity"),
    account("Equity at beginning of period", p.openingEquity),
    account("Profit / (loss) for the period", p.netIncome),
    subtotal("Total equity", p.equity),
    total("Total liabilities and equity", p.liabilities + p.equity),
  ];
}
