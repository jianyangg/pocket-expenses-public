import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { verifyWebhook } from "../src/lib/bank/webhook";
import { generateKeyPairSync, sign, createHash } from "node:crypto";
test("bank tables enforce owner isolation and cascading disconnect keeps expenses", async () => {
  const db = new PGlite();
  try {
    await db.exec("create role pocket_app;");
    await db.exec(
      await readFile(
        new URL("../database/001_tracker.sql", import.meta.url),
        "utf8",
      ),
    );
    await db.exec(
      await readFile(
        new URL("../database/002_bank.sql", import.meta.url),
        "utf8",
      ),
    );
    await db.exec(
      "set role pocket_app; set app.user_id='owner-a'; insert into bank_connections(user_id,item_id,token,start_date) values('owner-a','item','encrypted','2026-10-01'); insert into bank_transactions(user_id,item_id,transaction_id,decision,data) values('owner-a','item','txn','review','{}');",
    );
    await db.exec("set app.user_id='owner-b';");
    assert.equal(
      (await db.query("select * from bank_connections")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from bank_transactions")).rows.length,
      0,
    );
    await assert.rejects(
      db.exec(
        "insert into bank_connections(user_id,item_id,token,start_date) values('owner-a','bad','token','2026-10-01');",
      ),
      /row-level security/,
    );
    await db.exec(
      "set app.user_id='owner-a'; delete from bank_connections where item_id='item';",
    );
    assert.equal(
      (await db.query("select * from bank_transactions")).rows.length,
      0,
    );
  } finally {
    await db.close();
  }
});
test("webhooks verify signed body, reject altered data and expired signatures", async () => {
  const { privateKey, publicKey } = generateKeyPairSync("ec", {
    namedCurve: "P-256",
  });
  const original = globalThis.fetch;
  const body = '{"item_id":"test"}';
  globalThis.fetch = async () =>
    Response.json({
      key: { ...publicKey.export({ format: "jwk" }), expired_at: null },
    });
  const token = (age = 0) => {
    const h = Buffer.from(
      JSON.stringify({ alg: "ES256", kid: "test" }),
    ).toString("base64url");
    const p = Buffer.from(
      JSON.stringify({
        iat: Math.floor(Date.now() / 1000) - age,
        request_body_sha256: createHash("sha256").update(body).digest("hex"),
      }),
    ).toString("base64url");
    return (
      h +
      "." +
      p +
      "." +
      sign("sha256", Buffer.from(h + "." + p), {
        key: privateKey,
        dsaEncoding: "ieee-p1363",
      }).toString("base64url")
    );
  };
  const config = {
    clientId: "test",
    secret: "test",
    environment: "sandbox" as const,
  };
  try {
    assert.ok(await verifyWebhook(token(), body, config));
    assert.ok(!(await verifyWebhook(token(), body + " ", config)));
    assert.ok(!(await verifyWebhook(token(600), body, config)));
    assert.ok(!(await verifyWebhook("unsigned", body, config)));
  } finally {
    globalThis.fetch = original;
  }
});
