import type { Bucket } from "./budget";
export const bucketLabels: Record<Bucket, string> = {
  discretionary: "Discretionary",
  groceries: "Groceries",
  bill: "Bill / transit",
  investment: "Investment",
  fixed: "Past fixed purchase",
  reserved: "Renewals / refills",
  review: "Needs review",
  transfer: "Between my accounts",
};
