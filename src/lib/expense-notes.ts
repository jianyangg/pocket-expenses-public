import { bankQuery } from "./bank/store";
export async function updateExpenseNote(
  user: string,
  id: unknown,
  note: unknown,
  query: typeof bankQuery = bankQuery,
) {
  if (
    typeof id !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      id,
    ) ||
    typeof note !== "string" ||
    note.length > 500
  )
    throw Error("Keep item details under 500 characters.");
  const rows = await query(
    user,
    "update expenses set item_note=$3 where user_id=$1 and id=$2 returning id",
    [user, id, note.trim()],
  );
  if (!rows.length) throw Error("Expense unavailable. Refresh and retry.");
}
