export function normalizeTags(input: string) {
  return [
    ...new Set(
      input
        .split(/[\s,#]+/u)
        .filter(Boolean)
        .map((t) => t.toLowerCase()),
    ),
  ];
}
export function suggestedTags(
  existing: string[],
  query: string,
  selected: string[],
) {
  const term = query.replace(/^#/, "").toLowerCase().trim();
  return [...new Set(existing)].filter(
    (t) => !selected.includes(t) && t.includes(term),
  );
}
