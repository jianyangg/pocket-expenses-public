import { test } from "node:test";
import assert from "node:assert/strict";
import { possibleMatches } from "../src/lib/purchase-matching";
import { envelopesForMonth } from "../src/lib/spending-plan";
import { cashForecast } from "../src/lib/cash-forecast";
import { weeklyInsights } from "../src/lib/spending-insights";
import { defaultBudget, type Expense } from "../src/lib/budget";
const e = (
  id: string,
  amount: number,
  date = "2026-10-08",
  bucket: Expense["bucket"] = "discretionary",
  description = "Purchase",
): Expense => ({ id, amount, date, bucket, description, tags: [] });
const b = {
  ...defaultBudget,
  income: 100000,
  rent: 20000,
  utilities: 5000,
  insurance: 5000,
  groceries: 30000,
  discretionary: 20000,
  subscriptions: 1000,
  transit: 2000,
  refills: 0,
  renewals: 0,
  depreciation: 8000,
  investing: 10000,
};
const plan = {
  startMonth: "2026-10",
  through: "2026-12",
  carryPositive: false,
  buffer: 10000,
  paidEssentials: {},
};
test("rounded manual amounts and late posting produce suggestions; cash and opposite-sign refunds do not", () => {
  const manual = { ...e("m", 10000), source: "manual" as const };
  assert.equal(
    possibleMatches(
      { ...e("b", 9873, "2026-10-15", "groceries", "H MART"), source: "bank" },
      [manual],
    ).length,
    1,
  );
  assert.equal(
    possibleMatches({ ...e("b", -9873), source: "bank" }, [manual]).length,
    0,
  );
  assert.equal(
    possibleMatches({ ...e("b", 9873), source: "bank" }, [
      { ...manual, payment: "cash" },
    ]).length,
    0,
  );
  assert.equal(possibleMatches(e("b", 11000), [manual]).length, 0);
});
test("overspending rolls forward, refunds restore room, and lump investments do not consume spending envelopes", () => {
  const rows = [
    e("a", 25000),
    e("invest", 300000, "2026-10-09", "investment"),
    e("refund", -2000, "2026-11-02"),
  ];
  const p = envelopesForMonth({ "2026-10": b }, rows, "2026-11", plan);
  assert.equal(p.carry, -5000);
  assert.equal(p.discretionaryLeft, 17000);
  assert.equal(p.groceriesLeft, 30000);
  assert.equal(
    envelopesForMonth({ "2026-10": b }, rows, "2026-12", plan).carry,
    0,
  );
});
test("cash reserve uses existing advance cash once, excludes depreciation, and gives no withdrawal figure while duplicates remain", () => {
  const cash = {
    available: 300000,
    checkedAt: "2026-10-08T16:00:00Z",
    accounts: [],
  };
  const result = cashForecast(
    { "2026-10": b },
    [],
    { ...plan, through: "2026-10" },
    cash,
    "2026-10-08",
    0,
  );
  assert.equal(result.reserved, 83000);
  assert.equal(result.investable, 207000);
  assert.equal(
    cashForecast(
      { "2026-10": { ...b, depreciation: 0 } },
      [],
      { ...plan, through: "2026-10" },
      cash,
      "2026-10-08",
      0,
    ).investable,
    207000,
  );
  assert.equal(
    cashForecast({ "2026-10": b }, [], plan, cash, "2026-10-08", 1).investable,
    null,
  );
  const pending = cashForecast(
    { "2026-10": b },
    [{ ...e("manual", 1000), source: "manual" }],
    { ...plan, through: "2026-10" },
    cash,
    "2026-10-08",
    0,
  );
  assert.equal(pending.manualReserve, 1000);
});
test("weekly evidence excludes investments and transfers and includes refunds", () => {
  const insights = weeklyInsights(
    [
      e("a", 1000, "2026-10-08"),
      e("r", -200, "2026-10-09"),
      e("i", 100000, "2026-10-09", "investment"),
    ],
    "2026-10-10",
  );
  assert.equal(insights.total, 800);
  assert.equal(insights.rows.length, 2);
  assert.equal(insights.categories[0].amount, 800);
});

