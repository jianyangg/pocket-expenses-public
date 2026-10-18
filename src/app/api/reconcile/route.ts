import { currentUser } from "@/lib/auth/server";
import { readSnapshot } from "@/lib/database";
import { bankQuery } from "@/lib/bank/store";
import {
  matchPurchase,
  undoMatch,
  includeSeparate,
  excludePurchase,
} from "@/lib/bank/reconcile";
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });
  try {
    const body = await request.json();
    if (
      body.action === "match" &&
      typeof body.bankId === "string" &&
      typeof body.expenseId === "string"
    ) {
      const snapshot = await readSnapshot(user);
      const manual = snapshot.expenses.find(
        (e) => e.id === body.expenseId && e.source === "manual",
      );
      if (!manual) throw Error("Manual purchase unavailable");
      await matchPurchase(user, body.bankId, manual);
    } else if (body.action === "separate" && typeof body.bankId === "string")
      await includeSeparate(user, body.bankId);
    else if (body.action === "undo" && typeof body.expenseId === "string")
      await undoMatch(user, body.expenseId);
    else if (body.action === "ignore" && typeof body.bankId === "string")
      await excludePurchase(user, body.bankId);
    else throw Error("Invalid match request");
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Could not reconcile. Retry." },
      { status: 409 },
    );
  }
}
