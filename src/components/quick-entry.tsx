"use client";
import { forwardRef, useImperativeHandle } from "react";
import {
  useExpenseEntry,
  type EntryKind,
  type EntryProps,
} from "@/lib/use-expense-entry";
import { formatAmountInput } from "@/lib/amount-input";
import { possibleMatches } from "@/lib/purchase-matching";
import { bucketLabels } from "@/lib/expense-labels";
import type { Bucket } from "@/lib/budget";
import DuplicateChoice from "./duplicate-choice";
import TagPicker from "./tag-picker";
import SpreadControls from "./spread-controls";
export type { EntryKind } from "@/lib/use-expense-entry";
export type QuickEntryHandle = { open: (kind: EntryKind) => void };
const QuickEntry = forwardRef<QuickEntryHandle, EntryProps>((props, ref) => {
  const { busy, editing, expenses } = props;
  const {
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
  } = useExpenseEntry(props);
  useImperativeHandle(ref, () => ({ open: openEntry }));
  return (
    <>
      <button
        ref={addRef}
        className="add-expense-button"
        aria-label="Add expense"
        onClick={() => openEntry("spend")}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" width="26" height="26">
          <path
            d="M12 5v14M5 12h14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="square"
          />
        </svg>
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
        {draft ? (
          <DuplicateChoice
            entry={draft}
            candidates={possibleMatches(
              draft,
              expenses.filter((e) => e.source === "bank"),
            ).map((m) => m.expense)}
            busy={busy}
            onMatch={(id) => void complete(draft, { matchId: id })}
            onSeparate={() => void complete(draft, { separate: true })}
          />
        ) : (
          <form onSubmit={submit}>
            {step === 0 && !editing ? (
              <div className="entry-kinds">
                {(["spend", "investment", "refund"] as EntryKind[]).map((k) => (
                  <button
                    type="button"
                    aria-pressed={kind === k}
                    key={k}
                    onClick={() => {
                      setKind(k);
                      setRefund(k === "refund");
                      setBucket(
                        k === "investment" ? "investment" : "discretionary",
                      );
                      setSpread(null);
                      if (k === "investment") setName("Investment");
                      else if (name === "Investment") setName("");
                      setRefundOf(null);
                      setTags([]);
                      setTagQuery("");
                      amountRef.current?.focus();
                    }}
                  >
                    {k === "spend"
                      ? "Expense"
                      : k === "investment"
                        ? "Investment"
                        : "Refund"}
                  </button>
                ))}
              </div>
            ) : null}
            <div hidden={step !== 0}>
              <label htmlFor="expense-amount" className="sr-only">
                Amount
              </label>
              <div className="amount-field">
                <span>$</span>
                <input
                  id="expense-amount"
                  ref={amountRef}
                  readOnly={
                    !!editing &&
                    (editing.source === "bank" || editing.source === "matched")
                  }
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
              {refund ? (
                <label className="refund-link">
                  Refund for
                  <select
                    value={refundOf ?? ""}
                    onChange={(event) => {
                      const original = expenses.find(
                        (e) => e.id === event.target.value,
                      );
                      setRefundOf(original?.id ?? null);
                      if (original) {
                        setTags(original.tags);
                        setBucket(original.bucket);
                        setName("Refund · " + original.description);
                      }
                    }}
                  >
                    <option value="">
                      Choose original purchase (optional)
                    </option>
                    {[...expenses]
                      .filter(
                        (e) =>
                          e.amount > 0 &&
                          e.bucket !== "transfer" &&
                          e.bucket !== "investment",
                      )
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .slice(0, 100)
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.date} · {e.description} · $
                          {(e.amount / 100).toFixed(2)}
                        </option>
                      ))}
                  </select>
                </label>
              ) : null}
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
              <SpreadControls
                value={spread}
                onChange={setSpread}
                amount={Math.round(Number(amount) * 100)}
                disabled={busy}
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
                <label>
                  Paid with
                  <select
                    value={payment}
                    onChange={(e) =>
                      setPayment(e.target.value as "card" | "cash")
                    }
                  >
                    <option value="card">Bank / card · await matching</option>
                    <option value="cash">
                      Cash · do not match bank imports
                    </option>
                  </select>
                </label>
                <label className="inline-check">
                  <input
                    type="checkbox"
                    checked={settled}
                    onChange={(e) => setSettled(e.target.checked)}
                  />
                  Already reflected in my bank balance
                </label>
                <label className="refund-option">
                  <input
                    type="checkbox"
                    checked={refund}
                    onChange={(e) => setRefund(e.target.checked)}
                  />
                  {kind === "investment"
                    ? "Money returned from investment"
                    : "This is a refund"}
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
                  : step < (kind === "investment" ? 1 : 2)
                    ? "Next"
                    : editing
                      ? "Save changes"
                      : "Save expense"}
              </button>
            </div>
          </form>
        )}
        {draft && error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
      </dialog>
    </>
  );
});
export default QuickEntry;
