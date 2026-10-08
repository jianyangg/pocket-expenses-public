# Pocket

A small, mobile-first personal expense tracker. See how much you can spend today, keep groceries separate, and reserve money for investing.

- Quick add: amount → description → tags. Type `800` for `$8.00`.
- Choose existing tags or create your own.
- Monthly budgets, spending charts, refunds, editing, undo and JSON backups.
- One password, no email. Autosaves to Postgres.
- Next.js + Neon Postgres; deploy to Vercel. MIT licensed.

## Start here — no programming knowledge needed

Download this repository, open it in your AI coding assistant, and paste:

> Help me set up Pocket using TECHNICAL_SETUP.md. Start locally, ask me for my own password and database connection privately, and keep credentials out of Git. Help me set my monthly budget. If I ask, deploy my own copy to Vercel.

Every installation starts with empty expenses and zero budgets. Enter your own figures under **Budget**. This is a single-person app: everyone with your installation's password accesses the same ledger.

## How the numbers work

Spending left = income − rent − utilities − subscriptions − transit − groceries budget − refill/renewal reserves − optional depreciation reserve − investing budget − discretionary purchases.

Today's amount divides that balance by the remaining days this month. Grocery overspending also reduces it. Depreciation is an optional planning deduction, not cash paid again; leave it at zero for a cash-only view. Bills, investments, fixed purchases and reserved purchases are tracked without deducting their budget allocations twice. Items needing review count against spending until reclassified.

Current currency is USD and the calendar uses America/New_York. These are code settings, not automatic currency conversion. Each month inherits the nearest earlier budget. Export a JSON backup from Budget before major changes.

See [technical setup](TECHNICAL_SETUP.md) and [contributing](CONTRIBUTING.md).

## Optional bank sync

Connect Chase and other Plaid-supported banks using your own server-side credentials. See [bank sync setup](BANK_SYNC.md).
