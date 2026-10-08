import { test } from "node:test";
import assert from "node:assert/strict";
import { scheduleLedger } from "../src/lib/expense-schedule";
import {
  financialStatements,
  defaultStatementInputs,
} from "../src/lib/statements";
import { defaultBudget, type Expense } from "../src/lib/budget";
import { validateSnapshot } from "../src/lib/storage";
const e: Expense = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  date: "2026-10-08",
  description: "Prepaid laundry",
  tags: ["laundry"],
  bucket: "discretionary",
  amount: 10000,
  spread: { kind: "prepaid", months: 5 },
};
test("prepaid purchase costs cash once and recognizes twenty per month with an asset balance", () => {
  const b = {
    ...defaultBudget,
    income: 0,
    rent: 0,
    utilities: 0,
    insurance: 0,
    depreciation: 0,
  };
  const i = { ...defaultStatementInputs, openingCash: 50000 };
  const p = financialStatements(b, [e], i, "2026-10");
  assert.equal(p.cashMovement, -10000);
  assert.equal(p.netIncome, -2000);
  assert.equal(p.prepaidBalance, 8000);
  assert.equal(p.check, 0);
  const next = financialStatements(
    b,
    [e],
    { ...i, openingCash: 40000 },
    "2026-11",
  );
  assert.equal(next.cashMovement, 0);
  assert.equal(next.netIncome, -2000);
  assert.equal(next.prepaidBalance, 6000);
  assert.equal(next.check, 0);
  assert.equal(scheduleLedger([e], "2027-03").prepaidBalance, 0);
});
test("asset purchases are investing cash flows and depreciation, with exact cents across a year boundary", () => {
  const asset = {
    ...e,
    amount: 10001,
    date: "2026-12-08",
    spread: { kind: "asset" as const, months: 3 },
  };
  const ledger = ["2026-12", "2027-01", "2027-02"].map((m) =>
    scheduleLedger([asset], m),
  );
  assert.equal(
    ledger.reduce((n, p) => n + p.assetExpense, 0),
    10001,
  );
  assert.equal(ledger[2].assetBalance, 0);
  const p = financialStatements(
    {
      ...defaultBudget,
      income: 0,
      rent: 0,
      utilities: 0,
      insurance: 0,
      depreciation: 0,
    },
    [asset],
    { ...defaultStatementInputs, openingCash: 50000 },
    "2026-12",
  );
  assert.equal(p.setupPurchases, 10001);
  assert.equal(p.spending, 0);
  assert.equal(p.depreciation, 3333);
  assert.equal(p.check, 0);
});
test("invalid schedules and refunds cannot be spread", () => {
  for (const spread of [
    { kind: "wrong", months: 5 },
    { kind: "prepaid", months: 0 },
    { kind: "asset", months: 1.5 },
    { kind: "prepaid", months: 601 },
  ])
    assert.throws(() =>
      validateSnapshot({
        version: 1,
        expenses: [{ ...e, spread }],
        budgets: {},
      }),
    );
  assert.throws(() =>
    validateSnapshot({
      version: 1,
      expenses: [{ ...e, amount: -10000 }],
      budgets: {},
    }),
  );
});

import { moneyFlow } from "../src/lib/money-flow";
import { financialReport } from "../src/lib/financial-report";
test("scheduled fixed purchases deduct cash once and statement categories reconcile recognition", () => {
  const asset = {
    ...e,
    bucket: "fixed" as const,
    spread: { kind: "asset" as const, months: 5 },
  };
  const b = {
    ...defaultBudget,
    income: 50000,
    rent: 0,
    utilities: 0,
    insurance: 0,
    depreciation: 0,
  };
  assert.equal(moneyFlow(b, [asset]).remaining, 40000);
  const i = {
    ...defaultStatementInputs,
    openingCash: 50000,
    cashReceived: 50000,
  };
  const report = financialReport("profit", b, [e, asset], i, "2026-10");
  assert.equal(
    report.find((r) => r.label === "Shopping and dining")?.value,
    -2000,
  );
  assert.equal(
    report.find((r) => r.label === "Depreciation of setup assets")?.value,
    -2000,
  );
  assert.equal(report.at(-1)?.value, 46000);
});
