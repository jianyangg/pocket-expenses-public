import { test } from "node:test";
import assert from "node:assert/strict";
import { reviewQueue, daysBefore, swipeAction } from "../src/lib/review-queue";
import type { Expense } from "../src/lib/budget";
const expense = (id: string, date: string, tags: string[] = []): Expense => ({
  id,
  date,
  tags,
  amount: 100,
  description: "Test",
  bucket: "discretionary",
});
test("review queue respects inclusive dates, completed IDs, untagged filter and stable newest-first order", () => {
  const rows = [
    expense("a", "2026-10-06"),
    expense("b", "2026-10-08", ["food"]),
    expense("c", "2026-10-07"),
    expense("d", "2026-10-01"),
  ];
  assert.deepEqual(
    reviewQueue(rows, "2026-10-06", "2026-10-08", ["c"]).map((e) => e.id),
    ["b", "a"],
  );
  assert.deepEqual(
    reviewQueue(rows, "2026-10-06", "2026-10-08", [], true).map((e) => e.id),
    ["c", "a"],
  );
  assert.deepEqual(reviewQueue(rows, "2026-10-08", "2026-10-01", []), []);
});
test("date presets cross month boundaries and swipes require deliberate travel", () => {
  assert.equal(daysBefore("2026-03-01", 2), "2026-02-27");
  assert.equal(swipeAction(89), null);
  assert.equal(swipeAction(10, -100), "options");
  assert.equal(swipeAction(0, 100), null);
  assert.equal(swipeAction(100), "discretionary");
  assert.equal(swipeAction(-100), "groceries");
});