import { reviewCandidates } from "../src/lib/bank/review-candidates";
import { validateSpendingPlan } from "../src/lib/spending-plan";
import { investmentCandidate } from "../src/lib/bank/transactions";
test("existing duplicates surface once; separate purchases and bank-to-bank rides stay separate", () => {
  const manual = { ...e("manual", 10000), source: "manual" as const };
  const bank = {
    transaction_id: "record",
    data: {
      transaction_id: "record",
      account_id: "a",
      amount: 98.73,
      date: "2026-10-10",
      name: "H MART",
      pending: false,
    },
    decision: "imported",
    owned: true,
  };
  assert.equal(reviewCandidates([manual], [bank]).length, 1);
  assert.equal(
    reviewCandidates([manual], [{ ...bank, duplicate_checked: true }]).length,
    0,
  );
  assert.equal(
    reviewCandidates([{ ...manual, source: "bank" }], [bank]).length,
    0,
  );
  assert.equal(
    reviewCandidates([{ ...manual, payment: "cash" }], [bank]).length,
    0,
  );
});
test("investment transfer suggestions preserve internal transfers and require an explicit waiting investment", () => {
  const bank = {
    transaction_id: "record",
    account_id: "a",
    amount: 100,
    date: "2026-10-10",
    name: "WIRE TO BROKER",
    pending: false,
  };
  assert.ok(
    investmentCandidate(bank, [
      { ...e("invest", 10000, "2026-10-09", "investment"), source: "manual" },
    ]),
  );
  assert.equal(
    investmentCandidate({ ...bank, name: "Online Transfer to CHK ...1234" }, [
      { ...e("invest", 10000, "2026-10-09", "investment"), source: "manual" },
    ]),
    null,
  );
});
test("positive carryover is optional and a long overspend is repaid across months", () => {
  const rows = [e("overspend", 50000)];
  assert.equal(
    envelopesForMonth({ "2026-10": b }, rows, "2026-11", plan)
      .discretionaryLeft,
    -10000,
  );
  assert.equal(
    envelopesForMonth({ "2026-10": b }, rows, "2026-12", plan)
      .discretionaryLeft,
    10000,
  );
  assert.equal(
    envelopesForMonth({ "2026-10": b }, [], "2026-11", {
      ...plan,
      carryPositive: true,
    }).discretionaryLeft,
    40000,
  );
  assert.equal(
    envelopesForMonth({ "2026-10": b }, [], "2026-11", plan).discretionaryLeft,
    20000,
  );
});
test("future dated manual payments cannot inflate investable cash and supplied bill payments are not reserved twice", () => {
  const current = {
    ...plan,
    through: "2026-10",
    paidEssentials: {
      "2026-10": { rent: 20000, utilities: 5000, insurance: 5000 },
    },
  };
  const cash = {
    available: 300000,
    checkedAt: "2026-10-08T12:00:00Z",
    accounts: [],
  };
  const base = cashForecast(
    { "2026-10": b },
    [],
    current,
    cash,
    "2026-10-08",
    0,
  );
  assert.equal(base.reserved, 53000);
  assert.equal(
    cashForecast(
      { "2026-10": b },
      [e("future", 10000, "2026-10-20")],
      current,
      cash,
      "2026-10-08",
      0,
    ).investable,
    base.investable,
  );
  assert.throws(() => validateSpendingPlan({ ...plan, through: "2025-10" }));
  assert.throws(() => validateSpendingPlan({ ...plan, buffer: -1 }));
});
test("refunds from a prior month replenish the linked category this month", () => {
  const refund = {
    ...e("refund", -1000, "2026-11-01", "groceries"),
    refundOf: "original",
  };
  const p = envelopesForMonth(
    { "2026-10": b },
    [e("original", 1000, "2026-10-08", "groceries"), refund],
    "2026-11",
    plan,
  );
  assert.equal(p.groceriesLeft, 31000);
  assert.equal(p.discretionaryLeft, 20000);
});

