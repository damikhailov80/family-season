-- Closing a publication, and a clean-up in the reports.

alter table public_seasons add column if not exists blocked_at timestamptz;
alter table public_seasons add column if not exists block_note text;

create index if not exists public_seasons_blocked
  on public_seasons (blocked_at) where blocked_at is not null;

alter table public_reports drop column if exists code;

delete from public_reports where public_id is null;
alter table public_reports alter column public_id set not null;
alter table public_reports drop constraint if exists public_reports_public_id_fkey;
alter table public_reports
  add constraint public_reports_public_id_fkey
  foreign key (public_id) references public_seasons (id) on delete cascade;
