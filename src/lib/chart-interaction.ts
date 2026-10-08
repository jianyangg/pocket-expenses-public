export function chartIndex(
  fraction: number,
  count: number,
  kind: "bar" | "line",
) {
  return Math.max(
    0,
    Math.min(
      count - 1,
      kind === "bar"
        ? Math.floor(fraction * count)
        : Math.round(fraction * (count - 1)),
    ),
  );
}
export function ringSlice(
  x: number,
  y: number,
  values: number[],
): number | null {
  const radius = Math.hypot(x, y);
  if (radius < 0.78 || radius > 1) return null;
  const total = values.reduce((a, b) => a + Math.max(0, b), 0);
  if (!total) return null;
  const angle = (Math.atan2(x, -y) + Math.PI * 2) % (Math.PI * 2);
  const target = (angle / (Math.PI * 2)) * total;
  let offset = 0;
  for (let index = 0; index < values.length; index++) {
    offset += Math.max(0, values[index]);
    if (target < offset) return index;
  }
  return null;
}
