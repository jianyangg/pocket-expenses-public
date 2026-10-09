import { money } from "@/lib/budget";
import {
  investmentSurplus,
  type InvestmentPlan as Plan,
} from "@/lib/investment-plan";
export default function InvestmentPlan({ plan }: { plan: Plan }) {
  const date = new Date(plan.asOf + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
  const through = new Date(plan.through + "-01T12:00:00Z").toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric", timeZone: "UTC" },
  );
  return (
    <section className="panel investment-plan">
      <div className="section-head">
        <h2>Investable cash</h2>
        <span>Snapshot · {date}</span>
      </div>
      <strong className="investment-plan-amount">
        {money(investmentSurplus(plan))}
      </strong>
      <p className="hint">
        After reserving living expenses through {through}. Before an emergency
        buffer.
      </p>
      <details>
        <summary>Calculation & assumptions</summary>
        <dl>
          <div>
            <dt>Available bank cash</dt>
            <dd>{money(plan.availableCash)}</dd>
          </div>
          <div>
            <dt>Living expenses reserved</dt>
            <dd>−{money(plan.reservedLivingCosts)}</dd>
          </div>
          <div>
            <dt>Emergency buffer reserved</dt>
            <dd>{money(plan.buffer)}</dd>
          </div>
        </dl>
        <p className="hint">
          {money(plan.monthlyGroceries)} groceries +{" "}
          {money(plan.monthlyDiscretionary)} discretionary per month. The annual
          insurance policy is prepaid for {plan.prepaidInsuranceMonths} months (
          {money(plan.prepaidInsuranceAmount)} paid); only{" "}
          {money(plan.monthlyInsurance)}/month needs cash reserved. Annual
          coverage is assumed to include this planning period.
        </p>
        <p className="hint">
          Depreciation is excluded. This is a dated cash snapshot; later
          spending, bank changes and transfers are not reflected here.
        </p>
      </details>
    </section>
  );
}
