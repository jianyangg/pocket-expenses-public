import { test } from "node:test";
import assert from "node:assert/strict";
import { dayActivity } from "../src/lib/day-activity";
import { spendingTrend } from "../src/lib/spending-trend";
import { monthlyExpenses } from "../src/lib/expense-allocation";
import type { Expense } from "../src/lib/budget";
const row = (
  id: string,
  amount: number,
  bucket: Expense["bucket"] = "discretionary",
): Expense => ({
  id,
  amount,
  bucket,
  description: id,
  tags: [],
  date: "2026-10-09",
});
test("day detail reconciles exactly to the chart, with refunds and other transactions separated", () => {
  const rows = [
    row("purchase", 4200),
    row("refund", -500),
    row("invest", 90000, "investment"),
    { ...row("rent", 70000, "bill"), tags: ["rent"] },
    { ...row("other-day", 100), date: "2026-10-08" },
  ];
  const day = dayActivity(rows, "2026-10-09");
  assert.equal(day.total, 3700);
  assert.equal(day.refunds, 500);
  assert.equal(day.purchases, 4200);
  assert.deepEqual(
    day.counted.map((e) => e.id),
    ["purchase", "refund"],
  );
  assert.deepEqual(
    day.other.map((e) => e.id),
    ["invest", "rent"],
  );
  assert.equal(
    day.total,
    spendingTrend(
      monthlyExpenses(rows, "2026-10"),
      "2026-10",
      "2026-10-18",
      100000,
    )[8].spent,
  );
  assert.equal(dayActivity(rows, "2026-10-10").total, 0);
});
test("spread portions appear on their budget date and preserve the original purchase for editing", () => {
  const rows = [
    {
      ...row("laundry", 12000),
      spread: { kind: "prepaid" as const, months: 3 },
    },
  ];
  const day = dayActivity(rows, "2026-10-09");
  assert.equal(day.total, 4000);
  assert.equal(day.counted[0].budgetAllocation?.purchaseAmount, 12000);
  assert.equal(day.other.length, 0);
  const next = dayActivity(rows, "2026-11-01");
  assert.equal(next.total, 4000);
  assert.equal(next.counted[0].budgetAllocation?.purchaseDate, "2026-10-09");
  assert.equal(rows[0].amount, 12000);
});
