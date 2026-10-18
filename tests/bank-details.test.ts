import { test } from "node:test";
import assert from "node:assert/strict";
import {
  transactionDetails,
  withBankDetails,
} from "../src/lib/bank/transaction-details";
import type { BankTransaction } from "../src/lib/bank/types";
const transaction: BankTransaction = {
  transaction_id: "private-transaction-id",
  account_id: "private-account-id",
  name: "POS DEBIT EXAMPLE MARKET",
  merchant_name: "Example Market",
  amount: 42.75,
  date: "2026-10-17",
  authorized_date: "2026-10-15",
  pending: false,
  original_description: "EXAMPLE MARKET REF 123",
  payment_channel: "online",
  personal_finance_category: {
    primary: "GENERAL_MERCHANDISE",
    detailed: "GENERAL_MERCHANDISE_ONLINE_MARKETPLACES",
  },
  location: { city: "Seattle", region: "WA", country: "US" },
  website: "example.com",
  payment_meta: { payment_method: "debit card", reference_number: "123" },
};
test("bank clues retain full descriptions, purchase versus posting dates, and supplied context", () => {
  const details = transactionDetails(transaction)!;
  assert.equal(details.description, "POS DEBIT EXAMPLE MARKET");
  assert.equal(details.originalDescription, "EXAMPLE MARKET REF 123");
  assert.equal(details.purchaseDate, "2026-10-15");
  assert.equal(details.postedDate, "2026-10-17");
  assert.equal(details.channel, "Online");
  assert.equal(details.category, "General merchandise · Online marketplaces");
  assert.equal(details.location, "Seattle, WA, US");
  assert.equal(details.reference, "123");
  assert.equal(details.pending, false);
});
test("missing provider details remain absent rather than invented", () => {
  const details = transactionDetails({
    ...transaction,
    authorized_date: null,
    original_description: null,
    location: null,
    website: null,
    payment_meta: null,
    personal_finance_category: null,
    payment_channel: "other",
  })!;
  assert.equal(details.purchaseDate, undefined);
  assert.equal(details.location, undefined);
  assert.equal(details.category, undefined);
  assert.equal(details.channel, undefined);
  assert.equal(transactionDetails(null), undefined);
});
test("the API projection removes the raw provider object and private identifiers", () => {
  const raw = { ...transaction, access_token: "never-expose-this" };
  const projected = withBankDetails({
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    amount: 4275,
    description: "My own label",
    tags: [],
    bucket: "discretionary",
    date: "2026-10-17",
    bankData: raw,
  });
  assert.equal(projected.description, "My own label");
  assert.ok(projected.bankDetails);
  const json = JSON.stringify(projected);
  assert.ok(!json.includes("bankData"));
  assert.ok(!json.includes("private-account-id"));
  assert.ok(!json.includes("private-transaction-id"));
  assert.ok(!json.includes("never-expose-this"));
});
