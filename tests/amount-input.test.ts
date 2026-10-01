import { test } from "node:test";
import assert from "node:assert/strict";
import { formatAmountInput } from "../src/lib/amount-input";
test("digits fill from cents and shift left as they are added", () => {
  assert.equal(formatAmountInput("8"), "0.08");
  assert.equal(formatAmountInput("80"), "0.80");
  assert.equal(formatAmountInput("800"), "8.00");
  assert.equal(formatAmountInput("0.080"), "0.80");
  assert.equal(formatAmountInput("0.800"), "8.00");
});
test("backspace shifts right, empty input clears, and leading zeros do not affect value", () => {
  assert.equal(formatAmountInput("8.0"), "0.80");
  assert.equal(formatAmountInput("0.8"), "0.08");
  assert.equal(formatAmountInput(""), "");
  assert.equal(formatAmountInput("000800"), "8.00");
});
