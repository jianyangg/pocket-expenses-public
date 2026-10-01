import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultBudget, calculatePlan } from "../src/lib/budget";

test("a new installation contains no personal financial defaults", () => {
  assert.ok(Object.values(defaultBudget).every((amount) => amount === 0));
  const plan = calculatePlan(defaultBudget, [], "2026-10", "2026-10-01");
  assert.equal(plan.discretionaryRemaining, 0);
  assert.equal(plan.todayGuide, 0);
});
