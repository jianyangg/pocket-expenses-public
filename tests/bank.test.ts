import { test } from "node:test";
import assert from "node:assert/strict";
import { seal, unseal } from "../src/lib/bank/crypto";
import { toExpense, findDuplicate } from "../src/lib/bank/transactions";
import type { BankTransaction } from "../src/lib/bank/types";
const txn = (overrides: Partial<BankTransaction> = {}): BankTransaction => ({
  transaction_id: "test-id",
  account_id: "account",
  amount: 12.5,
  name: "Cafe",
  date: "2026-10-07",
  pending: false,
  ...overrides,
});
test("bank secrets are encrypted and reject tampering and a different key", () => {
  const encrypted = seal("private-token", "test-secret");
  assert.ok(!encrypted.includes("private-token"));
  assert.equal(unseal(encrypted, "test-secret"), "private-token");
  assert.throws(() => unseal(encrypted, "different-secret"));
  assert.throws(() => unseal(encrypted.slice(0, -3) + "abc", "test-secret"));
});
test("bank imports preserve cents, classify groceries and skip income and transfers", () => {
  assert.equal(toExpense(txn())?.amount, 1250);
  assert.equal(
    toExpense(
      txn({
        personal_finance_category: {
          primary: "FOOD_AND_DRINK",
          detailed: "FOOD_AND_DRINK_GROCERIES",
        },
      }),
    )?.bucket,
    "groceries",
  );
  assert.equal(
    toExpense(
      txn({
        personal_finance_category: {
          primary: "TRANSFER_OUT",
          detailed: "TRANSFER_OUT_ACCOUNT_TRANSFER",
        },
      }),
    ),
    null,
  );
  assert.equal(
    toExpense(
      txn({
        amount: -300,
        personal_finance_category: {
          primary: "INCOME",
          detailed: "INCOME_WAGES",
        },
      }),
    ),
    null,
  );
  assert.equal(toExpense(txn({ amount: -12.5 }))?.amount, -1250);
  assert.equal(toExpense(txn({ amount: 0 })), null);
});
test("ambiguous manual duplicates need review; a merchant match can reuse an entry", () => {
  const existing = {
    id: "manual",
    amount: 1250,
    description: "Cafe lunch",
    tags: ["food"],
    bucket: "discretionary" as const,
    date: "2026-10-07",
  };
  assert.deepEqual(findDuplicate(txn(), [existing]), {
    kind: "match",
    id: "manual",
  });
  assert.equal(
    findDuplicate(txn({ name: "Different merchant" }), [existing]).kind,
    "review",
  );
  assert.equal(findDuplicate(txn({ amount: 18 }), [existing]).kind, "new");
  assert.equal(
    findDuplicate(txn(), [existing, { ...existing, id: "other" }]).kind,
    "review",
  );
});
