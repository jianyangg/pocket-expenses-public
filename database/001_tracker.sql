create table if not exists public.expenses (
 id uuid primary key,
 user_id text not null,
 amount integer not null check (amount <> 0 and abs(amount::bigint) <= 100000000),
 description text not null check (char_length(description) <= 300),
 tags text[] not null default '{}' check (cardinality(tags) <= 20),
 bucket text not null check (bucket in ('discretionary','groceries','bill','investment')),
 date date not null,
 created_at timestamptz not null default now()
);
create index if not exists expenses_user_date on public.expenses(user_id,date desc);
create table if not exists public.monthly_budgets (
 user_id text not null,
 month text not null check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
 plan jsonb not null check (jsonb_typeof(plan) = 'object'),
 primary key (user_id,month)
);
alter table public.expenses enable row level security;
alter table public.monthly_budgets enable row level security;
alter table public.expenses force row level security;
alter table public.monthly_budgets force row level security;
revoke all on public.expenses,public.monthly_budgets from public;
drop policy if exists "Own expenses" on public.expenses;
create policy "Own expenses" on public.expenses for all
 using (user_id = nullif(current_setting('app.user_id',true),''))
 with check (user_id = nullif(current_setting('app.user_id',true),''));
drop policy if exists "Own monthly plans" on public.monthly_budgets;
create policy "Own monthly plans" on public.monthly_budgets for all
 using (user_id = nullif(current_setting('app.user_id',true),''))
 with check (user_id = nullif(current_setting('app.user_id',true),''));
grant select,insert,update,delete on public.expenses,public.monthly_budgets to pocket_app;
grant pocket_app to current_user;
create table if not exists public.pocket_login_limits (
 id text primary key,
 attempts integer not null,
 started_at timestamptz not null
);
revoke all on public.pocket_login_limits from public;
alter table public.expenses drop constraint if exists expenses_bucket_check;
alter table public.expenses add constraint expenses_bucket_check check (bucket in ('discretionary','groceries','bill','investment','fixed','reserved','review'));
