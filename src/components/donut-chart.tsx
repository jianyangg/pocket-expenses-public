"use client";
import { useState } from "react";
import { ringSlice } from "@/lib/chart-interaction";
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
  onSelect?: (label: string) => void;
  isSelectable?: (label: string) => boolean;
}) {
  const [active, setActive] = useState<number | null>(null);
  function ring(event: React.PointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return ringSlice(
      (event.clientX - bounds.left - bounds.width / 2) / (bounds.width / 2),
      (event.clientY - bounds.top - bounds.height / 2) / (bounds.height / 2),
      slices.map((s) => s.amount),
    );
  }
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
        onPointerMove={(e) => setActive(ring(e))}
        onPointerLeave={() => setActive(null)}
        onPointerDown={(e) => {
          const index = ring(e);
          setActive(index);
          if (
            index !== null &&
            onSelect &&
            (isSelectable?.(slices[index].label) ?? true)
          )
            onSelect(slices[index].label);
        }}
        aria-label={`${label}: ${slices.map((s) => `${s.label} ${money(s.amount)}`).join(", ")}`}
        style={{
          background: total ? `conic-gradient(${gradient})` : "var(--line)",
        }}
      >
        <div>
          <span>{active === null ? label : slices[active].label}</span>
          <strong>
            {money(
              active === null
                ? slices.reduce((n, s) => n + s.amount, 0)
                : slices[active].amount,
            )}
          </strong>
        </div>
      </div>
      <ul className="donut-legend">
        {slices.map((slice, index) => {
          const selectable = Boolean(
            onSelect && (isSelectable?.(slice.label) ?? true),
          );
          const content = (
            <>
              <span>
                <i style={{ background: colors[index % colors.length] }} />
                {slice.label}
              </span>
              <span className="chart-category-amount">
                <strong>{money(slice.amount)}</strong>
                <b
                  className={selectable ? "" : "legend-spacer"}
                  aria-hidden="true"
                >
                  ›
                </b>
              </span>
            </>
          );
          return (
            <li
              key={slice.label}
              data-active={active === index}
              onPointerEnter={() => setActive(index)}
              onPointerLeave={() => setActive(null)}
            >
              {selectable ? (
                <button
                  type="button"
                  className="chart-legend-row chart-category-button"
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(null)}
                  onClick={() => onSelect?.(slice.label)}
                  aria-label={
                    "View " +
                    slice.label +
                    " transactions, " +
                    money(slice.amount)
                  }
                >
                  {content}
                </button>
              ) : (
                <div className="chart-legend-row">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
