"use client";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  parseEntry,
  todayInNewYork,
  type Expense,
  type Bucket,
} from "./budget";
import { useVisualViewport } from "./use-visual-viewport";
import { validateSpread, type ExpenseSpread } from "./expense-schedule";
import { possibleMatches } from "./purchase-matching";
import { normalizeTags } from "./entry-tags";
export type EntryKind = "spend" | "investment" | "refund";
export type EntryProps = {
  onSave: (
    e: Expense,
    resolution?: { matchId?: string; separate?: boolean },
  ) => Promise<boolean>;
  busy: boolean;
  editing?: Expense;
  onCancel?: () => void;
  expenses: Expense[];
};
export function useExpenseEntry({
  onSave,
  busy,
  editing,
  onCancel,
  expenses,
}: EntryProps) {
  const [amount, setAmount] = useState(
    editing ? (Math.abs(editing.amount) / 100).toFixed(2) : "",
  );
  const [name, setName] = useState(editing?.description ?? "");
  const [tags, setTags] = useState<string[]>(editing?.tags ?? []);
  const [tagQuery, setTagQuery] = useState("");
  const [spread, setSpread] = useState<ExpenseSpread | null>(
    editing?.spread ?? null,
  );
  const [kind, setKind] = useState<EntryKind>(
    editing?.bucket === "investment"
      ? "investment"
      : (editing?.amount ?? 0) < 0
        ? "refund"
        : "spend",
  );
  const [settled, setSettled] = useState(editing?.settled ?? false);
  const [payment, setPayment] = useState<"card" | "cash">(
    editing?.payment ?? "card",
  );
  const [refundOf, setRefundOf] = useState<string | null>(
    editing?.refundOf ?? null,
  );
  const [draft, setDraft] = useState<Expense | null>(null);
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
  const [step, setStep] = useState(editing ? 2 : 0);
  const viewportStyle = useVisualViewport(open);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open && !dialogRef.current?.open) {
      dialogRef.current?.showModal();
      (editing ? tagRef : amountRef).current?.focus();
    }
    if (!open && dialogRef.current?.open) dialogRef.current.close();
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  function openEntry(next: EntryKind) {
    flushSync(() => {
      setAmount("");
      setTags([]);
      setTagQuery("");
      setPayment("card");
      setSettled(false);
      setRefundOf(null);
      setDate(todayInNewYork());
      setKind(next);
      setRefund(next === "refund");
      setSpread(null);
      setBucket(next === "investment" ? "investment" : "discretionary");
      setName(next === "investment" ? "Investment" : "");
      setDraft(null);
      setStep(0);
      setError("");
      setOpen(true);
    });
    if (!dialogRef.current?.open) dialogRef.current?.showModal();
    amountRef.current?.focus();
  }
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
  async function complete(
    entry: Expense,
    resolution?: { matchId?: string; separate?: boolean },
  ) {
    const success = await onSave(entry, resolution);
    if (!success) {
      setError("Could not save. Your entry is still here; please retry.");
      return;
    }
    setAmount("");
    setName("");
    setTags([]);
    setTagQuery("");
    setRefund(false);
    setRefundOf(null);
    setSpread(null);
    setDraft(null);
    setPayment("card");
    setSettled(false);
    setBucket("discretionary");
    setDate(todayInNewYork());
    setOpen(false);
    setStep(0);
    setKind("spend");
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
      if (step === 1 && kind !== "investment") {
        move(2);
        return;
      }
      const chosenTags = [...new Set([...tags, ...normalizeTags(tagQuery)])];
      if (chosenTags.length > 20 || chosenTags.some((t) => t.length > 40))
        throw new Error("Use up to 20 tags, each under 40 characters.");
      const entry: Expense = {
        ...editing,
        id: editing?.id ?? crypto.randomUUID(),
        amount: parsed.amount,
        description: name.trim(),
        tags: chosenTags,
        bucket: chosenTags.includes("groceries") ? "groceries" : bucket,
        date,
        spread,
        payment,
        settled,
        refundOf,
        reviewed: editing?.reviewed ?? true,
      };
      validateSpread(entry);
      if (
        !editing &&
        payment !== "cash" &&
        possibleMatches(
          entry,
          expenses.filter((e) => e.source === "bank"),
        ).length
      ) {
        setDraft(entry);
        return;
      }
      await complete(entry);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check your entry.");
    }
  }

  return {
    amount,
    setAmount,
    name,
    setName,
    tags,
    setTags,
    tagQuery,
    setTagQuery,
    spread,
    setSpread,
    kind,
    setKind,
    payment,
    setPayment,
    settled,
    setSettled,
    refundOf,
    setRefundOf,
    draft,
    refund,
    setRefund,
    amountRef,
    nameRef,
    tagRef,
    existingTags,
    preferredTags,
    recentNames,
    bucket,
    setBucket,
    date,
    setDate,
    error,
    open,
    step,
    viewportStyle,
    dialogRef,
    addRef,
    close,
    move,
    submit,
    complete,
    openEntry,
  };
}
