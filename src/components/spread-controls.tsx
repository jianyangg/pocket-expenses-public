"use client";
import { money } from "@/lib/budget";
import type { ExpenseSpread } from "@/lib/expense-schedule";
export default function SpreadControls({
  value,
  onChange,
  amount,
  disabled = false,
}: {
  value: ExpenseSpread | null;
  onChange: (v: ExpenseSpread | null) => void;
  amount: number;
  disabled?: boolean;
}) {
  return (
    <details className="spread-controls" open={value ? true : undefined}>
      <summary>
        {value ? `Spread over ${value.months} months` : "Spread over months"}
      </summary>
      <label>
        Charge this budget
        <select
          disabled={disabled}
          value={value?.kind ?? "now"}
          onChange={(e) =>
            onChange(
              e.target.value === "now"
                ? null
                : {
                    kind: e.target.value as ExpenseSpread["kind"],
                    months: value?.months ?? 5,
                  },
            )
          }
        >
          <option value="now">All in purchase month</option>
          <option value="prepaid">Over months · prepaid or supplies</option>
          <option value="asset">
            Over months · lasting item (depreciation)
          </option>
        </select>
      </label>
      {value ? (
        <>
          <label>
            Months
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max="600"
              disabled={disabled}
              value={value.months}
              onChange={(e) =>
                onChange({ ...value, months: Number(e.target.value) })
              }
            />
          </label>
          <p className="hint">
            {money(Math.round(Math.abs(amount) / Math.max(1, value.months)))} /
            month · starts in purchase month. The full cash payment stays on its
            original date.
          </p>
        </>
      ) : null}
    </details>
  );
}
