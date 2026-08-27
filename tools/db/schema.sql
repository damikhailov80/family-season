-- Схема базы. Идемпотентна: гоняется столько раз, сколько нужно.
--
-- Таблицы пользователей здесь намеренно нет. Ключ — непрозрачная строка
-- «провайдер:идентификатор» из сессии; ни имени, ни почты сайт не хранит.
-- См. разделы «Настройки и база» и «Библиотека» в CLAUDE.md.
--
-- В `favorites` и `seasons` лежит **адрес постера**, а не разобранный бланк:
-- ровно та строка, что стоит в адресной строке браузера. Формат по-прежнему
-- знает один `src/model/codec.ts`, второй копии состояния не появляется.

create table if not exists user_settings (
  -- 'google:1234567890' — постоянный идентификатор аккаунта у провайдера.
  account_key text primary key,
  -- Состав семьи для новых постеров: ['dad','mom','son'], от 2 до 5 элементов.
  family      jsonb       not null,
  updated_at  timestamptz not null default now()
);

-- Закладки: чужие и свои постеры, отложенные как идея на будущее.
create table if not exists favorites (
  id          uuid        primary key default gen_random_uuid(),
  account_key text        not null,
  -- Относительный адрес постера целиком: '/sheet#d=…&p=…&i=…&data=demo-1'.
  -- Относительный, а не абсолютный: строка, снятая на localhost, обязана
  -- открываться на проде.
  url         text        not null,
  -- Название для поиска по списку; выводится из бланка при добавлении.
  title       text        not null,
  created_at  timestamptz not null default now()
);

create index if not exists favorites_owner on favorites (account_key, created_at desc);

-- Свои сохранённые сезоны: форк или собранный с нуля постер под своим именем.
create table if not exists seasons (
  id          uuid        primary key default gen_random_uuid(),
  account_key text        not null,
  url         text        not null,
  -- Название правит человек. Одинаковые имена допустимы: сезоны различаются
  -- временем сохранения, по нему же список и сортируется по умолчанию.
  title       text        not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists seasons_owner on seasons (account_key, updated_at desc);
