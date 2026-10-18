"use client";
import { useRef, useState } from "react";
import type { Expense } from "@/lib/budget";
export default function InlineExpenseNote({
  expense,
  busy,
  onSave,
}: {
  expense: Expense;
  busy: boolean;
  onSave: (id: string, note: string) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false),
    [note, setNote] = useState(expense.itemNote ?? ""),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const lock = useRef(false),
    cancel = useRef(false);
  async function save() {
    if (lock.current || cancel.current) return;
    if (note.trim() === (expense.itemNote ?? "")) {
      setEditing(false);
      return;
    }
    lock.current = true;
    setSaving(true);
    setError("");
    try {
      if (await onSave(expense.id, note.trim())) setEditing(false);
      else setError("Not saved. Retry.");
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }
  if (!editing)
    return (
      <button
        className="inline-item-note quiet"
        disabled={busy}
        onClick={() => {
          setNote(expense.itemNote ?? "");
          setError("");
          cancel.current = false;
          setEditing(true);
        }}
        aria-label={"Edit item details for " + expense.description}
      >
        {expense.itemNote || "+ What was this?"}
      </button>
    );
  return (
    <div className="inline-note-editor">
      <input
        autoFocus
        aria-label={"Item details for " + expense.description}
        placeholder="e.g. Desk lamp, laundry top-up"
        maxLength={500}
        value={note}
        disabled={busy || saving}
        onChange={(e) => setNote(e.target.value)}
        onBlur={() => void save()}
        enterKeyHint="done"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void save();
          }
          if (e.key === "Escape") {
            cancel.current = true;
            setEditing(false);
          }
        }}
      />
      <small role="status">
        {saving
          ? "Saving…"
          : error || "Saves when you finish typing and leave the field."}
      </small>
      {error ? (
        <button
          className="quiet"
          onClick={() => void save()}
          disabled={busy || saving}
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
