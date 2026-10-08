import {
  createHash,
  createPublicKey,
  verify,
  timingSafeEqual,
} from "node:crypto";
import { plaid, type Credentials } from "./client";
export async function verifyWebhook(
  token: string,
  body: string,
  config: Credentials,
) {
  try {
    const [header, payload, signature, ...extra] = token.split(".");
    if (extra.length || !signature) return false;
    const h = JSON.parse(Buffer.from(header, "base64url").toString());
    if (h.alg !== "ES256" || typeof h.kid !== "string") return false;
    const { key } = await plaid<{ key: Record<string, unknown> }>(
      config,
      "/webhook_verification_key/get",
      { key_id: h.kid },
    );
    if (key.expired_at) return false;
    const publicKey = createPublicKey({
      key: key as import("node:crypto").JsonWebKey,
      format: "jwk",
    });
    if (
      !verify(
        "sha256",
        Buffer.from(header + "." + payload),
        { key: publicKey, dsaEncoding: "ieee-p1363" },
        Buffer.from(signature, "base64url"),
      )
    )
      return false;
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
    const now = Math.floor(Date.now() / 1000);
    if (
      !Number.isFinite(claims.iat) ||
      claims.iat > now + 30 ||
      now - claims.iat > 300 ||
      typeof claims.request_body_sha256 !== "string"
    )
      return false;
    const digest = createHash("sha256").update(body).digest();
    const expected = Buffer.from(claims.request_body_sha256, "hex");
    return (
      expected.length === digest.length && timingSafeEqual(expected, digest)
    );
  } catch {
    return false;
  }
}
