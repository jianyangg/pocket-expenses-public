import { currentUser } from "@/lib/auth/server";
import { todayInNewYork } from "@/lib/budget";
import { plaid } from "@/lib/bank/client";
import { seal, unseal } from "@/lib/bank/crypto";
import {
  bankQuery,
  connections,
  credentials,
  signingKey,
  status,
} from "@/lib/bank/store";
import { syncBank } from "@/lib/bank/sync";
import { toExpense } from "@/lib/bank/transactions";
import type { BankTransaction } from "@/lib/bank/types";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 });
  try {
    return Response.json(await status(user), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Bank connection is unavailable." },
      { status: 500 },
    );
  }
}
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 });
  try {
    const body = await request.json();
    const origin = new URL(request.url).origin;
    const config = await credentials(user);
    if (!config)
      return Response.json({ error: "Set up Plaid first." }, { status: 400 });
    if (body.action === "link") {
      const items = await connections(user);
      const item = items[0];
      const result = await plaid<{ link_token: string }>(
        config,
        "/link/token/create",
        {
          client_name: "Pocket",
          user: { client_user_id: user },
          language: "en",
          country_codes: ["US"],
          redirect_uri: origin + "/bank-return",
          webhook: origin + "/api/bank/webhook",
          ...(item
            ? { access_token: unseal(item.token, signingKey()) }
            : {
                products: ["transactions"],
                transactions: { days_requested: 90 },
              }),
        },
      );
      return Response.json({ token: result.link_token, update: Boolean(item) });
    }
    if (body.action === "exchange") {
      if ((await connections(user)).length)
        return Response.json(
          { error: "Bank already connected. Use Sync or reconnect." },
          { status: 409 },
        );
      if (typeof body.publicToken !== "string" || body.publicToken.length > 300)
        return Response.json(
          { error: "Invalid bank authorization." },
          { status: 400 },
        );
      const result = await plaid<{ access_token: string; item_id: string }>(
        config,
        "/item/public_token/exchange",
        { public_token: body.publicToken },
      );
      await bankQuery(
        user,
        "insert into bank_connections(user_id,item_id,token,start_date) values($1,$2,$3,$4)",
        [
          user,
          result.item_id,
          seal(result.access_token, signingKey()),
          todayInNewYork().slice(0, 7) + "-01",
        ],
      );
      // Historical data arrives asynchronously; the signed webhook completes the import.
      try {
        await syncBank(user, true);
      } catch {}
      return Response.json({ ok: true });
    }
    if (body.action === "sync") {
      await syncBank(user);
      return Response.json(await status(user));
    }
    if (body.action === "disconnect") {
      for (const item of await connections(user)) {
        await plaid(config, "/item/remove", {
          access_token: unseal(item.token, signingKey()),
        });
        await bankQuery(
          user,
          "delete from bank_connections where item_id=$1 and user_id=$2",
          [item.item_id, user],
        );
      }
      return Response.json({ ok: true });
    }
    if (body.action === "review") {
      if (
        typeof body.id !== "string" ||
        !["include", "ignore"].includes(body.choice)
      )
        return Response.json({ error: "Invalid review." }, { status: 400 });
      const rows = await bankQuery(
        user,
        "select data from bank_transactions where transaction_id=$1 and user_id=$2 and decision='review' and active=true",
        [body.id, user],
      );
      if (!rows.length)
        return Response.json({ error: "Already reviewed." }, { status: 409 });
      const e =
        body.choice === "include"
          ? toExpense(rows[0].data as BankTransaction)
          : null;
      if (e)
        await bankQuery(
          user,
          `with claimed as (update bank_transactions set decision='imported',expense_id=$3,owned=true where transaction_id=$1 and user_id=$2 and decision='review' and active=true returning transaction_id) insert into expenses(id,user_id,amount,description,tags,bucket,date) select $3,$2,$4,$5,$6,$7,$8::date from claimed`,
          [
            body.id,
            user,
            e.id,
            e.amount,
            e.description,
            e.tags,
            e.bucket,
            e.date,
          ],
        );
      else
        await bankQuery(
          user,
          "update bank_transactions set decision='ignored',expense_id=null,owned=false where transaction_id=$1 and user_id=$2 and decision='review'",
          [body.id, user],
        );
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Unknown bank action." }, { status: 400 });
  } catch {
    return Response.json(
      {
        error:
          "Could not complete the bank request. Check Plaid credentials and the registered redirect URL, or retry syncing.",
      },
      { status: 502 },
    );
  }
}
