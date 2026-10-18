import { possibleMatches } from "@/lib/purchase-matching";
import { bankQuery } from "@/lib/bank/store";
import { matchPurchase } from "@/lib/bank/reconcile";
import { currentUser } from "@/lib/auth/server";
import { deleteExpense, readSnapshot, writeSnapshot } from "@/lib/database";
import { validateSnapshot } from "@/lib/storage";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const userId = await currentUser();
    if (!userId)
      return Response.json({ error: "Sign in first." }, { status: 401 });
    return Response.json(await readSnapshot(userId), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Could not load your expenses. Please retry." },
      { status: 500 },
    );
  }
}
export async function POST(request: Request) {
  // Cookie-authenticated writes must originate on this app.
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json({ error: "Invalid request origin." }, { status: 403 });
  const userId = await currentUser();
  if (!userId)
    return Response.json({ error: "Sign in first." }, { status: 401 });
  let snapshot;
  let deletion: string | undefined;
  let separateBankExpenses: string[] = [];
  try {
    const body = await request.json();
    switch (body.action) {
      case "expense":
        snapshot = validateSnapshot({
          version: 1,
          expenses: [body.expense],
          budgets: {},
        });
        {
          const expense = snapshot.expenses[0];
          const current = await readSnapshot(userId);
          const existing = current.expenses.find((e) => e.id === expense.id);
          if (
            existing &&
            (existing.source === "bank" || existing.source === "matched")
          ) {
            expense.amount = existing.amount;
            expense.date = existing.date;
            expense.payment = "card";
          }
          if (expense.refundOf) {
            const original = current.expenses.find(
              (e) => e.id === expense.refundOf && e.amount > 0,
            );
            if (!original || expense.amount >= 0)
              throw Error("Choose an original purchase for this refund.");
            expense.bucket = original.bucket;
            expense.tags = original.tags;
          }

          if (!current.expenses.some((e) => e.id === expense.id)) {
            const matches = possibleMatches(
              expense,
              current.expenses.filter((e) => e.source === "bank"),
            );
            if (body.resolution?.matchId) {
              const match = matches.find(
                (m) => m.expense.id === body.resolution.matchId,
              );
              if (!match)
                throw Error("The possible match changed. Refresh and retry.");
              const records = await bankQuery(
                userId,
                "select transaction_id from bank_transactions where user_id=$1 and expense_id=$2 and active=true limit 1",
                [userId, match.expense.id],
              );
              if (!records[0]) throw Error("Bank purchase unavailable");
              await matchPurchase(userId, records[0].transaction_id, expense);
              return Response.json({ ok: true });
            } else if (body.resolution?.separate) {
              separateBankExpenses = matches.map((m) => m.expense.id);
            } else if (matches.length)
              return Response.json(
                {
                  error:
                    "A similar bank purchase exists. Choose whether this is the same purchase.",
                },
                { status: 409 },
              );
          }
        }
        break;
      case "budget":
        snapshot = validateSnapshot({
          version: 1,
          expenses: [],
          budgets: { [body.month]: body.values },
        });
        break;
      case "import":
        snapshot = validateSnapshot(body.snapshot);
        if (snapshot.expenses.length > 200)
          throw new Error("Use batches of 200 expenses.");
        break;
      case "delete":
        if (typeof body.id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.id))
          throw new Error("Invalid expense ID.");
        deletion = body.id;
        break;
      default:
        throw new Error("Unknown operation.");
    }
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Invalid request." },
      { status: 400 },
    );
  }
  try {
    if (deletion) await deleteExpense(userId, deletion);
    else if (snapshot)
      await writeSnapshot(userId, snapshot, separateBankExpenses);
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Could not save. Retry your changes." },
      { status: 500 },
    );
  }
}
