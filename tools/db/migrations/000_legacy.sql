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

-- Витрина «Идеи сообщества»: какие из своих сохранённых сезонов человек выложил.
--
-- Ни адреса, ни названия здесь нет, и это главное в таблице: публикация — не
-- копия сезона, а **указатель на строку `seasons`**. Адрес и имя берутся оттуда,
-- поэтому переименование в кабинете видно на витрине сразу, а удаление сезона
-- уносит публикацию каскадом. Колонки `url`/`title` рядом были бы той самой
-- второй копией, которая однажды разойдётся с постером.
--
-- Первые внешние ключи в проекте, и это осознанно: лайк и жалоба без публикации
-- бессмысленны, а публикация без сезона — тем более.
create table if not exists shared_seasons (
  id          uuid        primary key default gen_random_uuid(),
  season_id   uuid        not null unique references seasons (id) on delete cascade,
  -- Владелец продублирован из `seasons` ради предела в сто строк и проверки
  -- «своё или чужое»: это ключ, а не содержимое, и расходиться ему не с чем.
  account_key text        not null,
  created_at  timestamptz not null default now()
);

create index if not exists shared_owner on shared_seasons (account_key, created_at desc);

-- Лайк: строка на пару «публикация + аккаунт». Счётчика рядом не держим —
-- число выводится через count(), а вторая копия числа разошлась бы с рядами.
-- Первичный ключ по паре и есть правило «один человек — один лайк».
create table if not exists shared_likes (
  shared_id   uuid        not null references shared_seasons (id) on delete cascade,
  account_key text        not null,
  created_at  timestamptz not null default now(),
  primary key (shared_id, account_key)
);

-- Жалоба: одна на пару «публикация + аккаунт», с обязательным комментарием —
-- без слов она бесполезна тому, кто будет разбираться.
create table if not exists shared_reports (
  shared_id   uuid        not null references shared_seasons (id) on delete cascade,
  account_key text        not null,
  comment     text        not null,
  created_at  timestamptz not null default now(),
  primary key (shared_id, account_key)
);

-- Предел «сто жалоб на аккаунт» считается по автору, а не по публикации.
create index if not exists shared_reports_author on shared_reports (account_key);
