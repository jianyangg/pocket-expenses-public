import { test } from "node:test";
import assert from "node:assert/strict";
import { budgetForMonth, validateSnapshot } from "../src/lib/storage";
import { defaultBudget } from "../src/lib/budget";
const e = {
  id: "12345678-1234-1234-1234-123456789abc",
  amount: 1200,
  description: "lunch",
  tags: ["food"],
  bucket: "discretionary",
  date: "2026-10-01",
};
test("import accepts valid exports and rejects invalid data before writing", () => {
  assert.equal(
    validateSnapshot({
      version: 1,
      expenses: [e],
      budgets: { "2026-10": defaultBudget },
    }).expenses.length,
    1,
  );
  for (const item of [
    { ...e, date: "2026-02-30" },
    { ...e, amount: 0 },
    { ...e, bucket: "invalid" },
    { ...e, amount: 1.25 },
  ])
    assert.throws(() =>
      validateSnapshot({ version: 1, expenses: [item], budgets: {} }),
    );
  assert.throws(() =>
    validateSnapshot({ version: 1, expenses: [e, e], budgets: {} }),
  );
  assert.throws(() =>
    validateSnapshot({ version: 1, expenses: [], budgets: { "2026-10": {} } }),
  );
});
test("plans inherit the nearest earlier month, not a future plan", () => {
  const earlier = { ...defaultBudget, investing: 60000 };
  const later = { ...defaultBudget, investing: 70000 };
  assert.equal(
    budgetForMonth({ "2026-09": earlier, "2026-12": later }, "2026-10")
      .investing,
    60000,
  );
  assert.equal(
    budgetForMonth({ "2026-12": later }, "2026-10").investing,
    0,
  );
  assert.equal(
    budgetForMonth({ "2026-09": earlier, "2026-12": later }, "2026-12")
      .investing,
    70000,
  );
});
