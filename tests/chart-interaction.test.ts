import { test } from "node:test";
import assert from "node:assert/strict";
import { chartIndex, ringSlice, chartTap } from "../src/lib/chart-interaction";
test("chart selection clamps edges and selects the nearest bar or line day", () => {
  assert.equal(chartIndex(-5, 8, "bar"), 0);
  assert.equal(chartIndex(1.2, 8, "line"), 7);
  assert.equal(chartIndex(0.5, 8, "bar"), 4);
  assert.equal(chartIndex(0.5, 9, "line"), 4);
  assert.equal(chartIndex(0.9, 1, "line"), 0);
});
test("ring selection follows clockwise slices and ignores the hole and outside", () => {
  const values = [25, 75];
  assert.equal(ringSlice(0, -0.9, values), 0);
  assert.equal(ringSlice(0.9, 0, values), 1);
  assert.equal(ringSlice(0, 0, values), null);
  assert.equal(ringSlice(2, 0, values), null);
  assert.equal(ringSlice(0, -0.9, [0, 0]), null);
});

test("chart taps open a day but scrolling or dragging does not", () => {
  assert.equal(chartTap({ x: 10, y: 20 }, { x: 12, y: 23 }), true);
  assert.equal(chartTap({ x: 10, y: 20 }, { x: 10, y: 50 }), false);
  assert.equal(chartTap({ x: 10, y: 20 }, { x: 50, y: 20 }), false);
});
