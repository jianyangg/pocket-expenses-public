import type { BankStatus } from "@/lib/bank/types";
function timestamp(value: string | null | undefined) {
  return value
    ? new Date(value).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Unavailable";
}
export default function BankSyncSummary({ state }: { state: BankStatus }) {
  return (
    <div className="bank-sync-summary">
      <dl>
        <div>
          <dt>Pocket last checked</dt>
          <dd>
            {state.lastSynced ? timestamp(state.lastSynced) : "Not checked yet"}
          </dd>
        </div>
        <div>
          <dt>Bank data last fetched by Plaid</dt>
          <dd>{timestamp(state.bankUpdatedAt)}</dd>
        </div>
      </dl>
      <p className="hint">
        Pocket checks every 5 minutes while open. Check now retrieves what Plaid
        already has; it does not force a bank update.
      </p>
      <details>
        <summary>Missing a recent purchase?</summary>
        <p className="hint">
          Banks update through Plaid on their own schedule; the next update time
          is unavailable. Pending purchases appear when Plaid supplies them. You
          can add a purchase manually now; Pocket checks for duplicates when it
          arrives from your bank.
        </p>
      </details>
    </div>
  );
}
