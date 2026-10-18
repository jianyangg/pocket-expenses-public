import type { Expense } from "../budget";
import type { BankTransaction } from "./types";
export type BankDetails = {
  description?: string;
  originalDescription?: string;
  merchant?: string;
  purchaseDate?: string;
  postedDate?: string;
  pending: boolean;
  channel?: string;
  category?: string;
  location?: string;
  website?: string;
  paymentMethod?: string;
  reference?: string;
};
const clean = (value: unknown) =>
  typeof value === "string"
    ? value.trim().slice(0, 500) || undefined
    : undefined;
const date = (value: unknown) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value))
    ? value
    : undefined;
const words = (value: string) => {
  const text = value.toLowerCase().replaceAll("_", " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
};
export function transactionDetails(
  t: BankTransaction | null | undefined,
): BankDetails | undefined {
  if (!t) return undefined;
  const primary = clean(t.personal_finance_category?.primary);
  const detailed = clean(t.personal_finance_category?.detailed);
  const category =
    [primary, detailed?.replace(primary ? primary + "_" : "", "")]
      .filter((v, i, a): v is string => !!v && a.indexOf(v) === i)
      .map(words)
      .join(" · ") || undefined;
  const location =
    [
      t.location?.address,
      t.location?.city,
      t.location?.region,
      t.location?.postal_code,
      t.location?.country,
    ]
      .map(clean)
      .filter((v, i, a) => v && a.indexOf(v) === i)
      .join(", ") || undefined;
  return {
    description: clean(t.name),
    originalDescription: clean(t.original_description),
    merchant: clean(t.merchant_name),
    purchaseDate: date(t.authorized_date),
    postedDate: t.pending ? undefined : date(t.date),
    pending: t.pending,
    channel:
      t.payment_channel === "online"
        ? "Online"
        : t.payment_channel === "in store"
          ? "In store"
          : undefined,
    category,
    location,
    website: clean(t.website),
    paymentMethod: clean(t.payment_meta?.payment_method),
    reference: clean(t.payment_meta?.reference_number),
  };
}
// Project only recognised display fields; never return the raw provider payload.
export function withBankDetails(
  row: Expense & { bankData?: BankTransaction | null },
): Expense {
  const { bankData, ...expense } = row;
  return { ...expense, bankDetails: transactionDetails(bankData) };
}
