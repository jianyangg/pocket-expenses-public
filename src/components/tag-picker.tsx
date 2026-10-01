"use client";
import { forwardRef } from "react";
import { normalizeTags, suggestedTags } from "@/lib/entry-tags";
type Props = {
  tags: string[];
  query: string;
  existing: string[];
  onTags: (tags: string[]) => void;
  onQuery: (query: string) => void;
};
const TagPicker = forwardRef<HTMLInputElement, Props>(function TagPicker(
  { tags, query, existing, onTags, onQuery },
  ref,
) {
  const suggestions = suggestedTags(existing, query, tags);
  const pending = normalizeTags(query);
  const choose = (values: string[]) => {
    onTags([...new Set([...tags, ...values])]);
    onQuery("");
  };
  return (
    <div className="tag-picker">
      <label htmlFor="expense-tags">Tags</label>
      <div className="tag-input-row">
        {tags.map((tag) => (
          <button
            type="button"
            className="tag-chip"
            key={tag}
            aria-label={`Remove ${tag} tag`}
            onClick={() => onTags(tags.filter((t) => t !== tag))}
          >
            #{tag} ×
          </button>
        ))}
        <input
          id="expense-tags"
          ref={ref}
          value={query}
          placeholder={tags.length ? "Add another tag" : "Choose or type a tag"}
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
          <button type="button" key={tag} onClick={() => choose([tag])}>
            #{tag}
          </button>
        ))}
        {pending.length > 0 &&
        pending.some((t) => !existing.includes(t) && !tags.includes(t)) ? (
          <button type="button" onClick={() => choose(pending)}>
            Add {pending.map((t) => "#" + t).join(" ")}
          </button>
        ) : null}
      </div>
    </div>
  );
});
export default TagPicker;
