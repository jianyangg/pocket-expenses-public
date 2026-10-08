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
        Spread over time{value ? ` · ${value.months} months` : ""}
      </summary>
      <label>
        Recognition
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
          <option value="now">Expense now</option>
          <option value="prepaid">Prepaid purchase</option>
          <option value="asset">Depreciable asset</option>
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
            month · starts in purchase month
          </p>
        </>
      ) : null}
    </details>
  );
}
