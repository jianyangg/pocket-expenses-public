# Bank sync

Plaid Transactions is optional. Credentials are server-only environment variables, not submitted through Pocket's website. Each installation uses its own Plaid account and credentials. Production Trial access is required for a real bank; Sandbox uses simulated data.

## Setup

1. Register the deployed app's `https://YOUR-DOMAIN/bank-return` URL under Plaid's allowed redirect URIs.
2. In the linked app directory, run `npm run bank:setup`. Enter the client ID, Production secret and a new Pocket password privately in your terminal. Input is hidden. The helper stores secrets in ignored `.env.local` and Vercel Production settings, never in Git. It invalidates old Pocket sessions. Vercel CLI must already be authenticated and the project linked.
3. Run `npm run db:migrate`, then deploy the app. Environment changes take effect on the next deployment.
4. Sign into Pocket with the new password and tap Connect bank. Authorize Chase directly and select the accounts to share.

Manual setup instead: set PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV=production and POCKET_BANK_KEY (32 random bytes encoded as hex) in server environment variables. Use a strong Pocket password. Keep POCKET_BANK_KEY stable: changing it prevents decrypting saved bank access tokens and requires reconnecting.

## Behavior

Sync imports from the start of the month in which the bank was connected. Older history is deliberately excluded from the ledger. Transfers, income and loan payments are excluded from spending. Groceries and transit/utilities get budget buckets; other purchases count as discretionary until edited. Refunds restore money. Verify classifications: bank categories are suggestions, not guaranteed.

Signed Plaid webhooks update transactions automatically. Pocket also checks for updates when opened, focused, or every five minutes while visible. Plaid's bank refresh is slower than this; it is not a real-time bank balance. Sync reads available data and does not call the optional paid refresh endpoint.

Pending transactions are counted once and reconciled when posted. Imported transaction IDs prevent repeated imports. Possible duplicates of manually entered purchases are held for Add/Skip review and excluded from balances until resolved. One unambiguous merchant/date/amount match reuses a manual entry. Confirm those matches when reviewing the initial import. Pending-to-posted replacements preserve edits and tags.

Disconnect revokes Plaid access and removes encrypted tokens and bank import metadata; expenses stay. Exported backups contain expense records and budgets only, never bank access tokens or Plaid credentials. Reconnecting can require duplicate review and may consume another Trial connection slot.

## Security

HTTPS, authenticated app routes and origin checks protect bank actions. AES-256-GCM encrypts stored access tokens with the server-only bank key. Forced row-level security restricts bank tables to their owner. Webhooks require a valid Plaid signature and body hash. No bank credentials are stored in browser persistence; an ephemeral Plaid Link token is stored in session storage only to complete an OAuth redirect.

A public URL does not expose the database, but account security still depends on the Pocket password, server credentials and the hosting account. Protect those accounts and never commit local environment files.
