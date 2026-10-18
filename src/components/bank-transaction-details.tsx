import type { BankDetails } from "@/lib/bank/transaction-details";
const displayDate = (date: string) =>
  new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
export default function BankTransactionDetails({
  details,
}: {
  details?: BankDetails;
}) {
  if (!details) return null;
  const description = details.originalDescription || details.description;
  const purchase =
    details.purchaseDate && details.purchaseDate !== details.postedDate
      ? displayDate(details.purchaseDate)
      : undefined;
  const extras = [
    ["Merchant location", details.location],
    ["Merchant website", details.website],
    ["Payment method", details.paymentMethod],
    ["Reference", details.reference],
    [
      "Transaction name",
      details.description && details.description !== description
        ? details.description
        : undefined,
    ],
  ].filter((row): row is [string, string] => !!row[1]);
  const amazon =
    details.merchant?.toLowerCase() === "amazon" ||
    /^(www\.)?amazon\.com$/i.test(details.website || "");
  return (
    <div className="transaction-bank-details">
      <div className="transaction-bank-badges">
        <span className={details.pending ? "bank-pending" : ""}>
          {details.pending ? "Pending charge" : "Posted"}
        </span>
        {details.channel ? <span>{details.channel}</span> : null}
      </div>
      {purchase ? (
        <p className="transaction-bank-dates">
          <span>Purchased {purchase}</span>
          {details.postedDate ? (
            <span>Posted {displayDate(details.postedDate)}</span>
          ) : null}
        </p>
      ) : null}
      {description ? (
        <div className="transaction-bank-description">
          <span>Bank description</span>
          <p>{description}</p>
        </div>
      ) : null}
      {details.category ? (
        <p className="transaction-bank-category">
          <span>Bank category</span>
          {details.category}
        </p>
      ) : null}
      {extras.length ? (
        <details className="transaction-bank-more">
          <summary>More bank details</summary>
          <dl>
            {extras.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </details>
      ) : null}
      {amazon ? (
        <a
          className="merchant-orders-link"
          href="https://www.amazon.com/your-orders/orders"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Amazon orders ↗
        </a>
      ) : null}
    </div>
  );
}
