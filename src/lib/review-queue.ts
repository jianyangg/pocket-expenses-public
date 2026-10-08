import type { Expense } from "./budget";
export function reviewQueue(
  expenses: Expense[],
  start: string,
  end: string,
  completed: string[],
  untagged = false,
) {
  if (!start || !end || start > end) return [];
  const done = new Set(completed);
  return expenses
    .filter(
      (e) =>
        e.date >= start &&
        e.date <= end &&
        !done.has(e.id) &&
        !e.reviewed &&
        (!untagged || !e.tags.length),
    )
    .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}
export function daysBefore(date: string, days: number) {
  const value = new Date(date + "T12:00:00Z");
  value.setUTCDate(value.getUTCDate() - days);
  return value.toISOString().slice(0, 10);
}
export function swipeAction(distance: number, vertical = 0) {
  if (vertical <= -90 && Math.abs(vertical) > Math.abs(distance))
    return "options";
  return distance >= 90
    ? "discretionary"
    : distance <= -90
      ? "groceries"
      : null;
}
