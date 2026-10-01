import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  createSession,
  verifySession,
} from "../src/lib/auth/password";
test("salted password hashes accept correct passwords and reject incorrect or malformed hashes", () => {
  const hash = hashPassword("test-password");
  assert.ok(verifyPassword("test-password", hash));
  assert.ok(!verifyPassword("wrong", hash));
  assert.ok(!verifyPassword("test-password", "bad"));
  assert.notEqual(hash, hashPassword("test-password"));
});
test("signed sessions reject tampering, expiry and different signing keys", () => {
  const token = createSession("secret", 100);
  assert.ok(verifySession(token, "secret", 101));
  assert.ok(!verifySession(token + "x", "secret", 101));
  assert.ok(!verifySession(token, "other", 101));
  assert.ok(!verifySession(token, "secret", 100 + 90 * 86400));
});
