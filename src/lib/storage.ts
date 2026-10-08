import { buckets, defaultBudget, type Budget, type Expense } from "./budget";
export type Snapshot = {
  version: 1;
  expenses: Expense[];
  budgets: Record<string, Budget>;
};
export const emptySnapshot = (): Snapshot => ({
  version: 1,
  expenses: [],
  budgets: {},
});

export function validateSnapshot(input: unknown): Snapshot {
  if (!input || typeof input !== "object")
    throw new Error("Invalid Pocket export.");
  const s = input as Snapshot;
  if (
    s.version !== 1 ||
    !Array.isArray(s.expenses) ||
    !s.budgets ||
    typeof s.budgets !== "object"
  )
    throw new Error("Choose a version 1 Pocket JSON export.");
  if (s.expenses.length > 50000)
    throw new Error("Import fewer than 50,000 entries at a time.");
  const ids = new Set<string>();
  for (const e of s.expenses) {
    if (
      !e ||
      (e.reviewed !== undefined && typeof e.reviewed !== "boolean") ||
      typeof e.id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        e.id,
      ) ||
      ids.has(e.id) ||
      !Number.isSafeInteger(e.amount) ||
      e.amount === 0 ||
      Math.abs(e.amount) > 100000000 ||
      !buckets.includes(e.bucket) ||
      typeof e.description !== "string" ||
      e.description.length > 300 ||
      !Array.isArray(e.tags) ||
      e.tags.length > 20 ||
      e.tags.some((t) => typeof t !== "string" || t.length > 40) ||
      !isDate(e.date)
    )
      throw new Error("The export contains an invalid or duplicate expense.");
    ids.add(e.id);
  }
  for (const [month, b] of Object.entries(s.budgets)) {
    if (
      !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) ||
      !b ||
      typeof b !== "object" ||
      Object.keys(defaultBudget).some(
        (k) =>
          !Number.isSafeInteger(b[k as keyof Budget]) ||
          b[k as keyof Budget] < 0 ||
          b[k as keyof Budget] > 100000000,
      )
    )
      throw new Error("The export contains an invalid monthly budget.");
  }
  return s;
}
function isDate(date: unknown) {
  return (
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    !isNaN(Date.parse(date)) &&
    new Date(date + "T12:00:00Z").toISOString().slice(0, 10) === date
  );
}
export function budgetForMonth(budgets: Record<string, Budget>, month: string) {
  const previous = Object.keys(budgets)
    .filter((m) => m <= month)
    .sort()
    .at(-1);
  return (
    budgets[month] ?? (previous ? budgets[previous] : { ...defaultBudget })
  );
}
async function request(method: string, body?: unknown) {
  const response = await fetch("/api/pocket", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Could not save your expenses.");
  return data;
}
export async function loadSnapshot(_userId?: string): Promise<Snapshot> {
  return validateSnapshot(await request("GET"));
}
export async function saveExpense(
  e: Expense,
  _snapshot: Snapshot,
  _userId?: string,
) {
  await request("POST", { action: "expense", expense: e });
}
export async function removeExpense(
  id: string,
  _snapshot: Snapshot,
  _userId?: string,
) {
  await request("POST", { action: "delete", id });
}
export async function saveBudget(
  month: string,
  values: Budget,
  _snapshot: Snapshot,
  _userId?: string,
) {
  await request("POST", { action: "budget", month, values });
}
export async function mergeImport(
  imported: Snapshot,
  snapshot: Snapshot,
  _userId?: string,
) {
  for (let i = 0; i < imported.expenses.length; i += 200)
    await request("POST", {
      action: "import",
      snapshot: {
        version: 1,
        expenses: imported.expenses.slice(i, i + 200),
        budgets: {},
      },
    });
  for (const [month, plan] of Object.entries(imported.budgets))
    await saveBudget(month, plan, snapshot);
  return await loadSnapshot();
}
export function downloadSnapshot(s: Snapshot) {
  const blob = new Blob([JSON.stringify(s, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pocket-expenses.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
