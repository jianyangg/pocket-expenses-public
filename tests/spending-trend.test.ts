import { test } from "node:test";
import assert from "node:assert/strict";
import { spendingTrend } from "../src/lib/spending-trend";
import type { Expense } from "../src/lib/budget";
const e = (
  amount: number,
  date: string,
  bucket: Expense["bucket"] = "discretionary",
  description = "Purchase",
): Expense => ({
  id: date + amount,
  amount,
  date,
  bucket,
  description,
  tags: [],
});
test("daily charts reconcile spendable balance and keep investing separate from consumption", () => {
  const points = spendingTrend(
    [
      e(1000, "2026-10-01"),
      e(-200, "2026-10-01"),
      e(2000, "2026-10-02", "investment"),
      e(10000, "2026-10-02", "bill", "Rent"),
      e(5000, "2026-10-02", "fixed"),
    ],
    "2026-10",
    "2026-10-03",
    10000,
  );
  assert.equal(points.length, 3);
  assert.equal(points[0].spent, 800);
  assert.equal(points[1].spent, 0);
  assert.equal(points[2].remaining, 7200);
});
test("past months show every day, future months show no fabricated history", () => {
  assert.equal(spendingTrend([], "2026-09", "2026-10-08", 10000).length, 30);
  assert.equal(spendingTrend([], "2026-11", "2026-10-08", 10000).length, 0);
});
