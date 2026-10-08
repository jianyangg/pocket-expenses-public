import { plaid, type Credentials } from "./client";
type ItemStatus = {
  status?: { transactions?: { last_successful_update?: string | null } };
};
// A successful sync request does not mean Plaid fetched fresh bank data.
export async function bankFreshness(
  config: Credentials,
  accessToken: string,
): Promise<string | null> {
  try {
    const item = await plaid<ItemStatus>(config, "/item/get", {
      access_token: accessToken,
    });
    const date = item.status?.transactions?.last_successful_update;
    return typeof date === "string" && !Number.isNaN(Date.parse(date))
      ? date
      : null;
  } catch {
    return null;
  }
}
