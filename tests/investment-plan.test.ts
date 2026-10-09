import { test } from "node:test";
import assert from "node:assert/strict";
import {
  investmentSurplus,
  validateInvestmentPlan,
} from "../src/lib/investment-plan";
const plan = {
  asOf: "2026-10-09",
  through: "2027-03",
  availableCash: 1000000,
  reservedLivingCosts: 700000,
  monthlyGroceries: 50000,
  monthlyInsurance: 10000,
  monthlyDiscretionary: 10000,
  buffer: 0,
  prepaidInsuranceAmount: 120000,
  prepaidInsuranceMonths: 12,
};
test("cash surplus excludes prepaid costs already absent from available cash", () => {
  assert.equal(investmentSurplus(plan), 300000);
  assert.equal(investmentSurplus({ ...plan, buffer: 100000 }), 200000);
  assert.equal(investmentSurplus({ ...plan, reservedLivingCosts: 1100000 }), 0);
  assert.deepEqual(validateInvestmentPlan(plan), plan);
});
test("investment snapshot rejects negative funds and malformed periods", () => {
  for (const update of [
    { availableCash: -1 },
    { asOf: "wrong" },
    { through: "2026-01" },
    { monthlyDiscretionary: 1.2 },
  ])
    assert.throws(() => validateInvestmentPlan({ ...plan, ...update }));
  assert.equal(validateInvestmentPlan(undefined), undefined);
});
