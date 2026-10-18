import { transactionDetails } from "./transaction-details";
import type { Expense } from "../budget";
import { possibleMatches } from "../purchase-matching";
import { investmentCandidate } from "./transactions";
import type { BankTransaction, DuplicateReview } from "./types";
export function reviewCandidates(
  expenses: Expense[],
  records: {
    transaction_id: string;
    data: BankTransaction;
    decision: string;
    owned: boolean;
    duplicate_checked?: boolean;
  }[],
): DuplicateReview[] {
  const manual = expenses.filter(
    (e) =>
      e.source === "manual" &&
      e.payment !== "cash" &&
      !e.tags.includes("chase"),
  );
  return records.flatMap((row) => {
    if (row.duplicate_checked) return [];
    const data = row.data;
    const purchase: Expense = {
      id: "bank:" + row.transaction_id,
      amount: Math.round(data.amount * 100),
      date: data.authorized_date ?? data.date,
      description: data.merchant_name || data.name,
      tags: [],
      bucket: "discretionary",
      accountId: data.account_id,
    };
    const candidates = possibleMatches(purchase, manual).map((m) => m.expense);
    const needsDecision =
      row.decision === "review" ||
      (row.decision === "imported" && row.owned && candidates.length) ||
      (row.decision === "ignored" && investmentCandidate(data, manual));
    return needsDecision
      ? [
          {
            bankId: row.transaction_id,
            amount: purchase.amount,
            date: purchase.date,
            description: purchase.description,
            candidates,
            bankDetails: transactionDetails(data),
          },
        ]
      : [];
  });
}
