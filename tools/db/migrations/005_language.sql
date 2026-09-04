-- Languages: Russian, English, Polish.

alter table user_settings  add column if not exists language text not null default 'ru';
alter table user_seasons   add column if not exists language text not null default 'ru';
alter table public_seasons add column if not exists language text not null default 'ru';

alter table public_seasons drop column if exists content_key;
alter table public_seasons add column content_key text
  generated always as (md5(language || content::text)) stored;
create unique index if not exists public_seasons_content on public_seasons (content_key);

create index if not exists public_seasons_lang
  on public_seasons (language) where hidden_at is null and blocked_at is null;

alter table public_reports add column if not exists language text not null default 'ru';
