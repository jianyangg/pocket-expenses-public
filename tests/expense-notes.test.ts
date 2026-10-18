import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { updateExpenseNote } from "../src/lib/expense-notes";
import type { bankQuery } from "../src/lib/bank/store";
test("inline item notes persist without changing bank amounts, labels or categories and cannot edit another owner", async () => {
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
      await db.exec("set role pocket_app");
      await db.query("select set_config('app.user_id',$1,false)", [user]);
      return (await db.query<Record<string, any>>(sql, args)).rows;
    };
    const id = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    await query(
      "owner",
      "insert into expenses(id,user_id,amount,description,bucket,date) values($1,'owner',4275,'Example shop','discretionary','2026-10-18')",
      [id],
    );
    await updateExpenseNote("owner", id, "  Desk lamp  ", query);
    let rows = await query("owner", "select * from expenses");
    assert.equal(rows[0].item_note, "Desk lamp");
    assert.equal(rows[0].amount, 4275);
    assert.equal(rows[0].description, "Example shop");
    assert.equal(rows[0].bucket, "discretionary");
    await assert.rejects(updateExpenseNote("other", id, "Overwritten", query));
    await assert.rejects(
      updateExpenseNote("owner", id, "x".repeat(501), query),
    );
    await updateExpenseNote("owner", id, "", query);
    rows = await query("owner", "select item_note from expenses");
    assert.equal(rows[0].item_note, "");
  } finally {
    await db.close();
  }
});
