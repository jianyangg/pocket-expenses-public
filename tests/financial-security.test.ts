import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
test("financial settings are owner-only and reviewed choices survive reload", async () => {
  const db = new PGlite();
  try {
    await db.exec("create role pocket_app;");
    for (const file of ["001_tracker.sql", "003_financial.sql"])
      await db.exec(
        await readFile(new URL("../database/" + file, import.meta.url), "utf8"),
      );
    await db.exec(
      "grant select,insert,update,delete on expenses to pocket_app; set role pocket_app; set app.user_id='owner-a'; insert into financial_settings values('owner-a','{\"includeSetup\":true}'); insert into expenses(id,user_id,amount,description,bucket,date,reviewed) values('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','owner-a',1000,'Electric bill','bill','2026-10-01',true);",
    );
    await db.exec("reset app.user_id; set app.user_id='owner-a';");
    assert.equal(
      (await db.query<{ reviewed: boolean }>("select reviewed from expenses"))
        .rows[0].reviewed,
      true,
    );
    await db.exec("set app.user_id='owner-b';");
    assert.equal(
      (await db.query("select * from financial_settings")).rows.length,
      0,
    );
    assert.equal((await db.query("select * from expenses")).rows.length, 0);
    await db.exec(
      "update financial_settings set values='{}'; delete from financial_settings;",
    );
    await assert.rejects(
      db.exec("insert into financial_settings values('owner-a','{}');"),
      /row-level security/,
    );
    await db.exec("set app.user_id='owner-a';");
    assert.equal(
      (
        await db.query<{ values: { includeSetup: boolean } }>(
          "select values from financial_settings",
        )
      ).rows[0].values.includeSetup,
      true,
    );
    await db.exec("reset role; create role anon; set role anon;");
    await assert.rejects(
      db.query("select * from financial_settings"),
      /permission denied/,
    );
  } finally {
    await db.close();
  }
});
