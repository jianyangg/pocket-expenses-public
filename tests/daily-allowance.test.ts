import { test } from "node:test";
import assert from "node:assert/strict";
import { dailyAllowance } from "../src/lib/daily-allowance";
import { defaultBudget, type Expense } from "../src/lib/budget";
import { moneyFlow } from "../src/lib/money-flow";
const b = {
  ...defaultBudget,
  income: 310000,
  rent: 200000,
  utilities: 10000,
  insurance: 10000,
  depreciation: 10000,
};
const row = (
  amount: number,
  bucket: Expense["bucket"],
  date = "2026-10-08",
): Expense => ({
  id: bucket + date,
  amount,
  bucket,
  date,
  description: "Purchase",
  tags: [],
});
test("daily allowance includes groceries and shopping and stays stable as today is logged", () => {
  const before = dailyAllowance(b, [], "2026-10", "2026-10-08", false);
  const after = dailyAllowance(
    b,
    [row(1000, "groceries"), row(2000, "discretionary")],
    "2026-10",
    "2026-10-08",
    false,
  );
  assert.equal(before.allowance, 3750);
  assert.equal(after.allowance, before.allowance);
  assert.equal(after.spent, 3000);
  assert.equal(after.remaining, 750);
  const over = dailyAllowance(
    b,
    [row(4000, "groceries")],
    "2026-10",
    "2026-10-08",
    false,
  );
  assert.equal(over.remaining, -250);
});
test("insurance reserves are not double counted and setup toggle changes available balance", () => {
  assert.equal(moneyFlow(b, []).starting, 90000);
  assert.equal(moneyFlow(b, [], true).starting, 80000);
  assert.equal(
    moneyFlow(b, [{ ...row(10000, "bill"), description: "Insurance" }])
      .remaining,
    90000,
  );
});

test("explicit insurance tags count against the reserved essential, not discretionary spending", () => {
  assert.equal(
    moneyFlow(b, [{ ...row(10000, "discretionary"), tags: ["insurance"] }])
      .remaining,
    90000,
  );
});
