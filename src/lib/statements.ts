import type { Budget, Expense } from "./budget";
import { expenseCategory } from "./money-flow";
export const defaultStatementInputs = {
  openingCash: 0,
  openingInvestments: 0,
  openingDebt: 0,
  openingDeferred: 0,
  setupCost: 0,
  openingDepreciation: 0,
  cashReceived: 0,
  earnedFromAdvance: 0,
};
export type StatementInputs = typeof defaultStatementInputs;
export function financialStatements(
  b: Budget,
  rows: Expense[],
  i: StatementInputs,
) {
  const spending = rows
    .filter((e) => !["investment", "fixed"].includes(e.bucket))
    .reduce((n, e) => n + e.amount, 0);
  const investments = rows
    .filter((e) => e.bucket === "investment")
    .reduce((n, e) => n + e.amount, 0);
  const setupPurchases = rows
    .filter((e) => e.bucket === "fixed")
    .reduce((n, e) => n + e.amount, 0);
  const rentPaid = rows
    .filter(
      (e) =>
        expenseCategory(e) === "essential" &&
        /\brent\b/i.test(e.description + " " + e.tags.join(" ")),
    )
    .reduce((n, e) => n + e.amount, 0);
  const utilitiesPaid = rows
    .filter(
      (e) =>
        expenseCategory(e) === "essential" &&
        !/\brent\b/i.test(e.description + " " + e.tags.join(" ")),
    )
    .reduce((n, e) => n + e.amount, 0);
  const accrualAdjustment =
    Math.max(0, b.rent - rentPaid) + Math.max(0, b.utilities - utilitiesPaid);
  const depreciation = Math.min(
    b.depreciation,
    Math.max(0, i.setupCost - i.openingDepreciation + setupPurchases),
  );
  const netIncome = b.income - spending - accrualAdjustment - depreciation;
  const cashMovement = i.cashReceived - spending - investments - setupPurchases;
  const closingCash = i.openingCash + cashMovement;
  const closingInvestments = i.openingInvestments + investments;
  const netSetup = Math.max(
    0,
    i.setupCost + setupPurchases - i.openingDepreciation - depreciation,
  );
  const closingDeferred = Math.max(
    0,
    i.openingDeferred - Math.min(i.earnedFromAdvance, i.openingDeferred),
  );
  const receivable = Math.max(
    0,
    b.income -
      i.cashReceived -
      Math.min(i.earnedFromAdvance, i.openingDeferred),
  );
  const liabilities = i.openingDebt + closingDeferred + accrualAdjustment;
  const assets = closingCash + closingInvestments + netSetup + receivable;
  const openingEquity =
    i.openingCash +
    i.openingInvestments +
    Math.max(0, i.setupCost - i.openingDepreciation) -
    i.openingDebt -
    i.openingDeferred;
  const equity = openingEquity + netIncome;
  return {
    spending,
    investments,
    setupPurchases,
    rentPaid,
    utilitiesPaid,
    accrualAdjustment,
    depreciation,
    netIncome,
    cashMovement,
    closingCash,
    closingInvestments,
    netSetup,
    closingDeferred,
    receivable,
    liabilities,
    assets,
    openingEquity,
    equity,
    check: assets - liabilities - equity,
    earnings: b.income,
  };
}
