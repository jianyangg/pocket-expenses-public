import { bankFreshness } from "./freshness";
import { unseal } from "./crypto";
import { database } from "../database";
import type { Credentials } from "./client";
import type { BankStatus, Connection, TransactionRecord } from "./types";
export function signingKey() {
  return (
    process.env.POCKET_BANK_KEY || process.env.NEON_AUTH_COOKIE_SECRET || ""
  );
}
export async function bankQuery(
  userId: string,
  statement: string,
  values: unknown[] = [],
) {
  const sql = database();
  const results = await sql.transaction([
    sql`set local role pocket_app`,
    sql`select set_config('app.user_id',${userId},true)`,
    sql.query(statement, values),
  ]);
  return results[2];
}
export async function credentials(
  _userId: string,
): Promise<Credentials | null> {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;
  return clientId && secret
    ? {
        clientId,
        secret,
        environment:
          process.env.PLAID_ENV === "sandbox" ? "sandbox" : "production",
      }
    : null;
}
export async function connections(userId: string): Promise<Connection[]> {
  return (await bankQuery(
    userId,
    "select item_id,token,cursor,to_char(start_date,'YYYY-MM-DD') as start_date,last_synced from bank_connections where user_id=$1",
    [userId],
  )) as Connection[];
}
export async function records(
  userId: string,
  item: string,
): Promise<TransactionRecord[]> {
  return (await bankQuery(
    userId,
    "select transaction_id,expense_id,owned,customized,decision,data from bank_transactions where user_id=$1 and item_id=$2",
    [userId, item],
  )) as TransactionRecord[];
}
export async function status(userId: string): Promise<BankStatus> {
  const config = await credentials(userId);
  const configured = Boolean(config);
  const items = await connections(userId);
  const rows = await bankQuery(
    userId,
    "select transaction_id as id,data->>'name' as description,data->>'date' as date,round((data->>'amount')::numeric*100)::int as amount from bank_transactions where user_id=$1 and decision='review' and active=true order by data->>'date' desc limit 100",
    [userId],
  );
  return {
    configured,
    connected: items.length > 0,
    lastSynced: items[0]?.last_synced || null,
    bankUpdatedAt:
      config && items[0]
        ? await bankFreshness(config, unseal(items[0].token, signingKey()))
        : null,
    reviews: rows as BankStatus["reviews"],
  };
}
