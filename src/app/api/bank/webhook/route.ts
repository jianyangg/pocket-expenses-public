import { credentials, connections } from "@/lib/bank/store";
import { verifyWebhook } from "@/lib/bank/webhook";
import { syncBank } from "@/lib/bank/sync";
export const maxDuration = 60;
export async function POST(request: Request) {
  const owner = process.env.POCKET_OWNER_ID || "pocket-owner";
  try {
    const config = await credentials(owner);
    if (!config) return new Response(null, { status: 401 });
    const body = await request.text();
    if (
      body.length > 100000 ||
      !(await verifyWebhook(
        request.headers.get("plaid-verification") || "",
        body,
        config,
      ))
    )
      return new Response(null, { status: 401 });
    const event = JSON.parse(body);
    const items = await connections(owner);
    if (!items.some((i) => i.item_id === event.item_id))
      return new Response(null, { status: 404 });
    if (
      event.webhook_type === "TRANSACTIONS" &&
      [
        "SYNC_UPDATES_AVAILABLE",
        "INITIAL_UPDATE",
        "HISTORICAL_UPDATE",
        "DEFAULT_UPDATE",
        "TRANSACTIONS_REMOVED",
      ].includes(event.webhook_code)
    )
      await syncBank(owner, true, event.item_id);
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Bank update could not be processed." },
      { status: 500 },
    );
  }
}
