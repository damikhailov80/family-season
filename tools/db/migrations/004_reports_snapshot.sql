-- Жалоба перестаёт быть ссылкой и становится снимком.

alter table public_reports add column if not exists code    text;
alter table public_reports add column if not exists content jsonb;

update public_reports r
   set code = p.code, content = p.content
  from public_seasons p
 where p.id = r.public_id and r.code is null;

delete from public_reports where code is null or content is null;

alter table public_reports alter column code    set not null;
alter table public_reports alter column content set not null;

drop index if exists public_reports_once;
create unique index if not exists public_reports_once on public_reports (code, reporter_key);

create index if not exists public_reports_code on public_reports (code);

alter table public_reports drop constraint if exists public_reports_public_id_fkey;
alter table public_reports drop column if exists public_id;
