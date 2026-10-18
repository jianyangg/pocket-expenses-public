import { money } from "@/lib/budget";
import type { budgetOutlook } from "@/lib/budget-outlook";
export default function BudgetOutlook({
  months,
  onPlan,
}: {
  months: ReturnType<typeof budgetOutlook>;
  onPlan: () => void;
}) {
  if (!months.length) return null;
  const name = (month: string) =>
    new Date(month + "-01T12:00:00Z").toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  return (
    <details className="budget-outlook">
      <summary>
        <span>Upcoming monthly budgets</span>
        <span>
          {name(months[0].month).split(" ")[0]} shopping{" "}
          {money(Math.max(0, months[0].shopping))}
        </span>
      </summary>
      <p>
        After carryover and purchases spread over months. A minus sign means
        that category is still over budget.
      </p>
      <table>
        <caption className="sr-only">
          Remaining budgets for upcoming months, assuming no new purchases
        </caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Groceries</th>
            <th scope="col">Shopping & dining</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m.month}>
              <th scope="row">{name(m.month)}</th>
              <td className={m.groceries < 0 ? "negative" : ""}>
                {money(m.groceries)}
              </td>
              <td className={m.shopping < 0 ? "negative" : ""}>
                {money(m.shopping)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="quiet" onClick={onPlan}>
        Edit monthly budgets
      </button>
    </details>
  );
}
