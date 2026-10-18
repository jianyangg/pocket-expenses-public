import { currentUser } from "@/lib/auth/server";
import { cashSnapshot } from "@/lib/bank/cash";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in first" }, { status: 401 });
  try {
    return Response.json(await cashSnapshot(user), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Bank balances unavailable" },
      { status: 502 },
    );
  }
}
