-- Схема базы. Идемпотентна: гоняется столько раз, сколько нужно.

create table if not exists user_settings (
  account_key text primary key,
  family      jsonb       not null,
  updated_at  timestamptz not null default now()
);

create table if not exists favorites (
  id          uuid        primary key default gen_random_uuid(),
  account_key text        not null,
  url         text        not null,
  title       text        not null,
  created_at  timestamptz not null default now()
);

create index if not exists favorites_owner on favorites (account_key, created_at desc);

create table if not exists seasons (
  id          uuid        primary key default gen_random_uuid(),
  account_key text        not null,
  url         text        not null,
  title       text        not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists seasons_owner on seasons (account_key, updated_at desc);

create table if not exists shared_seasons (
  id          uuid        primary key default gen_random_uuid(),
  season_id   uuid        not null unique references seasons (id) on delete cascade,
  account_key text        not null,
  created_at  timestamptz not null default now()
);

create index if not exists shared_owner on shared_seasons (account_key, created_at desc);

create table if not exists shared_likes (
  shared_id   uuid        not null references shared_seasons (id) on delete cascade,
  account_key text        not null,
  created_at  timestamptz not null default now(),
  primary key (shared_id, account_key)
);

create table if not exists shared_reports (
  shared_id   uuid        not null references shared_seasons (id) on delete cascade,
  account_key text        not null,
  comment     text        not null,
  created_at  timestamptz not null default now(),
  primary key (shared_id, account_key)
);

create index if not exists shared_reports_author on shared_reports (account_key);
