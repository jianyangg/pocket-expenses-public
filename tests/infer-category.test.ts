import { test } from "node:test";
import assert from "node:assert/strict";
import { inferCategory } from "../src/lib/infer-category";
import type { Expense } from "../src/lib/budget";
const e: Expense = {
  id: "new",
  amount: 100,
  date: "2026-10-08",
  description: "Amazon Prime",
  tags: ["shopping"],
  bucket: "discretionary",
};
test("known merchant inference identifies subscriptions and utilities, user reviewed labels take precedence", () => {
  assert.deepEqual(inferCategory(e, []).tags, ["subscriptions"]);
  assert.deepEqual(inferCategory({ ...e, description: "Con Ed" }, []).tags, [
    "utilities",
  ]);
  assert.deepEqual(
    inferCategory(e, [{ ...e, id: "old", reviewed: true, tags: ["mytag"] }])
      .tags,
    ["mytag"],
  );
  assert.deepEqual(inferCategory({ ...e, description: "Unknown" }, []).tags, [
    "shopping",
  ]);
});

test("OMNY and provider-confirmed public transit skip review while reviewed merchant choices win", () => {
  assert.deepEqual(
    inferCategory({ ...e, description: "OMNY fare", tags: [] }, []).tags,
    ["transit"],
  );
  assert.equal(
    inferCategory(
      {
        ...e,
        description: "Regional transit",
        bucket: "bill",
        tags: ["transit"],
      },
      [],
    ).reviewed,
    true,
  );
  assert.deepEqual(
    inferCategory({ ...e, description: "MTA" }, [
      {
        ...e,
        id: "prior",
        description: "MTA",
        reviewed: true,
        bucket: "discretionary",
        tags: ["custom"],
      },
    ]).tags,
    ["custom"],
  );
});
