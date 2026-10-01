import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("migration enforces private access, owner writes and no cross-account changes", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role pocket_app;`);
    await db.exec(
      await readFile(
        new URL("../database/001_tracker.sql", import.meta.url),
        "utf8",
      ),
    );
    await db.exec(
      `grant select,insert,update,delete on expenses,monthly_budgets to pocket_app; set role pocket_app; set app.user_id = '11111111-1111-1111-1111-111111111111';`,
    );
    await db.exec(
      `insert into public.expenses(id,user_id,amount,description,bucket,date) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111',1250,'lunch','discretionary','2026-10-01');`,
    );
    await db.exec(
      `insert into public.monthly_budgets(user_id,month,plan) values ('11111111-1111-1111-1111-111111111111','2026-10','{}');`,
    );
    assert.equal((await db.query("select * from expenses")).rows.length, 1);
    await db.exec(
      `update expenses set amount=1500 where id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';`,
    );
    await assert.rejects(
      db.exec(
        `insert into expenses(id,user_id,amount,description,bucket,date) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','22222222-2222-2222-2222-222222222222',1250,'not mine','discretionary','2026-10-01');`,
      ),
      /row-level security/,
    );
    await db.exec(`set app.user_id = '22222222-2222-2222-2222-222222222222';`);
    assert.equal((await db.query("select * from expenses")).rows.length, 0);
    assert.equal(
      (await db.query("select * from monthly_budgets")).rows.length,
      0,
    );
    await db.exec(`update expenses set amount=2000; delete from expenses;`);
    await assert.rejects(
      db.exec(
        `insert into monthly_budgets(user_id,month,plan) values ('11111111-1111-1111-1111-111111111111','2026-11','{}');`,
      ),
      /row-level security/,
    );
    await db.exec(`reset role; create role anon; set role anon;`);
    await assert.rejects(
      db.query("select * from expenses"),
      /permission denied/,
    );
    await assert.rejects(
      db.query("select * from monthly_budgets"),
      /permission denied/,
    );
    await db.exec(`reset role;`);
    assert.equal(
      (await db.query<{ amount: number }>("select amount from expenses"))
        .rows[0].amount,
      1500,
    );
  } finally {
    await db.close();
  }
});
