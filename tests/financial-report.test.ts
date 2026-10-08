import { test } from "node:test";
import assert from "node:assert/strict";
import { financialReport } from "../src/lib/financial-report";
import { defaultBudget } from "../src/lib/budget";
import {
  defaultStatementInputs,
  financialStatements,
} from "../src/lib/statements";
test("formal reports reconcile profit, cash and assets without expensing investments", () => {
  const b = {
    ...defaultBudget,
    income: 10000,
    rent: 2000,
    utilities: 1000,
    insurance: 500,
    depreciation: 1000,
  };
  const i = {
    ...defaultStatementInputs,
    openingCash: 50000,
    openingDeferred: 20000,
    earnedFromAdvance: 10000,
    setupCost: 9000,
  };
  const rows = [
    {
      id: "g",
      date: "2026-10-08",
      description: "Groceries",
      tags: [],
      bucket: "groceries" as const,
      amount: 800,
    },
    {
      id: "i",
      date: "2026-10-08",
      description: "Investment",
      tags: [],
      bucket: "investment" as const,
      amount: 4000,
    },
  ];
  const p = financialStatements(b, rows, i);
  assert.equal(
    financialReport("profit", b, rows, i).at(-1)?.value,
    p.netIncome,
  );
  assert.equal(
    financialReport("cash", b, rows, i).at(-1)?.value,
    p.closingCash,
  );
  assert.equal(financialReport("position", b, rows, i).at(-1)?.value, p.assets);
  assert.equal(p.check, 0);
  const expenses = financialReport("profit", b, rows, i)
    .filter((r) => r.kind === "account" && r.value !== undefined && r.value < 0)
    .reduce((n, r) => n + (r.value ?? 0), 0);
  assert.equal(expenses, -(p.spending + p.accrualAdjustment + p.depreciation));
});
