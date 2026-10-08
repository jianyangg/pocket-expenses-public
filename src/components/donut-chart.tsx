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
}: {
  slices: ChartSlice[];
  label: string;
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
          </li>
        ))}
      </ul>
    </div>
  );
}
