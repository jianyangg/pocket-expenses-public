import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeTags, suggestedTags } from "../src/lib/entry-tags";
test("tag entry accepts hashes, commas and spaces without duplicating tags", () => {
  assert.deepEqual(normalizeTags("#Food, clothes food #shopping"), [
    "food",
    "clothes",
    "shopping",
  ]);
});
test("suggestions match a partial tag and omit already chosen tags", () => {
  assert.deepEqual(
    suggestedTags(["food", "clothes", "food", "household"], "#o", ["food"]),
    ["clothes", "household"],
  );
});
