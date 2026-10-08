import { normalizeTags } from "./entry-tags";
const families = [
  ["shopping", "clothes", "clothing", "fashion"],
  ["food", "dining", "restaurant", "restaurants"],
  ["grocery", "groceries"],
  ["subscription", "subscriptions"],
];
export function quickTagOptions(
  existing: string[],
  query: string,
  selected: string[],
  preferred: string[] = [],
) {
  const chosen = new Set(normalizeTags(selected.join(" ")));
  const term = query.replace(/^#/, "").toLowerCase().trim();
  const candidates = normalizeTags(
    [...preferred, ...existing].join(" "),
  ).filter((t) => !chosen.has(t));
  if (term) return candidates.filter((t) => t.includes(term)).slice(0, 8);
  const result: string[] = [];
  for (const tag of candidates) {
    if (tag === "chase") continue;
    const family = families.find((g) => g.includes(tag));
    if (family && result.some((t) => family.includes(t))) continue;
    result.push(tag);
    if (result.length === 4) break;
  }
  return result;
}
