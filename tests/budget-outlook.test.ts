import { test } from "node:test";
import assert from "node:assert/strict";
import { budgetOutlook } from "../src/lib/budget-outlook";
import { defaultBudget, type Expense } from "../src/lib/budget";
const budget = { ...defaultBudget, discretionary: 20000, groceries: 40000 };
const plan = {
  startMonth: "2026-10",
  through: "2027-03",
  carryPositive: false,
  buffer: 0,
  paidEssentials: {},
};
const expense: Expense = {
  id: "example",
  date: "2026-10-07",
  description: "Household purchase",
  bucket: "discretionary",
  tags: ["household"],
  amount: 85000,
};
test("upcoming shopping budgets repay overspending before showing available money", () => {
  const months = budgetOutlook(
    { "2026-10": budget },
    [expense],
    "2026-10",
    plan,
  );
  assert.deepEqual(
    months.map((m) => m.shopping),
    [-45000, -25000, -5000, 15000, 20000],
  );
  assert.equal(months[0].month, "2026-11");
  assert.equal(months[0].groceries, 40000);
});
test("spreading an existing household purchase redistributes its budget cost, with no double count", () => {
  const rows = budgetOutlook(
    { "2026-10": budget },
    [{ ...expense, spread: { kind: "prepaid", months: 5 } }],
    "2026-10",
    plan,
  );
  assert.deepEqual(
    rows.map((m) => m.shopping),
    [3000, 3000, 3000, 3000, 20000],
  );
  assert.deepEqual(
    budgetOutlook({ "2026-10": budget }, [], "2027-03", plan),
    [],
  );
});
