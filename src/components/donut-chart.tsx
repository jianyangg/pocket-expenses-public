import { money } from "@/lib/budget";
import type { ChartSlice } from "@/lib/chart-data";
const colors = [
  "#34c759",
  "#ff9f0a",
  "#af52de",
  "#5ac8fa",
  "#5856d6",
  "#007aff",
  "#8e8e93",
];
export default function DonutChart({
  slices,
  label,
  onSelect,
  isSelectable,
}: {
  slices: ChartSlice[];
  label: string;
  onSelect?: (label:string)=>void;
  isSelectable?: (label:string)=>boolean;
}) {
  const positive = slices.filter((s) => s.amount > 0);
  const total = positive.reduce((n, s) => n + s.amount, 0);
  let offset = 0;
  const gradient = positive
    .map((slice, index) => {
      const start = offset;
      offset += (slice.amount / total) * 100;
      return `${colors[Math.max(0, slices.indexOf(slice)) % colors.length]} ${start}% ${offset}%`;
    })
    .join(",");
  return (
    <div className="donut-layout">
      <div
        className="donut"
        role="img"
        aria-label={`${label}: ${slices.map((s) => `${s.label} ${money(s.amount)}`).join(", ")}`}
        style={{
          background: total ? `conic-gradient(${gradient})` : "var(--line)",
        }}
      >
        <div>
          <span>{label}</span>
          <strong>{money(slices.reduce((n, s) => n + s.amount, 0))}</strong>
        </div>
      </div>
      <ul className="donut-legend">
        {slices.map((slice) => (
          <li key={slice.label}>
            {onSelect && (isSelectable?.(slice.label)??true)?<button type="button" className="chart-category-button" onClick={()=>onSelect(slice.label)} aria-label={"View "+slice.label+" transactions, "+money(slice.amount)}>
            <span>
              <i
                style={{
                  background:
                    colors[Math.max(0, slices.indexOf(slice)) % colors.length],
                }}
              />
              {slice.label}
            </span>
            <span className="chart-category-amount"><strong>{money(slice.amount)}</strong><b aria-hidden="true">›</b></span>
            </button>:<>
            <span>
              <i
                style={{
                  background:
                    colors[Math.max(0, slices.indexOf(slice)) % colors.length],
                }}
              />
              {slice.label}
            </span>
            <strong>{money(slice.amount)}</strong>
            </>}
          </li>
        ))}
      </ul>
    </div>
  );
}
