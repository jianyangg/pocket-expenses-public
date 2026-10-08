import { test } from "node:test";
import assert from "node:assert/strict";
import { quickTagOptions } from "../src/lib/quick-tag-options";
test("quick suggestions are small, prefer merchant history and suppress overlapping shortcuts", () => {
  const result = quickTagOptions(
    ["clothes", "shopping", "food", "dining", "groceries", "chase", "transit"],
    "",
    [],
    ["dining"],
  );
  assert.equal(result[0], "dining");
  assert.ok(result.length <= 4);
  assert.ok(!result.includes("food"));
  assert.ok(!result.includes("chase"));
  assert.ok(!(result.includes("clothes") && result.includes("shopping")));
});
test("search still exposes distinct user labels, normalizes duplicates and excludes selected tags", () => {
  assert.deepEqual(
    quickTagOptions(
      ["Clothes", "clothes", "clothing", "shopping"],
      "clo",
      [],
      [],
    ),
    ["clothes", "clothing"],
  );
  assert.deepEqual(
    quickTagOptions(["food", "dining"], "food", ["food"], []),
    [],
  );
});

test("selected tags suppress overlapping shortcuts while search keeps them available", () => {
  assert.deepEqual(
    quickTagOptions(["food", "dining", "shopping"], "", ["dining"]),
    ["shopping"],
  );
  assert.deepEqual(quickTagOptions(["food", "dining"], "food", ["dining"]), [
    "food",
  ]);
});
