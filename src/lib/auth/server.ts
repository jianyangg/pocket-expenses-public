import { cookies } from "next/headers";
import { verifySession } from "./password";
export const sessionCookie = "pocket-session";
export async function currentUser() {
  const token = (await cookies()).get(sessionCookie)?.value;
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!token || !secret || !verifySession(token, secret)) return undefined;
  return process.env.POCKET_OWNER_ID || "pocket-owner";
}
