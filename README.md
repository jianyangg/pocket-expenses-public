# Pocket

A small, mobile-first personal expense tracker. See how much you can spend today, keep groceries separate, and reserve money for investing.

- Quick add: amount → description → tags. Type `800` for `$8.00`.
- Choose existing tags or create your own.
- Separate grocery and discretionary allowances, daily pacing and overspending carryovers.
- Bank duplicate review with rounded-amount suggestions and reversible matches.
- Refunds linked to original purchases, lump-sum investments and weekly spending insights.
- Live cash reserves, spending charts, editing, undo and JSON backups.
- One password, no email. Autosaves to Postgres.
- Next.js + Neon Postgres; deploy to Vercel. MIT licensed.

## Start here — no programming knowledge needed

Download this repository, open it in your AI coding assistant, and paste:

> Help me set up Pocket using TECHNICAL_SETUP.md. Start locally, ask me for my own password and database connection privately, and keep credentials out of Git. Help me set my monthly budget. If I ask, deploy my own copy to Vercel.

Every installation starts with empty expenses and zero budgets. Enter your own figures under **Plan**. This is a single-person app: everyone with your installation's password accesses the same ledger.

## How the numbers work

The **Today** screen shows grocery and discretionary allowances after this month's purchases and refunds, plus a daily pace. Discretionary overspending reduces future months' allowances; carrying unused money forward is optional. Subscriptions, transit and refill reserves remain separate.

**Available to invest** starts with linked USD bank cash, subtracts credit-card debt, then reserves remaining living costs through the date chosen in Plan and an optional cash buffer. It does not add income that was already received, and excludes noncash depreciation. Unmatched manual estimates remain reserved until matched or confirmed as already reflected in the bank balance. This forecast is designed for a chosen period funded by existing cash; it does not assume future salary receipts.

**Review** brings possible bank/manual duplicates and uncategorised purchases together, including transactions that arrive late. Amounts and dates suggest possible matches even when descriptions differ or a manual amount was rounded. Confirm the match, keep both purchases or exclude the bank item. Matches retain the manual labels and can be undone from Activity. Cash purchases are excluded from duplicate suggestions. Resolve possible duplicates before using the investment estimate.

Current currency is USD and the calendar uses America/New_York. These are code settings, not automatic currency conversion. Each month inherits the nearest earlier budget. Export a JSON backup from Plan before major changes.

See [technical setup](TECHNICAL_SETUP.md) and [contributing](CONTRIBUTING.md).

## Optional bank sync

Connect Chase and other Plaid-supported banks using your own server-side credentials. See [bank sync setup](BANK_SYNC.md).

## Everyday workflow

- Tap **+** to add an expense, choose **Investment** for a lump sum, or **Refund** to restore a category. Enter amount, description and tags; investment entry needs only amount and description.
- Use **Review** to confirm possible duplicates and categorise purchases: swipe left for groceries, right for discretionary, or up for other categories.
- Tap chart categories for the transactions behind each total. Weekly insights show recent changes and repeated spending.
- Use **Plan** for allowances, carryovers, cash reserves, backups and financial statements. Bank connection controls are in Settings.
