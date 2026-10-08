import { test } from "node:test";
import assert from "node:assert/strict";
import { bankFreshness } from "../src/lib/bank/freshness";
const config = {
  clientId: "example",
  secret: "example",
  environment: "sandbox" as const,
};
test("bank freshness reports Plaid bank fetch time, rather than Pocket check time", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      Response.json({
        status: {
          transactions: { last_successful_update: "2026-10-08T04:15:29.628Z" },
        },
      });
    assert.equal(
      await bankFreshness(config, "example"),
      "2026-10-08T04:15:29.628Z",
    );
  } finally {
    globalThis.fetch = original;
  }
});
test("missing, invalid or failed bank freshness stays unavailable", async () => {
  const original = globalThis.fetch;
  try {
    for (const body of [
      {},
      { status: { transactions: { last_successful_update: "invalid" } } },
    ]) {
      globalThis.fetch = async () => Response.json(body);
      assert.equal(await bankFreshness(config, "example"), null);
    }
    globalThis.fetch = async () => {
      throw new Error("Offline");
    };
    assert.equal(await bankFreshness(config, "example"), null);
  } finally {
    globalThis.fetch = original;
  }
});
