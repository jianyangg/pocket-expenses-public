"use client";
import { useState } from "react";
import { money, type Budget, type Expense } from "@/lib/budget";
import { moneyFlow } from "@/lib/money-flow";
import {
  spendingCategories,
  type SpendingCategory,
} from "@/lib/category-breakdown";
import type { Envelopes } from "@/lib/spending-plan";
import EnvelopeSummary from "./envelope-summary";
import CategoryDetails from "./category-details";
import DonutChart from "./donut-chart";
export default function MonthlyMoney({
  budget,
  expenses,
  envelopes,
  includeSetup,
  month,
  today,
  onPlan,
  children,
}: {
  budget: Budget;
  expenses: Expense[];
  envelopes: Envelopes;
  includeSetup: boolean;
  month: string;
  today: string;
  onPlan: () => void;
  children?: React.ReactNode;
}) {
  const [selected, setSelected] = useState<SpendingCategory | null>(null);
  const p = moneyFlow(budget, expenses, includeSetup);
  const left = [
    envelopes.groceriesLeft,
    envelopes.discretionaryLeft,
    envelopes.subscriptionsLeft,
    envelopes.transitLeft,
    envelopes.refillsLeft,
  ].reduce((n, v) => n + Math.max(0, v), 0);
  const slices = [
    ...spendingCategories
      .filter((c) => c.key !== "investments")
      .map((c) => ({ label: c.label, amount: p[c.key] })),
    { label: "Available", amount: Math.max(0, left) },
  ];
  return (
    <section className="money-overview">
      <EnvelopeSummary
        envelopes={envelopes}
        expenses={expenses}
        month={month}
        today={today}
        onPlan={onPlan}
      />
      {children}
      <div className="allocation-surface">
        <div className="section-head">
          <h2>This month</h2>
          <span>
            {money(
              p.groceries +
                p.shopping +
                p.subscriptions +
                p.transit +
                p.refills,
            )}{" "}
            net spent
          </span>
        </div>
        <DonutChart
          slices={slices}
          label="Everyday spending"
          isSelectable={(label) => label !== "Available"}
          onSelect={(label) =>
            setSelected(
              spendingCategories.find((c) => c.label === label)?.key ?? null,
            )
          }
        />
        <details className="income-disclosure">
          <summary>Income & monthly commitments</summary>
          <dl className="commitment-list">
            {[
              ["Income", budget.income],
              ["Rent", budget.rent],
              ["Utilities", budget.utilities],
              ["Insurance", budget.insurance],
              ["Investing target", budget.investing],
              ...(includeSetup
                ? [["Setup depreciation (noncash)", budget.depreciation]]
                : []),
            ].map(([label, value]) => (
              <div key={String(label)}>
                <dt>{label}</dt>
                <dd>{money(Number(value))}</dd>
              </div>
            ))}
          </dl>
        </details>
      </div>
      <CategoryDetails
        category={selected}
        expenses={expenses}
        month={month}
        onClose={() => setSelected(null)}
      />
    </section>
  );
}
