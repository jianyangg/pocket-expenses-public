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
  try {
    const body = await request.json();
    switch (body.action) {
      case "expense":
        snapshot = validateSnapshot({
          version: 1,
          expenses: [body.expense],
          budgets: {},
        });
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
    else if (snapshot) await writeSnapshot(userId, snapshot);
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Could not save. Retry your changes." },
      { status: 500 },
    );
  }
}
