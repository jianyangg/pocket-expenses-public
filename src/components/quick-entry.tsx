"use client";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  parseEntry,
  todayInNewYork,
  type Bucket,
  type Expense,
} from "@/lib/budget";
import { useVisualViewport } from "@/lib/use-visual-viewport";
import { formatAmountInput } from "@/lib/amount-input";
import TagPicker from "./tag-picker";
import { normalizeTags } from "@/lib/entry-tags";
export const bucketLabels: Record<Bucket, string> = {
  discretionary: "Discretionary",
  groceries: "Groceries",
  bill: "Bill / transit",
  investment: "Investment",
  fixed: "Past fixed purchase",
  reserved: "Renewals / refills",
  review: "Needs review",
};
export default function QuickEntry({
  onSave,
  busy,
  editing,
  onCancel,
  expenses,
}: {
  onSave: (e: Expense) => Promise<boolean>;
  busy: boolean;
  editing?: Expense;
  onCancel?: () => void;
  expenses: Expense[];
}) {
  const [amount, setAmount] = useState(
    editing ? (Math.abs(editing.amount) / 100).toFixed(2) : "",
  );
  const [name, setName] = useState(editing?.description ?? "");
  const [tags, setTags] = useState<string[]>(editing?.tags ?? []);
  const [tagQuery, setTagQuery] = useState("");
  const [refund, setRefund] = useState((editing?.amount ?? 0) < 0);
  const amountRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const tagRef = useRef<HTMLInputElement>(null);
  const counts = new Map<string, number>();
  for (const expense of expenses)
    for (const tag of expense.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  const existingTags = [...counts]
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
  for (const tag of [
    "dining",
    "groceries",
    "shopping",
    "utilities",
    "insurance",
    "transit",
    "subscriptions",
  ])
    if (!counts.has(tag)) existingTags.push(tag);
  const preferredTags =
    [...expenses]
      .sort((a, b) => b.date.localeCompare(a.date))
      .find(
        (e) => e.description.toLowerCase().trim() === name.toLowerCase().trim(),
      )?.tags ?? [];
  const recentNames = [
    ...new Set(
      [...expenses]
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((e) => e.description),
    ),
  ].slice(0, 12);
  const [bucket, setBucket] = useState<Bucket>(
    editing?.bucket ?? "discretionary",
  );
  const [date, setDate] = useState(editing?.date ?? todayInNewYork());
  const [error, setError] = useState("");
  const [open, setOpen] = useState(!!editing);
  const [step, setStep] = useState(0);
  const viewportStyle = useVisualViewport(open);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open && !dialogRef.current?.open) {
      dialogRef.current?.showModal();
      amountRef.current?.focus();
    }
    if (!open && dialogRef.current?.open) dialogRef.current.close();
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  function close() {
    if (busy) return;
    setOpen(false);
    onCancel?.();
    addRef.current?.focus();
  }
  function move(next: number) {
    flushSync(() => {
      setStep(next);
      setError("");
    });
    [amountRef, nameRef, tagRef][next].current?.focus();
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const parsed = parseEntry(`${refund ? "-" : ""}${amount} entry`);
      if (step === 0) {
        move(1);
        return;
      }
      if (!name.trim()) throw new Error("Add a description.");
      if (name.trim().length > 300)
        throw new Error("Keep the description under 300 characters.");
      if (step === 1) {
        move(2);
        return;
      }
      const chosenTags = [...new Set([...tags, ...normalizeTags(tagQuery)])];
      if (chosenTags.length > 20 || chosenTags.some((t) => t.length > 40))
        throw new Error("Use up to 20 tags, each under 40 characters.");
      const success = await onSave({
        id: editing?.id ?? crypto.randomUUID(),
        amount: parsed.amount,
        description: name.trim(),
        tags: chosenTags,
        bucket: chosenTags.includes("groceries") ? "groceries" : bucket,
        date,
      });
      if (!success) {
        setError("Could not save. Please try again.");
        return;
      }
      setAmount("");
      setName("");
      setTags([]);
      setTagQuery("");
      setRefund(false);
      setBucket("discretionary");
      setDate(todayInNewYork());
      setOpen(false);
      setStep(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check your entry.");
    }
  }
  return (
    <>
      <button
        ref={addRef}
        className="add-expense-button"
        aria-label="Add expense"
        onClick={() => {
          flushSync(() => {
            setStep(0);
            setError("");
            setOpen(true);
          });
          if (!dialogRef.current?.open) dialogRef.current?.showModal();
          amountRef.current?.focus();
        }}
      >
        +
      </button>
      <dialog
        ref={dialogRef}
        className="expense-dialog"
        style={viewportStyle as React.CSSProperties}
        aria-labelledby="expense-dialog-title"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
      >
        <div className="section-head">
          <h2 id="expense-dialog-title">
            {["Amount", "Description", "Tags"][step]}
          </h2>
          <button
            type="button"
            className="quiet"
            aria-label="Close expense entry"
            disabled={busy}
            onClick={close}
          >
            ×
          </button>
        </div>
        <form onSubmit={submit}>
          <div hidden={step !== 0}>
            <label htmlFor="expense-amount" className="sr-only">
              Amount
            </label>
            <div className="amount-field">
              <span>$</span>
              <input
                id="expense-amount"
                ref={amountRef}
                inputMode="numeric"
                enterKeyHint="next"
                placeholder="0.00"
                value={amount}
                autoComplete="off"
                onChange={(e) => {
                  const input = e.currentTarget;
                  setAmount(formatAmountInput(input.value));
                  requestAnimationFrame(() =>
                    input.setSelectionRange(
                      input.value.length,
                      input.value.length,
                    ),
                  );
                }}
              />
            </div>
          </div>
          <div hidden={step !== 1}>
            <label htmlFor="expense-description" className="sr-only">
              Description
            </label>
            <input
              id="expense-description"
              ref={nameRef}
              placeholder="Lunch, groceries…"
              value={name}
              maxLength={300}
              autoComplete="off"
              list="recent-expense-names"
              enterKeyHint="next"
              onChange={(e) => setName(e.target.value)}
            />
            <datalist id="recent-expense-names">
              {recentNames.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </div>
          <div hidden={step !== 2}>
            <TagPicker
              ref={tagRef}
              compact
              preferred={preferredTags}
              tags={tags}
              query={tagQuery}
              existing={existingTags}
              onTags={(next) => {
                setTags(next);
                if (next.includes("groceries")) setBucket("groceries");
              }}
              onQuery={setTagQuery}
            />
            <details className="expense-extra-options">
              <summary>Date, category or refund</summary>
              <label>
                Date
                <input
                  aria-label="Expense date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
              <label>
                Category
                <select
                  value={bucket}
                  onChange={(e) => setBucket(e.target.value as Bucket)}
                >
                  {Object.entries(bucketLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="refund-option">
                <input
                  type="checkbox"
                  checked={refund}
                  onChange={(e) => setRefund(e.target.checked)}
                />
                This is a refund
              </label>
            </details>
          </div>
          {error ? (
            <p role="alert" className="error">
              {error}
            </p>
          ) : null}
          <div className="expense-step-actions">
            {step > 0 ? (
              <button
                type="button"
                className="quiet"
                disabled={busy}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => move(step - 1)}
              >
                Back
              </button>
            ) : null}
            <button
              type="submit"
              disabled={busy}
              onPointerDown={(e) => e.preventDefault()}
            >
              {busy
                ? "Saving…"
                : step < 2
                  ? "Next"
                  : editing
                    ? "Save changes"
                    : "Save expense"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
