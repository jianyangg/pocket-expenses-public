create table if not exists bank_connections (
 user_id text not null, item_id text primary key, token text not null,
 cursor text, start_date date not null, last_synced timestamptz,
 syncing_until timestamptz
);
create table if not exists bank_transactions (
 user_id text not null, item_id text not null references bank_connections(item_id) on delete cascade,
 transaction_id text primary key, expense_id uuid, owned boolean not null default false,
 customized boolean not null default false, decision text not null,
 active boolean not null default true, data jsonb not null
);
create index if not exists bank_transactions_owner on bank_transactions(user_id,item_id);
alter table bank_connections enable row level security;
alter table bank_connections force row level security;
alter table bank_transactions enable row level security;
alter table bank_transactions force row level security;
drop policy if exists "Own bank connections" on bank_connections;
create policy "Own bank connections" on bank_connections for all using(user_id=nullif(current_setting('app.user_id',true),'')) with check(user_id=nullif(current_setting('app.user_id',true),''));
drop policy if exists "Own bank transactions" on bank_transactions;
create policy "Own bank transactions" on bank_transactions for all using(user_id=nullif(current_setting('app.user_id',true),'')) with check(user_id=nullif(current_setting('app.user_id',true),''));
revoke all on bank_connections,bank_transactions from public;
grant select,insert,update,delete on bank_connections,bank_transactions to pocket_app;
