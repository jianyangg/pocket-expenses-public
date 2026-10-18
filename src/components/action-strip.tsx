export default function ActionStrip({
  count,
  onReview,
  onInvest,
  onRefund,
}: {
  count: number;
  onReview: () => void;
  onInvest: () => void;
  onRefund: () => void;
}) {
  return (
    <div className="action-strip">
      <button onClick={onReview} className={count ? "action-review" : "quiet"}>
        <span>{count ? count : "✓"}</span>
        {count ? "Review purchases" : "All reviewed"}
        {count ? <b aria-hidden="true">›</b> : null}
      </button>
      <div>
        <button className="quiet" onClick={onInvest}>
          ↗ Log investment
        </button>
        <button className="quiet" onClick={onRefund}>
          ↩ Add refund
        </button>
      </div>
    </div>
  );
}
