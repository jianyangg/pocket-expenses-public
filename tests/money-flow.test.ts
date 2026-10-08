import { test } from "node:test";
import assert from "node:assert/strict";
import { moneyFlow } from "../src/lib/money-flow";
import { defaultBudget, type Expense } from "../src/lib/budget";
const b = {
  ...defaultBudget,
  income: 300000,
  rent: 150000,
  utilities: 10000,
  depreciation: 10000,
  subscriptions: 2000,
  transit: 8000,
  groceries: 40000,
  investing: 30000,
};
const row = (
  amount: number,
  bucket: Expense["bucket"],
  description = "Purchase",
  tags: string[] = [],
): Expense => ({
  id: "test",
  date: "2026-10-08",
  amount,
  bucket,
  description,
  tags,
});
test("only rent utilities and setup depreciation reduce starting balance; optional targets do not", () => {
  const p = moneyFlow(b, []);
  assert.equal(p.starting, 140000);
  assert.equal(p.remaining, 140000);
});
test("actual groceries wants and investments reduce one balance, refunds restore it, rent is not double counted", () => {
  const p = moneyFlow(b, [
    row(150000, "bill", "Rent"),
    row(2000, "bill", "MTA subway"),
    row(3000, "groceries"),
    row(1200, "discretionary"),
    row(-200, "discretionary"),
    row(10000, "investment"),
    row(40000, "fixed"),
  ]);
  assert.equal(p.remaining, 124000);
  assert.equal(p.wants, 3000);
  assert.equal(p.groceries, 3000);
});
