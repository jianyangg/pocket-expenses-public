"use client";
import { forwardRef, useId } from "react";
import { quickTagOptions } from "@/lib/quick-tag-options";
import { normalizeTags, suggestedTags } from "@/lib/entry-tags";
type Props = {
  compact?: boolean;
  preferred?: string[];
  tags: string[];
  query: string;
  existing: string[];
  onTags: (tags: string[]) => void;
  onQuery: (query: string) => void;
};
const TagPicker = forwardRef<HTMLInputElement, Props>(function TagPicker(
  { tags, query, existing, onTags, onQuery, compact = false, preferred = [] },
  ref,
) {
  const inputId = useId();
  const existingSet = new Set(normalizeTags(existing.join(" ")));
  const suggestions = compact
    ? quickTagOptions(existing, query, tags, preferred)
    : suggestedTags(existing, query, tags);
  const pending = normalizeTags(query);
  const choose = (values: string[]) => {
    onTags([...new Set([...tags, ...values])]);
    onQuery("");
  };
  return (
    <div className={"tag-picker " + (compact ? "compact-tag-picker" : "")}>
      <label htmlFor={inputId} className={compact ? "sr-only" : undefined}>
        Tags
      </label>
      <div className="selected-tags">
        {tags.map((tag) => (
          <button
            type="button"
            onPointerDown={(e) => e.preventDefault()}
            className="tag-chip"
            key={tag}
            aria-label={`Remove ${tag} tag`}
            onClick={() => onTags(tags.filter((t) => t !== tag))}
          >
            #{tag} ×
          </button>
        ))}
      </div>
      <div className="tag-input-row">
        <input
          id={inputId}
          ref={ref}
          value={query}
          placeholder={
            tags.length ? "Add another tag" : "Search or create a tag"
          }
          autoComplete="off"
          enterKeyHint="done"
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim()) {
              e.preventDefault();
              choose(pending);
            }
            if (e.key === "Backspace" && !query && tags.length)
              onTags(tags.slice(0, -1));
          }}
        />
      </div>
      <div className="tag-suggestions" aria-label="Tag suggestions">
        {suggestions.map((tag) => (
          <button
            type="button"
            onPointerDown={(e) => e.preventDefault()}
            key={tag}
            onClick={() => choose([tag])}
          >
            #{tag}
          </button>
        ))}
        {pending.length > 0 &&
        pending.some((t) => !existingSet.has(t) && !tags.includes(t)) ? (
          <button
            type="button"
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => choose(pending)}
          >
            Add {pending.map((t) => "#" + t).join(" ")}
          </button>
        ) : null}
      </div>
    </div>
  );
});
export default TagPicker;
