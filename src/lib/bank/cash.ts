import { bankQuery, connections, credentials, signingKey } from "./store";
import { unseal } from "./crypto";
import { plaid } from "./client";
import type { CashSnapshot } from "../cash-forecast";
type Accounts = {
  accounts: {
    name: string;
    type: string;
    balances: {
      available: number | null;
      current: number | null;
      iso_currency_code: string | null;
    };
  }[];
};
export async function cashSnapshot(user: string): Promise<CashSnapshot | null> {
  const items = await connections(user);
  if (!items.length) return null;
  const snapshots: CashSnapshot[] = [];
  for (const item of items) {
    const stored = await bankQuery(
      user,
      "select cash_snapshot from bank_connections where user_id=$1 and item_id=$2",
      [user, item.item_id],
    );
    let snapshot = stored[0]?.cash_snapshot as CashSnapshot | undefined;
    if (!snapshot || Date.now() - Date.parse(snapshot.checkedAt) > 15 * 60000) {
      try {
        const config = await credentials(user);
        if (!config) continue;
        const response = await plaid<Accounts>(
          config,
          "/accounts/balance/get",
          { access_token: unseal(item.token, signingKey()) },
        );
        const accounts = response.accounts
          .filter(
            (a) =>
              a.balances.iso_currency_code === "USD" &&
              ["depository", "credit"].includes(a.type),
          )
          .map((a) => ({
            name: a.name,
            available: Math.round(
              (a.type === "credit"
                ? -Math.max(0, a.balances.current ?? 0)
                : (a.balances.available ??
                  Math.min(0, a.balances.current ?? 0))) * 100,
            ),
          }));
        snapshot = {
          accounts,
          available: accounts.reduce((n, a) => n + a.available, 0),
          checkedAt: new Date().toISOString(),
        };
        await bankQuery(
          user,
          "update bank_connections set cash_snapshot=$3::jsonb where user_id=$1 and item_id=$2",
          [user, item.item_id, JSON.stringify(snapshot)],
        );
      } catch {
        if (!snapshot) return null;
      }
    }
    snapshots.push(snapshot);
  }
  if (!snapshots.length) return null;
  return {
    accounts: snapshots.flatMap((s) => s.accounts),
    available: snapshots.reduce((n, s) => n + s.available, 0),
    checkedAt: snapshots.map((s) => s.checkedAt).sort()[0],
  };
}
