import { money, type Expense } from "@/lib/budget";
export default function DuplicateChoice({
  entry,
  candidates,
  busy,
  onMatch,
  onSeparate,
}: {
  entry: Expense;
  candidates: Expense[];
  busy: boolean;
  onMatch: (id: string) => void;
  onSeparate: () => void;
}) {
  return (
    <div className="duplicate-choice">
      <h3>Already in your bank feed?</h3>
      <p className="hint">
        You entered {money(entry.amount)} for {entry.description}. Count a
        matching purchase once, using its bank amount.
      </p>
      {candidates.map((e) => (
        <button
          type="button"
          className="match-option"
          disabled={busy}
          key={e.id}
          onClick={() => onMatch(e.id)}
        >
          <span>
            {e.description}
            <small>{e.date} · Use bank amount</small>
          </span>
          <strong>{money(e.amount)}</strong>
        </button>
      ))}
      <button
        type="button"
        className="quiet"
        disabled={busy}
        onClick={onSeparate}
      >
        Separate purchase · save mine too
      </button>
    </div>
  );
}
