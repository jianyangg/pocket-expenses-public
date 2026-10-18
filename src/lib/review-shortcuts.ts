import { reviewCategories, type ReviewCategory } from "./review-classification";
export function reviewShortcut(
  key: string,
  context: {
    typing?: boolean;
    modified?: boolean;
    repeat?: boolean;
    blocked?: boolean;
  } = {},
): ReviewCategory | "more" | null {
  if (context.typing || context.modified || context.repeat || context.blocked)
    return null;
  if (key.toLowerCase() === "m") return "more";
  if (!/^[1-8]$/.test(key)) return null;
  return reviewCategories[Number(key) - 1]?.key ?? null;
}
