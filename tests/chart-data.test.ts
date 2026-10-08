import { test } from "node:test";
import assert from "node:assert/strict";
import { spendingSlices, budgetSlices } from "../src/lib/chart-data";
import { type Expense } from "../src/lib/budget";
test("chart counts an expense once even with multiple tags and nets refunds", () => {
  const base = {
    description: "Lunch",
    date: "2026-10-01",
    tags: ["food", "dining"],
    bucket: "discretionary" as const,
  };
  const expenses: Expense[] = [
    { ...base, id: "1", amount: 1000 },
    { ...base, id: "2", amount: -200 },
  ];
  assert.deepEqual(spendingSlices(expenses), [
    { label: "Shopping & dining", amount: 800 },
  ]);
});
import { sampleBudget } from "./fixtures";
test("sample budget chart reconciles to monthly income", () => {
  assert.equal(
    budgetSlices(sampleBudget).reduce((n, s) => n + s.amount, 0),
    300000,
  );
});

test("setup is excluded by default and included only when selected", () => {
  const b = {
    ...sampleBudget,
    income: 300000,
    rent: 150000,
    utilities: 10000,
    depreciation: 10000,
  };
  assert.ok(!budgetSlices(b).some((s) => s.label === "Setup depreciation"));
  assert.ok(
    budgetSlices(b, true).some((s) => s.label === "Setup depreciation"),
  );
});
