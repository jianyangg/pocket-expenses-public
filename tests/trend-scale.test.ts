import { test } from "node:test";
import assert from "node:assert/strict";
import { trendScale } from "../src/lib/trend-scale";
test("zero is inside the graph and negative balances appear beneath it", () => {
  const scale = trendScale([50000, 0, -20000]);
  assert.ok(scale.y(50000) < scale.zero);
  assert.ok(scale.y(-20000) > scale.zero);
  assert.ok(scale.zero > 20 && scale.zero < 120);
});
test("zero remains visible with positive-only, negative-only and empty data", () => {
  for (const values of [[100, 200], [-200, -100], [0], []]) {
    const scale = trendScale(values);
    assert.ok(Number.isFinite(scale.zero));
    assert.ok(scale.zero >= 20 && scale.zero <= 120);
  }
});
