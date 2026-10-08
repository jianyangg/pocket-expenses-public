import { scheduleLedger } from "./expense-schedule";
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
  month?: string,
) {
  const scheduled = scheduleLedger(
    rows,
    month ?? rows[0]?.date.slice(0, 7) ?? "2000-01",
  );
  rows = rows.filter((e) => (!month || e.date.startsWith(month)) && !e.spread);
  const spending =
    scheduled.prepaidPurchases +
    rows
      .filter((e) => !["investment", "fixed"].includes(e.bucket))
      .reduce((n, e) => n + e.amount, 0);
  const investments = rows
    .filter((e) => e.bucket === "investment")
    .reduce((n, e) => n + e.amount, 0);
  const setupPurchases =
    scheduled.assetPurchases +
    rows.filter((e) => e.bucket === "fixed").reduce((n, e) => n + e.amount, 0);
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
        !/\b(rent|insurance)\b/i.test(e.description + " " + e.tags.join(" ")),
    )
    .reduce((n, e) => n + e.amount, 0);
  const insurancePaid = rows
    .filter(
      (e) =>
        expenseCategory(e) === "essential" &&
        /\binsurance\b/i.test(e.description + " " + e.tags.join(" ")),
    )
    .reduce((n, e) => n + e.amount, 0);
  const accrualAdjustment =
    Math.max(0, b.rent - rentPaid) +
    Math.max(0, b.utilities - utilitiesPaid) +
    Math.max(0, b.insurance - insurancePaid);
  const legacyPurchases = setupPurchases - scheduled.assetPurchases;
  const depreciation =
    scheduled.assetExpense +
    Math.min(
      b.depreciation,
      Math.max(0, i.setupCost - i.openingDepreciation + legacyPurchases),
    );
  const expenseSpending =
    spending -
    scheduled.prepaidPurchases +
    scheduled.recognized.reduce((n, e) => n + e.amount, 0);
  const netIncome =
    b.income - expenseSpending - accrualAdjustment - depreciation;
  const cashMovement = i.cashReceived - spending - investments - setupPurchases;
  const closingCash = i.openingCash + cashMovement;
  const closingInvestments = i.openingInvestments + investments;
  const netSetup =
    scheduled.assetBalance +
    Math.max(
      0,
      i.setupCost +
        legacyPurchases -
        i.openingDepreciation -
        (depreciation - scheduled.assetExpense),
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
  const assets =
    closingCash +
    closingInvestments +
    netSetup +
    receivable +
    scheduled.prepaidBalance;
  const openingEquity =
    scheduled.openingPrepaid +
    scheduled.openingAsset +
    i.openingCash +
    i.openingInvestments +
    Math.max(0, i.setupCost - i.openingDepreciation) -
    i.openingDebt -
    i.openingDeferred;
  const equity = openingEquity + netIncome;
  return {
    spending,
    expenseSpending,
    prepaidBalance: scheduled.prepaidBalance,
    assetCost: i.setupCost + legacyPurchases + scheduled.assetCost,
    accumulatedDepreciation:
      i.openingDepreciation +
      depreciation +
      scheduled.assetCost -
      scheduled.assetBalance -
      scheduled.assetExpense,
    investments,
    setupPurchases,
    rentPaid,
    utilitiesPaid,
    insurancePaid,
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
