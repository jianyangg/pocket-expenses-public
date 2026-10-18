export function trendScale(values: number[]) {
  const minimum = Math.min(0, ...values);
  const maximum = Math.max(0, ...values);
  const pad = Math.max(1, (maximum - minimum) * 0.08);
  const floor = minimum - pad,
    ceiling = maximum + pad;
  const y = (value: number) =>
    20 + (100 * (ceiling - value)) / (ceiling - floor);
  return { y, zero: y(0) };
}
