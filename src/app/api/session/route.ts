import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { currentUser, sessionCookie } from "@/lib/auth/server";
import {
  createSession,
  sessionDuration,
  verifyPassword,
} from "@/lib/auth/password";
import { database } from "@/lib/database";
export const dynamic = "force-dynamic";
export async function GET() {
  const id = await currentUser();
  return NextResponse.json(id ? { user: { id } } : null, {
    headers: { "Cache-Control": "no-store" },
  });
}
function originMatches(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin;
}
export async function POST(request: Request) {
  if (!originMatches(request))
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  try {
    const { password } = await request.json();
    if (typeof password !== "string" || password.length > 128)
      return NextResponse.json(
        { error: "Incorrect password." },
        { status: 401 },
      );
    const secret = process.env.NEON_AUTH_COOKIE_SECRET,
      hash = process.env.POCKET_PASSWORD_HASH;
    if (!secret || !hash) throw new Error("Missing password configuration");
    const ip =
      request.headers.get("x-vercel-forwarded-for") ||
      request.headers.get("x-forwarded-for") ||
      "local";
    const key = createHash("sha256")
      .update(secret + ip)
      .digest("hex");
    const sql = database();
    const rows =
      await sql`insert into pocket_login_limits(id,attempts,started_at) values (${key},1,now())
 on conflict(id) do update set attempts=case when pocket_login_limits.started_at<now()-interval '15 minutes' then 1 else pocket_login_limits.attempts+1 end,
 started_at=case when pocket_login_limits.started_at<now()-interval '15 minutes' then now() else pocket_login_limits.started_at end returning attempts`;
    if (rows[0].attempts > 10)
      return NextResponse.json(
        { error: "Too many attempts. Try again in 15 minutes." },
        { status: 429 },
      );
    if (!verifyPassword(password, hash))
      return NextResponse.json(
        { error: "Incorrect password." },
        { status: 401 },
      );
    await sql`delete from pocket_login_limits where id=${key}`;
    const response = NextResponse.json({ ok: true });
    response.cookies.set(sessionCookie, createSession(secret), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: sessionDuration,
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "Could not sign in. Please retry." },
      { status: 500 },
    );
  }
}
export async function DELETE(request: Request) {
  if (!originMatches(request))
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookie, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
