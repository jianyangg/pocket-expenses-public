export type InvestmentPlan = {
  asOf: string;
  through: string;
  availableCash: number;
  reservedLivingCosts: number;
  monthlyGroceries: number;
  monthlyInsurance: number;
  monthlyDiscretionary: number;
  buffer: number;
  prepaidInsuranceAmount: number;
  prepaidInsuranceMonths: number;
};
export function investmentSurplus(p: InvestmentPlan) {
  return Math.max(0, p.availableCash - p.reservedLivingCosts - p.buffer);
}
export function validateInvestmentPlan(
  input: unknown,
): InvestmentPlan | undefined {
  if (input === undefined) return undefined;
  if (!input || typeof input !== "object")
    throw new Error("Invalid investment plan");
  const p = input as InvestmentPlan;
  if (
    typeof p.asOf !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(p.asOf) ||
    Number.isNaN(Date.parse(p.asOf)) ||
    new Date(p.asOf + "T12:00:00Z").toISOString().slice(0, 10) !== p.asOf ||
    typeof p.through !== "string" ||
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(p.through) ||
    p.through < p.asOf.slice(0, 7)
  )
    throw new Error("Invalid investment period");
  for (const k of [
    "availableCash",
    "reservedLivingCosts",
    "monthlyGroceries",
    "monthlyInsurance",
    "monthlyDiscretionary",
    "buffer",
    "prepaidInsuranceAmount",
    "prepaidInsuranceMonths",
  ] as const)
    if (!Number.isSafeInteger(p[k]) || p[k] < 0 || p[k] > 10000000000)
      throw new Error("Invalid investment amount");
  if (p.prepaidInsuranceMonths < 1 || p.prepaidInsuranceMonths > 600)
    throw new Error("Invalid insurance term");
  return {
    asOf: p.asOf,
    through: p.through,
    availableCash: p.availableCash,
    reservedLivingCosts: p.reservedLivingCosts,
    monthlyGroceries: p.monthlyGroceries,
    monthlyInsurance: p.monthlyInsurance,
    monthlyDiscretionary: p.monthlyDiscretionary,
    buffer: p.buffer,
    prepaidInsuranceAmount: p.prepaidInsuranceAmount,
    prepaidInsuranceMonths: p.prepaidInsuranceMonths,
  };
}
