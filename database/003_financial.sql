create table if not exists financial_settings(user_id text primary key,values jsonb not null);
alter table financial_settings enable row level security;
alter table financial_settings force row level security;
revoke all on financial_settings from public;
drop policy if exists "Own financial settings" on financial_settings;
create policy "Own financial settings" on financial_settings for all using(user_id=nullif(current_setting('app.user_id',true),'')) with check(user_id=nullif(current_setting('app.user_id',true),''));
grant select,insert,update,delete on financial_settings to pocket_app;

alter table expenses add column if not exists reviewed boolean not null default false;
