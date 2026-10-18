"use client";
import { useId, useRef, useState } from "react";
import { money } from "@/lib/budget";
import { chartIndex, chartTap } from "@/lib/chart-interaction";
import { trendScale } from "@/lib/trend-scale";
export type TrendPoint = { date: string; value: number; opening?: boolean };
export default function InteractiveTrendChart({
  points,
  kind,
  label,
  onDateSelect,
}: {
  points: TrendPoint[];
  kind: "bar" | "line";
  label: string;
  onDateSelect?: (date: string) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const tap = useRef<{ id: number; x: number; y: number } | null>(null);
  const count = points.length;
  const { y, zero } = trendScale(points.map((p) => p.value));
  const clip = useId().replace(/:/g, "");
  const x = (index: number) =>
    kind === "bar"
      ? 10 + ((index + 0.5) * 300) / count
      : 10 + (index * 300) / Math.max(1, count - 1);
  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ");
  const point = selected === null ? null : points[selected];
  function pick(event: React.PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const local = ((event.clientX - bounds.left) / bounds.width) * 320;
    const index = chartIndex((local - 10) / 300, count, kind);
    setSelected(index);
    return index;
  }
  return (
    <div
      className="interactive-trend"
      onPointerLeave={(e) => {
        if (
          e.pointerType === "mouse" &&
          !e.currentTarget.contains(document.activeElement)
        )
          setSelected(null);
      }}
    >
      <div className="trend-readout" aria-live="polite">
        {point ? (
          <>
            <button
              className="trend-date-link"
              disabled={!onDateSelect || point.opening}
              onClick={() => onDateSelect?.(point.date)}
            >
              {point.opening
                ? "Month start"
                : new Date(point.date + "T12:00:00Z").toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric", timeZone: "UTC" },
                  )}
              {onDateSelect && !point.opening ? (
                <span aria-hidden="true"> ›</span>
              ) : null}
            </button>
            <strong>{money(point.value)}</strong>
          </>
        ) : null}
      </div>
      <svg
        className="trend-chart"
        data-drilldown={Boolean(onDateSelect)}
        viewBox="0 0 320 146"
        role="group"
        tabIndex={0}
        aria-label={
          label +
          ". Use left and right arrow keys to inspect days." +
          (onDateSelect ? " Press Enter to open that day's transactions." : "")
        }
        onPointerMove={(e) => {
          if (e.pointerType === "mouse" || e.buttons) pick(e);
        }}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          tap.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
          pick(e);
        }}
        onPointerCancel={() => {
          tap.current = null;
        }}
        onPointerUp={(e) => {
          const start = tap.current;
          tap.current = null;
          if (
            !start ||
            start.id !== e.pointerId ||
            !chartTap(start, { x: e.clientX, y: e.clientY })
          )
            return;
          const index = pick(e);
          if (!points[index].opening) onDateSelect?.(points[index].date);
        }}
        onFocus={() => setSelected((current) => current ?? count - 1)}
        onBlur={(e) => {
          if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node))
            setSelected(null);
        }}
        onKeyDown={(e) => {
          if (
            (e.key === "Enter" || e.key === " ") &&
            selected !== null &&
            onDateSelect &&
            !points[selected].opening
          ) {
            e.preventDefault();
            onDateSelect(points[selected].date);
            return;
          }
          if (
            ["ArrowLeft", "ArrowRight", "Home", "End", "Escape"].includes(e.key)
          ) {
            e.preventDefault();
            setSelected(
              e.key === "Escape"
                ? null
                : e.key === "Home"
                  ? 0
                  : e.key === "End"
                    ? count - 1
                    : Math.max(
                        0,
                        Math.min(
                          count - 1,
                          (selected ?? count - 1) +
                            (e.key === "ArrowLeft" ? -1 : 1),
                        ),
                      ),
            );
          }
        }}
      >
        <defs>
          <clipPath id={clip + "-positive"}>
            <rect x="0" y="0" width="320" height={zero} />
          </clipPath>
          <clipPath id={clip + "-negative"}>
            <rect x="0" y={zero} width="320" height={146 - zero} />
          </clipPath>
        </defs>
        {kind === "bar" ? (
          points.map((p, i) => (
            <rect
              key={p.date}
              x={x(i) - (300 / count) * 0.35}
              y={Math.min(y(p.value), y(0))}
              width={(300 / count) * 0.7}
              height={Math.max(1, Math.abs(y(p.value) - y(0)))}
              rx={Math.min(3, (300 / count) * 0.2)}
              fill={
                p.value < 0
                  ? "#34c759"
                  : selected === i || i === count - 1
                    ? "#007aff"
                    : "#a8caff"
              }
            />
          ))
        ) : (
          <>
            <polygon
              points={`10,${zero} ${line} 310,${zero}`}
              fill="#007aff"
              opacity=".07"
              clipPath={`url(#${clip}-positive)`}
            />
            <polygon
              points={`10,${zero} ${line} 310,${zero}`}
              fill="#b3372b"
              opacity=".09"
              clipPath={`url(#${clip}-negative)`}
            />
            <polyline
              clipPath={`url(#${clip}-positive)`}
              points={line}
              fill="none"
              stroke="#007aff"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <polyline
              points={line}
              fill="none"
              stroke="#b3372b"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              clipPath={`url(#${clip}-negative)`}
            />
            {points.map((p, i) => (
              <circle
                key={i}
                cx={x(i)}
                cy={y(p.value)}
                r={i === count - 1 ? 4 : 2}
                fill={p.value < 0 ? "#b3372b" : "#007aff"}
              />
            ))}
          </>
        )}
        <line
          x1="10"
          x2="310"
          y1={zero}
          y2={zero}
          stroke="#8e8e93"
          strokeWidth=".6"
          strokeDasharray="3 3"
        />
        <text
          x="10"
          y={zero - 4}
          fill="#6e6e73"
          fontSize="8"
          stroke="white"
          strokeWidth="2"
          paintOrder="stroke"
        >
          $0
        </text>
        {selected !== null ? (
          <g pointerEvents="none">
            <line
              x1={x(selected)}
              x2={x(selected)}
              y1="14"
              y2="122"
              stroke="#007aff"
              strokeOpacity=".35"
              strokeDasharray="3 3"
            />
            {kind === "line" ? (
              <circle
                cx={x(selected)}
                cy={y(points[selected].value)}
                r="4"
                fill="#007aff"
                stroke="white"
                strokeWidth="2"
              />
            ) : null}
          </g>
        ) : null}
      </svg>
    </div>
  );
}
