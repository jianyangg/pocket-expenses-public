"use client";
import {useState} from "react";
import {spendingCategories,type SpendingCategory} from "@/lib/category-breakdown";
import CategoryDetails from "./category-details";
import { money, type Budget, type Expense } from "@/lib/budget";
import { moneyFlow } from "@/lib/money-flow";
import DonutChart from "./donut-chart";
import DailyBudget from "./daily-budget";
export default function MonthlyMoney({
  budget,
  expenses,
  includeSetup,
  month,
  today,
}: {
  budget: Budget;
  expenses: Expense[];
  includeSetup: boolean;
  month: string;
  today: string;
}) {
  const [selected,setSelected]=useState<SpendingCategory|null>(null);
  const p = moneyFlow(budget, expenses, includeSetup);
  const spent =
    p.groceries + p.shopping + p.subscriptions + p.transit + p.investments;
  const slices=[...spendingCategories.map(c=>({label:c.label,amount:p[c.key]})),{label:"Available",amount:Math.max(0,p.remaining)}];
  const groceryProgress =
    budget.groceries > 0
      ? Math.max(0, Math.min(100, (p.groceries / budget.groceries) * 100))
      : 0;
  return (
    <section className="money-overview">
      <div className="available-hero">
        <p className="available-label">Available to spend or invest</p>
        <strong
          className={"available-amount " + (p.remaining < 0 ? "negative" : "")}
        >
          {money(p.remaining)}
        </strong>
        <div className="summary-balances">
          <div>
            <span>Groceries left</span>
            <strong>{money(budget.groceries - p.groceries)}</strong>
          </div>
          <div>
            <span>Discretionary left</span>
            <strong
              className={
                p.remaining - Math.max(0, budget.groceries - p.groceries) < 0
                  ? "negative"
                  : ""
              }
            >
              {money(p.remaining - Math.max(0, budget.groceries - p.groceries))}
            </strong>
          </div>
        </div>
        <details className="income-disclosure">
          <summary>Income & deductions</summary>
          <div className="income-flow">
            <div>
              <span>Income</span>
              <strong>{money(budget.income)}</strong>
            </div>
            <span className="flow-operation">−</span>
            <div>
              <span>Rent</span>
              <strong>{money(budget.rent)}</strong>
            </div>
            <span className="flow-operation">−</span>
            <div>
              <span>Utilities</span>
              <strong>{money(budget.utilities)}</strong>
            </div>
            <span className="flow-operation">−</span>
            <div>
              <span>Insurance</span>
              <strong>{money(budget.insurance)}</strong>
            </div>
            {includeSetup ? (
              <>
                <span className="flow-operation">−</span>
                <div>
                  <span>Setup / 9</span>
                  <strong>{money(budget.depreciation)}</strong>
                </div>
              </>
            ) : null}
            <span className="flow-operation">=</span>
            <div className="flow-result">
              <span>Before spending</span>
              <strong>{money(p.starting)}</strong>
            </div>
          </div>
        </details>
      </div>
      <DailyBudget
        budget={budget}
        expenses={expenses}
        month={month}
        today={today}
        includeSetup={includeSetup}
      />
      <div className="allocation-surface">
        <div className="section-head">
          <h2>This month</h2>
          <span className="allocation-spent">{money(spent)} used</span>
        </div>
        <DonutChart slices={slices} label="After essentials" isSelectable={label=>label!=="Available"} onSelect={label=>setSelected(spendingCategories.find(c=>c.label===label)?.key??null)} />
        <div className="grocery-budget">
          <div>
            <span>Groceries remaining</span>
            <strong>{money(budget.groceries - p.groceries)}</strong>
          </div>
          <div
            className="grocery-track"
            role="progressbar"
            aria-label="Grocery budget used"
            aria-valuenow={groceryProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: groceryProgress + "%" }} />
          </div>
          <small>
            {money(p.groceries)} of {money(budget.groceries)}
          </small>
        </div>
      </div>
      <CategoryDetails category={selected} expenses={expenses} month={month} onClose={()=>setSelected(null)}/>
    </section>
  );
}
