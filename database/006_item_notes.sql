alter table expenses add column if not exists item_note text not null default '' check (char_length(item_note)<=500);
