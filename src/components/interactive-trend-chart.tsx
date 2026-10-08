"use client";
import { useState } from "react";
import { money } from "@/lib/budget";
import { chartIndex } from "@/lib/chart-interaction";
export type TrendPoint = { date: string; value: number; opening?: boolean };
export default function InteractiveTrendChart({
  points,
  kind,
  label,
}: {
  points: TrendPoint[];
  kind: "bar" | "line";
  label: string;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const count = points.length;
  const floor = Math.min(0, ...points.map((p) => p.value)),
    ceiling = Math.max(1, ...points.map((p) => p.value));
  const y = (v: number) => 20 + (100 * (ceiling - v)) / (ceiling - floor);
  const x = (index: number) =>
    kind === "bar"
      ? 10 + ((index + 0.5) * 300) / count
      : 10 + (index * 300) / Math.max(1, count - 1);
  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ");
  const point = selected === null ? null : points[selected];
  function pick(event: React.PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const local = ((event.clientX - bounds.left) / bounds.width) * 320;
    setSelected(chartIndex((local - 10) / 300, count, kind));
  }
  return (
    <div className="interactive-trend">
      <div className="trend-readout" aria-live="polite">
        {point ? (
          <>
            <span>
              {point.opening
                ? "Month start"
                : new Date(point.date + "T12:00:00Z").toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric", timeZone: "UTC" },
                  )}
            </span>
            <strong>{money(point.value)}</strong>
          </>
        ) : null}
      </div>
      <svg
        className="trend-chart"
        viewBox="0 0 320 146"
        role="group"
        tabIndex={0}
        aria-label={label + ". Use left and right arrow keys to inspect days."}
        onPointerMove={(e) => {
          if (e.pointerType === "mouse" || e.buttons) pick(e);
        }}
        onPointerDown={pick}
        onPointerLeave={(e) => {
          if (
            e.pointerType === "mouse" &&
            document.activeElement !== e.currentTarget
          )
            setSelected(null);
        }}
        onFocus={() => setSelected(count - 1)}
        onBlur={() => setSelected(null)}
        onKeyDown={(e) => {
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
        <line
          x1="10"
          x2="310"
          y1={kind === "bar" ? y(0) : 120}
          y2={kind === "bar" ? y(0) : 120}
          stroke="#e5e5ea"
        />
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
              points={`10,120 ${line} 310,120`}
              fill="#007aff"
              opacity=".07"
            />
            <polyline
              points={line}
              fill="none"
              stroke="#007aff"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {points.map((p, i) => (
              <circle
                key={i}
                cx={x(i)}
                cy={y(p.value)}
                r={i === count - 1 ? 4 : 2}
                fill="#007aff"
              />
            ))}
          </>
        )}
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
