import { validateInvestmentPlan } from "@/lib/investment-plan";
import { currentUser } from "@/lib/auth/server";
import { bankQuery } from "@/lib/bank/store";
import { defaultStatementInputs } from "@/lib/statements";
export const dynamic = "force-dynamic";
export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 });
  try {
    const rows = await bankQuery(
      user,
      "select values from financial_settings where user_id=$1",
      [user],
    );
    return Response.json(
      rows[0]?.values || { includeSetup: false, inputs: {}, openingMonth: "" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "Settings unavailable." }, { status: 500 });
  }
}
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json({ error: "Invalid origin." }, { status: 403 });
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 });
  try {
    const body = await request.json();
    if (
      typeof body.includeSetup !== "boolean" ||
      !/^(\d{4}-(0[1-9]|1[0-2]))?$/.test(body.openingMonth) ||
      !body.inputs ||
      typeof body.inputs !== "object"
    )
      throw Error();
    for (const [month, inputs] of Object.entries(body.inputs)) {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw Error();
      for (const key of Object.keys(defaultStatementInputs)) {
        const value = (inputs as Record<string, unknown>)[key];
        if (
          !Number.isSafeInteger(value) ||
          Number(value) < 0 ||
          Number(value) > 10000000000
        )
          throw Error();
      }
    }
    await bankQuery(
      user,
      "insert into financial_settings(user_id,values) values($1,$2::jsonb) on conflict(user_id) do update set values=excluded.values",
      [
        user,
        JSON.stringify({
          includeSetup: body.includeSetup,
          inputs: body.inputs,
          openingMonth: body.openingMonth,
        }),
      ],
    );
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Could not save financial settings." },
      { status: 400 },
    );
  }
}
