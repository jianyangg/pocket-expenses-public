import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculatePlan,
  parseEntry,
  type Expense,
} from "../src/lib/budget";
import { sampleBudget } from "./fixtures";
const expense = (
  amount: number,
  bucket: Expense["bucket"],
  date = "2026-10-01",
): Expense => ({
  id: "1",
  amount,
  description: "Test",
  tags: ["food"],
  bucket,
  date,
});
test("current budget reserves investing without treating depreciation as cash", () => {
  const p = calculatePlan(sampleBudget, [], "2026-10", "2026-10-01");
  assert.equal(p.discretionaryBudget, 46000);
  assert.equal(p.groceriesRemaining, 40000);
});
test("bills and investing entries are not deducted twice; refunds restore budgets", () => {
  const p = calculatePlan(
    sampleBudget,
      [
      expense(1000, "discretionary"),
      expense(-200, "discretionary"),
      expense(150000, "bill"),
      expense(30000, "investment"),
      expense(2000, "groceries"),
      expense(9000, "discretionary", "2026-09-30"),
    ],
    "2026-10",
    "2026-10-01",
  );
  assert.equal(p.discretionaryRemaining, 45200);
  assert.equal(p.groceriesRemaining, 38000);
});
test("daily guide uses remaining calendar days including today, and shows overspending", () => {
  const p = calculatePlan(
    sampleBudget,
      [expense(47000, "discretionary")],
    "2026-10",
    "2026-10-31",
  );
  assert.equal(p.discretionaryRemaining, -1000);
  assert.equal(p.todayGuide, 0);
  assert.equal(p.daysLeft, 1);
});
test("parses cents and multiple unique lowercase hashtags", () => {
  assert.deepEqual(parseEntry("$12.50 lunch #Food #shopping #food"), {
    amount: 1250,
    description: "lunch",
    tags: ["food", "shopping"],
  });
  assert.equal(parseEntry("-5.20 refund #food").amount, -520);
  for (const text of ["12.555 lunch", "0 lunch", "lunch 12", "Infinity food"])
    assert.throws(() => parseEntry(text));
});
test("grocery overspending reduces the daily guide instead of hiding the shortfall", () => {
  const p = calculatePlan(
    sampleBudget,
      [expense(41000, "groceries")],
    "2026-10",
    "2026-10-31",
  );
  assert.equal(p.groceriesRemaining, -1000);
  assert.equal(p.todayGuide, 45000);
});
test("historical months have no today allowance and leap months use the right number of days", () => {
  assert.equal(
    calculatePlan(sampleBudget, [], "2026-09", "2026-10-01").todayGuide,
    0,
  );
  assert.equal(
    calculatePlan(sampleBudget, [], "2028-02", "2028-02-01").daysLeft,
    29,
  );
});

test("past fixed purchases and reserved refills are separate; review spending reduces available money", () => {
  const base = {
    id: "x",
    description: "imported",
    tags: [],
    date: "2026-10-01",
  };
  const plan = calculatePlan(
    sampleBudget,
      [
      { ...base, amount: 10000, bucket: "fixed" },
      { ...base, amount: 5000, bucket: "reserved" },
      { ...base, amount: 1000, bucket: "review" },
    ],
    "2026-10",
    "2026-10-01",
  );
  assert.equal(plan.discretionarySpent, 1000);
  assert.equal(plan.discretionaryRemaining, 45000);
});
