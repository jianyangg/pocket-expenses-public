import { test } from "node:test";
import assert from "node:assert/strict";
import { spendingSummary } from "../src/lib/spending-summary";
import { envelopesForMonth } from "../src/lib/spending-plan";
import { monthlyExpenses } from "../src/lib/expense-allocation";
import { cashForecast } from "../src/lib/cash-forecast";
import { defaultBudget, type Expense } from "../src/lib/budget";
const b = { ...defaultBudget, groceries: 30000, discretionary: 20000 };
const plan = {
  startMonth: "2026-10",
  through: "2026-12",
  carryPositive: false,
  buffer: 0,
  paidEssentials: {},
};
const purchase: Expense = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  amount: 10000,
  date: "2026-10-09",
  description: "Laundry card",
  tags: ["laundry"],
  bucket: "discretionary",
  source: "bank",
};
test("shopping overspending never removes the remaining grocery allowance", () => {
  const envelopes = envelopesForMonth(
    { "2026-10": b },
    [{ ...purchase, amount: 60000 }],
    "2026-10",
    plan,
  );
  const summary = spendingSummary(envelopes, [], "2026-10", "2026-10-22");
  assert.equal(summary.netRemaining, -10000);
  assert.equal(summary.groceries.monthlyRemaining, 30000);
  assert.equal(summary.groceries.leftToday, 3000);
  assert.equal(summary.shopping.monthlyRemaining, -40000);
  assert.equal(summary.shopping.leftToday, null);
});
test("each category has its own daily pacing and historical months have none", () => {
  const envelopes = envelopesForMonth({ "2026-10": b }, [], "2026-10", plan);
  const summary = spendingSummary(envelopes, [], "2026-10", "2026-10-22");
  assert.equal(summary.netRemaining, 50000);
  assert.equal(summary.daysLeft, 10);
  assert.equal(summary.groceries.leftToday, 3000);
  assert.equal(summary.shopping.leftToday, 2000);
  const history = spendingSummary(envelopes, [], "2026-09", "2026-10-22");
  assert.equal(history.groceries.leftToday, null);
  assert.equal(history.shopping.leftToday, null);
});
test("today's grocery spending changes only grocery pacing, with a stable start-of-day allowance", () => {
  const rows = [
    {
      ...purchase,
      bucket: "groceries" as const,
      date: "2026-10-22",
      amount: 5000,
    },
  ];
  const envelopes = envelopesForMonth({ "2026-10": b }, rows, "2026-10", plan);
  const summary = spendingSummary(envelopes, rows, "2026-10", "2026-10-22");
  assert.equal(summary.groceries.allowance, 3000);
  assert.equal(summary.groceries.spentToday, 5000);
  assert.equal(summary.groceries.overToday, 2000);
  assert.equal(summary.groceries.leftToday, 0);
  assert.equal(summary.groceries.monthlyRemaining, 25000);
  assert.equal(summary.shopping.leftToday, 2000);
});
test("a grocery refund restores grocery pacing without replenishing shopping", () => {
  const rows = [
    {
      ...purchase,
      bucket: "groceries" as const,
      date: "2026-10-22",
      amount: -1000,
    },
  ];
  const envelopes = envelopesForMonth({ "2026-10": b }, rows, "2026-10", plan);
  const summary = spendingSummary(envelopes, rows, "2026-10", "2026-10-22");
  assert.equal(summary.groceries.allowance, 3000);
  assert.equal(summary.groceries.leftToday, 4000);
  assert.equal(summary.shopping.leftToday, 2000);
});
test("changing an existing purchase to a five-month allocation updates each monthly budget", () => {
  const spread = {
    ...purchase,
    spread: { kind: "prepaid" as const, months: 5 },
  };
  assert.equal(
    envelopesForMonth({ "2026-10": b }, [purchase], "2026-10", plan).spent,
    10000,
  );
  assert.equal(
    envelopesForMonth({ "2026-10": b }, [spread], "2026-10", plan).spent,
    2000,
  );
  assert.equal(
    envelopesForMonth({ "2026-10": b }, [spread], "2026-11", plan).spent,
    2000,
  );
  assert.equal(
    monthlyExpenses([spread], "2026-11")[0].budgetAllocation?.purchaseAmount,
    10000,
  );
  assert.equal(
    envelopesForMonth({ "2026-10": b }, [spread], "2027-03", plan).spent,
    0,
  );
  const asset = {
    ...spread,
    spread: { kind: "asset" as const, months: 5 },
    bucket: "fixed" as const,
  };
  assert.equal(
    envelopesForMonth({ "2026-10": b }, [asset], "2026-10", plan).spent,
    2000,
  );
});
test("spreading a paid purchase never invents investable cash or deducts monthly charges twice", () => {
  const cash = {
    available: 300000,
    checkedAt: "2026-10-18T18:00:00Z",
    accounts: [],
  };
  const baseline = cashForecast(
    { "2026-10": b },
    [purchase],
    plan,
    cash,
    "2026-10-18",
    0,
  );
  for (const kind of ["asset", "prepaid"] as const) {
    const result = cashForecast(
      { "2026-10": b },
      [{ ...purchase, spread: { kind, months: 5 } }],
      plan,
      cash,
      "2026-10-18",
      0,
    );
    assert.equal(result.investable, baseline.investable);
  }
  const confirmed = {
    ...purchase,
    amount: 500000,
    bucket: "investment" as const,
    source: "manual" as const,
    settled: true,
  };
  assert.equal(
    cashForecast({ "2026-10": b }, [confirmed], plan, cash, "2026-10-18", 0)
      .manualReserve,
    0,
  );
});
