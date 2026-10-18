import { test } from "node:test";
import assert from "node:assert/strict";
import { reviewShortcut } from "../src/lib/review-shortcuts";
test("desktop shortcuts map to named review categories and ignore typing, repeats and system shortcuts", () => {
  assert.equal(reviewShortcut("1"), "groceries");
  assert.equal(reviewShortcut("2"), "shopping");
  assert.equal(reviewShortcut("3"), "transit");
  assert.equal(reviewShortcut("m"), "more");
  assert.equal(reviewShortcut("M"), "more");
  for (const context of [
    { typing: true },
    { modified: true },
    { repeat: true },
    { blocked: true },
  ])
    assert.equal(reviewShortcut("1", context), null);
  assert.equal(reviewShortcut("9"), null);
  assert.equal(reviewShortcut("Enter"), null);
});
