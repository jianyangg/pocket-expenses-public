import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
export function seal(value: string, secret: string) {
  if (!secret) throw new Error("Session signing key is required.");
  const iv = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    createHash("sha256")
      .update("pocket-bank:" + secret)
      .digest(),
    iv,
  );
  const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data]
    .map((b) => b.toString("base64url"))
    .join(".");
}
export function unseal(value: string, secret: string) {
  if (!secret) throw new Error("Session signing key is required.");
  const parts = value.split(".");
  if (parts.length !== 3) throw new Error("Invalid encrypted value.");
  const [iv, tag, data] = parts.map((v) => Buffer.from(v, "base64url"));
  const cipher = createDecipheriv(
    "aes-256-gcm",
    createHash("sha256")
      .update("pocket-bank:" + secret)
      .digest(),
    iv,
  );
  cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(data), cipher.final()]).toString("utf8");
}
