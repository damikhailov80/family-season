-- Согласие на аналитику.

alter table user_settings add column if not exists consent         text;
alter table user_settings add column if not exists consent_version int;
alter table user_settings add column if not exists consent_at      timestamptz;
