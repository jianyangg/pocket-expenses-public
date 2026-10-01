# Technical setup

Use Node.js 22 or later. Run `npm ci`.

1. Create a free Neon Postgres database and obtain its connection string privately.
2. Copy `.env.example` to `.env.local`. Fill `DATABASE_URL`.
3. Choose a password. Generate a salted hash using the existing helper (do not place your password in shell history):

   `read -s POCKET_SETUP_PASSWORD; export POCKET_SETUP_PASSWORD; npx tsx -e 'import {hashPassword} from "./src/lib/auth/password.ts"; console.log(hashPassword(process.env.POCKET_SETUP_PASSWORD!))'; unset POCKET_SETUP_PASSWORD`

   Copy the generated hash to `POCKET_PASSWORD_HASH` in `.env.local`.
4. Generate `NEON_AUTH_COOKIE_SECRET` with `openssl rand -hex 32`. Despite its legacy name this is Pocket's session signing secret; Neon Auth is not required. Set `POCKET_OWNER_ID` to a stable identifier such as `pocket-owner`.
5. Run `npm run db:migrate`, then `npm run dev`.
6. Open localhost:3000, sign in, and enter your budget.

The migration needs a database role that can create roles and tables. It creates the restricted `pocket_app` role and row-level security policies. Do not expose database credentials to browser code.

## Vercel

Import your own GitHub copy into Vercel as a Next.js project; leave Root Directory at the repository root. Set the four environment variables from `.env.example` in Vercel, then deploy. Apply the migration to the same production database before using the app. GitHub pushes can trigger redeployments. Each installation requires its own secrets and database.

Keep `.env.local`, database exports and backups private. Never commit them. Rotate the signing secret to invalidate all sessions. Run `npm test`, `npm run typecheck` and `npm run build` before shipping changes.
