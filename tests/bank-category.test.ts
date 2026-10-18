import { test } from "node:test";
import assert from "node:assert/strict";
import { toExpense, findDuplicate } from "../src/lib/bank/transactions";
import { inferCategory } from "../src/lib/infer-category";
import type { BankTransaction } from "../src/lib/bank/types";
const txn = (primary: string, detailed: string): BankTransaction => ({
  transaction_id: "synthetic",
  account_id: "synthetic-account",
  amount: 15,
  name: "Example merchant",
  date: "2026-10-07",
  pending: false,
  personal_finance_category: { primary, detailed },
});
test("usable bank categories classify purchases and skip manual review", () => {
  for (const [primary, detailed, bucket, tag] of [
    ["FOOD_AND_DRINK", "FOOD_AND_DRINK_FAST_FOOD", "discretionary", "dining"],
    ["FOOD_AND_DRINK", "FOOD_AND_DRINK_GROCERIES", "groceries", "groceries"],
    ["TRANSPORTATION", "TRANSPORTATION_PUBLIC_TRANSIT", "bill", "transit"],
    ["RENT_AND_UTILITIES", "RENT_AND_UTILITIES_RENT", "bill", "rent"],
    [
      "RENT_AND_UTILITIES",
      "RENT_AND_UTILITIES_GAS_AND_ELECTRICITY",
      "bill",
      "utilities",
    ],
    [
      "GENERAL_MERCHANDISE",
      "GENERAL_MERCHANDISE_SUPERSTORES",
      "discretionary",
      "shopping",
    ],
    [
      "PERSONAL_CARE",
      "PERSONAL_CARE_HAIR_AND_BEAUTY",
      "discretionary",
      "personalcare",
    ],
  ]) {
    const e = toExpense(txn(primary, detailed))!;
    assert.equal(e.bucket, bucket);
    assert.deepEqual(e.tags, [tag]);
    assert.equal(e.reviewed, true);
  }
});
test("missing or unusable bank categories remain available for review", () => {
  for (const category of [
    null,
    { primary: "UNKNOWN", detailed: "UNKNOWN" },
    { primary: "UNCATEGORIZED", detailed: "UNCATEGORIZED" },
  ]) {
    const e = toExpense({
      ...txn("", ""),
      personal_finance_category: category,
    })!;
    assert.notEqual(e.reviewed, true);
  }
});
test("bank classification preserves refunds and does not bypass duplicate confirmation or user rules", () => {
  const t = txn("FOOD_AND_DRINK", "FOOD_AND_DRINK_FAST_FOOD");
  const e = toExpense(t)!;
  const manual = {
    ...e,
    id: "previous",
    reviewed: true,
    bucket: "groceries" as const,
    tags: ["my-label"],
  };
  assert.deepEqual(inferCategory(e, [manual]).tags, ["my-label"]);
  assert.deepEqual(findDuplicate(t, [manual]), { kind: "review" });
  assert.equal(toExpense({ ...t, amount: -15 })?.amount, -1500);
  assert.equal(
    toExpense(txn("TRANSFER_OUT", "TRANSFER_OUT_ACCOUNT_TRANSFER")),
    null,
  );
});
