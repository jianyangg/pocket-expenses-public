import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
test("spread schedules persist in the owner-isolated expense table", async () => {
  const db = new PGlite();
  try {
    await db.exec("create role pocket_app;");
    for (const file of [
      "001_tracker.sql",
      "003_financial.sql",
      "004_expense_spread.sql",
    ])
      await db.exec(
        await readFile(new URL("../database/" + file, import.meta.url), "utf8"),
      );
    await db.exec(
      "grant select,insert,update on expenses to pocket_app;set role pocket_app;set app.user_id='owner';",
    );
    await db.exec(
      `insert into expenses(id,user_id,amount,description,bucket,date,spread) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','owner',10000,'Prepaid laundry','discretionary','2026-10-08','{"kind":"prepaid","months":5}');`,
    );
    assert.deepEqual(
      (await db.query<{ spread: unknown }>("select spread from expenses"))
        .rows[0].spread,
      { kind: "prepaid", months: 5 },
    );
    await db.exec("set app.user_id='other';");
    assert.equal(
      (await db.query("select spread from expenses")).rows.length,
      0,
    );
  } finally {
    await db.close();
  }
});
