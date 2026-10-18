import { test } from "node:test";
import assert from "node:assert/strict";
import {
  chooseReviewCategory,
  selectedReviewCategory,
} from "../src/lib/review-classification";
import { expenseCategory } from "../src/lib/money-flow";
import type { Expense } from "../src/lib/budget";
const e: Expense = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  amount: 1200,
  date: "2026-10-18",
  description: "Example subscription",
  bucket: "bill",
  tags: ["subscriptions", "custom"],
};
test("one category choice replaces conflicting category tags while retaining personal labels", () => {
  const changed = chooseReviewCategory(e, "utilities");
  assert.equal(selectedReviewCategory(changed), "utilities");
  assert.deepEqual(changed.tags, ["custom", "utilities"]);
  assert.equal(expenseCategory(changed), "essential");
  const shopping = chooseReviewCategory(e, "shopping");
  assert.equal(selectedReviewCategory(shopping), "shopping");
  assert.equal(expenseCategory(shopping), "shopping");
  assert.ok(shopping.tags.includes("custom"));
  assert.ok(!shopping.tags.includes("subscriptions"));
});
