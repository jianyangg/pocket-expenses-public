import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import {
  matchPurchase,
  undoMatch,
  includeSeparate,
} from "../src/lib/bank/reconcile";
import type { bankQuery } from "../src/lib/bank/store";
import type { Expense } from "../src/lib/budget";
test("rounded estimates merge once, retain labels, survive rechecks and undo without losing either purchase", async () => {
  const db = new PGlite();
  try {
    await db.exec("create role pocket_app;");
    for (const file of [
      "001_tracker.sql",
      "002_bank.sql",
      "003_financial.sql",
      "004_expense_spread.sql",
      "005_reconciliation.sql",
      "006_item_notes.sql",
    ])
      await db.exec(
        await readFile(new URL("../database/" + file, import.meta.url), "utf8"),
      );
    const query: typeof bankQuery = async (user, sql, args = []) => {
      await db.exec(`set role pocket_app;`);
      await db.query("select set_config('app.user_id',$1,false)", [user]);
      return (await db.query<Record<string, any>>(sql, args)).rows;
    };
    await query(
      "owner",
      "insert into bank_connections(user_id,item_id,token,start_date) values ('owner','item','encrypted','2026-10-01')",
    );
    const manual: Expense = {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      amount: 10000,
      date: "2026-10-08",
      description: "Groceries",
      tags: ["groceries", "custom"],
      bucket: "groceries",
    };
    await query(
      "owner",
      "insert into expenses(id,user_id,amount,date,description,tags,bucket) values ($1,'owner',$2,$3::date,$4,$5,$6)",
      [
        manual.id,
        manual.amount,
        manual.date,
        manual.description,
        manual.tags,
        manual.bucket,
      ],
    );
    const t = {
      transaction_id: "bank",
      account_id: "account",
      amount: 98.73,
      date: "2026-10-12",
      name: "H MART",
      pending: true,
    };
    await query(
      "owner",
      "insert into bank_transactions(user_id,item_id,transaction_id,decision,data) values ('owner','item','bank','review',$1::jsonb)",
      [JSON.stringify(t)],
    );
    await assert.rejects(matchPurchase("other", "bank", manual, query));
    await matchPurchase("owner", "bank", manual, query);
    let rows = await query(
      "owner",
      "select amount,description,tags from expenses",
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0].amount, 9873);
    assert.equal(rows[0].description, "Groceries");
    assert.deepEqual(rows[0].tags, ["groceries", "custom"]);
    await assert.rejects(matchPurchase("owner", "bank", manual, query));
    await undoMatch("owner", manual.id, query);
    rows = await query("owner", "select amount from expenses order by amount");
    assert.deepEqual(
      rows.map((r) => r.amount),
      [9873, 10000],
    );
    await assert.rejects(undoMatch("owner", manual.id, query));
    assert.equal((await query("other", "select * from expenses")).length, 0);
  } finally {
    await db.close();
  }
});

test("an imported bank duplicate can merge with an existing estimate and separate decisions persist", async () => {
  const db = new PGlite();
  try {
    await db.exec("create role pocket_app;");
    for (const file of [
      "001_tracker.sql",
      "002_bank.sql",
      "003_financial.sql",
      "004_expense_spread.sql",
      "005_reconciliation.sql",
      "006_item_notes.sql",
    ])
      await db.exec(
        await readFile(new URL("../database/" + file, import.meta.url), "utf8"),
      );
    const query: typeof bankQuery = async (user, sql, args = []) => {
      await db.exec("set role pocket_app;");
      await db.query("select set_config('app.user_id',$1,false)", [user]);
      return (await db.query<Record<string, any>>(sql, args)).rows;
    };
    await query(
      "owner",
      "insert into bank_connections(user_id,item_id,token,start_date) values ('owner','item','encrypted','2026-10-01')",
    );
    const manual: Expense = {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      amount: 10000,
      date: "2026-10-08",
      description: "Groceries",
      tags: ["groceries"],
      bucket: "groceries",
    };
    const other = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
    await query(
      "owner",
      "insert into expenses(id,user_id,amount,date,description,bucket) values ($1,'owner',10000,'2026-10-08','Groceries','groceries'),($2,'owner',9873,'2026-10-10','H MART','groceries')",
      [manual.id, other],
    );
    const t = {
      transaction_id: "bank",
      account_id: "account",
      amount: 98.73,
      date: "2026-10-10",
      name: "H MART",
      pending: false,
    };
    await query(
      "owner",
      "insert into bank_transactions(user_id,item_id,transaction_id,decision,data,owned,expense_id) values ('owner','item','bank','imported',$1::jsonb,true,$2)",
      [JSON.stringify(t), other],
    );
    await matchPurchase("owner", "bank", manual, query);
    assert.equal((await query("owner", "select * from expenses")).length, 1);
    await undoMatch("owner", manual.id, query);
    assert.equal((await query("owner", "select * from expenses")).length, 2);
    await includeSeparate("owner", "bank", query);
    assert.equal(
      (
        await query("owner", "select duplicate_checked from bank_transactions")
      )[0].duplicate_checked,
      true,
    );
  } finally {
    await db.close();
  }
});
