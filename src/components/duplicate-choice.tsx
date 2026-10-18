import BankTransactionDetails from "./bank-transaction-details";
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
        <div key={e.id} className="duplicate-candidate">
          <button
            type="button"
            className={
              "match-option" +
              (candidates.length === 1 ? " match-option-primary" : "")
            }
            disabled={busy}
            onClick={() => onMatch(e.id)}
          >
            <span>
              <strong className="match-option-action">
                Same purchase · count once
              </strong>
              <span className="match-option-description">
                {e.description} · {money(e.amount)}
              </span>
              <small>{e.date} · Use bank amount</small>
            </span>
          </button>
          <BankTransactionDetails details={e.bankDetails} />
        </div>
      ))}
      <button
        type="button"
        className="quiet match-separate"
        disabled={busy}
        onClick={onSeparate}
      >
        Different purchases · keep both
      </button>
    </div>
  );
}