test("manual payments confirmed in the bank balance release the temporary cash reserve", () => {
  const cash = {
    available: 300000,
    checkedAt: "2026-10-08T12:00:00Z",
    accounts: [],
  };
  const rows = [
    { ...e("paid", 10000), source: "manual" as const, settled: true },
  ];
  assert.equal(
    cashForecast(
      { "2026-10": b },
      rows,
      { ...plan, through: "2026-10" },
      cash,
      "2026-10-08",
      0,
    ).manualReserve,
    0,
  );
});
import { toExpense } from "../src/lib/bank/transactions";
test("rent identified in bank transfers is a bill, while internal transfers remain excluded", () => {
  const t = {
    transaction_id: "rent",
    account_id: "a",
    amount: 2000,
    date: "2026-10-01",
    name: "Zelle payment to landlord",
    pending: false,
    personal_finance_category: {
      primary: "TRANSFER_OUT",
      detailed: "TRANSFER_OUT_ACCOUNT_TRANSFER",
    },
  };
  assert.deepEqual(toExpense(t)?.tags, ["rent"]);
  assert.equal(toExpense({ ...t, name: "Online transfer to savings" }), null);
});

test("months before the carryover plan still deduct recorded purchases and refunds", () => {
  const historical = envelopesForMonth(
    { "2026-09": b },
    [
      e("g", 5000, "2026-09-03", "groceries"),
      e("s", 3000, "2026-09-04"),
      e("r", -1000, "2026-09-05"),
    ],
    "2026-09",
    plan,
  );
  assert.equal(historical.carry, 0);
  assert.equal(historical.groceriesLeft, 25000);
  assert.equal(historical.discretionaryLeft, 18000);
  assert.equal(historical.spent, 2000);
});

test("an unconfirmed manual refund does not change the cash forecast", () => {
  const current = { ...plan, through: "2026-10" };
  const cash = {
    available: 300000,
    checkedAt: "2026-10-08T12:00:00Z",
    accounts: [],
  };
  const purchase = { ...e("purchase", 10000), source: "bank" as const };
  const refund = {
    ...e("refund", -10000),
    source: "manual" as const,
    refundOf: "purchase",
  };
  const before = cashForecast(
    { "2026-10": b },
    [purchase],
    current,
    cash,
    "2026-10-08",
    0,
  );
  const pending = cashForecast(
    { "2026-10": b },
    [purchase, refund],
    current,
    cash,
    "2026-10-08",
    0,
  );
  assert.equal(pending.investable, before.investable);
  const confirmed = cashForecast(
    { "2026-10": b },
    [purchase, { ...refund, source: "matched" }],
    current,
    { ...cash, available: 310000 },
    "2026-10-08",
    0,
  );
  assert.equal(confirmed.investable, before.investable);
});

test("scheduled subscription entries cannot trigger a historical price-increase alert", () => {
  const rows = [
    e("old", 1000, "2026-09-10", "bill", "Streaming"),
    e("future", 1500, "2026-11-10", "bill", "Streaming"),
  ].map((p) => ({ ...p, tags: ["subscriptions"] }));
  assert.equal(weeklyInsights(rows, "2026-10-10").increases.length, 0);
});

import { spendingTrend } from "../src/lib/spending-trend";
test("moving cash between owned accounts never appears as daily spending", () => {
  const points = spendingTrend(
    [e("transfer", 100000, "2026-10-01", "transfer")],
    "2026-10",
    "2026-10-01",
    50000,
  );
  assert.equal(points[0].spent, 0);
  assert.equal(points[0].remaining, 50000);
});

test("downloadable app defaults contain no personal budget figures", () => {
  assert.ok(Object.values(defaultBudget).every((value) => value === 0));
});
