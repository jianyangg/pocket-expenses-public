"use client";
import { useEffect, useRef, useState } from "react";
import { reviewShortcut } from "@/lib/review-shortcuts";
import { expenseCategory } from "@/lib/money-flow";
import { money, type Expense, type Bucket } from "@/lib/budget";
import { swipeAction } from "@/lib/review-queue";
import { normalizeTags } from "@/lib/entry-tags";
import {
  chooseReviewCategory,
  selectedReviewCategory,
  reviewCategories,
} from "@/lib/review-classification";
import { bucketLabels } from "@/lib/expense-labels";
import type { ExpenseSpread } from "@/lib/expense-schedule";
import BankTransactionDetails from "./bank-transaction-details";
import InlineExpenseNote from "./inline-expense-note";
import SpreadControls from "./spread-controls";
import TagPicker from "./tag-picker";
export default function ExpenseReviewCard({
  expense,
  tags: existing,
  disabled,
  onFinish,
  onSaveNote,
}: {
  expense: Expense;
  tags: string[];
  disabled: boolean;
  onFinish: (e: Expense, save: boolean) => Promise<void>;
  onSaveNote: (id: string, note: string) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState(expense),
    [query, setQuery] = useState(""),
    [spread, setSpread] = useState<ExpenseSpread | null>(
      expense.spread ?? null,
    ),
    [drag, setDrag] = useState(0),
    [options, setOptions] = useState(false);
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  async function finish(value: Expense, save = true) {
    setDrag(0);
    await onFinish(
      {
        ...value,
        spread: ["essential", "investments", "transfer"].includes(
          expenseCategory(value),
        )
          ? null
          : spread,
        tags: [...new Set([...value.tags, ...normalizeTags(query)])],
      },
      save,
    );
  }
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      const action = reviewShortcut(event.key, {
        typing: !!target?.closest(
          'input,textarea,select,[contenteditable="true"],[role="textbox"]',
        ),
        modified: event.metaKey || event.ctrlKey || event.altKey,
        repeat: event.repeat,
        blocked:
          disabled ||
          !!document.querySelector("dialog[open]") ||
          !!target?.closest(".match-inbox"),
      });
      if (!action) return;
      event.preventDefault();
      if (action === "more") setOptions((v) => !v);
      else void finish(chooseReviewCategory(draft, action));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draft, spread, query, disabled, onFinish]);
  return (
    <>
      <article
        className="panel review-card"
        style={{ transform: `translateX(${drag}px) rotate(${drag / 25}deg)` }}
      >
        <div
          className="review-swipe-zone"
          onPointerDown={(e) => {
            if (
              disabled ||
              options ||
              e.button !== 0 ||
              (e.target as HTMLElement).closest(
                "a,button,input,summary,details",
              )
            )
              return;
            pointer.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (pointer.current?.id === e.pointerId)
              setDrag(
                Math.max(-160, Math.min(160, e.clientX - pointer.current.x)),
              );
          }}
          onPointerCancel={() => {
            pointer.current = null;
            setDrag(0);
          }}
          onPointerUp={(e) => {
            if (pointer.current?.id !== e.pointerId) return;
            const action = swipeAction(
              e.clientX - pointer.current.x,
              e.clientY - pointer.current.y,
            );
            pointer.current = null;
            setDrag(0);
            if (action === "options") setOptions(true);
            else if (action)
              void finish(
                chooseReviewCategory(
                  draft,
                  action === "groceries" ? "groceries" : "shopping",
                ),
              );
          }}
        >
          <span className="review-date">{expense.date}</span>
          <h2>{expense.description}</h2>
          <strong className="review-amount">{money(expense.amount)}</strong>
          <BankTransactionDetails details={expense.bankDetails} />
        </div>
        <InlineExpenseNote
          expense={expense}
          busy={disabled}
          onSave={onSaveNote}
        />
        {options ? (
          <fieldset disabled={disabled} className="review-choice-panel">
            <legend>Choose a category</legend>
            <div className="review-category-grid">
              {reviewCategories.map((c, index) => (
                <button
                  type="button"
                  key={c.key}
                  aria-pressed={selectedReviewCategory(draft) === c.key}
                  onClick={() => {
                    setDraft(chooseReviewCategory(draft, c.key));
                    if (["utilities", "insurance", "rent"].includes(c.key))
                      setSpread(null);
                  }}
                >
                  {c.label}
                  <kbd className="review-key">{index + 1}</kbd>
                </button>
              ))}
            </div>
            <details className="review-other-category">
              <summary>Other categories</summary>
              <label className="sr-only" htmlFor={"other-" + expense.id}>
                Other category
              </label>
              <select
                id={"other-" + expense.id}
                value={
                  ["investment", "transfer", "fixed"].includes(draft.bucket)
                    ? draft.bucket
                    : ""
                }
                onChange={(e) =>
                  setDraft({ ...draft, bucket: e.target.value as Bucket })
                }
              >
                <option value="" disabled>
                  Choose another category
                </option>
                {Object.entries(bucketLabels)
                  .filter(([key]) =>
                    ["investment", "transfer", "fixed"].includes(key),
                  )
                  .map(([key, label]) => (
                    <option value={key} key={key}>
                      {label}
                    </option>
                  ))}
              </select>
            </details>
            <details className="review-extra-tags">
              <summary>
                Extra tags
                {draft.tags.filter((t) => !["chase", "review"].includes(t))
                  .length
                  ? ` · ${draft.tags
                      .filter((t) => !["chase", "review"].includes(t))
                      .map((t) => "#" + t)
                      .join(" ")}`
                  : ""}
              </summary>
              <TagPicker
                compact
                tags={draft.tags.filter(
                  (t) => !["chase", "review"].includes(t),
                )}
                query={query}
                existing={existing.filter(
                  (t) => !["chase", "review"].includes(t),
                )}
                onQuery={setQuery}
                onTags={(tags) =>
                  setDraft({
                    ...draft,
                    tags: [
                      ...draft.tags.filter((t) =>
                        ["chase", "review"].includes(t),
                      ),
                      ...tags,
                    ],
                  })
                }
              />
            </details>
            {expense.amount > 0 &&
            !["essential", "investments", "transfer"].includes(
              expenseCategory(draft),
            ) ? (
              <SpreadControls
                value={spread}
                onChange={(value) => {
                  setSpread(value);
                  if (!value && draft.bucket === "fixed")
                    setDraft({ ...draft, bucket: "discretionary" });
                }}
                amount={expense.amount}
                disabled={disabled}
              />
            ) : null}
          </fieldset>
        ) : null}
      </article>
      {options ? (
        <div className="review-choice-actions">
          <button
            className="quiet"
            disabled={disabled}
            onClick={() => setOptions(false)}
          >
            Back
          </button>
          <button disabled={disabled} onClick={() => void finish(draft)}>
            Save category
          </button>
        </div>
      ) : (
        <div className="review-actions">
          <button
            disabled={disabled}
            onClick={() =>
              void finish(chooseReviewCategory(draft, "groceries"))
            }
          >
            ← Groceries <kbd className="review-key">1</kbd>
          </button>
          <button
            className="quiet"
            disabled={disabled}
            onClick={() => setOptions(true)}
          >
            More
          </button>
          <button
            disabled={disabled}
            onClick={() => void finish(chooseReviewCategory(draft, "shopping"))}
          >
            Shopping → <kbd className="review-key">2</kbd>
          </button>
        </div>
      )}
      <details className="desktop-review-shortcuts">
        <summary>Keyboard shortcuts</summary>
        <div>
          {reviewCategories.map((c, i) => (
            <span key={c.key}>
              <kbd>{i + 1}</kbd> {c.label}
            </span>
          ))}
          <span>
            <kbd>M</kbd> More options
          </span>
        </div>
        <small>Number keys save the category and show the next purchase.</small>
      </details>
      <button
        className="quiet review-later"
        disabled={disabled}
        onClick={() => void finish(draft, false)}
      >
        Decide later
      </button>
    </>
  );
}
