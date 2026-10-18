alter table expenses add column if not exists payment text not null default 'card';
alter table expenses add column if not exists refund_of uuid;
alter table expenses drop constraint if exists expenses_bucket_check;
alter table expenses add constraint expenses_bucket_check check(bucket in ('discretionary','groceries','bill','investment','fixed','reserved','review','transfer'));
alter table bank_transactions add column if not exists undo_expense jsonb;
alter table bank_connections add column if not exists cash_snapshot jsonb;
alter table bank_transactions add column if not exists duplicate_checked boolean not null default false;
alter table expenses add column if not exists settled boolean not null default false;
