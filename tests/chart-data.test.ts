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
