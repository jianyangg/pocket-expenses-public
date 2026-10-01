import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHmac,
} from "node:crypto";
export const sessionDuration = 90 * 86400;
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
}
export function verifyPassword(password: string, encoded: string) {
  if (!/^[0-9a-f]{32}:[0-9a-f]{128}$/.test(encoded)) return false;
  const [salt, hash] = encoded.split(":");
  return timingSafeEqual(
    scryptSync(password, salt, 64),
    Buffer.from(hash, "hex"),
  );
}
export function createSession(
  secret: string,
  now = Math.floor(Date.now() / 1000),
) {
  const payload = Buffer.from(
    JSON.stringify({
      expires: now + sessionDuration,
      nonce: randomBytes(16).toString("hex"),
    }),
  ).toString("base64url");
  return (
    payload +
    "." +
    createHmac("sha256", secret).update(payload).digest("base64url")
  );
}
export function verifySession(
  token: string,
  secret: string,
  now = Math.floor(Date.now() / 1000),
) {
  try {
    const [payload, signature, ...rest] = token.split(".");
    if (!payload || !signature || rest.length) return false;
    const expected = createHmac("sha256", secret).update(payload).digest();
    const supplied = Buffer.from(signature, "base64url");
    if (
      supplied.length !== expected.length ||
      !timingSafeEqual(supplied, expected)
    )
      return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return Number.isSafeInteger(data.expires) && data.expires > now;
  } catch {
    return false;
  }
}
